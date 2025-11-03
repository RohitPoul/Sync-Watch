/**
 * ModalManager - Handles modal lifecycle, animations, and accessibility
 * 
 * Features:
 * - Open/close modals with smooth animations
 * - Backdrop click and ESC key handlers
 * - Focus trap for accessibility
 * - Body scroll lock when modal is open
 * - Multiple modal support with z-index management
 */

export class ModalManager {
  constructor() {
    this.activeModals = [];
    this.focusableSelectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    this.init();
  }

  init() {
    // Set up event listeners for all modals
    this.setupModalListeners();
    
    // Listen for ESC key globally
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.activeModals.length > 0) {
        this.close(this.activeModals[this.activeModals.length - 1]);
      }
    });
  }

  setupModalListeners() {
    // Find all modal overlays
    const modals = document.querySelectorAll('.modal-overlay');
    
    modals.forEach(modal => {
      // Close button clicks
      const closeButtons = modal.querySelectorAll('.modal-close, .modal-close-btn');
      closeButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.close(modal.id);
        });
      });
      
      // Backdrop clicks
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.close(modal.id);
        }
      });
      
      // Prevent clicks inside modal container from closing
      const container = modal.querySelector('.modal-container');
      if (container) {
        container.addEventListener('click', (e) => {
          e.stopPropagation();
        });
      }
    });
  }

  /**
   * Open a modal by ID (Optimized with lazy loading - Task 11.2)
   * @param {string} modalId - The ID of the modal to open
   * @param {Object} options - Optional configuration
   * @param {string} options.title - Modal title
   * @param {string} options.content - Modal body content (HTML string)
   * @param {Function} options.onOpen - Callback when modal opens
   * @param {Function} options.onClose - Callback when modal closes
   */
  open(modalId, options = {}) {
    const modal = document.getElementById(modalId);
    if (!modal) {
      console.error(`Modal with ID "${modalId}" not found`);
      return;
    }

    // Lazy load modal content if provided (Task 11.2)
    if (options.content) {
      const bodyElement = modal.querySelector('.modal-body');
      if (bodyElement) {
        // Use requestIdleCallback for non-critical content updates
        if ('requestIdleCallback' in window) {
          requestIdleCallback(() => {
            bodyElement.innerHTML = options.content;
          });
        } else {
          bodyElement.innerHTML = options.content;
        }
      }
    }

    // Update modal title if provided
    if (options.title) {
      const titleElement = modal.querySelector('.modal-title span:last-child');
      if (titleElement) {
        titleElement.textContent = options.title;
      }
    }

    // Update icon if provided
    if (options.icon) {
      const iconElement = modal.querySelector('.modal-title-icon');
      if (iconElement) {
        iconElement.textContent = options.icon;
      }
    }

    // Store the currently focused element
    this.previouslyFocusedElement = document.activeElement;

    // Add to active modals stack
    if (!this.activeModals.includes(modalId)) {
      this.activeModals.push(modalId);
    }

    // Lock body scroll
    this.lockBodyScroll();

    // Show modal with optimized animation (Task 11.2)
    modal.setAttribute('aria-hidden', 'false');
    modal.style.display = 'flex';
    
    // Use requestAnimationFrame for smooth 60fps animation
    requestAnimationFrame(() => {
      modal.offsetHeight; // Force reflow
      requestAnimationFrame(() => {
        modal.classList.add('active');
      });
    });

    // Set up focus trap
    this.setupFocusTrap(modal);

    // Focus first focusable element
    requestAnimationFrame(() => {
      this.focusFirstElement(modal);
    });

    // Call onOpen callback
    if (options.onOpen && typeof options.onOpen === 'function') {
      options.onOpen(modal);
    }

    // Store callback for later
    if (options.onClose) {
      modal.dataset.onCloseCallback = options.onClose.toString();
    }
  }

  /**
   * Close a modal by ID (Enhanced with smooth animations - Task 8.3)
   * @param {string} modalId - The ID of the modal to close
   */
  close(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal || !modal.classList.contains('active')) {
      return;
    }

    // Remove from active modals stack
    const index = this.activeModals.indexOf(modalId);
    if (index > -1) {
      this.activeModals.splice(index, 1);
    }

    // Add closing class for smooth exit animation (Task 8.3)
    modal.classList.add('closing');
    modal.classList.remove('active');

    // Wait for animation to complete
    setTimeout(() => {
      modal.classList.remove('closing');
      modal.style.display = 'none';
      modal.setAttribute('aria-hidden', 'true');

      // Unlock body scroll if no more modals are open
      if (this.activeModals.length === 0) {
        this.unlockBodyScroll();
      }

      // Restore focus to previously focused element
      if (this.previouslyFocusedElement && this.activeModals.length === 0) {
        this.previouslyFocusedElement.focus();
        this.previouslyFocusedElement = null;
      }

      // Call onClose callback if exists
      if (modal.dataset.onCloseCallback) {
        try {
          const callback = eval(`(${modal.dataset.onCloseCallback})`);
          if (typeof callback === 'function') {
            callback(modal);
          }
        } catch (e) {
          console.error('Error executing onClose callback:', e);
        }
        delete modal.dataset.onCloseCallback;
      }
    }, 200); // Match CSS close animation duration
  }

  /**
   * Close all open modals
   */
  closeAll() {
    [...this.activeModals].forEach(modalId => {
      this.close(modalId);
    });
  }

  /**
   * Lock body scroll when modal is open
   */
  lockBodyScroll() {
    if (!document.body.classList.contains('modal-open')) {
      // Store current scroll position
      this.scrollPosition = window.pageYOffset;
      document.body.style.top = `-${this.scrollPosition}px`;
      document.body.classList.add('modal-open');
    }
  }

  /**
   * Unlock body scroll when all modals are closed
   */
  unlockBodyScroll() {
    if (document.body.classList.contains('modal-open')) {
      document.body.classList.remove('modal-open');
      document.body.style.top = '';
      window.scrollTo(0, this.scrollPosition || 0);
    }
  }

  /**
   * Set up focus trap within modal
   * @param {HTMLElement} modal - The modal element
   */
  setupFocusTrap(modal) {
    const focusableElements = modal.querySelectorAll(this.focusableSelectors);
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    // Remove existing listener if any
    if (modal.focusTrapListener) {
      modal.removeEventListener('keydown', modal.focusTrapListener);
    }

    // Create new focus trap listener
    modal.focusTrapListener = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    };

    modal.addEventListener('keydown', modal.focusTrapListener);
  }

  /**
   * Focus the first focusable element in modal
   * @param {HTMLElement} modal - The modal element
   */
  focusFirstElement(modal) {
    const focusableElements = modal.querySelectorAll(this.focusableSelectors);
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  }

  /**
   * Check if a modal is currently open
   * @param {string} modalId - The ID of the modal to check
   * @returns {boolean}
   */
  isOpen(modalId) {
    return this.activeModals.includes(modalId);
  }

  /**
   * Toggle a modal (open if closed, close if open)
   * @param {string} modalId - The ID of the modal to toggle
   * @param {Object} options - Optional configuration (used when opening)
   */
  toggle(modalId, options = {}) {
    if (this.isOpen(modalId)) {
      this.close(modalId);
    } else {
      this.open(modalId, options);
    }
  }

  /**
   * Create and open a custom modal dynamically
   * @param {Object} config - Modal configuration
   * @param {string} config.type - Modal type: 'info', 'form', 'status', 'error'
   * @param {string} config.title - Modal title
   * @param {string} config.content - Modal body content (HTML string)
   * @param {string} config.icon - Modal icon emoji
   * @param {Array} config.buttons - Array of button configs {text, class, onClick}
   * @returns {string} - The ID of the created modal
   */
  createModal(config) {
    const modalId = `dynamic-modal-${Date.now()}`;
    const {
      type = 'info',
      title = 'Modal',
      content = '',
      icon = 'ℹ️',
      buttons = [{text: 'Close', class: 'btn-primary', onClick: () => this.close(modalId)}],
      size = 'md'
    } = config;

    // Create modal HTML
    const modalHTML = `
      <div class="modal-overlay" id="${modalId}" aria-hidden="true" role="dialog" aria-modal="true">
        <div class="modal-container modal-${size}">
          <div class="modal-header">
            <h2 class="modal-title">
              <span class="modal-title-icon">${icon}</span>
              <span>${title}</span>
            </h2>
            <button class="modal-close" aria-label="Close modal">✕</button>
          </div>
          <div class="modal-body">
            ${content}
          </div>
          <div class="modal-footer">
            ${buttons.map((btn, index) => 
              `<button class="btn ${btn.class || 'btn-secondary'}" data-btn-index="${index}">${btn.text}</button>`
            ).join('')}
          </div>
        </div>
      </div>
    `;

    // Append to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Get the created modal
    const modal = document.getElementById(modalId);

    // Set up button click handlers
    buttons.forEach((btn, index) => {
      const buttonElement = modal.querySelector(`[data-btn-index="${index}"]`);
      if (buttonElement && btn.onClick) {
        buttonElement.addEventListener('click', () => {
          btn.onClick(modal);
        });
      }
    });

    // Set up close handlers
    this.setupModalListeners();

    // Open the modal
    this.open(modalId);

    return modalId;
  }

  /**
   * Show a confirmation dialog
   * @param {Object} config - Configuration
   * @param {string} config.title - Dialog title
   * @param {string} config.message - Dialog message
   * @param {Function} config.onConfirm - Callback when confirmed
   * @param {Function} config.onCancel - Callback when cancelled
   * @returns {Promise<boolean>} - Resolves to true if confirmed, false if cancelled
   */
  confirm(config) {
    return new Promise((resolve) => {
      const {
        title = 'Confirm',
        message = 'Are you sure?',
        confirmText = 'Confirm',
        cancelText = 'Cancel',
        onConfirm,
        onCancel
      } = config;

      const modalId = this.createModal({
        type: 'status',
        title,
        content: `<p style="color: var(--text-secondary); line-height: 1.6;">${message}</p>`,
        icon: '❓',
        size: 'sm',
        buttons: [
          {
            text: cancelText,
            class: 'btn-secondary',
            onClick: () => {
              this.close(modalId);
              if (onCancel) onCancel();
              resolve(false);
            }
          },
          {
            text: confirmText,
            class: 'btn-primary',
            onClick: () => {
              this.close(modalId);
              if (onConfirm) onConfirm();
              resolve(true);
            }
          }
        ]
      });
    });
  }

  /**
   * Show an alert dialog
   * @param {Object} config - Configuration
   * @param {string} config.title - Dialog title
   * @param {string} config.message - Dialog message
   * @param {string} config.type - Alert type: 'info', 'success', 'warning', 'error'
   */
  alert(config) {
    const {
      title = 'Alert',
      message = '',
      type = 'info',
      buttonText = 'OK'
    } = config;

    const icons = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    };

    this.createModal({
      type: 'status',
      title,
      content: `<p style="color: var(--text-secondary); line-height: 1.6;">${message}</p>`,
      icon: icons[type] || icons.info,
      size: 'sm',
      buttons: [
        {
          text: buttonText,
          class: type === 'error' ? 'btn-danger' : 'btn-primary',
          onClick: (modal) => this.close(modal.id)
        }
      ]
    });
  }
}

// Create singleton instance
const modalManager = new ModalManager();

export default modalManager;
