const { v4: uuidv4 } = require("uuid");

class RoomManager {
  constructor(securityManager = null) {
    this.room = null; // Single room per server
    this.securityManager = securityManager;
  }

  createRoom(data) {
    const roomId = this.securityManager 
      ? this.securityManager.generateSecureRoomId() 
      : this.generateRoomId();
    
    // Hash password if security manager is available
    const hashedPassword = data.password && this.securityManager 
      ? this.securityManager.hashPassword(data.password)
      : data.password || "";
    
    this.room = {
      id: roomId,
      name: data.roomName || "My Room",
      password: hashedPassword,
      privacy: data.privacy || "private",
      maxUsers: parseInt(data.maxUsers) || 10,
      admin: null,
      users: new Map(),
      videoState: {
        videoUrl: null,
        videoType: null,
        currentTime: 0,
        isPlaying: false,
        title: null,
      },
      qualitySettings: data.qualitySettings || null,
      streamingConfig: data.streamingConfig || null,
      createdAt: new Date(),
    };

    console.log(`Room created: ${roomId}`);
    return this.room;
  }

  generateRoomId() {
    const chars = "ABCDEFGHIJKLMNPQRSTUVWXYZ123456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  addUser(socketId, userData) {
    if (!this.room) return null;

    const user = {
      id: socketId,
      name: userData.name,
      isAdmin: this.room.users.size === 0,
      joinedAt: new Date(),
    };

    if (user.isAdmin) {
      this.room.admin = socketId;
    }

    this.room.users.set(socketId, user);
    console.log(`${userData.name} joined (Admin: ${user.isAdmin})`);
    return user;
  }

  removeUser(socketId) {
    if (!this.room) return null;

    const user = this.room.users.get(socketId);
    this.room.users.delete(socketId);

    if (user) {
      console.log(`${user.name} left`);
    }

    // Reassign admin if needed
    if (this.room.admin === socketId && this.room.users.size > 0) {
      const newAdminId = Array.from(this.room.users.keys())[0];
      this.room.admin = newAdminId;
      this.room.users.get(newAdminId).isAdmin = true;
      return { newAdmin: this.room.users.get(newAdminId) };
    }

    return null;
  }

  getUsers() {
    return this.room ? Array.from(this.room.users.values()) : [];
  }

  updateVideoState(newState) {
    if (this.room) {
      this.room.videoState = { ...this.room.videoState, ...newState };
    }
  }

  getRoomInfo(roomId) {
    if (!this.room || this.room.id !== roomId.toUpperCase()) {
      return null;
    }

    return {
      id: this.room.id,
      name: this.room.name,
      userCount: this.room.users.size,
      maxUsers: this.room.maxUsers,
      hasVideo: !!this.room.videoState.videoUrl,
      isPrivate: this.room.privacy === "private",
      qualitySettings: this.room.qualitySettings,
    };
  }
}

module.exports = RoomManager;
