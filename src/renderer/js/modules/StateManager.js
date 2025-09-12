// Centralized state management
export class StateManager {
  constructor() {
    this.reset();
  }

  reset() {
    this.socket = null;
    this.currentRoom = null;
    this.currentUser = null;
    this.isAdmin = false;
    this.isHost = false;
    this.users = [];
    this.chatMessages = [];
    this.roomData = null;
    this.videoState = {
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      videoUrl: null,
      title: null,
    };
    // Check for Electron with secure API
    this.isElectron = window.electronAPI && window.electronAPI.isElectron;
    this.electronAPI = window.electronAPI || null;
  }

  setRoomData(data) {
    this.roomData = data;
    this.currentRoom = data.roomId;
    this.isAdmin = data.isAdmin;
    this.users = data.users || [];
  }

  updateUsers(users) {
    this.users = users;
  }

  updateVideoState(state) {
    this.videoState = { ...this.videoState, ...state };
  }

  addChatMessage(message) {
    this.chatMessages.push(message);
    if (this.chatMessages.length > 100) {
      this.chatMessages.shift(); // Keep only last 100 messages
    }
  }
}
