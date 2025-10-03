/**
 * Unit tests for JavaScript parser
 */

import {
  JavaScriptParser,
  getJavaScriptParser,
  resetJavaScriptParser,
  ParseResult,
  ASTNode,
} from '../../src/parser';

describe('JavaScriptParser', () => {
  let parser: JavaScriptParser;

  beforeEach(() => {
    parser = new JavaScriptParser();
  });

  afterEach(() => {
    resetJavaScriptParser();
  });

  describe('Basic Parsing', () => {
    test('should parse simple JavaScript code', () => {
      const code = 'var x = 5;';
      const result = parser.parse(code, 'test.js');

      expect(result.ast).toBeDefined();
      expect(result.ast.type).toBe('Program');
      expect(result.sourceCode).toBe(code);
      expect(result.fileName).toBe('test.js');
      expect(result.language).toBe('javascript');
      expect(result.errors).toHaveLength(0);
      expect(result.parseTime).toBeGreaterThanOrEqual(0);
    });

    test('should parse function declaration', () => {
      const code = 'function test() { return 42; }';
      const result = parser.parse(code, 'test.js');

      expect(result.ast).toBeDefined();
      expect(result.errors).toHaveLength(0);
    });

    test('should parse arrow function', () => {
      const code = 'const add = (a, b) => a + b;';
      const result = parser.parse(code, 'test.js');

      expect(result.ast).toBeDefined();
      expect(result.errors).toHaveLength(0);
    });

    test('should parse class declaration', () => {
      const code = 'class MyClass { constructor() {} }';
      const result = parser.parse(code, 'test.js');

      expect(result.ast).toBeDefined();
      expect(result.errors).toHaveLength(0);
    });

    test('should parse async/await', () => {
      const code = 'async function fetchData() { await fetch("/api"); }';
      const result = parser.parse(code, 'test.js');

      expect(result.ast).toBeDefined();
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle syntax errors', () => {
      const code = 'var x = ;'; // Invalid syntax
      const result = parser.parse(code, 'test.js');

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].message).toBeDefined();
      expect(result.errors[0].line).toBeGreaterThan(0);
    });

    test('should handle unclosed braces', () => {
      const code = 'function test() { var x = 5;';
      const result = parser.parse(code, 'test.js');

      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should return empty AST on parse error', () => {
      const code = 'invalid syntax here!!!';
      const result = parser.parse(code, 'test.js');

      expect(result.ast).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('AST Traversal', () => {
    test('should traverse AST with visitor', () => {
      const code = 'var x = 5; function test() {}';
      const result = parser.parse(code, 'test.js');

      const visitedTypes: string[] = [];
      parser.traverse(result.ast, {
        visitor: {
          enter: (node) => {
            visitedTypes.push(node.type);
          },
        },
      });

      expect(visitedTypes.length).toBeGreaterThan(0);
      expect(visitedTypes).toContain('Program');
      expect(visitedTypes).toContain('VariableDeclaration');
      expect(visitedTypes).toContain('FunctionDeclaration');
    });

    test('should call enter and exit visitors', () => {
      const code = 'var x = 5;';
      const result = parser.parse(code, 'test.js');

      let enterCount = 0;
      let exitCount = 0;

      parser.traverse(result.ast, {
        visitor: {
          enter: () => {
            enterCount++;
          },
          exit: () => {
            exitCount++;
          },
        },
      });

      expect(enterCount).toBeGreaterThan(0);
      expect(exitCount).toBeGreaterThan(0);
      expect(enterCount).toBe(exitCount);
    });

    test('should skip specified node types', () => {
      const code = 'var x = 5; function test() {}';
      const result = parser.parse(code, 'test.js');

      const visitedTypes: string[] = [];
      parser.traverse(result.ast, {
        visitor: {
          enter: (node) => {
            visitedTypes.push(node.type);
          },
        },
        skipTypes: ['FunctionDeclaration'],
      });

      expect(visitedTypes).not.toContain('FunctionDeclaration');
    });
  });

  describe('Node Finding', () => {
    test('should find nodes by type', () => {
      const code = 'var x = 5; var y = 10;';
      const result = parser.parse(code, 'test.js');

      const varDecls = parser.findNodesByType(result.ast, 'VariableDeclaration');
      expect(varDecls).toHaveLength(2);
    });

    test('should find function declarations', () => {
      const code = `
        function test1() {}
        const test2 = function() {};
        const test3 = () => {};
      `;
      const result = parser.parse(code, 'test.js');

      const functions = parser.findFunctions(result.ast);
      expect(functions.length).toBeGreaterThanOrEqual(3);
    });

    test('should find variable declarations', () => {
      const code = 'var x = 5; let y = 10; const z = 15;';
      const result = parser.parse(code, 'test.js');

      const varDecls = parser.findVariableDeclarations(result.ast);
      expect(varDecls).toHaveLength(3);
    });

    test('should find all call expressions', () => {
      const code = 'console.log("test"); alert("hello"); Math.max(1, 2);';
      const result = parser.parse(code, 'test.js');

      const calls = parser.findCallExpressions(result.ast);
      expect(calls.length).toBeGreaterThanOrEqual(3);
    });

    test('should find call expressions by name', () => {
      const code = 'console.log("test"); console.error("error"); alert("hello");';
      const result = parser.parse(code, 'test.js');

      const logCalls = parser.findCallExpressions(result.ast, 'log');
      expect(logCalls).toHaveLength(1);
    });

    test('should find loops', () => {
      const code = `
        for (let i = 0; i < 10; i++) {}
        while (true) {}
        do {} while (false);
      `;
      const result = parser.parse(code, 'test.js');

      const loops = parser.findLoops(result.ast);
      expect(loops.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('GlideScript Specific', () => {
    test('should parse GlideRecord code', () => {
      const code = `
        var gr = new GlideRecord('incident');
        gr.addQuery('active', true);
        gr.query();
        while (gr.next()) {
          gs.log(gr.number);
        }
      `;
      const result = parser.parse(code, 'glide-script.js');

      expect(result.ast).toBeDefined();
      expect(result.errors).toHaveLength(0);

      const calls = parser.findCallExpressions(result.ast);
      expect(calls.length).toBeGreaterThan(0);
    });

    test('should parse GlideAjax code', () => {
      const code = `
        var ga = new GlideAjax('MyScriptInclude');
        ga.addParam('sysparm_name', 'myFunction');
        ga.getXML(callback);
      `;
      const result = parser.parse(code, 'glide-ajax.js');

      expect(result.ast).toBeDefined();
      expect(result.errors).toHaveLength(0);
    });

    test('should parse gs utility calls', () => {
      const code = `
        gs.log("Message");
        gs.error("Error");
        gs.info("Info");
        gs.addInfoMessage("Info message");
      `;
      const result = parser.parse(code, 'gs-utils.js');

      expect(result.ast).toBeDefined();
      expect(result.errors).toHaveLength(0);

      const gsCalls = parser.findCallExpressions(result.ast);
      expect(gsCalls.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Configuration', () => {
    test('should use default configuration', () => {
      const config = parser.getConfig();

      expect(config.ecmaVersion).toBe(2020);
      expect(config.sourceType).toBe('script');
      expect(config.locations).toBe(true);
      expect(config.ranges).toBe(true);
    });

    test('should accept custom configuration', () => {
      const customParser = new JavaScriptParser({
        ecmaVersion: 2018,
        sourceType: 'module',
      });

      const config = customParser.getConfig();
      expect(config.ecmaVersion).toBe(2018);
      expect(config.sourceType).toBe('module');
    });
  });

  describe('Complex Code', () => {
    test('should parse nested functions', () => {
      const code = `
        function outer() {
          function inner() {
            return function deepest() {
              return 42;
            };
          }
          return inner();
        }
      `;
      const result = parser.parse(code, 'nested.js');

      expect(result.errors).toHaveLength(0);
      const functions = parser.findFunctions(result.ast);
      expect(functions.length).toBeGreaterThanOrEqual(3);
    });

    test('should parse nested loops', () => {
      const code = `
        for (let i = 0; i < 10; i++) {
          for (let j = 0; j < 10; j++) {
            while (true) {
              break;
            }
          }
        }
      `;
      const result = parser.parse(code, 'nested-loops.js');

      expect(result.errors).toHaveLength(0);
      const loops = parser.findLoops(result.ast);
      expect(loops.length).toBeGreaterThanOrEqual(3);
    });

    test('should parse complex expressions', () => {
      const code = `
        const result = (a + b) * (c - d) / (e % f);
        const obj = { x: 1, y: 2, z: { nested: true } };
        const arr = [1, 2, 3, [4, 5, [6, 7]]];
      `;
      const result = parser.parse(code, 'complex.js');

      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Singleton Pattern', () => {
    test('should return same instance', () => {
      const parser1 = getJavaScriptParser();
      const parser2 = getJavaScriptParser();
      expect(parser1).toBe(parser2);
    });

    test('should reset instance', () => {
      const parser1 = getJavaScriptParser();
      resetJavaScriptParser();
      const parser2 = getJavaScriptParser();
      expect(parser2).toBeDefined();
    });
  });
});
