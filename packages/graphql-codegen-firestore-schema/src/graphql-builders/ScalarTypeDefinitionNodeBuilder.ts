import {
  ConstDirectiveNode,
  Kind,
  NameNode,
  ScalarTypeDefinitionNode,
  StringValueNode,
} from 'graphql'
import { ConstDirectiveNodeBuilder } from './ConstDirectiveNodeBuilder'
import { NameNodeBuilder } from './NameNodeBuilder'
import { StringValueNodeBuilder } from './StringValueNodeBuilder'
import { BuilderAstNode } from './types'

export type ScalarTypeDefinitionNodeBuilderProps = {
  description?: BuilderAstNode<StringValueNode>
  name: BuilderAstNode<NameNode>
  directives?: BuilderAstNode<ConstDirectiveNode>[]
}

export class ScalarTypeDefinitionNodeBuilder
  implements BuilderAstNode<ScalarTypeDefinitionNode>
{
  constructor(private node: ScalarTypeDefinitionNodeBuilderProps) {}

  build(): ScalarTypeDefinitionNode {
    return {
      kind: Kind.SCALAR_TYPE_DEFINITION,
      description: this.node.description?.build(),
      name: this.node.name.build(),
      directives: this.node.directives?.map((v) => v.build()),
    }
  }

  copy(): ScalarTypeDefinitionNodeBuilder {
    return new ScalarTypeDefinitionNodeBuilder({
      description: this.node.description?.copy(),
      name: this.node.name.copy(),
      directives: this.node.directives?.map((v) => v.copy()),
    })
  }

  static fromNode(
    node: ScalarTypeDefinitionNode,
  ): ScalarTypeDefinitionNodeBuilder {
    return new ScalarTypeDefinitionNodeBuilder({
      description:
        node.description?.kind === Kind.STRING
          ? StringValueNodeBuilder.fromNode(node.description)
          : undefined,
      name: NameNodeBuilder.fromNode(node.name),
      directives: node.directives?.map((v) =>
        ConstDirectiveNodeBuilder.fromNode(v),
      ),
    })
  }

  addDirective(
    directive: BuilderAstNode<ConstDirectiveNode>,
  ): ScalarTypeDefinitionNodeBuilder {
    return new ScalarTypeDefinitionNodeBuilder({
      description: this.node.description?.copy(),
      name: this.node.name.copy(),
      directives: [
        ...(this.node.directives ?? []).map((v) => v.copy()),
        directive,
      ],
    })
  }
}
