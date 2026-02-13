#!/usr/bin/env node

const crypto = require('crypto');

function generateEncryptedKey(apiKey) {
  const secret = 'doc_ai_2026_key';
  let result = '';
  for (let i = 0; i < apiKey.length; i++) {
    result += String.fromCharCode(apiKey.charCodeAt(i) ^ secret.charCodeAt(i % secret.length));
  }
  return Buffer.from(result).toString('base64');
}

function decryptKey(encrypted) {
  const secret = 'doc_ai_2026_key';
  const decoded = Buffer.from(encrypted, 'base64').toString();
  let result = '';
  for (let i = 0; i < decoded.length; i++) {
    result += String.fromCharCode(decoded.charCodeAt(i) ^ secret.charCodeAt(i % secret.length));
  }
  return result;
}

const apiKey = process.argv[2];
if (!apiKey) {
  console.log('Usage: node generate-key.js <your-api-key>');
  console.log('Example: node generate-key.js xai-abc123...');
  process.exit(1);
}

const encrypted = generateEncryptedKey(apiKey);
console.log('Encrypted API Key:', encrypted);
console.log('Verification (decrypted):', decryptKey(encrypted));