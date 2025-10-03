/**
 * JavaScript/GlideScript parser implementation
 * Uses Acorn to parse JavaScript code into AST
 */

import * as acorn from 'acorn';
import { ParseResult, ParseError, ASTNode, ASTVisitor, TraversalOptions } from './ast-models';

/**
 * Parser configuration
 */
export interface ParserConfig {
  ecmaVersion: acorn.ecmaVersion;
  sourceType: 'script' | 'module';
  locations: boolean;
  ranges: boolean;
  allowHashBang?: boolean;
  allowAwaitOutsideFunction?: boolean;
  allowReturnOutsideFunction?: boolean;
}

/**
 * Default parser configuration
 */
const DEFAULT_CONFIG: ParserConfig = {
  ecmaVersion: 2020,
  sourceType: 'script',
  locations: true,
  ranges: true,
  allowHashBang: true,
  allowAwaitOutsideFunction: true,
  allowReturnOutsideFunction: true,
};

/**
 * JavaScript parser class
 * Parses JavaScript/GlideScript code using Acorn
 */
export class JavaScriptParser {
  private config: ParserConfig;

  constructor(config?: Partial<ParserConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Parse JavaScript code
   * @param code - Source code to parse
   * @param fileName - Name of the file being parsed
   * @returns Parse result with AST and metadata
   */
  parse(code: string, fileName: string): ParseResult {
    const startTime = Date.now();
    const errors: ParseError[] = [];

    try {
      const ast = acorn.parse(code, this.config) as unknown as ASTNode;
      const parseTime = Date.now() - startTime;

      return {
        ast,
        sourceCode: code,
        fileName,
        language: 'javascript',
        parseTime,
        errors,
      };
    } catch (error) {
      // Handle parse errors
      if (error instanceof SyntaxError) {
        const match = error.message.match(/\((\d+):(\d+)\)/);
        const line = match ? parseInt(match[1], 10) : 1;
        const column = match ? parseInt(match[2], 10) : 0;

        errors.push({
          message: error.message,
          line,
          column,
        });
      } else {
        errors.push({
          message: error instanceof Error ? error.message : 'Unknown parse error',
          line: 1,
          column: 0,
        });
      }

      const parseTime = Date.now() - startTime;

      // Return result with empty AST and errors
      return {
        ast: { type: 'Program', body: [] } as any,
        sourceCode: code,
        fileName,
        language: 'javascript',
        parseTime,
        errors,
      };
    }
  }

  /**
   * Traverse AST with visitor pattern
   * @param ast - AST to traverse
   * @param options - Traversal options with visitor
   */
  traverse(ast: ASTNode, options: TraversalOptions): void {
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
   * Find nodes by type
   * @param ast - AST to search
   * @param nodeType - Type of nodes to find
   * @returns Array of matching nodes
   */
  findNodesByType(ast: ASTNode, nodeType: string): ASTNode[] {
    const nodes: ASTNode[] = [];

    this.traverse(ast, {
      visitor: {
        enter: (node) => {
          if (node.type === nodeType) {
            nodes.push(node);
          }
        },
      },
    });

    return nodes;
  }

  /**
   * Find function declarations
   * @param ast - AST to search
   * @returns Array of function nodes
   */
  findFunctions(ast: ASTNode): ASTNode[] {
    const functionTypes = ['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression'];
    const functions: ASTNode[] = [];

    this.traverse(ast, {
      visitor: {
        enter: (node) => {
          if (functionTypes.includes(node.type)) {
            functions.push(node);
          }
        },
      },
    });

    return functions;
  }

  /**
   * Find variable declarations
   * @param ast - AST to search
   * @returns Array of variable declaration nodes
   */
  findVariableDeclarations(ast: ASTNode): ASTNode[] {
    return this.findNodesByType(ast, 'VariableDeclaration');
  }

  /**
   * Find call expressions
   * @param ast - AST to search
   * @param calleeName - Optional callee name to filter by
   * @returns Array of call expression nodes
   */
  findCallExpressions(ast: ASTNode, calleeName?: string): ASTNode[] {
    const calls: ASTNode[] = [];

    this.traverse(ast, {
      visitor: {
        enter: (node) => {
          if (node.type === 'CallExpression') {
            if (!calleeName) {
              calls.push(node);
            } else {
              // Check if callee matches the name
              const callee = (node as any).callee;
              if (callee && callee.type === 'Identifier' && callee.name === calleeName) {
                calls.push(node);
              } else if (
                callee &&
                callee.type === 'MemberExpression' &&
                callee.property &&
                callee.property.name === calleeName
              ) {
                calls.push(node);
              }
            }
          }
        },
      },
    });

    return calls;
  }

  /**
   * Find loops
   * @param ast - AST to search
   * @returns Array of loop nodes
   */
  findLoops(ast: ASTNode): ASTNode[] {
    const loopTypes = ['ForStatement', 'WhileStatement', 'DoWhileStatement', 'ForInStatement', 'ForOfStatement'];
    const loops: ASTNode[] = [];

    this.traverse(ast, {
      visitor: {
        enter: (node) => {
          if (loopTypes.includes(node.type)) {
            loops.push(node);
          }
        },
      },
    });

    return loops;
  }

  /**
   * Get configuration
   * @returns Current parser configuration
   */
  getConfig(): ParserConfig {
    return { ...this.config };
  }
}

// Singleton instance
let parserInstance: JavaScriptParser | null = null;

/**
 * Get the singleton parser instance
 * @param config - Optional parser configuration
 * @returns The JavaScript parser instance
 */
export function getJavaScriptParser(config?: Partial<ParserConfig>): JavaScriptParser {
  if (!parserInstance) {
    parserInstance = new JavaScriptParser(config);
  }
  return parserInstance;
}

/**
 * Reset the parser instance (useful for testing)
 */
export function resetJavaScriptParser(): void {
  parserInstance = null;
}
