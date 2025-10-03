/**
 * Unit tests for File Upload Component
 */

describe('FileUploadComponent', () => {
  let container;
  let onFileSelected;
  let onAnalyzeCode;

  const OriginalFileReader = global.FileReader;
  const OriginalAlert = global.alert;

  beforeAll(() => {
    // Polyfill File for Node environment if needed
    if (typeof File === 'undefined') {
      global.File = class File extends Blob {
        constructor(chunks, name, options = {}) {
          super(chunks, options);
          this.name = name;
          this.lastModified = Date.now();
          this.type = options.type || '';
        }
      };
    }
  });

  beforeEach(() => {
    jest.resetModules();
    document.body.innerHTML = '<div id="container"></div>';
    container = document.getElementById('container');
    onFileSelected = jest.fn();
    onAnalyzeCode = jest.fn();

    // Mock alert
    global.alert = jest.fn();

    // Mock FileReader
    class MockFileReader {
      constructor() {
        this.onload = null;
        this.onerror = null;
      }

      readAsText() {
        if (this.onload) {
          this.onload({ target: { result: 'const x = 1;' } });
        }
      }
    }

    global.FileReader = MockFileReader;

    // Load component script
    require('../../../src/ui/components/file-upload.js');
  });

  afterEach(() => {
    document.body.innerHTML = '';
    global.FileReader = OriginalFileReader;
    global.alert = OriginalAlert;
  });

  function initComponent() {
    return window.FileUploadComponent.init({
      container,
      onFileSelected,
      onAnalyzeCode,
    });
  }

  test('should render upload area on init', () => {
    initComponent();

    const dropArea = container.querySelector('#drop-area');
    const analyzeBtn = container.querySelector('#analyze-btn');

    expect(dropArea).not.toBeNull();
    expect(analyzeBtn).not.toBeNull();
    expect(analyzeBtn.disabled).toBe(true);
  });

  test('should handle file selection via input change', () => {
    initComponent();

    const fileInput = container.querySelector('#file-input');
    const analyzeBtn = container.querySelector('#analyze-btn');

    const file = new File(['const x = 1;'], 'example.js', { type: 'text/javascript' });

    const event = new Event('change');
    Object.defineProperty(event, 'target', {
      writable: false,
      value: { files: [file] },
    });

    fileInput.dispatchEvent(event);

    expect(onFileSelected).toHaveBeenCalledTimes(1);
    const selectedFile = onFileSelected.mock.calls[0][0];
    expect(selectedFile.name).toBe('example.js');
    expect(selectedFile.content).toBe('const x = 1;');
    expect(analyzeBtn.disabled).toBe(false);
  });

  test('should call analyze callback when analyze button clicked', () => {
    initComponent();

    const fileInput = container.querySelector('#file-input');
    const analyzeBtn = container.querySelector('#analyze-btn');

    const file = new File(['const x = 1;'], 'example.js', { type: 'text/javascript' });

    const changeEvent = new Event('change');
    Object.defineProperty(changeEvent, 'target', {
      writable: false,
      value: { files: [file] },
    });

    fileInput.dispatchEvent(changeEvent);
    analyzeBtn.click();

    expect(onAnalyzeCode).toHaveBeenCalledTimes(1);
    const analyzeFile = onAnalyzeCode.mock.calls[0][0];
    expect(analyzeFile.name).toBe('example.js');
  });

  test('should clear selected file when clear button clicked', () => {
    const instance = initComponent();

    const fileInput = container.querySelector('#file-input');
    const clearBtn = container.querySelector('#clear-btn');
    const analyzeBtn = container.querySelector('#analyze-btn');

    const file = new File(['const x = 1;'], 'example.js', { type: 'text/javascript' });
    const changeEvent = new Event('change');
    Object.defineProperty(changeEvent, 'target', {
      writable: false,
      value: { files: [file] },
    });

    fileInput.dispatchEvent(changeEvent);
    clearBtn.click();

    expect(instance.getSelectedFile()).toBeNull();
    expect(analyzeBtn.disabled).toBe(true);
  });
});
