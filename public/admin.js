// Global variables
let authToken = localStorage.getItem('adminToken');
let currentTemplate = null;
let templateFields = [];
let fieldCounter = 0;

// Initialize admin panel
document.addEventListener('DOMContentLoaded', function() {
    if (authToken) {
        showDashboard();
    } else {
        showLogin();
    }
    
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // Category form
    document.getElementById('addCategoryForm').addEventListener('submit', handleAddCategory);
    
    // Template form
    document.getElementById('addTemplateForm').addEventListener('submit', handleAddTemplate);
    
    // Template file upload
    document.getElementById('templateFile').addEventListener('change', handleTemplateUpload);
    
    // Mobile menu button
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', toggleMobileMenu);
    }
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(event) {
        const sidebar = document.getElementById('sidebar');
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        
        if (sidebar && mobileMenuBtn && 
            !sidebar.contains(event.target) && 
            !mobileMenuBtn.contains(event.target)) {
            sidebar.classList.remove('show');
        }
    });
    
    // Drag and drop for template upload
    const dragArea = document.querySelector('.drag-area');
    if (dragArea) {
        dragArea.addEventListener('dragover', handleDragOver);
        dragArea.addEventListener('drop', handleDrop);
        dragArea.addEventListener('dragleave', handleDragLeave);
    }
}

// Mobile menu functions
function toggleMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('show');
    }
}

// Authentication functions
async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            authToken = result.token;
            localStorage.setItem('adminToken', authToken);
            showDashboard();
        } else {
            showError(result.error || 'Login failed');
        }
    } catch (error) {
        showError('Login failed: ' + error.message);
    }
}

function logout() {
    authToken = null;
    localStorage.removeItem('adminToken');
    showLogin();
}

// UI Navigation
function showLogin() {
    document.getElementById('loginSection').classList.remove('hidden');
    document.getElementById('dashboardSection').classList.add('hidden');
}

function showDashboard() {
    document.getElementById('loginSection').classList.add('hidden');
    document.getElementById('dashboardSection').classList.remove('hidden');
    loadDashboardData();
}

function showSection(section) {
    // Hide all content sections
    document.querySelectorAll('[id$="Content"]').forEach(el => {
        el.classList.add('hidden');
    });
    
    // Remove active class from all nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(section + 'Content').classList.remove('hidden');
    
    // Add active class to clicked nav link
    event.target.classList.add('active');
    
    // Load section data
    switch (section) {
        case 'categories':
            loadCategories();
            break;
        case 'templates':
            loadTemplates();
            break;
        case 'downloads':
            loadDownloads();
            break;
    }
}

// Dashboard data loading
async function loadDashboardData() {
    try {
        // Load counts for dashboard overview
        const [categories, templates, downloads] = await Promise.all([
            fetch('/api/categories').then(r => r.json()),
            fetch('/api/templates').then(r => r.json()),
            fetch('/api/admin/downloads', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            }).then(r => r.ok ? r.json() : [])
        ]);
        
        document.getElementById('categoriesCount').textContent = categories.length;
        document.getElementById('templatesCount').textContent = templates.length;
        document.getElementById('downloadsCount').textContent = downloads.length;
        document.getElementById('usersCount').textContent = '0'; // Will be updated when user tracking is implemented
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// Categories management
async function loadCategories() {
    try {
        const response = await fetch('/api/categories');
        const categories = await response.json();
        
        const tbody = document.getElementById('categoriesTable');
        tbody.innerHTML = '';
        
        categories.forEach(category => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${category.id}</td>
                <td><strong>${category.name}</strong></td>
                <td>${category.description || '-'}</td>
                <td><span class="badge bg-primary">0</span></td>
                <td>${new Date(category.created_at).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteCategory(${category.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        // Update category select in template form
        updateCategorySelect(categories);
        
    } catch (error) {
        showError('Failed to load categories');
    }
}

function updateCategorySelect(categories) {
    const select = document.getElementById('templateCategorySelect');
    select.innerHTML = '<option value="">Select Category</option>';
    
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        select.appendChild(option);
    });
}

function showAddCategoryModal() {
    const modal = new bootstrap.Modal(document.getElementById('addCategoryModal'));
    modal.show();
}

async function handleAddCategory(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const categoryData = {
        name: formData.get('name'),
        description: formData.get('description')
    };
    
    try {
        const response = await fetch('/api/categories', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(categoryData)
        });
        
        if (response.ok) {
            showSuccess('Category added successfully');
            bootstrap.Modal.getInstance(document.getElementById('addCategoryModal')).hide();
            event.target.reset();
            loadCategories();
        } else {
            const error = await response.json();
            showError(error.error || 'Failed to add category');
        }
    } catch (error) {
        showError('Failed to add category: ' + error.message);
    }
}

// Templates management
async function loadTemplates() {
    try {
        const response = await fetch('/api/templates');
        const templates = await response.json();
        
        const tbody = document.getElementById('templatesTable');
        tbody.innerHTML = '';
        
        templates.forEach(template => {
            const row = document.createElement('tr');
            // Fix image path for templates - handle both local and R2 URLs
            const imageSrc = template.image_path.startsWith('http') ? template.image_path : `/${template.image_path}`;
            row.innerHTML = `
                <td>${template.id}</td>
                <td>
                    <img src="${imageSrc}" alt="${template.name}" 
                         style="width: 60px; height: 60px; object-fit: cover; border-radius: 5px;"
                         onerror="this.src='/uploads/templates/placeholder.svg'; this.onerror=null;">
                </td>
                <td><strong>${template.name}</strong></td>
                <td><span class="badge bg-info">${template.category_name || 'Uncategorized'}</span></td>
                <td><span class="badge bg-success">${template.fields.length} fields</span></td>
                <td>${new Date(template.created_at).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="editTemplate(${template.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteTemplate(${template.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
        
    } catch (error) {
        showError('Failed to load templates');
    }
}

function showAddTemplateModal() {
    // Reset form and fields
    document.getElementById('addTemplateForm').reset();
    document.getElementById('templateEditor').innerHTML = `
        <div class="text-center p-4 text-muted">
            Upload an image to start editing
        </div>
    `;
    document.getElementById('fieldsContainer').innerHTML = '';
    templateFields = [];
    fieldCounter = 0;
    
    const modal = new bootstrap.Modal(document.getElementById('addTemplateModal'));
    modal.show();
}

// Template file handling
function handleTemplateUpload(event) {
    const file = event.target.files[0];
    if (file) {
        displayTemplatePreview(file);
    }
}

function handleDragOver(event) {
    event.preventDefault();
    event.currentTarget.classList.add('dragover');
}

function handleDragLeave(event) {
    event.currentTarget.classList.remove('dragover');
}

function handleDrop(event) {
    event.preventDefault();
    event.currentTarget.classList.remove('dragover');
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        const file = files[0];
        document.getElementById('templateFile').files = files;
        displayTemplatePreview(file);
    }
}

function displayTemplatePreview(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const editor = document.getElementById('templateEditor');
        editor.innerHTML = `
            <img src="${e.target.result}" alt="Template Preview" class="template-image" id="templatePreview">
        `;
        
        // Update drag area
        const dragArea = document.querySelector('.drag-area');
        dragArea.innerHTML = `
            <i class="fas fa-check-circle fa-2x mb-2 text-success"></i>
            <p class="text-success">File selected: ${file.name}</p>
            <small class="text-muted">Click to change</small>
        `;
    };
    reader.readAsDataURL(file);
}

// Field management for template editor
function addField(type) {
    fieldCounter++;
    const fieldId = `field_${fieldCounter}`;
    
    const field = {
        id: fieldId,
        type: type,
        label: `${type.charAt(0).toUpperCase() + type.slice(1)} Field ${fieldCounter}`,
        x: 10,
        y: 10,
        width: type === 'text' ? 200 : 100,
        height: type === 'text' ? 30 : 100,
        required: false
    };
    
    if (type === 'text') {
        field.fontSize = 24;
        field.color = '#000000';
        field.align = 'left';
        field.fontFamily = 'Arial';
    }
    
    templateFields.push(field);
    renderFieldConfig(field);
    renderFieldOverlay(field);
}

function renderFieldConfig(field) {
    const container = document.getElementById('fieldsContainer');
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'field-config';
    fieldDiv.id = `config_${field.id}`;
    
    let specificFields = '';
    if (field.type === 'text') {
        specificFields = `
            <div class="row">
                <div class="col-md-3">
                    <label class="form-label">Font Family</label>
                    <select class="form-control" onchange="updateField('${field.id}', 'fontFamily', this.value)">
                        <option value="Arial" ${field.fontFamily === 'Arial' ? 'selected' : ''}>Arial</option>
                        <option value="Helvetica" ${field.fontFamily === 'Helvetica' ? 'selected' : ''}>Helvetica</option>
                        <option value="Times New Roman" ${field.fontFamily === 'Times New Roman' ? 'selected' : ''}>Times New Roman</option>
                        <option value="Georgia" ${field.fontFamily === 'Georgia' ? 'selected' : ''}>Georgia</option>
                        <option value="Verdana" ${field.fontFamily === 'Verdana' ? 'selected' : ''}>Verdana</option>
                        <option value="Trebuchet MS" ${field.fontFamily === 'Trebuchet MS' ? 'selected' : ''}>Trebuchet MS</option>
                        <option value="Impact" ${field.fontFamily === 'Impact' ? 'selected' : ''}>Impact</option>
                        <option value="Comic Sans MS" ${field.fontFamily === 'Comic Sans MS' ? 'selected' : ''}>Comic Sans MS</option>
                        <option value="Courier New" ${field.fontFamily === 'Courier New' ? 'selected' : ''}>Courier New</option>
                        <option value="Lucida Console" ${field.fontFamily === 'Lucida Console' ? 'selected' : ''}>Lucida Console</option>
                    </select>
                </div>
                <div class="col-md-3">
                    <label class="form-label">Font Size</label>
                    <input type="number" class="form-control" value="${field.fontSize}" 
                           onchange="updateField('${field.id}', 'fontSize', this.value)">
                </div>
                <div class="col-md-3">
                    <label class="form-label">Color</label>
                    <input type="color" class="form-control" value="${field.color}" 
                           onchange="updateField('${field.id}', 'color', this.value)">
                </div>
                <div class="col-md-3">
                    <label class="form-label">Alignment</label>
                    <select class="form-control" onchange="updateField('${field.id}', 'align', this.value)">
                        <option value="left" ${field.align === 'left' ? 'selected' : ''}>Left</option>
                        <option value="center" ${field.align === 'center' ? 'selected' : ''}>Center</option>
                        <option value="right" ${field.align === 'right' ? 'selected' : ''}>Right</option>
                    </select>
                </div>
            </div>
        `;
    }
    
    fieldDiv.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-2">
            <h6 class="mb-0">${field.label}</h6>
            <button type="button" class="btn btn-sm btn-outline-danger" onclick="removeField('${field.id}')">
                <i class="fas fa-trash"></i>
            </button>
        </div>
        
        <div class="row mb-2">
            <div class="col-md-6">
                <label class="form-label">Label</label>
                <input type="text" class="form-control" value="${field.label}" 
                       onchange="updateField('${field.id}', 'label', this.value)">
            </div>
            <div class="col-md-6">
                <div class="form-check mt-4">
                    <input class="form-check-input" type="checkbox" ${field.required ? 'checked' : ''} 
                           onchange="updateField('${field.id}', 'required', this.checked)">
                    <label class="form-check-label">Required Field</label>
                </div>
            </div>
        </div>
        
        <div class="row mb-2">
            <div class="col-md-3">
                <label class="form-label">X Position (%)</label>
                <input type="number" class="form-control" value="${field.x}" min="0" max="100"
                       onchange="updateField('${field.id}', 'x', this.value)">
            </div>
            <div class="col-md-3">
                <label class="form-label">Y Position (%)</label>
                <input type="number" class="form-control" value="${field.y}" min="0" max="100"
                       onchange="updateField('${field.id}', 'y', this.value)">
            </div>
            <div class="col-md-3">
                <label class="form-label">Width (%)</label>
                <input type="number" class="form-control" value="${field.width}" min="1" max="100"
                       onchange="updateField('${field.id}', 'width', this.value)">
            </div>
            <div class="col-md-3">
                <label class="form-label">Height (%)</label>
                <input type="number" class="form-control" value="${field.height}" min="1" max="100"
                       onchange="updateField('${field.id}', 'height', this.value)">
            </div>
        </div>
        
        ${specificFields}
    `;
    
    container.appendChild(fieldDiv);
}

function renderFieldOverlay(field) {
    const editor = document.getElementById('templateEditor');
    const preview = document.getElementById('templatePreview');
    
    if (!preview) return;
    
    const overlay = document.createElement('div');
    overlay.className = 'field-overlay';
    overlay.id = `overlay_${field.id}`;
    overlay.style.left = `${field.x}%`;
    overlay.style.top = `${field.y}%`;
    overlay.style.width = `${field.width}%`;
    overlay.style.height = `${field.height}%`;
    
    overlay.innerHTML = `
        <div class="field-label">${field.label}</div>
        <div class="field-controls">
            <button onclick="removeField('${field.id}')">×</button>
        </div>
    `;
    
    // Make draggable and resizable (basic implementation)
    overlay.addEventListener('mousedown', startDrag);
    
    editor.appendChild(overlay);
}

function updateField(fieldId, property, value) {
    const field = templateFields.find(f => f.id === fieldId);
    if (field) {
        field[property] = property === 'required' ? value : (isNaN(value) ? value : Number(value));
        
        // Update overlay if it exists
        const overlay = document.getElementById(`overlay_${fieldId}`);
        if (overlay) {
            if (property === 'x') overlay.style.left = `${value}%`;
            if (property === 'y') overlay.style.top = `${value}%`;
            if (property === 'width') overlay.style.width = `${value}%`;
            if (property === 'height') overlay.style.height = `${value}%`;
            if (property === 'label') {
                overlay.querySelector('.field-label').textContent = value;
            }
        }
    }
}

function removeField(fieldId) {
    // Remove from array
    templateFields = templateFields.filter(f => f.id !== fieldId);
    
    // Remove config
    const config = document.getElementById(`config_${fieldId}`);
    if (config) config.remove();
    
    // Remove overlay
    const overlay = document.getElementById(`overlay_${fieldId}`);
    if (overlay) overlay.remove();
}

// Basic drag functionality for field overlays
let dragElement = null;
let dragOffset = { x: 0, y: 0 };

function startDrag(event) {
    dragElement = event.currentTarget;
    const rect = dragElement.getBoundingClientRect();
    const parentRect = dragElement.parentElement.getBoundingClientRect();
    
    dragOffset.x = event.clientX - rect.left;
    dragOffset.y = event.clientY - rect.top;
    
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDrag);
    event.preventDefault();
}

function drag(event) {
    if (!dragElement) return;
    
    const parentRect = dragElement.parentElement.getBoundingClientRect();
    const x = ((event.clientX - dragOffset.x - parentRect.left) / parentRect.width) * 100;
    const y = ((event.clientY - dragOffset.y - parentRect.top) / parentRect.height) * 100;
    
    const fieldId = dragElement.id.replace('overlay_', '');
    updateField(fieldId, 'x', Math.max(0, Math.min(100, x)));
    updateField(fieldId, 'y', Math.max(0, Math.min(100, y)));
    
    // Update config inputs
    const configDiv = document.getElementById(`config_${fieldId}`);
    if (configDiv) {
        configDiv.querySelector('input[onchange*="x"]').value = Math.round(x);
        configDiv.querySelector('input[onchange*="y"]').value = Math.round(y);
    }
}

function stopDrag() {
    dragElement = null;
    document.removeEventListener('mousemove', drag);
    document.removeEventListener('mouseup', stopDrag);
}

// Handle template form submission
async function handleAddTemplate(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    formData.append('fields', JSON.stringify(templateFields));
    
    try {
        const response = await fetch('/api/templates', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            body: formData
        });
        
        if (response.ok) {
            showSuccess('Template added successfully');
            bootstrap.Modal.getInstance(document.getElementById('addTemplateModal')).hide();
            loadTemplates();
        } else {
            const error = await response.json();
            showError(error.error || 'Failed to add template');
        }
    } catch (error) {
        showError('Failed to add template: ' + error.message);
    }
}

// Downloads management
async function loadDownloads() {
    try {
        const response = await fetch('/api/admin/downloads', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch downloads');
        }
        
        const downloads = await response.json();
        const tbody = document.getElementById('downloadsTable');
        
        if (downloads.length === 0) {
            tbody.innerHTML = `
                 <tr>
                     <td colspan="6" class="text-center text-muted">
                         <i class="fas fa-info-circle"></i>
                         No downloads recorded yet
                     </td>
                 </tr>
             `;
            return;
        }
        
        tbody.innerHTML = downloads.map(download => `
            <tr>
                <td>${download.id}</td>
                <td>${download.user_name}</td>
                <td>${download.user_mobile}</td>
                <td>${download.templates?.name || 'Unknown Template'}</td>
                <td>${download.templates?.categories?.name || 'Unknown Category'}</td>
                <td>${new Date(download.created_at).toLocaleString()}</td>
            </tr>
        `).join('');
        
        // Update downloads count in dashboard
        document.getElementById('downloadsCount').textContent = downloads.length;
        
    } catch (error) {
        console.error('Error loading downloads:', error);
        const tbody = document.getElementById('downloadsTable');
        tbody.innerHTML = `
             <tr>
                 <td colspan="6" class="text-center text-danger">
                     <i class="fas fa-exclamation-triangle"></i>
                     Error loading downloads: ${error.message}
                 </td>
             </tr>
         `;
    }
}

// Template management functions
async function editTemplate(templateId) {
    try {
        const response = await fetch(`/api/admin/templates/${templateId}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch template');
        }
        
        const template = await response.json();
        currentTemplate = template;
        templateFields = JSON.parse(template.fields || '[]');
        
        // Switch to template editor tab
        document.querySelector('[data-bs-target="#templateEditor"]').click();
        
        // Load template data into form
        document.getElementById('templateName').value = template.name;
        document.getElementById('templateCategory').value = template.category_id;
        
        // Load template preview
        if (template.image_path) {
            const preview = document.getElementById('templatePreview');
            // Fix image path for templates - handle both local and R2 URLs
            const imageSrc = template.image_path.startsWith('http') ? template.image_path : `/${template.image_path}`;
            
            if (template.image_path.endsWith('.svg')) {
                const response = await fetch(imageSrc);
                const svgContent = await response.text();
                preview.innerHTML = svgContent;
            } else {
                preview.innerHTML = `<img src="${imageSrc}" alt="Template Preview" style="max-width: 100%; height: auto;" onerror="this.src='/uploads/templates/placeholder.svg'; this.onerror=null;">`;
            }
        }
        
        // Render fields
         renderTemplateFields();
        
        showSuccess('Template loaded for editing');
        
    } catch (error) {
        console.error('Error loading template:', error);
        showError('Failed to load template for editing');
    }
}

async function deleteTemplate(templateId) {
    if (!confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/templates/${templateId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete template');
        }
        
        showSuccess('Template deleted successfully');
        loadTemplates(); // Refresh the templates list
        
    } catch (error) {
        console.error('Error deleting template:', error);
        showError('Failed to delete template');
    }
}

function showError(message) {
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
    
    setTimeout(() => {
        if (alert.parentNode) {
            alert.parentNode.removeChild(alert);
        }
    }, 5000);
}

function showSuccess(message) {
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
    
    setTimeout(() => {
        if (alert.parentNode) {
            alert.parentNode.removeChild(alert);
        }
    }, 3000);
}