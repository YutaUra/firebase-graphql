import { Kind, ListTypeNode, TypeNode } from 'graphql'
import { NonNullTypeNodeBuilder } from './NonNullTypeNodeBuilder'
import { TypeNodeBuilder } from './TypeNodeBuilder'
import { BuilderAstNode } from './types'

export type ListTypeNodeBuilderProps = {
  type: BuilderAstNode<TypeNode>
}

export class ListTypeNodeBuilder implements BuilderAstNode<ListTypeNode> {
  constructor(private node: ListTypeNodeBuilderProps) {}

  build(): ListTypeNode {
    return {
      kind: Kind.LIST_TYPE,
      type: this.node.type.build(),
    }
  }

  copy(): ListTypeNodeBuilder {
    return new ListTypeNodeBuilder({ type: this.node.type.copy() })
  }

  required(): NonNullTypeNodeBuilder {
    return new NonNullTypeNodeBuilder({ type: this })
  }

  static fromNode(node: ListTypeNode) {
    return new ListTypeNodeBuilder({
      type: TypeNodeBuilder.fromNode(node.type),
    })
  }
}
