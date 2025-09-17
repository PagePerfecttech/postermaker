const { db } = require('./supabase-config');

async function fixExternalTemplates() {
    try {
        console.log('Fixing templates with external URLs...\n');
        
        const templates = await db.getAllTemplates();
        
        const externalTemplates = templates.filter(template => 
            template.image_path && (
                template.image_path.startsWith('https://example.com') ||
                template.image_path.includes('test-template.svg')
            )
        );
        
        if (externalTemplates.length > 0) {
            console.log(`Found ${externalTemplates.length} problematic templates to fix:`);
            
            for (const template of externalTemplates) {
                console.log(`\n🔧 Fixing template: "${template.name}" (ID: ${template.id})`);
                console.log(`   Current URL: ${template.image_path}`);
                
                try {
                    // Delete the problematic template
                    await db.deleteTemplate(template.id);
                    console.log(`   ✅ Deleted template "${template.name}"`);
                } catch (error) {
                    console.log(`   ❌ Failed to delete template "${template.name}":`, error.message);
                }
            }
            
            console.log('\n🎉 Cleanup completed!');
            console.log('The ORB errors should now be resolved.');
            
        } else {
            console.log('✅ No problematic external templates found.');
        }
        
    } catch (error) {
        console.error('Error fixing templates:', error);
    }
}

fixExternalTemplates();