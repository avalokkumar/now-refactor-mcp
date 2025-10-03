/**
 * Report Generator Component
 * Generates and downloads analysis reports in various formats
 */

const ReportGeneratorComponent = (function() {
  // Private variables
  let container = null;
  let analysisResult = null;
  let fileName = '';
  let callbacks = {
    onGenerateReport: null,
    onCancelReport: null
  };

  // DOM creation
  function createDOM() {
    const template = `
      <div class="report-generator">
        <div class="card">
          <div class="card-header">
            <h3>Generate Report</h3>
            <p>Select the options for your analysis report</p>
          </div>
          <div class="report-options">
            <div class="option-group">
              <h4>Report Format</h4>
              <div class="radio-group">
                <label class="radio-item">
                  <input type="radio" name="format" value="pdf" checked>
                  <span>PDF Report</span>
                </label>
                <label class="radio-item">
                  <input type="radio" name="format" value="html">
                  <span>HTML Report</span>
                </label>
                <label class="radio-item">
                  <input type="radio" name="format" value="json">
                  <span>JSON Data</span>
                </label>
              </div>
            </div>
            
            <div class="option-group">
              <h4>Include Sections</h4>
              <div class="checkbox-group">
                <label class="checkbox-item">
                  <input type="checkbox" name="sections" value="summary" checked>
                  <span>Executive Summary</span>
                </label>
                <label class="checkbox-item">
                  <input type="checkbox" name="sections" value="issues" checked>
                  <span>Issues List</span>
                </label>
                <label class="checkbox-item">
                  <input type="checkbox" name="sections" value="suggestions" checked>
                  <span>Refactoring Suggestions</span>
                </label>
                <label class="checkbox-item">
                  <input type="checkbox" name="sections" value="metrics" checked>
                  <span>Code Metrics</span>
                </label>
                <label class="checkbox-item">
                  <input type="checkbox" name="sections" value="recommendations">
                  <span>Recommendations</span>
                </label>
              </div>
            </div>
            
            <div class="option-group">
              <h4>Severity Filter</h4>
              <div class="checkbox-group">
                <label class="checkbox-item">
                  <input type="checkbox" name="severity" value="critical" checked>
                  <span>Critical Issues</span>
                </label>
                <label class="checkbox-item">
                  <input type="checkbox" name="severity" value="high" checked>
                  <span>High Priority Issues</span>
                </label>
                <label class="checkbox-item">
                  <input type="checkbox" name="severity" value="medium" checked>
                  <span>Medium Priority Issues</span>
                </label>
                <label class="checkbox-item">
                  <input type="checkbox" name="severity" value="low">
                  <span>Low Priority Issues</span>
                </label>
              </div>
            </div>
            
            <div class="option-group">
              <h4>Report Details</h4>
              <div class="form-group">
                <label for="report-title">Report Title</label>
                <input type="text" id="report-title" value="Code Analysis Report - ${escapeHTML(fileName)}" />
              </div>
              <div class="form-group">
                <label for="report-author">Author</label>
                <input type="text" id="report-author" placeholder="Enter author name" />
              </div>
              <div class="form-group">
                <label for="report-comments">Comments</label>
                <textarea id="report-comments" rows="3" placeholder="Additional comments or notes..."></textarea>
              </div>
            </div>
          </div>
          
          <div class="report-actions">
            <button id="generate-report-btn" class="btn btn-primary">
              <i class="fas fa-file-download"></i> Generate & Download
            </button>
            <button id="preview-report-btn" class="btn btn-secondary">
              <i class="fas fa-eye"></i> Preview
            </button>
            <button id="cancel-report-btn" class="btn btn-secondary">
              <i class="fas fa-times"></i> Cancel
            </button>
          </div>
        </div>
      </div>
    `;
    
    container.innerHTML = template;
    
    // Initialize event listeners
    initEventListeners();
  }

  // Initialize event listeners
  function initEventListeners() {
    const generateBtn = container.querySelector('#generate-report-btn');
    const previewBtn = container.querySelector('#preview-report-btn');
    const cancelBtn = container.querySelector('#cancel-report-btn');
    
    generateBtn.addEventListener('click', handleGenerateReport);
    previewBtn.addEventListener('click', handlePreviewReport);
    cancelBtn.addEventListener('click', handleCancelReport);
  }

  // Handle generate report
  function handleGenerateReport() {
    const options = collectReportOptions();
    
    if (callbacks.onGenerateReport) {
      callbacks.onGenerateReport(options);
    }
  }

  // Handle preview report
  function handlePreviewReport() {
    const options = collectReportOptions();
    
    // Generate HTML preview
    const htmlContent = generateHTMLReport(options);
    
    // Open in new window
    const previewWindow = window.open('', '_blank');
    previewWindow.document.write(htmlContent);
    previewWindow.document.close();
  }

  // Handle cancel report
  function handleCancelReport() {
    if (callbacks.onCancelReport) {
      callbacks.onCancelReport();
    }
  }

  // Collect report options from form
  function collectReportOptions() {
    const formatRadios = container.querySelectorAll('input[name="format"]');
    const sectionCheckboxes = container.querySelectorAll('input[name="sections"]:checked');
    const severityCheckboxes = container.querySelectorAll('input[name="severity"]:checked');
    
    const format = Array.from(formatRadios).find(r => r.checked)?.value || 'pdf';
    const sections = Array.from(sectionCheckboxes).map(cb => cb.value);
    const severities = Array.from(severityCheckboxes).map(cb => cb.value);
    
    const title = container.querySelector('#report-title').value;
    const author = container.querySelector('#report-author').value;
    const comments = container.querySelector('#report-comments').value;
    
    return {
      format,
      sections,
      severities,
      title,
      author,
      comments,
      fileName,
      analysisResult
    };
  }

  // Generate HTML report content
  function generateHTMLReport(options) {
    const stats = analysisResult.stats || {};
    const issues = filterIssuesBySeverity(analysisResult.issues || [], options.severities);
    const suggestions = analysisResult.suggestions || [];
    
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${escapeHTML(options.title)}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
          .header { border-bottom: 2px solid #0070d2; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { color: #0070d2; margin: 0; }
          .header .meta { color: #666; margin-top: 10px; }
          .section { margin-bottom: 30px; }
          .section h2 { color: #333; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
          .stats { display: flex; gap: 20px; margin: 20px 0; }
          .stat-card { flex: 1; padding: 15px; border: 1px solid #ddd; border-radius: 5px; text-align: center; }
          .stat-card h3 { margin: 0; font-size: 24px; }
          .stat-card p { margin: 5px 0 0 0; color: #666; }
          .critical { color: #c23934; }
          .high { color: #ffb75d; }
          .medium { color: #0070d2; }
          .low { color: #04844b; }
          .issue-item { margin: 15px 0; padding: 15px; border-left: 4px solid #ddd; background: #f9f9f9; }
          .issue-item.critical { border-left-color: #c23934; }
          .issue-item.high { border-left-color: #ffb75d; }
          .issue-item.medium { border-left-color: #0070d2; }
          .issue-item.low { border-left-color: #04844b; }
          .issue-title { font-weight: bold; margin-bottom: 5px; }
          .issue-location { font-family: monospace; color: #666; font-size: 12px; }
          .suggestion-item { margin: 15px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
          .suggestion-title { font-weight: bold; margin-bottom: 10px; }
          .confidence { padding: 2px 8px; border-radius: 10px; font-size: 12px; font-weight: bold; }
          .confidence.high { background: #04844b; color: white; }
          .confidence.medium { background: #0070d2; color: white; }
          .confidence.low { background: #ffb75d; color: black; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${escapeHTML(options.title)}</h1>
          <div class="meta">
            <p>Generated on: ${new Date().toLocaleString()}</p>
            ${options.author ? `<p>Author: ${escapeHTML(options.author)}</p>` : ''}
            <p>File: ${escapeHTML(options.fileName)}</p>
          </div>
        </div>
    `;

    // Executive Summary
    if (options.sections.includes('summary')) {
      html += `
        <div class="section">
          <h2>Executive Summary</h2>
          <div class="stats">
            <div class="stat-card">
              <h3>${stats.totalIssues || 0}</h3>
              <p>Total Issues</p>
            </div>
            <div class="stat-card">
              <h3 class="critical">${stats.criticalIssues || 0}</h3>
              <p>Critical</p>
            </div>
            <div class="stat-card">
              <h3 class="high">${stats.highIssues || 0}</h3>
              <p>High</p>
            </div>
            <div class="stat-card">
              <h3 class="medium">${stats.mediumIssues || 0}</h3>
              <p>Medium</p>
            </div>
            <div class="stat-card">
              <h3 class="low">${stats.lowIssues || 0}</h3>
              <p>Low</p>
            </div>
          </div>
          <p>This analysis identified ${stats.totalIssues || 0} issues in the code, with ${suggestions.length} refactoring suggestions to improve code quality.</p>
          ${options.comments ? `<p><strong>Comments:</strong> ${escapeHTML(options.comments)}</p>` : ''}
        </div>
      `;
    }

    // Issues List
    if (options.sections.includes('issues') && issues.length > 0) {
      html += `
        <div class="section">
          <h2>Issues Found (${issues.length})</h2>
      `;
      
      issues.forEach(issue => {
        html += `
          <div class="issue-item ${issue.severity}">
            <div class="issue-title">${escapeHTML(issue.type)}</div>
            <div class="issue-location">${escapeHTML(issue.fileName)}:${issue.line}:${issue.column}</div>
            <div class="issue-message">${escapeHTML(issue.message)}</div>
          </div>
        `;
      });
      
      html += `</div>`;
    }

    // Refactoring Suggestions
    if (options.sections.includes('suggestions') && suggestions.length > 0) {
      html += `
        <div class="section">
          <h2>Refactoring Suggestions (${suggestions.length})</h2>
      `;
      
      suggestions.forEach(suggestion => {
        const confidence = suggestion.confidence || 'medium';
        html += `
          <div class="suggestion-item">
            <div class="suggestion-title">
              ${escapeHTML(suggestion.title)}
              <span class="confidence ${confidence}">${confidence.toUpperCase()}</span>
            </div>
            <div class="suggestion-description">${escapeHTML(suggestion.description)}</div>
            ${suggestion.impact ? `<p><strong>Estimated Time:</strong> ${escapeHTML(suggestion.impact.estimatedTime)}</p>` : ''}
          </div>
        `;
      });
      
      html += `</div>`;
    }

    html += `
      </body>
      </html>
    `;
    
    return html;
  }

  // Filter issues by severity
  function filterIssuesBySeverity(issues, severities) {
    if (severities.length === 0) return issues;
    return issues.filter(issue => severities.includes(issue.severity));
  }

  // Helper function to escape HTML
  function escapeHTML(str) {
    if (!str) return '';
    
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Public API
  return {
    init: function(options) {
      container = options.container;
      analysisResult = options.analysisResult || { issues: [], suggestions: [] };
      fileName = options.fileName || 'unknown';
      callbacks.onGenerateReport = options.onGenerateReport || null;
      callbacks.onCancelReport = options.onCancelReport || null;
      
      createDOM();
      
      return this;
    }
  };
})();

// Export for global use
window.ReportGeneratorComponent = ReportGeneratorComponent;
