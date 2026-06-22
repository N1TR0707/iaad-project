const nodemailer = require('nodemailer');
const db = require('../config/database');
require('dotenv').config();

class EmailService {
  constructor() {
    // Check if email is properly configured
    this.isConfigured = this.checkEmailConfig();
    
    if (this.isConfigured) {
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
      console.log('✓ Email service configured');
    } else {
      console.log('⚠️  Email service disabled (SMTP not configured)');
    }
  }

  checkEmailConfig() {
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;
    
    // Check if email credentials are configured (not dummy values)
    if (!emailUser || !emailPass || 
        emailUser === 'your-email@gmail.com' || 
        emailPass === 'your-app-password' ||
        emailUser.includes('your-email')) {
      return false;
    }
    
    return true;
  }

  async sendEmail(to, subject, html, type = 'general') {
    // If email is not configured, skip sending but log it
    if (!this.isConfigured) {
      console.log(`📧 Email skipped (not configured): ${type} to ${to}`);
      
      // Still log to database as "skipped"
      await db.run(
        'INSERT INTO email_logs (recipient, subject, type, status) VALUES (?, ?, ?, ?)',
        [to, subject, type, 'skipped']
      ).catch(() => {}); // Ignore errors
      
      return { success: true, skipped: true, reason: 'Email not configured' };
    }

    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to,
        subject,
        html
      };

      const info = await this.transporter.sendMail(mailOptions);

      // Log email to database
      await db.run(
        'INSERT INTO email_logs (recipient, subject, type, status) VALUES (?, ?, ?, ?)',
        [to, subject, type, 'sent']
      ).catch(() => {}); // Ignore errors

      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending email:', error.message);
      
      // Log failed email
      await db.run(
        'INSERT INTO email_logs (recipient, subject, type, status) VALUES (?, ?, ?, ?)',
        [to, subject, type, 'failed']
      ).catch(() => {}); // Ignore errors

      // Return success anyway (don't break the app flow)
      return { success: false, error: error.message };
    }
  }

  async sendWelcomeEmail(email, nama) {
    const subject = 'Selamat Datang di IAAD-PROJECT';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Selamat Datang!</h1>
          </div>
          <div class="content">
            <h2>Halo, ${nama}!</h2>
            <p>Terima kasih telah mendaftar di IAAD-PROJECT - Warranty Management System.</p>
            <p>Dengan akun ini, Anda dapat:</p>
            <ul>
              <li>✅ Mengaktifkan garansi produk Anda secara online</li>
              <li>📊 Melacak status garansi produk</li>
              <li>🔔 Menerima notifikasi pengingat garansi</li>
              <li>📱 Akses informasi garansi kapan saja</li>
            </ul>
            <p>Silakan login dan aktifkan produk Anda sekarang!</p>
            <center>
              <a href="${process.env.APP_URL}/login.html" class="button">Login Sekarang</a>
            </center>
          </div>
          <div class="footer">
            <p>Email ini dikirim secara otomatis. Mohon tidak membalas email ini.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(email, subject, html, 'welcome');
  }

  async sendActivationSuccessEmail(email, nama, productNama, serialCode, warrantyExpiredAt) {
    const expiredDate = new Date(warrantyExpiredAt).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const subject = `✅ Aktivasi Garansi Berhasil - ${productNama}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: white; padding: 20px; border-left: 4px solid #11998e; margin: 20px 0; border-radius: 5px; }
          .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .info-label { font-weight: bold; color: #666; }
          .info-value { color: #333; }
          .serial-code { font-size: 24px; font-weight: bold; color: #11998e; text-align: center; padding: 15px; background: #e8f5e9; border-radius: 5px; letter-spacing: 2px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Garansi Teraktivasi!</h1>
          </div>
          <div class="content">
            <h2>Selamat, ${nama}!</h2>
            <p>Garansi produk Anda telah berhasil diaktifkan.</p>
            
            <div class="info-box">
              <h3 style="margin-top: 0;">Detail Garansi</h3>
              <div class="info-row">
                <span class="info-label">Produk:</span>
                <span class="info-value">${productNama}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Serial Number:</span>
                <span class="info-value">${serialCode}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Masa Berlaku:</span>
                <span class="info-value">Hingga ${expiredDate}</span>
              </div>
            </div>

            <p><strong>Simpan email ini sebagai bukti garansi Anda.</strong></p>
            
            <p>Anda dapat mengecek status garansi kapan saja melalui dashboard Anda atau halaman pengecekan garansi publik.</p>
            
            <p>Kami akan mengirimkan pengingat sebelum masa garansi berakhir.</p>
          </div>
          <div class="footer">
            <p>Untuk pertanyaan, hubungi customer service kami.</p>
            <p>Email ini dikirim secara otomatis. Mohon tidak membalas email ini.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(email, subject, html, 'activation');
  }

  async sendWarrantyReminderEmail(email, nama, productNama, serialCode, daysRemaining) {
    const subject = `⏰ Pengingat: Garansi Anda Akan Berakhir dalam ${daysRemaining} Hari`;
    const urgency = daysRemaining <= 7 ? 'high' : 'medium';
    const color = daysRemaining <= 7 ? '#ff5722' : '#ff9800';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, ${color} 0%, #f44336 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .warning-box { background: #fff3e0; padding: 20px; border-left: 4px solid ${color}; margin: 20px 0; border-radius: 5px; }
          .button { display: inline-block; padding: 12px 30px; background: ${color}; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Pengingat Garansi</h1>
          </div>
          <div class="content">
            <h2>Halo, ${nama}!</h2>
            <div class="warning-box">
              <h3 style="margin-top: 0; color: ${color};">⚠️ Garansi Anda Akan Segera Berakhir</h3>
              <p><strong>Produk:</strong> ${productNama}</p>
              <p><strong>Serial Number:</strong> ${serialCode}</p>
              <p><strong>Sisa Waktu:</strong> ${daysRemaining} hari lagi</p>
            </div>
            
            ${daysRemaining <= 7 
              ? '<p><strong>Perhatian:</strong> Masa garansi Anda akan berakhir dalam waktu dekat. Jika ada keluhan atau permasalahan dengan produk, segera hubungi customer service kami sebelum garansi berakhir.</p>' 
              : '<p>Ini adalah pengingat bahwa masa garansi produk Anda akan berakhir dalam 30 hari. Pastikan produk Anda berfungsi dengan baik.</p>'
            }
            
            <p>Jika Anda mengalami masalah dengan produk, jangan ragu untuk menghubungi kami sebelum garansi berakhir.</p>
            
            <center>
              <a href="${process.env.APP_URL}/dashboard.html" class="button">Lihat Detail Garansi</a>
            </center>
          </div>
          <div class="footer">
            <p>Hubungi customer service kami untuk bantuan.</p>
            <p>Email ini dikirim secara otomatis. Mohon tidak membalas email ini.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(email, subject, html, `reminder_${daysRemaining}days`);
  }

  async sendAdminNotification(productNama, userNama, userEmail, serialCode) {
    const subject = `🔔 Aktivasi Baru: ${productNama}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #333; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; }
          .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .info-table td { padding: 10px; border-bottom: 1px solid #ddd; }
          .info-table td:first-child { font-weight: bold; width: 40%; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🔔 Notifikasi Aktivasi Baru</h2>
          </div>
          <div class="content">
            <p>Aktivasi garansi baru telah dilakukan:</p>
            <table class="info-table">
              <tr>
                <td>Produk:</td>
                <td>${productNama}</td>
              </tr>
              <tr>
                <td>Serial Number:</td>
                <td>${serialCode}</td>
              </tr>
              <tr>
                <td>Nama Pelanggan:</td>
                <td>${userNama}</td>
              </tr>
              <tr>
                <td>Email:</td>
                <td>${userEmail}</td>
              </tr>
              <tr>
                <td>Waktu:</td>
                <td>${new Date().toLocaleString('id-ID')}</td>
              </tr>
            </table>
            <p><a href="${process.env.APP_URL}/admin/activations.html">Lihat di IAAD-PROJECT Admin</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(process.env.ADMIN_EMAIL, subject, html, 'admin_notification');
  }
}

module.exports = new EmailService();
