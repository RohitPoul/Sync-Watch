export class NetworkMonitor {
  constructor(ui) {
    this.ui = ui;
    this.stats = {
      downloadSpeed: 0,
      uploadSpeed: 0,
      latency: 0,
      connectionQuality: 'good',
      lastBytes: { received: 0, sent: 0 },
      lastTime: Date.now()
    };
    
    this.isMonitoring = false;
    this.monitorInterval = null;
    this.speedTestInterval = null;
  }
  
  startMonitoring() {
    if (this.isMonitoring) return;
    this.isMonitoring = true;
    
    // Monitor connection changes
    this.monitorConnection();
    
    // Start speed monitoring
    this.startSpeedTest();
    
    // Update UI every second
    this.monitorInterval = setInterval(() => {
      this.updateNetworkDisplay();
    }, 1000);
    
    console.log('Network monitoring started');
  }
  
  stopMonitoring() {
    this.isMonitoring = false;
    
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
    
    if (this.speedTestInterval) {
      clearInterval(this.speedTestInterval);
      this.speedTestInterval = null;
    }
    
    console.log('Network monitoring stopped');
  }
  
  monitorConnection() {
    // Monitor online/offline status
    window.addEventListener('online', () => {
      this.ui.showToast('Internet connection restored', 'success');
      this.stats.connectionQuality = 'good';
    });
    
    window.addEventListener('offline', () => {
      this.ui.showToast('Internet connection lost', 'error');
      this.stats.connectionQuality = 'offline';
    });
    
    // Monitor connection type changes
    if ('connection' in navigator) {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      
      if (connection) {
        connection.addEventListener('change', () => {
          this.updateConnectionInfo();
        });
        
        this.updateConnectionInfo();
      }
    }
  }
  
  updateConnectionInfo() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    if (connection) {
      // Get effective connection type
      const effectiveType = connection.effectiveType || 'unknown';
      const downlink = connection.downlink || 0;
      const rtt = connection.rtt || 0;
      
      // Update stats
      this.stats.connectionType = effectiveType;
      this.stats.theoreticalSpeed = downlink;
      this.stats.latency = rtt;
      
      // Determine quality based on effective type
      switch(effectiveType) {
        case '4g':
          this.stats.connectionQuality = 'excellent';
          break;
        case '3g':
          this.stats.connectionQuality = 'good';
          break;
        case '2g':
          this.stats.connectionQuality = 'poor';
          break;
        case 'slow-2g':
          this.stats.connectionQuality = 'very-poor';
          break;
        default:
          this.stats.connectionQuality = 'unknown';
      }
      
      console.log('Connection info updated:', {
        type: effectiveType,
        downlink: downlink,
        rtt: rtt,
        quality: this.stats.connectionQuality
      });
    }
  }
  
  async startSpeedTest() {
    // Perform speed test every 10 seconds
    this.speedTestInterval = setInterval(async () => {
      await this.measureSpeed();
    }, 10000);
    
    // Initial test
    await this.measureSpeed();
  }
  
  async measureSpeed() {
    try {
      // Measure download speed with a small test file
      const downloadStart = performance.now();
      const testUrl = `https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png?nocache=${Date.now()}`;
      
      const response = await fetch(testUrl, { 
        cache: 'no-cache',
        mode: 'no-cors'
      });
      
      const downloadEnd = performance.now();
      const downloadTime = (downloadEnd - downloadStart) / 1000; // Convert to seconds
      
      // Estimate based on typical size of Google logo (around 5KB)
      const estimatedSize = 5 * 1024; // 5KB in bytes
      const downloadSpeed = (estimatedSize * 8) / downloadTime / 1000000; // Convert to Mbps
      
      this.stats.downloadSpeed = Math.min(downloadSpeed, 1000); // Cap at 1000 Mbps
      
      // Measure latency with a simple ping
      const pingStart = performance.now();
      
      // Check if we're in a file:// protocol or electron environment
      if (window.location.protocol === 'file:' || window.location.hostname === 'localhost') {
        // Use a public endpoint for latency testing
        await fetch('https://www.google.com/generate_204', { 
          method: 'HEAD',
          mode: 'no-cors',
          cache: 'no-cache'
        }).catch(() => {}); // Ignore errors
      } else {
        // Use local health endpoint
        await fetch(window.location.origin + '/health', { 
          method: 'HEAD',
          cache: 'no-cache'
        }).catch(() => {}); // Ignore errors
      }
      
      const pingEnd = performance.now();
      this.stats.latency = Math.round(pingEnd - pingStart);
      
      // Estimate upload speed (usually 10-50% of download for home connections)
      this.stats.uploadSpeed = this.stats.downloadSpeed * 0.3;
      
      // Determine overall quality
      this.determineQuality();
      
    } catch (error) {
      console.error('Speed test error:', error);
    }
  }
  
  determineQuality() {
    const download = this.stats.downloadSpeed;
    const latency = this.stats.latency;
    
    if (download > 50 && latency < 20) {
      this.stats.connectionQuality = 'excellent';
    } else if (download > 25 && latency < 50) {
      this.stats.connectionQuality = 'good';
    } else if (download > 10 && latency < 100) {
      this.stats.connectionQuality = 'fair';
    } else if (download > 5) {
      this.stats.connectionQuality = 'poor';
    } else {
      this.stats.connectionQuality = 'very-poor';
    }
  }
  
  formatSpeed(speedMbps) {
    if (speedMbps < 1) {
      return `${(speedMbps * 1000).toFixed(0)} Kbps`;
    } else if (speedMbps < 100) {
      return `${speedMbps.toFixed(1)} Mbps`;
    } else {
      return `${speedMbps.toFixed(0)} Mbps`;
    }
  }
  
  getQualityColor() {
    switch(this.stats.connectionQuality) {
      case 'excellent': return '#10b981';
      case 'good': return '#3b82f6';
      case 'fair': return '#f59e0b';
      case 'poor': return '#ef4444';
      case 'very-poor': return '#991b1b';
      default: return '#6b7280';
    }
  }
  
  getQualityIcon() {
    switch(this.stats.connectionQuality) {
      case 'excellent': return '🚀';
      case 'good': return '✅';
      case 'fair': return '⚠️';
      case 'poor': return '⚡';
      case 'very-poor': return '❌';
      case 'offline': return '🔌';
      default: return '📡';
    }
  }
  
  updateNetworkDisplay() {
    // Update network stats in UI
    const statsContainer = document.getElementById('network-stats');
    if (statsContainer) {
      statsContainer.innerHTML = `
        <div class="network-stats-grid">
          <div class="stat-item">
            <div class="stat-label">Download</div>
            <div class="stat-value">${this.formatSpeed(this.stats.downloadSpeed)}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Upload</div>
            <div class="stat-value">${this.formatSpeed(this.stats.uploadSpeed)}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Latency</div>
            <div class="stat-value">${this.stats.latency}ms</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Quality</div>
            <div class="stat-value" style="color: ${this.getQualityColor()}">
              ${this.getQualityIcon()} ${this.stats.connectionQuality}
            </div>
          </div>
        </div>
      `;
    }
    
    // Update compact display (for navbar)
    const compactDisplay = document.getElementById('network-status');
    if (compactDisplay) {
      compactDisplay.innerHTML = `
        <span style="color: ${this.getQualityColor()}">
          ${this.getQualityIcon()} 
          ↓ ${this.formatSpeed(this.stats.downloadSpeed)} 
          ↑ ${this.formatSpeed(this.stats.uploadSpeed)}
          | ${this.stats.latency}ms
        </span>
      `;
    }
  }
  
  getStats() {
    return { ...this.stats };
  }
  
  // Get recommended quality based on network speed
  getRecommendedQuality() {
    const download = this.stats.downloadSpeed;
    
    if (download > 50) return '4k60';
    if (download > 25) return '1440p60';
    if (download > 15) return '1080p60';
    if (download > 10) return '1080p30';
    if (download > 5) return '720p30';
    if (download > 3) return '480p30';
    return '360p30';
  }
}
