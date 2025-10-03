/**
 * AST (Abstract Syntax Tree) data models
 * Defines interfaces for parsed code structures
 */

/**
 * Base node interface for all AST nodes
 */
export interface ASTNode {
  type: string;
  loc?: SourceLocation;
  range?: [number, number];
}

/**
 * Source location information
 */
export interface SourceLocation {
  start: Position;
  end: Position;
  source?: string;
}

/**
 * Position in source code
 */
export interface Position {
  line: number;
  column: number;
}

/**
 * Parsed code result
 */
export interface ParseResult {
  ast: ASTNode;
  sourceCode: string;
  fileName: string;
  language: 'javascript' | 'typescript';
  parseTime: number; // milliseconds
  errors: ParseError[];
}

/**
 * Parse error
 */
export interface ParseError {
  message: string;
  line: number;
  column: number;
  index?: number;
}

/**
 * Function declaration node
 */
export interface FunctionNode extends ASTNode {
  type: 'FunctionDeclaration' | 'FunctionExpression' | 'ArrowFunctionExpression';
  id?: IdentifierNode;
  params: ASTNode[];
  body: ASTNode;
  async?: boolean;
  generator?: boolean;
}

/**
 * Identifier node
 */
export interface IdentifierNode extends ASTNode {
  type: 'Identifier';
  name: string;
}

/**
 * Variable declaration node
 */
export interface VariableDeclarationNode extends ASTNode {
  type: 'VariableDeclaration';
  declarations: VariableDeclaratorNode[];
  kind: 'var' | 'let' | 'const';
}

/**
 * Variable declarator node
 */
export interface VariableDeclaratorNode extends ASTNode {
  type: 'VariableDeclarator';
  id: ASTNode;
  init?: ASTNode;
}

/**
 * Call expression node
 */
export interface CallExpressionNode extends ASTNode {
  type: 'CallExpression';
  callee: ASTNode;
  arguments: ASTNode[];
}

/**
 * Member expression node
 */
export interface MemberExpressionNode extends ASTNode {
  type: 'MemberExpression';
  object: ASTNode;
  property: ASTNode;
  computed: boolean;
}

/**
 * Loop statement node
 */
export interface LoopStatementNode extends ASTNode {
  type: 'ForStatement' | 'WhileStatement' | 'DoWhileStatement' | 'ForInStatement' | 'ForOfStatement';
  body: ASTNode;
  test?: ASTNode;
}

/**
 * If statement node
 */
export interface IfStatementNode extends ASTNode {
  type: 'IfStatement';
  test: ASTNode;
  consequent: ASTNode;
  alternate?: ASTNode;
}

/**
 * AST visitor pattern interface
 */
export interface ASTVisitor {
  enter?(node: ASTNode, parent: ASTNode | null): void;
  exit?(node: ASTNode, parent: ASTNode | null): void;
}

/**
 * AST traversal options
 */
export interface TraversalOptions {
  visitor: ASTVisitor;
  skipTypes?: string[];
}
