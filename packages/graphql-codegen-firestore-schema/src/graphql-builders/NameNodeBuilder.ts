import { Kind, NameNode } from 'graphql'
import { BuilderAstNode } from './types'

export type NameNodeBuilderProps = { value: string }

export class NameNodeBuilder implements BuilderAstNode<NameNode> {
  constructor(private node: NameNodeBuilderProps) {}

  build(): NameNode {
    return {
      kind: Kind.NAME,
      ...this.node,
    }
  }

  copy(): NameNodeBuilder {
    return new NameNodeBuilder({ value: this.node.value })
  }

  static fromNode(node: NameNode) {
    return new NameNodeBuilder({ value: node.value })
  }
}
