/**
 * Test Email Script
 * Digunakan untuk test SMTP configuration
 */

require('dotenv').config();
const emailService = require('../services/emailService');

async function testEmail() {
  console.log('=================================');
  console.log('📧 Testing Email Configuration');
  console.log('=================================');
  console.log('');
  
  console.log('SMTP Settings:');
  console.log(`  Host: ${process.env.EMAIL_HOST}`);
  console.log(`  Port: ${process.env.EMAIL_PORT}`);
  console.log(`  User: ${process.env.EMAIL_USER}`);
  console.log(`  From: ${process.env.EMAIL_FROM}`);
  console.log('');

  const testEmail = process.argv[2] || process.env.EMAIL_USER;
  
  if (!testEmail) {
    console.error('❌ Error: Email tujuan tidak ditemukan');
    console.log('Usage: node testEmail.js your-email@gmail.com');
    process.exit(1);
  }

  console.log(`📤 Mengirim test email ke: ${testEmail}`);
  console.log('');

  try {
    await emailService.sendTestEmail(testEmail);
    console.log('');
    console.log('=================================');
    console.log('✅ Test Email Berhasil Dikirim!');
    console.log('=================================');
    console.log('');
    console.log('📬 Cek inbox email Anda!');
    console.log('   (Jangan lupa cek folder Spam juga)');
    console.log('');
  } catch (error) {
    console.log('');
    console.log('=================================');
    console.log('❌ Test Email Gagal!');
    console.log('=================================');
    console.log('');
    console.error('Error:', error.message);
    console.log('');
    console.log('🔍 Possible issues:');
    console.log('  1. App Password salah atau expired');
    console.log('  2. 2-Step Verification belum diaktifkan');
    console.log('  3. SMTP settings salah');
    console.log('  4. Gmail blocked "Less secure app access"');
    console.log('');
    process.exit(1);
  }
}

testEmail();
