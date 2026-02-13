const axios = require('axios');

/**
 * Mandatory structured output - model MUST follow these exact formats
 */
const INTENT_PROMPTS = {
  extract: {
    system: "You are a document extraction system. Follow the EXACT format specified.",
    user: `Extract key information from this document.

OUTPUT FORMAT (MANDATORY):
## Extracted Information
### Entities
- Entity 1
- Entity 2
### Key Facts
- Fact 1
- Fact 2
### Numbers & Dates
- Number/Date 1
- Number/Date 2

Document:
{document_text}`
  },
  
  summarize: {
    system: "You are a document summarization system. Follow the EXACT format specified.",
    user: `Summarize this document for executive review.

OUTPUT FORMAT (MANDATORY):
## Executive Summary
- Key point 1
- Key point 2
- Key point 3

## Main Findings
- Finding 1
- Finding 2
- Finding 3

Document:
{document_text}`
  },
  
  analyze: {
    system: "You are a document analysis system. Follow the EXACT format specified.",
    user: `Analyze this document for risks, opportunities, and implications.

OUTPUT FORMAT (MANDATORY):
## Analysis Results
### High Priority
- Critical item 1
- Critical item 2
### Medium Priority
- Important item 1
- Important item 2
### Low Priority
- Minor item 1
- Minor item 2

Document:
{document_text}`
  },
  
  chat: {
    system: "Provide direct, helpful responses about the document.",
    user: `Answer this question about the document:\n\n{document_text}\n\nQuestion: {query}`
  }
};

/**
 * Analyze document using direct API calls
 */
async function analyzeDocument({ text, intent, provider, model, apiKey, query }) {
  if (!INTENT_PROMPTS[intent]) {
    const supportedIntents = Object.keys(INTENT_PROMPTS).join(', ');
    throw new Error(`Invalid intent: ${intent}. Supported: ${supportedIntents}`);
  }
  
  if (!text || !provider || !model || !apiKey) {
    throw new Error('Missing required parameters: text, provider, model, apiKey');
  }
  
  // Truncate text to save tokens (first 2000 chars)
  const truncatedText = text.length > 2000 ? text.substring(0, 2000) + '...' : text;
  
  const promptTemplate = INTENT_PROMPTS[intent];
  let userPrompt = promptTemplate.user.replace('{document_text}', truncatedText);
  
  // Handle chat intent with custom query
  if (intent === 'chat' && query) {
    userPrompt = userPrompt.replace('{query}', query);
  }
  
  if (provider === 'xai') {
    return await callXAI(promptTemplate.system, userPrompt, model, apiKey, intent);
  } else if (provider === 'openai') {
    return await callOpenAI(promptTemplate.system, userPrompt, model, apiKey, intent);
  } else {
    throw new Error('Unsupported provider');
  }
}

// xAI/Grok API call with structured output enforcement
async function callXAI(systemPrompt, userPrompt, model, apiKey, intent) {
  try {
    const response = await axios.post('https://api.x.ai/v1/chat/completions', {
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.1,
      max_tokens: 800
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    return {
      payload: {
        content: response.data.choices[0].message.content
      }
    };
  } catch (error) {
    if (error.response?.status === 401) {
      throw new Error('Invalid xAI API key');
    }
    throw new Error(`xAI API error: ${error.message}`);
  }
}

// OpenAI API call with structured output enforcement
async function callOpenAI(systemPrompt, userPrompt, model, apiKey, intent) {
  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.1,
      max_tokens: 800
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    return {
      payload: {
        content: response.data.choices[0].message.content
      }
    };
  } catch (error) {
    if (error.response?.status === 401) {
      throw new Error('Invalid API key');
    }
    throw new Error(`OpenAI API error: ${error.message}`);
  }
}

// Remove Anthropic function since we're using xAI

function extractResult(response) {
  if (!response || !response.payload) {
    throw new Error('Invalid response structure');
  }
  
  return response.payload.content || 'Analysis completed but no content returned';
}

module.exports = {
  analyzeDocument,
  extractResult
};