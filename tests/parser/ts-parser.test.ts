/**
 * Unit tests for TypeScript parser
 */

import {
  TypeScriptParser,
  getTypeScriptParser,
  resetTypeScriptParser,
} from '../../src/parser';
import * as ts from 'typescript';

describe('TypeScriptParser', () => {
  let parser: TypeScriptParser;

  beforeEach(() => {
    parser = new TypeScriptParser();
  });

  afterEach(() => {
    resetTypeScriptParser();
  });

  describe('Basic Parsing', () => {
    test('should parse simple TypeScript code', () => {
      const code = 'const x: number = 5;';
      const result = parser.parse(code, 'test.ts');

      expect(result.ast).toBeDefined();
      expect(result.sourceCode).toBe(code);
      expect(result.fileName).toBe('test.ts');
      expect(result.language).toBe('typescript');
      expect(result.errors).toHaveLength(0);
      expect(result.parseTime).toBeGreaterThanOrEqual(0);
    });

    test('should parse function with types', () => {
      const code = 'function add(a: number, b: number): number { return a + b; }';
      const result = parser.parse(code, 'test.ts');

      expect(result.ast).toBeDefined();
      expect(result.errors).toHaveLength(0);
    });

    test('should parse interface declaration', () => {
      const code = 'interface User { name: string; age: number; }';
      const result = parser.parse(code, 'test.ts');

      expect(result.ast).toBeDefined();
      expect(result.errors).toHaveLength(0);
    });

    test('should parse class with types', () => {
      const code = `
        class MyClass {
          private value: number;
          constructor(value: number) {
            this.value = value;
          }
        }
      `;
      const result = parser.parse(code, 'test.ts');

      expect(result.ast).toBeDefined();
      expect(result.errors).toHaveLength(0);
    });

    test('should parse generic types', () => {
      const code = 'function identity<T>(arg: T): T { return arg; }';
      const result = parser.parse(code, 'test.ts');

      expect(result.ast).toBeDefined();
      expect(result.errors).toHaveLength(0);
    });

    test('should parse type aliases', () => {
      const code = 'type StringOrNumber = string | number;';
      const result = parser.parse(code, 'test.ts');

      expect(result.ast).toBeDefined();
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle syntax errors', () => {
      const code = 'const x: number = ;'; // Invalid syntax
      const result = parser.parse(code, 'test.ts');

      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should handle type errors gracefully', () => {
      const code = 'const x: string = 123;'; // Type mismatch (but syntactically valid)
      const result = parser.parse(code, 'test.ts');

      // Parser only checks syntax, not types
      expect(result.ast).toBeDefined();
    });
  });

  describe('TypeScript Specific Features', () => {
    test('should parse with full type information', () => {
      const code = 'const x: number = 5;';
      const sourceFile = parser.parseWithTypes(code, 'test.ts');

      expect(sourceFile).toBeDefined();
      expect(sourceFile.kind).toBe(ts.SyntaxKind.SourceFile);
    });

    test('should find nodes by syntax kind', () => {
      const code = 'const x = 5; const y = 10;';
      const sourceFile = parser.parseWithTypes(code, 'test.ts');

      const varStatements = parser.findNodesByKind(sourceFile, ts.SyntaxKind.VariableStatement);
      expect(varStatements.length).toBeGreaterThanOrEqual(2);
    });

    test('should find function declarations', () => {
      const code = `
        function test1() {}
        const test2 = function() {};
        const test3 = () => {};
        class MyClass {
          method() {}
        }
      `;
      const sourceFile = parser.parseWithTypes(code, 'test.ts');

      const functions = parser.findFunctions(sourceFile);
      expect(functions.length).toBeGreaterThanOrEqual(4);
    });

    test('should find class declarations', () => {
      const code = `
        class Class1 {}
        class Class2 {}
      `;
      const sourceFile = parser.parseWithTypes(code, 'test.ts');

      const classes = parser.findClasses(sourceFile);
      expect(classes).toHaveLength(2);
    });

    test('should find interface declarations', () => {
      const code = `
        interface Interface1 {}
        interface Interface2 {}
      `;
      const sourceFile = parser.parseWithTypes(code, 'test.ts');

      const interfaces = parser.findInterfaces(sourceFile);
      expect(interfaces).toHaveLength(2);
    });

    test('should find type aliases', () => {
      const code = `
        type Type1 = string;
        type Type2 = number;
      `;
      const sourceFile = parser.parseWithTypes(code, 'test.ts');

      const typeAliases = parser.findTypeAliases(sourceFile);
      expect(typeAliases).toHaveLength(2);
    });

    test('should find import declarations', () => {
      const code = `
        import { foo } from './foo';
        import * as bar from './bar';
      `;
      const sourceFile = parser.parseWithTypes(code, 'test.ts');

      const imports = parser.findImports(sourceFile);
      expect(imports).toHaveLength(2);
    });

    test('should find export declarations', () => {
      const code = `
        export const x = 5;
        export function test() {}
        export { y };
      `;
      const sourceFile = parser.parseWithTypes(code, 'test.ts');

      const exports = parser.findExports(sourceFile);
      expect(exports.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('ServiceNow TypeScript Components', () => {
    test('should parse ServiceNow UI component', () => {
      const code = `
        interface ComponentProps {
          title: string;
          data: any[];
        }
        
        export class MyComponent {
          constructor(private props: ComponentProps) {}
          
          render(): void {
            console.log(this.props.title);
          }
        }
      `;
      const result = parser.parse(code, 'component.ts');

      expect(result.ast).toBeDefined();
      expect(result.errors).toHaveLength(0);
    });

    test('should parse TypeScript with decorators', () => {
      const code = `
        class MyService {
          @observable
          private data: string[] = [];
          
          @action
          updateData(newData: string[]): void {
            this.data = newData;
          }
        }
      `;
      const result = parser.parse(code, 'service.ts');

      expect(result.ast).toBeDefined();
    });
  });

  describe('Configuration', () => {
    test('should use default configuration', () => {
      const config = parser.getConfig();

      expect(config.target).toBe(ts.ScriptTarget.ES2020);
      expect(config.module).toBe(ts.ModuleKind.CommonJS);
      expect(config.strict).toBe(true);
    });

    test('should accept custom configuration', () => {
      const customParser = new TypeScriptParser({
        target: ts.ScriptTarget.ES2018,
        strict: false,
      });

      const config = customParser.getConfig();
      expect(config.target).toBe(ts.ScriptTarget.ES2018);
      expect(config.strict).toBe(false);
    });
  });

  describe('Complex TypeScript', () => {
    test('should parse complex types', () => {
      const code = `
        type ComplexType<T> = {
          [K in keyof T]: T[K] extends object ? ComplexType<T[K]> : T[K];
        };
      `;
      const result = parser.parse(code, 'complex.ts');

      expect(result.ast).toBeDefined();
      expect(result.errors).toHaveLength(0);
    });

    test('should parse async/await with types', () => {
      const code = `
        async function fetchData(): Promise<string> {
          const response = await fetch('/api');
          return response.text();
        }
      `;
      const result = parser.parse(code, 'async.ts');

      expect(result.ast).toBeDefined();
      expect(result.errors).toHaveLength(0);
    });

    test('should parse union and intersection types', () => {
      const code = `
        type Union = string | number;
        type Intersection = { a: string } & { b: number };
      `;
      const result = parser.parse(code, 'types.ts');

      expect(result.ast).toBeDefined();
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Singleton Pattern', () => {
    test('should return same instance', () => {
      const parser1 = getTypeScriptParser();
      const parser2 = getTypeScriptParser();
      expect(parser1).toBe(parser2);
    });

    test('should reset instance', () => {
      const parser1 = getTypeScriptParser();
      resetTypeScriptParser();
      const parser2 = getTypeScriptParser();
      expect(parser2).toBeDefined();
    });
  });
});
