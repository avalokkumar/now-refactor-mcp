# UI Implementation Documentation

This document covers the frontend implementation for the ServiceNow Code Intelligence & Refactoring UI (Phase 5).

## Overview

The UI provides an end-to-end workflow for uploading code, viewing analysis results, comparing refactoring suggestions, and generating reports. It is implemented using vanilla HTML, CSS, and JavaScript, and integrates directly with the Phase 4 REST API.

## Project Structure

```
src/ui/
├── index.html
├── styles.css
├── app.js
├── components/
│   ├── file-upload.js
│   ├── file-upload.css
│   ├── results-display.js
│   ├── results-display.css
│   ├── code-comparison.js
│   ├── code-comparison.css
│   ├── report-generator.js
│   └── report-generator.css
└── services/
    └── api-service.js
```

### Entry Points

- `src/ui/index.html`: Base HTML structure and script includes.
- `src/ui/styles.css`: Global styles, imports component-level styles.
- `src/ui/app.js`: Application state management and component orchestration.

### API Service

- `src/ui/services/api-service.js`: Wrapper around REST API endpoints. Supports:
  - `analyzeCode`
  - `analyzeFile`
  - `getAnalysis`
  - `listAnalyses`
  - `applyRefactoring`
  - `getStats`
  - `generateReport`

## Components

### File Upload (`file-upload.js`)
- Handles drag-and-drop and click-to-upload interactions.
- Validates file extensions (.js, .jsx, .ts, .tsx).
- Reads file content and triggers analysis callback.
- Key selectors: `#drop-area`, `#file-input`, `#analyze-btn`, `#clear-btn`.

### Results Display (`results-display.js`)
- Renders summary statistics, issues list, and refactoring suggestions.
- Supports tab navigation between Issues and Suggestions.
- Invokes callback when a suggestion is selected for comparison.

### Code Comparison (`code-comparison.js`)
- Displays original vs. refactored code using CodeMirror (external CDN).
- Utilizes suggestion preview or transformations for refactored view.
- Highlights changed, added, and removed lines.

### Report Generator (`report-generator.js`)
- Provides report format, sections, severity filters, and metadata inputs.
- Supports preview in new window and download via API service.

## Styling

- Tailored design system with CSS variables defined in `styles.css`.
- Component-specific styles imported via `@import` statements.
- Responsive layout for mobile screens (≤ 768px).

## External Dependencies

Loaded via CDN in `index.html`:
- Font Awesome (icons)
- CodeMirror (code editors)

Installed via npm for testing:
- `jest-environment-jsdom`

## Testing

UI tests are located under `tests/ui/components/` and run with Jest + jsdom.

| Component                 | Test File                                            | Tests |
|--------------------------|------------------------------------------------------|-------|
| File Upload              | `file-upload.test.js`                                | 4     |
| Results Display          | `results-display.test.js`                            | 5     |
| Code Comparison          | `code-comparison.test.js`                            | 3     |
| Report Generator         | `report-generator.test.js`                           | 4     |

Run UI tests:
```bash
npm test -- tests/ui/
```

All UI tests pass ✅

## Integration Flow

1. User uploads a file via the file upload component.
2. `app.js` sends the file to the API (`ApiService.analyzeFile`).
3. Results are rendered via the results display component.
4. Selecting a suggestion loads the code comparison component.
5. Users can generate reports through the report generator component.
6. API interactions are handled centrally in `api-service.js` for maintainability.

## Future Enhancements

- Add persistent history using browser storage.
- Implement live previews for transformations without requiring API calls.
- Provide dark/light theme toggle.
- Integrate with real authentication once available.
