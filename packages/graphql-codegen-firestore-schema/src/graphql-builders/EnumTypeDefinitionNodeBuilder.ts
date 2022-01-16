import {
  ConstDirectiveNode,
  EnumTypeDefinitionNode,
  EnumValueDefinitionNode,
  Kind,
  NameNode,
  StringValueNode,
} from 'graphql'
import { ConstDirectiveNodeBuilder } from './ConstDirectiveNodeBuilder'
import { EnumValueDefinitionNodeBuilder } from './EnumValueDefinitionNodeBuilder'
import { NameNodeBuilder } from './NameNodeBuilder'
import { StringValueNodeBuilder } from './StringValueNodeBuilder'
import { BuilderAstNode } from './types'

export type EnumTypeDefinitionNodeBuilderProps = {
  description?: BuilderAstNode<StringValueNode>
  name: BuilderAstNode<NameNode>
  directives?: BuilderAstNode<ConstDirectiveNode>[]
  values?: BuilderAstNode<EnumValueDefinitionNode>[]
}

export class EnumTypeDefinitionNodeBuilder
  implements BuilderAstNode<EnumTypeDefinitionNode>
{
  constructor(private node: EnumTypeDefinitionNodeBuilderProps) {}

  build(): EnumTypeDefinitionNode {
    return {
      kind: Kind.ENUM_TYPE_DEFINITION,
      name: this.node.name.build(),
      description: this.node.description?.build(),
      directives: this.node.directives?.map((v) => v.build()),
      values: this.node.values?.map((v) => v.build()),
    }
  }

  copy(): EnumTypeDefinitionNodeBuilder {
    return new EnumTypeDefinitionNodeBuilder({
      name: this.node.name.copy(),
      description: this.node.description?.copy(),
      directives: this.node.directives?.map((v) => v.copy()),
      values: this.node.values?.map((v) => v.copy()),
    })
  }

  static fromNode(node: EnumTypeDefinitionNode) {
    return new EnumTypeDefinitionNodeBuilder({
      name: NameNodeBuilder.fromNode(node.name),
      description: node.description
        ? StringValueNodeBuilder.fromNode(node.description)
        : undefined,
      directives: node.directives?.map((v) =>
        ConstDirectiveNodeBuilder.fromNode(v),
      ),
      values: node.values?.map((v) =>
        EnumValueDefinitionNodeBuilder.fromNode(v),
      ),
    })
  }

  addDirective(directive: ConstDirectiveNodeBuilder) {
    return new EnumTypeDefinitionNodeBuilder({
      name: this.node.name.copy(),
      description: this.node.description?.copy(),
      directives: [
        ...(this.node.directives ?? []).map((v) => v.copy()),
        directive,
      ],
      values: this.node.values?.map((v) => v.copy()),
    })
  }

  addValue(value: EnumValueDefinitionNodeBuilder) {
    return new EnumTypeDefinitionNodeBuilder({
      name: this.node.name.copy(),
      description: this.node.description?.copy(),
      directives: this.node.directives?.map((v) => v.copy()),
      values: [...(this.node.values ?? []).map((v) => v.copy()), value],
    })
  }
}
