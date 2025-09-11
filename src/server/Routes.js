const path = require("path");
const os = require("os");
const axios = require("axios");
const express = require("express");

class Routes {
  constructor(app, roomManager, securityManager = null) {
    this.app = app;
    this.roomManager = roomManager;
    this.securityManager = securityManager;
    this.setupRoutes();
  }

  setupRoutes() {
    // Main page route
    this.app.get("/", (req, res) => {
      res.sendFile(path.join(__dirname, "..", "renderer", "index.html"));
    });

    // Room join redirect
    this.app.get("/join/:roomId", (req, res) => {
      res.redirect(`/?join=${req.params.roomId}`);
    });

    // API endpoints
    this.app.get("/api/room/:roomId/info", (req, res) => {
      const roomInfo = this.roomManager.getRoomInfo(req.params.roomId);
      
      if (!roomInfo) {
        return res.status(404).json({ error: "Room not found" });
      }

      res.json(roomInfo);
    });

    // Network info endpoint
    this.app.get("/api/network-info", (req, res) => {
      const networkInfo = {
        localIp: this.getLocalIpAddress(),
        port: process.env.PORT || 5000,
        hostname: os.hostname(),
      };
      res.json(networkInfo);
    });

    // Public IP endpoint
    this.app.get("/api/public-ip", async (req, res) => {
      try {
        const publicIP = await this.getPublicIP();
        res.json({ 
          publicIP,
          localIP: this.getLocalIpAddress(),
          port: process.env.PORT || 5000,
          publicUrl: publicIP ? `http://${publicIP}:${process.env.PORT || 5000}` : null
        });
      } catch (error) {
        res.status(500).json({ 
          error: "Failed to detect public IP",
          localIP: this.getLocalIpAddress() 
        });
      }
    });

    // Health check
    this.app.get("/health", (req, res) => {
      res.json({
        status: "healthy",
        hasRoom: !!this.roomManager.room,
        roomUsers: this.roomManager.room ? this.roomManager.room.users.size : 0,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        networkInfo: {
          localIp: this.getLocalIpAddress(),
          port: process.env.PORT || 5000,
        },
      });
    });
  }

  getLocalIpAddress() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === "IPv4" && !iface.internal) {
          return iface.address;
        }
      }
    }
    return "127.0.0.1";
  }

  async getPublicIP() {
    // Try multiple services for redundancy
    const services = [
      'https://api.ipify.org?format=json',
      'https://ipapi.co/json/',
      'https://api.myip.com'
    ];
    
    for (const service of services) {
      try {
        const response = await axios.get(service, { timeout: 3000 });
        const ip = response.data.ip || response.data.IPv4 || response.data['ip-address'];
        if (ip) return ip;
      } catch (error) {
        console.log(`Failed to get IP from ${service}`);
        continue;
      }
    }
    
    throw new Error('Could not detect public IP from any service');
  }
}

module.exports = Routes;
