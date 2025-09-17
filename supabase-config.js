const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role for server-side operations

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables. Please check your .env file.');
    process.exit(1);
}

// Create Supabase client with service role key for server-side operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Database helper functions
const db = {
    // Admin operations
    async createAdmin(username, hashedPassword) {
        const { data, error } = await supabase
            .from('admin_users')
            .insert([{ username, password: hashedPassword }])
            .select();
        
        if (error) throw error;
        return data[0];
    },

    async getAdminByUsername(username) {
        const { data, error } = await supabase
            .from('admin_users')
            .select('*')
            .eq('username', username)
            .single();
        
        if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
        return data;
    },

    // Category operations
    async getAllCategories() {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('name');
        
        if (error) throw error;
        return data;
    },

    async createCategory(name, description) {
        const { data, error } = await supabase
            .from('categories')
            .insert([{ name, description }])
            .select();
        
        if (error) throw error;
        return data[0];
    },

    async updateCategory(id, name, description) {
        const { data, error } = await supabase
            .from('categories')
            .update({ name, description })
            .eq('id', id)
            .select();
        
        if (error) throw error;
        return data[0];
    },

    async deleteCategory(id) {
        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        return true;
    },

    // Template operations
    async getAllTemplates() {
        const { data, error } = await supabase
            .from('templates')
            .select(`
                *,
                categories (
                    id,
                    name
                )
            `)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data;
    },

    async getTemplatesByCategory(categoryId) {
        const { data, error } = await supabase
            .from('templates')
            .select(`
                *,
                categories (
                    id,
                    name
                )
            `)
            .eq('category_id', categoryId)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data;
    },

    async createTemplate(name, categoryId, imagePath, fields) {
        const { data, error } = await supabase
            .from('templates')
            .insert([{
                name,
                category_id: categoryId,
                image_path: imagePath,
                fields: JSON.stringify(fields)
            }])
            .select();
        
        if (error) throw error;
        return data[0];
    },

    async updateTemplate(id, templateData) {
        const updateData = {
            name: templateData.name,
            category_id: templateData.category_id,
            fields: JSON.stringify(templateData.fields)
        };
        
        if (templateData.image_path) {
            updateData.image_path = templateData.image_path;
        }

        const { data, error } = await supabase
            .from('templates')
            .update(updateData)
            .eq('id', id)
            .select();
        
        if (error) throw error;
        return data[0];
    },

    async deleteTemplate(id) {
        const { error } = await supabase
            .from('templates')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        return true;
    },

    // Download operations
    async createDownload(templateId, userName, userMobile, generatedPath) {
        const { data, error } = await supabase
            .from('downloads')
            .insert([{
                template_id: templateId,
                user_name: userName,
                user_mobile: userMobile,
                generated_path: generatedPath
            }])
            .select();
        
        if (error) throw error;
        return data[0];
    },

    async getAllDownloads() {
        const { data, error } = await supabase
            .from('downloads')
            .select(`
                *,
                templates (
                    id,
                    name,
                    categories (
                        name
                    )
                )
            `)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data;
    }
};

module.exports = { supabase, db };