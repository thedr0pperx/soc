# ⚡ Quick Start Guide

## 🚀 Install in 2 Minutes

```bash
curl -sSL https://raw.githubusercontent.com/thedr0pperx/soc/main/install.sh | bash
```

**That's it!** Everything installs automatically.

---

## 🌐 Access After Installation

Visit these URLs (replace with your server IP):

```
SOC Dashboard:     http://YOUR_IP:3000
Vulnerable Target: http://YOUR_IP:8080
```

---

## 🔐 Login

Use any of these accounts:

| Username | Password | Role |
|----------|----------|------|
| `admin` | `admin123` | SOC Manager |
| `tier1` | `tier1123` | Tier 1 Analyst |
| `tier2a` | `tier2123` | Tier 2 Analyst |
| `ir` | `ir123` | Incident Responder |

---

## 🎯 Generate Attacks

```bash
cd attack-simulations
./simulate-attacks.sh
```

Watch attacks appear on the dashboard in real-time!

---

## 📊 What You'll See

- **Live Attack Map** - Geographic visualization
- **Real-time Alerts** - As attacks happen
- **Incident Management** - Create and track incidents
- **Team Collaboration** - Multiple users can work together

---

## 🎓 Training Workflow

1. **Tier 1** (fortitudesolutions):
   - Monitor dashboard
   - Triage alerts
   - Create incidents
   - Escalate to Tier 2

2. **Tier 2** (Lezymysobieopartigiano, MoralsOverMillions):
   - Investigate escalated incidents
   - Analyze attack patterns
   - Add detailed notes
   - Escalate to IR if needed

3. **Incident Responder** (Dubaiway):
   - Execute containment
   - Document remediation
   - Close incidents

4. **SOC Manager** (DBCooper):
   - Review all activity
   - Monitor team performance
   - Generate reports

---

## ✅ System Requirements

- **RAM:** 4GB minimum (runs ~2GB)
- **OS:** Ubuntu 20.04/22.04
- **Disk:** 20GB free space
- **Time:** 10 minute install

---

## 🆘 Troubleshooting

```bash
# Check if services are running
docker ps

# View logs
docker-compose logs -f

# Restart everything
docker-compose restart
```

---

## 📚 Full Documentation

- [README.md](README.md) - Complete overview
- [INSTALL.md](INSTALL.md) - Detailed installation
- [ATTACK_GUIDE.md](ATTACK_GUIDE.md) - Attack scenarios

---

**🛡️ Start Training Now!**

Your complete SOC platform is ready in minutes.

