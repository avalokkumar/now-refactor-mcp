/**
 * File Upload Component
 * Handles file selection and upload for code analysis
 */

const FileUploadComponent = (function() {
  // Private variables
  let container = null;
  let fileInput = null;
  let dropArea = null;
  let selectedFile = null;
  let callbacks = {
    onFileSelected: null,
    onAnalyzeCode: null
  };

  // DOM creation
  function createDOM() {
    const template = `
      <div class="file-upload">
        <div class="file-upload-area" id="drop-area">
          <i class="fas fa-file-code"></i>
          <h3>Drag & Drop File</h3>
          <p>or click to browse</p>
          <p class="file-types">Supported file types: .js, .jsx, .ts, .tsx</p>
        </div>
        <input type="file" id="file-input" accept=".js,.jsx,.ts,.tsx" />
        <div class="file-info hidden" id="file-info">
          <div class="file-details">
            <i class="fas fa-file-code"></i>
            <div>
              <h4 id="file-name">filename.js</h4>
              <p id="file-size">0 KB</p>
            </div>
          </div>
          <button id="remove-file" class="btn btn-secondary">
            <i class="fas fa-times"></i> Remove
          </button>
        </div>
        <div class="file-upload-options">
          <button id="analyze-btn" class="btn btn-primary" disabled>
            <i class="fas fa-search"></i> Analyze Code
          </button>
          <button id="clear-btn" class="btn btn-secondary">
            <i class="fas fa-trash"></i> Clear
          </button>
        </div>
      </div>
    `;
    
    container.innerHTML = template;
  }

  // Initialize event listeners
  function initEventListeners() {
    fileInput = container.querySelector('#file-input');
    dropArea = container.querySelector('#drop-area');
    const fileInfo = container.querySelector('#file-info');
    const fileName = container.querySelector('#file-name');
    const fileSize = container.querySelector('#file-size');
    const removeFileBtn = container.querySelector('#remove-file');
    const analyzeBtn = container.querySelector('#analyze-btn');
    const clearBtn = container.querySelector('#clear-btn');

    // File input change
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        handleFileSelection(e.target.files[0]);
      }
    });

    // Drag and drop events
    dropArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropArea.classList.add('drag-over');
    });

    dropArea.addEventListener('dragleave', () => {
      dropArea.classList.remove('drag-over');
    });

    dropArea.addEventListener('drop', (e) => {
      e.preventDefault();
      dropArea.classList.remove('drag-over');
      
      if (e.dataTransfer.files.length > 0) {
        handleFileSelection(e.dataTransfer.files[0]);
      }
    });

    // Click to browse
    dropArea.addEventListener('click', () => {
      fileInput.click();
    });

    // Remove file
    removeFileBtn.addEventListener('click', () => {
      clearFile();
    });

    // Analyze button
    analyzeBtn.addEventListener('click', () => {
      if (callbacks.onAnalyzeCode && selectedFile) {
        callbacks.onAnalyzeCode(selectedFile);
      }
    });

    // Clear button
    clearBtn.addEventListener('click', () => {
      clearFile();
    });
  }

  // Handle file selection
  function handleFileSelection(file) {
    // Validate file type
    const validExtensions = ['.js', '.jsx', '.ts', '.tsx'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      showError(`Invalid file type. Supported types: ${validExtensions.join(', ')}`);
      return;
    }

    // Read file content
    const reader = new FileReader();
    reader.onload = (e) => {
      selectedFile = {
        name: file.name,
        type: file.type,
        size: file.size,
        content: e.target.result,
        extension: fileExtension
      };

      // Update UI
      updateFileInfo(selectedFile);
      
      // Enable analyze button
      const analyzeBtn = container.querySelector('#analyze-btn');
      analyzeBtn.disabled = false;
      
      // Call callback
      if (callbacks.onFileSelected) {
        callbacks.onFileSelected(selectedFile);
      }
    };
    
    reader.onerror = () => {
      showError('Error reading file');
    };
    
    reader.readAsText(file);
  }

  // Update file info display
  function updateFileInfo(file) {
    const fileInfo = container.querySelector('#file-info');
    const fileName = container.querySelector('#file-name');
    const fileSize = container.querySelector('#file-size');
    
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
    
    fileInfo.classList.remove('hidden');
    dropArea.classList.add('hidden');
  }

  // Clear selected file
  function clearFile() {
    selectedFile = null;
    fileInput.value = '';
    
    const fileInfo = container.querySelector('#file-info');
    const analyzeBtn = container.querySelector('#analyze-btn');
    
    fileInfo.classList.add('hidden');
    dropArea.classList.remove('hidden');
    analyzeBtn.disabled = true;
  }

  // Format file size
  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Show error message
  function showError(message) {
    alert(message); // Simple alert for now, can be replaced with a modal
  }

  // Public API
  return {
    init: function(options) {
      container = options.container;
      callbacks.onFileSelected = options.onFileSelected || null;
      callbacks.onAnalyzeCode = options.onAnalyzeCode || null;
      
      createDOM();
      initEventListeners();
      
      return this;
    },
    
    getSelectedFile: function() {
      return selectedFile;
    },
    
    clearFile: clearFile
  };
})();

// Export for global use
window.FileUploadComponent = FileUploadComponent;
