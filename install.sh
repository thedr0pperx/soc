#!/bin/bash

set -e

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║        SOC Training Platform - Automated Installer           ║"
echo "║           Complete Security Operations Center                 ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Check if running as root or with sudo
if [ "$EUID" -eq 0 ]; then 
    echo "⚠️  Please run as regular user (script will use sudo when needed)"
    exit 1
fi

echo "📋 System Requirements Check..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check RAM
TOTAL_RAM=$(free -g | awk '/^Mem:/{print $2}')
if [ "$TOTAL_RAM" -lt 4 ]; then
    echo "❌ Insufficient RAM: ${TOTAL_RAM}GB (minimum 4GB required)"
    exit 1
fi
echo "✓ RAM: ${TOTAL_RAM}GB"

# Check disk space
FREE_SPACE=$(df -BG / | awk 'NR==2 {print $4}' | sed 's/G//')
if [ "$FREE_SPACE" -lt 20 ]; then
    echo "❌ Insufficient disk space: ${FREE_SPACE}GB (minimum 20GB required)"
    exit 1
fi
echo "✓ Disk Space: ${FREE_SPACE}GB free"

echo ""
echo "📦 Installing Prerequisites..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Update system
echo "→ Updating package lists..."
sudo apt update -qq

# Install Docker
if ! command -v docker &> /dev/null; then
    echo "→ Installing Docker..."
    curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
    sudo sh /tmp/get-docker.sh
    sudo usermod -aG docker $USER
    rm /tmp/get-docker.sh
    echo "✓ Docker installed"
else
    echo "✓ Docker already installed"
fi

# Install Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "→ Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" \
        -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "✓ Docker Compose installed"
else
    echo "✓ Docker Compose already installed"
fi

# Check if user is in docker group
if ! groups | grep -q docker; then
    echo ""
    echo "⚠️  User added to docker group. Please log out and back in, then run this script again."
    exit 0
fi

echo ""
echo "⚙️  Configuring System..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Configure Elasticsearch memory
echo "→ Configuring Elasticsearch memory settings..."
sudo sysctl -w vm.max_map_count=262144
if ! grep -q "vm.max_map_count=262144" /etc/sysctl.conf; then
    echo "vm.max_map_count=262144" | sudo tee -a /etc/sysctl.conf
fi
echo "✓ Memory settings configured"

echo ""
echo "🚀 Starting SOC Platform..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Start services
echo "→ Building and starting containers..."
docker-compose up -d --build

echo ""
echo "⏳ Waiting for services to initialize (60 seconds)..."
sleep 60

# Check service status
echo ""
echo "📊 Service Status:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker-compose ps

# Get server IP
SERVER_IP=$(hostname -I | awk '{print $1}')

echo ""
echo "🔥 Configure Firewall..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if command -v ufw &> /dev/null; then
    echo "→ Opening ports..."
    sudo ufw allow 22/tcp
    sudo ufw allow 80/tcp
    sudo ufw allow 3000/tcp
    sudo ufw allow 8080/tcp
    sudo ufw --force enable
    echo "✓ Firewall configured"
else
    echo "ℹ️  UFW not installed, skipping firewall configuration"
fi

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                  ✅ INSTALLATION COMPLETE!                    ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "🌐 Access URLs:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  SOC Dashboard:        http://$SERVER_IP:3000"
echo "  Vulnerable Target:    http://$SERVER_IP:8080"
echo "  Portal (NGINX):       http://$SERVER_IP"
echo ""
echo "🔐 Default Logins:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  SOC Manager:     admin / admin123"
echo "  Tier 1 Analyst:  tier1 / tier1123"
echo "  Tier 2 Analyst:  tier2a / tier2123"
echo "  Inc. Responder:  ir / ir123"
echo ""
echo "🎯 Next Steps:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  1. Access SOC Dashboard at http://$SERVER_IP:3000"
echo "  2. Login with any user above"
echo "  3. Run attack simulations:"
echo "     cd attack-simulations"
echo "     ./simulate-attacks.sh"
echo ""
echo "📚 Documentation:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  README.md - Complete overview"
echo "  INSTALL.md - Detailed installation guide"
echo "  USER_GUIDE.md - How to use the SOC platform"
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║         🛡️  Your SOC Platform is Ready! 🛡️                  ║"
echo "╚══════════════════════════════════════════════════════════════╝"

