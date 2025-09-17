#!/usr/bin/env node

/**
 * Simple deployment helper script
 * Run with: node deploy.js
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Free Poster App Deployment Helper\n');

// Check if .env exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
    console.log('❌ .env file not found!');
    console.log('📝 Create .env file with these variables:');
    console.log(`
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=your_bucket_name
R2_PUBLIC_URL=https://your-domain.com
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=production
    `);
    process.exit(1);
}

// Check if vercel.json exists
const vercelPath = path.join(__dirname, 'vercel.json');
if (!fs.existsSync(vercelPath)) {
    console.log('❌ vercel.json not found! Creating...');
    
    const vercelConfig = {
        "version": 2,
        "builds": [
            {
                "src": "server.js",
                "use": "@vercel/node"
            }
        ],
        "routes": [
            {
                "src": "/(.*)",
                "dest": "server.js"
            }
        ],
        "env": {
            "NODE_ENV": "production"
        }
    };
    
    fs.writeFileSync(vercelPath, JSON.stringify(vercelConfig, null, 2));
    console.log('✅ vercel.json created!');
}

// Check package.json
const packagePath = path.join(__dirname, 'package.json');
if (fs.existsSync(packagePath)) {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    if (!packageJson.scripts) {
        packageJson.scripts = {};
    }
    
    // Ensure we have the right scripts
    if (!packageJson.scripts.start) {
        packageJson.scripts.start = 'node server.js';
    }
    
    if (!packageJson.scripts.build) {
        packageJson.scripts.build = 'echo "No build step needed"';
    }
    
    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
    console.log('✅ package.json updated!');
}

console.log('\n🎉 Your app is ready for free deployment!\n');

console.log('📋 Next steps:');
console.log('1. Push to GitHub:');
console.log('   git init');
console.log('   git add .');
console.log('   git commit -m "Ready for deployment"');
console.log('   git remote add origin https://github.com/yourusername/freeposter.git');
console.log('   git push -u origin main');
console.log('');
console.log('2. Deploy on Vercel:');
console.log('   - Go to https://vercel.com');
console.log('   - Import your GitHub repository');
console.log('   - Add environment variables');
console.log('   - Deploy!');
console.log('');
console.log('💰 Total cost: $0/month');
console.log('🌐 Your app will be live at: https://your-app.vercel.app');
console.log('');
console.log('📖 See DEPLOYMENT.md for detailed instructions');
