// Main application initialization
import { StateManager } from './modules/StateManager.js';
import { SocketManager } from './modules/SocketManager.js';
import { UIManager } from './modules/UIManager.js';
import { VideoManager } from './modules/VideoManager.js';
import { ChatManager } from './modules/ChatManager.js';
import { NetworkMonitor } from './modules/NetworkMonitor.js';
import { Utils } from './modules/Utils.js';
import speedTest from './modules/SpeedTest.js';

class SyncStreamApp {
  constructor() {
    this.state = new StateManager();
    this.ui = new UIManager(this.state);
    this.socket = null;
    this.video = null;
    this.chat = null;
    this.network = null;
    this.utils = new Utils();
  }

  async init() {
    console.log('🎬 SyncStream Pro Initializing...');
    
    // Setup UI event listeners
    this.ui.init();
    
    // Check for Electron environment
    this.checkEnvironment();
    
    // Check for auto-join parameters
    this.checkAutoJoin();
    
    // Initialize event handlers
    this.setupEventHandlers();
    
    console.log('✅ SyncStream Pro Ready');
  }

  checkEnvironment() {
    // Check for Electron with secure API
    this.state.isElectron = window.electronAPI && window.electronAPI.isElectron;
    this.state.electronAPI = window.electronAPI || null;
    
    if (this.state.isElectron) {
      this.setupElectronHandlers();
    }
    
    console.log(`Environment: ${this.state.isElectron ? 'Electron App' : 'Web Browser'}`);
  }

  setupElectronHandlers() {
    if (!this.state.electronAPI) return;
    
    // Use the secure API to listen for auto-join events
    this.state.electronAPI.onAutoJoinRoom((data) => {
      console.log('Auto-join triggered:', data);
      this.ui.showPage('join');
      this.ui.fillJoinForm(data);
    });
  }

  checkAutoJoin() {
    const urlParams = new URLSearchParams(window.location.search);
    const joinRoomId = urlParams.get('join');
    
    if (joinRoomId) {
      this.ui.showPage('join');
      document.querySelector('[name="roomId"]').value = joinRoomId.toUpperCase();
    }
  }

  setupEventHandlers() {
    // Form submissions
    document.getElementById('create-room-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleCreateRoom(e.target);
    });
    
    document.getElementById('join-room-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleJoinRoom(e.target);
    });
    
    // Button clicks
    document.addEventListener('click', (e) => {
      const button = e.target.closest('[data-action]');
      if (button && !button.disabled) {
        this.handleAction(button.dataset.action);
      }
      
      const copyBtn = e.target.closest('[data-copy]');
      if (copyBtn) {
        this.handleCopy(copyBtn.dataset.copy);
      }
      
      const tabBtn = e.target.closest('[data-tab]');
      if (tabBtn) {
        this.ui.switchTab(tabBtn.dataset.tab);
      }
    });
    
    // Chat input
    document.getElementById('send-chat')?.addEventListener('click', () => {
      this.chat?.sendMessage();
    });
    
    document.getElementById('chat-input')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.chat?.sendMessage();
      }
    });

    // Speed Test
    this.setupSpeedTest();
    
    // Media Manager
    this.setupMediaManager();
  }

  setupMediaManager() {
    const clearBtn = document.getElementById('clear-video');
    const historyBtn = document.getElementById('media-history-btn');
    const historyPanel = document.getElementById('media-history');
    
    // Clear/Remove video
    clearBtn?.addEventListener('click', () => {
      if (confirm('Remove current video?')) {
        this.clearVideo();
      }
    });
    
    // Toggle history
    historyBtn?.addEventListener('click', () => {
      const isVisible = historyPanel.style.display !== 'none';
      historyPanel.style.display = isVisible ? 'none' : 'block';
      if (!isVisible) {
        this.loadMediaHistory();
      }
    });
    
    // Load initial history
    this.loadMediaHistory();
  }

  clearVideo() {
    if (!this.state.isAdmin) return;
    
    // Clear video from player
    const videoElement = document.getElementById('main-video');
    if (videoElement) {
      videoElement.pause();
      videoElement.src = '';
    }
    
    // Update UI
    this.updateMediaStatus(null);
    
    // Notify server
    if (this.socket) {
      this.socket.emit('clear-video');
    }
    
    // Show placeholder
    const placeholder = document.getElementById('video-placeholder');
    if (placeholder) {
      placeholder.classList.remove('has-media');
      placeholder.style.display = 'flex';
    }
    
    this.ui.showToast('Video removed', 'info');
  }

  updateMediaStatus(videoData) {
    const statusDot = document.getElementById('media-status-dot');
    const statusText = document.getElementById('media-status-text');
    const currentMediaInfo = document.getElementById('current-media-info');
    const mediaName = document.getElementById('current-media-name');
    const mediaSource = document.getElementById('current-media-source');
    
    if (videoData) {
      // Update status
      statusDot?.classList.add('active');
      statusText.textContent = 'Media Loaded';
      
      // Show current media info
      currentMediaInfo.style.display = 'block';
      mediaName.textContent = videoData.title || 'Untitled';
      
      // Determine source type
      let sourceType = 'Unknown';
      if (videoData.videoType === 'platform' || videoData.originalUrl?.includes('youtube')) {
        sourceType = 'YouTube';
      } else if (videoData.videoType === 'file' || videoData.videoType === 'stream') {
        sourceType = 'Local File';
      } else if (videoData.videoType === 'url') {
        sourceType = 'Direct URL';
      }
      mediaSource.textContent = sourceType;
      
      // Hide placeholder
      const placeholder = document.getElementById('video-placeholder');
      if (placeholder) {
        placeholder.classList.add('has-media');
      }
      
      // Save to history
      this.addToMediaHistory(videoData);
    } else {
      // No media
      statusDot?.classList.remove('active', 'loading');
      statusText.textContent = 'No Media';
      currentMediaInfo.style.display = 'none';
    }
  }

  addToMediaHistory(videoData) {
    let history = JSON.parse(localStorage.getItem('mediaHistory') || '[]');
    
    // Add new entry
    const entry = {
      title: videoData.title || 'Untitled',
      url: videoData.originalUrl || videoData.videoUrl,
      type: videoData.videoType,
      timestamp: new Date().toISOString()
    };
    
    // Remove duplicates
    history = history.filter(h => h.url !== entry.url);
    
    // Add to beginning
    history.unshift(entry);
    
    // Keep only last 10
    if (history.length > 10) {
      history = history.slice(0, 10);
    }
    
    localStorage.setItem('mediaHistory', JSON.stringify(history));
    this.loadMediaHistory();
  }

  loadMediaHistory() {
    const historyList = document.getElementById('media-history-list');
    if (!historyList) return;
    
    const history = JSON.parse(localStorage.getItem('mediaHistory') || '[]');
    
    if (history.length === 0) {
      historyList.innerHTML = '<div class="history-empty">No recent media</div>';
      return;
    }
    
    historyList.innerHTML = history.map((item, index) => {
      const typeIcon = item.type === 'platform' ? '🌐' : '📁';
      return `
        <div class="history-item" data-index="${index}">
          <div class="history-item-info">
            <div class="history-item-title">${typeIcon} ${item.title}</div>
            <div class="history-item-type">${this.getSourceLabel(item.type, item.url)}</div>
          </div>
          <button class="history-item-load" data-url="${item.url}" data-type="${item.type}" data-title="${item.title}">
            Load
          </button>
        </div>
      `;
    }).join('');
    
    // Add click handlers
    historyList.querySelectorAll('.history-item-load').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const url = btn.dataset.url;
        const type = btn.dataset.type;
        const title = btn.dataset.title;
        
        if (this.video) {
          if (type === 'platform' || url.includes('youtube') || url.includes('vimeo')) {
            this.video.processVideoUrl(url);
          } else {
            this.socket.emit('load-video', {
              url: url,
              type: type,
              title: title
            });
          }
          
          // Close history panel
          document.getElementById('media-history').style.display = 'none';
        }
      });
    });
  }

  getSourceLabel(type, url) {
    if (url?.includes('youtube')) return 'YouTube';
    if (url?.includes('vimeo')) return 'Vimeo';
    if (type === 'file' || type === 'stream') return 'Local File';
    if (type === 'url') return 'Direct URL';
    return 'Video';
  }

  setupSpeedTest() {
    const speedTestBtn = document.getElementById('speed-test-btn');
    const modal = document.getElementById('speed-test-modal');
    const closeBtn = document.getElementById('close-speed-test');
    const startBtn = document.getElementById('start-speed-test');
    const shareBtn = document.getElementById('share-results');

    if (!speedTestBtn || !modal) return;

    // Open modal
    speedTestBtn.addEventListener('click', () => {
      modal.style.display = 'block';
      setTimeout(() => modal.classList.add('active'), 10);
    });

    // Close modal
    const closeModal = () => {
      modal.classList.remove('active');
      setTimeout(() => modal.style.display = 'none', 300);
    };

    closeBtn?.addEventListener('click', closeModal);
    modal.querySelector('.modal-overlay')?.addEventListener('click', closeModal);

    // Start speed test
    startBtn?.addEventListener('click', async () => {
      if (speedTest.isRunning) {
        this.ui.showToast('Speed test is already running', 'warning');
        return;
      }

      startBtn.disabled = true;
      startBtn.innerHTML = '<span>⏳</span> Testing...';
      
      // Reset display
      document.getElementById('download-speed').textContent = '--';
      document.getElementById('upload-speed').textContent = '--';
      document.getElementById('ping-value').textContent = '--';
      document.getElementById('jitter-value').textContent = '--';
      document.getElementById('speed-rating').style.display = 'none';
      document.getElementById('speed-comparison').style.display = 'none';
      shareBtn.style.display = 'none';

      try {
        const results = await speedTest.runSpeedTest((message, progress) => {
          document.getElementById('status-message').textContent = message;
          document.getElementById('test-progress').style.width = `${progress}%`;
        });

        // Display results
        document.getElementById('download-speed').textContent = results.download.toFixed(1);
        document.getElementById('upload-speed').textContent = results.upload.toFixed(1);
        document.getElementById('ping-value').textContent = results.ping;
        document.getElementById('jitter-value').textContent = results.jitter;

        // Show rating
        const rating = speedTest.getSpeedRating(results.download);
        const ratingEl = document.getElementById('speed-rating');
        const badgeEl = ratingEl.querySelector('.rating-badge');
        
        document.getElementById('rating-icon').textContent = rating.icon;
        document.getElementById('rating-text').textContent = rating.rating;
        badgeEl.style.borderColor = rating.color;
        badgeEl.style.color = rating.color;
        ratingEl.style.display = 'block';

        // Show streaming recommendation
        const recommendation = speedTest.getStreamingRecommendation(results.download);
        document.getElementById('rec-quality').textContent = recommendation.quality;
        document.getElementById('rec-description').textContent = recommendation.description;

        // Show comparison with current usage if monitoring is active
        if (this.network && this.network.currentStats) {
          const currentUsage = (this.network.currentStats.downloadSpeed || 0) / 1000000; // Convert to Mbps
          const available = results.download - currentUsage;
          const utilization = (currentUsage / results.download) * 100;

          document.getElementById('current-usage').textContent = `${currentUsage.toFixed(1)} Mbps`;
          document.getElementById('available-bandwidth').textContent = `${available.toFixed(1)} Mbps`;
          document.getElementById('network-utilization').textContent = `${utilization.toFixed(1)}%`;
          document.getElementById('speed-comparison').style.display = 'block';
        }

        // Save to history
        this.saveSpeedTestResult(results);
        
        // Show share button
        shareBtn.style.display = 'inline-flex';
        
        this.ui.showToast('Speed test completed!', 'success');
      } catch (error) {
        console.error('Speed test error:', error);
        this.ui.showToast('Speed test failed: ' + error.message, 'error');
      } finally {
        startBtn.disabled = false;
        startBtn.innerHTML = '<span>🚀</span> Start Test';
        document.getElementById('test-progress').style.width = '0%';
      }
    });

    // Share results
    shareBtn?.addEventListener('click', () => {
      if (!speedTest.results) return;
      
      const text = `My Internet Speed Test Results:
⬇️ Download: ${speedTest.formatSpeed(speedTest.results.download)}
⬆️ Upload: ${speedTest.formatSpeed(speedTest.results.upload)}
📍 Ping: ${speedTest.results.ping}ms
📊 Jitter: ${speedTest.results.jitter}ms

Tested with SyncStream Pro 🎬`;
      
      if (navigator.share) {
        navigator.share({
          title: 'Speed Test Results',
          text: text
        });
      } else {
        navigator.clipboard.writeText(text);
        this.ui.showToast('Results copied to clipboard!', 'success');
      }
    });
  }

  saveSpeedTestResult(results) {
    const history = JSON.parse(localStorage.getItem('speedTestHistory') || '[]');
    history.unshift({
      ...results,
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 10 results
    if (history.length > 10) history.pop();
    
    localStorage.setItem('speedTestHistory', JSON.stringify(history));
  }

  async handleCreateRoom(form) {
    this.ui.showLoading('Creating room...');
    
    const formData = new FormData(form);
    
    // Ensure room name is provided and meaningful
    const roomName = formData.get('roomName')?.trim();
    if (!roomName) {
      this.ui.showToast('Please enter a room name', 'error');
      this.ui.hideLoading();
      return;
    }
    
    const roomData = {
      username: formData.get('username'),
      roomName: roomName,
      privacy: formData.get('privacy') || 'private',
      password: formData.get('password') || '',
      maxUsers: parseInt(formData.get('maxUsers')) || 10,
      videoQuality: formData.get('videoQuality') || '1080p60',
    };
    
    console.log('Room data:', roomData);
    
    try {
      let serverUrl = 'http://localhost:5000';
      
      if (this.state.isElectron && this.state.electronAPI) {
        console.log('Starting host mode...');
        const result = await this.state.electronAPI.startHostMode(roomData);
        if (!result.success) throw new Error(result.error);
        if (result.serverInfo) {
          serverUrl = `http://${result.serverInfo.localIp}:${result.serverInfo.port}`;
          console.log('Server URL from Electron:', serverUrl);
        }
      }
      
      // Initialize socket and wait for connection
      await this.initializeSocket(serverUrl);
      
      // Now emit the create-room event
      console.log('Emitting create-room event...');
      this.socket.emit('create-room', roomData);
      
    } catch (error) {
      console.error('Failed to create room:', error);
      this.ui.showToast(`Failed to create room: ${error.message}`, 'error');
      this.ui.hideLoading();
    }
  }

  async handleJoinRoom(form) {
    this.ui.showLoading('Joining room...');
    
    const formData = new FormData(form);
    const joinData = {
      username: formData.get('username'),
      roomId: formData.get('roomId').toUpperCase(),
      password: formData.get('password') || '',
      serverHost: formData.get('serverHost') || 'localhost',
      serverPort: parseInt(formData.get('serverPort')) || 5000,
    };
    
    console.log('Join data:', joinData);
    
    try {
      // Construct server URL from join data
      const serverUrl = `http://${joinData.serverHost}:${joinData.serverPort}`;
      console.log('Joining with server URL:', serverUrl);
      
      if (this.state.isElectron && this.state.electronAPI) {
        const result = await this.state.electronAPI.startClientMode(joinData);
        if (!result.success) throw new Error(result.error);
      }
      
      // Initialize socket and wait for connection
      await this.initializeSocket(serverUrl);
      
      // Now emit the join-room event
      console.log('Emitting join-room event...');
      this.socket.emit('join-room', joinData);
      
    } catch (error) {
      console.error('Failed to join room:', error);
      this.ui.showToast(`Failed to join room: ${error.message}`, 'error');
      this.ui.hideLoading();
    }
  }

  async initializeSocket(serverUrl = null) {
    if (this.socket) {
      console.log('Socket already initialized');
      return this.socket.waitForConnection();
    }
    
    console.log('Initializing socket manager...');
    this.socket = new SocketManager(this.state, this.ui);
    
    // Set up event listener for connection
    this.socket.on('socket-connected', () => {
      console.log('Socket connected, initializing managers...');
      this.video = new VideoManager(this.state, this.socket);
      this.chat = new ChatManager(this.state, this.socket, this.ui);
    });
    
    // Connect and wait for connection
    await this.socket.connect(serverUrl);
    console.log('Socket connection established');
  }

  handleAction(action) {
    const actions = {
      'create-room': () => this.ui.showPage('create'),
      'join-room': () => this.ui.showPage('join'),
      'back-to-welcome': () => this.ui.showPage('welcome'),
      'enter-room': () => this.enterRoom(),
      'leave-room': () => this.leaveRoom(),
      'load-video': () => this.video?.loadVideo(),
      'load-url': () => this.video?.loadFromUrl(),
    };
    
    const handler = actions[action];
    if (handler) handler();
  }

  handleCopy(type) {
    const elements = {
      'room-id': 'room-id-display',
      'app-link': 'app-link',
      'web-link': 'web-link',
    };
    
    const elementId = elements[type];
    if (elementId) {
      const text = document.getElementById(elementId)?.textContent;
      if (text) {
        this.utils.copyToClipboard(text);
        this.ui.showToast('Copied to clipboard!', 'success');
      }
    }
  }

  enterRoom() {
    this.ui.showPage('room');
    this.ui.showNavbar();
    this.ui.updateRoomUI(this.state.roomData);
    
    // Start network monitoring
    if (!this.network) {
      this.network = new NetworkMonitor(this.ui);
    }
    this.network.startMonitoring();
  }

  leaveRoom() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    if (this.network) {
      this.network.stopMonitoring();
    }
    
    if (this.state.isElectron && this.state.electronAPI) {
      this.state.electronAPI.stopServer();
    }
    
    this.state.reset();
    this.ui.hideNavbar();
    this.ui.showPage('welcome');
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new SyncStreamApp();
  app.init();
  
  // Make app globally available for debugging
  window.syncStreamApp = app;
});
