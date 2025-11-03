/**
 * ColorContrastChecker - Ensures WCAG AA color contrast compliance
 * Task 10.3: Ensure color contrast
 * 
 * Features:
 * - Check color contrast ratios
 * - Add text labels to color-only indicators
 * - Provide high contrast mode
 * - Test with color blindness simulators
 */

export class ColorContrastChecker {
  constructor() {
    this.minContrastRatio = 4.5; // WCAG AA standard for normal text
    this.minContrastRatioLarge = 3.0; // WCAG AA standard for large text (18pt+)
    this.init();
  }

  init() {
    // Add text labels to color-only indicators
    this.addTextLabelsToColorIndicators();
    
    // Check contrast ratios in development
    if (this.isDevelopment()) {
      this.checkAllContrasts();
    }
    
    // Set up high contrast mode listener
    this.setupHighContrastMode();
  }

  /**
   * Check if running in development mode
   */
  isDevelopment() {
    return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  }

  /**
   * Add text labels to color-only status indicators
   */
  addTextLabelsToColorIndicators() {
    // Connection status indicators
    const connectionStatuses = document.querySelectorAll('.connection-status, .sync-status, .media-status');
    
    connectionStatuses.forEach(status => {
      const dot = status.querySelector('.status-dot');
      const textElement = status.querySelector('span:not(.status-dot)');
      
      if (dot && !textElement) {
        // Add text label if missing
        const label = document.createElement('span');
        label.className = 'status-text';
        label.textContent = this.getStatusText(dot);
        status.appendChild(label);
      }
      
      // Ensure status has both color and text
      if (dot && textElement) {
        // Add sr-only class to dot for screen readers
        if (!dot.hasAttribute('aria-label')) {
          const statusText = textElement.textContent || 'Status';
          dot.setAttribute('aria-label', statusText);
        }
      }
    });

    // Network quality indicators
    document.querySelectorAll('.network-quality, .speed-indicator').forEach(indicator => {
      if (!indicator.textContent.trim()) {
        const quality = this.getQualityFromColor(indicator);
        const label = document.createElement('span');
        label.className = 'quality-text';
        label.textContent = quality;
        indicator.appendChild(label);
      }
    });

    // Progress bars - add percentage text
    document.querySelectorAll('.progress-bar').forEach(bar => {
      const fill = bar.querySelector('.progress-fill');
      if (fill && !bar.querySelector('.progress-text')) {
        const percentage = fill.style.width || '0%';
        const text = document.createElement('span');
        text.className = 'progress-text sr-only';
        text.textContent = `Progress: ${percentage}`;
        bar.appendChild(text);
      }
    });
  }

  /**
   * Get status text from dot color classes
   */
  getStatusText(dot) {
    if (dot.classList.contains('connected') || dot.style.background?.includes('#10b981')) {
      return 'Connected';
    } else if (dot.classList.contains('connecting') || dot.style.background?.includes('#f59e0b')) {
      return 'Connecting';
    } else if (dot.classList.contains('disconnected') || dot.style.background?.includes('#ef4444')) {
      return 'Disconnected';
    }
    return 'Unknown';
  }

  /**
   * Get quality level from color
   */
  getQualityFromColor(element) {
    const color = window.getComputedStyle(element).backgroundColor;
    // Parse RGB and determine quality
    if (color.includes('16, 185, 129')) return 'Excellent';
    if (color.includes('245, 158, 11')) return 'Good';
    if (color.includes('239, 68, 68')) return 'Poor';
    return 'Unknown';
  }

  /**
   * Calculate contrast ratio between two colors
   * @param {string} color1 - First color (hex or rgb)
   * @param {string} color2 - Second color (hex or rgb)
   * @returns {number} Contrast ratio
   */
  calculateContrastRatio(color1, color2) {
    const lum1 = this.getLuminance(color1);
    const lum2 = this.getLuminance(color2);
    
    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);
    
    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Get relative luminance of a color
   * @param {string} color - Color in hex or rgb format
   * @returns {number} Relative luminance
   */
  getLuminance(color) {
    const rgb = this.parseColor(color);
    const [r, g, b] = rgb.map(val => {
      val = val / 255;
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  /**
   * Parse color string to RGB array
   * @param {string} color - Color string
   * @returns {number[]} RGB values
   */
  parseColor(color) {
    // Handle hex colors
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return [r, g, b];
    }
    
    // Handle rgb/rgba colors
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
    }
    
    return [0, 0, 0];
  }

  /**
   * Check contrast ratio for an element
   * @param {HTMLElement} element - Element to check
   * @returns {Object} Contrast check result
   */
  checkElementContrast(element) {
    const style = window.getComputedStyle(element);
    const color = style.color;
    const backgroundColor = style.backgroundColor;
    
    // Skip if transparent background
    if (backgroundColor === 'rgba(0, 0, 0, 0)' || backgroundColor === 'transparent') {
      // Try to find parent with background
      let parent = element.parentElement;
      while (parent && (window.getComputedStyle(parent).backgroundColor === 'rgba(0, 0, 0, 0)' || 
                        window.getComputedStyle(parent).backgroundColor === 'transparent')) {
        parent = parent.parentElement;
      }
      if (parent) {
        return this.checkContrast(color, window.getComputedStyle(parent).backgroundColor, element);
      }
    }
    
    return this.checkContrast(color, backgroundColor, element);
  }

  /**
   * Check if contrast ratio meets WCAG standards
   * @param {string} foreground - Foreground color
   * @param {string} background - Background color
   * @param {HTMLElement} element - Element being checked
   * @returns {Object} Check result
   */
  checkContrast(foreground, background, element) {
    const ratio = this.calculateContrastRatio(foreground, background);
    const fontSize = parseFloat(window.getComputedStyle(element).fontSize);
    const fontWeight = window.getComputedStyle(element).fontWeight;
    
    // Large text is 18pt (24px) or 14pt (18.66px) bold
    const isLargeText = fontSize >= 24 || (fontSize >= 18.66 && parseInt(fontWeight) >= 700);
    const minRatio = isLargeText ? this.minContrastRatioLarge : this.minContrastRatio;
    
    return {
      ratio: ratio.toFixed(2),
      passes: ratio >= minRatio,
      minRequired: minRatio,
      isLargeText,
      element
    };
  }

  /**
   * Check all text elements for contrast issues
   */
  checkAllContrasts() {
    const textElements = document.querySelectorAll('p, span, a, button, h1, h2, h3, h4, h5, h6, label, input, textarea, select');
    const issues = [];
    
    textElements.forEach(element => {
      // Skip hidden elements
      if (element.offsetParent === null) return;
      
      const result = this.checkElementContrast(element);
      if (!result.passes) {
        issues.push({
          element,
          ...result
        });
      }
    });
    
    if (issues.length > 0) {
      console.group('⚠️ Color Contrast Issues Found');
      issues.forEach(issue => {
        console.warn(
          `Contrast ratio ${issue.ratio}:1 (min: ${issue.minRequired}:1)`,
          issue.element
        );
      });
      console.groupEnd();
    } else {
      console.log('✅ All text elements meet WCAG AA contrast standards');
    }
    
    return issues;
  }

  /**
   * Set up high contrast mode
   */
  setupHighContrastMode() {
    // Detect system high contrast preference
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    
    const applyHighContrast = (matches) => {
      if (matches) {
        document.body.classList.add('high-contrast-mode');
        console.log('🎨 High contrast mode enabled');
      } else {
        document.body.classList.remove('high-contrast-mode');
      }
    };
    
    // Apply on load
    applyHighContrast(highContrastQuery.matches);
    
    // Listen for changes
    highContrastQuery.addEventListener('change', (e) => {
      applyHighContrast(e.matches);
    });
  }

  /**
   * Simulate color blindness for testing
   * @param {string} type - Type of color blindness: 'protanopia', 'deuteranopia', 'tritanopia'
   */
  simulateColorBlindness(type) {
    const filters = {
      protanopia: 'url(#protanopia-filter)',
      deuteranopia: 'url(#deuteranopia-filter)',
      tritanopia: 'url(#tritanopia-filter)',
      none: 'none'
    };
    
    document.body.style.filter = filters[type] || filters.none;
    
    // Add SVG filters if not present
    if (type !== 'none' && !document.getElementById(`${type}-filter`)) {
      this.addColorBlindnessFilters();
    }
  }

  /**
   * Add SVG filters for color blindness simulation
   */
  addColorBlindnessFilters() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style.position = 'absolute';
    svg.style.width = '0';
    svg.style.height = '0';
    
    svg.innerHTML = `
      <defs>
        <!-- Protanopia (red-blind) -->
        <filter id="protanopia-filter">
          <feColorMatrix type="matrix" values="
            0.567, 0.433, 0,     0, 0
            0.558, 0.442, 0,     0, 0
            0,     0.242, 0.758, 0, 0
            0,     0,     0,     1, 0"/>
        </filter>
        
        <!-- Deuteranopia (green-blind) -->
        <filter id="deuteranopia-filter">
          <feColorMatrix type="matrix" values="
            0.625, 0.375, 0,   0, 0
            0.7,   0.3,   0,   0, 0
            0,     0.3,   0.7, 0, 0
            0,     0,     0,   1, 0"/>
        </filter>
        
        <!-- Tritanopia (blue-blind) -->
        <filter id="tritanopia-filter">
          <feColorMatrix type="matrix" values="
            0.95, 0.05,  0,     0, 0
            0,    0.433, 0.567, 0, 0
            0,    0.475, 0.525, 0, 0
            0,    0,     0,     1, 0"/>
        </filter>
      </defs>
    `;
    
    document.body.appendChild(svg);
  }

  /**
   * Generate accessibility report
   * @returns {Object} Accessibility report
   */
  generateReport() {
    const contrastIssues = this.checkAllContrasts();
    
    return {
      timestamp: new Date().toISOString(),
      contrastIssues: contrastIssues.length,
      details: contrastIssues,
      recommendations: this.getRecommendations(contrastIssues)
    };
  }

  /**
   * Get recommendations for fixing contrast issues
   * @param {Array} issues - Array of contrast issues
   * @returns {Array} Recommendations
   */
  getRecommendations(issues) {
    const recommendations = [];
    
    issues.forEach(issue => {
      const needed = issue.minRequired;
      const current = parseFloat(issue.ratio);
      const improvement = ((needed / current - 1) * 100).toFixed(0);
      
      recommendations.push({
        element: issue.element.tagName,
        text: issue.element.textContent?.substring(0, 50),
        currentRatio: current,
        neededRatio: needed,
        suggestion: `Increase contrast by approximately ${improvement}% by adjusting text or background color`
      });
    });
    
    return recommendations;
  }
}

// Create singleton instance
const colorContrastChecker = new ColorContrastChecker();

export default colorContrastChecker;
