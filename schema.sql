-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create templates table
CREATE TABLE IF NOT EXISTS templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
    image_path TEXT NOT NULL,
    fields JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create downloads table
CREATE TABLE IF NOT EXISTS downloads (
    id SERIAL PRIMARY KEY,
    template_id INTEGER REFERENCES templates(id) ON DELETE CASCADE,
    user_name VARCHAR(255),
    user_mobile VARCHAR(20),
    generated_path TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default categories
INSERT INTO categories (name, description) VALUES 
    ('Festival', 'Festival celebration posters'),
    ('Event', 'Event announcement posters'),
    ('Business', 'Business promotion posters')
ON CONFLICT (name) DO NOTHING;

-- Insert default admin user
INSERT INTO admin_users (username, password) VALUES 
    ('admin', 'admin123')
ON CONFLICT (username) DO NOTHING;

-- Enable Row Level Security (RLS) for better security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create policies for public access to categories and templates
CREATE POLICY "Allow public read access to categories" ON categories
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access to templates" ON templates
    FOR SELECT USING (true);

-- Create policies for admin access
CREATE POLICY "Allow admin full access to categories" ON categories
    FOR ALL USING (true);

CREATE POLICY "Allow admin full access to templates" ON templates
    FOR ALL USING (true);

CREATE POLICY "Allow admin full access to downloads" ON downloads
    FOR ALL USING (true);

CREATE POLICY "Allow admin full access to admin_users" ON admin_users
    FOR ALL USING (true);