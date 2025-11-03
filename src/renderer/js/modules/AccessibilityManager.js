/**
 * AccessibilityManager - Manages ARIA labels and accessibility attributes
 * Task 10.2: Implement ARIA labels
 * 
 * Features:
 * - Add aria-label to icon-only buttons
 * - Use aria-live for notifications
 * - Add aria-modal and role attributes to modals
 * - Implement aria-expanded for collapsible sections
 */

export class AccessibilityManager {
  constructor() {
    this.liveRegion = null;
    this.init();
  }

  init() {
    // Create ARIA live region for announcements
    this.createLiveRegion();
    
    // Add ARIA labels to existing elements
    this.addAriaLabels();
    
    // Set up mutation observer for dynamic content
    this.setupMutationObserver();
    
    // Enhance modals with ARIA attributes
    this.enhanceModals();
    
    // Enhance collapsible sections
    this.enhanceCollapsibleSections();
    
    // Enhance form inputs
    this.enhanceFormInputs();
  }

  /**
   * Create ARIA live region for screen reader announcements
   */
  createLiveRegion() {
    if (!document.getElementById('aria-live-region')) {
      this.liveRegion = document.createElement('div');
      this.liveRegion.id = 'aria-live-region';
      this.liveRegion.className = 'live-region';
      this.liveRegion.setAttribute('aria-live', 'polite');
      this.liveRegion.setAttribute('aria-atomic', 'true');
      this.liveRegion.setAttribute('role', 'status');
      document.body.appendChild(this.liveRegion);
    } else {
      this.liveRegion = document.getElementById('aria-live-region');
    }
  }

  /**
   * Announce message to screen readers
   * @param {string} message - Message to announce
   * @param {string} priority - 'polite' or 'assertive'
   */
  announce(message, priority = 'polite') {
    if (!this.liveRegion) {
      this.createLiveRegion();
    }
    
    this.liveRegion.setAttribute('aria-live', priority);
    this.liveRegion.textContent = message;
    
    // Clear after announcement
    setTimeout(() => {
      this.liveRegion.textContent = '';
    }, 1000);
  }

  /**
   * Add ARIA labels to icon-only buttons and other elements
   */
  addAriaLabels() {
    // Icon-only buttons
    const iconButtons = [
      { selector: '#settings-btn', label: 'Settings and About' },
      { selector: '#help-btn', label: 'Help and Information' },
      { selector: '#features-btn', label: 'View Features' },
      { selector: '#how-it-works-btn', label: 'How It Works' },
      { selector: '#play-pause-btn', label: 'Play or Pause Video' },
      { selector: '#volume-btn', label: 'Mute or Unmute' },
      { selector: '#fullscreen-btn', label: 'Toggle Fullscreen' },
      { selector: '#sidebar-toggle', label: 'Toggle Sidebar' },
      { selector: '#send-chat', label: 'Send Chat Message' },
      { selector: '#clear-chat', label: 'Clear Chat Messages' },
      { selector: '#network-info-btn', label: 'View Network Information' },
      { selector: '#speed-test-btn', label: 'Test Internet Speed' },
      { selector: '#speed-test-top-btn', label: 'Test Internet Speed' },
      { selector: '.quick-join-btn', label: 'Join Room with Code' },
      { selector: '#media-history-btn', label: 'View Media History' },
      { selector: '#clear-video', label: 'Clear Current Video' }
    ];

    iconButtons.forEach(({ selector, label }) => {
      const element = document.querySelector(selector);
      if (element && !element.hasAttribute('aria-label')) {
        element.setAttribute('aria-label', label);
      }
    });

    // Tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      const tabName = btn.getAttribute('data-tab');
      if (tabName && !btn.hasAttribute('aria-label')) {
        const label = tabName.charAt(0).toUpperCase() + tabName.slice(1);
        btn.setAttribute('aria-label', `Switch to ${label} tab`);
        btn.setAttribute('role', 'tab');
        btn.setAttribute('aria-selected', btn.classList.contains('active') ? 'true' : 'false');
      }
    });

    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
      if (!btn.hasAttribute('aria-label')) {
        btn.setAttribute('aria-label', 'Close modal');
      }
    });

    // Back buttons
    document.querySelectorAll('.back-btn').forEach(btn => {
      if (!btn.hasAttribute('aria-label')) {
        btn.setAttribute('aria-label', 'Go back to previous page');
      }
    });

    // Copy buttons
    document.querySelectorAll('.copy-btn').forEach(btn => {
      if (!btn.hasAttribute('aria-label')) {
        const copyTarget = btn.getAttribute('data-copy');
        btn.setAttribute('aria-label', `Copy ${copyTarget || 'text'} to clipboard`);
      }
    });

    // Status indicators
    document.querySelectorAll('.status-dot').forEach(dot => {
      if (!dot.hasAttribute('aria-label')) {
        const parent = dot.closest('.connection-status, .sync-status, .media-status');
        if (parent) {
          const statusText = parent.querySelector('span:not(.status-dot)')?.textContent || 'Status';
          dot.setAttribute('aria-label', statusText);
          dot.setAttribute('role', 'status');
        }
      }
    });

    // Sliders
    const volumeSlider = document.querySelector('.volume-slider');
    if (volumeSlider && !volumeSlider.hasAttribute('aria-label')) {
      volumeSlider.setAttribute('aria-label', 'Volume control');
      volumeSlider.setAttribute('aria-valuemin', '0');
      volumeSlider.setAttribute('aria-valuemax', '100');
      volumeSlider.setAttribute('aria-valuenow', volumeSlider.value);
      volumeSlider.setAttribute('role', 'slider');
    }

    const seekBar = document.querySelector('.seek-bar');
    if (seekBar && !seekBar.hasAttribute('aria-label')) {
      seekBar.setAttribute('aria-label', 'Video seek bar');
      seekBar.setAttribute('aria-valuemin', '0');
      seekBar.setAttribute('aria-valuemax', '100');
      seekBar.setAttribute('aria-valuenow', seekBar.value);
      seekBar.setAttribute('role', 'slider');
    }

    // Quality select
    const qualitySelect = document.querySelector('.quality-select');
    if (qualitySelect && !qualitySelect.hasAttribute('aria-label')) {
      qualitySelect.setAttribute('aria-label', 'Video quality selection');
    }

    // Chat input
    const chatInput = document.getElementById('chat-input');
    if (chatInput && !chatInput.hasAttribute('aria-label')) {
      chatInput.setAttribute('aria-label', 'Type your chat message');
    }

    // Room code input
    const roomCodeInput = document.getElementById('quick-room-code');
    if (roomCodeInput && !roomCodeInput.hasAttribute('aria-label')) {
      roomCodeInput.setAttribute('aria-label', 'Enter 8-character room code');
    }
  }

  /**
   * Enhance modals with proper ARIA attributes
   */
  enhanceModals() {
    document.querySelectorAll('.modal-overlay').forEach(modal => {
      // Ensure modal has proper role and aria-modal
      if (!modal.hasAttribute('role')) {
        modal.setAttribute('role', 'dialog');
      }
      if (!modal.hasAttribute('aria-modal')) {
        modal.setAttribute('aria-modal', 'true');
      }
      
      // Set aria-hidden based on visibility
      const isActive = modal.classList.contains('active');
      modal.setAttribute('aria-hidden', isActive ? 'false' : 'true');
      
      // Add aria-labelledby to link modal to its title
      const modalTitle = modal.querySelector('.modal-title');
      if (modalTitle) {
        const titleId = modalTitle.id || `modal-title-${Math.random().toString(36).substr(2, 9)}`;
        modalTitle.id = titleId;
        modal.setAttribute('aria-labelledby', titleId);
      }
      
      // Add aria-describedby if there's a description
      const modalBody = modal.querySelector('.modal-body');
      if (modalBody) {
        const bodyId = modalBody.id || `modal-body-${Math.random().toString(36).substr(2, 9)}`;
        modalBody.id = bodyId;
        modal.setAttribute('aria-describedby', bodyId);
      }
    });
  }

  /**
   * Enhance collapsible sections with aria-expanded
   */
  enhanceCollapsibleSections() {
    // Advanced settings collapsible
    const collapsibleHeaders = document.querySelectorAll('.modal-collapsible-header, [data-collapsible]');
    
    collapsibleHeaders.forEach(header => {
      const parent = header.closest('.modal-collapsible') || header.parentElement;
      const isExpanded = parent?.classList.contains('expanded');
      
      header.setAttribute('role', 'button');
      header.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
      header.setAttribute('tabindex', '0');
      
      // Add keyboard support
      header.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          header.click();
        }
      });
      
      // Update aria-expanded on click
      header.addEventListener('click', () => {
        setTimeout(() => {
          const newExpanded = parent?.classList.contains('expanded');
          header.setAttribute('aria-expanded', newExpanded ? 'true' : 'false');
          this.announce(`Section ${newExpanded ? 'expanded' : 'collapsed'}`);
        }, 50);
      });
    });

    // Sidebar collapsible
    const sidebarToggle = document.getElementById('sidebar-toggle');
    if (sidebarToggle) {
      const sidebar = document.getElementById('sidebar-panel');
      const isCollapsed = sidebar?.classList.contains('collapsed');
      sidebarToggle.setAttribute('aria-expanded', isCollapsed ? 'false' : 'true');
      sidebarToggle.setAttribute('aria-controls', 'sidebar-panel');
      
      // Update on toggle
      sidebarToggle.addEventListener('click', () => {
        setTimeout(() => {
          const newCollapsed = sidebar?.classList.contains('collapsed');
          sidebarToggle.setAttribute('aria-expanded', newCollapsed ? 'false' : 'true');
          this.announce(`Sidebar ${newCollapsed ? 'collapsed' : 'expanded'}`);
        }, 50);
      });
    }
  }

  /**
   * Enhance form inputs with proper labels and descriptions
   */
  enhanceFormInputs() {
    // Ensure all inputs have associated labels
    document.querySelectorAll('input, select, textarea').forEach(input => {
      const id = input.id || input.name;
      if (!id) return;
      
      // Skip radio buttons wrapped in labels (they're properly labeled)
      if (input.type === 'radio' && input.closest('label')) {
        return;
      }
      
      // Find associated label
      const label = document.querySelector(`label[for="${id}"]`);
      if (!label && !input.hasAttribute('aria-label') && !input.closest('label')) {
        // Only warn for non-radio inputs or radio inputs not in labels
        if (input.type !== 'radio') {
          console.warn('Input without label:', input);
        }
      }
      
      // Add aria-required for required fields
      if (input.hasAttribute('required') && !input.hasAttribute('aria-required')) {
        input.setAttribute('aria-required', 'true');
      }
      
      // Add aria-invalid for invalid fields
      input.addEventListener('invalid', () => {
        input.setAttribute('aria-invalid', 'true');
      });
      
      input.addEventListener('input', () => {
        if (input.validity.valid) {
          input.removeAttribute('aria-invalid');
        }
      });
      
      // Link error messages
      const errorElement = input.parentElement?.querySelector('.error-message, .modal-form-error');
      if (errorElement) {
        const errorId = errorElement.id || `error-${id}`;
        errorElement.id = errorId;
        errorElement.setAttribute('role', 'alert');
        input.setAttribute('aria-describedby', errorId);
      }
      
      // Link help text
      const helpElement = input.parentElement?.querySelector('.input-hint, .modal-form-help, .field-description');
      if (helpElement) {
        const helpId = helpElement.id || `help-${id}`;
        helpElement.id = helpId;
        const describedBy = input.getAttribute('aria-describedby');
        input.setAttribute('aria-describedby', describedBy ? `${describedBy} ${helpId}` : helpId);
      }
    });
  }

  /**
   * Set up mutation observer to handle dynamically added content
   */
  setupMutationObserver() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check if it's a modal
            if (node.classList?.contains('modal-overlay')) {
              this.enhanceModals();
            }
            
            // Check for buttons without aria-labels
            if (node.tagName === 'BUTTON' && !node.hasAttribute('aria-label') && !node.textContent.trim()) {
              console.warn('Button added without aria-label:', node);
            }
            
            // Check for collapsible sections
            if (node.classList?.contains('modal-collapsible') || node.hasAttribute('data-collapsible')) {
              this.enhanceCollapsibleSections();
            }
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Update tab panel ARIA attributes
   * @param {string} activeTabId - ID of the active tab
   */
  updateTabPanels(activeTabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      const isActive = btn.getAttribute('data-tab') === activeTabId;
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
      btn.setAttribute('tabindex', isActive ? '0' : '-1');
    });

    document.querySelectorAll('.tab-content').forEach(panel => {
      const isActive = panel.id === `${activeTabId}-tab` || panel.id === activeTabId;
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-hidden', isActive ? 'false' : 'true');
    });
  }

  /**
   * Announce notification to screen reader
   * @param {string} message - Notification message
   * @param {string} type - Notification type (success, error, warning, info)
   */
  announceNotification(message, type = 'info') {
    const priority = type === 'error' ? 'assertive' : 'polite';
    const prefix = {
      success: 'Success: ',
      error: 'Error: ',
      warning: 'Warning: ',
      info: ''
    }[type] || '';
    
    this.announce(prefix + message, priority);
  }

  /**
   * Update video player ARIA attributes
   * @param {Object} state - Video player state
   */
  updateVideoPlayerAria(state) {
    const video = document.getElementById('main-video');
    const playPauseBtn = document.getElementById('play-pause-btn');
    
    if (video) {
      video.setAttribute('aria-label', state.title || 'Video player');
    }
    
    if (playPauseBtn) {
      playPauseBtn.setAttribute('aria-label', state.playing ? 'Pause video' : 'Play video');
      playPauseBtn.setAttribute('aria-pressed', state.playing ? 'true' : 'false');
    }
    
    // Update volume slider
    const volumeSlider = document.querySelector('.volume-slider');
    if (volumeSlider && state.volume !== undefined) {
      volumeSlider.setAttribute('aria-valuenow', Math.round(state.volume * 100));
      volumeSlider.setAttribute('aria-valuetext', `${Math.round(state.volume * 100)} percent`);
    }
    
    // Update seek bar
    const seekBar = document.querySelector('.seek-bar');
    if (seekBar && state.currentTime !== undefined && state.duration !== undefined) {
      const percentage = (state.currentTime / state.duration) * 100;
      seekBar.setAttribute('aria-valuenow', Math.round(percentage));
      seekBar.setAttribute('aria-valuetext', `${this.formatTime(state.currentTime)} of ${this.formatTime(state.duration)}`);
    }
  }

  /**
   * Format time for ARIA labels
   * @param {number} seconds - Time in seconds
   * @returns {string} Formatted time
   */
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Add loading state announcement
   * @param {string} message - Loading message
   */
  announceLoading(message) {
    this.announce(`Loading: ${message}`, 'polite');
  }

  /**
   * Add completion announcement
   * @param {string} message - Completion message
   */
  announceComplete(message) {
    this.announce(`Complete: ${message}`, 'polite');
  }
}

// Create singleton instance
const accessibilityManager = new AccessibilityManager();

export default accessibilityManager;
