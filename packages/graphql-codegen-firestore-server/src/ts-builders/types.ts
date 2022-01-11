import { Node } from 'typescript'

export interface Builder<T extends Node> {
  build(): T
  copy(): Builder<T>
}

export const toBuilder = <T extends Node>(node: T): Builder<T> => {
  return {
    build: () => node,
    copy: () => toBuilder(node),
  }
}

export const isBuilder = <T extends Node>(
  value: unknown,
): value is Builder<T> => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'build' in value &&
    'copy' in value
  )
}
