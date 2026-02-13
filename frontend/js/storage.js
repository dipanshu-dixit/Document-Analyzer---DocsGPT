// Clean Storage - Canonical State Only
// Invariant 1: Persist only canonical state (no derived flags)
// Invariant 2: Rehydration must be pessimistic (verify everything)
// Invariant 3: Storage never advances state (save/load/delete only)

const STORAGE_KEYS = {
  sessions: 'docsgpt-sessions-v2', // v2 to avoid old format conflicts
  documents: 'docsgpt-documents-v2',
  messages: 'docsgpt-messages-v2',
  config: 'docsgpt-config'
};

const STORAGE_VERSION = 2;

// Session persistence - canonical IDs only
export function saveSessions(sessions, activeSessionId) {
  try {
    const canonicalSessions = Array.from(sessions.entries()).map(([id, session]) => [
      id,
      {
        sessionId: session.sessionId,
        name: session.name,
        state: session.state,
        activeDocumentIds: [...session.activeDocumentIds], // copy array
        createdAt: session.createdAt
      }
    ]);
    
    const data = {
      version: STORAGE_VERSION,
      sessions: canonicalSessions,
      activeSessionId,
      timestamp: Date.now()
    };
    
    localStorage.setItem(STORAGE_KEYS.sessions, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to save sessions:', error);
  }
}

// Document persistence - state + metadata only
export function saveDocuments(documents) {
  try {
    const canonicalDocs = Array.from(documents.entries()).map(([id, doc]) => [
      id,
      {
        docId: doc.docId,
        state: doc.state, // UPLOADED | PARSING | PARSE_FAILED | PARSED
        metadata: {
          name: doc.metadata.name,
          size: doc.metadata.size,
          type: doc.metadata.type,
          uploadedAt: doc.metadata.uploadedAt
        },
        parsedArtifactId: doc.parsedArtifactId, // null if not parsed
        parseError: doc.parseError // null if no error
      }
    ]);
    
    const data = {
      version: STORAGE_VERSION,
      documents: canonicalDocs,
      timestamp: Date.now()
    };
    
    localStorage.setItem(STORAGE_KEYS.documents, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to save documents:', error);
  }
}

// Message persistence - per-session structure
export function saveMessages(sessionMessages) {
  try {
    const data = {
      version: STORAGE_VERSION,
      sessionMessages: sessionMessages,
      timestamp: Date.now()
    };
    
    localStorage.setItem(STORAGE_KEYS.messages, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to save messages:', error);
  }
}

// Pessimistic session loading - verify everything
export function loadSessions() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.sessions);
    if (!saved) return null;
    
    const data = JSON.parse(saved);
    
    // Version check - reject old formats
    if (!data.version || data.version < STORAGE_VERSION) {
      console.warn('Outdated session format, clearing storage');
      clearSessions();
      return null;
    }
    
    // Pessimistic validation
    if (!data.sessions || !Array.isArray(data.sessions)) {
      return null;
    }
    
    // Validate each session structure
    const validSessions = data.sessions.filter(([id, session]) => {
      return id && 
             session && 
             session.sessionId && 
             session.name && 
             session.state &&
             Array.isArray(session.activeDocumentIds);
    });
    
    return {
      sessions: validSessions,
      activeSessionId: data.activeSessionId,
      timestamp: data.timestamp
    };
  } catch (error) {
    console.warn('Failed to load sessions:', error);
    return null;
  }
}

// Pessimistic document loading - downgrade invalid states
export function loadDocuments() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.documents);
    if (!saved) return null;
    
    const data = JSON.parse(saved);
    
    if (!data.version || data.version < STORAGE_VERSION) {
      console.warn('Outdated document format, clearing storage');
      clearDocuments();
      return null;
    }
    
    if (!data.documents || !Array.isArray(data.documents)) {
      return null;
    }
    
    // Pessimistic validation - downgrade suspicious states
    const validDocs = data.documents.map(([id, doc]) => {
      if (!id || !doc || !doc.docId || !doc.state || !doc.metadata) {
        return null; // Invalid doc
      }
      
      // Invariant 2: Pessimistic rehydration
      // If doc claims to be PARSED but has no artifact, downgrade
      if (doc.state === 'PARSED' && !doc.parsedArtifactId) {
        console.warn(`Document ${doc.docId} claims PARSED but missing artifact, downgrading to UPLOADED`);
        doc.state = 'UPLOADED';
        doc.parsedArtifactId = null;
      }
      
      // If doc is in PARSING state on reload, it failed
      if (doc.state === 'PARSING') {
        console.warn(`Document ${doc.docId} was parsing on reload, marking as failed`);
        doc.state = 'PARSE_FAILED';
        doc.parseError = 'Parsing interrupted by page reload';
      }
      
      return [id, doc];
    }).filter(Boolean);
    
    return {
      documents: validDocs,
      timestamp: data.timestamp
    };
  } catch (error) {
    console.warn('Failed to load documents:', error);
    return null;
  }
}

// Message loading - validate per-session structure
export function loadMessages() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.messages);
    if (!saved) return null;
    
    const data = JSON.parse(saved);
    
    if (!data.version || data.version < STORAGE_VERSION) {
      console.warn('Outdated message format, clearing storage');
      clearMessages();
      return null;
    }
    
    if (!data.sessionMessages || !Array.isArray(data.sessionMessages)) {
      return null;
    }
    
    return {
      sessionMessages: data.sessionMessages,
      timestamp: data.timestamp
    };
  } catch (error) {
    console.warn('Failed to load messages:', error);
    return null;
  }
}

// Config persistence (unchanged)
export function saveConfig(config) {
  try {
    localStorage.setItem(STORAGE_KEYS.config, JSON.stringify(config));
  } catch (error) {
    console.warn('Failed to save config:', error);
  }
}

export function loadConfig() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.config);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.warn('Failed to load config:', error);
    return null;
  }
}

// Selective clearing - never clear config accidentally
export function clearSessions() {
  try {
    localStorage.removeItem(STORAGE_KEYS.sessions);
  } catch (error) {
    console.warn('Failed to clear sessions:', error);
  }
}

export function clearDocuments() {
  try {
    localStorage.removeItem(STORAGE_KEYS.documents);
  } catch (error) {
    console.warn('Failed to clear documents:', error);
  }
}

export function clearMessages() {
  try {
    localStorage.removeItem(STORAGE_KEYS.messages);
  } catch (error) {
    console.warn('Failed to clear messages:', error);
  }
}

export function clearAllData() {
  clearSessions();
  clearDocuments();
  clearMessages();
  try {
    localStorage.removeItem(STORAGE_KEYS.config);
  } catch (error) {
    console.warn('Failed to clear config:', error);
  }
}