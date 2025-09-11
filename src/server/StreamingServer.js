const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const axios = require('axios');

class StreamingServer {
  constructor(app, roomManager) {
    this.app = app;
    this.roomManager = roomManager;
    this.activeStreams = new Map();
    this.setupRoutes();
  }

  setupRoutes() {
    // Stream video endpoint
    this.app.get('/stream/:roomId/video', (req, res) => {
      const room = this.roomManager.room;
      
      if (!room || room.id !== req.params.roomId) {
        return res.status(404).send('Room not found');
      }

      const videoPath = room.videoState?.localPath;
      if (!videoPath || !fs.existsSync(videoPath)) {
        return res.status(404).send('Video not found');
      }

      const stat = fs.statSync(videoPath);
      const fileSize = stat.size;
      const range = req.headers.range;

      if (range) {
        // Support for video seeking
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(videoPath, { start, end });
        
        const head = {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': 'video/mp4',
          'Cache-Control': 'no-cache',
        };

        res.writeHead(206, head);
        file.pipe(res);
      } else {
        const head = {
          'Content-Length': fileSize,
          'Content-Type': 'video/mp4',
          'Cache-Control': 'no-cache',
        };
        res.writeHead(200, head);
        fs.createReadStream(videoPath).pipe(res);
      }
    });

    // HLS/DASH manifest for adaptive streaming
    this.app.get('/stream/:roomId/manifest.m3u8', (req, res) => {
      const room = this.roomManager.room;
      
      if (!room || room.id !== req.params.roomId) {
        return res.status(404).send('Room not found');
      }

      // Generate HLS manifest for different qualities
      const manifest = this.generateHLSManifest(room);
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.send(manifest);
    });

    // Quality-specific segments
    this.app.get('/stream/:roomId/:quality/:segment', (req, res) => {
      const room = this.roomManager.room;
      
      if (!room || room.id !== req.params.roomId) {
        return res.status(404).send('Room not found');
      }

      // Serve transcoded segments
      this.serveSegment(req.params.quality, req.params.segment, res);
    });
  }

  // Process YouTube/platform URLs with yt-dlp
  async processWithYtDlp(url, roomId) {
    return new Promise((resolve, reject) => {
      const args = [
        '-f', 'best[height<=1080]', // Limit to 1080p max
        '--get-url',                 // Get direct URL
        '--get-title',                // Get title
        '--get-duration',             // Get duration
        '--get-thumbnail',            // Get thumbnail
        '--no-playlist',              // Don't download playlists
        url
      ];

      const ytdlp = spawn('yt-dlp', args);
      let output = '';
      let errorOutput = '';

      ytdlp.stdout.on('data', (data) => {
        output += data.toString();
      });

      ytdlp.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      ytdlp.on('error', (error) => {
        console.error('yt-dlp not found:', error);
        reject(new Error('yt-dlp is not installed. Please install it to stream from YouTube/platforms.'));
      });

      ytdlp.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Failed to process URL: ${errorOutput}`));
          return;
        }

        const lines = output.trim().split('\n');
        const result = {
          url: lines[0] || null,
          title: lines[1] || 'Unknown',
          duration: parseInt(lines[2]) || 0,
          thumbnail: lines[3] || null,
          streamUrl: null,
          qualities: []
        };

        // Get available qualities
        this.getAvailableQualities(url).then(qualities => {
          result.qualities = qualities;
          result.streamUrl = result.url; // Use direct URL for streaming
          resolve(result);
        }).catch(() => {
          // Fallback to single quality
          result.streamUrl = result.url;
          resolve(result);
        });
      });
    });
  }

  // Get available video qualities
  async getAvailableQualities(url) {
    return new Promise((resolve, reject) => {
      const args = [
        '-F',           // List formats
        '--no-playlist',
        url
      ];

      const ytdlp = spawn('yt-dlp', args);
      let output = '';

      ytdlp.stdout.on('data', (data) => {
        output += data.toString();
      });

      ytdlp.on('close', (code) => {
        if (code !== 0) {
          resolve([]);
          return;
        }

        // Parse format list
        const qualities = [];
        const lines = output.split('\n');
        
        lines.forEach(line => {
          // Match lines with video formats
          const match = line.match(/(\d+)\s+(\w+)\s+(\d+x\d+)\s+(\d+)fps/);
          if (match) {
            qualities.push({
              id: match[1],
              format: match[2],
              resolution: match[3],
              fps: match[4],
              label: `${match[3].split('x')[1]}p${match[4] !== '30' ? match[4] : ''}`
            });
          }
        });

        // Sort by resolution
        qualities.sort((a, b) => {
          const aHeight = parseInt(a.resolution.split('x')[1]);
          const bHeight = parseInt(b.resolution.split('x')[1]);
          return bHeight - aHeight;
        });

        resolve(qualities);
      });
    });
  }

  // Generate HLS manifest for adaptive streaming
  generateHLSManifest(room) {
    const qualities = room.videoState?.qualities || [];
    
    if (qualities.length === 0) {
      // Fallback to single stream
      return `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:10
#EXT-X-MEDIA-SEQUENCE:0
#EXTINF:10.0,
/stream/${room.id}/video
#EXT-X-ENDLIST`;
    }

    // Master playlist with multiple qualities
    let manifest = '#EXTM3U\n';
    
    qualities.forEach(quality => {
      const bandwidth = this.calculateBandwidth(quality.resolution);
      manifest += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${quality.resolution}\n`;
      manifest += `/stream/${room.id}/${quality.id}/playlist.m3u8\n`;
    });

    return manifest;
  }

  calculateBandwidth(resolution) {
    const [width, height] = resolution.split('x').map(Number);
    // Rough bandwidth calculation
    const pixels = width * height;
    const baseBitrate = pixels * 0.05; // 0.05 bits per pixel
    return Math.floor(baseBitrate);
  }

  // Transcode video on-the-fly for different qualities
  async transcodeToQuality(videoPath, quality, outputPath) {
    return new Promise((resolve, reject) => {
      const resolution = this.getResolutionForQuality(quality);
      
      const args = [
        '-i', videoPath,
        '-vf', `scale=${resolution}`,
        '-c:v', 'libx264',
        '-preset', 'veryfast',
        '-crf', '23',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-f', 'mp4',
        '-movflags', 'frag_keyframe+empty_moov',
        outputPath
      ];

      const ffmpeg = spawn('ffmpeg', args);
      
      ffmpeg.on('error', (error) => {
        console.error('FFmpeg error:', error);
        reject(new Error('FFmpeg not available for transcoding'));
      });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve(outputPath);
        } else {
          reject(new Error('Transcoding failed'));
        }
      });
    });
  }

  getResolutionForQuality(quality) {
    const resolutions = {
      '360p': '640:360',
      '480p': '854:480',
      '720p': '1280:720',
      '1080p': '1920:1080',
      '1440p': '2560:1440',
      '2160p': '3840:2160'
    };
    return resolutions[quality] || '1280:720';
  }

  // Preload video chunks for smooth playback
  preloadVideo(videoUrl, roomId) {
    if (!this.activeStreams.has(roomId)) {
      this.activeStreams.set(roomId, {
        buffer: [],
        currentChunk: 0,
        isPreloading: false
      });
    }

    const stream = this.activeStreams.get(roomId);
    
    if (!stream.isPreloading) {
      stream.isPreloading = true;
      this.startPreloading(videoUrl, stream);
    }
  }

  async startPreloading(videoUrl, stream) {
    try {
      // Preload first 10MB of video
      const response = await axios.get(videoUrl, {
        headers: {
          'Range': 'bytes=0-10485760' // 10MB
        },
        responseType: 'arraybuffer'
      });

      stream.buffer.push(response.data);
      stream.isPreloading = false;
    } catch (error) {
      console.error('Preloading error:', error);
      stream.isPreloading = false;
    }
  }

  serveSegment(quality, segment, res) {
    // Implementation for serving specific quality segments
    // This would involve transcoding and caching
    res.status(501).send('Not implemented yet');
  }
}

module.exports = StreamingServer;
