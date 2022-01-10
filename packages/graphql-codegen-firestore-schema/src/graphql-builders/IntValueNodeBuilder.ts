import { IntValueNode, Kind } from 'graphql'
import { BuilderAstNode } from './types'

export type IntValueNodeProps = {
  value: number
}

export class IntValueNodeBuilder implements BuilderAstNode<IntValueNode> {
  constructor(private node: IntValueNodeProps) {}

  build(): IntValueNode {
    return {
      kind: Kind.INT,
      value: this.node.value.toString(),
    }
  }

  copy(): IntValueNodeBuilder {
    return new IntValueNodeBuilder({ value: this.node.value })
  }
}
