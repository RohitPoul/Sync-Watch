// UI management and DOM manipulation
import notificationManager from './NotificationManager.js';
import loadingManager from './LoadingManager.js';

export class UIManager {
  constructor(state) {
    this.state = state;
    this.currentPage = 'welcome';
    this.notifications = notificationManager;
    this.loading = loadingManager;
  }

  init() {
    this.showPage('welcome');
    this.setupFormValidation();
    this.setupStepNavigation();
    this.setupPortForwardingGuide();
    this.detectIPs();
  }

  // Page Navigation with optimized smooth transitions (Task 8.1, 11.2)
  showPage(pageId, direction = 'forward') {
    const currentActivePage = document.querySelector('.page.active');
    const targetPage = document.getElementById(`${pageId}-page`);
    
    if (!targetPage) return;
    
    // Batch DOM updates for better performance (Task 11.2)
    requestAnimationFrame(() => {
      // If there's a current page, animate it out
      if (currentActivePage && currentActivePage !== targetPage) {
        // Add exit animation
        currentActivePage.classList.add('exiting');
        
        // Remove active class after animation
        setTimeout(() => {
          currentActivePage.classList.remove('active', 'exiting');
          // Hide to reduce DOM complexity
          currentActivePage.style.display = 'none';
        }, 200); // Match exit animation duration
      }
      
      // Prepare target page for entry
      targetPage.style.display = 'block';
      
      // Use double RAF for smooth 60fps animation (Task 11.2)
      requestAnimationFrame(() => {
        targetPage.offsetHeight; // Force reflow
        requestAnimationFrame(() => {
          targetPage.classList.add('active');
          this.currentPage = pageId;
        });
      });
    });
  }

  showNavbar() {
    document.getElementById('navbar')?.classList.remove('hidden');
  }

  hideNavbar() {
    document.getElementById('navbar')?.classList.add('hidden');
  }

  // Loading States - Delegate to LoadingManager
  showLoading(message = 'Loading...', progress = null) {
    this.loading.showOverlay(message, progress);
  }

  hideLoading() {
    this.loading.hideOverlay();
  }

  // Toast Notifications - Delegate to NotificationManager
  showToast(message, type = 'info', duration, options) {
    return this.notifications.show(message, type, duration, options);
  }

  // Port Forwarding Guide Setup
  setupPortForwardingGuide() {
    // Tab switching
    document.querySelectorAll('.guide-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const targetTab = e.currentTarget.dataset.tab;
        
        // Update active tab
        document.querySelectorAll('.guide-tab').forEach(t => t.classList.remove('active'));
        e.currentTarget.classList.add('active');
        
        // Update active panel
        document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
        const targetPanel = document.getElementById(targetTab);
        if (targetPanel) targetPanel.classList.add('active');
      });
    });

    // Copy public URL button
    const copyPublicUrlBtn = document.getElementById('copy-public-url');
    if (copyPublicUrlBtn) {
      copyPublicUrlBtn.addEventListener('click', () => {
        const publicUrl = document.getElementById('public-url').textContent;
        navigator.clipboard.writeText(publicUrl).then(() => {
          this.showToast('Public URL copied to clipboard!', 'success');
        });
      });
    }
  }

  // Detect Local and Public IPs
  async detectIPs() {
    // Get local IP from the server
    const localIpEl = document.getElementById('local-ip');
    const yourLocalIpEl = document.getElementById('your-local-ip');
    
    // This is already provided by the server when room is created
    // We'll update it there
    
    // Get public IP
    this.detectPublicIP();
  }

  async detectPublicIP() {
    try {
      // Try multiple services for redundancy
      const services = [
        'https://api.ipify.org?format=json',
        'https://ipapi.co/json/',
        'https://api.myip.com'
      ];
      
      let publicIP = null;
      
      for (const service of services) {
        try {
          const response = await fetch(service);
          const data = await response.json();
          publicIP = data.ip || data.IPv4 || data['ip-address'];
          if (publicIP) break;
        } catch (err) {
          console.log(`Failed to get IP from ${service}`);
        }
      }
      
      if (publicIP) {
        // Update all public IP displays
        const publicIpEl = document.getElementById('public-ip');
        const publicUrlDisplay = document.getElementById('public-url-display');
        
        if (publicIpEl) publicIpEl.textContent = publicIP;
        if (publicUrlDisplay) publicUrlDisplay.textContent = `http://${publicIP}:5000`;
        
        // Store for later use
        this.state.publicIP = publicIP;
      }
    } catch (error) {
      console.error('Failed to detect public IP:', error);
      const publicIpEl = document.getElementById('public-ip');
      if (publicIpEl) publicIpEl.textContent = 'Detection failed';
    }
  }

  async checkPortStatus(publicIP) {
    // Note: Direct port checking from browser is limited due to CORS
    // This is just a placeholder - actual checking would need server-side help
    const internetStatusEl = document.getElementById('internet-status');
    if (internetStatusEl) {
      internetStatusEl.innerHTML = '⚠️ Port forwarding required<br><small>Configure port 5000 on your router</small>';
    }
  }

  // Room Success Page (Updated for new design)
  showRoomSuccess(data) {
    this.showPage('success');
    
    // Update room info with null checks
    const roomIdEl = document.getElementById('room-id-display');
    const roomNameEl = document.getElementById('room-name-success');
    const appLinkEl = document.getElementById('app-link');
    const webLinkEl = document.getElementById('web-link');
    
    // Update room name and ID
    if (roomNameEl) roomNameEl.textContent = data.roomName || 'My Room';
    if (roomIdEl) roomIdEl.textContent = data.roomId || 'LOADING...';
    
    // Update links
    if (appLinkEl) appLinkEl.textContent = data.shareableUrl || '';
    if (webLinkEl) webLinkEl.textContent = data.webUrl || '';
    
    // Update IP addresses in guide
    const localIpEl = document.getElementById('local-ip');
    const internalIpGuide = document.getElementById('internal-ip-guide');
    
    if (localIpEl && data.serverIp) {
      localIpEl.textContent = data.serverIp;
    }
    if (internalIpGuide && data.serverIp) {
      internalIpGuide.textContent = data.serverIp;
    }
    
    // Detect and update public IP
    this.detectPublicIP();
  }

  // Room UI Updates
  updateRoomUI(data) {
    if (data.isAdmin) {
      this.showAdminControls();
    }
    
    // Update navbar with room name and ID
    const navRoomId = document.getElementById('nav-room-id');
    if (navRoomId) {
      navRoomId.innerHTML = `
        <span class="room-name-nav">${data.roomName || 'Room'}</span>
        <span class="room-id-nav">[${data.roomId}]</span>
      `;
    }
    
    // Update room title in video section
    const roomTitle = document.getElementById('room-title');
    if (roomTitle) {
      roomTitle.textContent = data.roomName || 'Untitled Room';
    }
    
    this.updateUsersList(data.users || []);
    
    if (data.videoState?.videoUrl) {
      this.loadVideoInPlayer(data.videoState);
    }
  }

  showAdminControls() {
    document.querySelectorAll('.admin-only').forEach(el => {
      el.style.display = 'block';
    });
  }

  // Optimized to reduce DOM manipulation (Task 11.2)
  updateUsersList(users) {
    const usersList = document.getElementById('users-list');
    const userCount = document.getElementById('user-count');
    const usersTabCount = document.getElementById('users-tab-count');
    
    if (!usersList) return;
    
    // Batch DOM updates using DocumentFragment (Task 11.2)
    requestAnimationFrame(() => {
      if (userCount) userCount.textContent = users.length;
      if (usersTabCount) usersTabCount.textContent = users.length;
      
      if (users.length === 0) {
        usersList.innerHTML = `
          <div class="no-users">
            <span>👥</span>
            <p>Waiting for users to join...</p>
          </div>
        `;
      } else {
        // Build HTML string once to minimize reflows
        const usersHTML = users.map(user => `
          <div class="user-item">
            <div class="user-avatar">${user.name.charAt(0).toUpperCase()}</div>
            <div class="user-info">
              <div class="user-name">${user.name}</div>
              <div class="user-status">${user.isAdmin ? 'Admin' : 'Member'}</div>
            </div>
            ${user.isAdmin ? '<span class="admin-badge">ADMIN</span>' : ''}
          </div>
        `).join('');
        
        usersList.innerHTML = usersHTML;
      }
    });
  }

  // Video Controls
  loadVideoInPlayer(videoState) {
    const placeholder = document.getElementById('video-placeholder');
    const videoTitle = document.getElementById('video-title');
    const videoElement = document.getElementById('main-video');
    
    if (placeholder) placeholder.style.display = 'none';
    if (videoTitle) videoTitle.textContent = videoState.title || 'Video';
    
    if (videoElement && videoState.videoUrl) {
      videoElement.src = videoState.videoUrl;
      if (videoState.currentTime) {
        videoElement.currentTime = videoState.currentTime;
      }
      if (videoState.isPlaying) {
        videoElement.play();
      }
    }
  }

  updateVideoControls(data) {
    const playPauseBtn = document.getElementById('play-pause-btn');
    const videoElement = document.getElementById('main-video');
    
    if (playPauseBtn) {
      playPauseBtn.innerHTML = data.isPlaying ? '<span>⏸️</span>' : '<span>▶️</span>';
    }
    
    if (videoElement) {
      if (data.currentTime !== undefined) {
        videoElement.currentTime = data.currentTime;
      }
      if (data.isPlaying !== undefined) {
        data.isPlaying ? videoElement.play() : videoElement.pause();
      }
    }
  }

  // Chat UI - Optimized to reduce DOM manipulation (Task 11.2)
  addChatMessage(data) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;
    
    // Batch DOM updates for better performance (Task 11.2)
    requestAnimationFrame(() => {
      const messageEl = document.createElement('div');
      messageEl.className = 'chat-message';
      
      const time = new Date(data.timestamp).toLocaleTimeString();
      
      messageEl.innerHTML = `
        <div class="message-header">
          <span class="message-user">${data.user}</span>
          <span class="message-time">${time}</span>
        </div>
        <div class="message-text">${this.escapeHtml(data.message)}</div>
      `;
      
      chatMessages.appendChild(messageEl);
      
      // Use smooth scrolling for better UX
      chatMessages.scrollTo({
        top: chatMessages.scrollHeight,
        behavior: 'smooth'
      });
      
      // Update chat tab count
      const chatTabCount = document.getElementById('chat-tab-count');
      if (chatTabCount) {
        const currentCount = parseInt(chatTabCount.textContent) || 0;
        chatTabCount.textContent = currentCount + 1;
      }
    });
  }

  // Tab Switching
  switchTab(tabName) {
    // Handle room tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    
    const tabBtn = document.querySelector(`[data-tab="${tabName}"]`);
    const tabContent = document.getElementById(`${tabName}-tab`);
    
    if (tabBtn) tabBtn.classList.add('active');
    if (tabContent) tabContent.classList.add('active');
    
    // Handle share tabs
    document.querySelectorAll('.share-tab').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelectorAll('.share-content').forEach(content => {
      content.classList.remove('active');
    });
    
    const shareTab = document.querySelector(`.share-tab[data-tab="${tabName}"]`);
    const shareContent = document.getElementById(`${tabName}-content`);
    
    if (shareTab) shareTab.classList.add('active');
    if (shareContent) shareContent.classList.add('active');
  }

  // Form Helpers
  fillJoinForm(data) {
    if (data.roomId) {
      const input = document.querySelector('[name="roomId"]');
      if (input) input.value = data.roomId;
    }
    if (data.serverHost) {
      const input = document.querySelector('[name="serverHost"]');
      if (input) input.value = data.serverHost;
    }
    if (data.serverPort) {
      const input = document.querySelector('[name="serverPort"]');
      if (input) input.value = data.serverPort;
    }
  }

  setupFormValidation() {
    // Privacy radio buttons for the new design
    const privacyRadios = document.querySelectorAll('[name="privacy"]');
    privacyRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        const passwordGroup = document.getElementById('password-group');
        if (passwordGroup) {
          passwordGroup.style.display = 
            e.target.value === 'private' ? 'block' : 'none';
        }
      });
    });
    
    // Old select fallback
    const privacySelect = document.querySelector('select[name="privacy"]');
    if (privacySelect) {
      privacySelect.addEventListener('change', (e) => {
        const passwordGroup = document.getElementById('password-group');
        if (passwordGroup) {
          passwordGroup.style.display = 
            e.target.value === 'private' ? 'block' : 'none';
        }
      });
    }
  }
  
  setupStepNavigation() {
    let currentStep = 1;
    const totalSteps = 3;
    
    const nextBtn = document.getElementById('next-step');
    const prevBtn = document.getElementById('prev-step');
    const submitBtn = document.getElementById('create-submit');
    
    const updateStep = (step) => {
      // Update form steps
      document.querySelectorAll('.form-step').forEach(el => {
        el.classList.remove('active');
      });
      document.querySelector(`.form-step[data-step="${step}"]`)?.classList.add('active');
      
      // Update progress indicators
      document.querySelectorAll('.progress-step').forEach((el, index) => {
        el.classList.remove('active', 'completed');
        if (index + 1 < step) {
          el.classList.add('completed');
        } else if (index + 1 === step) {
          el.classList.add('active');
        }
      });
      
      // Update progress lines
      document.querySelectorAll('.progress-line').forEach((el, index) => {
        el.classList.toggle('completed', index + 1 < step);
      });
      
      // Update buttons
      if (prevBtn) prevBtn.style.display = step === 1 ? 'none' : 'flex';
      if (nextBtn) nextBtn.style.display = step === totalSteps ? 'none' : 'flex';
      if (submitBtn) submitBtn.style.display = step === totalSteps ? 'flex' : 'none';
    };
    
    // Next button
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (this.validateCurrentStep(currentStep)) {
          if (currentStep < totalSteps) {
            currentStep++;
            updateStep(currentStep);
          }
        }
      });
    }
    
    // Previous button
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (currentStep > 1) {
          currentStep--;
          updateStep(currentStep);
        }
      });
    }
    
    // Progress step clicks
    document.querySelectorAll('.progress-step').forEach((step, index) => {
      step.addEventListener('click', () => {
        const targetStep = index + 1;
        if (targetStep < currentStep || this.validateCurrentStep(currentStep)) {
          currentStep = targetStep;
          updateStep(currentStep);
        }
      });
    });
    
    // Initialize first step
    updateStep(1);
  }
  
  validateCurrentStep(step) {
    if (step === 1) {
      const username = document.querySelector('[name="username"]');
      if (!username || !username.value.trim()) {
        this.showToast('Please enter your name', 'warning');
        username?.focus();
        return false;
      }
    }
    return true;
  }

  // Utility Methods
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
