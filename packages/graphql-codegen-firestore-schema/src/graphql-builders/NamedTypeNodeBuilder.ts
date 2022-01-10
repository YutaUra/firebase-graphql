import { Kind, NamedTypeNode, NameNode } from 'graphql'
import { NameNodeBuilder } from './NameNodeBuilder'
import { NonNullTypeNodeBuilder } from './NonNullTypeNodeBuilder'
import { BuilderAstNode } from './types'

export type NamedTypeNodeBuilderProps = {
  name: BuilderAstNode<NameNode>
}

export class NamedTypeNodeBuilder implements BuilderAstNode<NamedTypeNode> {
  constructor(private node: NamedTypeNodeBuilderProps) {}

  build(): NamedTypeNode {
    return {
      kind: Kind.NAMED_TYPE,
      name: this.node.name.build(),
    }
  }

  copy(): NamedTypeNodeBuilder {
    return new NamedTypeNodeBuilder({ name: this.node.name.copy() })
  }

  required() {
    return new NonNullTypeNodeBuilder({ type: this })
  }

  static fromNode(node: NamedTypeNode) {
    return new NamedTypeNodeBuilder({
      name: NameNodeBuilder.fromNode(node.name),
    })
  }
}
