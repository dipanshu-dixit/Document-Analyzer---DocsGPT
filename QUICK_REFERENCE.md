# Quick Reference Guide

## 🚀 Common Commands

### Setup
```bash
# Run automated setup
./setup.sh

# Manual setup
cd backend && npm install
cd ../frontend && npm install
```

### Running the Application
```bash
# Start backend (Terminal 1)
cd backend
npm start

# Start frontend (Terminal 2)
cd frontend
python -m http.server 8000
# or
npx serve
```

### Development
```bash
# Check for security vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Update dependencies
npm update

# Check outdated packages
npm outdated
```

## 🔧 Configuration

### Environment Variables (.env)
```bash
# Required
API_KEY=your_api_key_here
AI_PROVIDER=xai
AI_MODEL=grok-4-1-fast-reasoning

# Optional
PORT=3001
NODE_ENV=development
MAX_FILE_SIZE=10485760
```

### Frontend Config (app.js)
```javascript
const config = {
  provider: 'xai',  // or 'openai'
  model: 'grok-4-1-fast-reasoning',
  apiKey: process.env.API_KEY  // Use env var, not hardcoded!
};
```

## 📁 File Structure

```
DocsGPT/
├── backend/
│   ├── lib/
│   │   ├── extractor.js       # Text extraction
│   │   └── openberlService.js # AI integration
│   ├── server.js               # Express server
│   └── package.json
├── frontend/
│   ├── js/
│   │   ├── app.js             # Main app
│   │   ├── stores.js          # State management
│   │   ├── actions.js         # AI actions
│   │   ├── ui.js              # UI utilities
│   │   ├── upload.js          # File uploads
│   │   └── storage.js         # Persistence
│   ├── styles/base.css
│   └── index.html
├── .env                        # Environment config (DO NOT COMMIT)
├── .env.example                # Template
├── .gitignore                  # Git ignore rules
├── README.md                   # Main documentation
├── SECURITY.md                 # Security guide
├── CONTRIBUTING.md             # Contribution guide
└── REGRESSION_TEST_PLAN.md    # Testing guide
```

## 🔍 Debugging

### Backend Issues

**Server won't start:**
```bash
# Check if port is in use
lsof -i :3001
# Kill process if needed
kill -9 <PID>

# Check logs
tail -f logs/error.log
```

**Parsing fails:**
```bash
# Check file format
file document.pdf

# Test extraction manually
node -e "const pdf = require('pdf-parse'); const fs = require('fs'); pdf(fs.readFileSync('test.pdf')).then(data => console.log(data.text));"
```

### Frontend Issues

**API calls failing:**
```javascript
// Check browser console (F12)
// Look for CORS errors, network errors

// Test backend directly
curl http://localhost:3001/health
```

**State not persisting:**
```javascript
// Check localStorage in browser console
localStorage.getItem('docsgpt_sessions')
localStorage.getItem('docsgpt_documents')

// Clear if corrupted
localStorage.clear()
```

## 🧪 Testing

### Manual Test Checklist
```
□ Upload PDF document
□ Upload DOCX document
□ Upload TXT document
□ Parse document
□ Ask question
□ Use suggested questions
□ Create new session
□ Switch between sessions
□ Refresh page (state persists)
□ Toggle dark mode
□ Test on mobile
```

### API Testing
```bash
# Health check
curl http://localhost:3001/health

# Parse document
curl -X POST http://localhost:3001/parse \
  -F "document=@test.pdf" \
  -F "documentId=test123"

# Get metrics
curl http://localhost:3001/metrics/test123

# Analyze (requires parsed document)
curl -X POST http://localhost:3001/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "documentId": "test123",
    "provider": "xai",
    "model": "grok-4-1-fast-reasoning",
    "apiKey": "your-key",
    "intent": "extract",
    "query": ""
  }'
```

## 🔒 Security Checklist

### Before Committing
```bash
# Check for secrets
git diff

# Search for API keys
grep -r "xai-" .
grep -r "sk-" .

# Check .gitignore
cat .gitignore

# Verify .env is ignored
git status | grep .env
```

### Before Deploying
```
□ Remove hardcoded API keys
□ Set up environment variables
□ Configure CORS properly
□ Add rate limiting
□ Enable HTTPS
□ Set up monitoring
□ Review security headers
□ Test with security tools
□ Update dependencies
□ Run npm audit
```

## 📊 Monitoring

### Backend Logs
```bash
# View logs
tail -f logs/combined.log

# Search for errors
grep "error" logs/combined.log

# Monitor in real-time
tail -f logs/combined.log | grep "error"
```

### API Usage
```javascript
// Track API calls
let apiCallCount = 0;
let apiCallCost = 0;

function trackAPICall(tokens) {
  apiCallCount++;
  apiCallCost += tokens * 0.00001; // Adjust rate
  console.log(`API Calls: ${apiCallCount}, Cost: $${apiCallCost.toFixed(4)}`);
}
```

## 🛠️ Troubleshooting

### Common Issues

**"Document not found" error:**
- Document wasn't parsed yet
- Page was refreshed (files need re-upload)
- DocumentId mismatch

**"Invalid API key" error:**
- Check API key in .env or config
- Verify key is active in provider dashboard
- Check for extra spaces or quotes

**"CORS error":**
- Backend not running
- Wrong backend URL
- CORS not configured properly

**"File too large" error:**
- File exceeds 10MB limit
- Adjust MAX_FILE_SIZE in .env

**"Unsupported file type":**
- Only PDF, DOCX, TXT supported
- Check file extension
- Verify MIME type

## 🔗 Useful Links

### Documentation
- [README.md](README.md) - Getting started
- [SECURITY.md](SECURITY.md) - Security guide
- [CONTRIBUTING.md](CONTRIBUTING.md) - How to contribute
- [REGRESSION_TEST_PLAN.md](REGRESSION_TEST_PLAN.md) - Testing guide

### External Resources
- [xAI API Docs](https://docs.x.ai/)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [Express.js Docs](https://expressjs.com/)
- [Node.js Docs](https://nodejs.org/docs/)

### Tools
- [Postman](https://www.postman.com/) - API testing
- [curl](https://curl.se/) - Command-line API testing
- [git-secrets](https://github.com/awslabs/git-secrets) - Prevent committing secrets
- [npm audit](https://docs.npmjs.com/cli/v8/commands/npm-audit) - Security scanning

## 💡 Tips & Tricks

### Performance
```javascript
// Cache parsed documents
const documentCache = new Map();

// Debounce user input
const debounce = (fn, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
};
```

### Development
```javascript
// Enable debug mode
localStorage.setItem('debug', 'true');

// Log state changes
window.addEventListener('storage', (e) => {
  console.log('Storage changed:', e.key, e.newValue);
});
```

### Keyboard Shortcuts
- `Enter` - Send question
- `Esc` - Clear input
- `Ctrl/Cmd + K` - Focus input (if implemented)

## 📞 Getting Help

1. Check this guide first
2. Review [README.md](README.md)
3. Check [SECURITY.md](SECURITY.md) for security issues
4. Search existing GitHub issues
5. Open a new issue with details

---

**Keep this guide handy for quick reference!**
