# 🚨 IMMEDIATE ACTION REQUIRED - Security Checklist

## ⚠️ CRITICAL: API Key Exposure

Your API key is currently exposed in the codebase. Follow these steps immediately:

### Step 1: Revoke Exposed API Key (DO THIS FIRST!)

**The exposed key:**
```
xai-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

**Action:**
1. Go to https://console.x.ai/
2. Navigate to API Keys section
3. Find and revoke the above key
4. Generate a new API key
5. Save the new key securely

**Status:** [ ] COMPLETED

---

### Step 2: Remove Hardcoded Key from Code

**File:** `frontend/js/app.js`

**Current code (lines ~30-35):**
```javascript
const config = {
  provider: 'xai',
  model: 'grok-4-1-fast-reasoning',
  apiKey: 'xai-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
};
```

**Replace with:**
```javascript
const config = {
  provider: 'xai',
  model: 'grok-4-1-fast-reasoning',
  apiKey: '' // TODO: Implement secure key management
};
```

**Status:** [ ] COMPLETED

---

### Step 3: Create .env File

```bash
# Copy template
cp .env.example .env

# Edit with your NEW API key
nano .env
```

**Add to .env:**
```
API_KEY=your_new_api_key_here
AI_PROVIDER=xai
AI_MODEL=grok-4-1-fast-reasoning
```

**Status:** [ ] COMPLETED

---

### Step 4: Verify .gitignore

Ensure .env is in .gitignore (already done):

```bash
# Check if .env is ignored
git status | grep .env

# Should NOT appear in git status
# If it does, add to .gitignore:
echo ".env" >> .gitignore
```

**Status:** [ ] COMPLETED

---

### Step 5: Clean Git History (If Key Was Committed)

If the API key was committed to git:

```bash
# Check git history for the key
git log -p | grep "xai-"

# If found, you need to rewrite history
# WARNING: This is destructive!

# Option 1: Use BFG Repo-Cleaner (recommended)
# Download from: https://rtyley.github.io/bfg-repo-cleaner/
java -jar bfg.jar --replace-text passwords.txt

# Option 2: Use git filter-branch
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch frontend/js/app.js" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (if already pushed to remote)
git push origin --force --all
```

**Status:** [ ] COMPLETED or [ ] NOT NEEDED

---

## 📋 Setup Checklist

### Initial Setup

- [ ] Run setup script: `./setup.sh`
- [ ] Install backend dependencies: `cd backend && npm install`
- [ ] Install frontend dependencies: `cd frontend && npm install`
- [ ] Create .env file with new API key
- [ ] Test backend: `cd backend && npm start`
- [ ] Test frontend: Open `frontend/index.html`

### Security Verification

- [ ] No API keys in code
- [ ] .env file exists and is ignored by git
- [ ] .gitignore is comprehensive
- [ ] No secrets in git history
- [ ] API key is working (test with a query)

### Documentation Review

- [ ] Read README.md
- [ ] Review SECURITY.md
- [ ] Understand CONTRIBUTING.md
- [ ] Check QUICK_REFERENCE.md

---

## 🔒 Long-term Security Tasks

### Week 1
- [ ] Implement backend proxy (see SECURITY.md)
- [ ] Add rate limiting
- [ ] Set up monitoring
- [ ] Configure CORS properly

### Week 2
- [ ] Add input validation
- [ ] Implement secure headers (helmet)
- [ ] Set up logging (without secrets)
- [ ] Add virus scanning for uploads

### Month 1
- [ ] Security audit with npm audit
- [ ] Test with OWASP ZAP
- [ ] Set up CI/CD with security checks
- [ ] Configure HTTPS/TLS

### Ongoing
- [ ] Rotate API keys quarterly
- [ ] Update dependencies monthly
- [ ] Review logs weekly
- [ ] Monitor API usage daily

---

## 🧪 Testing Checklist

### Basic Functionality
- [ ] Upload PDF document
- [ ] Upload DOCX document
- [ ] Upload TXT document
- [ ] Parse document successfully
- [ ] Ask questions and get responses
- [ ] Create multiple sessions
- [ ] Switch between sessions
- [ ] Page refresh preserves state

### Security Testing
- [ ] API key not visible in browser DevTools
- [ ] CORS working correctly
- [ ] File size limits enforced
- [ ] File type validation working
- [ ] No secrets in localStorage
- [ ] No secrets in network requests (visible in DevTools)

### Error Handling
- [ ] Invalid file type rejected
- [ ] File too large rejected
- [ ] Invalid API key shows error
- [ ] Network errors handled gracefully
- [ ] Corrupted files handled properly

---

## 📊 Monitoring Setup

### API Usage Tracking
```javascript
// Add to your code
let apiCallCount = 0;
let apiCallCost = 0;

function trackAPICall(tokens) {
  apiCallCount++;
  apiCallCost += tokens * 0.00001; // Adjust rate
  console.log(`API Calls: ${apiCallCount}, Cost: $${apiCallCost.toFixed(4)}`);
  
  // Alert if cost exceeds threshold
  if (apiCallCost > 10) {
    alert('API cost exceeded $10!');
  }
}
```

### Error Monitoring
```javascript
// Add global error handler
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  // Send to monitoring service
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  // Send to monitoring service
});
```

---

## 🎯 Success Criteria

You've successfully secured the project when:

- ✅ No API keys in code
- ✅ .env file is used and ignored by git
- ✅ Old API key is revoked
- ✅ New API key is working
- ✅ Application runs without errors
- ✅ All tests pass
- ✅ No secrets in git history
- ✅ Documentation is complete

---

## 📞 Need Help?

If you encounter issues:

1. Check SECURITY.md for detailed guidance
2. Review QUICK_REFERENCE.md for troubleshooting
3. Search existing GitHub issues
4. Open a new issue with details

---

## ⏰ Timeline

**Immediate (Today):**
- Revoke exposed API key
- Remove hardcoded key from code
- Create .env file

**This Week:**
- Implement backend proxy
- Add rate limiting
- Set up monitoring

**This Month:**
- Complete security audit
- Set up CI/CD
- Configure production environment

---

**🔒 Remember: Security is not optional. Complete these tasks before deploying to production!**

Last Updated: February 2024
