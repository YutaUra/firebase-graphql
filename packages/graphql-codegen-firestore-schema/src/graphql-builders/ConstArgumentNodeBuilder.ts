import { ConstArgumentNode, ConstValueNode, Kind, NameNode } from 'graphql'
import { ConstValueNodeBuilder } from './ConstValueNodeBuilder'
import { NameNodeBuilder } from './NameNodeBuilder'
import { BuilderAstNode } from './types'

export type ConstArgumentNodeBuilderProps = {
  name: BuilderAstNode<NameNode>
  value: BuilderAstNode<ConstValueNode>
}

export class ConstArgumentNodeBuilder
  implements BuilderAstNode<ConstArgumentNode>
{
  constructor(private node: ConstArgumentNodeBuilderProps) {}

  build(): ConstArgumentNode {
    return {
      kind: Kind.ARGUMENT,
      name: this.node.name.build(),
      value: this.node.value.build(),
    }
  }

  copy(): ConstArgumentNodeBuilder {
    return new ConstArgumentNodeBuilder({
      name: this.node.name.copy(),
      value: this.node.value.copy(),
    })
  }

  static fromNode(node: ConstArgumentNode) {
    return new ConstArgumentNodeBuilder({
      name: NameNodeBuilder.fromNode(node.name),
      value: ConstValueNodeBuilder.fromNode(node.value),
    })
  }
}
