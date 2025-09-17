const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to database
const db = new sqlite3.Database('poster_maker.db');

// Sample categories
const categories = [
  { name: 'Festival', description: 'Traditional Indian festival posters' },
  { name: 'Business', description: 'Professional business and corporate posters' },
  { name: 'Religious', description: 'Religious and spiritual occasion posters' },
  { name: 'Celebration', description: 'General celebration and event posters' }
];

// Sample templates with field configurations
const templates = [
  {
    name: 'Diwali Festival Poster',
    image_path: 'uploads/templates/diwali_sample.svg',
    category_id: 1, // Festival
    fields: JSON.stringify([
      {
        id: 'logo',
        type: 'logo',
        x: 300,
        y: 400,
        width: 200,
        height: 200,
        label: 'Your Logo'
      },
      {
        id: 'business_name',
        type: 'text',
        x: 400,
        y: 950,
        width: 640,
        height: 50,
        label: 'Business Name',
        fontSize: 28,
        color: '#8B4513',
        textAlign: 'center'
      },
      {
        id: 'contact',
        type: 'text',
        x: 400,
        y: 990,
        width: 640,
        height: 30,
        label: 'Contact Number',
        fontSize: 22,
        color: '#8B4513',
        textAlign: 'center'
      },
      {
        id: 'website',
        type: 'text',
        x: 400,
        y: 1020,
        width: 640,
        height: 30,
        label: 'Website',
        fontSize: 22,
        color: '#8B4513',
        textAlign: 'center'
      }
    ])
  },
  {
    name: 'Holi Festival Poster',
    image_path: 'uploads/templates/holi_sample.svg',
    category_id: 1, // Festival
    fields: JSON.stringify([
      {
        id: 'logo',
        type: 'logo',
        x: 300,
        y: 350,
        width: 200,
        height: 200,
        label: 'Your Logo'
      },
      {
        id: 'business_name',
        type: 'text',
        x: 400,
        y: 900,
        width: 640,
        height: 50,
        label: 'Business Name',
        fontSize: 30,
        color: '#FF1493',
        textAlign: 'center'
      },
      {
        id: 'phone',
        type: 'text',
        x: 400,
        y: 940,
        width: 640,
        height: 35,
        label: 'Phone Number',
        fontSize: 24,
        color: '#9932CC',
        textAlign: 'center'
      },
      {
        id: 'email',
        type: 'text',
        x: 400,
        y: 975,
        width: 640,
        height: 35,
        label: 'Email Address',
        fontSize: 24,
        color: '#9932CC',
        textAlign: 'center'
      }
    ])
  },
  {
    name: 'Ganesh Chaturthi Poster',
    image_path: 'uploads/templates/ganesh_sample.svg',
    category_id: 3, // Religious
    fields: JSON.stringify([
      {
        id: 'logo',
        type: 'logo',
        x: 300,
        y: 350,
        width: 200,
        height: 200,
        label: 'Your Logo'
      },
      {
        id: 'business_name',
        type: 'text',
        x: 400,
        y: 900,
        width: 640,
        height: 50,
        label: 'Business Name',
        fontSize: 30,
        color: '#DC143C',
        textAlign: 'center'
      },
      {
        id: 'contact',
        type: 'text',
        x: 400,
        y: 940,
        width: 640,
        height: 35,
        label: 'Contact Number',
        fontSize: 22,
        color: '#FF6347',
        textAlign: 'center'
      },
      {
        id: 'address',
        type: 'text',
        x: 400,
        y: 975,
        width: 640,
        height: 35,
        label: 'Business Address',
        fontSize: 22,
        color: '#FF6347',
        textAlign: 'center'
      }
    ])
  },
  {
    name: 'Professional Business Poster',
    image_path: 'uploads/templates/business_sample.svg',
    category_id: 2, // Business
    fields: JSON.stringify([
      {
        id: 'logo',
        type: 'logo',
        x: 50,
        y: 30,
        width: 150,
        height: 140,
        label: 'Company Logo'
      },
      {
        id: 'company_name',
        type: 'text',
        x: 500,
        y: 90,
        width: 500,
        height: 50,
        label: 'Company Name',
        fontSize: 36,
        color: '#1E3A8A',
        textAlign: 'center'
      },
      {
        id: 'tagline',
        type: 'text',
        x: 500,
        y: 130,
        width: 500,
        height: 30,
        label: 'Company Tagline',
        fontSize: 20,
        color: '#3B82F6',
        textAlign: 'center'
      },
      {
        id: 'phone',
        type: 'text',
        x: 100,
        y: 800,
        width: 600,
        height: 40,
        label: 'Phone Number',
        fontSize: 22,
        color: '#3B82F6',
        textAlign: 'left'
      },
      {
        id: 'email',
        type: 'text',
        x: 100,
        y: 840,
        width: 600,
        height: 40,
        label: 'Email Address',
        fontSize: 22,
        color: '#3B82F6',
        textAlign: 'left'
      },
      {
        id: 'website',
        type: 'text',
        x: 100,
        y: 880,
        width: 600,
        height: 40,
        label: 'Website URL',
        fontSize: 22,
        color: '#3B82F6',
        textAlign: 'left'
      },
      {
        id: 'address',
        type: 'text',
        x: 100,
        y: 920,
        width: 600,
        height: 40,
        label: 'Business Address',
        fontSize: 22,
        color: '#3B82F6',
        textAlign: 'left'
      }
    ])
  }
];

console.log('Setting up sample data...');

// Insert categories
db.serialize(() => {
  categories.forEach((category, index) => {
    db.run('INSERT OR IGNORE INTO categories (name, description) VALUES (?, ?)', 
           [category.name, category.description], 
           function(err) {
      if (err) {
        console.error('Error inserting category:', err);
      } else {
        console.log(`✓ Category "${category.name}" added`);
      }
    });
  });

  // Insert templates
  setTimeout(() => {
    templates.forEach((template) => {
      db.run('INSERT OR IGNORE INTO templates (name, image_path, category_id, fields) VALUES (?, ?, ?, ?)', 
             [template.name, template.image_path, template.category_id, template.fields], 
             function(err) {
        if (err) {
          console.error('Error inserting template:', err);
        } else {
          console.log(`✓ Template "${template.name}" added`);
        }
      });
    });

    setTimeout(() => {
      console.log('\n🎉 Sample data setup completed!');
      console.log('You can now access the admin panel at http://localhost:3000/admin');
      console.log('Login with: admin / admin123');
      db.close();
    }, 1000);
  }, 500);
});