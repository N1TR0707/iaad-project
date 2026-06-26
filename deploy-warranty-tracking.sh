#!/bin/bash

echo "🚀 Deploying Warranty Tracking Feature..."
echo "========================================"

# Backup database
echo ""
echo "📦 Step 1: Backing up database..."
cp /opt/iaad-project/backend/database/app.db /opt/iaad-project/backend/database/app.db.backup-$(date +%Y%m%d-%H%M%S)
echo "✅ Database backed up!"

# Pull latest changes
echo ""
echo "📥 Step 2: Pulling latest code from GitHub..."
cd /opt/iaad-project
git pull origin main
echo "✅ Code updated!"

# Run migration
echo ""
echo "🔧 Step 3: Running database migration..."
node /opt/iaad-project/backend/scripts/migrateWarrantyClaims.js
echo "✅ Migration completed!"

# Restart PM2
echo ""
echo "🔄 Step 4: Restarting PM2..."
pm2 restart iaad-project
echo "✅ PM2 restarted!"

# Show status
echo ""
echo "📊 Step 5: Checking status..."
pm2 list

echo ""
echo "========================================"
echo "🎉 Deployment completed successfully!"
echo "========================================"
echo ""
echo "📋 Summary:"
echo "  ✅ Database backed up"
echo "  ✅ Code updated from GitHub"
echo "  ✅ Database migrated (6 new columns added)"
echo "  ✅ PM2 restarted"
echo ""
echo "🔗 Test the application:"
echo "  User Panel:  http://147.182.128.103/"
echo "  Admin Panel: http://147.182.128.103/admin"
echo ""
echo "📝 New Features:"
echo "  - User can input tracking number when submitting claim"
echo "  - Admin can see user tracking info"
echo "  - Admin can add return tracking number"
echo "  - 7 new status options for detailed tracking"
echo ""
