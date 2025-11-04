/**
 * NotificationManager - Toast notification system
 * Handles displaying toast notifications with auto-dismiss
 * Supports multiple types: success, error, warning, info
 * Stacks multiple toasts (max 3 visible)
 */

export class NotificationManager {
  constructor() {
    this.container = null;
    this.toasts = [];
    this.maxVisible = 3;
    this.defaultDuration = 5000; // 5 seconds
    this.init();
  }

  init() {
    // Get or create toast container
    this.container = document.getElementById('toast-container');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  }

  /**
   * Show a toast notification
   * @param {string} message - The message to display
   * @param {string} type - Type of toast: 'success', 'error', 'warning', 'info'
   * @param {number} duration - Duration in ms (0 for persistent)
   * @param {Object} options - Additional options
   */
  show(message, type = 'info', duration = null, options = {}) {
    // Remove oldest toast if we're at max capacity
    if (this.toasts.length >= this.maxVisible) {
      this.remove(this.toasts[0].id);
    }

    const toast = this.createToast(message, type, duration || this.defaultDuration, options);
    this.toasts.push(toast);
    this.container.appendChild(toast.element);

    // Trigger animation
    requestAnimationFrame(() => {
      toast.element.classList.add('show');
    });

    // Auto-dismiss if duration is set
    if (toast.duration > 0) {
      toast.timeout = setTimeout(() => {
        this.remove(toast.id);
      }, toast.duration);
    }

    return toast.id;
  }

  /**
   * Create a toast element
   */
  createToast(message, type, duration, options) {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const element = document.createElement('div');
    element.className = `toast toast-${type}`;
    element.setAttribute('data-toast-id', id);
    element.setAttribute('role', 'alert');
    element.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');

    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };

    const icon = options.icon || icons[type] || icons.info;

    element.innerHTML = `
      <div class="toast-icon">${icon}</div>
      <div class="toast-content">
        ${options.title ? `<div class="toast-title">${this.escapeHtml(options.title)}</div>` : ''}
        <div class="toast-message">${this.escapeHtml(message)}</div>
      </div>
      <button class="toast-close" aria-label="Close notification">×</button>
    `;

    // Add close button handler
    const closeBtn = element.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
      this.remove(id);
    });

    // Add click handler if provided
    if (options.onClick) {
      element.style.cursor = 'pointer';
      element.addEventListener('click', (e) => {
        if (!e.target.classList.contains('toast-close')) {
          options.onClick();
          if (options.dismissOnClick) {
            this.remove(id);
          }
        }
      });
    }

    return {
      id,
      element,
      duration,
      timeout: null,
      type
    };
  }

  /**
   * Remove a toast by ID
   */
  remove(id) {
    const toastIndex = this.toasts.findIndex(t => t.id === id);
    if (toastIndex === -1) return;

    const toast = this.toasts[toastIndex];

    // Clear timeout if exists
    if (toast.timeout) {
      clearTimeout(toast.timeout);
    }

    // Animate out
    toast.element.classList.remove('show');
    toast.element.classList.add('hide');

    // Remove from DOM after animation
    setTimeout(() => {
      if (toast.element.parentNode) {
        toast.element.parentNode.removeChild(toast.element);
      }
      this.toasts.splice(toastIndex, 1);
    }, 300);
  }

  /**
   * Remove all toasts
   */
  clear() {
    this.toasts.forEach(toast => {
      if (toast.timeout) {
        clearTimeout(toast.timeout);
      }
      if (toast.element.parentNode) {
        toast.element.parentNode.removeChild(toast.element);
      }
    });
    this.toasts = [];
  }

  /**
   * Convenience methods for different types
   */
  success(message, duration, options) {
    return this.show(message, 'success', duration, options);
  }

  error(message, duration, options) {
    return this.show(message, 'error', duration, options);
  }

  warning(message, duration, options) {
    return this.show(message, 'warning', duration, options);
  }

  info(message, duration, options) {
    return this.show(message, 'info', duration, options);
  }

  /**
   * Show a loading toast (persistent until dismissed)
   */
  loading(message, options = {}) {
    return this.show(message, 'info', 0, {
      ...options,
      icon: '⏳'
    });
  }

  /**
   * Update an existing toast
   */
  update(id, message, type) {
    const toast = this.toasts.find(t => t.id === id);
    if (!toast) return;

    const messageEl = toast.element.querySelector('.toast-message');
    if (messageEl) {
      messageEl.textContent = message;
    }

    if (type && type !== toast.type) {
      toast.element.classList.remove(`toast-${toast.type}`);
      toast.element.classList.add(`toast-${type}`);
      toast.type = type;

      const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
      };

      const iconEl = toast.element.querySelector('.toast-icon');
      if (iconEl) {
        iconEl.textContent = icons[type] || icons.info;
      }
    }
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Create singleton instance
const notificationManager = new NotificationManager();

export default notificationManager;
