import { Kind, ListTypeNode, NamedTypeNode, NonNullTypeNode } from 'graphql'
import { ListTypeNodeBuilder } from './ListTypeNodeBuilder'
import { NamedTypeNodeBuilder } from './NamedTypeNodeBuilder'
import { BuilderAstNode } from './types'

export type NonNullTypeNodeBuilderProps = {
  type: BuilderAstNode<NamedTypeNode> | BuilderAstNode<ListTypeNode>
}

export class NonNullTypeNodeBuilder implements BuilderAstNode<NonNullTypeNode> {
  constructor(private node: NonNullTypeNodeBuilderProps) {}

  build(): NonNullTypeNode {
    return {
      kind: Kind.NON_NULL_TYPE,
      type: this.node.type.build(),
    }
  }

  copy(): NonNullTypeNodeBuilder {
    return new NonNullTypeNodeBuilder({ type: this.node.type.copy() })
  }

  toList() {
    return new ListTypeNodeBuilder({
      type: this.copy(),
    })
  }

  static fromNode(node: NamedTypeNode | ListTypeNode): NonNullTypeNodeBuilder {
    if (node.kind === Kind.NAMED_TYPE) {
      return new NonNullTypeNodeBuilder({
        type: NamedTypeNodeBuilder.fromNode(node),
      })
    }
    return new NonNullTypeNodeBuilder({
      type: ListTypeNodeBuilder.fromNode(node),
    })
  }
}
