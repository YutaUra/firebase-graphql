export enum FirestoreRulesAstKind {
  ROOT = 'Root',
  SERVICE = 'Service',
  FUNCTION = 'Function',
  MATCH = 'Match',
}

export interface FirestoreRulesRootAst {
  kind: FirestoreRulesAstKind.ROOT
  version: string
  service: FirestoreRulesServiceAst
}

export interface FirestoreRulesServiceAst {
  kind: FirestoreRulesAstKind.SERVICE
  children: FirestoreRulesMatchAst[]
}

export enum FirestoreRulesMatchAllowKind {
  CREATE = 'create',
  GET = 'get',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
}

export type FirestoreRulesMatchAllowStatement = {
  [kind in FirestoreRulesMatchAllowKind]?: string | string[]
}

export interface FirestoreRulesMatchAst {
  kind: FirestoreRulesAstKind.MATCH

  target: string
  children: (FirestoreRulesMatchAst | FirestoreRulesFunctionAst)[]
  allow?: FirestoreRulesMatchAllowStatement
}

export interface FirestoreRulesFunctionAst {
  kind: FirestoreRulesAstKind.FUNCTION
  name: string
  args: string[]
  statement: string | string[]
}

export enum FirestoreRulesScalar {
  BOOL = 'bool',
  STRING = 'string',
  TIMESTAMP = 'timestamp',
  INT = 'int',
  FLOAT = 'float',
  NUMBER = 'number',
  LIST = 'list',
  MAP = 'map',
  DURATION = 'duration',
  PATH = 'path',
  LATLNG = 'latlng',
}
