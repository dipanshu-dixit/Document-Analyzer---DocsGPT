// Intent-Driven Actions - Structured Markdown Output

const Intent = {
  CHAT: 'chat',
  EXTRACT: 'extract', 
  SUMMARIZE: 'summarize',
  ANALYZE: 'analyze'
};

// Suggested questions with explicit intent metadata
const SUGGESTED_QUESTIONS = [
  {
    text: 'What entities are mentioned?',
    intent: Intent.EXTRACT
  },
  {
    text: 'What are the key findings?',
    intent: Intent.EXTRACT
  },
  {
    text: 'What are the risks and opportunities?',
    intent: Intent.ANALYZE
  },
  {
    text: 'Summarize for executive review',
    intent: Intent.SUMMARIZE
  }
];

// Intent inference from raw questions (fallback only)
function inferIntent(question) {
  const q = question.toLowerCase();
  
  if (/entities|mentioned|extract|findings|facts|numbers|dates/i.test(q)) {
    return Intent.EXTRACT;
  }
  if (/risks|opportunities|analyze|trends|issues|implications/i.test(q)) {
    return Intent.ANALYZE;
  }
  if (/summary|summarize|overview|brief|executive/i.test(q)) {
    return Intent.SUMMARIZE;
  }
  
  return Intent.CHAT;
}

// Main action - returns structured markdown
export async function analyzeWithIntent(document, query, intent = null, config = null) {
  const finalIntent = intent || inferIntent(query);
  
  console.log('analyzeWithIntent called with:', { document, query, intent: finalIntent, config });
  
  // Validate document is parsed
  if (!document || !document.docId) {
    console.error('Document validation failed:', document);
    throw new Error('Document not available.');
  }
  
  // Validate config
  if (!config || !config.provider || !config.model || !config.apiKey) {
    console.error('Config validation failed:', config);
    throw new Error('Configuration missing: provider, model, or apiKey not set.');
  }
  
  console.log('Analyzing document:', document.docId, document.metadata.name);
  
  const requestBody = {
    documentId: document.docId,
    query: query || '',
    intent: finalIntent,
    provider: config.provider,
    model: config.model,
    apiKey: config.apiKey
  };
  
  console.log('Sending request body:', requestBody);
  
  try {
    const response = await fetch('http://localhost:3001/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Response error:', errorText);
      
      if (response.status === 401) {
        throw new Error('Check API key and try again');
      } else if (response.status >= 500) {
        throw new Error('Connection lost. Retry');
      } else {
        const errorData = JSON.parse(errorText).catch(() => ({ error: errorText }));
        throw new Error(errorData.error || 'Analysis failed. Try again');
      }
    }
    
    const result = await response.json();
    console.log('Response result:', result);
    
    if (!result.success || !result.result) {
      throw new Error('Analysis incomplete. Try again');
    }
    
    return {
      content: result.result,
      intent: finalIntent
    };
  } catch (error) {
    console.error('Network or parsing error:', error);
    throw error;
  }
}

// Get suggested questions with intent metadata
export function getSuggestedQuestions() {
  return SUGGESTED_QUESTIONS;
}

// Get intent for a suggested question
export function getQuestionIntent(questionText) {
  const question = SUGGESTED_QUESTIONS.find(q => q.text === questionText);
  return question ? question.intent : Intent.CHAT;
}

export { Intent };