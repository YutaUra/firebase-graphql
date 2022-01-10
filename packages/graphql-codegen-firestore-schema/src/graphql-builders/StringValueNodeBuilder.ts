import { Kind, StringValueNode } from 'graphql'
import { BuilderAstNode } from './types'

export type StringValueNodeBuilderProps = {
  value: string
  block?: boolean
}

export class StringValueNodeBuilder implements BuilderAstNode<StringValueNode> {
  constructor(private node: StringValueNodeBuilderProps) {}

  build(): StringValueNode {
    return {
      kind: Kind.STRING,
      ...this.node,
    }
  }

  copy(): StringValueNodeBuilder {
    return new StringValueNodeBuilder({
      value: this.node.value,
      block: this.node.block,
    })
  }

  static fromNode(node: StringValueNode) {
    return new StringValueNodeBuilder({
      value: node.value,
      block: node.block,
    })
  }
}
