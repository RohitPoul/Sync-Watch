/**
 * KeyboardNavigationManager - Handles keyboard shortcuts and navigation
 * Task 10.1: Add keyboard navigation
 * 
 * Features:
 * - ESC to close modals
 * - Space for play/pause
 * - Arrow keys for seek
 * - M for mute
 * - F for fullscreen
 * - Tab navigation with focus indicators
 * - Keyboard shortcuts for common actions
 */

export class KeyboardNavigationManager {
  constructor() {
    this.shortcuts = new Map();
    this.isKeyboardUser = false;
    this.init();
  }

  init() {
    // Detect keyboard usage
    this.detectKeyboardUsage();
    
    // Register default shortcuts
    this.registerDefaultShortcuts();
    
    // Set up global keyboard listener
    this.setupGlobalListener();
    
    // Ensure logical tab order
    this.ensureTabOrder();
  }

  /**
   * Detect if user is navigating with keyboard
   */
  detectKeyboardUsage() {
    // Add class to body when Tab is pressed
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        this.isKeyboardUser = true;
        document.body.classList.add('keyboard-navigation');
      }
    });

    // Remove class when mouse is used
    document.addEventListener('mousedown', () => {
      this.isKeyboardUser = false;
      document.body.classList.remove('keyboard-navigation');
    });
  }

  /**
   * Register default keyboard shortcuts
   */
  registerDefaultShortcuts() {
    // ESC - Close modals
    this.registerShortcut('Escape', () => {
      const activeModal = document.querySelector('.modal-overlay.active');
      if (activeModal) {
        const closeBtn = activeModal.querySelector('.modal-close');
        if (closeBtn) closeBtn.click();
        return true; // Prevent default
      }
      return false;
    }, 'Close modal');

    // Space - Play/Pause video
    this.registerShortcut(' ', (e) => {
      // Don't trigger if typing in input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return false;
      }
      
      const playPauseBtn = document.getElementById('play-pause-btn');
      if (playPauseBtn && !playPauseBtn.disabled) {
        playPauseBtn.click();
        return true;
      }
      return false;
    }, 'Play/Pause');

    // K - Alternative play/pause (YouTube-style)
    this.registerShortcut('k', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return false;
      }
      
      const playPauseBtn = document.getElementById('play-pause-btn');
      if (playPauseBtn && !playPauseBtn.disabled) {
        playPauseBtn.click();
        return true;
      }
      return false;
    }, 'Play/Pause');

    // M - Mute/Unmute
    this.registerShortcut('m', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return false;
      }
      
      const volumeBtn = document.getElementById('volume-btn');
      if (volumeBtn) {
        volumeBtn.click();
        return true;
      }
      return false;
    }, 'Mute/Unmute');

    // F - Fullscreen
    this.registerShortcut('f', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return false;
      }
      
      const fullscreenBtn = document.getElementById('fullscreen-btn');
      if (fullscreenBtn) {
        fullscreenBtn.click();
        return true;
      }
      return false;
    }, 'Fullscreen');

    // Arrow Left - Seek backward 5 seconds
    this.registerShortcut('ArrowLeft', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return false;
      }
      
      const video = document.getElementById('main-video');
      if (video && !isNaN(video.duration)) {
        video.currentTime = Math.max(0, video.currentTime - 5);
        this.announceToScreenReader(`Seeked backward 5 seconds to ${this.formatTime(video.currentTime)}`);
        return true;
      }
      return false;
    }, 'Seek backward 5s');

    // Arrow Right - Seek forward 5 seconds
    this.registerShortcut('ArrowRight', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return false;
      }
      
      const video = document.getElementById('main-video');
      if (video && !isNaN(video.duration)) {
        video.currentTime = Math.min(video.duration, video.currentTime + 5);
        this.announceToScreenReader(`Seeked forward 5 seconds to ${this.formatTime(video.currentTime)}`);
        return true;
      }
      return false;
    }, 'Seek forward 5s');

    // Arrow Up - Increase volume
    this.registerShortcut('ArrowUp', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return false;
      }
      
      const volumeSlider = document.querySelector('.volume-slider');
      const video = document.getElementById('main-video');
      if (volumeSlider && video) {
        const newVolume = Math.min(100, parseInt(volumeSlider.value) + 10);
        volumeSlider.value = newVolume;
        video.volume = newVolume / 100;
        this.announceToScreenReader(`Volume ${newVolume}%`);
        return true;
      }
      return false;
    }, 'Volume up');

    // Arrow Down - Decrease volume
    this.registerShortcut('ArrowDown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return false;
      }
      
      const volumeSlider = document.querySelector('.volume-slider');
      const video = document.getElementById('main-video');
      if (volumeSlider && video) {
        const newVolume = Math.max(0, parseInt(volumeSlider.value) - 10);
        volumeSlider.value = newVolume;
        video.volume = newVolume / 100;
        this.announceToScreenReader(`Volume ${newVolume}%`);
        return true;
      }
      return false;
    }, 'Volume down');

    // C - Toggle chat (if sidebar is available)
    this.registerShortcut('c', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return false;
      }
      
      const chatTab = document.querySelector('[data-tab="chat"]');
      if (chatTab) {
        chatTab.click();
        return true;
      }
      return false;
    }, 'Open chat');

    // U - Toggle users list
    this.registerShortcut('u', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return false;
      }
      
      const usersTab = document.querySelector('[data-tab="users"]');
      if (usersTab) {
        usersTab.click();
        return true;
      }
      return false;
    }, 'Open users');

    // S - Toggle sidebar
    this.registerShortcut('s', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return false;
      }
      
      const sidebarToggle = document.getElementById('sidebar-toggle');
      if (sidebarToggle) {
        sidebarToggle.click();
        return true;
      }
      return false;
    }, 'Toggle sidebar');

    // ? - Show keyboard shortcuts help
    this.registerShortcut('?', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return false;
      }
      
      this.showKeyboardShortcutsHelp();
      return true;
    }, 'Show shortcuts');
  }

  /**
   * Register a keyboard shortcut
   * @param {string} key - The key to listen for
   * @param {Function} handler - The function to call when key is pressed
   * @param {string} description - Description of what the shortcut does
   */
  registerShortcut(key, handler, description = '') {
    this.shortcuts.set(key.toLowerCase(), {
      handler,
      description
    });
  }

  /**
   * Set up global keyboard event listener
   */
  setupGlobalListener() {
    document.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      const shortcut = this.shortcuts.get(key);
      
      if (shortcut) {
        const shouldPreventDefault = shortcut.handler(e);
        if (shouldPreventDefault) {
          e.preventDefault();
        }
      }
    });
  }

  /**
   * Ensure logical tab order for all interactive elements
   */
  ensureTabOrder() {
    // Set tabindex for elements that should be focusable
    const focusableElements = [
      'button:not([disabled])',
      'a[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ];

    // Ensure all interactive elements are keyboard accessible
    document.querySelectorAll(focusableElements.join(',')).forEach((element, index) => {
      if (!element.hasAttribute('tabindex')) {
        element.setAttribute('tabindex', '0');
      }
    });

    // Make icon-only buttons more accessible
    document.querySelectorAll('.icon-btn, .control-btn').forEach(btn => {
      if (!btn.hasAttribute('aria-label') && !btn.hasAttribute('title')) {
        console.warn('Button without aria-label or title:', btn);
      }
    });
  }

  /**
   * Announce message to screen readers
   * @param {string} message - Message to announce
   * @param {string} priority - 'polite' or 'assertive'
   */
  announceToScreenReader(message, priority = 'polite') {
    const liveRegion = document.getElementById('aria-live-region') || this.createLiveRegion();
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.textContent = message;
    
    // Clear after announcement
    setTimeout(() => {
      liveRegion.textContent = '';
    }, 1000);
  }

  /**
   * Create ARIA live region for announcements
   */
  createLiveRegion() {
    const liveRegion = document.createElement('div');
    liveRegion.id = 'aria-live-region';
    liveRegion.className = 'live-region';
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    document.body.appendChild(liveRegion);
    return liveRegion;
  }

  /**
   * Format time for screen reader announcement
   * @param {number} seconds - Time in seconds
   * @returns {string} Formatted time string
   */
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins} minutes ${secs} seconds`;
  }

  /**
   * Show keyboard shortcuts help modal
   */
  showKeyboardShortcutsHelp() {
    const shortcuts = Array.from(this.shortcuts.entries())
      .filter(([key, data]) => data.description)
      .map(([key, data]) => ({
        key: this.formatKeyName(key),
        description: data.description
      }));

    const content = `
      <div class="keyboard-shortcuts-help">
        <h3>Keyboard Shortcuts</h3>
        <div class="shortcuts-grid">
          ${shortcuts.map(s => `
            <div class="shortcut-item">
              <kbd class="shortcut-key">${s.key}</kbd>
              <span class="shortcut-description">${s.description}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    // Use modal manager if available
    if (window.modalManager) {
      window.modalManager.createModal({
        type: 'info',
        title: 'Keyboard Shortcuts',
        content,
        icon: '⌨️',
        size: 'md',
        buttons: [
          { text: 'Close', class: 'btn-primary', onClick: (modal) => window.modalManager.close(modal.id) }
        ]
      });
    }
  }

  /**
   * Format key name for display
   * @param {string} key - Key name
   * @returns {string} Formatted key name
   */
  formatKeyName(key) {
    const keyMap = {
      ' ': 'Space',
      'arrowleft': '←',
      'arrowright': '→',
      'arrowup': '↑',
      'arrowdown': '↓',
      'escape': 'Esc'
    };
    return keyMap[key] || key.toUpperCase();
  }

  /**
   * Add skip to content link
   */
  addSkipToContentLink() {
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.className = 'skip-to-content';
    skipLink.textContent = 'Skip to main content';
    skipLink.addEventListener('click', (e) => {
      e.preventDefault();
      const mainContent = document.getElementById('main-content') || document.querySelector('main') || document.querySelector('.page.active');
      if (mainContent) {
        mainContent.setAttribute('tabindex', '-1');
        mainContent.focus();
      }
    });
    document.body.insertBefore(skipLink, document.body.firstChild);
  }

  /**
   * Enable keyboard navigation for custom elements
   * @param {HTMLElement} element - Element to make keyboard accessible
   */
  makeKeyboardAccessible(element) {
    if (!element.hasAttribute('tabindex')) {
      element.setAttribute('tabindex', '0');
    }

    // Add keyboard event listeners
    element.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        element.click();
      }
    });
  }
}

// Create singleton instance
const keyboardNavigationManager = new KeyboardNavigationManager();

export default keyboardNavigationManager;
