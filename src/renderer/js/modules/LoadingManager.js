/**
 * LoadingManager - Manage loading states and skeleton screens
 * Provides utilities for showing loading indicators and skeleton screens
 */

export class LoadingManager {
  constructor() {
    this.activeLoaders = new Map();
  }

  /**
   * Show full-screen loading overlay
   * @param {string} message - Loading message to display
   * @param {number} progress - Progress percentage (0-100)
   */
  showOverlay(message = 'Loading...', progress = null) {
    const overlay = document.getElementById('loading-overlay');
    if (!overlay) return;

    // Update message
    const messageEl = overlay.querySelector('h3');
    if (messageEl) {
      messageEl.textContent = message;
    }

    // Update progress if provided
    if (progress !== null) {
      const progressFill = document.getElementById('loading-progress');
      const progressText = document.getElementById('loading-text');
      
      if (progressFill) {
        progressFill.style.width = `${progress}%`;
      }
      
      if (progressText) {
        progressText.textContent = `${Math.round(progress)}%`;
      }
    }

    overlay.classList.add('active');
  }

  /**
   * Hide full-screen loading overlay
   */
  hideOverlay() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.classList.remove('active');
    }
  }

  /**
   * Show loading state on a button
   * @param {HTMLElement|string} button - Button element or selector
   */
  showButtonLoading(button) {
    const btn = typeof button === 'string' ? document.querySelector(button) : button;
    if (!btn) return;

    btn.classList.add('loading');
    btn.disabled = true;
    
    // Store original text
    if (!btn.dataset.originalText) {
      btn.dataset.originalText = btn.textContent;
    }
  }

  /**
   * Hide loading state on a button
   * @param {HTMLElement|string} button - Button element or selector
   */
  hideButtonLoading(button) {
    const btn = typeof button === 'string' ? document.querySelector(button) : button;
    if (!btn) return;

    btn.classList.remove('loading');
    btn.disabled = false;
    
    // Restore original text if stored
    if (btn.dataset.originalText) {
      btn.textContent = btn.dataset.originalText;
      delete btn.dataset.originalText;
    }
  }

  /**
   * Create a skeleton screen for a container
   * @param {HTMLElement|string} container - Container element or selector
   * @param {string} type - Type of skeleton: 'users', 'chat', 'cards', 'text'
   * @param {number} count - Number of skeleton items
   */
  showSkeleton(container, type = 'text', count = 3) {
    const element = typeof container === 'string' ? document.querySelector(container) : container;
    if (!element) return;

    const skeletonHTML = this.generateSkeletonHTML(type, count);
    element.innerHTML = skeletonHTML;
    element.classList.add('skeleton-container');
  }

  /**
   * Remove skeleton screen and show content
   * @param {HTMLElement|string} container - Container element or selector
   * @param {string} content - HTML content to display
   */
  hideSkeleton(container, content = null) {
    const element = typeof container === 'string' ? document.querySelector(container) : container;
    if (!element) return;

    element.classList.remove('skeleton-container');
    
    if (content) {
      element.innerHTML = content;
      element.classList.add('fade-in');
    }
  }

  /**
   * Generate skeleton HTML based on type
   */
  generateSkeletonHTML(type, count) {
    switch (type) {
      case 'users':
        return this.generateUsersSkeleton(count);
      case 'chat':
        return this.generateChatSkeleton(count);
      case 'cards':
        return this.generateCardsSkeleton(count);
      case 'text':
      default:
        return this.generateTextSkeleton(count);
    }
  }

  /**
   * Generate users list skeleton
   */
  generateUsersSkeleton(count) {
    const items = Array(count).fill(0).map(() => `
      <div class="skeleton-user-item">
        <div class="skeleton skeleton-avatar"></div>
        <div class="skeleton-user-info">
          <div class="skeleton skeleton-text" style="width: 70%;"></div>
          <div class="skeleton skeleton-text small" style="width: 40%;"></div>
        </div>
      </div>
    `).join('');

    return `<div class="skeleton-user-list">${items}</div>`;
  }

  /**
   * Generate chat messages skeleton
   */
  generateChatSkeleton(count) {
    const items = Array(count).fill(0).map(() => `
      <div class="skeleton-message">
        <div class="skeleton-message-header">
          <div class="skeleton skeleton-text" style="width: 100px;"></div>
          <div class="skeleton skeleton-text small" style="width: 50px;"></div>
        </div>
        <div class="skeleton skeleton-text" style="width: 90%;"></div>
        <div class="skeleton skeleton-text short"></div>
      </div>
    `).join('');

    return `<div class="skeleton-chat-messages">${items}</div>`;
  }

  /**
   * Generate cards skeleton
   */
  generateCardsSkeleton(count) {
    const items = Array(count).fill(0).map(() => `
      <div class="skeleton skeleton-card"></div>
    `).join('');

    return `<div style="display: flex; flex-direction: column; gap: var(--space-md);">${items}</div>`;
  }

  /**
   * Generate text skeleton
   */
  generateTextSkeleton(count) {
    const items = Array(count).fill(0).map((_, i) => {
      const width = i === count - 1 ? '60%' : '100%';
      return `<div class="skeleton skeleton-text" style="width: ${width};"></div>`;
    }).join('');

    return `<div style="padding: var(--space-md);">${items}</div>`;
  }

  /**
   * Show inline spinner next to an element
   * @param {HTMLElement|string} element - Element or selector
   */
  showInlineSpinner(element) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (!el) return;

    const spinner = document.createElement('span');
    spinner.className = 'inline-spinner';
    spinner.dataset.loadingSpinner = 'true';
    el.appendChild(spinner);
  }

  /**
   * Hide inline spinner
   * @param {HTMLElement|string} element - Element or selector
   */
  hideInlineSpinner(element) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (!el) return;

    const spinner = el.querySelector('[data-loading-spinner]');
    if (spinner) {
      spinner.remove();
    }
  }

  /**
   * Show loading dots animation
   * @param {HTMLElement|string} container - Container element or selector
   */
  showLoadingDots(container) {
    const element = typeof container === 'string' ? document.querySelector(container) : container;
    if (!element) return;

    element.innerHTML = `
      <div class="loading-dots">
        <div class="loading-dot"></div>
        <div class="loading-dot"></div>
        <div class="loading-dot"></div>
      </div>
    `;
  }

  /**
   * Create a loading state for an image
   * @param {HTMLImageElement} img - Image element
   */
  showImageLoading(img) {
    if (!img) return;

    img.classList.add('image-loading');
    
    img.addEventListener('load', () => {
      img.classList.remove('image-loading');
      img.classList.add('fade-in');
    }, { once: true });
  }

  /**
   * Track a loading operation
   * @param {string} id - Unique identifier for the operation
   * @param {string} message - Loading message
   */
  startLoading(id, message = 'Loading...') {
    this.activeLoaders.set(id, {
      message,
      startTime: Date.now()
    });
    
    this.updateLoadingState();
  }

  /**
   * Complete a loading operation
   * @param {string} id - Unique identifier for the operation
   */
  stopLoading(id) {
    this.activeLoaders.delete(id);
    this.updateLoadingState();
  }

  /**
   * Update overall loading state
   */
  updateLoadingState() {
    if (this.activeLoaders.size > 0) {
      // Get the most recent loading operation
      const latest = Array.from(this.activeLoaders.values()).pop();
      this.showOverlay(latest.message);
    } else {
      this.hideOverlay();
    }
  }

  /**
   * Check if any loading operations are active
   */
  isLoading() {
    return this.activeLoaders.size > 0;
  }

  /**
   * Clear all loading states
   */
  clearAll() {
    this.activeLoaders.clear();
    this.hideOverlay();
  }
}

// Create singleton instance
const loadingManager = new LoadingManager();

export default loadingManager;
