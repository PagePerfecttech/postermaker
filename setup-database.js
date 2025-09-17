const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupDatabase() {
    try {
        console.log('Setting up database tables...');

        // Create categories table
        const { error: categoriesError } = await supabase.rpc('create_categories_table');
        if (categoriesError && !categoriesError.message.includes('already exists')) {
            console.error('Error creating categories table:', categoriesError);
        } else {
            console.log('Categories table ready');
        }

        // Create templates table
        const { error: templatesError } = await supabase.rpc('create_templates_table');
        if (templatesError && !templatesError.message.includes('already exists')) {
            console.error('Error creating templates table:', templatesError);
        } else {
            console.log('Templates table ready');
        }

        // Create downloads table
        const { error: downloadsError } = await supabase.rpc('create_downloads_table');
        if (downloadsError && !downloadsError.message.includes('already exists')) {
            console.error('Error creating downloads table:', downloadsError);
        } else {
            console.log('Downloads table ready');
        }

        // Create admin_users table
        const { error: adminError } = await supabase.rpc('create_admin_users_table');
        if (adminError && !adminError.message.includes('already exists')) {
            console.error('Error creating admin_users table:', adminError);
        } else {
            console.log('Admin users table ready');
        }

        console.log('Database setup completed successfully!');
        
        // Insert default admin user if not exists
        const { data: existingAdmin } = await supabase
            .from('admin_users')
            .select('id')
            .eq('username', 'admin')
            .single();

        if (!existingAdmin) {
            const { error: insertError } = await supabase
                .from('admin_users')
                .insert([{
                    username: 'admin',
                    password: 'admin123'
                }]);

            if (insertError) {
                console.error('Error creating default admin:', insertError);
            } else {
                console.log('Default admin user created');
            }
        } else {
            console.log('Default admin user already exists');
        }

        // Insert default categories if not exist
        const { data: existingCategories } = await supabase
            .from('categories')
            .select('id');

        if (!existingCategories || existingCategories.length === 0) {
            const { error: categoryInsertError } = await supabase
                .from('categories')
                .insert([
                    { name: 'Festival', description: 'Festival celebration posters' },
                    { name: 'Event', description: 'Event announcement posters' },
                    { name: 'Business', description: 'Business promotion posters' }
                ]);

            if (categoryInsertError) {
                console.error('Error creating default categories:', categoryInsertError);
            } else {
                console.log('Default categories created');
            }
        } else {
            console.log('Categories already exist');
        }

    } catch (error) {
        console.error('Database setup failed:', error);
        process.exit(1);
    }
}

setupDatabase();