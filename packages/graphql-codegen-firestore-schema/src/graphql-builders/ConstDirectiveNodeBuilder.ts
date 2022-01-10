import { ConstArgumentNode, ConstDirectiveNode, Kind, NameNode } from 'graphql'
import { ConstArgumentNodeBuilder } from './ConstArgumentNodeBuilder'
import { NameNodeBuilder } from './NameNodeBuilder'
import { BuilderAstNode } from './types'

export type ConstDirectiveNodeBuilderProps = {
  name: BuilderAstNode<NameNode>
  arguments?: BuilderAstNode<ConstArgumentNode>[]
}

export class ConstDirectiveNodeBuilder
  implements BuilderAstNode<ConstDirectiveNode>
{
  constructor(private node: ConstDirectiveNodeBuilderProps) {}

  build(): ConstDirectiveNode {
    return {
      kind: Kind.DIRECTIVE,
      name: this.node.name.build(),
      arguments: this.node.arguments?.map((v) => v.build()),
    }
  }

  copy(): ConstDirectiveNodeBuilder {
    return new ConstDirectiveNodeBuilder({
      name: this.node.name.copy(),
      arguments: this.node.arguments?.map((v) => v.copy()),
    })
  }

  static fromNode(node: ConstDirectiveNode) {
    return new ConstDirectiveNodeBuilder({
      name: NameNodeBuilder.fromNode(node.name),
      arguments: node.arguments?.map((v) =>
        ConstArgumentNodeBuilder.fromNode(v),
      ),
    })
  }

  addArgument(argument: BuilderAstNode<ConstArgumentNode>) {
    return new ConstDirectiveNodeBuilder({
      name: this.node.name.copy(),
      arguments: [
        ...(this.node.arguments || []).map((v) => v.copy()),
        argument,
      ],
    })
  }
}
