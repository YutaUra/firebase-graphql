import {
  ConstDirectiveNode,
  EnumValueDefinitionNode,
  Kind,
  NameNode,
  StringValueNode,
} from 'graphql'
import { ConstDirectiveNodeBuilder } from './ConstDirectiveNodeBuilder'
import { NameNodeBuilder } from './NameNodeBuilder'
import { StringValueNodeBuilder } from './StringValueNodeBuilder'
import { BuilderAstNode } from './types'

export type EnumValueDefinitionNodeBuilderProps = {
  description?: BuilderAstNode<StringValueNode>
  name: BuilderAstNode<NameNode>
  directives?: BuilderAstNode<ConstDirectiveNode>[]
}

export class EnumValueDefinitionNodeBuilder
  implements BuilderAstNode<EnumValueDefinitionNode>
{
  constructor(private node: EnumValueDefinitionNodeBuilderProps) {}

  build(): EnumValueDefinitionNode {
    return {
      kind: Kind.ENUM_VALUE_DEFINITION,
      name: this.node.name.build(),
      description: this.node.description?.build(),
      directives: this.node.directives?.map((v) => v.build()),
    }
  }

  copy(): EnumValueDefinitionNodeBuilder {
    return new EnumValueDefinitionNodeBuilder({
      name: this.node.name.copy(),
      description: this.node.description?.copy(),
      directives: this.node.directives?.map((v) => v.copy()),
    })
  }

  static fromNode(node: EnumValueDefinitionNode) {
    return new EnumValueDefinitionNodeBuilder({
      name: NameNodeBuilder.fromNode(node.name),
      description: node.description
        ? StringValueNodeBuilder.fromNode(node.description)
        : undefined,
      directives: node.directives?.map((v) =>
        ConstDirectiveNodeBuilder.fromNode(v),
      ),
    })
  }

  addDirective(directive: ConstDirectiveNodeBuilder) {
    return new EnumValueDefinitionNodeBuilder({
      name: this.node.name.copy(),
      description: this.node.description?.copy(),
      directives: [
        ...(this.node.directives ?? []).map((v) => v.copy()),
        directive,
      ],
    })
  }
}
