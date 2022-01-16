import { EnumValueNode, Kind } from 'graphql'
import { BuilderAstNode } from './types'

export type EnumValueNodeBuilderProps = {
  value: string
}

export class EnumValueNodeBuilder implements BuilderAstNode<EnumValueNode> {
  constructor(private node: EnumValueNodeBuilderProps) {}

  build(): EnumValueNode {
    return {
      kind: Kind.ENUM,
      value: this.node.value,
    }
  }

  copy(): EnumValueNodeBuilder {
    return new EnumValueNodeBuilder({
      value: this.node.value,
    })
  }

  static fromNode(node: EnumValueNode) {
    return new EnumValueNodeBuilder({
      value: node.value,
    })
  }
}
