const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const { Client } = require('@elastic/elasticsearch');

const app = express();
const PORT = 3000;

// Elasticsearch client
const esClient = new Client({
    node: process.env.ELASTICSEARCH_URL || 'http://elasticsearch:9200'
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
    secret: process.env.SESSION_SECRET || 'soc-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// Users database (in production, use proper database)
const users = {
    'admin': { password: bcrypt.hashSync('admin123', 10), role: 'manager', name: 'DBCooper' },
    'tier1': { password: bcrypt.hashSync('tier1123', 10), role: 'tier1', name: 'fortitudesolutions' },
    'tier2a': { password: bcrypt.hashSync('tier2123', 10), role: 'tier2', name: 'Lezymysobieopartigiano' },
    'tier2b': { password: bcrypt.hashSync('tier2123', 10), role: 'tier2', name: 'MoralsOverMillions' },
    'ir': { password: bcrypt.hashSync('ir123', 10), role: 'ir', name: 'Dubaiway' }
};

// Auth middleware
function requireAuth(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/login.html');
    }
}

// Initialize Elasticsearch indices
async function initElasticsearch() {
    try {
        // Create attacks index
        const attacksExists = await esClient.indices.exists({ index: 'attacks' });
        if (!attacksExists) {
            await esClient.indices.create({
                index: 'attacks',
                body: {
                    mappings: {
                        properties: {
                            timestamp: { type: 'date' },
                            type: { type: 'keyword' },
                            ip: { type: 'ip' },
                            method: { type: 'keyword' },
                            url: { type: 'text' },
                            userAgent: { type: 'text' },
                            details: { type: 'text' },
                            geo: {
                                properties: {
                                    country: { type: 'keyword' },
                                    city: { type: 'keyword' },
                                    ll: { type: 'geo_point' }
                                }
                            }
                        }
                    }
                }
            });
        }

        // Create incidents index
        const incidentsExists = await esClient.indices.exists({ index: 'incidents' });
        if (!incidentsExists) {
            await esClient.indices.create({
                index: 'incidents',
                body: {
                    mappings: {
                        properties: {
                            id: { type: 'keyword' },
                            title: { type: 'text' },
                            description: { type: 'text' },
                            severity: { type: 'keyword' },
                            status: { type: 'keyword' },
                            assignedTo: { type: 'keyword' },
                            createdBy: { type: 'keyword' },
                            createdAt: { type: 'date' },
                            updatedAt: { type: 'date' },
                            notes: { type: 'nested' },
                            relatedAttacks: { type: 'keyword' }
                        }
                    }
                }
            });
        }

        console.log('✓ Elasticsearch indices ready');
    } catch (error) {
        console.error('Error initializing Elasticsearch:', error.message);
    }
}

// Watch attack log file and index to Elasticsearch
function watchAttackLogs() {
    const ATTACK_LOG = '/app/logs/attacks.jsonl';
    let lastPosition = 0;

    setInterval(async () => {
        try {
            if (fs.existsSync(ATTACK_LOG)) {
                const stats = fs.statSync(ATTACK_LOG);
                if (stats.size > lastPosition) {
                    const content = fs.readFileSync(ATTACK_LOG, 'utf8');
                    const lines = content.split('\n').filter(l => l.trim());
                    
                    for (let i = Math.floor(lastPosition / 100); i < lines.length; i++) {
                        try {
                            const attack = JSON.parse(lines[i]);
                            await esClient.index({
                                index: 'attacks',
                                body: attack
                            });
                        } catch (e) {
                            // Skip invalid lines
                        }
                    }
                    
                    lastPosition = stats.size;
                }
            }
        } catch (error) {
            console.error('Error indexing attacks:', error.message);
        }
    }, 5000); // Check every 5 seconds
}

// API Routes

// Login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const user = users[username];

    if (user && await bcrypt.compare(password, user.password)) {
        req.session.user = {
            username,
            role: user.role,
            name: user.name
        };
        res.json({ success: true, user: req.session.user });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

// Logout
app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// Get current user
app.get('/api/user', requireAuth, (req, res) => {
    res.json(req.session.user);
});

// Get recent attacks
app.get('/api/attacks', requireAuth, async (req, res) => {
    try {
        const result = await esClient.search({
            index: 'attacks',
            body: {
                size: 100,
                sort: [{ timestamp: 'desc' }]
            }
        });
        
        const attacks = result.hits.hits.map(hit => ({
            id: hit._id,
            ...hit._source
        }));
        
        res.json(attacks);
    } catch (error) {
        res.json([]);
    }
});

// Get attack statistics
app.get('/api/stats', requireAuth, async (req, res) => {
    try {
        const result = await esClient.search({
            index: 'attacks',
            body: {
                size: 0,
                aggs: {
                    by_type: {
                        terms: { field: 'type', size: 20 }
                    },
                    by_country: {
                        terms: { field: 'geo.country', size: 10 }
                    },
                    timeline: {
                        date_histogram: {
                            field: 'timestamp',
                            fixed_interval: '1h'
                        }
                    }
                }
            }
        });

        res.json({
            total: result.hits.total.value,
            byType: result.aggregations.by_type.buckets,
            byCountry: result.aggregations.by_country.buckets,
            timeline: result.aggregations.timeline.buckets
        });
    } catch (error) {
        res.json({ total: 0, byType: [], byCountry: [], timeline: [] });
    }
});

// Get incidents
app.get('/api/incidents', requireAuth, async (req, res) => {
    try {
        const result = await esClient.search({
            index: 'incidents',
            body: {
                size: 100,
                sort: [{ createdAt: 'desc' }]
            }
        });
        
        const incidents = result.hits.hits.map(hit => ({
            id: hit._id,
            ...hit._source
        }));
        
        res.json(incidents);
    } catch (error) {
        res.json([]);
    }
});

// Create incident
app.post('/api/incidents', requireAuth, async (req, res) => {
    const incident = {
        ...req.body,
        createdBy: req.session.user.username,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        notes: []
    };

    try {
        const result = await esClient.index({
            index: 'incidents',
            body: incident
        });
        
        res.json({ success: true, id: result._id });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update incident
app.put('/api/incidents/:id', requireAuth, async (req, res) => {
    try {
        await esClient.update({
            index: 'incidents',
            id: req.params.id,
            body: {
                doc: {
                    ...req.body,
                    updatedAt: new Date().toISOString()
                }
            }
        });
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Add note to incident
app.post('/api/incidents/:id/notes', requireAuth, async (req, res) => {
    const note = {
        text: req.body.text,
        author: req.session.user.name,
        timestamp: new Date().toISOString()
    };

    try {
        const incident = await esClient.get({
            index: 'incidents',
            id: req.params.id
        });

        const notes = incident._source.notes || [];
        notes.push(note);

        await esClient.update({
            index: 'incidents',
            id: req.params.id,
            body: {
                doc: {
                    notes: notes,
                    updatedAt: new Date().toISOString()
                }
            }
        });
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Serve dashboard
app.get('/', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', async () => {
    console.log(`🛡️  SOC Dashboard running on port ${PORT}`);
    await initElasticsearch();
    watchAttackLogs();
});

