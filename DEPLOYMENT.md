# 🚀 Free Deployment Guide

## Option 1: Vercel (Recommended)

### Prerequisites
1. GitHub account
2. Vercel account (free)
3. Supabase account (free)
4. Cloudflare account (free)

### Steps

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/freeposter.git
   git push -u origin main
   ```

2. **Deploy on Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Node.js

3. **Add Environment Variables in Vercel**
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
   R2_ACCESS_KEY_ID=your_access_key
   R2_SECRET_ACCESS_KEY=your_secret_key
   R2_BUCKET_NAME=your_bucket_name
   R2_PUBLIC_URL=https://your-domain.com
   JWT_SECRET=your_jwt_secret_key_here
   NODE_ENV=production
   ```

4. **Deploy!**
   - Click "Deploy"
   - Your app will be live at `https://your-app.vercel.app`

## Option 2: Railway

1. **Connect GitHub to Railway**
   - Go to [railway.app](https://railway.app)
   - Connect your GitHub account
   - Select your repository

2. **Add Environment Variables**
   - Same variables as Vercel
   - Add in Railway dashboard

3. **Deploy**
   - Railway auto-deploys on git push

## Option 3: Render

1. **Create Web Service**
   - Go to [render.com](https://render.com)
   - Connect GitHub
   - Select your repository

2. **Configure**
   - Build Command: `npm install`
   - Start Command: `npm start`

3. **Add Environment Variables**
   - Same as above

## Database Setup (Supabase)

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Get your URL and service key

2. **Create Tables**
   ```sql
   -- Admin users
   CREATE TABLE admin_users (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     username TEXT UNIQUE NOT NULL,
     password TEXT NOT NULL,
     created_at TIMESTAMP DEFAULT NOW()
   );

   -- Categories
   CREATE TABLE categories (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     name TEXT NOT NULL,
     description TEXT,
     created_at TIMESTAMP DEFAULT NOW()
   );

   -- Templates
   CREATE TABLE templates (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     name TEXT NOT NULL,
     category_id UUID REFERENCES categories(id),
     image_path TEXT NOT NULL,
     fields JSONB NOT NULL,
     created_at TIMESTAMP DEFAULT NOW()
   );

   -- Downloads
   CREATE TABLE downloads (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     template_id UUID REFERENCES templates(id),
     user_name TEXT NOT NULL,
     user_mobile TEXT NOT NULL,
     template_name TEXT,
     downloaded_at TIMESTAMP DEFAULT NOW(),
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

3. **Insert Default Admin**
   ```sql
   INSERT INTO admin_users (username, password) 
   VALUES ('admin', '$2a$10$your_hashed_password_here');
   ```

## Storage Setup (Cloudflare R2)

1. **Create R2 Bucket**
   - Go to Cloudflare dashboard
   - Create R2 bucket
   - Get API credentials

2. **Configure Public Access**
   - Enable public access
   - Set up custom domain (optional)

## Free Limits Summary

### Vercel
- ✅ 100GB bandwidth/month
- ✅ 100 function executions/day
- ✅ 1GB storage
- ✅ Custom domains

### Supabase
- ✅ 500MB database
- ✅ 2GB bandwidth/month
- ✅ 50K monthly users

### Cloudflare R2
- ✅ 10GB storage
- ✅ 1M requests/month
- ✅ Zero egress fees

## Total Cost: $0/month! 🎉