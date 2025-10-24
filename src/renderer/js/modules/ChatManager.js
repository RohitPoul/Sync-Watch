// Enhanced Chat functionality management
export class ChatManager {
  constructor(state, socket, ui) {
    this.state = state;
    this.socket = socket;
    this.ui = ui;
    this.messages = [];
    this.unreadCount = 0;
    this.isVisible = false;
    this.typingUsers = new Set();
    this.typingTimeout = null;
    this.init();
  }

  init() {
    this.setupChatControls();
    this.setupTypingIndicator();
  }

  setupChatControls() {
    // Clear chat button
    document.getElementById('clear-chat')?.addEventListener('click', () => {
      this.clearChat();
    });

    // Chat input for typing indicator
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
      let isTyping = false;
      
      chatInput.addEventListener('input', () => {
        if (!isTyping && chatInput.value.length > 0) {
          isTyping = true;
          this.socket.emit('typing', { 
            isTyping: true,
            userName: this.state.currentUser?.name || 'User'
          });
        } else if (isTyping && chatInput.value.length === 0) {
          isTyping = false;
          this.socket.emit('typing', { 
            isTyping: false,
            userName: this.state.currentUser?.name || 'User'
          });
        }

        // Clear existing timeout
        if (this.typingTimeout) {
          clearTimeout(this.typingTimeout);
        }

        // Set new timeout to stop typing after 2 seconds of inactivity
        this.typingTimeout = setTimeout(() => {
          if (isTyping) {
            isTyping = false;
            this.socket.emit('typing', { 
              isTyping: false,
              userName: this.state.currentUser?.name || 'User'
            });
          }
        }, 2000);
      });

      // Stop typing when message is sent
      chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          if (this.typingTimeout) {
            clearTimeout(this.typingTimeout);
          }
          isTyping = false;
          this.socket.emit('typing', { 
            isTyping: false,
            userName: this.state.currentUser?.name || 'User'
          });
        }
      });
    }

    // Tab visibility tracking
    const chatTab = document.querySelector('[data-tab="chat"]');
    if (chatTab) {
      chatTab.addEventListener('click', () => {
        this.isVisible = true;
        this.clearUnread();
      });
    }

    document.querySelectorAll('.tab-btn:not([data-tab="chat"])')?.forEach(btn => {
      btn.addEventListener('click', () => {
        this.isVisible = false;
      });
    });
  }

  setupTypingIndicator() {
    // Create typing indicator element if it doesn't exist
    const chatInputContainer = document.querySelector('.chat-input-container');
    if (chatInputContainer && !document.getElementById('typing-indicator')) {
      const typingIndicator = document.createElement('div');
      typingIndicator.id = 'typing-indicator';
      typingIndicator.className = 'typing-indicator';
      typingIndicator.style.display = 'none';
      typingIndicator.innerHTML = `
        <div class="typing-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <span class="typing-text"></span>
      `;
      chatInputContainer.parentNode.insertBefore(typingIndicator, chatInputContainer);
    }
  }

  sendMessage() {
    const input = document.getElementById('chat-input');
    if (!input) return;

    const message = input.value.trim();
    if (message && this.socket) {
      this.socket.emit('chat-message', { message });
      input.value = '';
    }
  }

  addMessage(data) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;

    // Remove welcome message if it exists
    const welcomeMsg = chatMessages.querySelector('.chat-welcome');
    if (welcomeMsg) {
      welcomeMsg.remove();
    }

    const messageEl = document.createElement('div');
    messageEl.className = `chat-message ${data.isOwn ? 'own' : ''}`;
    
    const time = new Date(data.timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    messageEl.innerHTML = `
      <div class="message-header">
        <span class="message-user">${data.user}${data.isAdmin ? ' 👑' : ''}</span>
        <span class="message-time">${time}</span>
      </div>
      <div class="message-content">${this.escapeHtml(data.message)}</div>
    `;

    chatMessages.appendChild(messageEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Update unread count if not visible
    if (!this.isVisible) {
      this.unreadCount++;
      this.updateUnreadBadge();
    }

    // Play sound for new messages (not own)
    if (!data.isOwn) {
      this.playMessageSound();
    }
  }

  addSystemMessage(text, type = 'info') {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;

    // Remove welcome message if it exists
    const welcomeMsg = chatMessages.querySelector('.chat-welcome');
    if (welcomeMsg) {
      welcomeMsg.remove();
    }

    const messageEl = document.createElement('div');
    messageEl.className = `system-message ${type}`;
    
    const time = new Date().toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    const icon = type === 'join' ? '👋' : type === 'leave' ? '👋' : type === 'disconnect' ? '🔌' : 'ℹ️';

    messageEl.innerHTML = `
      <span class="system-icon">${icon}</span>
      <span class="system-text">${text}</span>
      <span class="system-time">${time}</span>
    `;

    chatMessages.appendChild(messageEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  updateTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (!indicator) return;

    if (this.typingUsers.size > 0) {
      const typingText = indicator.querySelector('.typing-text');
      const users = Array.from(this.typingUsers);
      
      if (users.length === 1) {
        typingText.textContent = `${users[0]} is typing...`;
      } else if (users.length === 2) {
        typingText.textContent = `${users[0]} and ${users[1]} are typing...`;
      } else {
        typingText.textContent = `${users.length} people are typing...`;
      }
      
      indicator.style.display = 'flex';
    } else {
      indicator.style.display = 'none';
    }
  }

  clearChat() {
    const chatMessages = document.getElementById('chat-messages');
    if (chatMessages) {
      chatMessages.innerHTML = `
        <div class="chat-welcome">
          <div class="welcome-message">
            <span>💬</span>
            <p>Chat cleared. Start a new conversation!</p>
          </div>
        </div>
      `;
    }
    
    // Reset chat counter
    this.unreadCount = 0;
    this.updateUnreadBadge();
    
    // Clear messages array
    this.messages = [];
  }

  clearUnread() {
    this.unreadCount = 0;
    this.updateUnreadBadge();
  }

  updateUnreadBadge() {
    const chatTabCount = document.getElementById('chat-tab-count');
    if (chatTabCount) {
      if (this.unreadCount > 0) {
        chatTabCount.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
        chatTabCount.style.display = 'block';
      } else {
        chatTabCount.style.display = 'none';
      }
    }
  }

  playMessageSound() {
    // Create and play a notification sound
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiS2Oy9diMFl2z22qMFAViCx9CtdC0FKHzL8daOOgkaZrrn569VFApGnt/vvGwhCDiS2Ou8dSEFlGz02aQGAViFx8+udS0FKHzL8dWOOgkaZrrn569VFApGnt/vvGwhCDiS2Ou8dSEFlGz02aQGAViFx8+udS0FKHzL8dWOOgkaZrrn569VFApGnt/vvGwhCDiS2Ou8dSEFlGz02aQGAViFx8+udS0FKHzL8dWOOgkaZrrn569VFApGnt/vvGwhCDiS2Ou8dSEFlGz02aQGAViFx8+udS0FKHzL8dWOOgkaZrrn569VFApGnt/vvGwhCDiS2Ou8dSEFlGz02aQGAViFx8+udS0FKHzL8dWOOgkaZrrn769UFApGnt/vvGwhCDiS2Ou8dSEFlGz02aQGAViFx8+udS0FKHzL8dWOOgkaZrrn769UFApGnt/vvGwhCDiS2Ou8dSEFlGz02aQGAViFx8+udS0FKH3L8dWOOgkaZrrn769UFApGnt/vvGwhCDiS2Ou8dSEFlGz02aQGAViFx8+udS0FKH3L8dWOOgkaZrrn769UFApGnt/vvGwhCDiS2Ou8dSEFlGz02aQGAViFx8+udS0FKH3L8dWOOgkaZrrn769UFApGnt/vvGwhCDiS2Ou8dSEFlGz02aQGAViFx8+udS0FKH3L8dWOOgkaZrrn769UFApGnt/vvGwhCDiS2Ou8dSEFlGz02aQGAViFx8+udS0FKH3L8dWOOgkaZrrn769UFApGnt/vvGwhCDiS2Ou8dSEFlGz02aQGAViFx8+udS0FKH3L8dWOOgkaZrrn769UFApGnt/vvGwhCDiS2Ou8dSEFlGz02aQGAViFx8+udS0FKH3L8dWOOgkaZrrn769UFApGnt/vvGwhCDiS2Ou8dSEFlGz02aQGAViFx8+udS0FKH3L8dWOOgkaZrrn769UFApGnt/vvGwhCDiS2Ou8dSEFlGz02aQGAViFx8+udS0FKH3L8dWOOgkaZrrn769UFApGnt/vvGwhCDiS2Ou8dSEFlGz02aQGAViFx8+udS0FKH3L8dWOOgkaZrrn769UFApGnt/vvGwhCDiS2Ou8dSEFlGz02aQGAViFx8+udS0FKH3L8dWOOgkaZrrn769UFApGnt/vvGwhCDiS2Ou8dSEFlGz02aQGAViFx8+udS0FKH3L8dWOOgkaZrrn769UFApGnt/vvGwhCDiS2Ou8dSEFlGz02aQGAViFx8+udS0FKH3L8dWOOgkaZrrn769UFApGnt/vvGwhCDiS2Ou8dSEFlGz02aQGAViFx8+udS0FKH3L8dWOOgkaZrrn769UFApGnt/vvGwhCDiS2Ou8dSEFlGz02aQGAViFx8+udS0FKH3L8dWOOgkaZrrn769UFApGnt/vvGwhCDiS2Ou8dSEFlGz02aQGAViFx8+udS0FKH3L8dWOOgkaZrrn769UFApGnt/vvGwhCDiS2Ou8dSEFlGz02aQGAViFx8+udS0FKH3L8dWOOgkaZrrn769UFApGnt/vvGwhCDiS2Ou8dSEFlGz02aQGAViFx8+udS0FKH3L8dWOOgkaZrrn769UFApGnt/vvGwhCDiS2Ou8dSEFlGz02aQGAViFx8+udS0FKH3L8dWOOgkaZrrn769UFApGnt/vvGwhCDiS2Ou8dSEFlGz02aQGAViFx8+udS0FKH3L8dWOOgkaZrrn76');
    audio.volume = 0.3;
    audio.play().catch(() => {
      // Ignore errors if sound can't play
    });
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}