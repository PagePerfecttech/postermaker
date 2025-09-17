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
const { db } = require('./supabase-config');
const { uploadToR2, deleteFromR2, generateUniqueFilename, getMimeType } = require('./r2-config');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'festival_poster_secret_key_2024';

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static('public'));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Create local uploads directory for temporary files (generated posters)
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}
if (!fs.existsSync('uploads/generated')) {
    fs.mkdirSync('uploads/generated');
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

// Upload template (admin only)
app.post('/api/templates', authenticateAdmin, upload.single('template'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        const { name, category_id, fields } = req.body;
        
        // Upload file to Cloudflare R2
        const uniqueFilename = generateUniqueFilename(req.file.originalname, 'templates/');
        const mimeType = getMimeType(req.file.originalname);
        const r2Url = await uploadToR2(uniqueFilename, req.file.buffer, mimeType);
        
        const template = await db.createTemplate(
            name,
            category_id,
            r2Url,
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

// Delete template (admin only)
app.delete('/api/admin/templates/:id', authenticateAdmin, async (req, res) => {
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
        
        // Delete the image file from R2
        if (template.image_path) {
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

// Update template (admin only)
app.put('/api/admin/templates/:id', authenticateAdmin, upload.single('template'), async (req, res) => {
    try {
        const templateId = req.params.id;
        const { name, category_id, fields } = req.body;
        
        let imagePath = null;
        
        // If a new file is uploaded, upload it to R2
        if (req.file) {
            // Get the old template to delete the old image from R2
            const templates = await db.getAllTemplates();
            const oldTemplate = templates.find(t => t.id == templateId);
            
            // Upload new file to R2
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

// Generate poster endpoint
app.post('/api/generate-poster', (req, res) => {
  const uploadHandler = upload.fields([
    { name: 'images', maxCount: 10 },
    { name: 'logos', maxCount: 5 }
  ]);
  
  uploadHandler(req, res, async (err) => {
    if (err) {
      console.error('Upload error:', err.message);
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json({ error: err.message });
    }
    
    try {
    const { templateId, textFields } = req.body;
    
    console.log('Request body:', req.body);
    console.log('Template ID:', templateId);
    console.log('Text fields raw:', textFields);
    
    // Parse textFields if it's a string
    let parsedTextFields = textFields;
    if (typeof textFields === 'string') {
      try {
        parsedTextFields = JSON.parse(textFields);
        console.log('Parsed text fields:', parsedTextFields);
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

    const templateFields = JSON.parse(template.fields);
    
    // Load base template image from R2 URL
    const baseImage = await Jimp.read(template.image_path);
    const imageWidth = baseImage.getWidth();
    const imageHeight = baseImage.getHeight();
    
    console.log('Base image dimensions:', imageWidth, 'x', imageHeight);
    
    // Process each field
    console.log('Processing template fields:', templateFields.length);
    console.log('Text fields received:', parsedTextFields);
    console.log('Files received - images:', req.files.images ? req.files.images.length : 0);
    console.log('Files received - logos:', req.files.logos ? req.files.logos.length : 0);
    
    for (const field of templateFields) {
      console.log('Processing field:', field.id, 'type:', field.type);
      
      // Convert percentage positions to pixel coordinates
      const pixelX = Math.round((field.x / 100) * imageWidth);
      const pixelY = Math.round((field.y / 100) * imageHeight);
      const pixelWidth = Math.round((field.width / 100) * imageWidth);
      const pixelHeight = Math.round((field.height / 100) * imageHeight);
      
      console.log(`Field ${field.id} - Percentage: ${field.x}%, ${field.y}% -> Pixels: ${pixelX}, ${pixelY}`);
      
      if (field.type === 'text' && parsedTextFields && parsedTextFields[field.id]) {
        console.log('Adding text:', parsedTextFields[field.id], 'at pixel position:', pixelX, pixelY);
        console.log('Text field properties:', {
          fontSize: field.fontSize,
          fontFamily: field.fontFamily,
          color: field.color,
          align: field.align
        });
        
        // Add text to image using Jimp
        // Note: Jimp has limited font support, using built-in fonts for now
        // Font family customization would require additional font files
        let font;
        const fontSize = field.fontSize || 24;
        
        if (fontSize <= 16) {
          font = await Jimp.loadFont(Jimp.FONT_SANS_16_BLACK);
        } else if (fontSize <= 32) {
          font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
        } else if (fontSize <= 64) {
          font = await Jimp.loadFont(Jimp.FONT_SANS_64_BLACK);
        } else {
          font = await Jimp.loadFont(Jimp.FONT_SANS_128_BLACK);
        }
        
        baseImage.print(font, pixelX, pixelY, parsedTextFields[field.id]);
      } else if (field.type === 'image' && req.files.images) {
        // Find corresponding uploaded image
        const uploadedImage = req.files.images.find(file => 
          file.originalname === `image_${field.id}` || file.fieldname === 'images'
        );
        
        console.log('Looking for image field:', field.id);
        console.log('Available images:', req.files.images.map(f => f.originalname));
        
        if (uploadedImage) {
          console.log('Processing uploaded image:', uploadedImage.originalname);
          console.log('Image buffer size:', uploadedImage.buffer ? uploadedImage.buffer.length : 'No buffer');
          console.log('Image path:', uploadedImage.path);
          console.log('Compositing image at pixel position:', pixelX, pixelY, 'size:', pixelWidth, 'x', pixelHeight);
          
          // Use buffer instead of path for memory storage
          const userImage = await Jimp.read(uploadedImage.buffer);
          userImage.resize(pixelWidth, pixelHeight);
          baseImage.composite(userImage, pixelX, pixelY);
        } else {
          console.log('No matching image found for field:', field.id);
        }
      } else if (field.type === 'logo' && req.files.logos) {
        // Find corresponding uploaded logo
        const uploadedLogo = req.files.logos.find(file => 
          file.originalname === `logo_${field.id}` || file.fieldname === 'logos'
        );
        
        if (uploadedLogo) {
          console.log('Processing uploaded logo:', uploadedLogo.originalname);
          console.log('Logo buffer size:', uploadedLogo.buffer ? uploadedLogo.buffer.length : 'No buffer');
          console.log('Logo path:', uploadedLogo.path);
          console.log('Compositing logo at pixel position:', pixelX, pixelY, 'size:', pixelWidth, 'x', pixelHeight);
          
          // Use buffer instead of path for memory storage
          const logoImage = await Jimp.read(uploadedLogo.buffer);
          logoImage.resize(pixelWidth, pixelHeight);
          baseImage.composite(logoImage, pixelX, pixelY);
        }
      }
    }

    // Save generated poster
    const outputFilename = `poster_${uuidv4()}.jpg`;
    const outputPath = path.join(__dirname, 'uploads', 'generated', outputFilename);
    
    // Ensure directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    await baseImage.quality(95).writeAsync(outputPath);
    
    res.setHeader('Content-Type', 'application/json');
    res.json({ 
      success: true, 
      download_url: `/uploads/generated/${outputFilename}`,
      posterUrl: `/uploads/generated/${outputFilename}`,
      filename: outputFilename
    });
    
  } catch (error) {
    console.error('Error generating poster:', error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ error: 'Failed to generate poster' });
  }
  });
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
app.listen(PORT, () => {
    console.log(`Festival Poster Maker server running on http://localhost:${PORT}`);
    console.log(`Admin panel available at http://localhost:${PORT}/admin`);
    console.log('Default admin credentials: username=admin, password=admin123');
});