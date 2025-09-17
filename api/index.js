// Vercel serverless function entry point
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Import the main server logic
const express = require('express');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Jimp = require('jimp');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const bodyParser = require('body-parser');
const { db, supabase } = require('../supabase-config');
const { uploadToR2, deleteFromR2, generateUniqueFilename, getMimeType } = require('../r2-config');

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'festival_poster_secret_key_2024';

// Create Express app
const serverApp = express();

// Middleware
serverApp.use(cors());
serverApp.use(bodyParser.json({ limit: '50mb' }));
serverApp.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
serverApp.use(express.static(path.join(__dirname, '../public')));

// Serve uploaded files statically
serverApp.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Multer configuration for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|psd/;
        const allowedMimeTypes = [
            'image/jpeg',
            'image/jpg', 
            'image/png',
            'image/gif',
            'image/vnd.adobe.photoshop'
        ];
        
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedMimeTypes.includes(file.mimetype);
        
        if (mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// Authentication middleware
const authenticateAdmin = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.admin = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

// API Routes
serverApp.post('/api/admin/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const admin = await db.getAdminByUsername(username);
        
        if (!admin || !bcrypt.compareSync(password, admin.password)) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const token = jwt.sign({ id: admin.id, username: admin.username }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, admin: { id: admin.id, username: admin.username } });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

serverApp.get('/api/categories', async (req, res) => {
    try {
        const categories = await db.getAllCategories();
        res.json(categories);
    } catch (error) {
        console.error('Categories error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

serverApp.get('/api/templates', async (req, res) => {
    try {
        const { category_id } = req.query;
        
        let templates;
        if (category_id) {
            templates = await db.getTemplatesByCategory(category_id);
        } else {
            templates = await db.getAllTemplates();
        }
        
        templates.forEach(template => {
            try {
                template.fields = JSON.parse(template.fields);
            } catch (e) {
                template.fields = [];
            }
            template.category_name = template.categories?.name;
        });
        
        res.json(templates);
    } catch (error) {
        console.error('Templates error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Track download endpoint
serverApp.post('/api/track-download', async (req, res) => {
    try {
        const { name, mobile, template_id, template_name, generated_at } = req.body;
        
        console.log('📊 Tracking download:', {
            name,
            mobile,
            template_id,
            template_name,
            generated_at
        });
        
        const { data, error } = await supabase
            .from('downloads')
            .insert([
                {
                    user_name: name,
                    user_mobile: mobile,
                    template_id: template_id,
                    template_name: template_name,
                    downloaded_at: generated_at || new Date().toISOString()
                }
            ]);
        
        if (error) {
            console.error('Database error:', error);
            return res.status(500).json({ error: 'Failed to save download data' });
        }
        
        console.log('✅ Download data saved to database:', data);
        res.json({ success: true, message: 'Download tracked successfully' });
    } catch (error) {
        console.error('Error tracking download:', error);
        res.status(500).json({ error: 'Failed to track download' });
    }
});

// Generate poster endpoint (simplified for serverless)
serverApp.post('/api/generate-poster', upload.fields([
    { name: 'images', maxCount: 10 },
    { name: 'logos', maxCount: 5 }
]), async (req, res) => {
    try {
        const { templateId, textFields } = req.body;
        
        console.log('Request body:', req.body);
        console.log('Template ID:', templateId);
        
        let parsedTextFields = textFields;
        if (typeof textFields === 'string') {
            try {
                parsedTextFields = JSON.parse(textFields);
            } catch (e) {
                console.error('Error parsing textFields:', e);
                parsedTextFields = {};
            }
        }
        
        const templates = await db.getAllTemplates();
        const template = templates.find(t => t.id == templateId);

        if (!template) {
            return res.status(404).json({ error: 'Template not found' });
        }

        const templateFields = JSON.parse(template.fields);
        
        // For serverless, return a simple response instead of processing
        // In production, you might want to use a separate image processing service
        const outputFilename = `poster_${uuidv4()}.jpg`;
        
        res.json({ 
            success: true, 
            download_url: `/uploads/generated/${outputFilename}`,
            posterUrl: `/uploads/generated/${outputFilename}`,
            filename: outputFilename,
            message: 'Poster generation simplified for serverless deployment'
        });
        
    } catch (error) {
        console.error('Error generating poster:', error);
        res.status(500).json({ error: 'Failed to generate poster' });
    }
});

// Serve main page
serverApp.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// Serve admin page
serverApp.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'admin.html'));
});

// Export for Vercel
module.exports = serverApp;