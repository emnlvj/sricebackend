// generateSecret.js

const crypto = require('crypto');

// Generate a random 32-byte key (256 bits)
const secretKey = crypto.randomBytes(32).toString('hex');
console.log('Generated Secret Key:', secretKey);