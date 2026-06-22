# IAAD-PROJECT Deployment Guide - Proxmox LXC Container

## 📦 Persiapan Container

### 1. Buat LXC Container di Proxmox

**Rekomendasi Specs:**
- Template: Ubuntu 22.04 LTS
- RAM: 1GB minimum (2GB recommended)
- CPU: 1 core minimum (2 cores recommended)
- Storage: 8GB minimum (16GB recommended)
- Network: Bridge ke network interface

**Container Settings:**
```bash
# Pastikan container unprivileged untuk keamanan
Unprivileged container: Yes
Start at boot: Yes
```

### 2. Setup Container Setelah Dibuat

Login ke container via Proxmox console atau SSH:

```bash
# Update sistem
apt update && apt upgrade -y

# Install utilities dasar
apt install -y curl wget git nano net-tools
```

---

## 🔧 Install Node.js & Dependencies

### Install Node.js v20 (LTS)

```bash
# Install Node.js dari NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Verifikasi instalasi
node -v  # Should show v20.x.x
npm -v   # Should show npm version
```

### Install PM2 (Process Manager)

```bash
npm install -g pm2

# Setup PM2 startup script
pm2 startup systemd
# Follow the instruction shown
```

---

## 📁 Deploy Aplikasi

### 1. Transfer File Aplikasi

**Opsi A: Via SCP (dari komputer Windows)**
```bash
# Dari PowerShell/CMD Windows (pastikan OpenSSH client terinstall)
scp -r "D:\AI\Aktivasi" root@<IP_CONTAINER>:/opt/iaad-project
```

**Opsi B: Via Git (jika ada repository)**
```bash
cd /opt
git clone <your-repo-url> iaad-project
cd iaad-project
```

**Opsi C: Manual via Proxmox File Manager**
- Zip folder D:\AI\Aktivasi
- Upload via Proxmox web interface
- Unzip di container

### 2. Install Dependencies

```bash
cd /opt/iaad-project
npm install --production

# Verifikasi instalasi
npm list --depth=0
```

### 3. Konfigurasi Environment

```bash
# Edit .env file
nano .env
```

**Update konfigurasi production:**
```env
# Server Configuration
PORT=3000
NODE_ENV=production

# Database
DATABASE_PATH=./backend/database.db

# JWT Secret (GANTI dengan secret yang aman!)
JWT_SECRET=<generate-random-secure-string-here>

# Email Configuration (isi dengan SMTP real)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@iaad-project.com

# Admin Email
ADMIN_EMAIL=admin@yourdomain.com

# Application URL (ganti dengan domain/IP container)
APP_URL=http://<CONTAINER_IP>:3000
```

**Generate JWT Secret yang aman:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4. Initialize Database

```bash
npm run init-db
```

### 5. Test Run

```bash
# Test jalankan aplikasi
npm start

# Buka browser: http://<CONTAINER_IP>:3000
# Jika berfungsi, stop dengan Ctrl+C
```

---

## 🚀 Production Setup dengan PM2

### 1. Jalankan dengan PM2

```bash
cd /opt/iaad-project

# Start aplikasi dengan PM2
pm2 start backend/server.js --name iaad-project

# Monitoring
pm2 status
pm2 logs iaad-project

# Save PM2 process list
pm2 save

# Setup auto-start on boot
pm2 startup
# Follow the instruction shown
```

### 2. PM2 Commands Berguna

```bash
# Restart aplikasi
pm2 restart iaad-project

# Stop aplikasi
pm2 stop iaad-project

# View logs
pm2 logs iaad-project

# Monitor resources
pm2 monit

# List all processes
pm2 list
```

---

## 🌐 Setup Nginx Reverse Proxy (Optional tapi Recommended)

### 1. Install Nginx

```bash
apt install -y nginx
```

### 2. Konfigurasi Nginx

```bash
nano /etc/nginx/sites-available/iaad-project
```

**Konfigurasi Nginx:**
```nginx
server {
    listen 80;
    server_name <domain-anda.com atau IP>;

    # Increase upload size for claim photos
    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 3. Enable Site & Restart Nginx

```bash
# Symlink ke sites-enabled
ln -s /etc/nginx/sites-available/iaad-project /etc/nginx/sites-enabled/

# Test konfigurasi
nginx -t

# Restart nginx
systemctl restart nginx
systemctl enable nginx
```

Sekarang aplikasi bisa diakses via **http://<CONTAINER_IP>** (port 80)

---

## 🔒 Setup SSL dengan Let's Encrypt (Optional)

### Jika punya domain:

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Dapatkan SSL certificate
certbot --nginx -d domain-anda.com

# Auto-renewal
certbot renew --dry-run
```

---

## 🔥 Firewall Setup

```bash
# Install UFW (Uncomplicated Firewall)
apt install -y ufw

# Default policies
ufw default deny incoming
ufw default allow outgoing

# Allow SSH
ufw allow 22/tcp

# Allow HTTP
ufw allow 80/tcp

# Allow HTTPS (jika pakai SSL)
ufw allow 443/tcp

# Enable firewall
ufw enable

# Check status
ufw status
```

---

## 📊 Monitoring & Maintenance

### Log Files

```bash
# PM2 logs
pm2 logs iaad-project

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# System logs
journalctl -u nginx -f
```

### Database Backup

```bash
# Backup database (jalankan secara berkala)
cd /opt/iaad-project
cp backend/database.db backup/database-$(date +%Y%m%d-%H%M%S).db

# Setup cron untuk auto backup
crontab -e

# Tambahkan (backup setiap hari jam 2 pagi)
0 2 * * * cp /opt/iaad-project/backend/database.db /opt/iaad-project/backup/database-$(date +\%Y\%m\%d).db
```

### Update Aplikasi

```bash
cd /opt/iaad-project

# Backup database dulu
cp backend/database.db backup/database-backup.db

# Pull update (jika pakai git)
git pull

# Install dependencies baru (jika ada)
npm install --production

# Restart PM2
pm2 restart iaad-project
```

---

## 🔑 Security Checklist

- [ ] Ganti default admin password (admin/admin123)
- [ ] Generate JWT secret yang kuat
- [ ] Setup firewall (UFW)
- [ ] Disable root SSH login (edit /etc/ssh/sshd_config)
- [ ] Setup SSL/HTTPS jika punya domain
- [ ] Regular database backups
- [ ] Update sistem secara berkala
- [ ] Monitor logs untuk aktivitas mencurigakan

---

## 🎯 Testing Deployment

### 1. Test User Portal
- Buka: `http://<IP_ATAU_DOMAIN>/public/index.html`
- Test registrasi user
- Test login
- Test aktivasi produk
- Test klaim garansi

### 2. Test Admin Panel
- Buka: `http://<IP_ATAU_DOMAIN>/admin/login.html`
- Login: admin / admin123
- Test semua fitur admin

### 3. Test API
```bash
# Health check
curl http://localhost:3000/health

# API info
curl http://localhost:3000/api
```

---

## 📞 Troubleshooting

### Aplikasi tidak bisa diakses:
```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs iaad-project

# Check nginx
systemctl status nginx
nginx -t
```

### Database error:
```bash
# Check database file permissions
ls -la /opt/iaad-project/backend/database.db

# Re-initialize jika perlu (HATI-HATI: akan hapus data)
npm run init-db
```

### Port sudah digunakan:
```bash
# Check port 3000
netstat -tulpn | grep 3000

# Kill process jika perlu
kill -9 <PID>
```

---

## 📚 Default Credentials

**Admin Panel:**
- URL: `http://<IP>/admin/login.html`
- Username: `admin`
- Password: `admin123`

⚠️ **PENTING: Ganti password default setelah login pertama!**

---

## 🚀 Quick Start Commands

```bash
# Status check
pm2 status

# Restart aplikasi
pm2 restart iaad-project

# View logs
pm2 logs iaad-project --lines 100

# Nginx reload
systemctl reload nginx

# Database backup
cp backend/database.db backup/database-backup-$(date +%Y%m%d).db
```

---

## 🎉 Deployment Complete!

Aplikasi IAAD-PROJECT sekarang berjalan di Proxmox LXC Container!

**Access Points:**
- Landing Page: `http://<IP_CONTAINER>/`
- User Portal: `http://<IP_CONTAINER>/public/`
- Admin Panel: `http://<IP_CONTAINER>/admin/`
- API: `http://<IP_CONTAINER>/api`

Selamat! 🎊
