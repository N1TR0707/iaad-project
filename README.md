# IAAD-PROJECT

Warranty Management System - Modern web application for product warranty activation and management.

## 🚀 Features

- ✅ User registration and authentication
- 📦 Product warranty activation
- 🔍 Warranty status checking
- 🔧 Warranty claim management
- 👨‍💼 Admin panel for management
- 📧 Email notifications
- 📊 Statistics and reporting

## 🛠️ Tech Stack

- **Backend:** Node.js + Express
- **Database:** SQLite
- **Frontend:** Vanilla HTML/CSS/JavaScript
- **Email:** Nodemailer
- **Authentication:** JWT

## 📋 Requirements

- Node.js v18+ or v20 (LTS)
- npm v9+
- PM2 (for production)

## 🔧 Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/iaad-project.git
cd iaad-project
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
# Copy production template
cp .env.production .env

# Edit .env dengan setting Anda
nano .env
```

### 4. Initialize Database

```bash
npm run init-db
```

### 5. Start Application

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

## 🚀 Production Deployment

### Deploy ke Proxmox LXC Container

Lihat file **[DEPLOYMENT.md](./DEPLOYMENT.md)** untuk guide lengkap deployment ke Proxmox.

**Quick Deploy:**
```bash
# 1. Clone repo di server
git clone https://github.com/YOUR_USERNAME/iaad-project.git /opt/iaad-project
cd /opt/iaad-project

# 2. Run automated deployment
chmod +x deploy.sh
bash deploy.sh

# 3. Configure .env
cp .env.production .env
nano .env

# 4. Start with PM2
pm2 start ecosystem.config.js --env production
pm2 save
```

## 🔑 Default Credentials

**Admin Panel:**
- URL: `/admin/login.html`
- Username: `admin`
- Password: `admin123`

⚠️ **CHANGE DEFAULT PASSWORD IMMEDIATELY AFTER FIRST LOGIN!**

## 📁 Project Structure

```
iaad-project/
├── backend/
│   ├── config/         # Database & email config
│   ├── middleware/     # Auth & rate limiting
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   └── server.js       # Main server
├── frontend/
│   ├── public/         # User portal pages
│   ├── admin/          # Admin panel pages
│   ├── css/            # Stylesheets
│   └── js/             # Client scripts
├── uploads/            # User uploaded files
├── logs/               # Application logs
├── backup/             # Database backups
├── .env.production     # Environment template
├── ecosystem.config.js # PM2 configuration
├── deploy.sh           # Deployment script
└── package.json        # Dependencies
```

## 📚 Documentation

- [Deployment Guide](./DEPLOYMENT.md) - Complete deployment instructions

## 🔒 Security

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- Input validation
- CORS enabled
- File upload restrictions

## 🛡️ License

MIT License

## 👨‍💻 Author

IAAD-PROJECT Development Team

---

**© 2026 IAAD-PROJECT. All rights reserved.**
