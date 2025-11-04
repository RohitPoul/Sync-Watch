/**
 * Sidebar Component
 * Manages collapsible sidebar with chat and users sections
 */

export class Sidebar {
  constructor() {
    this.sidebar = document.getElementById('sidebar-panel');
    this.toggleBtn = document.getElementById('sidebar-toggle');
    this.isCollapsed = false;
    
    // Session storage key
    this.storageKey = 'sidebar-collapsed';
    
    this.init();
  }

  init() {
    if (!this.sidebar || !this.toggleBtn) {
      console.warn('Sidebar elements not found');
      return;
    }

    // Restore saved state
    this.restoreState();

    // Setup toggle button
    this.toggleBtn.addEventListener('click', () => {
      this.toggle();
    });

    // Handle keyboard shortcut (Ctrl/Cmd + B)
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        this.toggle();
      }
    });

    console.log('✅ Sidebar initialized');
  }

  toggle() {
    if (this.isCollapsed) {
      this.expand();
    } else {
      this.collapse();
    }
  }

  collapse() {
    this.sidebar.classList.add('collapsed');
    this.isCollapsed = true;
    this.saveState();
    
    // Dispatch event for other components to react
    window.dispatchEvent(new CustomEvent('sidebar-collapsed', {
      detail: { collapsed: true }
    }));
  }

  expand() {
    this.sidebar.classList.remove('collapsed');
    this.isCollapsed = false;
    this.saveState();
    
    // Dispatch event for other components to react
    window.dispatchEvent(new CustomEvent('sidebar-collapsed', {
      detail: { collapsed: false }
    }));
  }

  saveState() {
    try {
      sessionStorage.setItem(this.storageKey, JSON.stringify(this.isCollapsed));
    } catch (e) {
      console.warn('Failed to save sidebar state:', e);
    }
  }

  restoreState() {
    try {
      const saved = sessionStorage.getItem(this.storageKey);
      if (saved !== null) {
        const collapsed = JSON.parse(saved);
        if (collapsed) {
          this.sidebar.classList.add('collapsed');
          this.isCollapsed = true;
        }
      }
    } catch (e) {
      console.warn('Failed to restore sidebar state:', e);
    }
  }

  getState() {
    return {
      collapsed: this.isCollapsed
    };
  }
}

export default Sidebar;
