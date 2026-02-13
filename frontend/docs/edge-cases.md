# Frontend Edge Cases & Failure Modes

## File Upload Edge Cases

### Unsupported File Type
**Edge Case:** User uploads .png, .xlsx, or other unsupported format
**User-Visible Behavior:** Error message "Please upload a PDF, DOCX, or TXT file" appears in upload zone for 3 seconds, then resets
**Reasoning:** Clear feedback prevents confusion, auto-reset allows immediate retry

### File Too Large
**Edge Case:** User uploads file > 10MB
**User-Visible Behavior:** Error message "File must be smaller than 10MB" with red styling
**Reasoning:** Prevents backend overload, gives specific size limit for user guidance

### Empty Document
**Edge Case:** User uploads 0-byte file or corrupted document
**User-Visible Behavior:** Error message "This file appears to be empty"
**Reasoning:** Prevents wasted API calls and processing time

### Drag Multiple Files
**Edge Case:** User drags multiple files to upload zone
**User-Visible Behavior:** Only first file is processed, others ignored silently
**Reasoning:** Single-file workflow is clearer than multi-file complexity

### Browser File API Unavailable
**Edge Case:** Very old browser without File API support
**User-Visible Behavior:** Upload zone becomes non-functional, no drag events
**Reasoning:** Graceful degradation - app doesn't crash but feature unavailable

## Configuration Edge Cases

### Invalid API Key Format
**Edge Case:** User enters malformed API key (too short, wrong prefix)
**User-Visible Behavior:** Analysis fails with "Please check your API key" error
**Reasoning:** Don't validate format client-side to avoid exposing key patterns

### API Key Revoked/Expired
**Edge Case:** Valid format but unauthorized key
**User-Visible Behavior:** "Please check your API key" error after analysis starts
**Reasoning:** Generic message protects against key enumeration attacks

### Provider Model Mismatch
**Edge Case:** User selects OpenAI but model is Claude-specific
**User-Visible Behavior:** Model dropdown updates automatically when provider changes
**Reasoning:** Prevents invalid combinations, maintains UI consistency

### Missing Configuration
**Edge Case:** User clicks analyze without API key
**User-Visible Behavior:** Button remains disabled, shows "Enter API key to continue"
**Reasoning:** Prevents invalid requests, clear call-to-action