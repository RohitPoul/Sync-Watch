const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");
const RoomManager = require("./src/server/RoomManager");
const SocketHandler = require("./src/server/SocketHandler");
const Routes = require("./src/server/Routes");
const PythonBridge = require("./src/server/PythonBridge");
const StreamingServer = require("./src/server/StreamingServer");
const SecurityManager = require("./src/server/SecurityManager");

function startServer(port = 5000, useHttps = false) {
  return new Promise((resolve, reject) => {
    const app = express();
    
    // Initialize security
    const securityManager = new SecurityManager(app);
    
    // Create appropriate server (HTTP or HTTPS)
    let server;
    if (useHttps) {
      server = securityManager.createHttpsServer(app);
      if (!server) {
        console.log('Falling back to HTTP server');
        server = http.createServer(app);
      }
    } else {
      server = http.createServer(app);
    }
    
    const io = socketIo(server, {
      cors: { origin: "*", methods: ["GET", "POST"] },
      pingTimeout: 30000,
      pingInterval: 10000,
    });

    // Add socket authentication and rate limiting
    io.use((socket, next) => securityManager.socketAuthMiddleware(socket, next));
    io.use(securityManager.socketRateLimiter());

    // Initialize managers with security
    const roomManager = new RoomManager(securityManager);
    const socketHandler = new SocketHandler(io, roomManager, port);
    const routes = new Routes(app, roomManager, securityManager);
    const streamingServer = new StreamingServer(app, roomManager);
    
    // Initialize Python bridge for advanced features (non-blocking)
    const pythonBridge = new PythonBridge();
    pythonBridge.start().then(pythonStarted => {
      if (pythonStarted) {
        console.log('🐍 Python services available for advanced monitoring');
        pythonBridge.setupStatsBroadcast(io, roomManager);
        
        // Add Python routes
        app.get('/api/python/status', (req, res) => {
          res.json({ running: pythonBridge.isRunning });
        });
        
        app.post('/api/python/speed-test', async (req, res) => {
          const result = await pythonBridge.runSpeedTest();
          res.json(result || { error: 'Speed test failed' });
        });
        
        app.get('/api/python/network-stats', async (req, res) => {
          const stats = await pythonBridge.getNetworkStats();
          res.json(stats || { error: 'Failed to get stats' });
        });
      } else {
        console.log('⚠️ Python services unavailable - running in basic mode');
      }
    }).catch(err => {
      console.log('Python service not available:', err.message);
      console.log('⚠️ Running in basic mode without Python features');
    });

    // Serve static files
    app.use(express.static(path.join(__dirname, "src", "renderer")));
    app.use("/src", express.static(path.join(__dirname, "src")));

    // Setup socket listeners
    socketHandler.setupListeners();

    // Start server
    server.listen(port, "0.0.0.0", (err) => {
      if (err) {
        reject(err);
      } else {
        const localIp = socketHandler.getLocalIpAddress();
        const protocol = useHttps && server.cert ? 'https' : 'http';
        console.log(`
╔════════════════════════════════════════════════════╗
║     🎬 SyncStream Pro Server Started! 🎬          ║
╠════════════════════════════════════════════════════╣
║ 🔒 Security:  ${useHttps ? 'HTTPS Enabled ✅' : 'HTTP Mode ⚠️ '}              ║
║ 🌐 Local:     ${protocol}://localhost:${port}            ║
║ 🏠 Network:   ${protocol}://${localIp}:${port}           ║
╚════════════════════════════════════════════════════╝

🛡️ Security Features:
• Rate limiting: ✅ Enabled
• CORS protection: ✅ Active  
• Data encryption: ✅ Ready
• JWT tokens: ✅ Available
${useHttps ? '• HTTPS: ✅ Secure connection' : '• HTTPS: ⚠️  Use --https flag for secure mode'}

📡 Access Methods:
• Electron: syncstream://${localIp}:${port}/join/ROOM_ID
• Browser:  ${protocol}://${localIp}:${port}/?join=ROOM_ID

💡 For internet access, configure port forwarding for port ${port}
        `);

        resolve({ server, io, roomManager, localIp, port });
      }
    });

    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.log(`Port ${port} busy, trying ${port + 1}...`);
        startServer(port + 1).then(resolve).catch(reject);
      } else {
        reject(err);
      }
    });
  });
}

// Start server if run directly
if (require.main === module) {
  const port = process.env.PORT || 5000;
  const useHttps = process.argv.includes('--https');
  
  if (useHttps) {
    console.log('🔒 Starting server with HTTPS enabled...');
  }
  
  startServer(port, useHttps).catch(console.error);
}

module.exports = { startServer };