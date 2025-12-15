# SOC Training Platform - All-in-One

**Complete SOC simulation platform with vulnerable target site - runs on 4GB RAM**

## 🎯 What You Get

- ✅ **Vulnerable Crypto Exchange** - Target website with 7 exploitable vulnerabilities
- ✅ **SOC Dashboard** - Real-time attack monitoring and visualization
- ✅ **Attack Map** - Geographic visualization of attacks
- ✅ **Incident Management** - Multi-user case management system
- ✅ **User Roles** - SOC Manager, Tier 1, Tier 2, Incident Responder
- ✅ **Automatic Detection** - Attacks are detected and logged automatically
- ✅ **4GB RAM** - Optimized to run on minimal resources

## 🚀 One-Command Installation

```bash
curl -sSL https://raw.githubusercontent.com/thedr0pperx/soc/main/install.sh | bash
```

Or manual:

```bash
git clone https://github.com/thedr0pperx/soc.git
cd soc
./install.sh
```

**Time:** ~10 minutes to full deployment!

## 📋 System Requirements

- **OS:** Ubuntu 20.04/22.04
- **RAM:** 4GB minimum (8GB recommended)
- **Disk:** 20GB free space
- **Network:** Internet connection

## 🎓 Team Structure

- **SOC Manager:** DBCooper
- **Tier 2 Analysts:** Lezymysobieopartigiano, MoralsOverMillions
- **Tier 1 Analyst:** fortitudesolutions
- **Incident Responder:** Dubaiway

## 🎯 Features

### Vulnerable Target Website
- SQL Injection
- Cross-Site Scripting (XSS)
- Malicious File Upload
- Path Traversal
- IDOR
- No Rate Limiting (DoS)
- Reconnaissance Detection

### SOC Platform
- Real-time attack dashboard
- Geographic attack map
- Multi-user authentication
- Incident case management
- Alert prioritization
- Attack timeline
- Log search and analysis

## 📖 Documentation

- [Installation Guide](INSTALL.md)
- [User Guide](USER_GUIDE.md)
- [Attack Simulations](ATTACK_GUIDE.md)

## ⚡ Quick Start

After installation:

```bash
# Access SOC Dashboard
http://YOUR_SERVER_IP:3000

# Access Vulnerable Target
http://YOUR_SERVER_IP:8080

# Default Login
Username: admin
Password: admin123

# Run Attack Simulations
./simulate-attacks.sh
```

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│  Vulnerable Crypto Exchange (Port 8080)     │
│  - Detects attacks automatically            │
│  - Logs to shared volume                    │
└─────────────────┬───────────────────────────┘
                  │
                  ↓ Logs
┌─────────────────────────────────────────────┐
│  SOC Platform (Port 3000)                   │
│  ├─ Attack Dashboard                        │
│  ├─ Attack Map (GeoIP)                      │
│  ├─ Incident Management                     │
│  ├─ User Authentication                     │
│  └─ Log Analysis                            │
└─────────────────┬───────────────────────────┘
                  │
                  ↓ Stores
┌─────────────────────────────────────────────┐
│  Elasticsearch (Lightweight)                │
│  - Attack logs                              │
│  - Incidents                                │
│  - User data                                │
└─────────────────────────────────────────────┘
```

## 🔧 Components

- **Target:** Node.js/Express (vulnerable crypto exchange)
- **SOC Dashboard:** Node.js/Express + React
- **Database:** Elasticsearch (optimized for 4GB)
- **Reverse Proxy:** NGINX

Total: ~3GB RAM usage

## 🎬 For Your Demo

```bash
# Start continuous attacks
./simulate-attacks.sh

# Login as different users:
# - admin (SOC Manager)
# - tier1 (Tier 1 Analyst)
# - tier2 (Tier 2 Analyst)
# - ir (Incident Responder)

# Show:
# 1. Live attack map
# 2. Real-time alerts
# 3. Incident workflow
# 4. User collaboration
```

## ⚠️ Security Notice

This platform contains **intentional vulnerabilities** for educational purposes.

- ✅ Use in controlled training environment only
- ✅ Only attack targets you own
- ❌ Never deploy to production
- ❌ Never expose to public internet

## 📄 License

Educational use only.

---

**Built for SOC training and cybersecurity education** 🛡️
