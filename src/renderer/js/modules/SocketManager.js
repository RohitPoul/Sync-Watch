// Socket.io connection management
export class SocketManager {
  constructor(state, ui) {
    this.state = state;
    this.ui = ui;
    this.socket = null;
    this.listeners = new Map();
  }

  connect(serverUrl = null) {
    if (this.socket && this.socket.connected) {
      console.log('Socket already connected');
      return Promise.resolve(this.socket);
    }

    return new Promise((resolve, reject) => {
      try {
        // Determine the server URL
        let socketUrl;
        
        if (serverUrl) {
          // Use provided server URL
          socketUrl = serverUrl;
        } else if (window.location.protocol === 'file:') {
          // For Electron or file:// protocol, use localhost
          socketUrl = 'http://localhost:5000';
        } else {
          // For web browser, use current origin
          socketUrl = window.location.origin;
        }
        
        console.log('Connecting to server:', socketUrl);
        
        this.socket = io(socketUrl, {
          autoConnect: true,
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionAttempts: 5,
          timeout: 20000,
          transports: ['websocket', 'polling'],
        });

        this.setupListeners();
        this.state.socket = this.socket;
        
        // Wait for connection
        this.socket.once('connect', () => {
          console.log('Socket connection established');
          resolve(this.socket);
        });
        
        this.socket.once('connect_error', (error) => {
          console.error('Socket connection error:', error);
          reject(error);
        });
        
        // Timeout after 10 seconds
        setTimeout(() => {
          if (!this.socket.connected) {
            reject(new Error('Connection timeout'));
          }
        }, 10000);
        
        
      } catch (error) {
        console.error('Failed to initialize socket:', error);
        this.ui.showToast('Connection failed: ' + error.message, 'error');
        reject(error);
      }
    });
  }

  setupListeners() {
    // Connection events
    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.ui.showToast('Connected to server', 'success');
      this.trigger('socket-connected');  // Use trigger for internal events
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
      this.ui.showToast('Disconnected from server', 'warning');
    });

    // Room events
    this.socket.on('room-created', (data) => {
      console.log('Received room-created event:', data);
      try {
        this.state.setRoomData(data);
        this.ui.showRoomSuccess(data);
        this.ui.hideLoading();
      } catch (error) {
        console.error('Error handling room-created:', error);
        this.ui.showToast('Error creating room', 'error');
        this.ui.hideLoading();
      }
    });

    this.socket.on('room-joined', (data) => {
      console.log('Received room-joined event:', data);
      try {
        this.state.setRoomData(data);
        this.ui.showPage('room');
        this.ui.showNavbar();
        this.ui.updateRoomUI(data);
        this.ui.hideLoading();
      } catch (error) {
        console.error('Error handling room-joined:', error);
        this.ui.showToast('Error joining room', 'error');
        this.ui.hideLoading();
      }
    });

    this.socket.on('user-joined', (data) => {
      console.log('User joined:', data.user.name);
      this.state.updateUsers(data.users);
      this.ui.updateUsersList(data.users);
      this.ui.showToast(`${data.user.name} joined the room`, 'info');
    });

    this.socket.on('user-left', (data) => {
      this.state.updateUsers(data.users);
      this.ui.updateUsersList(data.users);

      if (data.newAdmin && data.newAdmin.id === this.socket.id) {
        this.state.isAdmin = true;
        this.ui.showAdminControls();
        this.ui.showToast('You are now the admin!', 'info');
      }
    });

    // Video events
    this.socket.on('video-loaded', (data) => {
      console.log('Video loaded:', data.videoState.title);
      this.state.updateVideoState(data.videoState);
      this.ui.loadVideoInPlayer(data.videoState);
      this.ui.showToast(`Video loaded: ${data.videoState.title}`, 'success');
      this.ui.hideLoading();
      
      // Update media manager
      if (window.syncStreamApp) {
        window.syncStreamApp.updateMediaStatus(data.videoState);
      }
    });
    
    this.socket.on('video-cleared', () => {
      console.log('Video cleared by admin');
      const videoElement = document.getElementById('main-video');
      if (videoElement) {
        videoElement.pause();
        videoElement.src = '';
      }
      
      // Update UI
      if (window.syncStreamApp) {
        window.syncStreamApp.updateMediaStatus(null);
      }
      
      // Show placeholder
      const placeholder = document.getElementById('video-placeholder');
      if (placeholder) {
        placeholder.classList.remove('has-media');
        placeholder.style.display = 'flex';
      }
      
      this.ui.showToast('Video removed by admin', 'info');
    });
    
    // Video processing events for yt-dlp
    this.socket.on('processing-video', (data) => {
      console.log('Processing video:', data);
      this.ui.showLoading(data.message || 'Processing video...');
    });
    
    this.socket.on('video-processed', (data) => {
      console.log('Video processed:', data);
      this.ui.showToast(data.message || 'Video loaded successfully', 'success');
      this.ui.hideLoading();
    });

    this.socket.on('video-control', (data) => {
      this.state.updateVideoState(data);
      this.ui.updateVideoControls(data);
    });

    // Chat events
    this.socket.on('chat-message', (data) => {
      this.state.addChatMessage(data);
      this.ui.addChatMessage(data);
    });

    // Error handling
    this.socket.on('error', (message) => {
      console.error('Server error:', message);
      this.ui.showToast('Error: ' + message, 'error');
      this.ui.hideLoading();
    });
    
    // Socket.IO errors
    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      this.ui.showToast('Connection error: ' + error.message, 'error');
    });
    
    this.socket.on('connect_timeout', () => {
      console.error('Socket connection timeout');
      this.ui.showToast('Connection timeout', 'error');
    });
  }

  // Emit to Socket.IO server
  emit(eventName, data) {
    if (this.socket && this.socket.connected) {
      console.log(`Emitting ${eventName}:`, data);
      this.socket.emit(eventName, data);
    } else {
      console.error(`Socket not connected. Cannot emit ${eventName}`);
    }
  }

  // Listen for internal events
  on(eventName, callback) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    this.listeners.get(eventName).push(callback);
  }

  // Trigger internal event listeners
  trigger(eventName, ...args) {
    const callbacks = this.listeners.get(eventName);
    if (callbacks) {
      callbacks.forEach(callback => callback(...args));
    }
  }
  
  // Wait for connection
  waitForConnection() {
    return new Promise((resolve, reject) => {
      if (this.socket && this.socket.connected) {
        resolve();
      } else if (this.socket) {
        this.socket.once('connect', resolve);
        setTimeout(() => reject(new Error('Connection timeout')), 10000);
      } else {
        reject(new Error('Socket not initialized'));
      }
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}
