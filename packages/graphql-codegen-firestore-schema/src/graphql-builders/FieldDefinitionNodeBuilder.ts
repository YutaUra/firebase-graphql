import {
  ConstDirectiveNode,
  FieldDefinitionNode,
  InputValueDefinitionNode,
  Kind,
  NameNode,
  StringValueNode,
  TypeNode,
} from 'graphql'
import { ConstDirectiveNodeBuilder } from './ConstDirectiveNodeBuilder'
import { InputValueDefinitionNodeBuilder } from './InputValueDefinitionNodeBuilder'
import { NameNodeBuilder } from './NameNodeBuilder'
import { StringValueNodeBuilder } from './StringValueNodeBuilder'
import { TypeNodeBuilder } from './TypeNodeBuilder'
import { BuilderAstNode } from './types'

export type FieldDefinitionNodeBuilderProps = {
  name: BuilderAstNode<NameNode>
  description?: BuilderAstNode<StringValueNode>
  type: BuilderAstNode<TypeNode>
  directives?: BuilderAstNode<ConstDirectiveNode>[]
  arguments?: BuilderAstNode<InputValueDefinitionNode>[]
}

export class FieldDefinitionNodeBuilder
  implements BuilderAstNode<FieldDefinitionNode>
{
  constructor(private node: FieldDefinitionNodeBuilderProps) {}

  build(): FieldDefinitionNode {
    return {
      kind: Kind.FIELD_DEFINITION,
      name: this.node.name.build(),
      description: this.node.description?.build(),
      type: this.node.type.build(),
      directives: this.node.directives?.map((v) => v.build()),
      arguments: this.node.arguments?.map((v) => v.build()),
    }
  }

  copy(): FieldDefinitionNodeBuilder {
    return new FieldDefinitionNodeBuilder({
      name: this.node.name.copy(),
      description: this.node.description?.copy(),
      type: this.node.type.copy(),
      directives: this.node.directives?.map((v) => v.copy()),
      arguments: this.node.arguments?.map((v) => v.copy()),
    })
  }

  static fromNode(node: FieldDefinitionNode) {
    return new FieldDefinitionNodeBuilder({
      name: NameNodeBuilder.fromNode(node.name),
      description: node.description
        ? StringValueNodeBuilder.fromNode(node.description)
        : undefined,
      type: TypeNodeBuilder.fromNode(node.type),
      directives: node.directives?.map((v) =>
        ConstDirectiveNodeBuilder.fromNode(v),
      ),
      arguments: node.arguments?.map((v) =>
        InputValueDefinitionNodeBuilder.fromNode(v),
      ),
    })
  }

  addDirective(directive: BuilderAstNode<ConstDirectiveNode>) {
    return new FieldDefinitionNodeBuilder({
      name: this.node.name.copy(),
      description: this.node.description?.copy(),
      type: this.node.type.copy(),
      directives: [
        ...(this.node.directives || []).map((v) => v.copy()),
        directive,
      ],
      arguments: this.node.arguments?.map((v) => v.copy()),
    })
  }

  addArgument(argument: BuilderAstNode<InputValueDefinitionNode>) {
    return new FieldDefinitionNodeBuilder({
      name: this.node.name.copy(),
      description: this.node.description?.copy(),
      type: this.node.type.copy(),
      directives: this.node.directives?.map((v) => v.copy()),
      arguments: [
        ...(this.node.arguments || []).map((v) => v.copy()),
        argument,
      ],
    })
  }
}
