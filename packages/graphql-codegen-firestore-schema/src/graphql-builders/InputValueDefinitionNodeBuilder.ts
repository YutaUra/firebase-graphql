import {
  ConstDirectiveNode,
  ConstValueNode,
  InputValueDefinitionNode,
  Kind,
  NameNode,
  StringValueNode,
  TypeNode,
} from 'graphql'
import { ConstDirectiveNodeBuilder } from './ConstDirectiveNodeBuilder'
import { ConstValueNodeBuilder } from './ConstValueNodeBuilder'
import { NameNodeBuilder } from './NameNodeBuilder'
import { StringValueNodeBuilder } from './StringValueNodeBuilder'
import { TypeNodeBuilder } from './TypeNodeBuilder'
import { BuilderAstNode } from './types'

export type InputValueDefinitionNodeBuilderProps = {
  description?: BuilderAstNode<StringValueNode>
  name: BuilderAstNode<NameNode>
  type: BuilderAstNode<TypeNode>
  defaultValue?: BuilderAstNode<ConstValueNode>
  directives?: BuilderAstNode<ConstDirectiveNode>[]
}

export class InputValueDefinitionNodeBuilder
  implements BuilderAstNode<InputValueDefinitionNode>
{
  constructor(private node: InputValueDefinitionNodeBuilderProps) {}

  build(): InputValueDefinitionNode {
    return {
      kind: Kind.INPUT_VALUE_DEFINITION,
      description: this.node.description?.build(),
      name: this.node.name.build(),
      type: this.node.type.build(),
      defaultValue: this.node.defaultValue?.build(),
      directives: this.node.directives?.map((v) => v.build()),
    }
  }

  copy(): InputValueDefinitionNodeBuilder {
    return new InputValueDefinitionNodeBuilder({
      description: this.node.description?.copy(),
      name: this.node.name.copy(),
      type: this.node.type.copy(),
      defaultValue: this.node.defaultValue?.copy(),
      directives: this.node.directives?.map((v) => v.copy()),
    })
  }

  static fromNode(node: InputValueDefinitionNode) {
    return new InputValueDefinitionNodeBuilder({
      description: node.description
        ? StringValueNodeBuilder.fromNode(node.description)
        : undefined,
      name: NameNodeBuilder.fromNode(node.name),
      type: TypeNodeBuilder.fromNode(node.type),
      defaultValue: node.defaultValue
        ? ConstValueNodeBuilder.fromNode(node.defaultValue)
        : undefined,
      directives: node.directives?.map((v) =>
        ConstDirectiveNodeBuilder.fromNode(v),
      ),
    })
  }

  addDirective(directive: ConstDirectiveNodeBuilder) {
    return new InputValueDefinitionNodeBuilder({
      description: this.node.description?.copy(),
      name: this.node.name.copy(),
      type: this.node.type.copy(),
      defaultValue: this.node.defaultValue?.copy(),
      directives: [
        ...(this.node.directives || []).map((v) => v.copy()),
        directive,
      ],
    })
  }
}
