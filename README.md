# Festival Poster Maker - PWA Edition

A modern web application for creating custom festival posters with dynamic text, images, and logos. This project features a mobile-friendly design, PWA capabilities, and is powered by Supabase for scalable cloud-based data management.

## 🚀 Features

- **Template Management**: Upload and manage poster templates
- **Category Organization**: Organize templates by categories (Diwali, Holi, Ganesh Chaturthi, etc.)
- **Dynamic Content**: Add custom text, images, and logos to templates
- **Admin Panel**: Secure admin interface for template and category management
- **Cloud Database**: Powered by Supabase for reliable data storage
- **PWA Support**: Installable web app with offline capabilities
- **Mobile-Friendly**: Responsive design optimized for all devices
- **Real-time Operations**: Fast CRUD operations with Supabase client

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Supabase account and project

## 🛠️ Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone https://github.com/PagePerfecttech/postermaker.git
cd postermaker
npm install
```

### 2. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project credentials
3. Copy the SQL schema from `supabase-schema.sql` and run it in your Supabase SQL editor

### 3. Environment Configuration

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your actual Supabase credentials:
   ```env
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   JWT_SECRET=your_secure_jwt_secret
   PORT=3000
```

### 4. Database Migration (Optional)

If you have existing SQLite data to migrate:

```bash
node migrate-data.js
```

### 5. Test Supabase Integration

```bash
node test-supabase.js
```

### 6. Start the Application

```bash
npm start
```

The application will be available at:
- Main app: http://localhost:3000
- Admin panel: http://localhost:3000/admin

## 📱 PWA Features

This application is a Progressive Web App (PWA) with the following features:

- **Installable**: Can be installed on mobile devices and desktops
- **Offline Support**: Service worker caches resources for offline use
- **Mobile Optimized**: Responsive design with touch-friendly interface
- **App-like Experience**: Standalone display mode when installed

To install the app:
1. Visit the website on your mobile device
2. Look for the "Add to Home Screen" prompt
3. Or use the browser's install option

## 📁 Project Structure

```
postermaker/
├── public/                 # Frontend files
│   ├── index.html         # Main application
│   ├── admin.html         # Admin panel
│   ├── app.js            # Main app JavaScript
│   ├── admin.js          # Admin panel JavaScript
│   ├── manifest.json     # PWA manifest
│   └── sw.js             # Service worker
├── uploads/               # File uploads
│   ├── templates/        # Template images
│   └── generated/        # Generated posters
├── server.js             # Express server (migrated to Supabase)
├── supabase-config.js    # Supabase client configuration
├── supabase-schema.sql   # Database schema
├── migrate-data.js       # Data migration script
├── test-supabase.js      # Supabase integration tests
├── .env.example          # Environment variables template
└── package.json          # Dependencies
```

## 🗄️ Database Schema

The application uses the following Supabase tables:

- **categories**: Template categories
- **templates**: Poster templates with metadata
- **admins**: Admin user accounts
- **downloads**: Download tracking

## 🔧 API Endpoints

### Public Endpoints
- `GET /api/categories` - Get all categories
- `GET /api/templates` - Get all templates
- `GET /api/templates?category=<id>` - Get templates by category
- `POST /api/generate-poster` - Generate custom poster

### Admin Endpoints (Authentication Required)
- `POST /api/admin/login` - Admin login
- `POST /api/categories` - Create category
- `POST /api/templates` - Upload template
- `GET /api/admin/templates/:id` - Get template details
- `PUT /api/admin/templates/:id` - Update template
- `DELETE /api/admin/templates/:id` - Delete template

## 🔐 Default Admin Credentials

- Username: `admin`
- Password: `admin123`

**⚠️ Important**: Change these credentials in production!

## 🧪 Testing

Run the Supabase integration tests:

```bash
node test-supabase.js
```

This will test all CRUD operations and verify the database connection.

## 🚀 Deployment

1. Set up your Supabase project in production
2. Update environment variables for production
3. Deploy to your preferred hosting platform (Vercel, Netlify, Heroku, etc.)
4. Ensure your Supabase project allows connections from your deployment domain

## 📝 Migration Notes

This project was successfully migrated from SQLite to Supabase with the following changes:

- ✅ Replaced SQLite3 with Supabase client
- ✅ Updated all database operations to use async/await
- ✅ Created helper functions for common operations
- ✅ Added proper error handling
- ✅ Maintained backward compatibility
- ✅ Created migration script for existing data
- ✅ Added PWA capabilities with service worker and manifest
- ✅ Implemented mobile-friendly responsive design

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with `node test-supabase.js`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Troubleshooting

### Common Issues

1. **"Missing Supabase environment variables"**
   - Ensure your `.env` file has all required Supabase credentials
   - Check that variable names match exactly

2. **Database connection errors**
   - Verify your Supabase URL and keys are correct
   - Ensure your Supabase project is active
   - Check if you've run the schema SQL in Supabase

3. **Template upload issues**
   - Ensure the `uploads/templates` directory exists
   - Check file permissions
   - Verify image file formats are supported

4. **Admin login not working**
   - Run the migration script to create admin user
   - Or manually insert admin user in Supabase dashboard

5. **PWA not installing**
   - Ensure you're using HTTPS (required for PWA)
   - Check that manifest.json is accessible
   - Verify service worker is registered correctly

For more help, check the console logs or run the test script to diagnose issues.