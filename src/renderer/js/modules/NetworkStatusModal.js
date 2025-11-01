/**
 * NetworkStatusModal - Detailed network statistics modal
 * Shows local IP, public IP, connection type, speed test, and troubleshooting tips
 */

import modalManager from './ModalManager.js';

export class NetworkStatusModal {
  constructor(networkMonitor) {
    this.networkMonitor = networkMonitor;
    this.modalId = 'network-status-modal';
    this.isOpen = false;
    this.updateInterval = null;
  }

  /**
   * Open the network status modal
   */
  async open() {
    if (this.isOpen) return;

    const stats = this.networkMonitor ? this.networkMonitor.getStats() : null;
    const localIP = await this.getLocalIP();
    const publicIP = await this.getPublicIP();
    const connectionType = this.getConnectionType();

    const content = this.buildModalContent(stats, localIP, publicIP, connectionType);

    modalManager.open({
      title: '📡 Network Status',
      content: content,
      size: 'md',
      buttons: [
        {
          text: 'Run Speed Test',
          className: 'btn-primary',
          onClick: () => this.runSpeedTest()
        },
        {
          text: 'Close',
          className: 'btn-secondary',
          onClick: () => this.close()
        }
      ],
      onClose: () => this.close()
    });

    this.isOpen = true;

    // Setup copy button handlers
    setTimeout(() => {
      this.setupCopyButtons();
    }, 100);

    // Update stats every 2 seconds while modal is open
    this.updateInterval = setInterval(() => {
      this.updateStats();
    }, 2000);
  }

  /**
   * Setup copy button handlers
   */
  setupCopyButtons() {
    const copyButtons = document.querySelectorAll('.copy-ip-btn');
    copyButtons.forEach(btn => {
      btn.addEventListener('click', async () => {
        const textToCopy = btn.getAttribute('data-copy');
        try {
          await navigator.clipboard.writeText(textToCopy);
          if (window.syncStreamApp && window.syncStreamApp.notifications) {
            window.syncStreamApp.notifications.success('Copied to clipboard!');
          }
        } catch (error) {
          console.error('Failed to copy:', error);
          if (window.syncStreamApp && window.syncStreamApp.notifications) {
            window.syncStreamApp.notifications.error('Failed to copy');
          }
        }
      });
    });
  }

  /**
   * Close the modal
   */
  close() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.isOpen = false;
    modalManager.close();
  }

  /**
   * Build modal content HTML
   */
  buildModalContent(stats, localIP, publicIP, connectionType) {
    const quality = stats ? stats.connectionQuality : 'unknown';
    const qualityColor = this.getQualityColor(quality);
    const qualityIcon = this.getQualityIcon(quality);

    return `
      <div class="network-status-content">
        <!-- Connection Overview -->
        <div class="network-overview">
          <div class="network-quality-badge" style="border-color: ${qualityColor}; color: ${qualityColor};">
            <span class="quality-icon">${qualityIcon}</span>
            <span class="quality-text">${quality.toUpperCase()}</span>
          </div>
          <p class="network-description">
            Your current network connection quality and statistics
          </p>
        </div>

        <!-- Network Stats Grid -->
        <div class="network-stats-grid" id="network-stats-grid">
          <div class="stat-card">
            <div class="stat-icon">⬇️</div>
            <div class="stat-info">
              <div class="stat-label">Download Speed</div>
              <div class="stat-value" id="modal-download-speed">
                ${stats ? this.formatSpeed(stats.downloadSpeed) : '--'}
              </div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">⬆️</div>
            <div class="stat-info">
              <div class="stat-label">Upload Speed</div>
              <div class="stat-value" id="modal-upload-speed">
                ${stats ? this.formatSpeed(stats.uploadSpeed) : '--'}
              </div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">📍</div>
            <div class="stat-info">
              <div class="stat-label">Latency</div>
              <div class="stat-value" id="modal-latency">
                ${stats ? stats.latency + 'ms' : '--'}
              </div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">🌐</div>
            <div class="stat-info">
              <div class="stat-label">Connection Type</div>
              <div class="stat-value" id="modal-connection-type">
                ${connectionType}
              </div>
            </div>
          </div>
        </div>

        <!-- IP Addresses -->
        <div class="network-section">
          <h4 class="section-title">📌 Network Addresses</h4>
          <div class="ip-addresses">
            <div class="ip-item">
              <span class="ip-label">Local IP:</span>
              <span class="ip-value" id="modal-local-ip">${localIP}</span>
              <button class="copy-ip-btn" data-copy="${localIP}" title="Copy">📋</button>
            </div>
            <div class="ip-item">
              <span class="ip-label">Public IP:</span>
              <span class="ip-value" id="modal-public-ip">${publicIP}</span>
              <button class="copy-ip-btn" data-copy="${publicIP}" title="Copy">📋</button>
            </div>
          </div>
        </div>

        <!-- Troubleshooting Tips -->
        <div class="network-section">
          <h4 class="section-title">💡 Troubleshooting Tips</h4>
          <div class="troubleshooting-tips">
            ${this.getTroubleshootingTips(quality)}
          </div>
        </div>

        <!-- Recommended Quality -->
        <div class="network-section">
          <h4 class="section-title">🎬 Recommended Streaming Quality</h4>
          <div class="quality-recommendation">
            ${this.getQualityRecommendation(stats)}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Update stats in the modal
   */
  updateStats() {
    if (!this.isOpen) return;

    const stats = this.networkMonitor ? this.networkMonitor.getStats() : null;
    if (!stats) return;

    // Update download speed
    const downloadEl = document.getElementById('modal-download-speed');
    if (downloadEl) {
      downloadEl.textContent = this.formatSpeed(stats.downloadSpeed);
    }

    // Update upload speed
    const uploadEl = document.getElementById('modal-upload-speed');
    if (uploadEl) {
      uploadEl.textContent = this.formatSpeed(stats.uploadSpeed);
    }

    // Update latency
    const latencyEl = document.getElementById('modal-latency');
    if (latencyEl) {
      latencyEl.textContent = stats.latency + 'ms';
    }
  }

  /**
   * Get local IP address
   */
  async getLocalIP() {
    try {
      // Try to get from state first
      if (window.syncStreamApp && window.syncStreamApp.state.serverIp) {
        return window.syncStreamApp.state.serverIp;
      }

      // Fallback: Try WebRTC method
      const pc = new RTCPeerConnection({ iceServers: [] });
      pc.createDataChannel('');
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      return new Promise((resolve) => {
        pc.onicecandidate = (ice) => {
          if (!ice || !ice.candidate || !ice.candidate.candidate) {
            resolve('Detecting...');
            return;
          }

          const ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3})/;
          const match = ipRegex.exec(ice.candidate.candidate);
          if (match) {
            resolve(match[1]);
            pc.close();
          }
        };

        // Timeout after 2 seconds
        setTimeout(() => {
          resolve('Unable to detect');
          pc.close();
        }, 2000);
      });
    } catch (error) {
      console.error('Failed to get local IP:', error);
      return 'Unable to detect';
    }
  }

  /**
   * Get public IP address
   */
  async getPublicIP() {
    try {
      // Try multiple services for redundancy
      const services = [
        'https://api.ipify.org?format=json',
        'https://ipapi.co/json/',
        'https://api.myip.com'
      ];

      for (const service of services) {
        try {
          const response = await fetch(service, { timeout: 3000 });
          const data = await response.json();
          const ip = data.ip || data.IPv4 || data['ip-address'];
          if (ip) return ip;
        } catch (err) {
          continue;
        }
      }

      return 'Unable to detect';
    } catch (error) {
      console.error('Failed to get public IP:', error);
      return 'Unable to detect';
    }
  }

  /**
   * Get connection type
   */
  getConnectionType() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

    if (connection) {
      const type = connection.effectiveType || connection.type || 'unknown';
      return type.toUpperCase();
    }

    return 'Unknown';
  }

  /**
   * Format speed in Mbps or Kbps
   */
  formatSpeed(speedMbps) {
    if (!speedMbps || speedMbps === 0) return '--';

    if (speedMbps < 1) {
      return `${(speedMbps * 1000).toFixed(0)} Kbps`;
    } else if (speedMbps < 100) {
      return `${speedMbps.toFixed(1)} Mbps`;
    } else {
      return `${speedMbps.toFixed(0)} Mbps`;
    }
  }

  /**
   * Get quality color
   */
  getQualityColor(quality) {
    const colors = {
      'excellent': '#10b981',
      'good': '#3b82f6',
      'fair': '#f59e0b',
      'poor': '#ef4444',
      'very-poor': '#991b1b',
      'offline': '#6b7280'
    };
    return colors[quality] || colors['offline'];
  }

  /**
   * Get quality icon
   */
  getQualityIcon(quality) {
    const icons = {
      'excellent': '🚀',
      'good': '✅',
      'fair': '⚠️',
      'poor': '⚡',
      'very-poor': '❌',
      'offline': '🔌'
    };
    return icons[quality] || icons['offline'];
  }

  /**
   * Get troubleshooting tips based on quality
   */
  getTroubleshootingTips(quality) {
    const tips = {
      'excellent': [
        'Your connection is excellent! No issues detected.',
        'You can stream at the highest quality settings.'
      ],
      'good': [
        'Your connection is good for streaming.',
        'Consider closing bandwidth-heavy applications for best performance.'
      ],
      'fair': [
        'Your connection may experience occasional buffering.',
        'Try closing other applications using the internet.',
        'Move closer to your WiFi router if using wireless.'
      ],
      'poor': [
        'Your connection may struggle with high-quality streaming.',
        'Close all other applications using the internet.',
        'Use a wired Ethernet connection instead of WiFi.',
        'Contact your ISP if issues persist.'
      ],
      'very-poor': [
        'Your connection is too slow for reliable streaming.',
        'Check if other devices are using your network.',
        'Restart your router and modem.',
        'Consider upgrading your internet plan.'
      ],
      'offline': [
        'No internet connection detected.',
        'Check your network cables or WiFi connection.',
        'Restart your router and modem.',
        'Contact your ISP if the problem persists.'
      ]
    };

    const tipsList = tips[quality] || tips['offline'];
    return tipsList.map(tip => `
      <div class="tip-item">
        <span class="tip-icon">💡</span>
        <span class="tip-text">${tip}</span>
      </div>
    `).join('');
  }

  /**
   * Get quality recommendation
   */
  getQualityRecommendation(stats) {
    if (!stats || !stats.downloadSpeed) {
      return '<p class="recommendation-text">Run a speed test to get recommendations</p>';
    }

    const download = stats.downloadSpeed;
    let quality, description;

    if (download > 50) {
      quality = '4K @ 60fps';
      description = 'Your connection can handle the highest quality streaming';
    } else if (download > 25) {
      quality = '1440p @ 60fps';
      description = 'Excellent quality with smooth playback';
    } else if (download > 15) {
      quality = '1080p @ 60fps';
      description = 'Full HD with smooth motion';
    } else if (download > 10) {
      quality = '1080p @ 30fps';
      description = 'Full HD quality';
    } else if (download > 5) {
      quality = '720p @ 30fps';
      description = 'HD quality, good for most content';
    } else if (download > 3) {
      quality = '480p @ 30fps';
      description = 'Standard definition';
    } else {
      quality = '360p @ 30fps';
      description = 'Basic quality for slow connections';
    }

    return `
      <div class="quality-rec-card">
        <div class="rec-quality">${quality}</div>
        <div class="rec-description">${description}</div>
      </div>
    `;
  }

  /**
   * Run speed test
   */
  async runSpeedTest() {
    // This would integrate with the existing SpeedTest module
    if (window.syncStreamApp && window.syncStreamApp.notifications) {
      window.syncStreamApp.notifications.info('Speed test feature coming soon!');
    }
  }
}

export default NetworkStatusModal;
