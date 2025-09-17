# Deployment Guide - Festival Poster Maker

This guide covers multiple deployment options for the Festival Poster Maker PWA application.

## 🚀 Quick Deploy Options

### Option 1: Vercel (Recommended)

1. **Fork/Clone the repository**
   ```bash
   git clone https://github.com/PagePerfecttech/postermaker.git
   cd postermaker
   ```

2. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

3. **Deploy to Vercel**
   ```bash
   vercel
   ```

4. **Set Environment Variables in Vercel Dashboard**
   - Go to your project settings in Vercel
   - Add the following environment variables:
     - `SUPABASE_URL`: Your Supabase project URL
     - `SUPABASE_ANON_KEY`: Your Supabase anonymous key
     - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
     - `JWT_SECRET`: A secure random string

### Option 2: Netlify

1. **Connect GitHub Repository**
   - Go to [Netlify](https://netlify.com)
   - Click "New site from Git"
   - Connect your GitHub account
   - Select the `postermaker` repository

2. **Configure Build Settings**
   - Build command: `npm install`
   - Publish directory: `public`
   - Functions directory: `netlify/functions`

3. **Set Environment Variables**
   - Go to Site settings > Environment variables
   - Add the same variables as listed for Vercel

### Option 3: Railway

1. **Deploy from GitHub**
   - Go to [Railway](https://railway.app)
   - Click "Deploy from GitHub repo"
   - Select your repository

2. **Configure Environment Variables**
   - Add all Supabase credentials
   - Set `PORT` to `3000`

### Option 4: Render

1. **Create Web Service**
   - Go to [Render](https://render.com)
   - Click "New Web Service"
   - Connect your GitHub repository

2. **Configure Service**
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Add environment variables

## 🔧 Environment Variables Setup

For any deployment platform, you'll need these environment variables:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
JWT_SECRET=your_secure_random_string_here
PORT=3000
NODE_ENV=production
```

## 📱 PWA Deployment Considerations

### HTTPS Requirement
- PWAs require HTTPS to function properly
- All major deployment platforms provide HTTPS by default
- Service workers and app installation only work over HTTPS

### Domain Configuration
- Update your Supabase project settings to allow your deployment domain
- Add your domain to the allowed origins list in Supabase

### Cache Headers
- The deployment configurations include proper cache headers for PWA assets
- Service worker and manifest files have appropriate content types set

## 🗄️ Database Setup

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note down your project URL and API keys

2. **Run Database Schema**
   - Go to the SQL editor in your Supabase dashboard
   - Copy and paste the contents of `supabase-schema.sql`
   - Execute the SQL to create tables

3. **Create Admin User**
   - Run the migration script locally first:
     ```bash
     node migrate-data.js
     ```
   - Or manually insert admin user in Supabase dashboard

## 🧪 Testing Deployment

After deployment, test these features:

1. **Basic Functionality**
   - Visit your deployed URL
   - Test template loading and poster generation
   - Verify admin panel access

2. **PWA Features**
   - Check if the app can be installed (look for install prompt)
   - Test offline functionality
   - Verify service worker registration in browser dev tools

3. **Mobile Experience**
   - Test on actual mobile devices
   - Verify responsive design
   - Check touch interactions

## 🔍 Troubleshooting

### Common Issues

1. **Environment Variables Not Loading**
   - Verify all variables are set in your deployment platform
   - Check variable names match exactly (case-sensitive)
   - Redeploy after adding variables

2. **Database Connection Errors**
   - Verify Supabase URL and keys are correct
   - Check if your deployment domain is allowed in Supabase settings
   - Ensure database schema has been applied

3. **PWA Not Installing**
   - Verify HTTPS is enabled (should be automatic on all platforms)
   - Check manifest.json is accessible at `/manifest.json`
   - Ensure service worker is registered without errors

4. **File Upload Issues**
   - For serverless deployments, consider using cloud storage (Supabase Storage, Cloudinary, etc.)
   - Update file upload logic to use cloud storage instead of local filesystem

## 📊 Performance Optimization

### For Production Deployment

1. **Enable Compression**
   - Most platforms enable gzip compression by default
   - Verify in network tab that responses are compressed

2. **CDN Configuration**
   - Static assets are automatically served via CDN on most platforms
   - Consider using a separate CDN for uploaded images

3. **Database Optimization**
   - Enable connection pooling in Supabase
   - Add database indexes for frequently queried fields
   - Consider caching for frequently accessed data

## 🔐 Security Checklist

- [ ] Change default admin credentials
- [ ] Use strong JWT secret
- [ ] Enable RLS (Row Level Security) in Supabase
- [ ] Validate all user inputs
- [ ] Use HTTPS everywhere
- [ ] Keep dependencies updated
- [ ] Monitor for security vulnerabilities

## 📈 Monitoring

Consider adding monitoring for:
- Application uptime
- Error tracking (Sentry, LogRocket)
- Performance monitoring
- User analytics
- Database performance

## 🚀 Continuous Deployment

Most platforms support automatic deployment from GitHub:
1. Connect your repository
2. Enable automatic deployments
3. Every push to main branch will trigger a new deployment

This ensures your live site stays updated with your latest changes.