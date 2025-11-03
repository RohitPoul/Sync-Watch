/**
 * ModalTemplates - Pre-built modal content templates
 * 
 * Provides ready-to-use modal templates for:
 * - Features modal
 * - How It Works modal
 * - Room creation modal
 * - Settings modal
 * - Network status modal
 * - Error modals
 */

export class ModalTemplates {
  /**
   * Features Modal Template
   * Shows all app features in a grid layout
   */
  static features() {
    return {
      title: 'Why SyncStream Pro?',
      icon: '✨',
      size: 'lg',
      content: `
        <div class="modal-section">
          <p class="modal-section-description">
            Everything you need for the perfect watch party
          </p>
          
          <div class="modal-info-grid">
            <div class="modal-info-card">
              <span class="modal-info-card-icon">🔄</span>
              <h3 class="modal-info-card-title">Perfect Synchronization</h3>
              <p class="modal-info-card-description">
                Every play, pause, and seek is instantly synced across all viewers. 
                No more countdowns or "are you at 1:23?"
              </p>
              <span class="modal-info-badge">WebSocket Technology</span>
            </div>
            
            <div class="modal-info-card">
              <span class="modal-info-card-icon">🏠</span>
              <h3 class="modal-info-card-title">You Own Your Server</h3>
              <p class="modal-info-card-description">
                When you create a room, your PC becomes the host. Complete control, 
                no third-party servers, your rules.
              </p>
              <span class="modal-info-badge">P2P Architecture</span>
            </div>
            
            <div class="modal-info-card">
              <span class="modal-info-card-icon">💬</span>
              <h3 class="modal-info-card-title">Real-time Chat</h3>
              <p class="modal-info-card-description">
                React and discuss while watching. Chat messages sync with video 
                timestamps for the full experience.
              </p>
              <span class="modal-info-badge">Built-in Messaging</span>
            </div>
            
            <div class="modal-info-card">
              <span class="modal-info-card-icon">🎨</span>
              <h3 class="modal-info-card-title">Quality Control</h3>
              <p class="modal-info-card-description">
                Support for 720p, 1080p, and 4K streaming. Adaptive quality based 
                on everyone's connection speed.
              </p>
              <span class="modal-info-badge">HD/4K Support</span>
            </div>
            
            <div class="modal-info-card">
              <span class="modal-info-card-icon">🔒</span>
              <h3 class="modal-info-card-title">Privacy First</h3>
              <p class="modal-info-card-description">
                Password-protected rooms, admin controls, and no data collection. 
                Your watch party, your privacy.
              </p>
              <span class="modal-info-badge">Secure Rooms</span>
            </div>
            
            <div class="modal-info-card">
              <span class="modal-info-card-icon">🌐</span>
              <h3 class="modal-info-card-title">Works Everywhere</h3>
              <p class="modal-info-card-description">
                Desktop app via Electron or any modern browser. Share links that 
                work on any device.
              </p>
              <span class="modal-info-badge">Cross-Platform</span>
            </div>
          </div>
        </div>
      `
    };
  }

  /**
   * How It Works Modal Template
   * Shows step-by-step guide
   */
  static howItWorks() {
    return {
      title: 'How It Works',
      icon: '📖',
      size: 'md',
      content: `
        <div class="modal-section">
          <p class="modal-section-description">
            Get started in under a minute
          </p>
          
          <div class="modal-steps">
            <div class="modal-step">
              <div class="modal-step-number">1</div>
              <div class="modal-step-content">
                <h3 class="modal-step-title">Create or Join</h3>
                <p class="modal-step-description">
                  Host creates a room and becomes the server. Friends join with 
                  the room code. No sign-up required!
                </p>
              </div>
            </div>
            
            <div class="modal-step">
              <div class="modal-step-number">2</div>
              <div class="modal-step-content">
                <h3 class="modal-step-title">Load Your Video</h3>
                <p class="modal-step-description">
                  Add any video file or streaming URL. Everyone sees the same 
                  content automatically.
                </p>
              </div>
            </div>
            
            <div class="modal-step">
              <div class="modal-step-number">3</div>
              <div class="modal-step-content">
                <h3 class="modal-step-title">Watch Together</h3>
                <p class="modal-step-description">
                  Play, pause, seek - everything syncs automatically. Chat while 
                  you watch and enjoy the shared experience!
                </p>
              </div>
            </div>
          </div>
        </div>
      `
    };
  }

  /**
   * Settings/About Modal Template
   * Shows app info, GitHub links, and settings
   */
  static settings() {
    return {
      title: 'Settings & About',
      icon: '⚙️',
      size: 'md',
      content: `
        <div class="modal-section">
          <h3 class="modal-section-title">
            <span>💻</span>
            About SyncStream Pro
          </h3>
          <p class="modal-section-description">
            SyncStream Pro is a free, open-source project built with modern web 
            technologies. Watch videos together in perfect sync with P2P streaming.
          </p>
          
          <div class="modal-glass-card" style="margin-top: var(--space-lg);">
            <div style="display: flex; gap: var(--space-sm); flex-wrap: wrap; margin-bottom: var(--space-md);">
              <span class="modal-info-badge">Node.js</span>
              <span class="modal-info-badge">Socket.IO</span>
              <span class="modal-info-badge">Electron</span>
              <span class="modal-info-badge">Express</span>
              <span class="modal-info-badge">WebRTC</span>
            </div>
            
            <div style="display: flex; gap: var(--space-md); margin-top: var(--space-lg);">
              <a href="https://github.com/yourusername/syncstream-pro" target="_blank" 
                 class="btn btn-secondary" style="flex: 1;">
                <span>📦</span> View on GitHub
              </a>
              <a href="https://github.com/yourusername/syncstream-pro/issues" target="_blank" 
                 class="btn btn-secondary" style="flex: 1;">
                <span>🐛</span> Report Issue
              </a>
            </div>
          </div>
        </div>
        
        <div class="modal-section">
          <h3 class="modal-section-title">
            <span>📝</span>
            License & Contributing
          </h3>
          <p class="modal-section-description">
            Released under the MIT License. Contributions are welcome! Check our 
            contribution guidelines on GitHub.
          </p>
        </div>
        
        <div class="modal-section">
          <h3 class="modal-section-title">
            <span>ℹ️</span>
            Version Information
          </h3>
          <div class="modal-status-grid">
            <div class="modal-status-item">
              <div class="modal-status-label">Version</div>
              <div class="modal-status-value">v2.0.0</div>
            </div>
            <div class="modal-status-item">
              <div class="modal-status-label">Port</div>
              <div class="modal-status-value">5000</div>
            </div>
          </div>
        </div>
      `
    };
  }

  /**
   * Network Status Modal Template
   * Shows detailed network information
   */
  static networkStatus(data = {}) {
    const {
      localIp = 'Checking...',
      publicIp = 'Checking...',
      connectionType = 'Unknown',
      downloadSpeed = '--',
      uploadSpeed = '--',
      ping = '--',
      status = 'checking'
    } = data;

    const statusIndicator = status === 'good' ? 'success' : 
                           status === 'fair' ? 'warning' : 
                           status === 'poor' ? 'error' : '';

    return {
      title: 'Network Status',
      icon: '📡',
      size: 'md',
      content: `
        <div class="modal-section">
          <div class="modal-status-grid">
            <div class="modal-status-item">
              <div class="modal-status-label">Connection Status</div>
              <div class="modal-status-value">
                <span class="modal-status-indicator ${statusIndicator}"></span>
                ${status === 'good' ? 'Excellent' : 
                  status === 'fair' ? 'Fair' : 
                  status === 'poor' ? 'Poor' : 'Checking...'}
              </div>
            </div>
            
            <div class="modal-status-item">
              <div class="modal-status-label">Connection Type</div>
              <div class="modal-status-value">${connectionType}</div>
            </div>
            
            <div class="modal-status-item">
              <div class="modal-status-label">Local IP</div>
              <div class="modal-status-value" style="font-size: var(--font-base);">${localIp}</div>
            </div>
            
            <div class="modal-status-item">
              <div class="modal-status-label">Public IP</div>
              <div class="modal-status-value" style="font-size: var(--font-base);">${publicIp}</div>
            </div>
          </div>
        </div>
        
        <div class="modal-section">
          <h3 class="modal-section-title">
            <span>⚡</span>
            Speed Metrics
          </h3>
          <div class="modal-status-grid">
            <div class="modal-status-item">
              <div class="modal-status-label">Download</div>
              <div class="modal-status-value">
                <span class="modal-status-icon">⬇️</span>
                ${downloadSpeed} Mbps
              </div>
            </div>
            
            <div class="modal-status-item">
              <div class="modal-status-label">Upload</div>
              <div class="modal-status-value">
                <span class="modal-status-icon">⬆️</span>
                ${uploadSpeed} Mbps
              </div>
            </div>
            
            <div class="modal-status-item">
              <div class="modal-status-label">Ping</div>
              <div class="modal-status-value">
                <span class="modal-status-icon">📍</span>
                ${ping} ms
              </div>
            </div>
            
            <div class="modal-status-item">
              <div class="modal-status-label">Jitter</div>
              <div class="modal-status-value">
                <span class="modal-status-icon">📊</span>
                -- ms
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-section">
          <h3 class="modal-section-title">
            <span>💡</span>
            Troubleshooting Tips
          </h3>
          <div class="modal-glass-card">
            <ul style="list-style: none; padding: 0; margin: 0;">
              <li style="padding: var(--space-sm) 0; color: var(--text-secondary); display: flex; gap: var(--space-sm);">
                <span>✓</span>
                <span>Close bandwidth-heavy applications</span>
              </li>
              <li style="padding: var(--space-sm) 0; color: var(--text-secondary); display: flex; gap: var(--space-sm);">
                <span>✓</span>
                <span>Use wired connection for best performance</span>
              </li>
              <li style="padding: var(--space-sm) 0; color: var(--text-secondary); display: flex; gap: var(--space-sm);">
                <span>✓</span>
                <span>Check firewall settings if connection fails</span>
              </li>
              <li style="padding: var(--space-sm) 0; color: var(--text-secondary); display: flex; gap: var(--space-sm);">
                <span>✓</span>
                <span>Lower video quality if experiencing lag</span>
              </li>
            </ul>
          </div>
        </div>
      `
    };
  }

  /**
   * Error Modal Template
   * Shows error with details and actions
   */
  static error(config = {}) {
    const {
      title = 'Error',
      message = 'An error occurred',
      details = null,
      actions = []
    } = config;

    let actionsHTML = '';
    if (actions.length > 0) {
      actionsHTML = `
        <div class="modal-error-actions">
          ${actions.map(action => 
            `<button class="btn ${action.class || 'btn-secondary'}" 
                     onclick="${action.onClick || ''}">${action.text}</button>`
          ).join('')}
        </div>
      `;
    }

    return {
      title,
      icon: '❌',
      size: 'sm',
      content: `
        <div class="modal-error-content">
          <div class="modal-error-icon">⚠️</div>
          <h3 class="modal-error-title">${title}</h3>
          <p class="modal-error-message">${message}</p>
          ${details ? `<div class="modal-error-details">${details}</div>` : ''}
          ${actionsHTML}
        </div>
      `
    };
  }

  /**
   * Success Modal Template
   * Shows success message
   */
  static success(config = {}) {
    const {
      title = 'Success',
      message = 'Operation completed successfully'
    } = config;

    return {
      title,
      icon: '✅',
      size: 'sm',
      content: `
        <div class="modal-success">
          <div class="modal-success-icon">✅</div>
          <h3 class="modal-success-title">${title}</h3>
          <p class="modal-success-message">${message}</p>
        </div>
      `
    };
  }

  /**
   * Loading Modal Template
   * Shows loading state
   */
  static loading(message = 'Loading...') {
    return {
      title: 'Please Wait',
      icon: '⏳',
      size: 'sm',
      content: `
        <div class="modal-loading">
          <div class="modal-loading-spinner"></div>
          <div class="modal-loading-text">${message}</div>
        </div>
      `
    };
  }

  /**
   * Room Creation Form Modal Template
   * Compact form for creating a room
   */
  static roomCreation() {
    return {
      title: 'Create Your Room',
      icon: '🚀',
      size: 'md',
      content: `
        <form id="modal-room-form">
          <div class="modal-form-group">
            <label class="modal-form-label">Your Name *</label>
            <input type="text" class="modal-form-input" name="username" 
                   placeholder="Enter your display name" required maxlength="20">
          </div>
          
          <div class="modal-form-group">
            <label class="modal-form-label">Room Name *</label>
            <input type="text" class="modal-form-input" name="roomName" 
                   placeholder="e.g., Movie Night, Anime Marathon" required maxlength="30">
            <span class="modal-form-help">This name will be displayed to all participants</span>
          </div>
          
          <div class="modal-collapsible" id="advanced-settings">
            <div class="modal-collapsible-header">
              <span class="modal-collapsible-title">
                <span>⚙️</span>
                Advanced Settings
              </span>
              <span class="modal-collapsible-icon">▼</span>
            </div>
            <div class="modal-collapsible-content">
              <div class="modal-form-group">
                <label class="modal-form-label">Max Users</label>
                <select class="modal-form-input" name="maxUsers">
                  <option value="5">5 users</option>
                  <option value="10" selected>10 users</option>
                  <option value="25">25 users</option>
                </select>
              </div>
              
              <div class="modal-form-group">
                <label class="modal-form-label">Privacy</label>
                <select class="modal-form-input" name="privacy">
                  <option value="public">Public</option>
                  <option value="private" selected>Private (Password Protected)</option>
                </select>
              </div>
              
              <div class="modal-form-group" id="password-field">
                <label class="modal-form-label">Password (Optional)</label>
                <input type="password" class="modal-form-input" name="password" 
                       placeholder="Enter room password" maxlength="20">
              </div>
              
              <div class="modal-form-group">
                <label class="modal-form-label">Video Quality</label>
                <select class="modal-form-input" name="videoQuality">
                  <option value="720p30">720p @ 30fps (3.5 Mbps)</option>
                  <option value="720p60">720p @ 60fps (4.5 Mbps)</option>
                  <option value="1080p30" selected>1080p @ 30fps (5.0 Mbps)</option>
                  <option value="1080p60">1080p @ 60fps (8.0 Mbps)</option>
                  <option value="4k30">4K @ 30fps (15 Mbps)</option>
                </select>
              </div>
            </div>
          </div>
        </form>
      `
    };
  }
}

export default ModalTemplates;
