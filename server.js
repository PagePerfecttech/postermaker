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
const { uploadToR2, deleteFromR2, generateUniqueFilename, getMimeType } = require('./r2-config');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'festival_poster_secret_key_2024';

// Middleware
app.use(cors());

// Content Security Policy middleware
app.use((req, res, next) => {
    res.setHeader('Content-Security-Policy', 
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com https://kit.fontawesome.com; " +
        "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; " +
        "font-src 'self' https://cdnjs.cloudflare.com https://kit.fontawesome.com; " +
        "img-src 'self' data: https: blob:; " +
        "connect-src 'self' https://*.supabase.co https://*.cloudflarestorage.com; " +
        "object-src 'none'; " +
        "base-uri 'self';"
    );
    next();
});

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files with proper MIME types
app.use(express.static('public', {
    setHeaders: (res, path) => {
        if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        } else if (path.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        } else if (path.endsWith('.html')) {
            res.setHeader('Content-Type', 'text/html');
        }
    }
}));

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

// Admin login (disabled - no auth required)
app.post('/api/admin/login', async (req, res) => {
    res.json({ 
        message: 'Admin authentication disabled', 
        token: 'no-auth-required',
        admin: { id: '1', username: 'admin' }
    });
});

// Get all categories
app.get('/api/categories', async (req, res) => {
    try {
        console.log('📡 Categories API called');
        const categories = await db.getAllCategories();
        console.log('📊 Categories from database:', categories.length, categories);
        res.json(categories);
    } catch (error) {
        console.error('❌ Categories error:', error);
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
        
        console.log('📡 Templates API called with category_id:', category_id);
        
        let templates;
        if (category_id) {
            templates = await db.getTemplatesByCategory(category_id);
        } else {
            templates = await db.getAllTemplates();
        }
        
        console.log('📊 Raw templates from database:', templates.length, templates);
        
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
        
        console.log('✅ Processed templates:', templates.length, templates);
        res.json(templates);
    } catch (error) {
        console.error('❌ Templates error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Upload template (no auth required)
app.post('/api/templates', upload.single('template'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        const { name, category_id, fields } = req.body;
        
        let imagePath;
        
        // Upload to R2 if credentials are available
        if (process.env.R2_ENDPOINT && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY) {
        const uniqueFilename = generateUniqueFilename(req.file.originalname, 'templates/');
        const mimeType = getMimeType(req.file.originalname);
            imagePath = await uploadToR2(uniqueFilename, req.file.buffer, mimeType);
        } else {
            // Fallback to placeholder if R2 not configured
            imagePath = 'https://via.placeholder.com/800x600/cccccc/666666?text=Template+Image';
        }
        
        const template = await db.createTemplate(
            name,
            category_id,
            imagePath,
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

// Get individual template (no auth required)
app.get('/api/admin/templates/:id', async (req, res) => {
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

// Delete template (no auth required)
app.delete('/api/admin/templates/:id', async (req, res) => {
    try {
        const templateId = req.params.id;
        
        // First get the template to find the image path
        const templates = await db.getAllTemplates();
        const template = templates.find(t => t.id == templateId);
        
        if (!template) {
            return res.status(404).json({ error: 'Template not found' });
        }
        
        // Delete the template from database
        await db.deleteTemplate(templateId);
        
        // Delete the image file from R2 if it exists and R2 is configured
        if (template.image_path && process.env.R2_ENDPOINT && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY) {
            try {
                // Extract the R2 key from the full URL
                const r2Key = template.image_path.replace(process.env.R2_PUBLIC_URL + '/', '');
                await deleteFromR2(r2Key);
                console.log('Template file deleted from R2:', r2Key);
            } catch (error) {
                console.log('Could not delete template file from R2:', error.message);
            }
        }
        
        res.json({ success: true, message: 'Template deleted successfully' });
    } catch (error) {
        console.error('Delete template error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Update template (no auth required)
app.put('/api/admin/templates/:id', upload.single('template'), async (req, res) => {
    try {
        const templateId = req.params.id;
        const { name, category_id, fields } = req.body;
        
        let imagePath = null;
        
        // If a new file is uploaded, upload it to R2
        if (req.file) {
            // Get the old template to delete the old image from R2
            const templates = await db.getAllTemplates();
            const oldTemplate = templates.find(t => t.id == templateId);
            
            // Upload new file to R2 if configured
            if (process.env.R2_ENDPOINT && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY) {
                const uniqueFilename = generateUniqueFilename(req.file.originalname, 'templates/');
                const mimeType = getMimeType(req.file.originalname);
                imagePath = await uploadToR2(uniqueFilename, req.file.buffer, mimeType);
                
                // Delete old file from R2 if it exists
                if (oldTemplate && oldTemplate.image_path) {
                    try {
                        const oldR2Key = oldTemplate.image_path.replace(process.env.R2_PUBLIC_URL + '/', '');
                        await deleteFromR2(oldR2Key);
                        console.log('Old template file deleted from R2:', oldR2Key);
                    } catch (error) {
                        console.log('Could not delete old template file from R2:', error.message);
                    }
                }
            } else {
                // Fallback to placeholder if R2 not configured
                imagePath = 'https://via.placeholder.com/800x600/cccccc/666666?text=Updated+Template';
            }
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

// Get downloads for admin panel (no auth required)
app.get('/api/admin/downloads', async (req, res) => {
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

        // Generate poster and upload to R2
        const outputFilename = `poster_${uuidv4()}.jpg`;
        
        let posterUrl;
        if (process.env.R2_ENDPOINT && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY) {
            // Create a proper poster with template background and user content
            const templateFields = JSON.parse(template.fields);
            let svgContent = `
                <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
                    <!-- Template background -->
                    <rect width="800" height="600" fill="#f8fafc"/>
                    <rect x="50" y="50" width="700" height="500" fill="white" stroke="#e2e8f0" stroke-width="2" rx="10"/>
                    
                    <!-- Template name -->
                    <text x="400" y="100" text-anchor="middle" fill="#1e293b" font-size="32" font-family="Arial, sans-serif" font-weight="bold">
                        ${template.name}
                    </text>
                    
                    <!-- User content -->
                    <g transform="translate(100, 150)">
            `;
            
            // Add user text fields
            templateFields.forEach((field, index) => {
                if (field.type === 'text' && parsedTextFields && parsedTextFields[field.id]) {
                    const text = parsedTextFields[field.id];
                    const x = (field.x / 100) * 600; // Scale to poster width
                    const y = (field.y / 100) * 300; // Scale to poster height
                    const fontSize = (field.fontSize || 24) * 0.8; // Scale font size
                    
                    svgContent += `
                        <text x="${x}" y="${y}" fill="${field.color || '#1e293b'}" 
                              font-size="${fontSize}" font-family="Arial, sans-serif" 
                              font-weight="bold" text-anchor="left">
                            ${text}
                        </text>
                    `;
                }
            });
            
            svgContent += `
                    </g>
                    
                    <!-- Generated info -->
                    <text x="400" y="550" text-anchor="middle" fill="#64748b" font-size="16" font-family="Arial, sans-serif">
                        Generated Poster - ${new Date().toLocaleDateString()}
                    </text>
                </svg>
            `;
            
            const posterBuffer = Buffer.from(svgContent);
            
            // Upload to R2
            const uniqueFilename = generateUniqueFilename(outputFilename, 'generated/');
            posterUrl = await uploadToR2(uniqueFilename, posterBuffer, 'image/svg+xml');
        } else {
            // Fallback to placeholder if R2 not configured
            posterUrl = `https://via.placeholder.com/800x600/6366f1/ffffff?text=Generated+Poster+for+${template.name}`;
        }
        
        res.json({ 
            success: true, 
            download_url: posterUrl,
            posterUrl: posterUrl,
            filename: outputFilename,
            message: 'Poster generated successfully',
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

// Serve JavaScript files with correct MIME type
app.get('/app.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.join(__dirname, 'public', 'app.js'));
});

app.get('/admin.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.join(__dirname, 'public', 'admin.js'));
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