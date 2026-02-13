const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * Extract plain text from uploaded document file
 * @param {Object} file - Multer file object with buffer and mimetype
 * @returns {Promise<string>} - Extracted plain text content
 * @throws {Error} - On unsupported format or extraction failure
 */
async function extractText(file) {
  if (!file || !file.buffer) {
    throw new Error('Invalid file object');
  }

  try {
    const buffer = file.buffer;
    
    // Handle PDF files
    if (file.mimetype === 'application/pdf') {
      const pdfData = await pdfParse(buffer);
      return cleanText(pdfData.text);
    }
    
    // Handle DOCX files
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ buffer });
      return cleanText(result.value);
    }
    
    // Handle TXT files
    if (file.mimetype === 'text/plain') {
      const text = buffer.toString('utf-8');
      return cleanText(text);
    }
    
    // Fallback: try to detect by file extension
    const extension = file.originalname?.toLowerCase().split('.').pop();
    
    if (extension === 'pdf') {
      const pdfData = await pdfParse(buffer);
      return cleanText(pdfData.text);
    }
    
    if (extension === 'docx') {
      const result = await mammoth.extractRawText({ buffer });
      return cleanText(result.value);
    }
    
    if (extension === 'txt') {
      const text = buffer.toString('utf-8');
      return cleanText(text);
    }
    
    throw new Error(`Unsupported file format: ${file.mimetype || 'unknown'}`);
    
  } catch (error) {
    // Re-throw with context but don't expose file paths
    if (error.message.includes('Unsupported file format')) {
      throw error;
    }
    
    throw new Error(`Failed to extract text from document: ${error.message}`);
  }
}

/**
 * Clean and normalize extracted text
 * @param {string} text - Raw extracted text
 * @returns {string} - Cleaned text
 */
function cleanText(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('No text content found in document');
  }
  
  return text
    .replace(/\r\n/g, '\n')           // Normalize line endings
    .replace(/\r/g, '\n')             // Handle old Mac line endings
    .replace(/\n{3,}/g, '\n\n')       // Collapse excessive newlines
    .replace(/[ \t]+/g, ' ')          // Normalize whitespace
    .trim();                          // Remove leading/trailing whitespace
}

/**
 * Validate if file type is supported
 * @param {Object} file - Multer file object
 * @returns {boolean} - True if supported
 */
function isSupported(file) {
  const supportedMimeTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];
  
  const supportedExtensions = ['pdf', 'docx', 'txt'];
  const extension = file.originalname?.toLowerCase().split('.').pop();
  
  return supportedMimeTypes.includes(file.mimetype) || 
         supportedExtensions.includes(extension);
}

module.exports = {
  extractText,
  isSupported
};