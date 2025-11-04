/**
 * RippleEffect - Adds material design ripple effect to buttons
 * Task 8.2: Micro-interactions
 */

export class RippleEffect {
  constructor() {
    this.init();
  }

  init() {
    // Add ripple effect to all buttons
    this.attachRippleListeners();
    
    // Watch for dynamically added buttons
    this.observeNewButtons();
  }

  attachRippleListeners() {
    const buttons = document.querySelectorAll('.btn, .control-btn, .nav-btn, .copy-btn, .send-btn');
    
    buttons.forEach(button => {
      if (!button.dataset.rippleAttached) {
        button.addEventListener('click', (e) => this.createRipple(e));
        button.dataset.rippleAttached = 'true';
      }
    });
  }

  createRipple(event) {
    const button = event.currentTarget;
    
    // Don't add ripple if button is disabled
    if (button.disabled) return;
    
    // Create ripple element
    const ripple = document.createElement('span');
    ripple.classList.add('ripple');
    
    // Calculate ripple size and position
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    // Set ripple styles
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    
    // Add ripple to button
    button.appendChild(ripple);
    
    // Remove ripple after animation
    setTimeout(() => {
      ripple.remove();
    }, 600);
  }

  observeNewButtons() {
    // Create a MutationObserver to watch for new buttons
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) { // Element node
            // Check if the node itself is a button
            if (this.isButton(node)) {
              this.attachRippleToButton(node);
            }
            // Check for buttons within the added node
            const buttons = node.querySelectorAll?.('.btn, .control-btn, .nav-btn, .copy-btn, .send-btn');
            buttons?.forEach(button => this.attachRippleToButton(button));
          }
        });
      });
    });

    // Start observing
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  isButton(element) {
    return element.classList?.contains('btn') ||
           element.classList?.contains('control-btn') ||
           element.classList?.contains('nav-btn') ||
           element.classList?.contains('copy-btn') ||
           element.classList?.contains('send-btn');
  }

  attachRippleToButton(button) {
    if (!button.dataset.rippleAttached) {
      button.addEventListener('click', (e) => this.createRipple(e));
      button.dataset.rippleAttached = 'true';
    }
  }
}

// Create singleton instance
const rippleEffect = new RippleEffect();

export default rippleEffect;
