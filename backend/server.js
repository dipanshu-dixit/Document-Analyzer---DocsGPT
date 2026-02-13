const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { extractText, isSupported } = require('./lib/extractor');
const { analyzeDocument, extractResult } = require('./lib/openberlService');

const app = express();
const PORT = process.env.PORT || 3001;

// In-memory store for parsed documents
const parsedDocuments = new Map(); // documentId -> extractedText

// Configure multer for memory-only file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB max file size
    files: 1 // Single file only
  },
  fileFilter: (req, file, cb) => {
    // Accept only supported document types
    const allowedExtensions = ['.pdf', '.docx', '.txt'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type'), false);
    }
  }
});

// Basic middleware
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Document parsing endpoint - parse once, store text
app.post('/parse', upload.single('document'), async (req, res) => {
  try {
    const { documentId } = req.body;
    
    if (!req.file || !documentId) {
      return res.status(400).json({ error: 'Document file and documentId required' });
    }
    
    if (!isSupported(req.file)) {
      return res.status(400).json({ error: 'Unsupported file type' });
    }
    
    console.log(`Parsing document: ${documentId}`);
    
    const documentText = await extractText(req.file);
    
    if (!documentText || documentText.length < 10) {
      return res.status(400).json({ error: 'Document contains insufficient text' });
    }
    
    // Store parsed text by documentId
    parsedDocuments.set(documentId, documentText);
    
    res.json({
      success: true,
      documentId: documentId,
      textLength: documentText.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Parse error:', error.message);
    res.status(500).json({ error: 'Document parsing failed' });
  }
});

// Content metrics endpoint - audit-grade evidence
app.get('/metrics/:documentId', (req, res) => {
  try {
    const { documentId } = req.params;
    
    const documentData = parsedDocuments.get(documentId);
    if (!documentData) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    // Handle both old and new document storage formats
    const text = typeof documentData === 'string' ? documentData : documentData.text;
    
    if (!text) {
      return res.status(404).json({ error: 'Document text not available' });
    }
    
    // Compute metrics deterministically from parsed text
    const metrics = {
      wordCount: text.trim().split(/\s+/).filter(word => word.length > 0).length,
      characterCount: text.length,
      paragraphCount: text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length
    };
    
    console.log(`Metrics for ${documentId}:`, metrics);
    
    res.json({
      success: true,
      documentId,
      metrics,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Metrics error:', error.message);
    res.status(500).json({ error: 'Failed to compute metrics' });
  }
});

// Analysis endpoint - query by documentId
app.post('/analyze', (req, res) => {
  try {
    console.log('Analyze endpoint hit, Content-Type:', req.headers['content-type']);
    console.log('Raw req.body:', JSON.stringify(req.body, null, 2));
    
    const { documentId, provider, model, apiKey, intent, query } = req.body;
    
    if (!documentId || !provider || !model || !apiKey || !intent) {
      console.log('Missing params:', { documentId: !!documentId, provider: !!provider, model: !!model, apiKey: !!apiKey, intent: !!intent });
      return res.status(400).json({ 
        error: 'Missing required parameters: documentId, provider, model, apiKey, intent' 
      });
    }
    
    // Get parsed text by documentId
    const documentText = parsedDocuments.get(documentId);
    if (!documentText) {
      return res.status(400).json({ 
        error: 'Document not parsed or missing. Please parse document first.' 
      });
    }
    
    console.log(`Analyzing document: ${documentId} (${documentText.length} chars)`);
    
    // Process analysis with stored text
    analyzeDocument({
      text: documentText,
      intent: intent,
      provider: provider,
      model: model,
      apiKey: apiKey,
      query: query
    }).then(response => {
      const analysisResult = extractResult(response);
      
      res.json({
        success: true,
        documentId: documentId,
        intent: intent,
        result: analysisResult,
        metadata: {
          textLength: documentText.length,
          timestamp: new Date().toISOString()
        }
      });
    }).catch(error => {
      console.error('Analysis error:', error.message);
      res.status(500).json({ error: 'Analysis failed' });
    });
    
  } catch (error) {
    console.error('Analysis processing error:', error.message);
    res.status(500).json({ error: 'Analysis failed' });
  }
});

// Handle multer errors
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File too large (max 10MB)' });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Only one file allowed' });
    }
  }
  
  if (error.message === 'Unsupported file type') {
    return res.status(400).json({ error: 'Only PDF, DOCX, and TXT files are supported' });
  }
  
  // Generic error handler
  console.error('Unhandled error:', error.message);
  res.status(500).json({ error: 'Internal server error' });
});

// Handle 404s
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Document analysis server running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/health`);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully');
  process.exit(0);
});