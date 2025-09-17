const { db } = require('./supabase-config');

async function checkTemplates() {
    try {
        console.log('Checking for templates with external URLs...\n');
        
        const templates = await db.getAllTemplates();
        console.log(`Found ${templates.length} total templates\n`);
        
        const externalTemplates = templates.filter(template => 
            template.image_path && template.image_path.startsWith('http')
        );
        
        if (externalTemplates.length > 0) {
            console.log(`⚠️  Found ${externalTemplates.length} templates with external URLs:`);
            externalTemplates.forEach(template => {
                console.log(`- ID: ${template.id}, Name: "${template.name}", URL: ${template.image_path}`);
            });
            
            console.log('\n🔧 These external URLs may be causing ORB (Opaque Response Blocking) errors.');
            console.log('Consider replacing them with local files or proper CORS-enabled URLs.');
        } else {
            console.log('✅ No templates with external URLs found.');
        }
        
        // Also check for any templates that might be causing JSON parsing issues
        const problematicTemplates = templates.filter(template => {
            try {
                if (typeof template.fields === 'string') {
                    JSON.parse(template.fields);
                }
                return false;
            } catch (e) {
                return true;
            }
        });
        
        if (problematicTemplates.length > 0) {
            console.log(`\n⚠️  Found ${problematicTemplates.length} templates with invalid JSON fields:`);
            problematicTemplates.forEach(template => {
                console.log(`- ID: ${template.id}, Name: "${template.name}"`);
            });
        }
        
    } catch (error) {
        console.error('Error checking templates:', error);
    }
}

checkTemplates();