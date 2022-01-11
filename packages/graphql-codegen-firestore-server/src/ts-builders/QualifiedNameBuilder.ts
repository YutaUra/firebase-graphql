import { EntityName, factory as f, Identifier, QualifiedName } from 'typescript'
import { Builder } from './types'

export type QualifiedNameBuilderOptions = {
  left: Builder<EntityName>
  right: string | Builder<Identifier>
}

export class QualifiedNameBuilder implements Builder<QualifiedName> {
  constructor(private options: QualifiedNameBuilderOptions) {}

  build(): QualifiedName {
    return f.createQualifiedName(
      this.options.left.build(),
      typeof this.options.right === 'string'
        ? this.options.right
        : this.options.right.build(),
    )
  }

  copy(): QualifiedNameBuilder {
    return new QualifiedNameBuilder({
      left: this.options.left.copy(),
      right:
        typeof this.options.right === 'string'
          ? this.options.right
          : this.options.right.copy(),
    })
  }
}
