#!/bin/bash

#######################################
# Auto Update Email Config to Brevo
# Script ini akan update .env dengan Brevo SMTP credentials
#######################################

echo "=========================================="
echo "🔧 Update Email Config to Brevo SMTP"
echo "=========================================="
echo ""

# Path to .env file
ENV_FILE="/opt/iaad-project/.env"

# Backup .env file first
echo "📦 Backing up .env file..."
cp "$ENV_FILE" "$ENV_FILE.backup.$(date +%Y%m%d_%H%M%S)"
echo "✅ Backup created: $ENV_FILE.backup.$(date +%Y%m%d_%H%M%S)"
echo ""

# Brevo SMTP Credentials
BREVO_HOST="smtp-relay.brevo.com"
BREVO_PORT="587"
BREVO_SECURE="false"
BREVO_USER="afe962001@smtp-brevo.com"
BREVO_PASS="xsmtpsib-0a3cec314d42c39e7596fba06361420eb11515ea75"
BREVO_FROM="IAAD-PROJECT <noreply@aktivasi.iaad.store>"
ADMIN_EMAIL="afe962001@smtp-brevo.com"

echo "🔄 Updating email configuration..."

# Update EMAIL_HOST
sed -i "s|^EMAIL_HOST=.*|EMAIL_HOST=$BREVO_HOST|g" "$ENV_FILE"
echo "✅ EMAIL_HOST updated"

# Update EMAIL_PORT
sed -i "s|^EMAIL_PORT=.*|EMAIL_PORT=$BREVO_PORT|g" "$ENV_FILE"
echo "✅ EMAIL_PORT updated"

# Update EMAIL_SECURE
sed -i "s|^EMAIL_SECURE=.*|EMAIL_SECURE=$BREVO_SECURE|g" "$ENV_FILE"
echo "✅ EMAIL_SECURE updated"

# Update EMAIL_USER
sed -i "s|^EMAIL_USER=.*|EMAIL_USER=$BREVO_USER|g" "$ENV_FILE"
echo "✅ EMAIL_USER updated"

# Update EMAIL_PASS
sed -i "s|^EMAIL_PASS=.*|EMAIL_PASS=$BREVO_PASS|g" "$ENV_FILE"
echo "✅ EMAIL_PASS updated"

# Update EMAIL_FROM
sed -i "s|^EMAIL_FROM=.*|EMAIL_FROM=$BREVO_FROM|g" "$ENV_FILE"
echo "✅ EMAIL_FROM updated"

# Update ADMIN_EMAIL
sed -i "s|^ADMIN_EMAIL=.*|ADMIN_EMAIL=$ADMIN_EMAIL|g" "$ENV_FILE"
echo "✅ ADMIN_EMAIL updated"

echo ""
echo "=========================================="
echo "✅ Email Config Updated Successfully!"
echo "=========================================="
echo ""
echo "📧 New SMTP Settings:"
echo "  Host: $BREVO_HOST"
echo "  Port: $BREVO_PORT"
echo "  User: $BREVO_USER"
echo "  From: $BREVO_FROM"
echo ""
echo "🔄 Next steps:"
echo "  1. Restart PM2: pm2 restart iaad-project"
echo "  2. Check logs: pm2 logs iaad-project --lines 15"
echo "  3. Test email: node backend/scripts/testEmail.js $BREVO_USER"
echo ""
