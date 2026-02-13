# Security Guide - DocsGPT

## 🔒 Critical Security Practices

### 1. API Key Protection

#### Current Issue
The API key is currently hardcoded in `frontend/js/app.js`:

```javascript
const config = {
  provider: 'xai',
  model: 'grok-4-1-fast-reasoning',
  apiKey: 'xai-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
};
```

**⚠️ IMMEDIATE ACTION REQUIRED:**
1. Revoke the exposed API key immediately
2. Generate a new API key
3. Implement one of the secure solutions below

#### Secure Solutions

##### Option 1: Backend Proxy (Recommended for Production)

Move API calls to the backend to hide the key from client-side code.

**Backend (server.js):**
```javascript
// Add to backend/server.js
app.post('/api/analyze-secure', async (req, res) => {
  const { documentId, intent, query } = req.body;
  
  // API key stored securely on server
  const apiKey = process.env.API_KEY;
  
  // Make API call server-side
  const response = await analyzeDocument({
    text: parsedDocuments.get(documentId),
    intent,
    query,
    provider: process.env.AI_PROVIDER,
    model: process.env.AI_MODEL,
    apiKey
  });
  
  res.json(response);
});
```

**Frontend (actions.js):**
```javascript
// Update analyzeWithIntent to call backend proxy
const response = await fetch('http://localhost:3001/api/analyze-secure', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    documentId: document.docId,
    intent: finalIntent,
    query
  })
});
```

##### Option 2: Environment Variables (Development)

**Backend (.env):**
```bash
API_KEY=your_actual_api_key_here
AI_PROVIDER=xai
AI_MODEL=grok-4-1-fast-reasoning
```

**Backend (server.js):**
```javascript
require('dotenv').config();

// Use environment variables
const config = {
  provider: process.env.AI_PROVIDER,
  model: process.env.AI_MODEL,
  apiKey: process.env.API_KEY
};
```

##### Option 3: User-Provided Keys (Alternative)

Let users provide their own API keys through the UI:

```javascript
// Add settings panel in frontend
function saveUserConfig(provider, model, apiKey) {
  // Encrypt before storing (basic obfuscation)
  const encrypted = btoa(apiKey); // Use proper encryption in production
  localStorage.setItem('user_config', JSON.stringify({
    provider,
    model,
    apiKey: encrypted
  }));
}

function loadUserConfig() {
  const stored = localStorage.getItem('user_config');
  if (stored) {
    const config = JSON.parse(stored);
    config.apiKey = atob(config.apiKey); // Decrypt
    return config;
  }
  return null;
}
```

### 2. File Upload Security

#### Current Implementation ✅
The system already implements good practices:

- File type validation (PDF, DOCX, TXT only)
- File size limits (10MB max)
- Memory-only storage (no disk writes)
- Single file upload only

#### Additional Recommendations

**Add virus scanning (production):**
```javascript
const ClamScan = require('clamscan');

app.post('/parse', upload.single('document'), async (req, res) => {
  // Scan file before processing
  const clamscan = await new ClamScan().init();
  const { isInfected } = await clamscan.scanStream(req.file.buffer);
  
  if (isInfected) {
    return res.status(400).json({ error: 'File failed security scan' });
  }
  
  // Continue with parsing...
});
```

**Add content validation:**
```javascript
// Validate extracted text doesn't contain malicious patterns
function validateExtractedText(text) {
  // Check for script injection attempts
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i
  ];
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(text)) {
      throw new Error('Document contains potentially malicious content');
    }
  }
  
  return true;
}
```

### 3. CORS Configuration

#### Current Implementation
```javascript
app.use(cors());
```

#### Secure Configuration (Production)

```javascript
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:8000',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
  credentials: false,
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));
```

### 4. Rate Limiting

Protect against abuse and DoS attacks:

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/parse', limiter);
app.use('/analyze', limiter);
```

### 5. Input Validation

Add comprehensive validation:

```javascript
const { body, validationResult } = require('express-validator');

app.post('/analyze',
  body('documentId').isString().trim().notEmpty(),
  body('intent').isIn(['chat', 'extract', 'summarize', 'analyze']),
  body('query').optional().isString().trim(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    // Continue with analysis...
  }
);
```

### 6. Secure Headers

Add security headers:

```javascript
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

### 7. Logging and Monitoring

Implement secure logging:

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Never log sensitive data
app.post('/analyze', async (req, res) => {
  logger.info('Analysis request', {
    documentId: req.body.documentId,
    intent: req.body.intent,
    // DO NOT LOG: apiKey, query content, document text
  });
});
```

### 8. Data Privacy

#### Current Implementation ✅
- No server-side file storage
- Memory-only processing
- Browser localStorage for sessions only

#### Additional Recommendations

**Add data retention policy:**
```javascript
// Clear parsed documents after 1 hour
setInterval(() => {
  const now = Date.now();
  for (const [docId, data] of parsedDocuments.entries()) {
    if (now - data.timestamp > 3600000) { // 1 hour
      parsedDocuments.delete(docId);
      console.log(`Cleared expired document: ${docId}`);
    }
  }
}, 300000); // Check every 5 minutes
```

**Add user consent:**
```html
<!-- Add to frontend -->
<div class="privacy-notice">
  By uploading documents, you agree that:
  - Files are processed in-memory only
  - No data is stored on our servers
  - Sessions are stored locally in your browser
  - You are responsible for your API key security
</div>
```

## 🛡️ Security Checklist

### Before Deployment

- [ ] Remove all hardcoded API keys
- [ ] Implement backend proxy for API calls
- [ ] Set up environment variables
- [ ] Configure CORS properly
- [ ] Add rate limiting
- [ ] Implement input validation
- [ ] Add security headers (helmet)
- [ ] Set up logging (without sensitive data)
- [ ] Add virus scanning for uploads
- [ ] Configure HTTPS/TLS
- [ ] Set up monitoring and alerts
- [ ] Review and update dependencies
- [ ] Run security audit: `npm audit`
- [ ] Test with security tools (OWASP ZAP, etc.)

### Regular Maintenance

- [ ] Rotate API keys quarterly
- [ ] Update dependencies monthly: `npm update`
- [ ] Review logs for suspicious activity
- [ ] Monitor API usage and costs
- [ ] Audit access controls
- [ ] Review and update security policies

## 🚨 Incident Response

### If API Key is Compromised

1. **Immediately revoke the key** in your provider dashboard
2. Generate a new key
3. Update environment variables
4. Review API usage logs for unauthorized access
5. Check billing for unexpected charges
6. Notify affected users if applicable
7. Document the incident

### If Data Breach Occurs

1. Isolate affected systems
2. Preserve evidence (logs, etc.)
3. Assess scope of breach
4. Notify affected parties
5. Implement fixes
6. Review and update security measures
7. Document lessons learned

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [API Security Checklist](https://github.com/shieldfy/API-Security-Checklist)

## 🔗 Useful Tools

- **git-secrets**: Prevent committing secrets
- **truffleHog**: Find secrets in git history
- **npm audit**: Check for vulnerable dependencies
- **Snyk**: Continuous security monitoring
- **OWASP ZAP**: Security testing tool

---

**Remember: Security is not a one-time task, it's an ongoing process.**
