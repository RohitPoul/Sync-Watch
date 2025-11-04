/**
 * Video Controls Component
 * Manages overlay controls with auto-hide functionality, playback controls,
 * volume, seek bar, quality settings, and sync status
 */

export class VideoControls {
  constructor() {
    this.controls = document.querySelector('.video-controls');
    this.videoSection = document.querySelector('.video-section');
    this.video = document.getElementById('main-video');
    
    // Control elements
    this.playPauseBtn = document.getElementById('play-pause-btn');
    this.volumeBtn = document.getElementById('volume-btn');
    this.volumeSlider = document.querySelector('.volume-slider');
    this.seekBar = document.querySelector('.seek-bar');
    this.seekProgress = document.querySelector('.seek-progress');
    this.currentTimeDisplay = document.getElementById('current-time');
    this.durationDisplay = document.getElementById('duration');
    this.qualitySelect = document.querySelector('.quality-select');
    this.fullscreenBtn = document.getElementById('fullscreen-btn');
    
    // Sync status elements
    this.syncStatus = document.getElementById('sync-status');
    this.syncLatency = document.getElementById('sync-latency');
    
    // Auto-hide settings
    this.hideTimeout = null;
    this.hideDelay = 3000; // 3 seconds
    this.isVisible = true;
    this.isSeeking = false;
    
    // Volume state
    this.previousVolume = 1;
    
    // Sync state
    this.syncData = {
      latency: 0,
      status: 'synced', // 'synced', 'syncing', 'desynced'
      lastUpdate: Date.now()
    };
    
    this.init();
  }

  init() {
    if (!this.controls || !this.videoSection) {
      console.warn('Video controls elements not found');
      return;
    }

    this.setupAutoHide();
    this.setupPlayPause();
    this.setupVolume();
    this.setupSeekBar();
    this.setupQuality();
    this.setupFullscreen();
    this.setupSyncStatus();
    this.setupKeyboardShortcuts();

    console.log('✅ Video controls initialized');
  }

  setupAutoHide() {
    // Show controls on mouse move
    this.videoSection.addEventListener('mousemove', () => {
      this.show();
      this.resetHideTimer();
    });

    // Show controls on mouse enter
    this.videoSection.addEventListener('mouseenter', () => {
      this.show();
    });

    // Keep controls visible when hovering over them
    this.controls.addEventListener('mouseenter', () => {
      this.clearHideTimer();
      this.show();
    });

    // Resume auto-hide when leaving controls
    this.controls.addEventListener('mouseleave', () => {
      this.resetHideTimer();
    });

    // Show controls on any interaction
    this.controls.addEventListener('click', () => {
      this.show();
      this.resetHideTimer();
    });

    // Start auto-hide timer
    this.resetHideTimer();
  }

  setupPlayPause() {
    if (!this.playPauseBtn || !this.video) return;

    // Play/Pause button click
    this.playPauseBtn.addEventListener('click', () => {
      this.togglePlayPause();
    });

    // Update button icon when video state changes
    this.video.addEventListener('play', () => {
      this.updatePlayPauseButton(true);
    });

    this.video.addEventListener('pause', () => {
      this.updatePlayPauseButton(false);
    });

    // Click on video to play/pause
    this.video.addEventListener('click', () => {
      this.togglePlayPause();
    });
  }

  setupVolume() {
    if (!this.volumeBtn || !this.volumeSlider || !this.video) return;

    // Volume button click (mute/unmute)
    this.volumeBtn.addEventListener('click', () => {
      this.toggleMute();
    });

    // Volume slider change
    this.volumeSlider.addEventListener('input', (e) => {
      const volume = e.target.value / 100;
      this.setVolume(volume);
    });

    // Update volume icon when video volume changes
    this.video.addEventListener('volumechange', () => {
      this.updateVolumeIcon();
    });

    // Initialize volume
    this.setVolume(1);
  }

  setupSeekBar() {
    if (!this.seekBar || !this.video) return;

    // Update seek bar as video plays
    this.video.addEventListener('timeupdate', () => {
      if (!this.isSeeking) {
        this.updateSeekBar();
      }
    });

    // Update duration display when metadata loads
    this.video.addEventListener('loadedmetadata', () => {
      this.updateDuration();
    });

    // Seek bar input (dragging)
    this.seekBar.addEventListener('input', (e) => {
      this.isSeeking = true;
      const time = (e.target.value / 100) * this.video.duration;
      this.updateCurrentTime(time);
      this.updateSeekProgress(e.target.value);
    });

    // Seek bar change (released)
    this.seekBar.addEventListener('change', (e) => {
      const time = (e.target.value / 100) * this.video.duration;
      this.video.currentTime = time;
      this.isSeeking = false;
    });

    // Show preview on hover (future enhancement)
    this.seekBar.addEventListener('mousemove', (e) => {
      this.showSeekPreview(e);
    });
  }

  setupQuality() {
    if (!this.qualitySelect) return;

    this.qualitySelect.addEventListener('change', (e) => {
      const quality = e.target.value;
      this.changeQuality(quality);
    });
  }

  setupFullscreen() {
    if (!this.fullscreenBtn) return;

    this.fullscreenBtn.addEventListener('click', () => {
      this.toggleFullscreen();
    });

    // Update button when fullscreen state changes
    document.addEventListener('fullscreenchange', () => {
      this.updateFullscreenButton();
    });
  }

  setupSyncStatus() {
    if (!this.syncStatus) return;

    // Click to show detailed sync information
    this.syncStatus.addEventListener('click', () => {
      this.showSyncDetails();
    });

    // Start monitoring sync status
    this.startSyncMonitoring();
  }

  startSyncMonitoring() {
    // Update sync status every second
    setInterval(() => {
      this.updateSyncStatus();
    }, 1000);
  }

  updateSyncStatus() {
    if (!this.syncStatus || !this.syncLatency) return;

    // Update latency display
    this.syncLatency.textContent = `${this.syncData.latency}ms`;

    // Update status indicator based on latency
    const dot = this.syncStatus.querySelector('.sync-status-dot');
    const label = this.syncStatus.querySelector('.sync-status-label');
    
    if (!dot || !label) return;

    if (this.syncData.latency < 50) {
      // Excellent sync
      this.syncStatus.style.background = 'rgba(67, 233, 123, 0.15)';
      this.syncStatus.style.borderColor = 'rgba(67, 233, 123, 0.3)';
      dot.style.background = 'var(--success)';
      label.textContent = 'Synced';
      this.syncData.status = 'synced';
    } else if (this.syncData.latency < 150) {
      // Good sync
      this.syncStatus.style.background = 'rgba(254, 202, 87, 0.15)';
      this.syncStatus.style.borderColor = 'rgba(254, 202, 87, 0.3)';
      dot.style.background = 'var(--warning)';
      label.textContent = 'Syncing';
      this.syncData.status = 'syncing';
    } else {
      // Poor sync
      this.syncStatus.style.background = 'rgba(239, 68, 68, 0.15)';
      this.syncStatus.style.borderColor = 'rgba(239, 68, 68, 0.3)';
      dot.style.background = 'var(--error)';
      label.textContent = 'Desynced';
      this.syncData.status = 'desynced';
    }
  }

  setSyncLatency(latency) {
    this.syncData.latency = latency;
    this.syncData.lastUpdate = Date.now();
    this.updateSyncStatus();
  }

  showSyncDetails() {
    // Create a simple alert with sync details
    // In a full implementation, this would open a modal
    const details = `
Sync Status: ${this.syncData.status.toUpperCase()}
Latency: ${this.syncData.latency}ms
Last Update: ${new Date(this.syncData.lastUpdate).toLocaleTimeString()}

Latency Guide:
• < 50ms: Excellent (Perfect sync)
• 50-150ms: Good (Minor delay)
• > 150ms: Poor (Noticeable delay)
    `.trim();
    
    alert(details);
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          this.togglePlayPause();
          this.show();
          this.resetHideTimer();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          this.seekRelative(-5);
          this.show();
          this.resetHideTimer();
          break;
        case 'ArrowRight':
          e.preventDefault();
          this.seekRelative(5);
          this.show();
          this.resetHideTimer();
          break;
        case 'ArrowUp':
          e.preventDefault();
          this.adjustVolume(0.1);
          this.show();
          this.resetHideTimer();
          break;
        case 'ArrowDown':
          e.preventDefault();
          this.adjustVolume(-0.1);
          this.show();
          this.resetHideTimer();
          break;
        case 'm':
          e.preventDefault();
          this.toggleMute();
          this.show();
          this.resetHideTimer();
          break;
        case 'f':
          e.preventDefault();
          this.toggleFullscreen();
          break;
      }
    });
  }

  // Playback controls
  togglePlayPause() {
    if (!this.video) return;
    
    if (this.video.paused) {
      this.video.play();
    } else {
      this.video.pause();
    }
  }

  updatePlayPauseButton(isPlaying) {
    if (!this.playPauseBtn) return;
    
    const icon = this.playPauseBtn.querySelector('span');
    if (icon) {
      icon.textContent = isPlaying ? '⏸️' : '▶️';
    }
    this.playPauseBtn.title = isPlaying ? 'Pause' : 'Play';
  }

  // Volume controls
  setVolume(volume) {
    if (!this.video) return;
    
    this.video.volume = Math.max(0, Math.min(1, volume));
    if (this.volumeSlider) {
      this.volumeSlider.value = volume * 100;
    }
  }

  adjustVolume(delta) {
    if (!this.video) return;
    
    const newVolume = this.video.volume + delta;
    this.setVolume(newVolume);
  }

  toggleMute() {
    if (!this.video) return;
    
    if (this.video.volume > 0) {
      this.previousVolume = this.video.volume;
      this.setVolume(0);
    } else {
      this.setVolume(this.previousVolume);
    }
  }

  updateVolumeIcon() {
    if (!this.volumeBtn || !this.video) return;
    
    const icon = this.volumeBtn.querySelector('span');
    if (!icon) return;
    
    const volume = this.video.volume;
    if (volume === 0) {
      icon.textContent = '🔇';
      this.volumeBtn.title = 'Unmute';
    } else if (volume < 0.5) {
      icon.textContent = '🔉';
      this.volumeBtn.title = 'Volume';
    } else {
      icon.textContent = '🔊';
      this.volumeBtn.title = 'Volume';
    }
  }

  // Seek controls
  updateSeekBar() {
    if (!this.video || !this.seekBar) return;
    
    const percent = (this.video.currentTime / this.video.duration) * 100;
    this.seekBar.value = percent || 0;
    this.updateSeekProgress(percent);
    this.updateCurrentTime(this.video.currentTime);
  }

  updateSeekProgress(percent) {
    if (!this.seekProgress) return;
    this.seekProgress.style.width = `${percent}%`;
  }

  updateCurrentTime(time) {
    if (!this.currentTimeDisplay) return;
    this.currentTimeDisplay.textContent = this.formatTime(time);
  }

  updateDuration() {
    if (!this.durationDisplay || !this.video) return;
    this.durationDisplay.textContent = this.formatTime(this.video.duration);
  }

  seekRelative(seconds) {
    if (!this.video) return;
    
    const newTime = this.video.currentTime + seconds;
    this.video.currentTime = Math.max(0, Math.min(this.video.duration, newTime));
  }

  showSeekPreview(e) {
    // Future enhancement: show thumbnail preview on hover
    // This would require generating thumbnails or using a sprite sheet
  }

  // Quality controls
  changeQuality(quality) {
    console.log('Quality changed to:', quality);
    // This would need to be integrated with the video source
    // For now, just log the change
  }

  // Fullscreen controls
  toggleFullscreen() {
    if (!this.videoSection) return;
    
    if (!document.fullscreenElement) {
      this.videoSection.requestFullscreen().catch(err => {
        console.error('Error attempting to enable fullscreen:', err);
      });
    } else {
      document.exitFullscreen();
    }
  }

  updateFullscreenButton() {
    if (!this.fullscreenBtn) return;
    
    const icon = this.fullscreenBtn.querySelector('span');
    if (!icon) return;
    
    if (document.fullscreenElement) {
      icon.textContent = '⛶';
      this.fullscreenBtn.title = 'Exit Fullscreen (F)';
    } else {
      icon.textContent = '⛶';
      this.fullscreenBtn.title = 'Fullscreen (F)';
    }
  }

  // Utility functions
  formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  // Auto-hide functionality
  show() {
    if (!this.isVisible) {
      this.controls.classList.remove('hidden');
      this.isVisible = true;
    }
  }

  hide() {
    if (this.isVisible) {
      this.controls.classList.add('hidden');
      this.isVisible = false;
    }
  }

  resetHideTimer() {
    this.clearHideTimer();
    this.hideTimeout = setTimeout(() => {
      this.hide();
    }, this.hideDelay);
  }

  clearHideTimer() {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
  }

  destroy() {
    this.clearHideTimer();
  }
}

export default VideoControls;
