import { Kind, TypeNode } from 'graphql'
import { NonNullTypeNodeBuilder } from './NonNullTypeNodeBuilder'
import { BuilderAstNode } from './types'

export type TypeNodeBuilderProps = TypeNode

export class TypeNodeBuilder implements BuilderAstNode<TypeNode> {
  private constructor(private node: TypeNodeBuilderProps) {}

  build(): TypeNode {
    return this.node
  }

  copy(): TypeNodeBuilder {
    return new TypeNodeBuilder(this.node)
  }

  required(): NonNullTypeNodeBuilder {
    if (this.node.kind === Kind.NON_NULL_TYPE) {
      return NonNullTypeNodeBuilder.fromNode(this.node.type)
    }
    return NonNullTypeNodeBuilder.fromNode(this.node)
  }

  nullable(): TypeNodeBuilder {
    if (this.node.kind === Kind.NON_NULL_TYPE) {
      return TypeNodeBuilder.fromNode(this.node.type)
    }
    return TypeNodeBuilder.fromNode(this.node)
  }

  static fromNode(node: TypeNode): TypeNodeBuilder {
    return new TypeNodeBuilder(node)
  }
}
