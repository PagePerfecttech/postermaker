#!/usr/bin/env node

/**
 * Environment setup helper
 * Run with: node setup-env.js
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('🔧 Environment Setup Helper\n');

const envPath = path.join(__dirname, '.env');

if (fs.existsSync(envPath)) {
    console.log('⚠️  .env file already exists!');
    console.log('📝 Please edit it manually or delete it to recreate.\n');
    process.exit(0);
}

// Generate a random JWT secret
const jwtSecret = crypto.randomBytes(64).toString('hex');

const envContent = `# Festival Poster Maker Environment Variables
# Copy this file and fill in your actual values

# Database Configuration (Supabase)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Cloudflare R2 Storage
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your_r2_access_key_here
R2_SECRET_ACCESS_KEY=your_r2_secret_key_here
R2_BUCKET_NAME=your_bucket_name_here
R2_PUBLIC_URL=https://your-domain.com

# Server Configuration
PORT=3000
JWT_SECRET=${jwtSecret}
NODE_ENV=development

# Admin Credentials (Default)
# Username: admin
# Password: admin123 (change this in production!)
`;

fs.writeFileSync(envPath, envContent);

console.log('✅ .env file created!');
console.log('🔑 JWT secret generated automatically');
console.log('');
console.log('📋 Next steps:');
console.log('1. Edit .env file with your actual credentials');
console.log('2. Set up Supabase database (see DEPLOYMENT.md)');
console.log('3. Set up Cloudflare R2 storage');
console.log('4. Run: npm start');
console.log('');
console.log('🌐 Your app will be available at: http://localhost:3000');
console.log('👤 Admin panel: http://localhost:3000/admin');
console.log('   Username: admin');
console.log('   Password: admin123');
