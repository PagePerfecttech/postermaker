const { db } = require('./supabase-config');
require('dotenv').config();

async function testSupabaseOperations() {
  console.log('Testing Supabase CRUD operations...\n');

  try {
    // Test 1: Get all categories
    console.log('1. Testing getAllCategories...');
    const categories = await db.getAllCategories();
    console.log(`✓ Found ${categories.length} categories`);
    console.log('Categories:', categories.map(c => c.name).join(', '));

    // Test 2: Create a new category
    console.log('\n2. Testing createCategory...');
    const timestamp = Date.now();
    const testCategory = await db.createCategory(`Test Category ${timestamp}`);
    console.log('✓ Created test category:', testCategory);

    // Test 3: Get all templates
    console.log('\n3. Testing getAllTemplates...');
    const templates = await db.getAllTemplates();
    console.log(`✓ Found ${templates.length} templates`);
    if (templates.length > 0) {
      console.log('First template:', templates[0].name);
    }

    // Test 4: Get templates by category (if categories exist)
    if (categories.length > 0) {
      console.log('\n4. Testing getTemplatesByCategory...');
      const categoryTemplates = await db.getTemplatesByCategory(categories[0].id);
      console.log(`✓ Found ${categoryTemplates.length} templates in category "${categories[0].name}"`);
    }

    // Test 5: Create a test template
    console.log('\n5. Testing createTemplate...');
    const testTemplate = await db.createTemplate(
      'Test Template',
      categories.length > 0 ? categories[0].id : testCategory.id,
      'https://example.com/test-template.svg',
      [{ id: 1, type: 'text', x: 100, y: 100, width: 200, height: 50 }]
    );
    console.log('✓ Created test template:', testTemplate);

    // Test 6: Update the test template
    console.log('\n6. Testing updateTemplate...');
    const updatedTemplate = await db.updateTemplate(testTemplate.id, {
      name: 'Updated Test Template',
      description: 'Updated description'
    });
    console.log('✓ Updated test template:', updatedTemplate);

    // Test 7: Get admin by username (if admin exists)
    console.log('\n7. Testing getAdminByUsername...');
    try {
      const admin = await db.getAdminByUsername('admin');
      if (admin) {
        console.log('✓ Found admin user:', admin.username);
      } else {
        console.log('ℹ No admin user found (this is expected if no admin was migrated)');
      }
    } catch (error) {
      console.log('ℹ Admin table might not exist yet:', error.message);
    }

    // Test 8: Record a download
    console.log('\n8. Testing createDownload...');
    const download = await db.createDownload(testTemplate.id, 'Test User', '1234567890', 'https://example.com/generated-poster.jpg');
    console.log('✓ Recorded download:', download);

    // Test 9: Clean up - delete test template
    console.log('\n9. Testing deleteTemplate...');
    await db.deleteTemplate(testTemplate.id);
    console.log('✓ Deleted test template');

    // Test 10: Clean up - delete test category (if we created one)
    if (testCategory) {
      console.log('\n10. Cleaning up test category...');
      const { error } = await db.supabase
        .from('categories')
        .delete()
        .eq('id', testCategory.id);
      
      if (error) {
        console.log('⚠ Error deleting test category:', error.message);
      } else {
        console.log('✓ Deleted test category');
      }
    }

    console.log('\n🎉 All Supabase operations completed successfully!');
    console.log('The migration to Supabase is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error details:', error.message);
    
    if (error.message.includes('Missing Supabase environment variables')) {
      console.log('\n📝 Please update your .env file with actual Supabase credentials:');
      console.log('- SUPABASE_URL=your_actual_supabase_url');
      console.log('- SUPABASE_ANON_KEY=your_actual_anon_key');
      console.log('- SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key');
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testSupabaseOperations();
}

module.exports = { testSupabaseOperations };