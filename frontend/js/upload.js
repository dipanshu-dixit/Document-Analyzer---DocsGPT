// File upload handling - only deals with File validation

// Handle file upload and validation
export function handleFileUpload(file) {
  // Validate file type
  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];
  
  const allowedExtensions = ['.pdf', '.docx', '.txt'];
  const fileExtension = getFileExtension(file.name);
  
  if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
    return { success: false, error: 'Upload a PDF, DOCX, or TXT' };
  }
  
  // Validate file size (10MB limit)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return { success: false, error: 'File too large. Use files under 10MB' };
  }
  
  // Validate file is not empty
  if (file.size === 0) {
    return { success: false, error: 'File is empty. Choose another file' };
  }
  
  return { success: true, file: file };
}

// Get file extension
function getFileExtension(filename) {
  return filename.toLowerCase().substring(filename.lastIndexOf('.'));
}