# SOC Platform - Installation Guide

## ⚡ Quick Install (Recommended)

```bash
curl -sSL https://raw.githubusercontent.com/thedr0pperx/soc/main/install.sh | bash
```

**Time:** ~10 minutes

---

## 📋 System Requirements

- **OS:** Ubuntu 20.04/22.04 (or compatible Linux)
- **RAM:** 4GB minimum, 8GB recommended
- **Disk:** 20GB free space
- **Network:** Internet connection

---

## 🛠️ Manual Installation

### Step 1: Clone Repository

```bash
git clone https://github.com/thedr0pperx/soc.git
cd soc
```

### Step 2: Install Prerequisites

```bash
# Install Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Log out and back in
```

### Step 3: Configure System

```bash
# Set Elasticsearch memory
sudo sysctl -w vm.max_map_count=262144
echo "vm.max_map_count=262144" | sudo tee -a /etc/sysctl.conf
```

### Step 4: Start Platform

```bash
# Build and start all services
docker-compose up -d --build

# Wait 60 seconds for initialization
sleep 60

# Check status
docker-compose ps
```

### Step 5: Configure Firewall

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 3000/tcp
sudo ufw allow 8080/tcp
sudo ufw enable
```

---

## 🌐 Access URLs

After installation:

```
SOC Dashboard:     http://YOUR_SERVER_IP:3000
Vulnerable Target: http://YOUR_SERVER_IP:8080
Portal:            http://YOUR_SERVER_IP
```

---

## 🔐 Default Accounts

| Username | Password  | Role |
|----------|-----------|------|
| admin    | admin123  | SOC Manager |
| tier1    | tier1123  | Tier 1 Analyst |
| tier2a   | tier2123  | Tier 2 Analyst |
| ir       | ir123     | Incident Responder |

---

## ✅ Verify Installation

```bash
# Check all containers are running
docker ps

# Should show 4 containers:
# - crypto-exchange
# - soc-dashboard
# - elasticsearch
# - soc-nginx

# Test SOC Dashboard
curl http://localhost:3000/login.html

# Test Vulnerable Target
curl http://localhost:8080
```

---

## 🎯 Run Attack Simulations

```bash
cd attack-simulations
./simulate-attacks.sh
```

Then login to SOC Dashboard and see attacks appear!

---

## 🆘 Troubleshooting

### Containers won't start
```bash
# Check Docker is running
sudo systemctl status docker

# Check logs
docker-compose logs

# Restart everything
docker-compose down
docker-compose up -d
```

### Elasticsearch fails
```bash
# Check memory setting
sysctl vm.max_map_count
# Should be 262144

# If not:
sudo sysctl -w vm.max_map_count=262144
docker-compose restart elasticsearch
```

### Can't access from browser
```bash
# Check firewall
sudo ufw status

# Open ports
sudo ufw allow 3000/tcp
sudo ufw allow 8080/tcp
```

### Attacks not appearing in dashboard
```bash
# Check if attacks are being logged
docker logs crypto-exchange

# Check if attack log file exists
docker exec crypto-exchange ls -la /app/logs/

# Restart SOC dashboard
docker-compose restart soc-dashboard
```

---

## 🔧 Useful Commands

```bash
# View all logs
docker-compose logs -f

# Restart specific service
docker-compose restart soc-dashboard

# Stop all services
docker-compose down

# Remove everything (including data)
docker-compose down -v

# Check resource usage
docker stats
```

---

## 📊 Resource Usage

Typical usage with 4GB RAM:

- Elasticsearch: ~1.5GB
- SOC Dashboard: ~200MB
- Vulnerable Target: ~100MB
- NGINX: ~10MB

**Total: ~2GB** (leaves 2GB for system)

---

## 🎓 Next Steps

1. Login to SOC Dashboard
2. Run attack simulations
3. Practice incident response workflow
4. Read [USER_GUIDE.md](USER_GUIDE.md) for detailed usage

---

**Need help?** Check the main [README.md](README.md) or review logs with `docker-compose logs`
