/**
 * ResponsiveManager - Handles window resize and responsive behavior
 * Task 9.1: Add window resize handlers
 */

export class ResponsiveManager {
  constructor() {
    this.currentBreakpoint = null;
    this.resizeTimeout = null;
    this.minWidth = 1024;
    this.minHeight = 600;
    this.currentDensity = null;
    
    // Breakpoints for responsive behavior
    this.breakpoints = {
      mobile: 768,
      tablet: 1024,
      desktop: 1440,
      wide: 1920
    };
    
    this.init();
  }

  init() {
    // Detect and optimize for screen density (Task 9.2)
    this.detectScreenDensity();
    
    // Initial check
    this.handleResize();
    
    // Add resize listener with debouncing
    window.addEventListener('resize', () => this.debounceResize());
    
    // Add orientation change listener
    window.addEventListener('orientationchange', () => this.handleResize());
    
    console.log('✅ ResponsiveManager initialized');
  }

  debounceResize() {
    clearTimeout(this.resizeTimeout);
    this.resizeTimeout = setTimeout(() => this.handleResize(), 150);
  }

  handleResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Determine current breakpoint
    const newBreakpoint = this.getBreakpoint(width);
    
    // Check if breakpoint changed
    if (newBreakpoint !== this.currentBreakpoint) {
      this.currentBreakpoint = newBreakpoint;
      this.onBreakpointChange(newBreakpoint);
    }
    
    // Adjust layouts
    this.adjustLayouts(width, height);
    
    // Maintain video aspect ratio
    this.maintainVideoAspectRatio();
    
    // Check minimum size
    this.checkMinimumSize(width, height);
    
    // Dispatch custom event for other components
    window.dispatchEvent(new CustomEvent('responsive-resize', {
      detail: { width, height, breakpoint: newBreakpoint }
    }));
  }

  getBreakpoint(width) {
    if (width < this.breakpoints.mobile) return 'mobile';
    if (width < this.breakpoints.tablet) return 'tablet';
    if (width < this.breakpoints.desktop) return 'desktop';
    if (width < this.breakpoints.wide) return 'large';
    return 'wide';
  }

  onBreakpointChange(breakpoint) {
    console.log(`📱 Breakpoint changed to: ${breakpoint}`);
    
    // Update body class for CSS targeting
    document.body.className = document.body.className
      .replace(/breakpoint-\w+/g, '')
      .trim();
    document.body.classList.add(`breakpoint-${breakpoint}`);
    
    // Adjust UI based on breakpoint
    this.adjustForBreakpoint(breakpoint);
  }

  adjustForBreakpoint(breakpoint) {
    const roomPage = document.getElementById('room-page');
    if (!roomPage || !roomPage.classList.contains('active')) return;
    
    const sidebar = document.querySelector('.sidebar-panel');
    
    switch (breakpoint) {
      case 'mobile':
      case 'tablet':
        // Auto-collapse sidebar on smaller screens
        if (sidebar && !sidebar.classList.contains('collapsed')) {
          sidebar.classList.add('collapsed');
        }
        break;
      
      case 'desktop':
      case 'large':
      case 'wide':
        // Can expand sidebar on larger screens (but don't force it)
        break;
    }
  }

  adjustLayouts(width, height) {
    // Adjust room layout
    this.adjustRoomLayout(width, height);
    
    // Adjust welcome page
    this.adjustWelcomePage(width, height);
    
    // Adjust modals
    this.adjustModals(width, height);
  }

  adjustRoomLayout(width, height) {
    const roomPage = document.getElementById('room-page');
    if (!roomPage || !roomPage.classList.contains('active')) return;
    
    const videoSection = document.querySelector('.video-section');
    const sidebar = document.querySelector('.sidebar-panel');
    const videoContainer = document.querySelector('.video-container');
    
    if (!videoSection) return;
    
    // Calculate available space
    const topBarHeight = 50;
    const availableHeight = height - topBarHeight;
    
    // Adjust video container max height
    if (videoContainer) {
      videoContainer.style.maxHeight = `${availableHeight}px`;
    }
    
    // Handle narrow widths
    if (width < this.breakpoints.tablet) {
      // Stack layout for very narrow screens
      if (sidebar && !sidebar.classList.contains('collapsed')) {
        sidebar.classList.add('collapsed');
      }
    }
  }

  adjustWelcomePage(width, height) {
    const welcomePage = document.getElementById('welcome-page');
    if (!welcomePage || !welcomePage.classList.contains('active')) return;
    
    const heroSection = document.querySelector('.hero-section');
    if (!heroSection) return;
    
    // Adjust hero content sizing based on viewport
    const heroContent = document.querySelector('.hero-content');
    if (heroContent) {
      if (height < 700) {
        heroContent.style.transform = 'scale(0.9)';
      } else {
        heroContent.style.transform = 'scale(1)';
      }
    }
  }

  adjustModals(width, height) {
    const modals = document.querySelectorAll('.modal-container');
    
    modals.forEach(modal => {
      // Adjust modal max height based on viewport
      const maxHeight = height * 0.85;
      modal.style.maxHeight = `${maxHeight}px`;
      
      // Adjust modal width for narrow screens
      if (width < this.breakpoints.tablet) {
        modal.style.width = '95%';
        modal.style.maxWidth = '95%';
      } else {
        modal.style.width = '';
        modal.style.maxWidth = '';
      }
    });
  }

  maintainVideoAspectRatio() {
    const videoElement = document.getElementById('main-video');
    const videoContainer = document.querySelector('.video-container');
    
    if (!videoElement || !videoContainer) return;
    
    // Get container dimensions
    const containerWidth = videoContainer.clientWidth;
    const containerHeight = videoContainer.clientHeight;
    const containerRatio = containerWidth / containerHeight;
    
    // Target aspect ratio (16:9)
    const targetRatio = 16 / 9;
    
    // Calculate dimensions to maintain aspect ratio
    let videoWidth, videoHeight;
    
    if (containerRatio > targetRatio) {
      // Container is wider than 16:9
      videoHeight = containerHeight;
      videoWidth = videoHeight * targetRatio;
    } else {
      // Container is taller than 16:9
      videoWidth = containerWidth;
      videoHeight = videoWidth / targetRatio;
    }
    
    // Apply dimensions
    videoElement.style.width = `${videoWidth}px`;
    videoElement.style.height = `${videoHeight}px`;
    videoElement.style.maxWidth = '100%';
    videoElement.style.maxHeight = '100%';
  }

  checkMinimumSize(width, height) {
    const warning = document.getElementById('size-warning');
    
    if (width < this.minWidth || height < this.minHeight) {
      // Show warning if it doesn't exist
      if (!warning) {
        this.showSizeWarning(width, height);
      }
    } else {
      // Remove warning if it exists
      if (warning) {
        warning.remove();
      }
    }
  }

  showSizeWarning(width, height) {
    // Create warning overlay
    const warning = document.createElement('div');
    warning.id = 'size-warning';
    warning.className = 'size-warning-overlay';
    warning.innerHTML = `
      <div class="size-warning-content">
        <div class="warning-icon">⚠️</div>
        <h3>Window Too Small</h3>
        <p>For the best experience, please resize your window to at least:</p>
        <div class="size-requirements">
          <div class="size-req">
            <span class="size-label">Width:</span>
            <span class="size-value">${this.minWidth}px</span>
            <span class="size-current ${width < this.minWidth ? 'insufficient' : 'sufficient'}">(${width}px)</span>
          </div>
          <div class="size-req">
            <span class="size-label">Height:</span>
            <span class="size-value">${this.minHeight}px</span>
            <span class="size-current ${height < this.minHeight ? 'insufficient' : 'sufficient'}">(${height}px)</span>
          </div>
        </div>
        <p class="size-note">The app will continue to work, but some features may not display correctly.</p>
      </div>
    `;
    
    document.body.appendChild(warning);
  }

  // Public method to get current viewport info
  getViewportInfo() {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      breakpoint: this.currentBreakpoint,
      isMinimumSize: window.innerWidth >= this.minWidth && window.innerHeight >= this.minHeight
    };
  }

  // Public method to force a resize check
  forceResize() {
    this.handleResize();
  }

  /**
   * Task 9.2: Detect and optimize for different screen densities
   * Handles 1x, 1.5x, 2x, and higher pixel densities
   */
  detectScreenDensity() {
    // Get device pixel ratio
    const dpr = window.devicePixelRatio || 1;
    
    // Determine density category
    let densityCategory;
    if (dpr >= 3) {
      densityCategory = '3x'; // Ultra high density (e.g., iPhone Plus, some Android)
    } else if (dpr >= 2) {
      densityCategory = '2x'; // Retina/High density
    } else if (dpr >= 1.5) {
      densityCategory = '1.5x'; // Medium-high density
    } else {
      densityCategory = '1x'; // Standard density
    }
    
    this.currentDensity = {
      ratio: dpr,
      category: densityCategory
    };
    
    console.log(`📱 Screen density detected: ${densityCategory} (${dpr}x)`);
    
    // Apply density-specific optimizations
    this.applyDensityOptimizations(densityCategory, dpr);
    
    // Add density class to body for CSS targeting
    document.body.classList.add(`density-${densityCategory}`);
    document.body.setAttribute('data-pixel-ratio', dpr);
  }

  applyDensityOptimizations(category, dpr) {
    // Optimize font rendering for high DPI displays
    if (dpr >= 2) {
      document.body.style.webkitFontSmoothing = 'antialiased';
      document.body.style.mozOsxFontSmoothing = 'grayscale';
    }
    
    // Adjust UI element sizes for different densities
    this.adjustUIForDensity(category, dpr);
    
    // Optimize images and media for density
    this.optimizeMediaForDensity(dpr);
    
    // Adjust text readability
    this.ensureTextReadability(category, dpr);
  }

  adjustUIForDensity(category, dpr) {
    const root = document.documentElement;
    
    switch (category) {
      case '3x':
        // Ultra high density - slightly reduce sizes to prevent UI from being too large
        root.style.setProperty('--ui-scale', '0.95');
        break;
      
      case '2x':
        // High density (Retina) - standard sizing works well
        root.style.setProperty('--ui-scale', '1');
        break;
      
      case '1.5x':
        // Medium-high density - slightly increase for better visibility
        root.style.setProperty('--ui-scale', '1.05');
        break;
      
      case '1x':
        // Standard density - slightly larger for better visibility
        root.style.setProperty('--ui-scale', '1.1');
        break;
    }
    
    // Apply scaling to interactive elements
    const interactiveElements = document.querySelectorAll('.btn, .control-btn, .tab-btn');
    interactiveElements.forEach(el => {
      if (dpr >= 2) {
        // On high DPI, we can use slightly thinner borders
        el.style.borderWidth = '0.5px';
      }
    });
  }

  optimizeMediaForDensity(dpr) {
    // Set canvas and video rendering quality based on density
    const canvases = document.querySelectorAll('canvas');
    canvases.forEach(canvas => {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Scale canvas for high DPI
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
      }
    });
    
    // Optimize video player for density
    const videoElement = document.getElementById('main-video');
    if (videoElement) {
      // Ensure video renders at native resolution on high DPI
      if (dpr >= 2) {
        videoElement.style.imageRendering = 'crisp-edges';
      }
    }
  }

  ensureTextReadability(category, dpr) {
    const root = document.documentElement;
    
    // Adjust minimum font sizes for readability across densities
    if (dpr >= 2) {
      // High DPI displays can handle smaller text
      root.style.setProperty('--min-font-size', '12px');
    } else if (dpr >= 1.5) {
      // Medium density needs slightly larger minimum
      root.style.setProperty('--min-font-size', '13px');
    } else {
      // Standard density needs larger minimum for readability
      root.style.setProperty('--min-font-size', '14px');
    }
    
    // Ensure all text elements respect minimum size
    const textElements = document.querySelectorAll('p, span, div, label, button');
    textElements.forEach(el => {
      const computedSize = parseFloat(window.getComputedStyle(el).fontSize);
      const minSize = parseFloat(root.style.getPropertyValue('--min-font-size') || '12px');
      
      if (computedSize < minSize) {
        el.style.fontSize = `${minSize}px`;
      }
    });
  }

  // Get current density information
  getDensityInfo() {
    return {
      ratio: this.currentDensity?.ratio || window.devicePixelRatio || 1,
      category: this.currentDensity?.category || '1x',
      isHighDensity: (this.currentDensity?.ratio || 1) >= 2,
      isRetina: (this.currentDensity?.ratio || 1) >= 2
    };
  }

  // Test method to verify density detection
  logDensityInfo() {
    const info = this.getDensityInfo();
    console.log('Screen Density Information:');
    console.log(`  Pixel Ratio: ${info.ratio}x`);
    console.log(`  Category: ${info.category}`);
    console.log(`  High Density: ${info.isHighDensity ? 'Yes' : 'No'}`);
    console.log(`  Retina Display: ${info.isRetina ? 'Yes' : 'No'}`);
    console.log(`  Screen Size: ${window.screen.width}x${window.screen.height}`);
    console.log(`  Viewport Size: ${window.innerWidth}x${window.innerHeight}`);
  }
}

export default ResponsiveManager;
