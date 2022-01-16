import { factory as f, TypeNode, UnionTypeNode } from 'typescript'
import { Builder } from './types'

export type UnionTypeNodeBuilderOptions = {
  types?: Builder<TypeNode>[]
}

export class UnionTypeNodeBuilder implements Builder<UnionTypeNode> {
  constructor(private options: UnionTypeNodeBuilderOptions) {}

  build(): UnionTypeNode {
    return f.createUnionTypeNode(
      this.options.types?.map((v) => v.build()) ?? [],
    )
  }

  copy(): UnionTypeNodeBuilder {
    return new UnionTypeNodeBuilder({
      types: this.options.types?.map((v) => v.copy()),
    })
  }

  addType(type: Builder<TypeNode>): UnionTypeNodeBuilder {
    return new UnionTypeNodeBuilder({
      types: [...(this.options.types ?? []).map((v) => v.copy()), type],
    })
  }
}
