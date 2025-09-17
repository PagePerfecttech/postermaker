const express = require('express');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const bodyParser = require('body-parser');
const { db, supabase } = require('./supabase-config');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'festival_poster_secret_key_2024';

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static('public'));

// Serve uploaded files statically (disabled for Vercel serverless)
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Create local uploads directory for temporary files (generated posters)
// Skip directory creation in Vercel serverless environment (read-only filesystem)
if (process.env.NODE_ENV !== 'production' && process.env.VERCEL !== '1') {
    if (!fs.existsSync('uploads')) {
        fs.mkdirSync('uploads');
    }
    if (!fs.existsSync('uploads/generated')) {
        fs.mkdirSync('uploads/generated');
    }
}

// Multer configuration for memory storage (files will be uploaded to R2)
const storage = multer.memoryStorage();

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    fileFilter: (req, file, cb) => {
        console.log('File validation - Original name:', file.originalname);
        console.log('File validation - MIME type:', file.mimetype);
        console.log('File validation - Extension:', path.extname(file.originalname).toLowerCase());
        
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
        
        console.log('Extension test result:', extname);
        console.log('MIME type test result:', mimetype);
        
        // Accept file if MIME type is valid (extension is optional)
        if (mimetype) {
            console.log('File accepted based on MIME type');
            return cb(null, true);
        } else {
            console.log('File rejected - invalid MIME type');
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

// Routes

// Admin login
app.post('/api/admin/login', async (req, res) => {
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

// Get all categories
app.get('/api/categories', async (req, res) => {
    try {
        const categories = await db.getAllCategories();
        res.json(categories);
    } catch (error) {
        console.error('Categories error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Create category (admin only)
app.post('/api/categories', authenticateAdmin, async (req, res) => {
    try {
        const { name, description } = req.body;
        
        const category = await db.createCategory(name, description);
        res.json(category);
    } catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Get templates by category
app.get('/api/templates', async (req, res) => {
    try {
        const { category_id } = req.query;
        
        let templates;
        if (category_id) {
            templates = await db.getTemplatesByCategory(category_id);
        } else {
            templates = await db.getAllTemplates();
        }
        
        // Parse fields JSON for each template and format response
        templates.forEach(template => {
            try {
                template.fields = JSON.parse(template.fields);
            } catch (e) {
                template.fields = [];
            }
            // Add category_name for backward compatibility
            template.category_name = template.categories?.name;
        });
        
        res.json(templates);
    } catch (error) {
        console.error('Templates error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Upload template (admin only) - simplified for Vercel
app.post('/api/templates', authenticateAdmin, upload.single('template'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        const { name, category_id, fields } = req.body;
        
        // For Vercel, use a placeholder URL
        const placeholderUrl = 'https://via.placeholder.com/800x600/cccccc/666666?text=Template+Image';
        
        const template = await db.createTemplate(
            name,
            category_id,
            placeholderUrl,
            JSON.parse(fields)
        );
        
        res.json({ 
            id: template.id, 
            name: template.name, 
            category_id: template.category_id, 
            image_path: template.image_path,
            fields: JSON.parse(template.fields)
        });
    } catch (error) {
        console.error('Upload template error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Get individual template (admin only)
app.get('/api/admin/templates/:id', authenticateAdmin, async (req, res) => {
    try {
        const templateId = req.params.id;
        
        const templates = await db.getAllTemplates();
        const template = templates.find(t => t.id == templateId);
        
        if (!template) {
            return res.status(404).json({ error: 'Template not found' });
        }
        
        // Parse fields JSON
        try {
            template.fields = JSON.parse(template.fields);
        } catch (e) {
            template.fields = [];
        }
        
        // Add category_name for backward compatibility
        template.category_name = template.categories?.name;
        
        res.json(template);
    } catch (error) {
        console.error('Get template error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Delete template (admin only) - simplified for Vercel
app.delete('/api/admin/templates/:id', authenticateAdmin, async (req, res) => {
    try {
        const templateId = req.params.id;
        
        // Delete the template from database
        await db.deleteTemplate(templateId);
        
        res.json({ success: true, message: 'Template deleted successfully' });
    } catch (error) {
        console.error('Delete template error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Update template (admin only) - simplified for Vercel
app.put('/api/admin/templates/:id', authenticateAdmin, upload.single('template'), async (req, res) => {
    try {
        const templateId = req.params.id;
        const { name, category_id, fields } = req.body;
        
        let imagePath = null;
        
        // If a new file is uploaded, use placeholder
        if (req.file) {
            imagePath = 'https://via.placeholder.com/800x600/cccccc/666666?text=Updated+Template';
        }
        
        const template = await db.updateTemplate(templateId, {
            name,
            category_id,
            image_path: imagePath,
            fields: JSON.parse(fields)
        });
        
        // Parse fields JSON for response
        try {
            template.fields = JSON.parse(template.fields);
        } catch (e) {
            template.fields = [];
        }
        
        res.json(template);
    } catch (error) {
        console.error('Update template error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Record download endpoint
app.post('/api/record-download', async (req, res) => {
    try {
        const { template_id, user_name, user_mobile } = req.body;
        
        if (!template_id || !user_name || !user_mobile) {
            return res.status(400).json({ error: 'Missing required fields: template_id, user_name, user_mobile' });
        }
        
        const download = await db.createDownload(template_id, user_name, user_mobile, null);
        res.json({ success: true, download });
    } catch (error) {
        console.error('Error recording download:', error);
        res.status(500).json({ error: 'Failed to record download' });
    }
});

// Get downloads for admin panel
app.get('/api/admin/downloads', authenticateAdmin, async (req, res) => {
    try {
        const downloads = await db.getAllDownloads();
        res.json(downloads);
    } catch (error) {
        console.error('Error fetching downloads:', error);
        res.status(500).json({ error: 'Failed to fetch downloads' });
    }
});

// Generate poster endpoint (simplified for Vercel)
app.post('/api/generate-poster', upload.fields([
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
        
        // Get template data using Supabase
        const templates = await db.getAllTemplates();
        const template = templates.find(t => t.id == templateId);

        if (!template) {
            return res.status(404).json({ error: 'Template not found' });
        }

        // For Vercel serverless, return a simplified response
        // In production, you might want to use a separate image processing service
        const outputFilename = `poster_${uuidv4()}.jpg`;
        
        res.json({ 
            success: true, 
            download_url: `https://via.placeholder.com/800x600/6366f1/ffffff?text=Generated+Poster`,
            posterUrl: `https://via.placeholder.com/800x600/6366f1/ffffff?text=Generated+Poster`,
            filename: outputFilename,
            message: 'Poster generation simplified for serverless deployment - using placeholder image',
            template: template
        });
        
    } catch (error) {
        console.error('Error generating poster:', error);
        res.status(500).json({ error: 'Failed to generate poster' });
    }
});

// Track download endpoint
app.post('/api/track-download', async (req, res) => {
    try {
        const { name, mobile, template_id, template_name, generated_at } = req.body;
        
        console.log('📊 Tracking download:', {
            name,
            mobile,
            template_id,
            template_name,
            generated_at
        });
        
        // Save download tracking to database
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

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve admin page
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Start server
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Festival Poster Maker server running on http://localhost:${PORT}`);
        console.log(`Admin panel available at http://localhost:${PORT}/admin`);
        console.log('Default admin credentials: username=admin, password=admin123');
    });
}

// Export for Vercel
module.exports = app;