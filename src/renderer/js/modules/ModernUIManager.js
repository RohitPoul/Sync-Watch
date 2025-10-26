// Modern UI Manager - Handles new clean UI interactions
export class ModernUIManager {
  constructor() {
    // Don't initialize immediately, wait for DOM to be ready
  }

  init() {
    this.setupEventListeners();
    this.setupModals();
  }

  setupEventListeners() {
    // Welcome page action cards
    document.querySelectorAll('.action-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const action = e.currentTarget.dataset.action;
        if (action === 'create-room') {
          this.showPage('create');
        } else if (action === 'join-room') {
          this.showPage('join');
        }
      });
    });

    // Quick join functionality
    const quickJoinBtn = document.querySelector('.join-btn');
    const quickCodeInput = document.getElementById('quick-room-code');
    
    if (quickJoinBtn && quickCodeInput) {
      quickJoinBtn.addEventListener('click', () => {
        const code = quickCodeInput.value.trim().toUpperCase();
        if (code.length === 8) {
          this.quickJoinRoom(code);
        } else {
          this.showToast('Please enter a valid 8-character room code', 'error');
        }
      });

      quickCodeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          quickJoinBtn.click();
        }
      });

      // Auto-format room code input
      quickCodeInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
      });
    }

    // Back buttons
    document.querySelectorAll('[data-action="back-to-welcome"]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.showPage('welcome');
      });
    });

    // Form submissions
    const createForm = document.getElementById('create-room-form');
    const joinForm = document.getElementById('join-room-form');

    if (createForm) {
      createForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleCreateRoom(new FormData(createForm));
      });
    }

    if (joinForm) {
      joinForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleJoinRoom(new FormData(joinForm));
      });
    }

    // Room code input formatting
    const roomCodeInputs = document.querySelectorAll('.room-code-input, #join-room-id');
    roomCodeInputs.forEach(input => {
      input.addEventListener('input', (e) => {
        e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
      });
    });

    // Success page actions
    document.querySelectorAll('[data-action="enter-room"]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.enterRoom();
      });
    });

    document.querySelectorAll('[data-action="create-another"]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.showPage('create');
      });
    });

    // Info buttons
    document.getElementById('features-btn')?.addEventListener('click', () => {
      this.showModal('features-modal');
    });

    document.getElementById('how-it-works-btn')?.addEventListener('click', () => {
      this.showModal('how-it-works-modal');
    });

    document.getElementById('guide-btn')?.addEventListener('click', () => {
      this.showModal('setup-guide-modal');
    });

    // Setup guide button in success page
    document.getElementById('setup-guide-btn')?.addEventListener('click', () => {
      this.showModal('setup-guide-modal');
    });

    // Copy buttons
    document.querySelectorAll('[data-copy]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetId = e.currentTarget.dataset.copy;
        this.copyToClipboard(targetId);
      });
    });
  }

  setupModals() {
    // Modal close functionality
    document.querySelectorAll('.modal-close, .modal-close-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal-overlay');
        if (modal) {
          this.hideModal(modal.id);
        }
      });
    });

    // Close modal on overlay click
    document.querySelectorAll('.modal-overlay').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.hideModal(modal.id);
        }
      });
    });

    // Escape key to close modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const activeModal = document.querySelector('.modal-overlay[aria-hidden="false"]');
        if (activeModal) {
          this.hideModal(activeModal.id);
        }
      }
    });
  }

  showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
      page.classList.remove('active');
    });

    // Show target page
    const targetPage = document.getElementById(`${pageId}-page`);
    if (targetPage) {
      targetPage.classList.add('active');
    }
  }

  showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      
      // Focus management for accessibility
      const firstFocusable = modal.querySelector('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (firstFocusable) {
        setTimeout(() => firstFocusable.focus(), 100);
      }
    }
  }

  hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
  }

  async copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const text = element.textContent || element.value;
    
    try {
      await navigator.clipboard.writeText(text);
      this.showToast('Copied to clipboard!', 'success', 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      this.showToast('Copied to clipboard!', 'success', 2000);
    }
  }

  quickJoinRoom(code) {
    // Fill join form and navigate
    this.showPage('join');
    
    // Fill the room ID field
    const roomIdInput = document.querySelector('input[name="roomId"]');
    if (roomIdInput) {
      roomIdInput.value = code;
    }

    this.showToast(`Joining room ${code}...`, 'info');
  }

  showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };

    toast.innerHTML = `
      <div class="toast-icon">${icons[type] || icons.info}</div>
      <div class="toast-content">
        <div class="toast-message">${message}</div>
      </div>
    `;

    const container = document.getElementById('toast-container') || this.createToastContainer();
    container.appendChild(toast);

    // Show toast
    setTimeout(() => toast.classList.add('show'), 100);

    // Hide and remove toast
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, duration);
  }

  createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
  }

  // Update success page with room info
  updateSuccessPage(roomData) {
    const roomNameEl = document.getElementById('room-name-success');
    const roomIdEl = document.getElementById('room-id-display');
    const localUrlEl = document.getElementById('local-url');

    if (roomNameEl) roomNameEl.textContent = roomData.name || 'Unnamed Room';
    if (roomIdEl) roomIdEl.textContent = roomData.id || 'LOADING...';
    if (localUrlEl) localUrlEl.textContent = roomData.localUrl || 'http://loading...';

    // Update guide elements
    const guideLocalIp = document.getElementById('guide-local-ip');
    const guidePublicUrl = document.getElementById('guide-public-url');
    
    if (guideLocalIp) guideLocalIp.textContent = roomData.localIp || 'Your PC IP';
    if (guidePublicUrl) guidePublicUrl.textContent = roomData.publicUrl || 'http://YOUR_PUBLIC_IP:5000';
  }

  // Show loading state
  showLoading(message = 'Loading...') {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      const messageEl = overlay.querySelector('.loading-content p');
      if (messageEl) messageEl.textContent = message;
      overlay.classList.add('active');
    }
  }

  hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.classList.remove('active');
    }
  }

  // Update loading progress
  updateLoadingProgress(progress, text) {
    const progressBar = document.getElementById('loading-progress');
    const progressText = document.getElementById('loading-text');
    
    if (progressBar) progressBar.style.width = `${progress}%`;
    if (progressText) progressText.textContent = text;
  }

  // Handle create room form submission
  async handleCreateRoom(formData) {
    const roomData = {
      username: formData.get('username'),
      roomName: formData.get('roomName'),
      maxUsers: parseInt(formData.get('maxUsers')),
      privacy: formData.get('privacy'),
      password: formData.get('password'),
      videoQuality: formData.get('videoQuality')
    };

    // Validate required fields
    if (!roomData.username || !roomData.roomName) {
      this.showToast('Please fill in all required fields', 'error');
      return;
    }

    this.showLoading('Creating your room...');

    try {
      // Use the existing app instance to create room
      if (window.app && window.app.state.electronAPI) {
        const result = await window.app.state.electronAPI.startHostMode({
          qualitySettings: { quality: roomData.videoQuality },
          roomSettings: roomData
        });

        if (result.success) {
          this.hideLoading();
          this.updateSuccessPage({
            name: roomData.roomName,
            id: this.generateRoomId(),
            localUrl: `http://${result.serverInfo.localIp}:${result.serverInfo.port}`,
            localIp: result.serverInfo.localIp,
            publicUrl: `http://YOUR_PUBLIC_IP:${result.serverInfo.port}`
          });
          this.showPage('success');
          this.showToast('Room created successfully!', 'success');
        } else {
          throw new Error(result.error || 'Failed to create room');
        }
      } else {
        // Fallback for web version
        this.hideLoading();
        this.updateSuccessPage({
          name: roomData.roomName,
          id: this.generateRoomId(),
          localUrl: 'http://localhost:5000',
          localIp: 'localhost',
          publicUrl: 'http://YOUR_PUBLIC_IP:5000'
        });
        this.showPage('success');
        this.showToast('Room created successfully!', 'success');
      }
    } catch (error) {
      this.hideLoading();
      this.showToast(`Failed to create room: ${error.message}`, 'error');
      console.error('Create room error:', error);
    }
  }

  // Handle join room form submission
  async handleJoinRoom(formData) {
    const joinData = {
      username: formData.get('username'),
      roomId: formData.get('roomId'),
      password: formData.get('password'),
      serverHost: formData.get('serverHost'),
      serverPort: formData.get('serverPort')
    };

    // Validate required fields
    if (!joinData.username || !joinData.roomId || !joinData.serverHost || !joinData.serverPort) {
      this.showToast('Please fill in all required fields', 'error');
      return;
    }

    if (joinData.roomId.length !== 8) {
      this.showToast('Room code must be 8 characters', 'error');
      return;
    }

    this.showLoading('Joining room...');

    try {
      // Use the existing app instance to join room
      if (window.app && window.app.state.electronAPI) {
        const result = await window.app.state.electronAPI.startClientMode(joinData);

        if (result.success) {
          this.hideLoading();
          this.showPage('room');
          this.showToast('Successfully joined room!', 'success');
        } else {
          throw new Error(result.error || 'Failed to join room');
        }
      } else {
        // Fallback for web version
        this.hideLoading();
        this.showPage('room');
        this.showToast('Successfully joined room!', 'success');
      }
    } catch (error) {
      this.hideLoading();
      this.showToast(`Failed to join room: ${error.message}`, 'error');
      console.error('Join room error:', error);
    }
  }

  // Enter room from success page
  enterRoom() {
    this.showPage('room');
    this.showToast('Entering room...', 'info');
  }

  // Generate a random room ID
  generateRoomId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Fill join form with data (for auto-join)
  fillJoinForm(data) {
    if (data.roomId) {
      const roomIdInput = document.getElementById('join-room-id');
      if (roomIdInput) roomIdInput.value = data.roomId;
    }

    if (data.serverHost) {
      const hostInput = document.getElementById('join-server-host');
      if (hostInput) hostInput.value = data.serverHost;
    }

    if (data.serverPort) {
      const portInput = document.getElementById('join-server-port');
      if (portInput) portInput.value = data.serverPort;
    }
  }
}

// Export singleton instance
export default new ModernUIManager();