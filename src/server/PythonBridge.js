/**
 * Python Bridge for SyncStream Pro
 * Manages communication with Python services for advanced features
 */

const { spawn } = require('child_process');
const axios = require('axios');
const path = require('path');

class PythonBridge {
  constructor() {
    this.pythonProcess = null;
    this.pythonUrl = 'http://localhost:5555';
    this.isRunning = false;
    this.startupTimeout = 30000; // 30 seconds
    this.retryCount = 0;
    this.maxRetries = 5;
  }

  /**
   * Start the Python service
   */
  async start() {
    if (this.isRunning) {
      console.log('Python service already running');
      return true;
    }

    console.log('Starting Python service...');
    
    try {
      // Check if Python is installed
      const pythonVersion = await this.checkPython();
      console.log(`Python version: ${pythonVersion}`);

      // Start Python server
      const pythonScript = path.join(__dirname, '../../python/server.py');
      const pythonDir = path.join(__dirname, '../../python');
      
      this.pythonProcess = spawn('python', [pythonScript], {
        cwd: pythonDir,
        env: { ...process.env, PYTHONUNBUFFERED: '1' }
      });

      this.pythonProcess.stdout.on('data', (data) => {
        console.log(`[Python]: ${data.toString()}`);
      });

      this.pythonProcess.stderr.on('data', (data) => {
        console.error(`[Python Error]: ${data.toString()}`);
      });

      this.pythonProcess.on('close', (code) => {
        console.log(`Python process exited with code ${code}`);
        this.isRunning = false;
        
        // Auto-restart if crashed (but only if not manually stopped)
        if (code !== 0 && this.retryCount < this.maxRetries && this.pythonProcess) {
          this.retryCount++;
          console.log(`Attempting to restart Python service (${this.retryCount}/${this.maxRetries})...`);
          setTimeout(() => this.start(), 5000);
        } else if (this.retryCount >= this.maxRetries) {
          console.log('Python service failed to start after maximum retries. Running in basic mode.');
        }
      });

      // Wait for service to be ready
      await this.waitForService();
      
      this.isRunning = true;
      this.retryCount = 0;
      console.log('✅ Python service started successfully');
      
      return true;
    } catch (error) {
      console.error('Failed to start Python service:', error);
      return false;
    }
  }

  /**
   * Check if Python is installed
   */
  checkPython() {
    return new Promise((resolve, reject) => {
      const checkProcess = spawn('python', ['--version']);
      
      checkProcess.stdout.on('data', (data) => {
        resolve(data.toString().trim());
      });
      
      checkProcess.stderr.on('data', (data) => {
        // Python 2 outputs version to stderr
        resolve(data.toString().trim());
      });
      
      checkProcess.on('error', () => {
        reject(new Error('Python not found. Please install Python 3.8+'));
      });
    });
  }

  /**
   * Wait for Python service to be ready
   */
  async waitForService() {
    const startTime = Date.now();
    
    while (Date.now() - startTime < this.startupTimeout) {
      try {
        const response = await axios.get(`${this.pythonUrl}/health`, { timeout: 1000 });
        if (response.data.status === 'healthy') {
          return true;
        }
      } catch (error) {
        // Service not ready yet
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error('Python service startup timeout');
  }

  /**
   * Stop the Python service
   */
  stop() {
    if (this.pythonProcess) {
      console.log('Stopping Python service...');
      this.pythonProcess.kill('SIGTERM');
      this.pythonProcess = null;
      this.isRunning = false;
    }
  }

  /**
   * Get network statistics from Python service
   */
  async getNetworkStats() {
    try {
      const response = await axios.get(`${this.pythonUrl}/api/network/stats`);
      return response.data;
    } catch (error) {
      console.error('Failed to get network stats:', error.message);
      return null;
    }
  }

  /**
   * Run a speed test
   */
  async runSpeedTest() {
    try {
      const response = await axios.post(`${this.pythonUrl}/api/network/speed-test`);
      return response.data;
    } catch (error) {
      console.error('Failed to run speed test:', error.message);
      return null;
    }
  }

  /**
   * Test latency to specific hosts
   */
  async testLatency(hosts = ['8.8.8.8', '1.1.1.1']) {
    try {
      const response = await axios.post(`${this.pythonUrl}/api/network/latency`, { hosts });
      return response.data;
    } catch (error) {
      console.error('Failed to test latency:', error.message);
      return null;
    }
  }

  /**
   * Get network interfaces
   */
  async getNetworkInterfaces() {
    try {
      const response = await axios.get(`${this.pythonUrl}/api/network/interfaces`);
      return response.data;
    } catch (error) {
      console.error('Failed to get interfaces:', error.message);
      return null;
    }
  }

  /**
   * Predict buffering for video
   */
  async predictBuffering(bitrate) {
    try {
      const response = await axios.post(`${this.pythonUrl}/api/network/buffer-prediction`, { bitrate });
      return response.data;
    } catch (error) {
      console.error('Failed to predict buffering:', error.message);
      return null;
    }
  }

  /**
   * Get video information
   */
  async getVideoInfo(videoPath) {
    try {
      const response = await axios.post(`${this.pythonUrl}/api/video/info`, { path: videoPath });
      return response.data;
    } catch (error) {
      console.error('Failed to get video info:', error.message);
      return null;
    }
  }

  /**
   * Extract video thumbnail
   */
  async extractThumbnail(videoPath, timestamp = 1.0) {
    try {
      const response = await axios.post(`${this.pythonUrl}/api/video/thumbnail`, { 
        path: videoPath, 
        timestamp 
      });
      return response.data;
    } catch (error) {
      console.error('Failed to extract thumbnail:', error.message);
      return null;
    }
  }

  /**
   * Get video optimization settings
   */
  async getOptimizationSettings(videoPath, quality = '720p') {
    try {
      const response = await axios.post(`${this.pythonUrl}/api/video/optimize`, { 
        path: videoPath, 
        quality 
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get optimization settings:', error.message);
      return null;
    }
  }

  /**
   * Get system resources
   */
  async getSystemResources() {
    try {
      const response = await axios.get(`${this.pythonUrl}/api/system/resources`);
      return response.data;
    } catch (error) {
      console.error('Failed to get system resources:', error.message);
      return null;
    }
  }

  /**
   * Get optimized settings based on system
   */
  async getOptimizedSettings() {
    try {
      const response = await axios.get(`${this.pythonUrl}/api/system/optimize-settings`);
      return response.data;
    } catch (error) {
      console.error('Failed to get optimized settings:', error.message);
      return null;
    }
  }

  /**
   * Setup periodic stats broadcasting to clients
   */
  setupStatsBroadcast(io, roomManager) {
    if (!this.isRunning) return;
    
    // Broadcast network stats every 2 seconds
    setInterval(async () => {
      const stats = await this.getNetworkStats();
      if (stats && roomManager.room) {
        io.to(roomManager.room.id).emit('network-stats', stats);
      }
    }, 2000);

    // Broadcast system resources every 5 seconds
    setInterval(async () => {
      const resources = await this.getSystemResources();
      if (resources && roomManager.room) {
        io.to(roomManager.room.id).emit('system-resources', resources);
      }
    }, 5000);
  }
}

module.exports = PythonBridge;
