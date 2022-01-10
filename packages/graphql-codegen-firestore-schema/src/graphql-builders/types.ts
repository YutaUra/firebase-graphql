import { ASTNode } from 'graphql'

export interface BuilderAstNode<T extends ASTNode> {
  build(): T
  copy(): BuilderAstNode<T>
}

export type Writable<T> = T extends ReadonlyArray<infer V>
  ? Array<Writable<V>>
  : T extends {}
  ? { -readonly [P in keyof T]: Writable<T[P]> }
  : T
