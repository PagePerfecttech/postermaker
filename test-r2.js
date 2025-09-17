const { uploadToR2, deleteFromR2, generateUniqueFilename, getMimeType } = require('./r2-config');
const fs = require('fs');
const path = require('path');

async function testR2Connection() {
    console.log('🧪 Testing Cloudflare R2 Connection...\n');
    
    try {
        // Create a test file
        const testContent = 'This is a test file for R2 connection';
        const testFileName = 'test-file.txt';
        const testFilePath = path.join(__dirname, testFileName);
        
        // Write test file locally
        fs.writeFileSync(testFilePath, testContent);
        console.log('✓ Created test file locally');
        
        // Test file upload
        console.log('\n1. Testing file upload to R2...');
        const buffer = fs.readFileSync(testFilePath);
        const uniqueFilename = generateUniqueFilename(testFileName);
        const mimeType = getMimeType(testFileName);
        
        console.log(`   - Unique filename: ${uniqueFilename}`);
        console.log(`   - MIME type: ${mimeType}`);
        
        const uploadResult = await uploadToR2(uniqueFilename, buffer, mimeType);
        console.log('✓ File uploaded successfully to R2');
        console.log(`   - Upload result: ${uploadResult}`);
        
        // Test file deletion
        console.log('\n2. Testing file deletion from R2...');
        await deleteFromR2(uniqueFilename);
        console.log('✓ File deleted successfully from R2');
        
        // Clean up local test file
        fs.unlinkSync(testFilePath);
        console.log('✓ Cleaned up local test file');
        
        console.log('\n🎉 All R2 tests passed successfully!');
        
    } catch (error) {
        console.error('❌ R2 test failed:', error.message);
        console.error('Error details:', error);
        
        // Clean up local test file if it exists
        const testFilePath = path.join(__dirname, 'test-file.txt');
        if (fs.existsSync(testFilePath)) {
            fs.unlinkSync(testFilePath);
            console.log('✓ Cleaned up local test file');
        }
        
        process.exit(1);
    }
}

// Run the test
testR2Connection();