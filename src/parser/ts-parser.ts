/**
 * TypeScript parser implementation
 * Uses TypeScript Compiler API to parse TypeScript code into AST
 */

import * as ts from 'typescript';
import { ParseResult, ParseError, ASTNode, ASTVisitor, TraversalOptions } from './ast-models';

/**
 * TypeScript parser configuration
 */
export interface TypeScriptParserConfig {
  target: ts.ScriptTarget;
  module: ts.ModuleKind;
  jsx?: ts.JsxEmit;
  strict?: boolean;
  esModuleInterop?: boolean;
}

/**
 * Default TypeScript parser configuration
 */
const DEFAULT_CONFIG: TypeScriptParserConfig = {
  target: ts.ScriptTarget.ES2020,
  module: ts.ModuleKind.CommonJS,
  jsx: ts.JsxEmit.React,
  strict: true,
  esModuleInterop: true,
};

/**
 * TypeScript parser class
 * Parses TypeScript code using TypeScript Compiler API
 */
export class TypeScriptParser {
  private config: TypeScriptParserConfig;

  constructor(config?: Partial<TypeScriptParserConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Parse TypeScript code
   * @param code - Source code to parse
   * @param fileName - Name of the file being parsed
   * @returns Parse result with AST and metadata
   */
  parse(code: string, fileName: string): ParseResult {
    const startTime = Date.now();
    const errors: ParseError[] = [];

    try {
      // Create source file
      const sourceFile = ts.createSourceFile(
        fileName,
        code,
        this.config.target,
        true, // setParentNodes
        ts.ScriptKind.TS
      );

      // Check for syntax errors
      const syntacticDiagnostics = (sourceFile as any).parseDiagnostics || [];
      
      for (const diagnostic of syntacticDiagnostics) {
        if (diagnostic.file && diagnostic.start !== undefined) {
          const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
          errors.push({
            message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
            line: line + 1, // TypeScript uses 0-based lines
            column: character,
          });
        }
      }

      const parseTime = Date.now() - startTime;

      // Convert TypeScript AST to our AST format
      const ast = this.convertToAST(sourceFile);

      return {
        ast,
        sourceCode: code,
        fileName,
        language: 'typescript',
        parseTime,
        errors,
      };
    } catch (error) {
      errors.push({
        message: error instanceof Error ? error.message : 'Unknown parse error',
        line: 1,
        column: 0,
      });

      const parseTime = Date.now() - startTime;

      return {
        ast: { type: 'Program', body: [] } as any,
        sourceCode: code,
        fileName,
        language: 'typescript',
        parseTime,
        errors,
      };
    }
  }

  /**
   * Convert TypeScript AST node to our AST format
   */
  private convertToAST(node: ts.Node): ASTNode {
    const astNode: ASTNode = {
      type: ts.SyntaxKind[node.kind],
    };

    // Add location information if available
    if (node.getSourceFile && node.pos !== undefined && node.end !== undefined) {
      const sourceFile = node.getSourceFile();
      const start = sourceFile.getLineAndCharacterOfPosition(node.pos);
      const end = sourceFile.getLineAndCharacterOfPosition(node.end);

      astNode.loc = {
        start: { line: start.line + 1, column: start.character },
        end: { line: end.line + 1, column: end.character },
      };
      astNode.range = [node.pos, node.end];
    }

    return astNode;
  }

  /**
   * Traverse TypeScript AST with visitor pattern
   * @param ast - AST to traverse
   * @param options - Traversal options with visitor
   */
  traverse(ast: ASTNode, options: TraversalOptions): void {
    // For TypeScript, we need to work with the original ts.Node
    // This is a simplified version that works with our converted AST
    this.traverseNode(ast, null, options);
  }

  /**
   * Internal recursive traversal
   */
  private traverseNode(node: ASTNode, parent: ASTNode | null, options: TraversalOptions): void {
    if (!node || typeof node !== 'object') {
      return;
    }

    // Skip if type is in skip list
    if (options.skipTypes && options.skipTypes.includes(node.type)) {
      return;
    }

    // Call enter visitor
    if (options.visitor.enter) {
      options.visitor.enter(node, parent);
    }

    // Traverse children
    for (const key in node) {
      if (key === 'type' || key === 'loc' || key === 'range') {
        continue;
      }

      const value = (node as any)[key];

      if (Array.isArray(value)) {
        for (const child of value) {
          if (child && typeof child === 'object' && child.type) {
            this.traverseNode(child, node, options);
          }
        }
      } else if (value && typeof value === 'object' && value.type) {
        this.traverseNode(value, node, options);
      }
    }

    // Call exit visitor
    if (options.visitor.exit) {
      options.visitor.exit(node, parent);
    }
  }

  /**
   * Parse TypeScript with full type checking
   * @param code - Source code
   * @param fileName - File name
   * @returns Source file with type information
   */
  parseWithTypes(code: string, fileName: string): ts.SourceFile {
    return ts.createSourceFile(
      fileName,
      code,
      this.config.target,
      true,
      ts.ScriptKind.TS
    );
  }

  /**
   * Find nodes by TypeScript syntax kind
   * @param sourceFile - TypeScript source file
   * @param kind - Syntax kind to find
   * @returns Array of matching nodes
   */
  findNodesByKind(sourceFile: ts.SourceFile, kind: ts.SyntaxKind): ts.Node[] {
    const nodes: ts.Node[] = [];

    const visit = (node: ts.Node) => {
      if (node.kind === kind) {
        nodes.push(node);
      }
      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return nodes;
  }

  /**
   * Find function declarations in TypeScript
   * @param sourceFile - TypeScript source file
   * @returns Array of function nodes
   */
  findFunctions(sourceFile: ts.SourceFile): ts.Node[] {
    const functions: ts.Node[] = [];
    const functionKinds = [
      ts.SyntaxKind.FunctionDeclaration,
      ts.SyntaxKind.FunctionExpression,
      ts.SyntaxKind.ArrowFunction,
      ts.SyntaxKind.MethodDeclaration,
    ];

    const visit = (node: ts.Node) => {
      if (functionKinds.includes(node.kind)) {
        functions.push(node);
      }
      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return functions;
  }

  /**
   * Find class declarations
   * @param sourceFile - TypeScript source file
   * @returns Array of class nodes
   */
  findClasses(sourceFile: ts.SourceFile): ts.Node[] {
    return this.findNodesByKind(sourceFile, ts.SyntaxKind.ClassDeclaration);
  }

  /**
   * Find interface declarations
   * @param sourceFile - TypeScript source file
   * @returns Array of interface nodes
   */
  findInterfaces(sourceFile: ts.SourceFile): ts.Node[] {
    return this.findNodesByKind(sourceFile, ts.SyntaxKind.InterfaceDeclaration);
  }

  /**
   * Find type aliases
   * @param sourceFile - TypeScript source file
   * @returns Array of type alias nodes
   */
  findTypeAliases(sourceFile: ts.SourceFile): ts.Node[] {
    return this.findNodesByKind(sourceFile, ts.SyntaxKind.TypeAliasDeclaration);
  }

  /**
   * Find import declarations
   * @param sourceFile - TypeScript source file
   * @returns Array of import nodes
   */
  findImports(sourceFile: ts.SourceFile): ts.Node[] {
    return this.findNodesByKind(sourceFile, ts.SyntaxKind.ImportDeclaration);
  }

  /**
   * Find export declarations
   * @param sourceFile - TypeScript source file
   * @returns Array of export nodes
   */
  findExports(sourceFile: ts.SourceFile): ts.Node[] {
    const exports: ts.Node[] = [];
    const exportKinds = [
      ts.SyntaxKind.ExportDeclaration,
      ts.SyntaxKind.ExportAssignment,
    ];

    const visit = (node: ts.Node) => {
      if (exportKinds.includes(node.kind)) {
        exports.push(node);
      }
      // Also check for export modifiers
      if (ts.canHaveModifiers(node)) {
        const modifiers = ts.getModifiers(node);
        if (modifiers && modifiers.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
          exports.push(node);
        }
      }
      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return exports;
  }

  /**
   * Get configuration
   * @returns Current parser configuration
   */
  getConfig(): TypeScriptParserConfig {
    return { ...this.config };
  }
}

// Singleton instance
let tsParserInstance: TypeScriptParser | null = null;

/**
 * Get the singleton TypeScript parser instance
 * @param config - Optional parser configuration
 * @returns The TypeScript parser instance
 */
export function getTypeScriptParser(config?: Partial<TypeScriptParserConfig>): TypeScriptParser {
  if (!tsParserInstance) {
    tsParserInstance = new TypeScriptParser(config);
  }
  return tsParserInstance;
}

/**
 * Reset the TypeScript parser instance (useful for testing)
 */
export function resetTypeScriptParser(): void {
  tsParserInstance = null;
}
