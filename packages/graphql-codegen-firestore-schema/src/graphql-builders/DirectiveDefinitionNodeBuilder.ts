import {
  DirectiveDefinitionNode,
  InputValueDefinitionNode,
  Kind,
  NameNode,
  StringValueNode,
} from 'graphql'
import { InputValueDefinitionNodeBuilder } from './InputValueDefinitionNodeBuilder'
import { NameNodeBuilder } from './NameNodeBuilder'
import { StringValueNodeBuilder } from './StringValueNodeBuilder'
import { BuilderAstNode } from './types'

export type DirectiveDefinitionNodeBuilderProps = {
  description?: BuilderAstNode<StringValueNode>
  name: BuilderAstNode<NameNode>
  arguments?: BuilderAstNode<InputValueDefinitionNode>[]
  repeatable: boolean
  locations: BuilderAstNode<NameNode>[]
}

export class DirectiveDefinitionNodeBuilder
  implements BuilderAstNode<DirectiveDefinitionNode>
{
  constructor(private node: DirectiveDefinitionNodeBuilderProps) {}

  build(): DirectiveDefinitionNode {
    return {
      kind: Kind.DIRECTIVE_DEFINITION,
      name: this.node.name.build(),
      description: this.node.description?.build(),
      arguments: this.node.arguments?.map((v) => v.build()),
      locations: this.node.locations?.map((v) => v.build()),
      repeatable: this.node.repeatable,
    }
  }

  copy(): DirectiveDefinitionNodeBuilder {
    return new DirectiveDefinitionNodeBuilder({
      description: this.node.description?.copy(),
      name: this.node.name.copy(),
      arguments: this.node.arguments?.map((v) => v.copy()),
      repeatable: this.node.repeatable,
      locations: this.node.locations?.map((v) => v.copy()),
    })
  }

  static fromNode(
    node: DirectiveDefinitionNode,
  ): DirectiveDefinitionNodeBuilder {
    return new DirectiveDefinitionNodeBuilder({
      description: node.description
        ? StringValueNodeBuilder.fromNode(node.description)
        : undefined,
      locations: node.locations.map((v) => NameNodeBuilder.fromNode(v)),
      name: NameNodeBuilder.fromNode(node.name),
      arguments: node.arguments?.map((v) =>
        InputValueDefinitionNodeBuilder.fromNode(v),
      ),
      repeatable: node.repeatable,
    })
  }
}
