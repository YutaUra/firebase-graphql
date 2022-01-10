import { ConstValueNode } from 'graphql'
import { BuilderAstNode } from './types'

export type ConstValueNodeBuilderProps = ConstValueNode

export class ConstValueNodeBuilder implements BuilderAstNode<ConstValueNode> {
  private constructor(private node: ConstValueNodeBuilderProps) {}

  build(): ConstValueNode {
    return this.node
  }

  copy(): ConstValueNodeBuilder {
    return new ConstValueNodeBuilder(this.node)
  }

  static fromNode(node: ConstValueNode): BuilderAstNode<ConstValueNode> {
    return new ConstValueNodeBuilder(node)
  }
}
