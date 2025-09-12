// Video playback management
export class VideoManager {
  constructor(state, socket) {
    this.state = state;
    this.socket = socket;
    this.videoElement = null;
    this.init();
  }

  init() {
    this.videoElement = document.getElementById('main-video');
    this.setupVideoControls();
    this.setupKeyboardShortcuts();
    this.setupSubtitleSupport();
    // Don't show help automatically, only on demand
  }

  setupVideoControls() {
    if (!this.videoElement) return;

    // Play/Pause button
    document.getElementById('play-pause-btn')?.addEventListener('click', () => {
      this.togglePlayPause();
    });

    // Volume control
    const volumeSlider = document.querySelector('.volume-slider');
    if (volumeSlider) {
      volumeSlider.addEventListener('input', (e) => {
        this.videoElement.volume = e.target.value / 100;
      });
    }

    // Seek bar
    const seekBar = document.querySelector('.seek-bar');
    if (seekBar) {
      seekBar.addEventListener('input', (e) => {
        const time = (e.target.value / 100) * this.videoElement.duration;
        this.seek(time);
      });
    }

    // Fullscreen
    document.getElementById('fullscreen-btn')?.addEventListener('click', () => {
      this.toggleFullscreen();
    });

    // Subtitle button
    document.getElementById('subtitle-btn')?.addEventListener('click', () => {
      this.toggleSubtitles();
    });

    // Speed button
    document.getElementById('speed-btn')?.addEventListener('click', () => {
      this.showSpeedMenu();
    });

    // Picture-in-Picture button
    document.getElementById('pip-btn')?.addEventListener('click', () => {
      this.togglePictureInPicture();
    });

    // Help button
    document.getElementById('help-btn')?.addEventListener('click', () => {
      this.showControlsHelp();
    });

    // Video element events
    this.videoElement.addEventListener('timeupdate', () => this.updateTimeDisplay());
    this.videoElement.addEventListener('loadedmetadata', () => this.updateDuration());
    this.videoElement.addEventListener('volumechange', () => this.updateVolumeIcon());
  }

  togglePlayPause() {
    if (!this.state.isAdmin) return;

    const isPlaying = !this.videoElement.paused;
    this.socket.emit('video-control', { 
      isPlaying: !isPlaying,
      currentTime: this.videoElement.currentTime 
    });

    if (isPlaying) {
      this.videoElement.pause();
    } else {
      this.videoElement.play();
    }
  }

  seek(time) {
    if (!this.state.isAdmin) return;

    this.videoElement.currentTime = time;
    this.socket.emit('video-control', { 
      currentTime: time 
    });
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      this.videoElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  updateTimeDisplay() {
    const currentTime = this.formatTime(this.videoElement.currentTime);
    const duration = this.formatTime(this.videoElement.duration);
    
    document.getElementById('current-time').textContent = currentTime;
    document.getElementById('duration').textContent = duration;

    // Update seek bar
    const seekBar = document.querySelector('.seek-bar');
    if (seekBar && this.videoElement.duration) {
      const percentage = (this.videoElement.currentTime / this.videoElement.duration) * 100;
      seekBar.value = percentage;
      
      // Update progress bar
      const progress = document.querySelector('.seek-progress');
      if (progress) progress.style.width = `${percentage}%`;
    }
  }

  updateDuration() {
    const duration = this.formatTime(this.videoElement.duration);
    document.getElementById('duration').textContent = duration;
  }

  formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  loadVideo() {
    if (!this.state.isAdmin) return;

    if (this.state.isElectron && this.state.electronAPI) {
      this.state.electronAPI.selectVideoFile().then((result) => {
        if (!result.canceled && result.filePaths.length > 0) {
          const filePath = result.filePaths[0];
          const fileName = filePath.split(/[\\/]/).pop();
          
          this.socket.emit('load-video', {
            url: filePath,
            type: 'file',
            title: fileName,
          });
        }
      });
    } else {
      // Web browser file selection
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'video/*';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const url = URL.createObjectURL(file);
          this.socket.emit('load-video', {
            url: url,
            type: 'blob',
            title: file.name,
          });
        }
      };
      input.click();
    }
  }

  loadFromUrl() {
    if (!this.state.isAdmin) return;

    // Show modal for URL input
    this.showUrlModal();
  }

  showUrlModal() {
    const modal = document.getElementById('modal-overlay');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const modalFooter = document.getElementById('modal-footer');
    
    if (!modal) return;
    
    modalTitle.textContent = 'Load Video from URL';
    
    modalBody.innerHTML = `
      <div class="url-modal-content">
        <div class="modal-section">
          <h4>Enter Video URL</h4>
          <p style="color: var(--text-secondary); font-size: var(--font-sm); margin-bottom: var(--space-md);">
            Supports YouTube, Vimeo, Twitch, and direct video links
          </p>
          <input 
            type="url" 
            id="video-url-input" 
            placeholder="https://www.youtube.com/watch?v=..." 
            style="width: 100%; padding: var(--space-md); background: var(--bg-input); border: 2px solid var(--glass-border); border-radius: var(--radius); color: var(--text-primary); font-size: var(--font-base);"
          />
        </div>
        
        <div class="modal-section" style="margin-top: var(--space-xl);">
          <h4>Supported Platforms</h4>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-sm); margin-top: var(--space-md);">
            <div style="padding: var(--space-sm); background: var(--glass); border-radius: var(--radius); display: flex; align-items: center; gap: var(--space-sm);">
              <span>🎬</span> YouTube
            </div>
            <div style="padding: var(--space-sm); background: var(--glass); border-radius: var(--radius); display: flex; align-items: center; gap: var(--space-sm);">
              <span>📹</span> Vimeo
            </div>
            <div style="padding: var(--space-sm); background: var(--glass); border-radius: var(--radius); display: flex; align-items: center; gap: var(--space-sm);">
              <span>🎮</span> Twitch
            </div>
            <div style="padding: var(--space-sm); background: var(--glass); border-radius: var(--radius); display: flex; align-items: center; gap: var(--space-sm);">
              <span>🌐</span> Direct URLs
            </div>
          </div>
        </div>
        
        <div class="modal-section" style="margin-top: var(--space-lg);">
          <div style="padding: var(--space-md); background: var(--glass); border-radius: var(--radius); border: 1px solid var(--primary); color: var(--text-secondary); font-size: var(--font-sm);">
            <strong>💡 Tip:</strong> For best results with YouTube, the video should be publicly available and not age-restricted.
          </div>
        </div>
      </div>
    `;
    
    modalFooter.innerHTML = `
      <button class="btn btn-secondary" id="modal-cancel">Cancel</button>
      <button class="btn btn-primary" id="modal-load-url">
        <span>🌐</span> Load Video
      </button>
    `;
    
    modal.classList.add('active');
    
    // Focus input
    setTimeout(() => {
      const input = document.getElementById('video-url-input');
      if (input) input.focus();
    }, 100);
    
    // Handle modal actions
    const closeModal = () => {
      modal.classList.remove('active');
    };
    
    document.getElementById('modal-close').onclick = closeModal;
    document.getElementById('modal-cancel').onclick = closeModal;
    
    document.getElementById('modal-load-url').onclick = () => {
      const urlInput = document.getElementById('video-url-input');
      const url = urlInput?.value?.trim();
      
      if (url) {
        this.processVideoUrl(url);
        closeModal();
      } else {
        // Show error
        urlInput.style.borderColor = 'var(--error)';
        urlInput.placeholder = 'Please enter a valid URL';
      }
    };
    
    // Allow Enter key to submit
    document.getElementById('video-url-input').onkeypress = (e) => {
      if (e.key === 'Enter') {
        document.getElementById('modal-load-url').click();
      }
    };
  }

  processVideoUrl(url) {
    // Show loading
    const ui = this.state.ui || window.syncStreamApp?.ui;
    if (ui) {
      ui.showLoading('Processing video URL...');
    }
    
    // Determine if it's a platform URL or direct video
    const isPlatformUrl = this.isPlatformUrl(url);
    
    this.socket.emit('load-video', {
      url: url,
      type: isPlatformUrl ? 'platform' : 'url',
      title: this.extractTitle(url),
      usesYtDlp: isPlatformUrl
    });
    
    // Hide loading after a delay
    setTimeout(() => {
      if (ui) ui.hideLoading();
    }, 2000);
  }

  isPlatformUrl(url) {
    const platforms = [
      'youtube.com', 'youtu.be',
      'vimeo.com',
      'twitch.tv',
      'dailymotion.com',
      'facebook.com',
      'twitter.com',
      'tiktok.com'
    ];
    
    try {
      const urlObj = new URL(url);
      return platforms.some(platform => urlObj.hostname.includes(platform));
    } catch {
      return false;
    }
  }

  extractTitle(url) {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.replace('www.', '');
      
      // Try to extract video ID for YouTube
      if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
        const videoId = urlObj.searchParams.get('v') || urlObj.pathname.slice(1);
        return `YouTube Video ${videoId ? `(${videoId})` : ''}`;
      }
      
      return hostname;
    } catch {
      return 'Video';
    }
  }

  setupKeyboardShortcuts() {
    // Remove any existing listeners
    if (this.keyHandler) {
      document.removeEventListener('keydown', this.keyHandler);
    }
    
    this.keyHandler = (e) => {
      // Only handle shortcuts when video is loaded and not typing in input
      if (!this.videoElement.src || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }
      
      // Prevent default for handled keys
      const preventDefault = () => {
        e.preventDefault();
        e.stopPropagation();
      };
      
      switch(e.key.toLowerCase()) {
        // Play/Pause
        case ' ':
        case 'k':
          preventDefault();
          this.togglePlayPause();
          this.showNotification(this.videoElement.paused ? 'Paused' : 'Playing');
          break;
          
        // Seek backward/forward
        case 'arrowleft':
          preventDefault();
          if (e.shiftKey) {
            this.seekRelative(-60); // 1 minute
            this.showNotification('⏪ -1 minute');
          } else if (e.ctrlKey || e.metaKey) {
            this.seekRelative(-30); // 30 seconds
            this.showNotification('⏪ -30 seconds');
          } else {
            this.seekRelative(-5); // 5 seconds
            this.showNotification('⏪ -5 seconds');
          }
          break;
          
        case 'arrowright':
          preventDefault();
          if (e.shiftKey) {
            this.seekRelative(60); // 1 minute
            this.showNotification('⏩ +1 minute');
          } else if (e.ctrlKey || e.metaKey) {
            this.seekRelative(30); // 30 seconds
            this.showNotification('⏩ +30 seconds');
          } else {
            this.seekRelative(5); // 5 seconds
            this.showNotification('⏩ +5 seconds');
          }
          break;
          
        case 'j':
          preventDefault();
          this.seekRelative(-10);
          this.showNotification('⏪ -10 seconds');
          break;
          
        case 'l':
          preventDefault();
          this.seekRelative(10);
          this.showNotification('⏩ +10 seconds');
          break;
          
        // Volume controls
        case 'arrowup':
          preventDefault();
          this.adjustVolume(0.05);
          this.showNotification(`🔊 Volume: ${Math.round(this.videoElement.volume * 100)}%`);
          break;
          
        case 'arrowdown':
          preventDefault();
          this.adjustVolume(-0.05);
          this.showNotification(`🔊 Volume: ${Math.round(this.videoElement.volume * 100)}%`);
          break;
          
        case 'm':
          preventDefault();
          this.toggleMute();
          this.showNotification(this.videoElement.muted ? '🔇 Muted' : '🔊 Unmuted');
          break;
          
        // Playback speed
        case '-':
        case '_':
          preventDefault();
          this.adjustPlaybackSpeed(-0.25);
          this.showNotification(`⚡ Speed: ${this.videoElement.playbackRate}x`);
          break;
          
        case '=':
        case '+':
          preventDefault();
          this.adjustPlaybackSpeed(0.25);
          this.showNotification(`⚡ Speed: ${this.videoElement.playbackRate}x`);
          break;
          
        // Reset speed
        case '0':
          preventDefault();
          this.videoElement.playbackRate = 1;
          this.showNotification('⚡ Speed: Normal');
          break;
          
        // Fullscreen
        case 'f':
          preventDefault();
          this.toggleFullscreen();
          break;
          
        // Picture-in-Picture
        case 'p':
          preventDefault();
          this.togglePictureInPicture();
          break;
          
        // Subtitles
        case 'c':
          preventDefault();
          this.toggleSubtitles();
          break;
          
        // Skip to percentage (1-9 keys)
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          if (!e.shiftKey && !e.ctrlKey && !e.altKey) {
            preventDefault();
            const percentage = parseInt(e.key) * 10;
            this.seekToPercentage(percentage);
            this.showNotification(`📍 ${percentage}%`);
          }
          break;
          
        // Beginning/End
        case 'home':
          preventDefault();
          this.videoElement.currentTime = 0;
          this.showNotification('⏮️ Beginning');
          break;
          
        case 'end':
          preventDefault();
          this.videoElement.currentTime = this.videoElement.duration;
          this.showNotification('⏭️ End');
          break;
          
        // Help
        case '?':
        case 'h':
          if (e.shiftKey || e.key === 'h') {
            preventDefault();
            this.showControlsHelp();
          }
          break;
      }
    };
    
    document.addEventListener('keydown', this.keyHandler);
  }
  
  seekRelative(seconds) {
    if (!this.state.isAdmin) return;
    
    const newTime = Math.max(0, Math.min(
      this.videoElement.currentTime + seconds,
      this.videoElement.duration
    ));
    
    this.seek(newTime);
  }
  
  seekToPercentage(percentage) {
    if (!this.state.isAdmin) return;
    
    const newTime = (this.videoElement.duration * percentage) / 100;
    this.seek(newTime);
  }
  
  adjustVolume(delta) {
    const newVolume = Math.max(0, Math.min(1, this.videoElement.volume + delta));
    this.videoElement.volume = newVolume;
    
    // Update volume slider
    const volumeSlider = document.querySelector('.volume-slider');
    if (volumeSlider) {
      volumeSlider.value = newVolume * 100;
    }
    
    // Update volume button icon
    this.updateVolumeIcon();
  }
  
  toggleMute() {
    this.videoElement.muted = !this.videoElement.muted;
    this.updateVolumeIcon();
  }
  
  updateVolumeIcon() {
    const volumeBtn = document.getElementById('volume-btn');
    if (!volumeBtn) return;
    
    if (this.videoElement.muted || this.videoElement.volume === 0) {
      volumeBtn.innerHTML = '<span>🔇</span>';
    } else if (this.videoElement.volume < 0.5) {
      volumeBtn.innerHTML = '<span>🔉</span>';
    } else {
      volumeBtn.innerHTML = '<span>🔊</span>';
    }
  }
  
  adjustPlaybackSpeed(delta) {
    const speeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3];
    const currentIndex = speeds.findIndex(s => s === this.videoElement.playbackRate);
    const newIndex = Math.max(0, Math.min(speeds.length - 1, currentIndex + (delta > 0 ? 1 : -1)));
    this.videoElement.playbackRate = speeds[newIndex];
  }
  
  async togglePictureInPicture() {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        this.showNotification('📺 Exited Picture-in-Picture');
      } else if (document.pictureInPictureEnabled) {
        await this.videoElement.requestPictureInPicture();
        this.showNotification('📺 Picture-in-Picture');
      }
    } catch (error) {
      console.error('PiP error:', error);
    }
  }
  
  setupSubtitleSupport() {
    // Add subtitle track support
    const subtitleInput = document.createElement('input');
    subtitleInput.type = 'file';
    subtitleInput.accept = '.vtt,.srt,.ass,.ssa';
    subtitleInput.style.display = 'none';
    subtitleInput.id = 'subtitle-input';
    document.body.appendChild(subtitleInput);
    
    subtitleInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.loadSubtitle(file);
      }
    });
  }
  
  loadSubtitle(file) {
    const url = URL.createObjectURL(file);
    
    // Remove existing tracks
    const tracks = this.videoElement.querySelectorAll('track');
    tracks.forEach(track => track.remove());
    
    // Add new subtitle track
    const track = document.createElement('track');
    track.kind = 'subtitles';
    track.label = file.name;
    track.srclang = 'en';
    track.src = url;
    track.default = true;
    
    this.videoElement.appendChild(track);
    
    // Enable the track
    if (this.videoElement.textTracks.length > 0) {
      this.videoElement.textTracks[0].mode = 'showing';
    }
    
    this.showNotification(`📝 Subtitles loaded: ${file.name}`);
  }
  
  toggleSubtitles() {
    if (this.videoElement.textTracks.length > 0) {
      const track = this.videoElement.textTracks[0];
      if (track.mode === 'showing') {
        track.mode = 'hidden';
        this.showNotification('📝 Subtitles OFF');
      } else {
        track.mode = 'showing';
        this.showNotification('📝 Subtitles ON');
      }
    } else {
      // No subtitles loaded, prompt to load
      document.getElementById('subtitle-input').click();
    }
  }
  
  showNotification(message) {
    // Remove existing notification
    const existing = document.querySelector('.video-notification');
    if (existing) existing.remove();
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = 'video-notification';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 18px;
      font-weight: 600;
      z-index: 10000;
      pointer-events: none;
      animation: fadeInOut 1.5s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after animation
    setTimeout(() => notification.remove(), 1500);
  }
  
  showSpeedMenu() {
    const speedMenu = document.createElement('div');
    speedMenu.className = 'speed-menu';
    speedMenu.style.cssText = `
      position: absolute;
      bottom: 100px;
      right: 20px;
      background: var(--bg-card);
      border: 1px solid var(--glass-border);
      border-radius: var(--radius);
      padding: var(--space-sm);
      box-shadow: var(--shadow-lg);
      z-index: 1000;
    `;
    
    const speeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
    speeds.forEach(speed => {
      const btn = document.createElement('button');
      btn.textContent = speed === 1 ? 'Normal' : `${speed}x`;
      btn.style.cssText = `
        display: block;
        width: 100%;
        padding: 8px 16px;
        background: ${this.videoElement.playbackRate === speed ? 'var(--primary)' : 'transparent'};
        color: ${this.videoElement.playbackRate === speed ? 'white' : 'var(--text-primary)'};
        border: none;
        border-radius: 4px;
        cursor: pointer;
        text-align: left;
        font-size: 14px;
        margin: 2px 0;
      `;
      btn.onclick = () => {
        this.videoElement.playbackRate = speed;
        this.showNotification(`⚡ Speed: ${speed}x`);
        speedMenu.remove();
      };
      speedMenu.appendChild(btn);
    });
    
    // Remove existing speed menu
    document.querySelector('.speed-menu')?.remove();
    
    // Add to video section
    document.querySelector('.video-section').appendChild(speedMenu);
    
    // Remove on click outside
    setTimeout(() => {
      document.addEventListener('click', function removeMenu(e) {
        if (!speedMenu.contains(e.target) && e.target.id !== 'speed-btn') {
          speedMenu.remove();
          document.removeEventListener('click', removeMenu);
        }
      });
    }, 100);
  }

  showControlsHelp() {
    const helpModal = `
      <div class="controls-help-modal" style="
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: var(--bg-card);
        border: 1px solid var(--glass-border);
        border-radius: var(--radius-xl);
        padding: var(--space-2xl);
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
        z-index: 10001;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      ">
        <h2 style="margin-bottom: var(--space-lg); color: var(--primary);">⌨️ Keyboard Shortcuts</h2>
        <div style="display: grid; gap: var(--space-sm);">
          <div class="shortcut-group">
            <h3 style="color: var(--accent); margin-bottom: var(--space-sm);">Playback</h3>
            <div class="shortcut-item"><kbd>Space</kbd> or <kbd>K</kbd> - Play/Pause</div>
            <div class="shortcut-item"><kbd>←</kbd> - Rewind 5s</div>
            <div class="shortcut-item"><kbd>→</kbd> - Forward 5s</div>
            <div class="shortcut-item"><kbd>J</kbd> - Rewind 10s</div>
            <div class="shortcut-item"><kbd>L</kbd> - Forward 10s</div>
            <div class="shortcut-item"><kbd>Shift + ←/→</kbd> - Skip ±1 minute</div>
            <div class="shortcut-item"><kbd>Ctrl + ←/→</kbd> - Skip ±30 seconds</div>
            <div class="shortcut-item"><kbd>Home</kbd> - Go to beginning</div>
            <div class="shortcut-item"><kbd>End</kbd> - Go to end</div>
            <div class="shortcut-item"><kbd>1-9</kbd> - Jump to 10-90%</div>
          </div>
          <div class="shortcut-group">
            <h3 style="color: var(--accent); margin-bottom: var(--space-sm);">Volume</h3>
            <div class="shortcut-item"><kbd>↑</kbd> - Volume up</div>
            <div class="shortcut-item"><kbd>↓</kbd> - Volume down</div>
            <div class="shortcut-item"><kbd>M</kbd> - Mute/Unmute</div>
          </div>
          <div class="shortcut-group">
            <h3 style="color: var(--accent); margin-bottom: var(--space-sm);">Speed</h3>
            <div class="shortcut-item"><kbd>-</kbd> - Decrease speed</div>
            <div class="shortcut-item"><kbd>+</kbd> - Increase speed</div>
            <div class="shortcut-item"><kbd>0</kbd> - Reset speed</div>
          </div>
          <div class="shortcut-group">
            <h3 style="color: var(--accent); margin-bottom: var(--space-sm);">Display</h3>
            <div class="shortcut-item"><kbd>F</kbd> - Fullscreen</div>
            <div class="shortcut-item"><kbd>P</kbd> - Picture-in-Picture</div>
            <div class="shortcut-item"><kbd>C</kbd> - Toggle subtitles</div>
          </div>
          <div class="shortcut-group">
            <h3 style="color: var(--accent); margin-bottom: var(--space-sm);">Help</h3>
            <div class="shortcut-item"><kbd>H</kbd> or <kbd>?</kbd> - Show this help</div>
          </div>
        </div>
        <button onclick="this.parentElement.remove()" style="
          margin-top: var(--space-xl);
          padding: var(--space-md) var(--space-xl);
          background: var(--primary);
          color: white;
          border: none;
          border-radius: var(--radius);
          cursor: pointer;
          font-weight: 600;
        ">Close</button>
      </div>
    `;
    
    // Remove existing help modal
    const existing = document.querySelector('.controls-help-modal');
    if (existing) {
      existing.remove();
      return;
    }
    
    // Add help modal
    const div = document.createElement('div');
    div.innerHTML = helpModal;
    document.body.appendChild(div.firstElementChild);
  }
}
