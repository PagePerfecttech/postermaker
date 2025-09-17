// Festival Poster Maker - Modern Frontend
// Global state management
const AppState = {
    categories: [],
    templates: [],
    selectedCategory: null,
    selectedTemplate: null,
    isLoading: false,
    error: null
};

// DOM elements
const elements = {
    loadingState: null,
    errorState: null,
    errorMessage: null,
    categoriesSection: null,
    categoryFilters: null,
    templatesSection: null,
    sectionTitle: null,
    templateCount: null,
    templatesGrid: null,
    emptyState: null
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Festival Poster Maker initialized');
    initializeElements();
    loadData();
});

// Initialize DOM elements
function initializeElements() {
    elements.loadingState = document.getElementById('loadingState');
    elements.errorState = document.getElementById('errorState');
    elements.errorMessage = document.getElementById('errorMessage');
    elements.categoriesSection = document.getElementById('categoriesSection');
    elements.categoryFilters = document.getElementById('categoryFilters');
    elements.templatesSection = document.getElementById('templatesSection');
    elements.sectionTitle = document.getElementById('sectionTitle');
    elements.templateCount = document.getElementById('templateCount');
    elements.templatesGrid = document.getElementById('templatesGrid');
    elements.emptyState = document.getElementById('emptyState');
    
    console.log('✅ DOM elements initialized');
}

// Load categories and templates
async function loadData() {
    try {
        setLoadingState(true);
        setErrorState(false);
        
        console.log('📡 Loading categories and templates...');
        
        // Load both categories and templates in parallel
        const [categoriesResponse, templatesResponse] = await Promise.all([
            fetch('/api/categories'),
            fetch('/api/templates')
        ]);
        
        // Check if requests were successful
        if (!categoriesResponse.ok) {
            throw new Error(`Failed to load categories: ${categoriesResponse.status} ${categoriesResponse.statusText}`);
        }
        
        if (!templatesResponse.ok) {
            throw new Error(`Failed to load templates: ${templatesResponse.status} ${templatesResponse.statusText}`);
        }
        
        // Parse JSON responses
        const categories = await categoriesResponse.json();
        const templates = await templatesResponse.json();
        
        console.log('📊 Data loaded:', { 
            categories: categories.length, 
            templates: templates.length 
        });
        console.log('📋 Categories:', categories);
        console.log('🎨 Templates:', templates);
        
        // Update app state
        AppState.categories = categories;
        AppState.templates = templates;
        
        // Render UI
        renderCategories();
        renderTemplates();
        
        setLoadingState(false);
        
        console.log('✅ Application loaded successfully');
        
    } catch (error) {
        console.error('❌ Error loading data:', error);
        setErrorState(true, error.message);
        setLoadingState(false);
    }
}

// Set loading state
function setLoadingState(loading) {
    AppState.isLoading = loading;
    if (elements.loadingState) {
        elements.loadingState.style.display = loading ? 'block' : 'none';
    }
    if (elements.categoriesSection) {
        elements.categoriesSection.style.display = loading ? 'none' : 'block';
    }
    if (elements.templatesSection) {
        elements.templatesSection.style.display = loading ? 'none' : 'block';
    }
}

// Set error state
function setErrorState(show, message = '') {
    AppState.error = show ? message : null;
    if (elements.errorState) {
        elements.errorState.style.display = show ? 'block' : 'none';
    }
    if (elements.errorMessage) {
        elements.errorMessage.textContent = message;
    }
    if (elements.categoriesSection) {
        elements.categoriesSection.style.display = show ? 'none' : 'block';
    }
    if (elements.templatesSection) {
        elements.templatesSection.style.display = show ? 'none' : 'block';
    }
}

// Render categories
function renderCategories() {
    if (!elements.categoryFilters || !AppState.categories.length) {
        console.log('⚠️ No categories to render or category filters element not found');
        return;
    }
    
    console.log('🎯 Rendering categories:', AppState.categories.length);
    
    // Create "All" category button
    const allButton = createCategoryButton({
        id: 'all',
        name: 'All Templates',
        description: 'Show all templates'
    }, true);
    
    // Create category buttons
    const categoryButtons = AppState.categories.map(category => 
        createCategoryButton(category, false)
    );
    
    // Clear and populate filters
    elements.categoryFilters.innerHTML = '';
    elements.categoryFilters.appendChild(allButton);
    categoryButtons.forEach(button => elements.categoryFilters.appendChild(button));
    
    console.log('✅ Categories rendered successfully');
}

// Create category button
function createCategoryButton(category, isActive = false) {
    const button = document.createElement('button');
    button.className = `category-btn ${isActive ? 'active' : ''}`;
    button.textContent = category.name;
    button.setAttribute('data-category-id', category.id);
    
    button.addEventListener('click', () => {
        selectCategory(category.id === 'all' ? null : category.id, category.name);
    });
    
    return button;
}

// Select category
function selectCategory(categoryId, categoryName) {
    console.log('🎯 Category selected:', { categoryId, categoryName });
    
    AppState.selectedCategory = categoryId;
    
    // Update active button
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const selectedButton = document.querySelector(`[data-category-id="${categoryId || 'all'}"]`);
    if (selectedButton) {
        selectedButton.classList.add('active');
    }
    
    // Filter and render templates
    const filteredTemplates = categoryId 
        ? AppState.templates.filter(template => template.category_id === categoryId)
        : AppState.templates;
    
    renderTemplates(filteredTemplates, categoryName || 'All Templates');
}

// Render templates
function renderTemplates(templates = AppState.templates, title = 'All Templates') {
    console.log('🎨 Rendering templates:', { 
        count: templates.length, 
        title,
        templates: templates.map(t => ({ id: t.id, name: t.name, category_id: t.category_id }))
    });
    
    if (!elements.templatesGrid || !elements.sectionTitle || !elements.templateCount) {
        console.error('❌ Template elements not found');
        return;
    }
    
    // Update section title and count
    elements.sectionTitle.innerHTML = `<i class="fas fa-images"></i> ${title}`;
    elements.templateCount.textContent = `${templates.length} template${templates.length !== 1 ? 's' : ''}`;
    
    // Clear templates grid
    elements.templatesGrid.innerHTML = '';
    
    // Show/hide empty state
    if (elements.emptyState) {
        elements.emptyState.style.display = templates.length === 0 ? 'block' : 'none';
    }
    
    // Render templates
    if (templates.length === 0) {
        console.log('📭 No templates to display');
        return;
    }
    
    templates.forEach((template, index) => {
        console.log(`🎨 Rendering template ${index + 1}:`, {
            id: template.id,
            name: template.name,
            image_path: template.image_path,
            fields_count: template.fields ? template.fields.length : 0
        });
        
        const templateCard = createTemplateCard(template);
        elements.templatesGrid.appendChild(templateCard);
    });
    
    console.log('✅ Templates rendered successfully');
}

// Create template card
function createTemplateCard(template) {
    const card = document.createElement('div');
    card.className = 'template-card fade-in';
    card.setAttribute('data-template-id', template.id);
    
    // Validate template data
    if (!template.name || !template.id) {
        console.warn('⚠️ Invalid template data:', template);
        return card;
    }
    
    // Create fields badges
    const fieldsHTML = template.fields && Array.isArray(template.fields) 
        ? template.fields.map(field => 
            `<span class="field-badge">${field.label || field.name || 'Field'}</span>`
          ).join('')
        : '';
    
    // Handle image path
    const imagePath = template.image_path || '/images/default-template.jpg';
    console.log(`🖼️ Template "${template.name}" image:`, imagePath);
    
    card.innerHTML = `
        <img src="${imagePath}" 
             class="template-image" 
             alt="${template.name}"
             loading="lazy"
             onerror="this.src='/images/default-template.jpg'; console.log('🖼️ Image failed to load for template: ${template.name}');">
        <div class="template-content">
            <h3 class="template-title">${template.name}</h3>
            <div class="template-fields">
                ${fieldsHTML}
            </div>
            <button class="use-template-btn" onclick="selectTemplate(${template.id})">
                <i class="fas fa-magic"></i> Use This Template
            </button>
        </div>
    `;
    
    return card;
}

// Select template and show customization form
function selectTemplate(templateId) {
    console.log('🎯 Template selected:', templateId);
    
    const template = AppState.templates.find(t => t.id === templateId);
    if (!template) {
        console.error('❌ Template not found:', templateId);
        return;
    }
    
    AppState.selectedTemplate = template;
    
    // Hide main content and show customization form
    hideMainContent();
    showCustomizationForm(template);
}

// Utility function to refresh data
function refreshData() {
    console.log('🔄 Refreshing data...');
    loadData();
}

// Add refresh functionality to window
window.refreshData = refreshData;

// Add template selection to window
window.selectTemplate = selectTemplate;

// Hide main content sections
function hideMainContent() {
    const sections = ['categoriesSection', 'templatesSection'];
    sections.forEach(sectionId => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.style.display = 'none';
        }
    });
}

// Show main content sections
function showMainContent() {
    const sections = ['categoriesSection', 'templatesSection'];
    sections.forEach(sectionId => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.style.display = 'block';
        }
    });
}

// Show customization form
function showCustomizationForm(template) {
    console.log('🎨 Showing customization form for template:', template.name);
    
    const customizationSection = document.getElementById('customizationSection');
    const customizationTitle = document.getElementById('customizationTitle');
    const templatePreview = document.getElementById('templatePreview');
    const customizationFields = document.getElementById('customizationFields');
    
    if (!customizationSection) {
        console.error('❌ Customization section not found');
        return;
    }
    
    // Update title
    if (customizationTitle) {
        customizationTitle.textContent = `Customize "${template.name}"`;
    }
    
    // Show template preview
    if (templatePreview) {
        const imagePath = template.image_path || '/images/default-template.jpg';
        templatePreview.innerHTML = `
            <img src="${imagePath}" 
                 alt="${template.name}" 
                 style="max-width: 100%; max-height: 280px; object-fit: contain; border-radius: 0.25rem;"
                 onerror="this.src='/images/default-template.jpg';">
        `;
    }
    
    // Generate customization fields
    if (customizationFields && template.fields) {
        customizationFields.innerHTML = '';
        
        template.fields.forEach((field, index) => {
            const fieldHTML = createCustomizationField(field, index);
            customizationFields.appendChild(fieldHTML);
        });
    }
    
    // Show customization section
    customizationSection.style.display = 'block';
    customizationSection.scrollIntoView({ behavior: 'smooth' });
}

// Create customization field
function createCustomizationField(field, index) {
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'form-group';
    
    const label = document.createElement('label');
    label.textContent = field.label || field.name || `Field ${index + 1}`;
    if (field.required) {
        label.innerHTML += ' <span style="color: red;">*</span>';
    }
    
    let inputHTML = '';
    
    if (field.type === 'text') {
        inputHTML = `
            <input type="text" 
                   class="form-control" 
                   name="${field.id || `field_${index}`}"
                   placeholder="Enter ${field.label || field.name || 'text'}"
                   ${field.required ? 'required' : ''}
                   data-field-type="text"
                   data-field-id="${field.id || `field_${index}`}"
                   oninput="updateLivePreview()">
        `;
    } else if (field.type === 'image') {
        inputHTML = `
            <div class="file-upload">
                <input type="file" 
                       class="form-control" 
                       name="${field.id || `field_${index}`}"
                       accept="image/*"
                       ${field.required ? 'required' : ''}
                       data-field-type="image"
                       data-field-id="${field.id || `field_${index}`}"
                       onchange="handleImageUpload(this)">
                <label class="file-upload-label" for="${field.id || `field_${index}`}">
                    <i class="fas fa-cloud-upload-alt"></i>
                    <br><strong>Click to upload image</strong>
                    <br><small>for ${field.label || field.name || 'image'}</small>
                </label>
                <div class="uploaded-image-preview" style="display: none;">
                    <img src="" alt="Uploaded image">
                    <div class="file-info"></div>
                </div>
            </div>
        `;
    } else {
        // Default to text input
        inputHTML = `
            <input type="text" 
                   class="form-control" 
                   name="${field.id || `field_${index}`}"
                   placeholder="Enter ${field.label || field.name || 'value'}"
                   ${field.required ? 'required' : ''}
                   data-field-type="text"
                   data-field-id="${field.id || `field_${index}`}"
                   oninput="updateLivePreview()">
        `;
    }
    
    fieldDiv.appendChild(label);
    fieldDiv.innerHTML += inputHTML;
    
    return fieldDiv;
}

// Go back to templates
function goBackToTemplates() {
    console.log('⬅️ Going back to templates');
    
    const customizationSection = document.getElementById('customizationSection');
    const generatedPosterSection = document.getElementById('generatedPosterSection');
    
    if (customizationSection) {
        customizationSection.style.display = 'none';
    }
    if (generatedPosterSection) {
        generatedPosterSection.style.display = 'none';
    }
    
    showMainContent();
}

// Reset customization
function resetCustomization() {
    console.log('🔄 Resetting customization');
    
    const form = document.getElementById('posterCustomizationForm');
    if (form) {
        form.reset();
    }
    
    // Reset all file upload fields
    const fileUploads = document.querySelectorAll('.file-upload');
    fileUploads.forEach(upload => {
        const label = upload.querySelector('.file-upload-label');
        const preview = upload.querySelector('.uploaded-image-preview');
        const input = upload.querySelector('input[type="file"]');
        
        if (label && preview && input) {
            // Reset label
            label.classList.remove('has-file');
            const fieldId = input.dataset.fieldId;
            const fieldLabel = input.dataset.fieldLabel || 'image';
            label.innerHTML = `
                <i class="fas fa-cloud-upload-alt"></i>
                <br><strong>Click to upload image</strong>
                <br><small>for ${fieldLabel}</small>
            `;
            
            // Hide preview
            preview.style.display = 'none';
            preview.querySelector('img').src = '';
            preview.querySelector('.file-info').textContent = '';
        }
    });
    
    // Update live preview
    updateLivePreview();
}

// Handle poster generation
async function handlePosterGeneration(event) {
    event.preventDefault();
    console.log('🎨 Generating poster...');
    
    if (!AppState.selectedTemplate) {
        console.error('❌ No template selected');
        alert('Please select a template first.');
        return;
    }
    
    try {
        // Show loading state
        showLoadingState('Generating your poster...');
        
        // Collect form data in the format expected by the server
        const formData = new FormData();
        formData.append('templateId', AppState.selectedTemplate.id);
        
        // Collect text fields
        const textFields = {};
        const imageFiles = [];
        const logoFiles = [];
        
        const inputs = document.querySelectorAll('#customizationFields input');
        
        inputs.forEach(input => {
            const fieldId = input.dataset.fieldId;
            const fieldType = input.dataset.fieldType;
            
            if (fieldType === 'image' && input.files.length > 0) {
                // Add to images array for server
                imageFiles.push(input.files[0]);
                // Also store field reference
                textFields[`${fieldId}_type`] = 'image';
            } else if (fieldType === 'text' && input.value.trim()) {
                // Store text field value
                textFields[fieldId] = input.value.trim();
            }
        });
        
        // Append text fields as JSON
        formData.append('textFields', JSON.stringify(textFields));
        
        // Append image files
        imageFiles.forEach((file, index) => {
            formData.append('images', file);
        });
        
        console.log('📤 Sending poster generation request...');
        console.log('Template ID:', AppState.selectedTemplate.id);
        console.log('Text fields:', textFields);
        console.log('Image files:', imageFiles.length);
        
        // Send request to server
        const response = await fetch('/api/generate-poster', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(errorData.error || `Server error: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('✅ Poster generated successfully:', result);
        
        // Hide loading state
        hideLoadingState();
        
        // Show generated poster
        showGeneratedPoster(result);
        
    } catch (error) {
        console.error('❌ Error generating poster:', error);
        hideLoadingState();
        alert(`Failed to generate poster: ${error.message}`);
    }
}

// Add form event listener
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('posterCustomizationForm');
    if (form) {
        form.addEventListener('submit', handlePosterGeneration);
    }
});

// Show loading state
function showLoadingState(message = 'Loading...') {
    // Create or show loading overlay
    let loadingOverlay = document.getElementById('loadingOverlay');
    if (!loadingOverlay) {
        loadingOverlay = document.createElement('div');
        loadingOverlay.id = 'loadingOverlay';
        loadingOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            color: white;
        `;
        document.body.appendChild(loadingOverlay);
    }
    
    loadingOverlay.innerHTML = `
        <div class="spinner" style="width: 3rem; height: 3rem; border: 4px solid rgba(255,255,255,0.3); border-top: 4px solid white; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 1rem;"></div>
        <h3>${message}</h3>
    `;
    loadingOverlay.style.display = 'flex';
}

// Hide loading state
function hideLoadingState() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
}

// Show generated poster
function showGeneratedPoster(result) {
    console.log('🖼️ Showing generated poster:', result);
    
    const customizationSection = document.getElementById('customizationSection');
    const generatedPosterSection = document.getElementById('generatedPosterSection');
    const generatedPosterImage = document.getElementById('generatedPosterImage');
    const posterDetails = document.getElementById('posterDetails');
    
    if (customizationSection) {
        customizationSection.style.display = 'none';
    }
    
    if (generatedPosterSection) {
        generatedPosterSection.style.display = 'block';
    }
    
    if (generatedPosterImage && result.posterUrl) {
        generatedPosterImage.src = result.posterUrl;
        generatedPosterImage.alt = `Generated poster for ${AppState.selectedTemplate.name}`;
    }
    
    if (posterDetails) {
        posterDetails.innerHTML = `
            <div class="detail-item">
                <strong>Template:</strong> ${AppState.selectedTemplate.name}
            </div>
            <div class="detail-item">
                <strong>Generated:</strong> ${new Date().toLocaleString()}
            </div>
            <div class="detail-item">
                <strong>Filename:</strong> ${result.filename || 'poster.jpg'}
            </div>
        `;
    }
    
    // Store generated poster data
    AppState.generatedPoster = result;
    
    generatedPosterSection.scrollIntoView({ behavior: 'smooth' });
}

// Download poster
function downloadPoster() {
    console.log('📥 Downloading poster...');
    
    if (!AppState.generatedPoster || !AppState.generatedPoster.posterUrl) {
        alert('No poster available for download.');
        return;
    }
    
    // Create download link
    const link = document.createElement('a');
    link.href = AppState.generatedPoster.posterUrl;
    link.download = AppState.generatedPoster.filename || `poster_${AppState.selectedTemplate.name}_${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Generate new poster
function generateNewPoster() {
    console.log('🆕 Generating new poster...');
    
    // Go back to customization form
    goBackToCustomization();
}

// Go back to customization
function goBackToCustomization() {
    console.log('⬅️ Going back to customization');
    
    const generatedPosterSection = document.getElementById('generatedPosterSection');
    if (generatedPosterSection) {
        generatedPosterSection.style.display = 'none';
    }
    
    const customizationSection = document.getElementById('customizationSection');
    if (customizationSection) {
        customizationSection.style.display = 'block';
    }
}

// Handle image upload
function handleImageUpload(input) {
    console.log('📸 Handling image upload...');
    
    const file = input.files[0];
    if (!file) return;
    
    // Show uploaded image preview
    const fileUploadContainer = input.closest('.file-upload');
    const label = fileUploadContainer.querySelector('.file-upload-label');
    const preview = fileUploadContainer.querySelector('.uploaded-image-preview');
    const previewImg = preview.querySelector('img');
    const fileInfo = preview.querySelector('.file-info');
    
    // Update label to show file is selected
    label.classList.add('has-file');
    label.innerHTML = `
        <i class="fas fa-check-circle" style="color: var(--success-color);"></i>
        <br><strong>Image uploaded!</strong>
        <br><small>Click to change</small>
    `;
    
    // Create preview URL
    const previewURL = URL.createObjectURL(file);
    previewImg.src = previewURL;
    fileInfo.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
    preview.style.display = 'block';
    
    // Update live preview
    updateLivePreview();
    
    console.log('✅ Image uploaded and preview updated');
}

// Update live preview
function updateLivePreview() {
    console.log('🔄 Updating live preview...');
    
    if (!AppState.selectedTemplate) {
        return;
    }
    
    const templatePreview = document.getElementById('templatePreview');
    if (!templatePreview) {
        return;
    }
    
    // Create a preview container with the template image
    const imagePath = AppState.selectedTemplate.image_path || '/images/default-template.jpg';
    let previewHTML = `
        <div style="position: relative; display: inline-block; max-width: 100%;">
            <img src="${imagePath}" 
                 alt="${AppState.selectedTemplate.name}" 
                 style="max-width: 100%; max-height: 200px; object-fit: contain; border-radius: 0.25rem;">
            <div id="previewOverlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;"></div>
        </div>
    `;
    
    templatePreview.innerHTML = previewHTML;
    
    // Add text overlays for text fields
    const inputs = document.querySelectorAll('#customizationFields input');
    const overlay = document.getElementById('previewOverlay');
    
    if (overlay && AppState.selectedTemplate.fields) {
        AppState.selectedTemplate.fields.forEach(field => {
            if (field.type === 'text') {
                const input = document.querySelector(`[data-field-id="${field.id}"]`);
                if (input && input.value.trim()) {
                    const textDiv = document.createElement('div');
                    textDiv.style.cssText = `
                        position: absolute;
                        left: ${field.x}%;
                        top: ${field.y}%;
                        width: ${field.width}%;
                        height: ${field.height}%;
                        color: ${field.color || '#000000'};
                        font-size: ${(field.fontSize || 24) * 0.25}px;
                        font-weight: bold;
                        display: flex;
                        align-items: center;
                        text-align: ${field.align || 'left'};
                        overflow: hidden;
                        text-shadow: 1px 1px 2px rgba(255,255,255,0.8);
                        line-height: 1;
                    `;
                    textDiv.textContent = input.value;
                    overlay.appendChild(textDiv);
                }
            } else if (field.type === 'image') {
                const input = document.querySelector(`[data-field-id="${field.id}"]`);
                if (input && input.files.length > 0) {
                    const file = input.files[0];
                    const previewURL = URL.createObjectURL(file);
                    
                    const imageDiv = document.createElement('div');
                    imageDiv.style.cssText = `
                        position: absolute;
                        left: ${field.x}%;
                        top: ${field.y}%;
                        width: ${field.width}%;
                        height: ${field.height}%;
                        overflow: hidden;
                        border-radius: 2px;
                    `;
                    
                    const img = document.createElement('img');
                    img.src = previewURL;
                    img.style.cssText = `
                        width: 100%;
                        height: 100%;
                        object-fit: cover;
                    `;
                    
                    imageDiv.appendChild(img);
                    overlay.appendChild(imageDiv);
                }
            }
        });
    }
}

// Show download modal
function showDownloadModal() {
    console.log('📥 Showing download modal...');
    
    const downloadModal = document.getElementById('downloadModal');
    if (downloadModal) {
        downloadModal.style.display = 'flex';
    }
}

// Close download modal
function closeDownloadModal() {
    console.log('❌ Closing download modal...');
    
    const downloadModal = document.getElementById('downloadModal');
    if (downloadModal) {
        downloadModal.style.display = 'none';
    }
}

// Process download with user information
function processDownload() {
    console.log('📥 Processing download with user information...');
    
    const userName = document.getElementById('userName').value.trim();
    const userMobile = document.getElementById('userMobile').value.trim();
    
    // Validate required fields
    if (!userName) {
        alert('Please enter your name.');
        return;
    }
    
    if (!userMobile) {
        alert('Please enter your mobile number.');
        return;
    }
    
    // Validate mobile number format
    if (!/^[0-9]{10}$/.test(userMobile)) {
        alert('Please enter a valid 10-digit mobile number.');
        return;
    }
    
    // Save user information and download
    saveUserInfoAndDownload(userName, userMobile);
}

// Save user information and download poster
async function saveUserInfoAndDownload(userName, userMobile) {
    try {
        // Show loading state
        showLoadingState('Preparing download...');
        
        // Save user information to server
        const userData = {
            name: userName,
            mobile: userMobile,
            template_id: AppState.selectedTemplate.id,
            template_name: AppState.selectedTemplate.name,
            generated_at: new Date().toISOString()
        };
        
        console.log('💾 Saving user information:', userData);
        
        // Send user data to server
        try {
            const response = await fetch('/api/track-download', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });
            
            if (response.ok) {
                console.log('✅ User data saved successfully');
            }
        } catch (error) {
            console.log('⚠️ Could not save user data:', error);
        }
        
        // Hide loading state
        hideLoadingState();
        
        // Close modal
        closeDownloadModal();
        
        // Download the poster
        downloadPoster();
        
        // Show success message
        alert(`Thank you ${userName}! Your poster has been downloaded.`);
        
    } catch (error) {
        console.error('❌ Error processing download:', error);
        hideLoadingState();
        alert('Failed to process download. Please try again.');
    }
}

// Add global functions
window.goBackToTemplates = goBackToTemplates;
window.resetCustomization = resetCustomization;
window.downloadPoster = downloadPoster;
window.generateNewPoster = generateNewPoster;
window.goBackToCustomization = goBackToCustomization;
window.updateLivePreview = updateLivePreview;
window.handleImageUpload = handleImageUpload;
window.showDownloadModal = showDownloadModal;
window.closeDownloadModal = closeDownloadModal;
window.processDownload = processDownload;

console.log('🎉 Festival Poster Maker app.js loaded successfully');
