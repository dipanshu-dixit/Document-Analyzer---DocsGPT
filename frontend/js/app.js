// Clean Document Analysis System - Contract Enforced
import { handleFileUpload } from './upload.js';
import { analyzeWithIntent, getSuggestedQuestions as getIntentQuestions, getQuestionIntent } from './actions.js';
import { SessionStore, DocumentStore, ChatStore, DocumentState } from './stores.js';
import { inputManager, scrollManager, loadingManager, showError, showEmptyState, escapeHtml, formatFileSize } from './ui.js';
import { saveConfig, loadConfig } from './storage.js';
import { marked } from "https://cdn.jsdelivr.net/npm/marked@11.1.1/lib/marked.esm.js";

// Configure marked for safe rendering
marked.setOptions({
  headerIds: false,
  mangle: false,
  breaks: true
});

function renderMessage(content) {
  return marked.parse(content);
}

// Global stores - clean separation
const sessionStore = new SessionStore();
const documentStore = new DocumentStore();
const chatStore = new ChatStore();

const config = {
  provider: 'xai',
  model: 'grok-4-1-fast-reasoning',
  apiKey: 'your-api-key-here'  // TODO: Move to .env file
};

// Expose to window for UI managers
window.canAskQuestions = canAskQuestions;
window.chatStore = chatStore;
window.getActiveDocument = getActiveDocument;

// Core functions - clean contracts only
function init() {
  // Restore all stores from storage
  sessionStore.restore();
  documentStore.restore();
  chatStore.restore();
  
  // Initialize dark mode
  initDarkMode();
  
  // Initialize UI managers
  inputManager.init();
  scrollManager.registerContainer('conversation', { autoScroll: true });
  scrollManager.registerContainer('sessions-list', { autoScroll: false });
  scrollManager.registerContainer('sources-list', { autoScroll: false });
  scrollManager.registerContainer('context-content', { autoScroll: false });
  
  render();
  bindEvents();
  
  // Initialize mobile view on app start
  if (window.innerWidth <= 767) {
    renderMobileView();
  }
  
  console.log('Document Analysis System initialized');
}

function switchToSession(sessionId) {
  sessionStore.setActiveSession(sessionId);
  render();
}

function getActiveSession() {
  return sessionStore.getActiveSession();
}

function getActiveDocument() {
  const session = getActiveSession();
  if (!session || !session.activeDocumentId) return null;
  
  return documentStore.getDocument(session.activeDocumentId);
}

// Hard contract: only allow questions if document is PARSED
function canAskQuestions() {
  const doc = getActiveDocument();
  console.log('canAskQuestions check:', { doc, isQueryable: doc ? documentStore.isQueryable(doc.docId) : false });
  return doc && documentStore.isQueryable(doc.docId);
}

// Hard contract: only show suggestions if no messages and document is PARSED
function getSuggestedQuestions() {
  const session = getActiveSession();
  if (!canAskQuestions() || !session || chatStore.getMessages(session.sessionId).length > 0) {
    return [];
  }
  
  return getIntentQuestions();
}

// UI Rendering - pure functions of state
function render() {
  renderSessions();
  renderSources();
  renderMainArea();
  renderEvidence();
  
  // Set mobile panel state
  const isMobile = window.innerWidth <= 768;
  document.body.dataset.mobilePanel = isMobile ? mobilePanel : 'all';
  
  // Sync UI state after rendering
  inputManager.syncInputState();
}

function renderSessions() {
  const container = document.getElementById('sessions-list');
  const sessions = Array.from(sessionStore.sessions.entries());
  
  if (sessions.length === 0) {
    showEmptyState('No sessions', 'sessions-list');
    return;
  }
  
  container.innerHTML = sessions.map(([id, session]) => `
    <div class="session-item ${sessionStore.activeSessionId === id ? 'active' : ''}" data-session-id="${id}">
      <div class="session-name" ondblclick="renameSession('${id}')">${escapeHtml(session.name)}</div>
      <div class="session-meta">${session.activeDocumentIds.length} docs</div>
    </div>
  `).join('');
  
  scrollManager.updateScroll('sessions-list');
}

function renderSources() {
  const container = document.getElementById('sources-list');
  const session = getActiveSession();
  
  if (!session) {
    showEmptyState('No session selected', 'sources-list');
    return;
  }
  
  if (session.activeDocumentIds.length === 0) {
    container.innerHTML = '<div class="active-sources-empty">Select a document to analyze</div>';
    return;
  }
  
  const sourcesHint = session.activeDocumentIds.length > 1 ? 
    '<div class="sources-hint">Click a document to make it active for analysis</div>' : '';
  
  container.innerHTML = sourcesHint + session.activeDocumentIds.map(docId => {
    const doc = documentStore.getDocument(docId);
    if (!doc) return '';
    
    const isActive = session.activeDocumentId === docId;
    let stateIndicator, stateText;
    
    switch(doc.state) {
      case DocumentState.PARSED: 
        stateIndicator = '●'; 
        stateText = 'READY'; 
        break;
      case DocumentState.PARSING: 
        stateIndicator = '◑'; 
        stateText = 'PARSING'; 
        break;
      case DocumentState.PARSE_FAILED: 
        stateIndicator = '✗'; 
        stateText = 'PARSE FAILED'; 
        break;
      case DocumentState.REQUIRES_REUPLOAD:
        stateIndicator = '⚠';
        stateText = 'NEEDS RE-UPLOAD';
        break;
      default: 
        stateIndicator = '○'; 
        stateText = 'UPLOADED';
    }
    
    const needsReupload = doc.state === DocumentState.REQUIRES_REUPLOAD;
    
    return `
      <div class="source-item ${isActive ? 'active' : ''} ${needsReupload ? 'needs-reupload' : ''}" data-doc-id="${docId}">
        <div class="source-indicator">${stateIndicator}</div>
        <div class="source-info">
          <div class="source-name">${escapeHtml(doc.metadata.name)}${isActive ? ' (active)' : ''}</div>
          <div class="source-meta">${formatFileSize(doc.metadata.size)} • ${stateText}</div>
          ${needsReupload ? '<div class="reupload-hint">Click to re-upload file</div>' : ''}
        </div>
      </div>
    `;
  }).filter(html => html).join('');
  
  scrollManager.updateScroll('sources-list');
}

function renderMainArea() {
  const contextHeader = document.getElementById('active-context');
  const suggestionsContainer = document.getElementById('suggested-questions');
  const conversationContainer = document.getElementById('conversation');
  
  const session = getActiveSession();
  const doc = getActiveDocument();
  
  // Context header
  if (!session) {
    contextHeader.innerHTML = 'No session active';
  } else if (!doc) {
    contextHeader.innerHTML = `Session: ${escapeHtml(session.name)} | No document`;
  } else {
    contextHeader.innerHTML = `Session: ${escapeHtml(session.name)} | Document: ${escapeHtml(doc.metadata.name)} (${doc.state})`;
  }
  
  // Show file persistence notice if any document requires re-upload
  const hasReuploadDocs = session && session.activeDocumentIds.some(docId => {
    const d = documentStore.getDocument(docId);
    return d && d.state === DocumentState.REQUIRES_REUPLOAD;
  });
  
  let persistenceNotice = '';
  if (hasReuploadDocs) {
    persistenceNotice = `
      <div class="persistence-notice">
        <div class="notice-icon">ℹ</div>
        <div class="notice-text">
          <strong>File Persistence:</strong> For privacy and security, browsers cannot persist uploaded files across page refresh. 
          Documents must be re-uploaded to continue analysis.
        </div>
      </div>
    `;
  }
  
  // Main content based on state
  if (!session || !doc) {
    conversationContainer.innerHTML = persistenceNotice + `
      <div class="empty-state onboarding">
        <div class="onboarding-title">Analyze documents, not chats.</div>
        <div class="onboarding-subtitle">Upload a PDF, DOCX, or TXT file to:</div>
        <div class="onboarding-list">
          • Extract key facts<br>
          • Identify risks and obligations<br>
          • Ask precise questions grounded in the document
        </div>
        <div class="onboarding-cta">⬆️ Upload a document to begin.</div>
      </div>
    `;
    suggestionsContainer.innerHTML = '';
    return;
  }
  
  // Document state handling
  if (doc.state === DocumentState.UPLOADED) {
    conversationContainer.innerHTML = persistenceNotice + `
      <div class="parse-required">
        <div class="status-text">Document uploaded.<br>Parse the document to enable analysis.</div>
        <button class="parse-btn" onclick="parseDocument('${doc.docId}')">
          Parse document
        </button>
      </div>
    `;
    suggestionsContainer.innerHTML = '';
    return;
  }
  
  if (doc.state === DocumentState.REQUIRES_REUPLOAD) {
    conversationContainer.innerHTML = persistenceNotice + `
      <div class="reupload-required">
        <div class="status-icon">⚠</div>
        <div class="status-content">
          <div class="status-title">File required</div>
          <div class="status-subtitle">This document was restored from a previous session.</div>
          <div class="status-subtitle">Please re-upload the file to continue analysis.</div>
          <button class="reupload-btn" onclick="triggerReupload('${doc.docId}')">
            Re-upload document
          </button>
        </div>
      </div>
    `;
    suggestionsContainer.innerHTML = '';
    return;
  }
  
  if (doc.state === DocumentState.PARSING) {
    loadingManager.showSectionLoading('conversation', 'Parsing document...');
    suggestionsContainer.innerHTML = '';
    return;
  } else {
    loadingManager.hideSectionLoading('conversation');
  }
  
  if (doc.state === DocumentState.PARSE_FAILED) {
    conversationContainer.innerHTML = persistenceNotice;
    showError(`Parsing failed: ${doc.parseError}`, 'conversation');
    conversationContainer.innerHTML += `
      <button class="parse-btn" onclick="parseDocument('${doc.docId}')">
        Retry parsing
      </button>
    `;
    suggestionsContainer.innerHTML = '';
    return;
  }
  
  // Only show chat if document is PARSED
  if (doc.state === DocumentState.PARSED) {
    const session = getActiveSession();
    const messages = chatStore.getMessages(session.sessionId);
    
    // Context anchor - single source of truth
    const contextAnchor = `
      <div class="context-lock-banner">
        Answering from: ${escapeHtml(doc.metadata.name)}
      </div>
    `;
    
    // Fallback notice - only when multiple documents exist
    const fallbackNotice = session.activeDocumentIds.length > 1 ? 
      '<div class="source-authority">Answers are based on the currently selected document.</div>' : '';
    
    if (messages.length === 0) {
      conversationContainer.innerHTML = persistenceNotice + contextAnchor + fallbackNotice + `
        <div class="ready onboarding">
          <div class="ready-title">Document ready for analysis.</div>
          <div class="ready-subtitle">You can:</div>
          <div class="ready-list">
            • Ask specific questions<br>
            • Extract entities or key facts<br>
            • Generate executive summaries
          </div>
        </div>
      `;
    } else {
      const wasAtBottom = scrollManager.isAtBottom('conversation');
      const isSending = chatStore.isSending;
      
      conversationContainer.innerHTML = persistenceNotice + contextAnchor + fallbackNotice + `
        ${messages.map(msg => `
          <div class="message ${msg.role}">
            <div class="message-content">${msg.role === 'user' ? escapeHtml(msg.content) : renderMessage(msg.content)}</div>
          </div>
        `).join('')}
        
        ${isSending ? `
          <div class="message assistant pending">
            <div class="message-content">
              <span class="typing-indicator">DocsGPT</span>
            </div>
          </div>
        ` : ''}
      `;
      
      // Only auto-scroll if user was at bottom
      if (wasAtBottom) {
        scrollManager.updateScroll('conversation');
      }
    }
    
    // Suggestions only if no messages
    const suggestions = getSuggestedQuestions();
    if (suggestions.length > 0) {
      suggestionsContainer.innerHTML = `
        <div class="suggestions">
          <div class="suggestions-title">Suggested analyses</div>
          ${suggestions.map(q => `
            <div class="suggestion-item" onclick="fillQuestion('${escapeHtml(q.text)}')">• ${escapeHtml(q.text)}</div>
          `).join('')}
        </div>
      `;
    } else {
      suggestionsContainer.innerHTML = '';
    }
  }
}

async function renderEvidence() {
  const container = document.getElementById('context-content');
  const doc = getActiveDocument();
  
  if (!doc) {
    showEmptyState('No document selected', 'context-content');
    return;
  }
  
  // SECTION 1: DOCUMENT OVERVIEW (Always visible)
  const fileType = doc.metadata.name.split('.').pop().toUpperCase();
  const fileSizeKB = Math.round(doc.metadata.size / 1024);
  
  let overviewHTML = `
    <div class="evidence-section">
      <div class="evidence-header">Document Overview</div>
      <div class="evidence-row">
        <span class="evidence-label">Name</span>
        <span class="evidence-value">${escapeHtml(doc.metadata.name)}</span>
      </div>
      <div class="evidence-row">
        <span class="evidence-label">File type</span>
        <span class="evidence-value">${fileType}</span>
      </div>
      <div class="evidence-row">
        <span class="evidence-label">File size</span>
        <span class="evidence-value">${fileSizeKB} KB</span>
      </div>
      <div class="evidence-row">
        <span class="evidence-label">State</span>
        <span class="evidence-value">${doc.state}</span>
      </div>
    </div>
  `;
  
  // SECTION 2: CONTENT METRICS (Only if parsed)
  let contentHTML = '';
  if (doc.state === DocumentState.PARSED && doc.parsedArtifactId) {
    try {
      const metrics = await documentStore.getContentMetrics(doc.docId);
      if (metrics) {
        contentHTML = `
          <div class="evidence-section">
            <div class="evidence-header">Content Metrics</div>
            <div class="evidence-row">
              <span class="evidence-label">Word count</span>
              <span class="evidence-value">${metrics.wordCount.toLocaleString()}</span>
            </div>
            <div class="evidence-row">
              <span class="evidence-label">Character count</span>
              <span class="evidence-value">${metrics.characterCount.toLocaleString()}</span>
            </div>
            <div class="evidence-row">
              <span class="evidence-label">Paragraph count (detected)</span>
              <span class="evidence-value">${metrics.paragraphCount}</span>
            </div>
          </div>
        `;
      }
    } catch (error) {
      console.warn('Failed to load content metrics:', error);
    }
  }
  
  // SECTION 3: ANALYSIS SCOPE (Always visible when parsed)
  let scopeHTML = '';
  if (doc.state === DocumentState.PARSED) {
    scopeHTML = `
      <div class="evidence-section">
        <div class="evidence-header">Analysis Scope</div>
        <div class="evidence-scope">All answers are grounded in this document only.</div>
      </div>
    `;
  }
  
  container.innerHTML = overviewHTML + contentHTML + scopeHTML;
  scrollManager.updateScroll('context-content');
}

// Event handlers - clean input/output contracts
function bindEvents() {
  document.getElementById('new-session').addEventListener('click', createSession);
  document.getElementById('upload-btn').addEventListener('click', () => {
    document.getElementById('file-input').click();
  });
  
  document.getElementById('file-input').addEventListener('change', handleFileSelection);
  
  document.getElementById('sessions-list').addEventListener('click', (e) => {
    const sessionItem = e.target.closest('.session-item');
    if (sessionItem) {
      const sessionId = sessionItem.dataset.sessionId;
      switchToSession(sessionId);
    }
  });
  
  document.getElementById('sources-list').addEventListener('click', (e) => {
    const sourceItem = e.target.closest('.source-item');
    if (sourceItem) {
      const docId = sourceItem.dataset.docId;
      const session = getActiveSession();
      const doc = documentStore.getDocument(docId);
      
      if (session) {
        // If document requires re-upload, trigger file input
        if (doc && doc.state === DocumentState.REQUIRES_REUPLOAD) {
          // Store the docId for re-upload
          window.pendingReuploadDocId = docId;
          document.getElementById('file-input').click();
        } else {
          // Normal document selection
          console.log('Switching to document:', docId, 'in session:', session.sessionId);
          sessionStore.setActiveDocument(session.sessionId, docId);
          render();
          
          // Close mobile panel after selection
          if (window.innerWidth <= 767) {
            setMobilePanel('ask');
          }
        }
      }
    }
  });
  
  const questionInput = document.getElementById('question');
  const askBtn = document.getElementById('ask-btn');
  
  questionInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      askQuestion();
    }
  });
  
  askBtn.addEventListener('click', askQuestion);
}

function createSession() {
  const sessionId = sessionStore.createSession();
  render();
}

function handleFileSelection(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  const result = handleFileUpload(file);
  if (!result.success) return;
  
  let session = getActiveSession();
  if (!session) {
    const sessionId = sessionStore.createSession();
    session = sessionStore.getActiveSession();
  }
  
  // Check if this is a re-upload
  if (window.pendingReuploadDocId) {
    const success = documentStore.reuploadDocument(window.pendingReuploadDocId, file);
    if (success) {
      sessionStore.setActiveDocument(session.sessionId, window.pendingReuploadDocId);
    }
    window.pendingReuploadDocId = null;
  } else {
    // New document upload
    const docId = documentStore.addDocument(file);
    sessionStore.addDocumentToSession(session.sessionId, docId);
  }
  
  render();
  e.target.value = '';
}

// Contract: Only populate input, never auto-send
function fillQuestion(question) {
  inputManager.fillQuestion(question);
}

// Contract: Only send if document is queryable
function askQuestion() {
  const question = inputManager.getValue();
  
  console.log('askQuestion called:', { question, isSending: chatStore.isSending });
  
  if (!question || chatStore.isSending) return;
  
  const canAsk = canAskQuestions();
  console.log('canAskQuestions result:', canAsk);
  
  if (!canAsk) return;
  
  inputManager.clearInput();
  processQuestion(question);
}

async function processQuestion(question) {
  const session = getActiveSession();
  if (!session) return;
  
  const doc = getActiveDocument();
  if (!doc) return;
  
  console.log('Processing question:', question);
  console.log('Document:', doc);
  console.log('Config:', config);
  
  chatStore.setSending(true);
  chatStore.addMessage(session.sessionId, 'user', question);
  render(); // Show pending state immediately
  
  try {
    const intent = getQuestionIntent(question);
    console.log('Intent:', intent);
    
    const response = await analyzeWithIntent(doc, question, intent, config);
    console.log('Response:', response);
    
    // Add document source banner to response
    const responseWithSource = `<div class="answer-source">Source document: ${escapeHtml(doc.metadata.name)}</div>\n\n${response.content}`;
    
    chatStore.addMessage(session.sessionId, 'assistant', responseWithSource);
  } catch (error) {
    console.error('Analysis error:', error);
    chatStore.addMessage(session.sessionId, 'assistant', `Analysis failed: ${error.message}`);
  } finally {
    chatStore.setSending(false);
    render(); // Show final state
  }
}



async function parseDocument(docId) {
  const success = await documentStore.parseDocument(docId);
  render();
  
  if (!success) {
    console.error('Document parsing failed');
  }
}

// Trigger re-upload for specific document
function triggerReupload(docId) {
  window.pendingReuploadDocId = docId;
  document.getElementById('file-input').click();
}

// Rename session inline
function renameSession(sessionId) {
  const session = sessionStore.sessions.get(sessionId);
  if (!session) return;

  const newName = prompt('Rename session:', session.name);
  if (!newName || !newName.trim()) return;

  session.name = newName.trim();
  sessionStore.persist();
  render();
}

// Global functions for onclick handlers
window.fillQuestion = fillQuestion;
window.parseDocument = parseDocument;
window.triggerReupload = triggerReupload;
window.renameSession = renameSession;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
// Mobile navigation functions
let mobilePanel = 'ask';

function setMobilePanel(panel) {
  mobilePanel = panel;
  render();
}

function setMobileView(view) {
  setMobilePanel(view);
}

function renderMobileView() {
  // Legacy function - now handled in render()
}

function showMobilePanel(panel) {
  setMobilePanel(panel);
}

function closeMobilePanel() {
  setMobilePanel('ask');
}

function focusInput() {
  setMobilePanel('ask');
  const input = document.getElementById('question');
  input.focus();
}

function toggleEvidence() {
  const rightPanel = document.getElementById('right-panel');
  rightPanel.classList.toggle('collapsed');
}

// Handle back button on mobile
window.addEventListener('popstate', function(event) {
  if (window.innerWidth <= 767) {
    setMobilePanel('ask');
  }
});

// Global functions for mobile navigation
window.setMobilePanel = setMobilePanel;
window.setMobileView = setMobileView;
window.showMobilePanel = showMobilePanel;
window.closeMobilePanel = closeMobilePanel;
window.focusInput = focusInput;
window.toggleEvidence = toggleEvidence;
// Dark mode functionality
function initDarkMode() {
  const savedTheme = localStorage.getItem('docsgpt-theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
}

function toggleTheme() {
  const root = document.documentElement;
  const current = root.getAttribute('data-theme') || 'light';
  const next = current === 'light' ? 'dark' : 'light';
  
  root.setAttribute('data-theme', next);
  localStorage.setItem('docsgpt-theme', next);
}

// Global functions
window.toggleTheme = toggleTheme;