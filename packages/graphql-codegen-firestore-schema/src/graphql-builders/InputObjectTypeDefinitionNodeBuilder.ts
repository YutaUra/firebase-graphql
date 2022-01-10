import {
  ConstDirectiveNode,
  InputObjectTypeDefinitionNode,
  InputValueDefinitionNode,
  Kind,
  NameNode,
  StringValueNode,
} from 'graphql'
import { NamedTypeNodeBuilder } from './NamedTypeNodeBuilder'
import { BuilderAstNode } from './types'

export type InputObjectTypeDefinitionNodeBuilderProps = {
  description?: BuilderAstNode<StringValueNode>
  name: BuilderAstNode<NameNode>
  directives?: BuilderAstNode<ConstDirectiveNode>[]
  fields?: BuilderAstNode<InputValueDefinitionNode>[]
}

export class InputObjectTypeDefinitionNodeBuilder
  implements BuilderAstNode<InputObjectTypeDefinitionNode>
{
  constructor(private node: InputObjectTypeDefinitionNodeBuilderProps) {}

  build(): InputObjectTypeDefinitionNode {
    return {
      kind: Kind.INPUT_OBJECT_TYPE_DEFINITION,
      description: this.node.description?.build(),
      name: this.node.name.build(),
      directives: this.node.directives?.map((v) => v.build()),
      fields: this.node.fields?.map((v) => v.build()),
    }
  }

  copy(): InputObjectTypeDefinitionNodeBuilder {
    return new InputObjectTypeDefinitionNodeBuilder({
      description: this.node.description?.copy(),
      name: this.node.name.copy(),
      directives: this.node.directives?.map((v) => v.copy()),
      fields: this.node.fields?.map((v) => v.copy()),
    })
  }

  addDirective(directive: BuilderAstNode<ConstDirectiveNode>) {
    return new InputObjectTypeDefinitionNodeBuilder({
      description: this.node.description?.copy(),
      name: this.node.name.copy(),
      directives: [
        ...(this.node.directives || []).map((v) => v.copy()),
        directive,
      ],
      fields: this.node.fields?.map((v) => v.copy()),
    })
  }

  addField(field: BuilderAstNode<InputValueDefinitionNode>) {
    return new InputObjectTypeDefinitionNodeBuilder({
      description: this.node.description?.copy(),
      name: this.node.name.copy(),
      directives: this.node.directives?.map((v) => v.copy()),
      fields: [...(this.node.fields || []).map((v) => v.copy()), field],
    })
  }

  toNamedType(): NamedTypeNodeBuilder {
    return new NamedTypeNodeBuilder({
      name: this.node.name.copy(),
    })
  }
}
