// Global variables
let selectedCategory = null;
let selectedTemplate = null;
let templateFields = [];
let allTemplates = [];
let allCategories = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadCategoriesAndTemplates();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Poster form submission
    document.getElementById('posterForm').addEventListener('submit', handlePosterGeneration);
    
    // Download form submission
    document.getElementById('downloadForm').addEventListener('submit', handleDownload);
}

// Load categories and templates
async function loadCategoriesAndTemplates() {
    try {
        console.log('Loading categories and templates...');
        
        // Load categories
        const categoriesResponse = await fetch('/api/categories');
        if (!categoriesResponse.ok) {
            throw new Error(`Categories API failed: ${categoriesResponse.status}`);
        }
        allCategories = await categoriesResponse.json();
        console.log('Categories loaded:', allCategories);
        
        // Load all templates
        const templatesResponse = await fetch('/api/templates');
        if (!templatesResponse.ok) {
            throw new Error(`Templates API failed: ${templatesResponse.status}`);
        }
        allTemplates = await templatesResponse.json();
        console.log('Templates loaded:', allTemplates);
        
        // Setup category filters
        setupCategoryFilters();
        
        // Display all templates initially
        displayTemplates(allTemplates, 'All Templates');
        
        console.log('Categories and templates loaded successfully');
        
    } catch (error) {
        console.error('Error loading data:', error);
        showError('Failed to load templates and categories: ' + error.message);
    }
}

// Setup category filter buttons
function setupCategoryFilters() {
    const container = document.getElementById('categoryFilterButtons');
    
    // Clear existing buttons except "All Templates"
    const allButton = container.querySelector('button');
    container.innerHTML = '';
    container.appendChild(allButton);
    
    // Add category filter buttons
    allCategories.forEach(category => {
        const button = document.createElement('button');
        button.className = 'btn btn-outline-primary category-filter-btn';
        button.onclick = () => filterByCategory(category.id, category.name);
        button.innerHTML = `<i class="fas fa-folder"></i> ${category.name}`;
        container.appendChild(button);
    });
}

// Show all templates
function showAllTemplates() {
    // Update active button
    document.querySelectorAll('.category-filter-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('button[onclick="showAllTemplates()"]').classList.add('active');
    
    // Display all templates
    displayTemplates(allTemplates, 'All Templates');
}

// Filter templates by category
function filterByCategory(categoryId, categoryName) {
    // Update active button
    document.querySelectorAll('.category-filter-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Filter templates
    const filteredTemplates = allTemplates.filter(template => template.category_id === categoryId);
    displayTemplates(filteredTemplates, categoryName);
}

// Display templates
function displayTemplates(templates, sectionTitle) {
    const container = document.getElementById('templatesContainer');
    const titleElement = document.getElementById('sectionTitle');
    const countElement = document.getElementById('templateCount');
    
    // Update title and count
    titleElement.textContent = sectionTitle;
    countElement.textContent = `${templates.length} template${templates.length !== 1 ? 's' : ''}`;
    
    // Clear container
    container.innerHTML = '';
    
    if (templates.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center">
                <div class="alert alert-info">
                    <i class="fas fa-info-circle"></i>
                    No templates available in this category yet.
                </div>
            </div>
        `;
        return;
    }
    
    // Add templates
    templates.forEach(template => {
        const categoryName = allCategories.find(cat => cat.id === template.category_id)?.name || 'Unknown';
        
        const templateCard = document.createElement('div');
        templateCard.className = 'col-lg-3 col-md-4 col-sm-6 mb-4';
        const imageSrc = template.image_path.startsWith('http') ? template.image_path : `/${template.image_path}`;
        
        templateCard.innerHTML = `
            <div class="template-card" data-template-id="${template.id}" data-template-name="${template.name}" data-template-path="${template.image_path}">
                <img src="${imageSrc}" alt="${template.name}" class="template-image">
                <div class="template-info">
                    <div class="template-name">${template.name}</div>
                    <div class="template-category">${categoryName}</div>
                    <div class="template-fields">
                        <i class="fas fa-edit"></i> ${template.fields.length} customizable field${template.fields.length !== 1 ? 's' : ''}
                    </div>
                </div>
            </div>
        `;
        
        // Store template fields data and add click event
        templateCard.querySelector('.template-card').templateFields = template.fields;
        templateCard.querySelector('.template-card').addEventListener('click', function() {
            selectTemplateForCustomization(this);
        });
        
        container.appendChild(templateCard);
    });
}

// Select template and show customization form
function selectTemplateForCustomization(templateElement) {
    try {
        const templateId = parseInt(templateElement.dataset.templateId);
        const templateName = templateElement.dataset.templateName;
        const imagePath = templateElement.dataset.templatePath;
        const fields = templateElement.templateFields;
        
        selectedTemplate = {
            id: templateId,
            name: templateName,
            imagePath: imagePath,
            fields: fields
        };
        
        templateFields = selectedTemplate.fields;
        
        // Update step indicator
        updateStepIndicator(3);
        
        // Generate form fields
        generateCustomizationForm();
        
        // Hide template display and show customization section
        document.getElementById('templateDisplaySection').classList.add('hidden');
        document.getElementById('categoryFilters').classList.add('hidden');
        document.getElementById('customizeSection').classList.remove('hidden');
    } catch (error) {
        console.error('Error selecting template:', error);
        showError('Failed to load template for customization');
    }
}

// Generate customization form based on template fields
function generateCustomizationForm() {
    const container = document.getElementById('fieldsContainer');
    container.innerHTML = '';
    
    if (templateFields.length === 0) {
        container.innerHTML = `
            <div class="alert alert-info text-center">
                <i class="fas fa-info-circle"></i>
                This template doesn't require any customization. You can generate it directly!
            </div>
        `;
        return;
    }
    
    templateFields.forEach((field, index) => {
        const fieldGroup = document.createElement('div');
        fieldGroup.className = 'field-group';
        
        let fieldHTML = '';
        
        switch (field.type) {
            case 'text':
                fieldHTML = `
                    <label class="field-label">${field.label || `Text Field ${index + 1}`}</label>
                    <input type="text" class="form-control" name="text_${field.id}" 
                           placeholder="${field.placeholder || 'Enter text'}" 
                           ${field.required ? 'required' : ''}>
                `;
                break;
                
            case 'image':
                fieldHTML = `
                    <label class="field-label">${field.label || `Image Field ${index + 1}`}</label>
                    <div class="custom-file-input" onclick="triggerFileInput('image_${field.id}')">
                        <i class="fas fa-cloud-upload-alt fa-2x mb-2"></i>
                        <p class="mb-0">Click to upload image</p>
                        <small class="text-muted">Supported: JPG, PNG, GIF</small>
                    </div>
                    <input type="file" id="image_${field.id}" name="userImage" 
                           accept="image/*" style="display: none;" 
                           onchange="handleFileSelect(this, 'image_${field.id}')"
                           ${field.required ? 'required' : ''}>
                `;
                break;
                
            case 'logo':
                fieldHTML = `
                    <label class="field-label">${field.label || `Logo Field ${index + 1}`}</label>
                    <div class="custom-file-input" onclick="triggerFileInput('logo_${field.id}')">
                        <i class="fas fa-image fa-2x mb-2"></i>
                        <p class="mb-0">Click to upload logo</p>
                        <small class="text-muted">Supported: JPG, PNG, GIF</small>
                    </div>
                    <input type="file" id="logo_${field.id}" name="userLogo" 
                           accept="image/*" style="display: none;" 
                           onchange="handleFileSelect(this, 'logo_${field.id}')"
                           ${field.required ? 'required' : ''}>
                `;
                break;
        }
        
        fieldGroup.innerHTML = fieldHTML;
        container.appendChild(fieldGroup);
    });
}

// Trigger file input
function triggerFileInput(inputId) {
    document.getElementById(inputId).click();
}

// Handle file selection
function handleFileSelect(input, fieldId) {
    const fileDiv = input.previousElementSibling;
    
    if (input.files && input.files[0]) {
        const fileName = input.files[0].name;
        fileDiv.classList.add('has-file');
        fileDiv.innerHTML = `
            <i class="fas fa-check-circle fa-2x mb-2 text-success"></i>
            <p class="mb-0 text-success">File selected: ${fileName}</p>
            <small class="text-muted">Click to change</small>
        `;
    }
}

// Handle poster generation
async function handlePosterGeneration(event) {
    event.preventDefault();
    
    // Show loading
    document.getElementById('customizeSection').classList.add('hidden');
    document.getElementById('loadingSection').classList.remove('hidden');
    
    try {
        const formData = new FormData();
        formData.append('templateId', selectedTemplate.id);
        
        // Collect text fields
        const textFields = {};
        templateFields.forEach(field => {
            if (field.type === 'text') {
                const input = document.querySelector(`input[name="text_${field.id}"]`);
                if (input && input.value) {
                    textFields[field.id] = input.value;
                }
            }
        });
        
        if (Object.keys(textFields).length > 0) {
            formData.append('textFields', JSON.stringify(textFields));
        }
        
        // Collect file uploads with correct field names
        templateFields.forEach(field => {
            if (field.type === 'image') {
                const input = document.getElementById(`image_${field.id}`);
                if (input && input.files[0]) {
                    formData.append('images', input.files[0], `image_${field.id}`);
                }
            } else if (field.type === 'logo') {
                const input = document.getElementById(`logo_${field.id}`);
                if (input && input.files[0]) {
                    formData.append('logos', input.files[0], `logo_${field.id}`);
                }
            }
        });
        
        // Temporary user details for generation
        formData.append('user_name', 'temp');
        formData.append('user_mobile', 'temp');
        
        const response = await fetch('/api/generate-poster', {
            method: 'POST',
            body: formData
        });
        
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}...`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            // Show download section
            document.getElementById('loadingSection').classList.add('hidden');
            document.getElementById('downloadSection').classList.remove('hidden');
            
            // Update step indicator
            updateStepIndicator(4);
            
            // Show preview
            document.getElementById('posterPreview').src = result.download_url;
            
            // Store download URL for later use
            window.generatedPosterUrl = result.download_url;
        } else {
            throw new Error(result.error || 'Failed to generate poster');
        }
        
    } catch (error) {
        console.error('Error generating poster:', error);
        showError('Failed to generate poster: ' + error.message);
        
        // Go back to customize section
        document.getElementById('loadingSection').classList.add('hidden');
        document.getElementById('customizeSection').classList.remove('hidden');
    }
}

// Handle download
async function handleDownload(event) {
    event.preventDefault();
    
    const userName = document.getElementById('userName').value;
    const userMobile = document.getElementById('userMobile').value;
    
    if (!userName || !userMobile) {
        showError('Please enter your name and mobile number');
        return;
    }
    
    try {
        // Create download link
        const link = document.createElement('a');
        link.href = window.generatedPosterUrl;
        link.download = `festival_poster_${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Show success message
        showSuccess('Poster downloaded successfully!');
        
        // Record download (optional - could be done server-side)
        fetch('/api/record-download', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                template_id: selectedTemplate.id,
                user_name: userName,
                user_mobile: userMobile
            })
        }).catch(console.error);
        
    } catch (error) {
        console.error('Error downloading poster:', error);
        showError('Failed to download poster');
    }
}

// Navigation functions
function goBack() {
    // Hide customization section and show template display
    document.getElementById('customizeSection').classList.add('hidden');
    document.getElementById('templateDisplaySection').classList.remove('hidden');
    document.getElementById('categoryFilters').classList.remove('hidden');
    updateStepIndicator(2);
}

function startOver() {
    // Reset all selections
    selectedCategory = null;
    selectedTemplate = null;
    templateFields = [];
    
    // Reset forms
    document.getElementById('posterForm').reset();
    document.getElementById('downloadForm').reset();
    
    // Show template display section
    document.getElementById('downloadSection').classList.add('hidden');
    document.getElementById('templateDisplaySection').classList.remove('hidden');
    document.getElementById('categoryFilters').classList.remove('hidden');
    
    // Reset to show all templates
    showAllTemplates();
    
    // Reset step indicator
    updateStepIndicator(1);
}

// Update step indicator
function updateStepIndicator(activeStep) {
    for (let i = 1; i <= 4; i++) {
        const step = document.getElementById(`step${i}`);
        step.classList.remove('active', 'completed');
        
        if (i < activeStep) {
            step.classList.add('completed');
        } else if (i === activeStep) {
            step.classList.add('active');
        }
    }
}

// Utility functions
function showError(message) {
    // Create and show error alert
    const alert = document.createElement('div');
    alert.className = 'alert alert-danger alert-dismissible fade show position-fixed';
    alert.style.top = '20px';
    alert.style.right = '20px';
    alert.style.zIndex = '9999';
    alert.innerHTML = `
        <i class="fas fa-exclamation-circle"></i> ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alert);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (alert.parentNode) {
            alert.parentNode.removeChild(alert);
        }
    }, 5000);
}

function showSuccess(message) {
    // Create and show success alert
    const alert = document.createElement('div');
    alert.className = 'alert alert-success alert-dismissible fade show position-fixed';
    alert.style.top = '20px';
    alert.style.right = '20px';
    alert.style.zIndex = '9999';
    alert.innerHTML = `
        <i class="fas fa-check-circle"></i> ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alert);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (alert.parentNode) {
            alert.parentNode.removeChild(alert);
        }
    }, 3000);
}