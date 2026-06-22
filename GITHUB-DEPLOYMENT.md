# 🚀 GitHub Deployment Guide - IAAD-PROJECT

Panduan lengkap deploy IAAD-PROJECT ke Proxmox via GitHub

---

## 📝 STEP-BY-STEP DEPLOYMENT

### **PART 1: Push ke GitHub (di Windows)**

#### 1. Buat Repository di GitHub

1. Login ke https://github.com
2. Klik tombol **"+"** → **"New repository"**
3. Isi form:
   - **Repository name:** `iaad-project`
   - **Description:** IAAD-PROJECT - Warranty Management System
   - **Visibility:** Private (recommended) atau Public
   - **JANGAN centang:** Initialize with README (sudah ada)
4. Klik **"Create repository"**

#### 2. Link Local Repository ke GitHub

Setelah repository dibuat, GitHub akan tampilkan commands. Atau jalankan:

```bash
# Di PowerShell/CMD Windows, masuk ke folder project
cd D:\AI\Aktivasi

# Tambahkan remote GitHub (ganti YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/iaad-project.git

# Verifikasi remote
git remote -v

# Push ke GitHub
git branch -M main
git push -u origin main
```

**Jika diminta login:**
- Username: GitHub username Anda
- Password: Gunakan **Personal Access Token**, bukan password!

**Cara buat Personal Access Token:**
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token → Classic
3. Select scopes: `repo` (centang semua)
4. Generate token → COPY dan SIMPAN token!

#### 3. Verifikasi Upload

- Buka repository di GitHub
- Pastikan semua file sudah ter-upload
- **Pastikan file `.env` TIDAK ada** (sudah di-ignore)

---

### **PART 2: Deploy di Proxmox LXC Container**

#### 1. Buat LXC Container

Di Proxmox Web UI:
```
- Template: Ubuntu 22.04 LTS
- RAM: 2GB
- CPU: 2 cores
- Storage: 16GB
- Network: Bridge (catat IP yang didapat)
- Start container setelah dibuat
```

#### 2. Login ke Container

```bash
# Via SSH (ganti IP_CONTAINER)
ssh root@IP_CONTAINER

# Atau via Proxmox Console
```

#### 3. Clone Repository dari GitHub

```bash
# Update sistem
apt update && apt upgrade -y

# Install Git
apt install -y git

# Clone repository (ganti YOUR_USERNAME)
cd /opt
git clone https://github.com/YOUR_USERNAME/iaad-project.git
cd iaad-project

# Verifikasi files
ls -la
```

**Jika repository private:** GitHub akan minta login
- Username: GitHub username
- Password: Personal Access Token (bukan password!)

#### 4. Jalankan Automated Deployment Script

```bash
cd /opt/iaad-project

# Berikan permission pada script
chmod +x deploy.sh

# Jalankan deployment otomatis
bash deploy.sh
```

**Script ini akan otomatis install:**
- ✅ Node.js v20
- ✅ PM2 process manager
- ✅ Nginx web server
- ✅ UFW firewall
- ✅ Dependencies npm
- ✅ Initialize database
- ✅ Start aplikasi

**Durasi: ~5-10 menit**

#### 5. Konfigurasi Production Environment

```bash
# Copy template .env
cd /opt/iaad-project
cp .env.production .env

# Edit dengan nano
nano .env
```

**Update nilai-nilai ini:**

```env
# Generate JWT secret (jalankan di terminal)
# node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=<paste_hasil_generate_di_sini>

# Email settings (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
EMAIL_FROM=noreply@iaad-project.com

# Admin email
ADMIN_EMAIL=admin@yourdomain.com

# Application URL (ganti dengan IP container)
APP_URL=http://192.168.1.100
```

**Save:** Tekan `Ctrl+O`, Enter, lalu `Ctrl+X`

#### 6. Restart Aplikasi

```bash
# Restart PM2 agar load .env baru
pm2 restart iaad-project

# Check status
pm2 status

# View logs
pm2 logs iaad-project --lines 50
```

#### 7. Akses Aplikasi

Buka browser dan akses:

```
🌐 Web: http://IP_CONTAINER
👤 User Portal: http://IP_CONTAINER/public/
🔐 Admin Panel: http://IP_CONTAINER/admin/login.html
```

**Default Admin Login:**
- Username: `admin`
- Password: `admin123`

⚠️ **WAJIB ganti password setelah login pertama kali!**

---

## 🔄 UPDATE APLIKASI (Setelah Deploy)

### Jika ada update code di Windows:

**1. Push update ke GitHub:**
```bash
# Di Windows
cd D:\AI\Aktivasi
git add .
git commit -m "Update: deskripsi perubahan"
git push origin main
```

**2. Pull update di server:**
```bash
# Di Proxmox container
cd /opt/iaad-project

# Backup database dulu
cp backend/database.db backup/database-backup-$(date +%Y%m%d).db

# Pull update dari GitHub
git pull origin main

# Install dependencies baru (jika ada)
npm install --production

# Restart aplikasi
pm2 restart iaad-project
```

---

## 📊 Monitoring & Maintenance

### Commands Penting:

```bash
# Status aplikasi
pm2 status

# View logs real-time
pm2 logs iaad-project

# Restart aplikasi
pm2 restart iaad-project

# Stop aplikasi
pm2 stop iaad-project

# Start aplikasi
pm2 start iaad-project

# Nginx status
systemctl status nginx

# Restart nginx
systemctl restart nginx

# Check firewall
ufw status

# View nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Database Backup Manual:

```bash
cd /opt/iaad-project
cp backend/database.db backup/database-$(date +%Y%m%d-%H%M%S).db
```

**Auto backup** sudah dikonfigurasi via cron (setiap hari jam 2 pagi)

---

## 🔒 Security Checklist

Setelah deployment, pastikan:

- [ ] Ganti default admin password (`admin/admin123`)
- [ ] Generate JWT secret yang kuat (64+ karakter random)
- [ ] Configure email SMTP dengan credentials valid
- [ ] Update APP_URL dengan IP/domain yang benar
- [ ] Firewall aktif (UFW enabled)
- [ ] Nginx berjalan dengan baik
- [ ] SSL/HTTPS setup (jika punya domain)
- [ ] Regular database backups
- [ ] Monitor logs secara berkala

---

## 🆘 Troubleshooting

### Aplikasi tidak bisa diakses:
```bash
# Check PM2
pm2 status
pm2 logs iaad-project

# Check Nginx
systemctl status nginx
nginx -t

# Check firewall
ufw status
```

### Database error:
```bash
# Check permissions
ls -la /opt/iaad-project/backend/database.db

# Re-initialize (HATI-HATI: hapus data!)
npm run init-db
```

### Port conflict:
```bash
# Check port 3000
netstat -tulpn | grep 3000

# Kill process
kill -9 <PID>
```

### Git pull error:
```bash
# Reset local changes
git reset --hard origin/main
git pull origin main
```

---

## 🎯 Summary

**Workflow:**
1. ✅ Code di Windows → Push ke GitHub
2. ✅ Clone/Pull dari GitHub di Proxmox
3. ✅ Run deploy.sh (auto setup)
4. ✅ Configure .env
5. ✅ Restart PM2
6. ✅ Access via browser

**Keuntungan GitHub deployment:**
- ✅ Version control lengkap
- ✅ Bisa deploy ke multiple server
- ✅ Easy rollback jika ada masalah
- ✅ Collaboration dengan tim
- ✅ Backup code otomatis

---

## 📞 Support

Jika ada masalah, check:
1. PM2 logs: `pm2 logs iaad-project`
2. Nginx logs: `/var/log/nginx/error.log`
3. System logs: `journalctl -u nginx -f`

---

**🎉 Selamat! IAAD-PROJECT berhasil di-deploy!**
