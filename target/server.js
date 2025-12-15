const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const geoip = require('geoip-lite');

const app = express();
const PORT = 8080;

// Shared log directory with SOC dashboard
const LOG_DIR = '/app/logs';
const ATTACK_LOG = path.join(LOG_DIR, 'attacks.jsonl');

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Multer storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

// Request tracking for DoS detection
let requestCounts = {};
setInterval(() => { requestCounts = {}; }, 60000);

// Log attack function
function logAttack(type, req, details = '') {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.ip;
    const cleanIp = ip.replace('::ffff:', '');
    const geo = geoip.lookup(cleanIp) || {};
    
    const attackLog = {
        timestamp: new Date().toISOString(),
        type: type,
        ip: cleanIp,
        method: req.method,
        url: req.url,
        userAgent: req.get('user-agent') || 'Unknown',
        details: details,
        geo: {
            country: geo.country || 'Unknown',
            city: geo.city || 'Unknown',
            ll: geo.ll || [0, 0]
        }
    };
    
    // Append to JSONL file
    fs.appendFileSync(ATTACK_LOG, JSON.stringify(attackLog) + '\n');
    console.log(`[ATTACK] ${type} from ${cleanIp}`);
}

// Access logger
app.use((req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.ip;
    const cleanIp = ip.replace('::ffff:', '');
    
    // DoS detection
    requestCounts[cleanIp] = (requestCounts[cleanIp] || 0) + 1;
    if (requestCounts[cleanIp] > 100) {
        logAttack('DOS_ATTACK', req, `${requestCounts[cleanIp]} requests in 60 seconds`);
    }
    
    next();
});

// Home page
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Mini Crypto Exchange</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .container {
                    background: white;
                    padding: 40px;
                    border-radius: 15px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                    max-width: 500px;
                    width: 90%;
                }
                h1 { color: #333; text-align: center; margin-bottom: 30px; }
                .prices {
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 10px;
                    margin-bottom: 30px;
                    text-align: center;
                }
                .price { font-size: 24px; color: #4CAF50; font-weight: bold; margin: 10px 0; }
                form { display: flex; flex-direction: column; gap: 15px; }
                input {
                    padding: 12px;
                    border: 2px solid #ddd;
                    border-radius: 5px;
                    font-size: 16px;
                }
                button {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 12px;
                    border: none;
                    border-radius: 5px;
                    font-size: 18px;
                    cursor: pointer;
                }
                .links { margin-top: 20px; text-align: center; }
                .links a { color: #667eea; text-decoration: none; margin: 0 10px; }
                .warning {
                    background: #fff3cd;
                    padding: 10px;
                    border-radius: 5px;
                    margin-top: 20px;
                    font-size: 12px;
                    color: #856404;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🪙 Mini Crypto Exchange</h1>
                <div class="prices">
                    <div class="price">BTC: $65,000</div>
                    <div class="price">ETH: $4,000</div>
                </div>
                <form action="/login" method="POST">
                    <input type="text" name="username" placeholder="Username" required>
                    <input type="password" name="password" placeholder="Password" required>
                    <button type="submit">Login</button>
                </form>
                <div class="links">
                    <a href="/api/user/1">View Profile</a>
                    <a href="/download?file=statement.pdf">Download Statement</a>
                </div>
                <div class="warning">
                    ⚠️ Training Platform - Intentionally Vulnerable
                </div>
            </div>
        </body>
        </html>
    `);
});

// 1. SQL Injection
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    // Detect SQL injection attempts
    const sqliPatterns = ["'", '"', 'OR 1=1', 'UNION SELECT', 'DROP TABLE', '--', '/*', 'admin\'--'];
    if (username && sqliPatterns.some(pattern => username.toUpperCase().includes(pattern.toUpperCase()))) {
        logAttack('SQL_INJECTION', req, `Username: ${username}`);
    }
    
    res.send(`
        <h1>Welcome, ${username}!</h1>
        <p>Balance: 0.00 BTC</p>
        <p><a href="/settings?name=${username}">Settings</a></p>
        <p><a href="/">Back</a></p>
    `);
});

// 2. XSS
app.get('/settings', (req, res) => {
    const name = req.query.name || 'Guest';
    
    // Detect XSS attempts
    if (name.toLowerCase().includes('<script>') || name.toLowerCase().includes('javascript:') || name.toLowerCase().includes('onerror')) {
        logAttack('XSS_ATTEMPT', req, `Payload: ${name}`);
    }
    
    res.send(`
        <h1>Settings for ${name}</h1>
        <form action="/upload" method="POST" enctype="multipart/form-data">
            <input type="file" name="avatar">
            <button type="submit">Upload Avatar</button>
        </form>
        <p><a href="/">Back</a></p>
    `);
});

// 3. File Upload
app.post('/upload', upload.single('avatar'), (req, res) => {
    if (req.file) {
        const filename = req.file.originalname;
        const dangerousExts = ['.php', '.exe', '.sh', '.bat', '.jsp', '.asp'];
        
        if (dangerousExts.some(ext => filename.toLowerCase().endsWith(ext))) {
            logAttack('MALICIOUS_FILE_UPLOAD', req, `File: ${filename}`);
        }
        
        res.send(`<h1>File uploaded: ${filename}</h1><p><a href="/">Back</a></p>`);
    } else {
        res.send('<h1>Upload failed</h1><p><a href="/">Back</a></p>');
    }
});

// 4. Path Traversal
app.get('/download', (req, res) => {
    const file = req.query.file;
    
    if (file && (file.includes('..') || file.includes('/etc/') || file.includes('passwd'))) {
        logAttack('PATH_TRAVERSAL', req, `Attempted file: ${file}`);
    }
    
    res.send(`<h1>Download: ${file}</h1><p><a href="/">Back</a></p>`);
});

// 5. IDOR
app.get('/api/user/:id', (req, res) => {
    const userId = req.params.id;
    
    if (parseInt(userId) > 1000) {
        logAttack('IDOR_ENUMERATION', req, `User ID: ${userId}`);
    }
    
    res.json({
        id: userId,
        username: `user${userId}`,
        balance: '1.5 BTC'
    });
});

// 6. Scanning detection
const suspiciousPaths = ['/admin', '/.git', '/.env', '/config', '/backup', '/phpinfo.php'];
app.use((req, res, next) => {
    if (suspiciousPaths.some(path => req.path.includes(path))) {
        logAttack('RECONNAISSANCE_SCAN', req, `Path: ${req.path}`);
    }
    next();
});

// 404 handler
app.use((req, res) => {
    logAttack('404_SCAN', req, `Path: ${req.path}`);
    res.status(404).send('<h1>404 Not Found</h1><p><a href="/">Home</a></p>');
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🎯 Vulnerable Crypto Exchange running on port ${PORT}`);
    console.log(`📝 Attack logs: ${ATTACK_LOG}`);
});

