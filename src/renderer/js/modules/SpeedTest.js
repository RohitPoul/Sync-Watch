// Internet Speed Test Module
export class SpeedTest {
  constructor() {
    this.testServers = [
      // Multiple test endpoints for redundancy
      'https://speed.cloudflare.com/__down?bytes=',
      'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png',
      'https://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js'
    ];
    
    this.isRunning = false;
    this.results = null;
  }

  // Main speed test function
  async runSpeedTest(onProgress = null) {
    if (this.isRunning) {
      throw new Error('Speed test already running');
    }

    this.isRunning = true;
    this.results = {
      download: 0,
      upload: 0,
      ping: 0,
      jitter: 0,
      timestamp: new Date()
    };

    try {
      // Step 1: Ping test
      if (onProgress) onProgress('Testing latency...', 10);
      this.results.ping = await this.measurePing();
      this.results.jitter = await this.measureJitter();
      
      // Step 2: Download speed test
      if (onProgress) onProgress('Testing download speed...', 30);
      this.results.download = await this.measureDownloadSpeed();
      
      // Step 3: Upload speed test (using beacon API)
      if (onProgress) onProgress('Testing upload speed...', 70);
      this.results.upload = await this.measureUploadSpeed();
      
      if (onProgress) onProgress('Complete!', 100);
      
      return this.results;
    } finally {
      this.isRunning = false;
    }
  }

  // Measure ping/latency
  async measurePing() {
    const measurements = [];
    
    for (let i = 0; i < 5; i++) {
      const start = performance.now();
      try {
        await fetch('https://www.google.com/generate_204', {
          method: 'HEAD',
          cache: 'no-cache'
        });
        const end = performance.now();
        measurements.push(end - start);
      } catch (error) {
        console.error('Ping measurement failed:', error);
      }
    }
    
    // Return average ping
    return measurements.length > 0 
      ? Math.round(measurements.reduce((a, b) => a + b, 0) / measurements.length)
      : 0;
  }

  // Measure jitter (variation in ping)
  async measureJitter() {
    const pings = [];
    
    for (let i = 0; i < 5; i++) {
      const start = performance.now();
      try {
        await fetch('https://www.google.com/generate_204', {
          method: 'HEAD',
          cache: 'no-cache'
        });
        const end = performance.now();
        pings.push(end - start);
      } catch (error) {
        console.error('Jitter measurement failed:', error);
      }
      await this.sleep(100);
    }
    
    if (pings.length < 2) return 0;
    
    // Calculate jitter as standard deviation
    const mean = pings.reduce((a, b) => a + b, 0) / pings.length;
    const squaredDiffs = pings.map(ping => Math.pow(ping - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / squaredDiffs.length;
    return Math.round(Math.sqrt(avgSquaredDiff));
  }

  // Measure download speed
  async measureDownloadSpeed() {
    const testSizes = [
      { size: 1000000, weight: 0.2 },    // 1 MB
      { size: 5000000, weight: 0.3 },    // 5 MB
      { size: 10000000, weight: 0.5 }    // 10 MB
    ];
    
    const speeds = [];
    
    for (const test of testSizes) {
      try {
        const speed = await this.downloadTest(test.size);
        if (speed > 0) {
          speeds.push({ speed, weight: test.weight });
        }
      } catch (error) {
        console.error('Download test failed:', error);
      }
    }
    
    if (speeds.length === 0) return 0;
    
    // Calculate weighted average
    const weightedSum = speeds.reduce((sum, item) => sum + (item.speed * item.weight), 0);
    const totalWeight = speeds.reduce((sum, item) => sum + item.weight, 0);
    
    return Math.round(weightedSum / totalWeight);
  }

  // Perform single download test
  async downloadTest(bytes) {
    const url = `https://speed.cloudflare.com/__down?bytes=${bytes}`;
    
    const start = performance.now();
    
    try {
      const response = await fetch(url, {
        cache: 'no-cache',
        mode: 'cors'
      });
      
      if (!response.ok) throw new Error('Download failed');
      
      // Read the response to ensure full download
      await response.blob();
      
      const end = performance.now();
      const duration = (end - start) / 1000; // Convert to seconds
      const bits = bytes * 8;
      const bitsPerSecond = bits / duration;
      const mbps = bitsPerSecond / 1000000; // Convert to Mbps
      
      return mbps;
    } catch (error) {
      console.error('Download test error:', error);
      
      // Fallback: Try with a static image
      return this.fallbackDownloadTest();
    }
  }

  // Fallback download test using public CDN
  async fallbackDownloadTest() {
    // Use a public CDN file for testing
    const testUrls = [
      'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      'https://sample-videos.com/img/Sample-jpg-image-1mb.jpg'
    ];
    
    for (const url of testUrls) {
      try {
        const start = performance.now();
        const response = await fetch(url, {
          cache: 'no-cache'
        });
        
        const blob = await response.blob();
        const end = performance.now();
        
        const duration = (end - start) / 1000;
        const bits = blob.size * 8;
        const mbps = (bits / duration) / 1000000;
        
        return mbps;
      } catch (error) {
        continue;
      }
    }
    
    return 0;
  }

  // Measure upload speed (limited in browser)
  async measureUploadSpeed() {
    // Note: Browser limitations make accurate upload testing difficult
    // This is a simplified approach using POST requests
    
    const testData = new Blob([new ArrayBuffer(500000)]); // 500KB test data
    const formData = new FormData();
    formData.append('test', testData);
    
    const start = performance.now();
    
    try {
      // Try to upload to a test endpoint
      const response = await fetch('https://httpbin.org/post', {
        method: 'POST',
        body: formData,
        cache: 'no-cache'
      });
      
      if (!response.ok) throw new Error('Upload failed');
      
      const end = performance.now();
      const duration = (end - start) / 1000;
      const bits = 500000 * 8;
      const mbps = (bits / duration) / 1000000;
      
      return Math.round(mbps * 10) / 10; // Round to 1 decimal
    } catch (error) {
      console.error('Upload test error:', error);
      
      // Estimate based on download speed (usually upload is slower)
      return Math.round(this.results.download * 0.3); // Rough estimate
    }
  }

  // Utility function for delays
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get speed quality rating
  getSpeedRating(mbps) {
    if (mbps >= 100) return { rating: 'Excellent', color: '#10b981', icon: '🚀' };
    if (mbps >= 50) return { rating: 'Very Good', color: '#3b82f6', icon: '⚡' };
    if (mbps >= 25) return { rating: 'Good', color: '#22c55e', icon: '✅' };
    if (mbps >= 10) return { rating: 'Fair', color: '#eab308', icon: '⚠️' };
    if (mbps >= 5) return { rating: 'Poor', color: '#f97316', icon: '🐌' };
    return { rating: 'Very Poor', color: '#ef4444', icon: '❌' };
  }

  // Get streaming quality recommendation
  getStreamingRecommendation(downloadMbps) {
    if (downloadMbps >= 25) {
      return {
        quality: '4K Ultra HD',
        resolution: '2160p',
        description: 'Stream 4K content smoothly'
      };
    } else if (downloadMbps >= 15) {
      return {
        quality: '1080p Full HD',
        resolution: '1080p @ 60fps',
        description: 'Perfect for HD streaming'
      };
    } else if (downloadMbps >= 10) {
      return {
        quality: '1080p HD',
        resolution: '1080p @ 30fps',
        description: 'Good for HD content'
      };
    } else if (downloadMbps >= 5) {
      return {
        quality: '720p HD',
        resolution: '720p',
        description: 'Standard HD streaming'
      };
    } else if (downloadMbps >= 3) {
      return {
        quality: '480p SD',
        resolution: '480p',
        description: 'Basic streaming quality'
      };
    } else {
      return {
        quality: '360p Low',
        resolution: '360p',
        description: 'Limited streaming capability'
      };
    }
  }

  // Format speed for display
  formatSpeed(mbps) {
    if (mbps >= 1000) {
      return `${(mbps / 1000).toFixed(1)} Gbps`;
    }
    return `${mbps.toFixed(1)} Mbps`;
  }
}

// Export singleton instance
export default new SpeedTest();
