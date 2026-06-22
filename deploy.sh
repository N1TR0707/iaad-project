#!/bin/bash

# ============================================
# IAAD-PROJECT Deployment Script untuk Proxmox LXC
# ============================================
# Usage: bash deploy.sh

set -e

echo "============================================"
echo "  IAAD-PROJECT Deployment Script"
echo "============================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run as root (sudo bash deploy.sh)"
    exit 1
fi

# 1. Update System
echo "📦 Updating system..."
apt update && apt upgrade -y
print_success "System updated"
echo ""

# 2. Install Prerequisites
echo "📦 Installing prerequisites..."
apt install -y curl wget git nano net-tools ufw
print_success "Prerequisites installed"
echo ""

# 3. Install Node.js
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js v20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
    print_success "Node.js installed: $(node -v)"
else
    print_warning "Node.js already installed: $(node -v)"
fi
echo ""

# 4. Install PM2
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    npm install -g pm2
    print_success "PM2 installed"
else
    print_warning "PM2 already installed"
fi
echo ""

# 5. Create Application Directory
APP_DIR="/opt/iaad-project"
echo "📁 Setting up application directory..."

if [ ! -d "$APP_DIR" ]; then
    mkdir -p "$APP_DIR"
    print_success "Created directory: $APP_DIR"
else
    print_warning "Directory already exists: $APP_DIR"
fi
echo ""

# 6. Install Application Dependencies
echo "📦 Installing application dependencies..."
cd "$APP_DIR"

if [ -f "package.json" ]; then
    npm install --production
    print_success "Dependencies installed"
else
    print_warning "package.json not found. Please upload application files first!"
fi
echo ""

# 7. Create Logs Directory
echo "📁 Creating logs directory..."
mkdir -p "$APP_DIR/logs"
mkdir -p "$APP_DIR/backup"
mkdir -p "$APP_DIR/uploads"
print_success "Directories created"
echo ""

# 8. Setup Environment File
echo "📝 Setting up environment file..."
if [ ! -f "$APP_DIR/.env" ]; then
    if [ -f "$APP_DIR/.env.production" ]; then
        cp "$APP_DIR/.env.production" "$APP_DIR/.env"
        print_success ".env file created from template"
        print_warning "Please edit .env file with your production values!"
    else
        print_error ".env.production template not found"
    fi
else
    print_warning ".env file already exists"
fi
echo ""

# 9. Initialize Database
echo "🗄️  Initializing database..."
if [ -f "$APP_DIR/backend/config/initDatabase.js" ]; then
    npm run init-db
    print_success "Database initialized"
else
    print_warning "Database initialization script not found"
fi
echo ""

# 10. Install Nginx
if ! command -v nginx &> /dev/null; then
    echo "📦 Installing Nginx..."
    apt install -y nginx
    print_success "Nginx installed"
else
    print_warning "Nginx already installed"
fi
echo ""

# 11. Setup Nginx Configuration
echo "🌐 Setting up Nginx configuration..."
if [ -f "$APP_DIR/nginx-iaad-project.conf" ]; then
    cp "$APP_DIR/nginx-iaad-project.conf" /etc/nginx/sites-available/iaad-project
    ln -sf /etc/nginx/sites-available/iaad-project /etc/nginx/sites-enabled/iaad-project
    
    # Test nginx configuration
    if nginx -t 2>/dev/null; then
        systemctl restart nginx
        systemctl enable nginx
        print_success "Nginx configured and started"
    else
        print_error "Nginx configuration test failed"
    fi
else
    print_warning "Nginx configuration file not found"
fi
echo ""

# 12. Setup Firewall
echo "🔥 Setting up firewall..."
ufw --force enable
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
print_success "Firewall configured"
echo ""

# 13. Start Application with PM2
echo "🚀 Starting application with PM2..."
cd "$APP_DIR"

if [ -f "ecosystem.config.js" ]; then
    pm2 start ecosystem.config.js --env production
    pm2 save
    pm2 startup systemd -u root --hp /root
    print_success "Application started with PM2"
else
    pm2 start backend/server.js --name iaad-project
    pm2 save
    pm2 startup systemd -u root --hp /root
    print_warning "Started without ecosystem config"
fi
echo ""

# 14. Setup Cron for Database Backup
echo "⏰ Setting up database backup cron..."
CRON_CMD="0 2 * * * cd $APP_DIR && cp backend/database.db backup/database-\$(date +\%Y\%m\%d).db"
(crontab -l 2>/dev/null | grep -v "database-backup"; echo "$CRON_CMD") | crontab -
print_success "Daily backup cron configured (2 AM)"
echo ""

# 15. Display Application Info
echo ""
echo "============================================"
echo "  ✅ Deployment Complete!"
echo "============================================"
echo ""
echo "Application Status:"
pm2 status
echo ""
echo "Access Points:"
echo "  🌐 Web: http://$(hostname -I | awk '{print $1}')"
echo "  🔐 Admin: http://$(hostname -I | awk '{print $1}')/admin/login.html"
echo "  📊 API: http://$(hostname -I | awk '{print $1}')/api"
echo ""
echo "Default Admin Login:"
echo "  Username: admin"
echo "  Password: admin123"
echo ""
echo "⚠️  Important Next Steps:"
echo "  1. Edit .env file: nano $APP_DIR/.env"
echo "  2. Update APP_URL, JWT_SECRET, and email settings"
echo "  3. Change default admin password"
echo "  4. Update Nginx configuration with your domain"
echo "  5. Setup SSL with Let's Encrypt (if needed)"
echo ""
echo "Useful Commands:"
echo "  pm2 status          - Check application status"
echo "  pm2 logs            - View application logs"
echo "  pm2 restart all     - Restart application"
echo "  systemctl restart nginx - Restart Nginx"
echo ""
echo "============================================"
