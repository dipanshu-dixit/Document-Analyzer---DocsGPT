# Contributing to DocsGPT

Thank you for your interest in contributing to DocsGPT! This guide will help you understand our development process and architecture principles.

## 🎯 Core Principles

Before contributing, please understand these architectural principles:

1. **No implicit state** - All state lives in explicit stores
2. **No optimistic assumptions** - Absence of proof = block or empty state
3. **No model-driven structure** - AI produces content, never UI shape

These principles prevent the structural bugs that plague most AI applications.

## 🚀 Getting Started

### 1. Fork and Clone

```bash
git clone https://github.com/your-username/docsgpt.git
cd docsgpt
```

### 2. Set Up Development Environment

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your API keys (never commit this file!)
nano .env
```

### 4. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

## 📝 Development Guidelines

### Code Style

- Use ES6+ features (const/let, arrow functions, async/await)
- Follow existing naming conventions
- Keep functions pure where possible
- Add comments for complex logic
- Use meaningful variable names

### File Organization

```
backend/
  lib/          # Reusable modules
  server.js     # Main server file

frontend/
  js/
    app.js      # Main application logic
    stores.js   # State management (SessionStore, DocumentStore, ChatStore)
    actions.js  # AI analysis actions
    ui.js       # UI utilities
    upload.js   # File upload handling
    storage.js  # LocalStorage persistence
  styles/
    base.css    # All styles
  index.html    # Main HTML
```

### State Management

The application uses three independent stores:

**SessionStore** - Manages analysis sessions
```javascript
// Good: Use store methods
sessionStore.createSession();
sessionStore.setActiveDocument(sessionId, docId);

// Bad: Direct manipulation
session.activeDocumentId = docId; // Missing persistence!
```

**DocumentStore** - Handles document lifecycle
```javascript
// Good: Follow state machine
doc.state = DocumentState.PARSING;
documentStore.persist();

// Bad: Skip states
doc.state = DocumentState.PARSED; // Without actual parsing!
```

**ChatStore** - Stores conversation messages
```javascript
// Good: Add messages properly
chatStore.addMessage(sessionId, 'user', content);

// Bad: Direct array manipulation
messages.push({ content }); // Missing persistence!
```

### Document Lifecycle

Documents follow a strict state machine:

```
UPLOADED → PARSING → PARSED
         ↓
    PARSE_FAILED
         ↓
    REQUIRES_REUPLOAD
```

**Never skip states or make optimistic assumptions!**

## ✅ Safe Changes (No Architectural Review Required)

These changes are safe and encouraged:

- **Prompt improvements** within intent boundaries
- **UI styling** and animations
- **New analysis intents** in actions.js
- **Performance optimizations** that don't change state flow
- **Bug fixes** that maintain contracts
- **Documentation** improvements
- **Test additions**

### Example: Adding a New Intent

```javascript
// In actions.js
const INTENT_PROMPTS = {
  // ... existing intents
  
  // New intent
  compare: {
    system: "You are a document comparison system.",
    user: `Compare key aspects of this document.

OUTPUT FORMAT (MANDATORY):
## Comparison Results
### Similarities
- Item 1
- Item 2
### Differences
- Item 1
- Item 2

Document:
{document_text}`
  }
};

// Add to suggested questions
const SUGGESTED_QUESTIONS = [
  // ... existing questions
  {
    text: 'Compare key aspects',
    intent: Intent.COMPARE
  }
];
```

## ⚠️ Changes Requiring Architectural Review

These changes need careful review:

- **Store modifications** - Changes to SessionStore, DocumentStore, or ChatStore
- **Storage format changes** - Changes to localStorage structure
- **Document lifecycle changes** - New states or transitions
- **Chat flow modifications** - Changes to message handling
- **Parsing pipeline changes** - Changes to document processing
- **API contract changes** - Changes to backend endpoints

### How to Request Review

1. Open an issue describing the change
2. Explain why it's necessary
3. Describe how it maintains architectural principles
4. Wait for maintainer feedback before implementing

## 🧪 Testing

### Manual Testing Checklist

Before submitting a PR, test these scenarios:

- [ ] Upload document → Parse → Analyze
- [ ] Multiple sessions with different documents
- [ ] Page refresh preserves state correctly
- [ ] Dark mode toggle works
- [ ] Mobile responsive layout
- [ ] Error handling (invalid files, API errors)
- [ ] Document state transitions are correct
- [ ] Evidence panel shows accurate data

### Regression Tests

Review `REGRESSION_TEST_PLAN.md` and ensure your changes don't break:

- Document lifecycle contracts
- Evidence truth contracts
- Input event contracts
- State persistence contracts
- Intent clarity contracts

## 🔒 Security Guidelines

### Never Commit Secrets

```bash
# Check before committing
git status
git diff

# Use git-secrets to prevent accidents
git secrets --install
git secrets --register-aws
```

### API Key Handling

```javascript
// Good: Use environment variables
const apiKey = process.env.API_KEY;

// Bad: Hardcode keys
const apiKey = 'xai-abc123...'; // NEVER DO THIS!
```

### Input Validation

```javascript
// Good: Validate all inputs
if (!documentId || typeof documentId !== 'string') {
  throw new Error('Invalid documentId');
}

// Bad: Trust user input
const doc = documents.get(documentId); // Could be undefined!
```

## 📋 Pull Request Process

### 1. Prepare Your PR

- Write clear commit messages
- Update documentation if needed
- Add tests if applicable
- Ensure code follows style guidelines
- Test thoroughly

### 2. Commit Message Format

```
type(scope): brief description

Detailed explanation of what changed and why.

Fixes #123
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Examples:
```
feat(analysis): add document comparison intent
fix(upload): handle corrupted PDF files gracefully
docs(readme): update installation instructions
```

### 3. Submit PR

- Fill out the PR template completely
- Link related issues
- Add screenshots for UI changes
- Request review from maintainers

### 4. Code Review

- Respond to feedback promptly
- Make requested changes
- Keep discussion professional and constructive
- Be patient - reviews take time

### 5. Merge

Once approved:
- Maintainer will merge your PR
- Your changes will be in the next release
- You'll be added to contributors list!

## 🐛 Bug Reports

### Before Reporting

1. Check existing issues
2. Try to reproduce consistently
3. Test with latest version
4. Gather relevant information

### Bug Report Template

```markdown
**Description**
Clear description of the bug

**Steps to Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What should happen

**Actual Behavior**
What actually happens

**Environment**
- OS: [e.g., macOS 13.0]
- Browser: [e.g., Chrome 120]
- Node.js: [e.g., 18.0.0]

**Screenshots**
If applicable

**Additional Context**
Any other relevant information
```

## 💡 Feature Requests

### Before Requesting

1. Check existing feature requests
2. Consider if it fits the project scope
3. Think about implementation complexity
4. Consider architectural impact

### Feature Request Template

```markdown
**Problem Statement**
What problem does this solve?

**Proposed Solution**
How should it work?

**Alternatives Considered**
What other approaches did you consider?

**Additional Context**
Any other relevant information
```

## 🎨 UI/UX Contributions

### Design Principles

- **Clarity over cleverness** - Make it obvious, not clever
- **Honest UI** - Never lie about system state
- **Progressive disclosure** - Show what's needed, when it's needed
- **Accessibility first** - Support keyboard navigation, screen readers
- **Mobile responsive** - Works on all screen sizes

### CSS Guidelines

```css
/* Good: Use CSS custom properties */
.element {
  color: var(--text-primary);
  background: var(--bg-primary);
}

/* Bad: Hardcode colors */
.element {
  color: #333;
  background: #fff;
}
```

## 📚 Documentation Contributions

Documentation is just as important as code!

### What to Document

- New features and how to use them
- API changes and migration guides
- Architecture decisions and rationale
- Common issues and solutions
- Setup and configuration steps

### Documentation Style

- Write clearly and concisely
- Use examples and code snippets
- Add screenshots for UI features
- Keep it up to date
- Test all instructions

## 🤝 Community Guidelines

### Be Respectful

- Treat everyone with respect
- Welcome newcomers
- Be patient with questions
- Give constructive feedback
- Celebrate contributions

### Be Professional

- Keep discussions on-topic
- Avoid personal attacks
- Respect different opinions
- Admit when you're wrong
- Learn from mistakes

## 📞 Getting Help

### Where to Ask

- **GitHub Issues** - Bug reports and feature requests
- **GitHub Discussions** - Questions and general discussion
- **Pull Requests** - Code review and implementation discussion

### How to Ask

1. Search existing issues/discussions first
2. Provide context and details
3. Include relevant code/screenshots
4. Be specific about what you need
5. Follow up with additional information if requested

## 🏆 Recognition

Contributors are recognized in:

- README.md contributors section
- Release notes
- GitHub contributors page

Thank you for contributing to DocsGPT! 🎉

---

**Questions?** Open an issue or discussion - we're here to help!
