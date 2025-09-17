# ☁️ Cloudflare R2 Setup Guide

## Step 1: Create Cloudflare Account
1. Go to [cloudflare.com](https://cloudflare.com)
2. Sign up for a free account
3. Verify your email

## Step 2: Create R2 Bucket
1. In Cloudflare dashboard, go to **R2 Object Storage**
2. Click **"Create bucket"**
3. Choose a bucket name (e.g., `postermaker-storage`)
4. Select a location close to your users
5. Click **"Create bucket"**

## Step 3: Get API Credentials
1. Go to **R2 Object Storage** > **Manage R2 API tokens**
2. Click **"Create API token"**
3. Choose **"Custom token"**
4. Set permissions:
   - **Account**: Your account
   - **Zone Resources**: Include all zones
   - **Permissions**: 
     - `Object:Edit`
     - `Object:Read`
5. Click **"Continue to summary"**
6. Click **"Create token"**
7. **Save the credentials** (you won't see them again!)

## Step 4: Set Up Public Access
1. Go to your R2 bucket
2. Click **"Settings"** tab
3. Go to **"Public access"**
4. Click **"Allow access"**
5. Copy the **Public URL** (you'll need this)

## Step 5: Add Environment Variables to Vercel
In your Vercel project settings, add these environment variables:

```
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your_access_key_id
R2_SECRET_ACCESS_KEY=your_secret_access_key
R2_BUCKET_NAME=your_bucket_name
R2_PUBLIC_URL=https://your-bucket.your-domain.com
```

## Step 6: File Organization
Your R2 bucket will be organized like this:
```
your-bucket/
├── templates/
│   ├── template1_123456_abc123.jpg
│   ├── template2_123457_def456.png
│   └── ...
├── generated/
│   ├── poster_123456_xyz789.jpg
│   ├── poster_123457_uvw012.jpg
│   └── ...
```

## Benefits of R2
- ✅ **10GB free storage**
- ✅ **1M requests/month free**
- ✅ **Zero egress fees** (no charges for downloads)
- ✅ **Global CDN** (fast worldwide access)
- ✅ **S3-compatible API**
- ✅ **Automatic scaling**

## Troubleshooting
- **Upload fails**: Check API credentials and bucket permissions
- **Files not accessible**: Ensure public access is enabled
- **Slow uploads**: Check your internet connection
- **Permission errors**: Verify API token has correct permissions

## Cost
- **Free tier**: 10GB storage, 1M requests/month
- **After free tier**: Very low cost compared to AWS S3
- **No egress fees**: Unlike AWS S3

Your poster maker will now store all files in Cloudflare R2! 🚀
