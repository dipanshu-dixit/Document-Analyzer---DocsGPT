// UI State Management - Pure Store Projections
// Rule 1: UI is pure projection of store state
// Rule 2: UI never triggers state transitions directly
// Rule 3: One scroll container per column
// Rule 4: Suggested questions are dumb buttons

// Input state management - synchronized with stores
class InputManager {
  constructor() {
    this.questionInput = null;
    this.askBtn = null;
    this.isInitialized = false;
  }

  init() {
    this.questionInput = document.getElementById('question');
    this.askBtn = document.getElementById('ask-btn');
    this.isInitialized = true;
    this.syncInputState();
  }

  // Rule 1: Input state reflects store state only
  syncInputState() {
    if (!this.isInitialized) return;
    
    const canAsk = window.canAskQuestions ? window.canAskQuestions() : false;
    const isSending = window.chatStore ? window.chatStore.isSending : false;
    
    // Disable input if cannot ask or currently sending
    this.questionInput.disabled = !canAsk || isSending;
    this.askBtn.disabled = !canAsk || isSending;
    
    // Update placeholder based on state
    if (!canAsk) {
      this.questionInput.placeholder = 'Upload and parse a document to ask questions';
    } else if (isSending) {
      this.questionInput.placeholder = 'Processing...';
    } else {
      // Get active document for contextual placeholder
      const activeDoc = window.getActiveDocument ? window.getActiveDocument() : null;
      if (activeDoc) {
        this.questionInput.placeholder = `Ask a question about "${activeDoc.metadata.name}"`;
      } else {
        this.questionInput.placeholder = 'Ask a question about this document';
      }
    }
  }

  // Rule 4: Only populate input, never auto-send
  fillQuestion(question) {
    if (!this.isInitialized || typeof question !== 'string') return;
    
    this.questionInput.value = question;
    this.questionInput.focus();
  }

  clearInput() {
    if (!this.isInitialized) return;
    this.questionInput.value = '';
  }

  getValue() {
    return this.isInitialized ? this.questionInput.value.trim() : '';
  }
}

// Scroll management - Rule 3: Independent scroll containers
class ScrollManager {
  constructor() {
    this.containers = new Map();
  }

  registerContainer(id, options = {}) {
    const element = document.getElementById(id);
    if (!element) return;
    
    this.containers.set(id, {
      element,
      autoScroll: options.autoScroll || false,
      lastScrollHeight: 0
    });
  }

  // Maintain scroll position or auto-scroll to bottom
  updateScroll(containerId) {
    const container = this.containers.get(containerId);
    if (!container) return;
    
    const { element, autoScroll } = container;
    
    if (autoScroll) {
      // Auto-scroll to bottom for chat
      element.scrollTop = element.scrollHeight;
    }
    
    container.lastScrollHeight = element.scrollHeight;
  }

  // Check if user has scrolled up (to prevent auto-scroll)
  isAtBottom(containerId) {
    const container = this.containers.get(containerId);
    if (!container) return true;
    
    const { element } = container;
    return element.scrollTop + element.clientHeight >= element.scrollHeight - 10;
  }
}

// Loading state management - no local state
class LoadingManager {
  showLoading(elementId, message = 'Loading...') {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    element.classList.add('loading');
    element.setAttribute('data-loading-message', message);
  }

  hideLoading(elementId) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    element.classList.remove('loading');
    element.removeAttribute('data-loading-message');
  }

  // Show loading overlay for entire sections
  showSectionLoading(sectionId, message) {
    const section = document.getElementById(sectionId);
    if (!section) return;
    
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `
      <div class="loading-spinner"></div>
      <div class="loading-text">${message}</div>
    `;
    overlay.id = `${sectionId}-loading`;
    
    section.style.position = 'relative';
    section.appendChild(overlay);
  }

  hideSectionLoading(sectionId) {
    const overlay = document.getElementById(`${sectionId}-loading`);
    if (overlay) {
      overlay.remove();
    }
  }
}

// Error display - pure functions
function showError(message, containerId = 'conversation') {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  container.innerHTML = `
    <div class="error-state">
      <div class="error-icon">⚠</div>
      <div class="error-message">${escapeHtml(message)}</div>
    </div>
  `;
}

function showEmptyState(message, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  container.innerHTML = `
    <div class="empty-state">
      <div class="empty-message">${escapeHtml(message)}</div>
    </div>
  `;
}

// Utility functions
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Export managers as singletons
export const inputManager = new InputManager();
export const scrollManager = new ScrollManager();
export const loadingManager = new LoadingManager();

// Export utility functions
export { showError, showEmptyState, escapeHtml, formatFileSize };