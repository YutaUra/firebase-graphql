import { ConstListValueNode, ConstValueNode, Kind } from 'graphql'
import { ConstValueNodeBuilder } from './ConstValueNodeBuilder'
import { BuilderAstNode } from './types'

export type ConstListValueNodeBuilderProps = {
  values: BuilderAstNode<ConstValueNode>[]
}

export class ConstListValueNodeBuilder
  implements BuilderAstNode<ConstListValueNode>
{
  constructor(private node: ConstListValueNodeBuilderProps) {}

  build(): ConstListValueNode {
    return {
      kind: Kind.LIST,
      values: this.node.values.map((value) => value.build()),
    }
  }

  copy(): ConstListValueNodeBuilder {
    return new ConstListValueNodeBuilder({
      values: this.node.values.map((value) => value.copy()),
    })
  }

  static fromNode(node: ConstListValueNode) {
    return new ConstListValueNodeBuilder({
      values: node.values.map((value) => ConstValueNodeBuilder.fromNode(value)),
    })
  }
}
