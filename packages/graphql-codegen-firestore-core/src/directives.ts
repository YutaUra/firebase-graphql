export enum FirestoreRulesAuthOperation {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  GET = 'get',
  LIST = 'list',
}

export enum FirestoreRulesAuthStrategy {
  OWNER = 'owner',
  PRIVATE = 'private',
  PUBLIC = 'public',
}

export interface FirestoreRulesAuthRule {
  allow: FirestoreRulesAuthStrategy
  ownerField?: String
  operations?: FirestoreRulesAuthOperation[]
}

export enum FirestoreRelationType {
  GET = 'get',
}
