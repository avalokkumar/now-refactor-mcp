/**
 * Main application script for ServiceNow Code Intelligence & Refactoring UI
 */

// Application state
const appState = {
  currentFile: null,
  analysisResult: null,
  selectedSuggestion: null,
  isLoading: false,
  activeTab: 'issues',
};

// DOM Elements
const elements = {
  fileUploadContainer: document.getElementById('file-upload-container'),
  resultsContainer: document.getElementById('results-container'),
  resultsDisplayContainer: document.getElementById('results-display-container'),
  comparisonContainer: document.getElementById('comparison-container'),
  codeComparisonContainer: document.getElementById('code-comparison-container'),
  reportGeneratorContainer: document.getElementById('report-generator-container'),
  downloadReportBtn: document.getElementById('download-report-btn'),
  applyChangesBtn: document.getElementById('apply-changes-btn'),
  cancelChangesBtn: document.getElementById('cancel-changes-btn'),
  modal: document.getElementById('modal'),
  modalTitle: document.getElementById('modal-title'),
  modalMessage: document.getElementById('modal-message'),
  modalConfirm: document.getElementById('modal-confirm'),
  modalCancel: document.getElementById('modal-cancel'),
  modalClose: document.querySelector('.close'),
  loadingOverlay: document.getElementById('loading-overlay'),
  loadingMessage: document.getElementById('loading-message'),
};

// Initialize components
function initializeComponents() {
  // Initialize file upload component
  if (window.FileUploadComponent) {
    window.FileUploadComponent.init({
      container: elements.fileUploadContainer,
      onFileSelected: handleFileSelected,
      onAnalyzeCode: handleAnalyzeCode,
    });
  }

  // Initialize results display component (when needed)
  // Will be initialized after analysis is complete

  // Initialize event listeners
  elements.downloadReportBtn.addEventListener('click', handleDownloadReport);
  elements.applyChangesBtn.addEventListener('click', handleApplyChanges);
  elements.cancelChangesBtn.addEventListener('click', handleCancelChanges);
  elements.modalClose.addEventListener('click', closeModal);
  elements.modalCancel.addEventListener('click', closeModal);
}

// Event Handlers
async function handleFileSelected(file) {
  appState.currentFile = file;
  console.log('File selected:', file.name);
}

async function handleAnalyzeCode() {
  if (!appState.currentFile) {
    showModal('Error', 'Please select a file to analyze.', 'error');
    return;
  }

  try {
    showLoading('Analyzing code...');
    
    // Use API service to analyze code
    if (window.ApiService) {
      const result = await window.ApiService.analyzeFile(appState.currentFile);
      appState.analysisResult = result;
      
      // Initialize and show results
      showResults();
    } else {
      throw new Error('API service not available');
    }
  } catch (error) {
    console.error('Analysis error:', error);
    showModal('Analysis Error', `Failed to analyze code: ${error.message}`, 'error');
  } finally {
    hideLoading();
  }
}

function showResults() {
  // Hide file upload, show results
  elements.resultsContainer.classList.remove('hidden');
  
  // Initialize results display component
  if (window.ResultsDisplayComponent) {
    window.ResultsDisplayComponent.init({
      container: elements.resultsDisplayContainer,
      analysisResult: appState.analysisResult,
      onViewSuggestion: handleViewSuggestion,
    });
  }
}

function handleViewSuggestion(suggestion) {
  appState.selectedSuggestion = suggestion;
  
  // Show code comparison
  elements.comparisonContainer.classList.remove('hidden');
  
  // Initialize code comparison component
  if (window.CodeComparisonComponent) {
    window.CodeComparisonComponent.init({
      container: elements.codeComparisonContainer,
      originalCode: appState.currentFile ? appState.currentFile.content : '',
      suggestion: suggestion,
    });
  }
  
  // Scroll to comparison
  elements.comparisonContainer.scrollIntoView({ behavior: 'smooth' });
}

async function handleApplyChanges() {
  if (!appState.selectedSuggestion) {
    showModal('Error', 'No suggestion selected to apply.', 'error');
    return;
  }

  try {
    showLoading('Applying changes...');
    
    // Use API service to apply refactoring
    if (window.ApiService) {
      const result = await window.ApiService.applyRefactoring(
        appState.selectedSuggestion.id,
        appState.currentFile.content,
        appState.currentFile.name
      );
      
      // Update file content with refactored code
      if (appState.currentFile) {
        appState.currentFile.content = result.refactoredCode;
      }
      
      // Hide comparison
      elements.comparisonContainer.classList.add('hidden');
      
      // Show success message
      showModal('Success', 'Changes applied successfully!', 'success');
    } else {
      throw new Error('API service not available');
    }
  } catch (error) {
    console.error('Apply changes error:', error);
    showModal('Error', `Failed to apply changes: ${error.message}`, 'error');
  } finally {
    hideLoading();
  }
}

function handleCancelChanges() {
  // Hide comparison
  elements.comparisonContainer.classList.add('hidden');
  appState.selectedSuggestion = null;
}

function handleDownloadReport() {
  if (!appState.analysisResult) {
    showModal('Error', 'No analysis results to generate report.', 'error');
    return;
  }

  // Show report generator
  elements.reportGeneratorContainer.classList.remove('hidden');
  
  // Initialize report generator component
  if (window.ReportGeneratorComponent) {
    window.ReportGeneratorComponent.init({
      container: elements.reportGeneratorContainer,
      analysisResult: appState.analysisResult,
      fileName: appState.currentFile ? appState.currentFile.name : 'unknown',
      onGenerateReport: handleGenerateReport,
      onCancelReport: handleCancelReport,
    });
  }
  
  // Scroll to report generator
  elements.reportGeneratorContainer.scrollIntoView({ behavior: 'smooth' });
}

async function handleGenerateReport(options) {
  try {
    showLoading('Generating report...');
    
    // Use API service to generate report
    if (window.ApiService) {
      await window.ApiService.generateReport(appState.analysisResult.analysisId, options);
      
      // Hide report generator
      elements.reportGeneratorContainer.classList.add('hidden');
      
      // Show success message
      showModal('Success', 'Report generated and downloaded successfully!', 'success');
    } else {
      throw new Error('API service not available');
    }
  } catch (error) {
    console.error('Report generation error:', error);
    showModal('Error', `Failed to generate report: ${error.message}`, 'error');
  } finally {
    hideLoading();
  }
}

function handleCancelReport() {
  // Hide report generator
  elements.reportGeneratorContainer.classList.add('hidden');
}

// UI Helpers
function showModal(title, message, type = 'info') {
  elements.modalTitle.textContent = title;
  elements.modalMessage.textContent = message;
  
  // Set button visibility based on type
  if (type === 'confirm') {
    elements.modalConfirm.style.display = 'block';
    elements.modalCancel.style.display = 'block';
  } else {
    elements.modalConfirm.style.display = 'none';
    elements.modalCancel.style.display = 'block';
    elements.modalCancel.textContent = 'Close';
  }
  
  // Show modal
  elements.modal.classList.add('active');
}

function closeModal() {
  elements.modal.classList.remove('active');
}

function showLoading(message = 'Processing...') {
  appState.isLoading = true;
  elements.loadingMessage.textContent = message;
  elements.loadingOverlay.classList.remove('hidden');
}

function hideLoading() {
  appState.isLoading = false;
  elements.loadingOverlay.classList.add('hidden');
}

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
  initializeComponents();
  console.log('ServiceNow Code Intelligence & Refactoring UI initialized');
});
