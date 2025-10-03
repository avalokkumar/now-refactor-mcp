/**
 * API Service for UI
 * Handles communication with the backend API
 */

const ApiService = (function() {
  // Configuration
  const config = {
    baseUrl: 'http://localhost:3000/api',
    timeout: 30000 // 30 seconds
  };

  // Private methods
  async function makeRequest(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout);

    try {
      const response = await fetch(`${config.baseUrl}${url}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      
      throw error;
    }
  }

  async function makeFormRequest(url, formData) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout);

    try {
      const response = await fetch(`${config.baseUrl}${url}`, {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      
      throw error;
    }
  }

  // Public API
  return {
    // Analyze code directly
    async analyzeCode(code, fileName, language) {
      return await makeRequest('/analyze', {
        method: 'POST',
        body: JSON.stringify({
          code,
          fileName,
          language
        })
      });
    },

    // Analyze uploaded file
    async analyzeFile(file) {
      try {
        console.log('Uploading file:', file.name);
        
        const formData = new FormData();
        
        // Create a File object from the file data
        const blob = new Blob([file.content], { type: 'text/plain' });
        const fileObj = new File([blob], file.name, { type: 'application/javascript' });
        
        formData.append('file', fileObj);
        
        // Use fetch directly for better debugging
        const response = await fetch(`${config.baseUrl}/upload`, {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Upload failed:', response.status, errorText);
          throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error('File upload error:', error);
        throw error;
      }
    },

    // Get analysis result by ID
    async getAnalysis(analysisId) {
      return await makeRequest(`/analysis/${analysisId}`);
    },

    // List all analyses
    async listAnalyses(options = {}) {
      const params = new URLSearchParams();
      
      if (options.language) params.append('language', options.language);
      if (options.fileName) params.append('fileName', options.fileName);
      if (options.limit) params.append('limit', options.limit.toString());
      if (options.offset) params.append('offset', options.offset.toString());
      
      const queryString = params.toString();
      const url = queryString ? `/analyses?${queryString}` : '/analyses';
      
      return await makeRequest(url);
    },

    // Apply refactoring
    async applyRefactoring(suggestionId, code, fileName) {
      return await makeRequest('/refactor/apply', {
        method: 'POST',
        body: JSON.stringify({
          suggestionId,
          code,
          fileName
        })
      });
    },

    // Get system statistics
    async getStats() {
      return await makeRequest('/stats');
    },

    // Generate and download report
    async generateReport(analysisId, options) {
      try {
        // For now, generate HTML report and trigger download
        const analysis = await this.getAnalysis(analysisId);
        const htmlContent = this.generateHTMLReport(analysis, options);
        
        // Create and download file
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `analysis-report-${analysisId}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
        
        return { success: true };
      } catch (error) {
        throw new Error(`Failed to generate report: ${error.message}`);
      }
    },

    // Generate HTML report content
    generateHTMLReport(analysisResult, options) {
      const stats = analysisResult.stats || {};
      const issues = this.filterIssuesBySeverity(analysisResult.issues || [], options.severities || []);
      const suggestions = analysisResult.suggestions || [];
      
      let html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${this.escapeHTML(options.title || 'Analysis Report')}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
            .header { border-bottom: 2px solid #0070d2; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { color: #0070d2; margin: 0; }
            .header .meta { color: #666; margin-top: 10px; }
            .section { margin-bottom: 30px; }
            .section h2 { color: #333; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
            .stats { display: flex; gap: 20px; margin: 20px 0; flex-wrap: wrap; }
            .stat-card { flex: 1; min-width: 120px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; text-align: center; }
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
            @media print { body { margin: 20px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${this.escapeHTML(options.title || 'Code Analysis Report')}</h1>
            <div class="meta">
              <p>Generated on: ${new Date().toLocaleString()}</p>
              ${options.author ? `<p>Author: ${this.escapeHTML(options.author)}</p>` : ''}
              <p>File: ${this.escapeHTML(options.fileName || 'Unknown')}</p>
            </div>
          </div>
      `;

      // Executive Summary
      if (!options.sections || options.sections.includes('summary')) {
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
            ${options.comments ? `<p><strong>Comments:</strong> ${this.escapeHTML(options.comments)}</p>` : ''}
          </div>
        `;
      }

      // Issues List
      if ((!options.sections || options.sections.includes('issues')) && issues.length > 0) {
        html += `
          <div class="section">
            <h2>Issues Found (${issues.length})</h2>
        `;
        
        issues.forEach(issue => {
          html += `
            <div class="issue-item ${issue.severity}">
              <div class="issue-title">${this.escapeHTML(issue.type)}</div>
              <div class="issue-location">${this.escapeHTML(issue.fileName)}:${issue.line}:${issue.column}</div>
              <div class="issue-message">${this.escapeHTML(issue.message)}</div>
            </div>
          `;
        });
        
        html += `</div>`;
      }

      // Refactoring Suggestions
      if ((!options.sections || options.sections.includes('suggestions')) && suggestions.length > 0) {
        html += `
          <div class="section">
            <h2>Refactoring Suggestions (${suggestions.length})</h2>
        `;
        
        suggestions.forEach(suggestion => {
          const confidence = suggestion.confidence || 'medium';
          html += `
            <div class="suggestion-item">
              <div class="suggestion-title">
                ${this.escapeHTML(suggestion.title)}
                <span class="confidence ${confidence}">${confidence.toUpperCase()}</span>
              </div>
              <div class="suggestion-description">${this.escapeHTML(suggestion.description)}</div>
              ${suggestion.impact ? `<p><strong>Estimated Time:</strong> ${this.escapeHTML(suggestion.impact.estimatedTime)}</p>` : ''}
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
    },

    // Filter issues by severity
    filterIssuesBySeverity(issues, severities) {
      if (!severities || severities.length === 0) return issues;
      return issues.filter(issue => severities.includes(issue.severity));
    },

    // Helper function to escape HTML
    escapeHTML(str) {
      if (!str) return '';
      
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    },

    // Configuration methods
    setBaseUrl(url) {
      config.baseUrl = url;
    },

    setTimeout(timeout) {
      config.timeout = timeout;
    }
  };
})();

// Export for global use
window.ApiService = ApiService;
