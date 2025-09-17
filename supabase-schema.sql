-- Supabase Database Schema for Festival Poster Maker
-- Run these commands in your Supabase SQL Editor

-- Enable Row Level Security (RLS) for better security
-- You can disable RLS for now during development if needed

-- 1. Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
    id BIGSERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Categories table
CREATE TABLE IF NOT EXISTS categories (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Templates table
CREATE TABLE IF NOT EXISTS templates (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    category_id BIGINT REFERENCES categories(id),
    image_path TEXT NOT NULL,
    fields TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Downloads table
CREATE TABLE IF NOT EXISTS downloads (
    id BIGSERIAL PRIMARY KEY,
    template_id BIGINT REFERENCES templates(id),
    user_name TEXT NOT NULL,
    user_mobile TEXT NOT NULL,
    generated_path TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default admin user (password: admin123)
-- Note: You'll need to hash this password in your application
INSERT INTO admin_users (username, password) 
VALUES ('admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi')
ON CONFLICT (username) DO NOTHING;

-- Optional: Create some sample categories
INSERT INTO categories (name, description) VALUES 
('Festival', 'Traditional festival posters'),
('Business', 'Business and promotional posters'),
('Religious', 'Religious ceremony posters'),
('Cultural', 'Cultural event posters')
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_templates_category_id ON templates(category_id);
CREATE INDEX IF NOT EXISTS idx_downloads_template_id ON downloads(template_id);
CREATE INDEX IF NOT EXISTS idx_downloads_created_at ON downloads(created_at);