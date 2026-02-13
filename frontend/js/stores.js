// Clean state stores with hard contracts
import { saveSessions, loadSessions, saveDocuments, loadDocuments, saveMessages, loadMessages } from './storage.js';

// Document state enum - authoritative
const DocumentState = {
  UPLOADED: 'UPLOADED',
  PARSING: 'PARSING', 
  PARSE_FAILED: 'PARSE_FAILED',
  PARSED: 'PARSED',
  REQUIRES_REUPLOAD: 'REQUIRES_REUPLOAD'
};

const SessionState = {
  CREATED: 'CREATED',
  ACTIVE: 'ACTIVE',
  ARCHIVED: 'ARCHIVED'
};

// Session Store - owns session lifecycle only
class SessionStore {
  constructor() {
    this.sessions = new Map();
    this.activeSessionId = null;
  }

  createSession(name = 'Untitled Session') {
    const sessionId = Date.now().toString();
    const session = {
      sessionId,
      name,
      state: SessionState.ACTIVE,
      activeDocumentIds: [],
      activeDocumentId: null, // ✅ REQUIRED for document selection
      createdAt: Date.now()
    };
    
    this.sessions.set(sessionId, session);
    this.activeSessionId = sessionId;
    this.persist();
    return sessionId;
  }

  getActiveSession() {
    return this.activeSessionId ? this.sessions.get(this.activeSessionId) : null;
  }

  setActiveSession(sessionId) {
    if (this.sessions.has(sessionId)) {
      this.activeSessionId = sessionId;
      this.persist();
    }
  }

  addDocumentToSession(sessionId, docId) {
    const session = this.sessions.get(sessionId);
    if (session && !session.activeDocumentIds.includes(docId)) {
      session.activeDocumentIds.push(docId);
      session.activeDocumentId = docId; // Auto-select new document
      this.persist();
    }
  }

  setActiveDocument(sessionId, docId) {
    const session = this.sessions.get(sessionId);
    if (session && session.activeDocumentIds.includes(docId)) {
      session.activeDocumentId = docId;
      this.persist();
    }
  }

  persist() {
    saveSessions(this.sessions, this.activeSessionId);
  }

  restore() {
    const saved = loadSessions();
    if (saved?.sessions) {
      saved.sessions.forEach(([id, session]) => {
        this.sessions.set(id, session);
      });
      this.activeSessionId = saved.activeSessionId;
    }
  }
}

// Document Store - owns document lifecycle only
class DocumentStore {
  constructor() {
    this.documents = new Map();
  }

  addDocument(file) {
    const docId = Date.now().toString();
    const document = {
      docId,
      state: DocumentState.UPLOADED,
      metadata: {
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: Date.now()
      },
      file,
      parsedArtifactId: null,
      parseError: null,
      requiresReupload: false // Fresh upload
    };

    this.documents.set(docId, document);
    this.persist();
    return docId;
  }

  // Handle re-upload of existing document
  reuploadDocument(docId, file) {
    const doc = this.documents.get(docId);
    if (!doc) return false;
    
    // Restore file and reset to uploaded state
    doc.file = file;
    doc.state = DocumentState.UPLOADED;
    doc.parseError = null;
    doc.requiresReupload = false;
    
    this.persist();
    return true;
  }

  getDocument(docId) {
    return this.documents.get(docId);
  }

  // Hard contract: only PARSED documents are queryable
  isQueryable(docId) {
    const doc = this.documents.get(docId);
    console.log('isQueryable check:', { docId, doc, state: doc?.state, parsedArtifactId: doc?.parsedArtifactId });
    return doc?.state === DocumentState.PARSED && doc.parsedArtifactId !== null;
  }

  // Hard contract: only show evidence if parsed AND backend has text
  hasValidEvidence(docId) {
    const doc = this.documents.get(docId);
    return doc?.state === DocumentState.PARSED && doc.parsedArtifactId !== null;
  }

  // Get content metrics for evidence panel (audit-grade)
  async getContentMetrics(docId) {
    const doc = this.documents.get(docId);
    if (!doc || doc.state !== DocumentState.PARSED || !doc.parsedArtifactId) {
      return null;
    }
    
    try {
      const response = await fetch(`http://localhost:3001/metrics/${doc.parsedArtifactId}`);
      if (!response.ok) return null;
      
      const metrics = await response.json();
      return metrics.success ? metrics.metrics : null;
    } catch (error) {
      console.warn('Failed to fetch content metrics:', error);
      return null;
    }
  }

  async parseDocument(docId) {
    const doc = this.documents.get(docId);
    if (!doc) return false;
    
    // Block parsing if file is missing - honest state
    if (!doc.file) {
      doc.state = DocumentState.REQUIRES_REUPLOAD;
      this.persist();
      return false;
    }
    
    if (doc.state !== DocumentState.UPLOADED) {
      return false;
    }

    doc.state = DocumentState.PARSING;
    doc.parseError = null;
    this.persist();

    try {
      // Send file to backend for parsing
      const formData = new FormData();
      formData.append('document', doc.file);
      formData.append('documentId', doc.docId);
      
      const response = await fetch('http://localhost:3001/parse', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Parse failed');
      }
      
      const result = await response.json();
      
      doc.parsedArtifactId = result.documentId;
      doc.state = DocumentState.PARSED;
      this.persist();
      return true;
    } catch (error) {
      doc.state = DocumentState.PARSE_FAILED;
      doc.parseError = error.message;
      this.persist();
      return false;
    }
  }

  async parseFile(file) {
    // Deterministic parsing - no AI
    const artifactId = Date.now().toString();
    
    if (file.type === 'text/plain') {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      return {
        artifactId,
        pages: Math.max(1, Math.ceil(lines.length / 50)),
        chunks: Math.ceil(lines.length / 10),
        entities: [],
        checksum: this.simpleHash(text),
        createdAt: Date.now()
      };
    }
    
    // Basic PDF estimation
    return {
      artifactId,
      pages: 1,
      chunks: 1,
      entities: [],
      checksum: this.simpleHash(file.name),
      createdAt: Date.now()
    };
  }

  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString();
  }

  persist() {
    saveDocuments(this.documents);
  }

  restore() {
    const saved = loadDocuments();
    if (saved?.documents) {
      saved.documents.forEach(([id, docData]) => {
        // Pessimistic restore - no file object, must re-upload
        const document = {
          docId: docData.docId,
          state: docData.state,
          metadata: docData.metadata,
          file: null, // Files cannot be persisted
          parsedArtifactId: docData.parsedArtifactId,
          parseError: docData.parseError,
          requiresReupload: false
        };
        
        // Honest state downgrade - missing file ≠ parse failure
        if (document.state === DocumentState.PARSED && !document.file) {
          document.state = DocumentState.REQUIRES_REUPLOAD;
        }
        
        if (document.state === DocumentState.PARSING) {
          document.state = DocumentState.REQUIRES_REUPLOAD;
        }
        
        this.documents.set(id, document);
      });
    }
  }
}

// Chat Store - owns messages per session
class ChatStore {
  constructor() {
    this.sessionMessages = new Map(); // sessionId -> messages[]
    this.isSending = false;
  }

  addMessage(sessionId, role, content, evidence = null) {
    if (!sessionId) return null;
    
    const message = {
      id: Date.now().toString(),
      role,
      content,
      evidence,
      createdAt: Date.now()
    };
    
    if (!this.sessionMessages.has(sessionId)) {
      this.sessionMessages.set(sessionId, []);
    }
    
    this.sessionMessages.get(sessionId).push(message);
    this.persist();
    return message;
  }

  getMessages(sessionId) {
    if (!sessionId) return [];
    return [...(this.sessionMessages.get(sessionId) || [])];
  }

  setSending(isSending) {
    this.isSending = isSending;
  }

  persist() {
    const data = Array.from(this.sessionMessages.entries());
    saveMessages(data);
  }

  restore() {
    const saved = loadMessages();
    if (saved?.sessionMessages) {
      this.sessionMessages = new Map(saved.sessionMessages);
    }
  }
}

export { SessionStore, DocumentStore, ChatStore, DocumentState, SessionState };