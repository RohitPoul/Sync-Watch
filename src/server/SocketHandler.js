const { v4: uuidv4 } = require("uuid");
const os = require("os");
const { spawn } = require("child_process");

class SocketHandler {
  constructor(io, roomManager, port = 5000) {
    this.io = io;
    this.roomManager = roomManager;
    this.port = port;
  }

  setupListeners() {
    this.io.on("connection", (socket) => {
      console.log(`User connected: ${socket.id}`);

      socket.on("create-room", (data) => {
        console.log(`Received create-room from ${socket.id}:`, data);
        this.handleCreateRoom(socket, data);
      });
      
      socket.on("join-room", (data) => {
        console.log(`Received join-room from ${socket.id}:`, data);
        this.handleJoinRoom(socket, data);
      });
      
      socket.on("load-video", (data) => {
        console.log(`Received load-video from ${socket.id}:`, data);
        this.handleLoadVideo(socket, data);
      });
      
      socket.on("clear-video", () => {
        console.log(`Received clear-video from ${socket.id}`);
        this.handleClearVideo(socket);
      });
      
      socket.on("video-control", (data) => this.handleVideoControl(socket, data));
      socket.on("chat-message", (data) => this.handleChatMessage(socket, data));
      socket.on("typing", (data) => this.handleTyping(socket, data));
      socket.on("disconnect", () => this.handleDisconnect(socket));
    });
  }

  handleCreateRoom(socket, data) {
    console.log('handleCreateRoom called with:', data);
    try {
      const room = this.roomManager.createRoom(data);
      console.log('Room created:', room);
      
      const user = this.roomManager.addUser(socket.id, { name: data.username });
      console.log('User added:', user);

      socket.join(room.id);
      console.log(`Socket ${socket.id} joined room ${room.id}`);

      const localIp = this.getLocalIpAddress();
      const port = this.port;

      const responseData = {
        roomId: room.id,
        roomName: room.name,
        isAdmin: user.isAdmin,
        maxUsers: room.maxUsers,
        serverIp: localIp,
        serverPort: port,
        shareableUrl: `syncstream://${localIp}:${port}/join/${room.id}`,
        webUrl: `http://${localIp}:${port}/?join=${room.id}`,
        users: this.roomManager.getUsers(),
        qualitySettings: room.qualitySettings,
        streamingConfig: room.streamingConfig,
      };
      
      console.log('Sending room-created event:', responseData);
      socket.emit("room-created", responseData);

      console.log(`Room ${room.id} created successfully`);
    } catch (error) {
      console.error("Create room error:", error);
      socket.emit("error", "Failed to create room");
    }
  }

  handleJoinRoom(socket, data) {
    try {
      if (!this.roomManager.room) {
        socket.emit("error", "Room not found");
        return;
      }

      const room = this.roomManager.room;

      if (room.privacy === "private" && room.password !== data.password) {
        socket.emit("error", "Wrong password");
        return;
      }

      if (room.users.size >= room.maxUsers) {
        socket.emit("error", "Room is full");
        return;
      }

      const user = this.roomManager.addUser(socket.id, { name: data.username });
      socket.join(room.id);

      const users = this.roomManager.getUsers();

      socket.emit("room-joined", {
        roomId: room.id,
        roomName: room.name,
        isAdmin: user.isAdmin,
        videoState: room.videoState,
        users: users,
        qualitySettings: room.qualitySettings,
        streamingConfig: room.streamingConfig,
      });

      socket.to(room.id).emit("user-joined", {
        user: user,
        users: users,
      });
    } catch (error) {
      console.error("Join room error:", error);
      socket.emit("error", "Failed to join room");
    }
  }

  handleClearVideo(socket) {
    try {
      const room = this.roomManager.room;
      if (!room || room.admin !== socket.id) {
        socket.emit("error", "Only admin can clear videos");
        return;
      }

      // Clear video state
      this.roomManager.updateVideoState(null);
      
      // Notify all users
      this.io.to(room.id).emit("video-cleared");

      console.log(`Video cleared by admin ${socket.id}`);
    } catch (error) {
      console.error("Clear video error:", error);
      socket.emit("error", "Failed to clear video");
    }
  }

  handleLoadVideo(socket, data) {
    try {
      const room = this.roomManager.room;
      if (!room || room.admin !== socket.id) {
        socket.emit("error", "Only admin can load videos");
        return;
      }

      // Check if it's a platform URL that needs yt-dlp
      if (data.usesYtDlp || data.type === 'platform') {
        socket.emit("processing-video", { message: "Fetching video information..." });
        this.processWithYtDlp(socket, room, data);
      } else if (data.type === 'file' && data.url.startsWith('/') || data.url.startsWith('C:')) {
        // Local file - need to stream it
        const videoState = {
          videoUrl: `/stream/${room.id}/video`, // Stream URL instead of file path
          localPath: data.url, // Store original path for server
          videoType: "stream",
          currentTime: 0,
          isPlaying: false,
          title: data.title || "Video",
        };

        this.roomManager.updateVideoState(videoState);
        this.io.to(room.id).emit("video-loaded", { videoState });

        console.log(`Video streaming enabled: ${data.title}`);
      } else {
        // Direct URL or blob
        const videoState = {
          videoUrl: data.url,
          videoType: data.type || "url",
          currentTime: 0,
          isPlaying: false,
          title: data.title || "Video",
        };

        this.roomManager.updateVideoState(videoState);
        this.io.to(room.id).emit("video-loaded", { videoState });

        console.log(`Video loaded: ${data.title}`);
      }
    } catch (error) {
      socket.emit("error", "Failed to load video");
    }
  }

  processWithYtDlp(socket, room, data) {
    const url = data.url;
    console.log(`Processing URL with yt-dlp: ${url}`);
    
    // Try yt-dlp first, fallback to youtube-dl
    const commands = ['yt-dlp', 'youtube-dl'];
    let commandIndex = 0;
    
    const tryCommand = () => {
      if (commandIndex >= commands.length) {
        socket.emit("error", "yt-dlp is not installed. Please install yt-dlp to stream from platforms.");
        console.error("yt-dlp and youtube-dl not found");
        return;
      }
      
      const cmd = commands[commandIndex];
      const args = [
        '-j',  // Output JSON
        '--no-playlist',  // Don't download playlists
        '--no-warnings',
        url
      ];
      
      console.log(`Trying command: ${cmd} ${args.join(' ')}`);
      const ytdlp = spawn(cmd, args);
      
      let jsonOutput = '';
      let errorOutput = '';
      
      ytdlp.stdout.on('data', (data) => {
        jsonOutput += data.toString();
      });
      
      ytdlp.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      ytdlp.on('error', (error) => {
        console.log(`${cmd} not found, trying next...`);
        commandIndex++;
        tryCommand();
      });
      
      ytdlp.on('close', (code) => {
        if (code !== 0) {
          console.error(`${cmd} error:`, errorOutput);
          
          // Try next command
          if (commandIndex < commands.length - 1) {
            commandIndex++;
            tryCommand();
          } else {
            socket.emit("error", `Failed to fetch video: ${errorOutput || 'Unknown error'}`);
          }
          return;
        }
        
        try {
          const videoInfo = JSON.parse(jsonOutput);
          console.log('Video info retrieved:', videoInfo.title);
          
          // Get best format URL
          let streamUrl = videoInfo.url || videoInfo.webpage_url;
          
          // Try to find best format with video and audio
          if (videoInfo.formats) {
            const formats = videoInfo.formats;
            
            // Find best format with both video and audio
            let bestFormat = formats.find(f => 
              f.vcodec !== 'none' && 
              f.acodec !== 'none' && 
              f.ext === 'mp4'
            );
            
            // Fallback to any format with video
            if (!bestFormat) {
              bestFormat = formats.find(f => f.vcodec !== 'none');
            }
            
            if (bestFormat && bestFormat.url) {
              streamUrl = bestFormat.url;
            }
          }
          
          // Update video state with stream URL
          const videoState = {
            videoUrl: streamUrl,
            videoType: 'stream',
            originalUrl: url,
            currentTime: 0,
            isPlaying: false,
            title: videoInfo.title || data.title || "Video",
            duration: videoInfo.duration,
            thumbnail: videoInfo.thumbnail,
            uploader: videoInfo.uploader,
            description: videoInfo.description
          };
          
          this.roomManager.updateVideoState(videoState);
          this.io.to(room.id).emit("video-loaded", { videoState });
          
          console.log(`Platform video loaded: ${videoInfo.title}`);
          socket.emit("video-processed", { 
            message: "Video loaded successfully",
            title: videoInfo.title 
          });
          
        } catch (error) {
          console.error('Failed to parse video info:', error);
          socket.emit("error", "Failed to process video information");
        }
      });
    };
    
    tryCommand();
  }

  handleVideoControl(socket, data) {
    const room = this.roomManager.room;
    if (!room || room.admin !== socket.id) return;

    this.roomManager.updateVideoState(data);
    socket.to(room.id).emit("video-control", data);

    if (data.isPlaying !== undefined) {
      console.log(`Video ${data.isPlaying ? "played" : "paused"}`);
    }
  }

  handleChatMessage(socket, data) {
    const room = this.roomManager.room;
    if (!room) return;

    const user = room.users.get(socket.id);
    if (!user) return;

    const message = {
      id: uuidv4(),
      user: user.name,
      message: data.message,
      timestamp: new Date().toISOString(),
      isAdmin: user.isAdmin,
    };

    this.io.to(room.id).emit("chat-message", message);
  }

  handleTyping(socket, data) {
    const room = this.roomManager.room;
    if (!room) return;

    const user = room.users.get(socket.id);
    if (!user) return;

    // Broadcast typing status to other users in the room
    socket.to(room.id).emit("typing", {
      userId: socket.id,
      userName: user.name,
      isTyping: data.isTyping
    });
  }

  handleDisconnect(socket) {
    console.log(`User disconnected: ${socket.id}`);
    if (this.roomManager.room) {
      const result = this.roomManager.removeUser(socket.id);
      const users = this.roomManager.getUsers();

      if (users.length > 0) {
        const notification = { users };
        if (result?.newAdmin) {
          notification.newAdmin = result.newAdmin;
        }

        socket.to(this.roomManager.room.id).emit("user-left", notification);
      }
    }
  }

  getLocalIpAddress() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === "IPv4" && !iface.internal) {
          return iface.address;
        }
      }
    }
    return "127.0.0.1";
  }
}

module.exports = SocketHandler;
