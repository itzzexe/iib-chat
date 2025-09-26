# Production Deployment Guide

This guide provides step-by-step instructions for deploying the IIB Chat Application to production with proper security, monitoring, and performance configurations.

## 1. 🗄️ MongoDB Setup with Authentication

### 1.1 Install MongoDB (Ubuntu/Debian)
```bash
# Import MongoDB public GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Update package database and install
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start and enable MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

### 1.2 Configure MongoDB Authentication

#### Step 1: Create Admin User
```bash
# Connect to MongoDB
mongo

# Switch to admin database
use admin

# Create admin user
db.createUser({
  user: "admin",
  pwd: "your-super-secure-admin-password",
  roles: [ { role: "userAdminAnyDatabase", db: "admin" }, "readWriteAnyDatabase" ]
})

# Exit MongoDB shell
exit
```

#### Step 2: Enable Authentication
```bash
# Edit MongoDB configuration
sudo nano /etc/mongod.conf

# Add/modify these lines:
security:
  authorization: enabled

net:
  port: 27017
  bindIp: 127.0.0.1  # Change to 0.0.0.0 for remote access (with firewall)

# Restart MongoDB
sudo systemctl restart mongod
```

#### Step 3: Create Application Database and User
```bash
# Connect with admin credentials
mongo -u admin -p your-super-secure-admin-password --authenticationDatabase admin

# Create application database
use iib-chat

# Create application user
db.createUser({
  user: "iibchat",
  pwd: "your-app-database-password",
  roles: [ { role: "readWrite", db: "iib-chat" } ]
})

# Test connection
db.auth("iibchat", "your-app-database-password")

exit
```

### 1.3 MongoDB Security Hardening

#### Firewall Configuration
```bash
# Allow MongoDB only from application server
sudo ufw allow from YOUR_APP_SERVER_IP to any port 27017

# Or for local access only
sudo ufw allow 27017
```

#### SSL/TLS Configuration (Optional but Recommended)
```bash
# Generate SSL certificates for MongoDB
sudo mkdir -p /etc/ssl/mongodb
sudo openssl req -newkey rsa:2048 -new -x509 -days 3650 -nodes -out /etc/ssl/mongodb/mongodb-cert.crt -keyout /etc/ssl/mongodb/mongodb-cert.key

# Combine certificate and key
sudo cat /etc/ssl/mongodb/mongodb-cert.key /etc/ssl/mongodb/mongodb-cert.crt > /etc/ssl/mongodb/mongodb.pem

# Set permissions
sudo chown mongodb:mongodb /etc/ssl/mongodb/mongodb.pem
sudo chmod 400 /etc/ssl/mongodb/mongodb.pem

# Update MongoDB config
# Add to /etc/mongod.conf:
net:
  ssl:
    mode: requireSSL
    PEMKeyFile: /etc/ssl/mongodb/mongodb.pem
```

---

## 2. 🔐 Environment Variables Configuration

### 2.1 Create Production Environment File
```bash
# Create production environment file
sudo nano /opt/iib-chat/server/.env
```

### 2.2 Complete Environment Configuration
```bash
# ===========================================
# IIB Chat Application - Production Config
# ===========================================

# Environment
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database Configuration
MONGODB_URI=mongodb://iibchat:your-app-database-password@localhost:27017/iib-chat?authSource=iib-chat
# For SSL: mongodb://iibchat:password@localhost:27017/iib-chat?authSource=iib-chat&ssl=true
MONGODB_AUTH_SOURCE=iib-chat
MONGODB_SSL=false

# JWT Security (CRITICAL - Generate secure secret)
JWT_SECRET=your-super-secure-jwt-secret-minimum-64-characters-long-random-string-here

# CORS Configuration
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=/opt/iib-chat/uploads

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Security
SESSION_SECRET=your-session-secret-key-here-also-64-characters-minimum
ENCRYPTION_KEY=your-encryption-key-here-32-characters-for-aes256

# Logging
LOG_LEVEL=info
LOG_FILE=/var/log/iib-chat/app.log

# Email Configuration (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Admin Configuration
DEFAULT_ADMIN_EMAIL=admin@yourcompany.com
DEFAULT_ADMIN_PASSWORD=change-this-secure-password

# Security Headers
HSTS_MAX_AGE=31536000
CSP_REPORT_URI=https://yourdomain.com/csp-report

# Monitoring
MONITORING_ENABLED=true
METRICS_PORT=9090

# Backup Configuration
BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 2 * * *
BACKUP_RETENTION_DAYS=30
```

### 2.3 Generate Secure Secrets
```bash
# Generate JWT Secret (64+ characters)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate Session Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate Encryption Key (32 bytes for AES-256)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2.4 Secure Environment File
```bash
# Set proper permissions
sudo chown iibchat:iibchat /opt/iib-chat/server/.env
sudo chmod 600 /opt/iib-chat/server/.env

# Verify no one else can read
ls -la /opt/iib-chat/server/.env
```

---

## 3. 🔒 HTTPS/SSL Certificate Setup

### 3.1 Using Let's Encrypt (Recommended)

#### Install Certbot
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install certbot python3-certbot-nginx

# CentOS/RHEL
sudo yum install certbot python3-certbot-nginx
```

#### Obtain SSL Certificate
```bash
# For Nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# For Apache
sudo certbot --apache -d yourdomain.com -d www.yourdomain.com

# Manual certificate (if not using web server)
sudo certbot certonly --standalone -d yourdomain.com
```

### 3.2 Nginx Configuration
```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/iib-chat
```

```nginx
# IIB Chat Application - Nginx Configuration
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/yourdomain.com/chain.pem;

    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_stapling on;
    ssl_stapling_verify on;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Frontend (React App)
    location / {
        root /opt/iib-chat/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket Support (Socket.IO)
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # File Uploads
    location /uploads {
        proxy_pass http://localhost:3000;
        client_max_body_size 10M;
    }

    # Health Check
    location /health {
        proxy_pass http://localhost:3000/api/health;
        access_log off;
    }
}
```

#### Enable Nginx Configuration
```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/iib-chat /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### 3.3 Auto-Renewal Setup
```bash
# Test auto-renewal
sudo certbot renew --dry-run

# Add to crontab for automatic renewal
sudo crontab -e

# Add this line:
0 12 * * * /usr/bin/certbot renew --quiet && systemctl reload nginx
```

---

## 4. 📊 Monitoring and Log Rotation

### 4.1 Application Monitoring Setup

#### Install PM2 for Process Management
```bash
# Install PM2 globally
npm install -g pm2

# Create PM2 ecosystem file
nano /opt/iib-chat/ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'iib-chat-backend',
    script: './server/index.js',
    cwd: '/opt/iib-chat',
    instances: 'max', // Use all CPU cores
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/iib-chat/pm2-error.log',
    out_file: '/var/log/iib-chat/pm2-out.log',
    log_file: '/var/log/iib-chat/pm2-combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024',
    
    // Monitoring
    monitoring: true,
    
    // Auto-restart on file changes (disable in production)
    watch: false,
    
    // Graceful shutdown
    kill_timeout: 5000,
    
    // Health check
    health_check_url: 'http://localhost:3000/api/health',
    health_check_grace_period: 3000
  }]
};
```

#### Start Application with PM2
```bash
# Start application
cd /opt/iib-chat
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u iibchat --hp /home/iibchat
```

### 4.2 System Monitoring with Prometheus & Grafana

#### Install Prometheus
```bash
# Create prometheus user
sudo useradd --no-create-home --shell /bin/false prometheus

# Create directories
sudo mkdir /etc/prometheus
sudo mkdir /var/lib/prometheus
sudo chown prometheus:prometheus /etc/prometheus
sudo chown prometheus:prometheus /var/lib/prometheus

# Download and install Prometheus
cd /tmp
wget https://github.com/prometheus/prometheus/releases/download/v2.40.0/prometheus-2.40.0.linux-amd64.tar.gz
tar xvf prometheus-2.40.0.linux-amd64.tar.gz
sudo cp prometheus-2.40.0.linux-amd64/prometheus /usr/local/bin/
sudo cp prometheus-2.40.0.linux-amd64/promtool /usr/local/bin/
sudo chown prometheus:prometheus /usr/local/bin/prometheus
sudo chown prometheus:prometheus /usr/local/bin/promtool
```

#### Configure Prometheus
```bash
# Create Prometheus configuration
sudo nano /etc/prometheus/prometheus.yml
```

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "rules/*.yml"

scrape_configs:
  - job_name: 'iib-chat-app'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/api/metrics'
    scrape_interval: 30s

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['localhost:9100']

  - job_name: 'mongodb-exporter'
    static_configs:
      - targets: ['localhost:9216']

  - job_name: 'nginx-exporter'
    static_configs:
      - targets: ['localhost:9113']
```

### 4.3 Log Rotation Configuration

#### Setup Logrotate for Application Logs
```bash
# Create logrotate configuration
sudo nano /etc/logrotate.d/iib-chat
```

```bash
/var/log/iib-chat/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 iibchat iibchat
    postrotate
        # Reload PM2 to reopen log files
        /usr/bin/pm2 reloadLogs
    endscript
}

/var/log/iib-chat/pm2-*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 644 iibchat iibchat
    copytruncate
}
```

#### Setup Log Directory
```bash
# Create log directory
sudo mkdir -p /var/log/iib-chat
sudo chown iibchat:iibchat /var/log/iib-chat
sudo chmod 755 /var/log/iib-chat

# Test logrotate
sudo logrotate -d /etc/logrotate.d/iib-chat
```

### 4.4 System Monitoring Scripts

#### Health Check Script
```bash
# Create health check script
sudo nano /opt/iib-chat/scripts/health-check.sh
```

```bash
#!/bin/bash

# IIB Chat Health Check Script
LOG_FILE="/var/log/iib-chat/health-check.log"
APP_URL="http://localhost:3000/api/health"
MAX_RESPONSE_TIME=5

log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

# Check application health
response=$(curl -s -w "%{http_code}:%{time_total}" -o /dev/null "$APP_URL" --max-time $MAX_RESPONSE_TIME)
http_code=$(echo $response | cut -d':' -f1)
response_time=$(echo $response | cut -d':' -f2)

if [ "$http_code" = "200" ]; then
    log_message "✅ Application healthy - Response time: ${response_time}s"
else
    log_message "❌ Application unhealthy - HTTP Code: $http_code"
    
    # Restart application if unhealthy
    log_message "🔄 Restarting application..."
    pm2 restart iib-chat-backend
    
    # Send alert (configure your notification method)
    # curl -X POST "https://hooks.slack.com/your-webhook" -d '{"text":"IIB Chat application is down and has been restarted"}'
fi

# Check disk space
disk_usage=$(df /opt/iib-chat | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$disk_usage" -gt 80 ]; then
    log_message "⚠️ Disk usage high: ${disk_usage}%"
fi

# Check memory usage
mem_usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
if [ "$mem_usage" -gt 80 ]; then
    log_message "⚠️ Memory usage high: ${mem_usage}%"
fi
```

#### Make Script Executable and Schedule
```bash
# Make executable
sudo chmod +x /opt/iib-chat/scripts/health-check.sh

# Add to crontab (run every 5 minutes)
sudo crontab -e

# Add this line:
*/5 * * * * /opt/iib-chat/scripts/health-check.sh
```

### 4.5 Backup Script
```bash
# Create backup script
sudo nano /opt/iib-chat/scripts/backup.sh
```

```bash
#!/bin/bash

# IIB Chat Backup Script
BACKUP_DIR="/opt/backups/iib-chat"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup MongoDB
mongodump --host localhost --port 27017 --db iib-chat --username iibchat --password your-app-database-password --authenticationDatabase iib-chat --out "$BACKUP_DIR/mongodb_$DATE"

# Backup uploaded files
tar -czf "$BACKUP_DIR/uploads_$DATE.tar.gz" /opt/iib-chat/uploads/

# Backup configuration
tar -czf "$BACKUP_DIR/config_$DATE.tar.gz" /opt/iib-chat/server/.env /etc/nginx/sites-available/iib-chat

# Remove old backups
find "$BACKUP_DIR" -type f -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -type d -empty -delete

echo "Backup completed: $DATE"
```

```bash
# Make executable and schedule
sudo chmod +x /opt/iib-chat/scripts/backup.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e

# Add this line:
0 2 * * * /opt/iib-chat/scripts/backup.sh >> /var/log/iib-chat/backup.log 2>&1
```

---

## 🚀 Final Deployment Steps

### 1. Build Frontend for Production
```bash
cd /opt/iib-chat
npm run build
```

### 2. Start Services
```bash
# Start MongoDB
sudo systemctl start mongod

# Start Nginx
sudo systemctl start nginx

# Start application with PM2
pm2 start ecosystem.config.js
```

### 3. Verify Deployment
```bash
# Check application health
curl https://yourdomain.com/api/health

# Check PM2 status
pm2 status

# Check logs
pm2 logs
tail -f /var/log/iib-chat/app.log
```

### 4. Security Checklist
- [ ] MongoDB authentication enabled
- [ ] Strong passwords and JWT secrets set
- [ ] SSL certificates installed and auto-renewal configured
- [ ] Firewall configured (only necessary ports open)
- [ ] Log rotation configured
- [ ] Monitoring and health checks active
- [ ] Backup system operational
- [ ] Security headers configured
- [ ] File upload restrictions in place

---

## 📞 Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   ```bash
   # Check MongoDB status
   sudo systemctl status mongod
   
   # Check MongoDB logs
   sudo tail -f /var/log/mongodb/mongod.log
   ```

2. **SSL Certificate Issues**
   ```bash
   # Test SSL certificate
   sudo certbot certificates
   
   # Renew certificate
   sudo certbot renew
   ```

3. **Application Not Starting**
   ```bash
   # Check PM2 logs
   pm2 logs iib-chat-backend
   
   # Check application logs
   tail -f /var/log/iib-chat/app.log
   ```

4. **High Memory Usage**
   ```bash
   # Monitor memory
   pm2 monit
   
   # Restart application
   pm2 restart iib-chat-backend
   ```

This completes the production deployment setup for your IIB Chat Application with enterprise-grade security, monitoring, and reliability features.