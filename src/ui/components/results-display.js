/**
 * Results Display Component
 * Displays analysis results including issues and refactoring suggestions
 */

const ResultsDisplayComponent = (function() {
  // Private variables
  let container = null;
  let analysisResult = null;
  let activeTab = 'issues';
  let callbacks = {
    onViewSuggestion: null
  };

  // DOM creation
  function createDOM() {
    // Create summary stats
    const stats = analysisResult.stats || {
      totalIssues: 0,
      criticalIssues: 0,
      highIssues: 0,
      mediumIssues: 0,
      lowIssues: 0
    };
    
    const summaryHTML = `
      <div class="results-summary">
        <div class="stat-card">
          <h3>${stats.totalIssues}</h3>
          <p>Total Issues</p>
        </div>
        <div class="stat-card critical">
          <h3>${stats.criticalIssues}</h3>
          <p>Critical</p>
        </div>
        <div class="stat-card high">
          <h3>${stats.highIssues}</h3>
          <p>High</p>
        </div>
        <div class="stat-card medium">
          <h3>${stats.mediumIssues}</h3>
          <p>Medium</p>
        </div>
        <div class="stat-card low">
          <h3>${stats.lowIssues}</h3>
          <p>Low</p>
        </div>
      </div>
    `;
    
    // Create tabs
    const tabsHTML = `
      <div class="results-tabs">
        <div class="tab ${activeTab === 'issues' ? 'active' : ''}" data-tab="issues">Issues (${analysisResult.issues ? analysisResult.issues.length : 0})</div>
        <div class="tab ${activeTab === 'suggestions' ? 'active' : ''}" data-tab="suggestions">Refactoring Suggestions (${analysisResult.suggestions ? analysisResult.suggestions.length : 0})</div>
      </div>
    `;
    
    // Create tab content
    const issuesHTML = createIssuesTab();
    const suggestionsHTML = createSuggestionsTab();
    
    const tabContentHTML = `
      <div class="tab-content ${activeTab === 'issues' ? 'active' : ''}" data-tab="issues">
        ${issuesHTML}
      </div>
      <div class="tab-content ${activeTab === 'suggestions' ? 'active' : ''}" data-tab="suggestions">
        ${suggestionsHTML}
      </div>
    `;
    
    // Combine all sections
    container.innerHTML = summaryHTML + tabsHTML + tabContentHTML;
    
    // Add event listeners
    initEventListeners();
  }

  // Create issues tab content
  function createIssuesTab() {
    const issues = analysisResult.issues || [];
    
    if (issues.length === 0) {
      return '<div class="empty-state">No issues found.</div>';
    }
    
    const issueItems = issues.map(issue => {
      const severityClass = `severity-${issue.severity.toLowerCase()}`;
      const codeSnippet = getCodeSnippet(issue.fileName, issue.line, 5);
      
      return `
        <li class="issue-item" data-issue-id="${issue.id}">
          <div class="issue-header">
            <span class="issue-title">${escapeHTML(issue.type)}</span>
            <span class="issue-severity ${severityClass}">${issue.severity}</span>
          </div>
          <div class="issue-location">
            ${escapeHTML(issue.fileName)}:${issue.line}:${issue.column}
          </div>
          <div class="issue-message">
            ${escapeHTML(issue.message)}
          </div>
          <div class="issue-actions">
            <button class="btn btn-sm toggle-snippet-btn" data-issue-id="${issue.id}">
              <i class="fas fa-code"></i> Show Code
            </button>
          </div>
          <div class="code-snippet hidden" data-issue-id="${issue.id}">
            <pre><code class="language-javascript">${codeSnippet}</code></pre>
          </div>
        </li>
      `;
    }).join('');
    
    return `<ul class="issue-list">${issueItems}</ul>`;
  }

  // Create suggestions tab content
  function createSuggestionsTab() {
    const suggestions = analysisResult.suggestions || [];
    
    if (suggestions.length === 0) {
      return '<div class="empty-state">No refactoring suggestions available.</div>';
    }
    
    const suggestionItems = suggestions.map(suggestion => {
      const confidenceClass = `confidence-${suggestion.confidence ? suggestion.confidence.toLowerCase() : 'medium'}`;
      const confidenceScore = suggestion.confidenceScore || 50;
      
      return `
        <li class="suggestion-item" data-suggestion-id="${suggestion.id}">
          <div class="suggestion-header">
            <span class="suggestion-title">${escapeHTML(suggestion.title)}</span>
            <span class="suggestion-confidence ${confidenceClass}">
              ${suggestion.confidence || 'Medium'} (${confidenceScore}%)
            </span>
          </div>
          <div class="suggestion-description">
            ${escapeHTML(suggestion.description)}
          </div>
          <div class="suggestion-impact">
            <strong>Impact:</strong> ${suggestion.impact ? escapeHTML(suggestion.impact.estimatedTime) : 'Unknown'} to implement,
            ${suggestion.impact && suggestion.impact.breakingChange ? 'may cause breaking changes' : 'non-breaking change'}
          </div>
          <div class="suggestion-actions">
            <button class="btn btn-primary view-suggestion-btn" data-suggestion-id="${suggestion.id}">
              <i class="fas fa-eye"></i> View Changes
            </button>
          </div>
        </li>
      `;
    }).join('');
    
    return `<ul class="suggestion-list">${suggestionItems}</ul>`;
  }

  // Initialize event listeners
  function initEventListeners() {
    // Tab switching
    const tabs = container.querySelectorAll('.tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabId = tab.getAttribute('data-tab');
        switchTab(tabId);
      });
    });
    
    // View suggestion buttons
    const viewButtons = container.querySelectorAll('.view-suggestion-btn');
    viewButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const suggestionId = button.getAttribute('data-suggestion-id');
        const suggestion = findSuggestionById(suggestionId);
        
        if (suggestion && callbacks.onViewSuggestion) {
          callbacks.onViewSuggestion(suggestion);
        }
      });
    });
    
    // Toggle code snippet buttons
    const toggleButtons = container.querySelectorAll('.toggle-snippet-btn');
    toggleButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const issueId = button.getAttribute('data-issue-id');
        const snippetDiv = container.querySelector(`.code-snippet[data-issue-id="${issueId}"]`);
        
        if (snippetDiv) {
          const isHidden = snippetDiv.classList.contains('hidden');
          
          if (isHidden) {
            snippetDiv.classList.remove('hidden');
            button.innerHTML = '<i class="fas fa-code"></i> Hide Code';
            
            // Fetch code snippet if not already loaded
            if (snippetDiv.getAttribute('data-loaded') !== 'true') {
              const issue = findIssueById(issueId);
              if (issue) {
                fetchCodeSnippet(issue.fileName, issue.line, 5).then(snippet => {
                  snippetDiv.querySelector('code').textContent = snippet;
                  snippetDiv.setAttribute('data-loaded', 'true');
                  
                  // Apply syntax highlighting if available
                  if (window.hljs) {
                    window.hljs.highlightElement(snippetDiv.querySelector('code'));
                  }
                });
              }
            }
          } else {
            snippetDiv.classList.add('hidden');
            button.innerHTML = '<i class="fas fa-code"></i> Show Code';
          }
        }
      });
    });
  }

  // Switch between tabs
  function switchTab(tabId) {
    activeTab = tabId;
    
    // Update tab buttons
    const tabs = container.querySelectorAll('.tab');
    tabs.forEach(tab => {
      if (tab.getAttribute('data-tab') === tabId) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
    
    // Update tab content
    const tabContents = container.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
      if (content.getAttribute('data-tab') === tabId) {
        content.classList.add('active');
      } else {
        content.classList.remove('active');
      }
    });
  }

  // Find suggestion by ID
  function findSuggestionById(id) {
    if (!analysisResult || !analysisResult.suggestions) {
      return null;
    }
    
    return analysisResult.suggestions.find(s => s.id === id);
  }
  
  // Find issue by ID
  function findIssueById(id) {
    if (!analysisResult || !analysisResult.issues) {
      return null;
    }
    
    return analysisResult.issues.find(i => i.id === id);
  }
  
  // Get code snippet for an issue
  function getCodeSnippet(fileName, line, contextLines) {
    return 'Loading code snippet...';
  }
  
  // Fetch code snippet from the server
  async function fetchCodeSnippet(fileName, line, contextLines) {
    try {
      const startLine = Math.max(1, line - contextLines);
      const endLine = line + contextLines;
      
      const response = await fetch(`/api/code-snippet?fileName=${encodeURIComponent(fileName)}&startLine=${startLine}&endLine=${endLine}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch code snippet');
      }
      
      const data = await response.json();
      return data.snippet || 'Code snippet not available';
    } catch (error) {
      console.error('Error fetching code snippet:', error);
      return 'Error loading code snippet';
    }
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
      callbacks.onViewSuggestion = options.onViewSuggestion || null;
      
      createDOM();
      
      return this;
    },
    
    updateResults: function(newResults) {
      analysisResult = newResults;
      createDOM();
    },
    
    switchTab: switchTab
  };
})();

// Export for global use
window.ResultsDisplayComponent = ResultsDisplayComponent;
