# DocsGPT - AI-Powered Document Analysis System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)](https://nodejs.org/)
[![GitHub Issues](https://img.shields.io/github/issues/dipanshu-dixit/Document-Analyzer---DocsGPT)](https://github.com/dipanshu-dixit/Document-Analyzer---DocsGPT/issues)
[![GitHub Stars](https://img.shields.io/github/stars/dipanshu-dixit/Document-Analyzer---DocsGPT)](https://github.com/dipanshu-dixit/Document-Analyzer---DocsGPT/stargazers)

A clean, production-ready document analysis application that extracts insights from PDF, DOCX, and TXT files using AI. Built with a defensively architected state machine approach for reliability and maintainability.

<img width="1766" height="933" alt="Image" src="https://github.com/user-attachments/assets/1e838dc2-0049-409b-96c7-ba4ec28005c2" />

<img width="1771" height="930" alt="Image" src="https://github.com/user-attachments/assets/d7df407b-61bf-40fe-9022-00fa898dde9e" />

## 🎯 Features

- **Multi-Format Support**: Analyze PDF, DOCX, and TXT documents
- **Intent-Driven Analysis**: Extract entities, summarize content, analyze risks, or chat with your documents
- **Session Management**: Organize multiple documents across different analysis sessions
- **Evidence Panel**: View document metrics and metadata with audit-grade accuracy
- **Dark Mode**: Comfortable viewing for extended analysis sessions
- **Mobile Responsive**: Full functionality on desktop, tablet, and mobile devices
- **Privacy-First**: Files processed locally, no server-side storage

## 🏗️ Architecture

### Core Principles
1. **No implicit state** - All state lives in explicit stores
2. **No optimistic assumptions** - Absence of proof = block or empty state
3. **No model-driven structure** - AI produces content, never UI shape

### Tech Stack

**Frontend:**
- Vanilla JavaScript (ES6 modules)
- Clean state management with dedicated stores
- Marked.js for markdown rendering
- CSS custom properties for theming

**Backend:**
- Node.js + Express
- Multer for file uploads
- pdf-parse for PDF extraction
- mammoth for DOCX extraction
- Axios for AI API calls

**AI Integration:**
- xAI (Grok) API support
- OpenAI API support
- Structured output enforcement per intent

## 📋 Prerequisites

- Node.js 16+ and npm
- API key from xAI or OpenAI
- Modern web browser (Chrome, Firefox, Safari, Edge)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/dipanshu-dixit/Document-Analyzer---DocsGPT.git
cd "Document Analyzer - DocsGPT"
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### 4. Configure API Key

Edit `frontend/js/app.js` and update the config object with your API key:

```javascript
const config = {
  provider: 'xai',  // or 'openai'
  model: 'grok-4-1-fast-reasoning',  // or 'gpt-4'
  apiKey: 'your-api-key-here'
};
```

**Security Note**: For production, use environment variables or a secure configuration management system. Never commit API keys to version control.

### 5. Start the Backend Server

```bash
cd backend
npm start
```

The backend will run on `http://localhost:3001`

### 6. Start the Frontend

Open `frontend/index.html` in your browser, or use a local server:

```bash
cd frontend
python -m http.server 8000
# or
npx serve
```

Then navigate to `http://localhost:8000`

## 📖 Usage Guide

### Basic Workflow

1. **Create a Session**: Click "New Session" to start
2. **Upload Document**: Click the upload button and select a PDF, DOCX, or TXT file
3. **Parse Document**: Click "Parse document" to extract text
4. **Analyze**: Use suggested questions or ask your own

### Analysis Intents

The system supports four analysis modes:

- **Extract**: Pull out entities, facts, numbers, and dates
- **Summarize**: Generate executive summaries with key findings
- **Analyze**: Identify risks, opportunities, and implications
- **Chat**: Ask specific questions about the document

### Evidence Panel

The right panel shows:
- Document metadata (name, type, size)
- Content metrics (word count, character count, paragraphs)
- Analysis scope confirmation

### Session Management

- **Multiple Sessions**: Organize different analysis workflows
- **Multiple Documents**: Add multiple documents to a session
- **Active Document**: Click a document to make it active for analysis
- **Rename Sessions**: Double-click a session name to rename

## 🔒 Security Best Practices

### API Key Management

**Development:**
```javascript
// Use environment-specific config
const config = {
  apiKey: process.env.API_KEY || 'fallback-for-dev'
};
```

**Production:**
- Use environment variables
- Implement backend proxy for API calls
- Never expose keys in client-side code
- Rotate keys regularly

### File Upload Security

The system implements:
- File type validation (PDF, DOCX, TXT only)
- File size limits (10MB max)
- Memory-only storage (no disk writes)
- CORS protection

### Data Privacy

- Files are processed in-memory only
- No server-side persistence
- Browser localStorage for session state only
- Files must be re-uploaded after page refresh

## 🛠️ Development

### Project Structure

```
Document Analyzer - DocsGPT/
├── backend/
│   ├── lib/
│   │   ├── extractor.js       # Document text extraction
│   │   └── openberlService.js # AI API integration
│   ├── server.js               # Express server
│   └── package.json
├── frontend/
│   ├── js/
│   │   ├── app.js             # Main application logic
│   │   ├── stores.js          # State management
│   │   ├── actions.js         # AI analysis actions
│   │   ├── ui.js              # UI utilities
│   │   ├── upload.js          # File upload handling
│   │   └── storage.js         # LocalStorage persistence
│   ├── styles/
│   │   └── base.css           # Application styles
│   ├── index.html             # Main HTML
│   └── package.json
├── generate-key.js            # API key encryption utility
└── REGRESSION_TEST_PLAN.md   # Testing guidelines
```

### State Management

The application uses three independent stores:

- **SessionStore**: Manages analysis sessions
- **DocumentStore**: Handles document lifecycle (UPLOADED → PARSING → PARSED)
- **ChatStore**: Stores conversation messages per session

### Adding New Features

**Safe Changes:**
- Improve prompts within intent boundaries
- Add new analysis intents
- UI styling and animations
- Performance optimizations

**Changes Requiring Review:**
- Store modifications
- Document lifecycle changes
- Storage format changes
- Parsing pipeline modifications

See `REGRESSION_TEST_PLAN.md` for detailed guidelines.

## 🧪 Testing

### Manual Testing Checklist

- [ ] Upload document → Parse → Analyze
- [ ] Multiple sessions with different documents
- [ ] Page refresh preserves state
- [ ] Dark mode toggle works
- [ ] Mobile responsive layout
- [ ] Error handling (invalid files, API errors)

### Regression Tests

See `REGRESSION_TEST_PLAN.md` for comprehensive test scenarios covering:
- Document lifecycle contracts
- Evidence truth contracts
- Input event contracts
- State persistence contracts
- Intent clarity contracts

## 🐛 Troubleshooting

### Backend won't start
- Check Node.js version (16+)
- Verify all dependencies installed: `npm install`
- Check port 3001 is available

### Document parsing fails
- Verify file format (PDF, DOCX, TXT only)
- Check file size (under 10MB)
- Ensure file is not corrupted

### API errors
- Verify API key is correct
- Check API provider is set correctly (xai/openai)
- Ensure you have API credits/quota
- Check network connectivity

### State not persisting
- Check browser localStorage is enabled
- Clear localStorage if corrupted: `localStorage.clear()`
- Files must be re-uploaded after refresh (browser security)

## 📝 API Endpoints

### Backend API

**POST /parse**
- Upload and parse document
- Body: FormData with `document` file and `documentId`
- Returns: `{ success, documentId, textLength, timestamp }`

**GET /metrics/:documentId**
- Get content metrics for parsed document
- Returns: `{ success, documentId, metrics: { wordCount, characterCount, paragraphCount } }`

**POST /analyze**
- Analyze document with AI
- Body: `{ documentId, provider, model, apiKey, intent, query }`
- Returns: `{ success, documentId, intent, result, metadata }`

**GET /health**
- Health check endpoint
- Returns: `{ status: 'ok', timestamp }`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Follow the architecture principles (see REGRESSION_TEST_PLAN.md)
4. Test thoroughly
5. Submit a pull request

### Code Style

- Use ES6+ features
- Follow existing naming conventions
- Add comments for complex logic
- Keep functions pure where possible
- Maintain store separation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with xAI Grok and OpenAI APIs
- Uses pdf-parse, mammoth, and marked.js libraries
- Inspired by clean architecture principles

## 📞 Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Check REGRESSION_TEST_PLAN.md for architecture details
- Review existing issues before creating new ones

---

**Built with ❤️ for reliable document analysis**
