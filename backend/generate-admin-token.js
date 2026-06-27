const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here-change-in-production';

// Generate admin token
const adminToken = jwt.sign(
  { 
    adminId: 1, 
    type: 'admin' 
  },
  JWT_SECRET,
  { expiresIn: '7d' }
);

console.log('\n=== Admin Token ===');
console.log('Token:', adminToken);
console.log('\nCopy this token and use it in your browser console:');
console.log(`localStorage.setItem('adminToken', '${adminToken}');`);
console.log('\nThen refresh the page.');
