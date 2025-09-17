const sqlite3 = require('sqlite3').verbose();
const { db } = require('./supabase-config');
require('dotenv').config();

// SQLite database path
const SQLITE_DB_PATH = './database.db';

async function migrateData() {
  console.log('Starting data migration from SQLite to Supabase...');
  
  // Open SQLite database
  const sqliteDb = new sqlite3.Database(SQLITE_DB_PATH, (err) => {
    if (err) {
      console.error('Error opening SQLite database:', err.message);
      return;
    }
    console.log('Connected to SQLite database.');
  });

  try {
    // Migrate categories
    console.log('Migrating categories...');
    const categories = await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM categories', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    for (const category of categories) {
      try {
        const { error } = await db.supabase
          .from('categories')
          .insert({
            id: category.id,
            name: category.name,
            created_at: category.created_at || new Date().toISOString()
          });
        
        if (error) {
          console.error('Error inserting category:', error);
        } else {
          console.log(`Migrated category: ${category.name}`);
        }
      } catch (err) {
        console.error('Error migrating category:', err);
      }
    }

    // Migrate templates
    console.log('Migrating templates...');
    const templates = await new Promise((resolve, reject) => {
      sqliteDb.all(`
        SELECT t.*, c.name as category_name 
        FROM templates t 
        LEFT JOIN categories c ON t.category_id = c.id
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    for (const template of templates) {
      try {
        const { error } = await db.supabase
          .from('templates')
          .insert({
            id: template.id,
            name: template.name,
            description: template.description,
            category_id: template.category_id,
            image_path: template.filename ? `uploads/templates/${template.filename}` : null,
            fields: template.fields,
            created_at: template.created_at || new Date().toISOString()
          });
        
        if (error) {
          console.error('Error inserting template:', error);
        } else {
          console.log(`Migrated template: ${template.name}`);
        }
      } catch (err) {
        console.error('Error migrating template:', err);
      }
    }

    // Migrate admins (if exists)
    console.log('Migrating admin users...');
    const admins = await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM admins', (err, rows) => {
        if (err) {
          console.log('No admins table found, skipping...');
          resolve([]);
        } else {
          resolve(rows);
        }
      });
    });

    for (const admin of admins) {
      try {
        const { error } = await db.supabase
          .from('admins')
          .insert({
            id: admin.id,
            username: admin.username,
            password: admin.password,
            created_at: admin.created_at || new Date().toISOString()
          });
        
        if (error) {
          console.error('Error inserting admin:', error);
        } else {
          console.log(`Migrated admin: ${admin.username}`);
        }
      } catch (err) {
        console.error('Error migrating admin:', err);
      }
    }

    // Migrate downloads (if exists)
    console.log('Migrating downloads...');
    const downloads = await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM downloads', (err, rows) => {
        if (err) {
          console.log('No downloads table found, skipping...');
          resolve([]);
        } else {
          resolve(rows);
        }
      });
    });

    for (const download of downloads) {
      try {
        const { error } = await db.supabase
          .from('downloads')
          .insert({
            id: download.id,
            template_id: download.template_id,
            poster_filename: download.poster_filename,
            download_count: download.download_count || 1,
            created_at: download.created_at || new Date().toISOString()
          });
        
        if (error) {
          console.error('Error inserting download:', error);
        } else {
          console.log(`Migrated download record: ${download.poster_filename}`);
        }
      } catch (err) {
        console.error('Error migrating download:', err);
      }
    }

    console.log('Data migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    // Close SQLite database
    sqliteDb.close((err) => {
      if (err) {
        console.error('Error closing SQLite database:', err.message);
      } else {
        console.log('SQLite database connection closed.');
      }
    });
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateData();
}

module.exports = { migrateData };