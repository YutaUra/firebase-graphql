import {
  EntityName,
  factory as f,
  TypeNode,
  TypeReferenceNode,
} from 'typescript'
import { Builder } from './types'

export type TypeReferenceNodeOptions = {
  typeName: string | Builder<EntityName>
  typeArguments?: Builder<TypeNode>[]
}

export class TypeReferenceNodeBuilder implements Builder<TypeReferenceNode> {
  constructor(private options: TypeReferenceNodeOptions) {}

  build(): TypeReferenceNode {
    return f.createTypeReferenceNode(
      typeof this.options.typeName === 'string'
        ? this.options.typeName
        : this.options.typeName.build(),
      this.options.typeArguments?.map((x) => x.build()),
    )
  }

  copy(): TypeReferenceNodeBuilder {
    return new TypeReferenceNodeBuilder({
      typeName:
        typeof this.options.typeName === 'string'
          ? this.options.typeName
          : this.options.typeName.copy(),
      typeArguments: this.options.typeArguments?.map((x) => x.copy()),
    })
  }
}
