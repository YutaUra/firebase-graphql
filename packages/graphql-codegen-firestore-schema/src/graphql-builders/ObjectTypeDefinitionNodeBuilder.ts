import {
  ConstDirectiveNode,
  FieldDefinitionNode,
  Kind,
  NamedTypeNode,
  NameNode,
  ObjectTypeDefinitionNode,
  StringValueNode,
} from 'graphql'
import { NamedTypeNodeBuilder } from './NamedTypeNodeBuilder'
import { BuilderAstNode } from './types'

type ObjectTypeDefinitionNodeBuilderProps = {
  description?: BuilderAstNode<StringValueNode>
  name: BuilderAstNode<NameNode>
  interfaces?: BuilderAstNode<NamedTypeNode>[]
  directives?: BuilderAstNode<ConstDirectiveNode>[]
  fields?: BuilderAstNode<FieldDefinitionNode>[]
}

export class ObjectTypeDefinitionNodeBuilder
  implements BuilderAstNode<ObjectTypeDefinitionNode>
{
  constructor(private node: ObjectTypeDefinitionNodeBuilderProps) {}

  build(): ObjectTypeDefinitionNode {
    return {
      kind: Kind.OBJECT_TYPE_DEFINITION,
      description: this.node.description?.build(),
      name: this.node.name.build(),
      interfaces: this.node.interfaces?.map((v) => v.build()),
      directives: this.node.directives?.map((v) => v.build()),
      fields: this.node.fields?.map((v) => v.build()),
    }
  }

  copy(): ObjectTypeDefinitionNodeBuilder {
    return new ObjectTypeDefinitionNodeBuilder({
      description: this.node.description?.copy(),
      name: this.node.name.copy(),
      interfaces: this.node.interfaces?.map((v) => v.copy()),
      directives: this.node.directives?.map((v) => v.copy()),
      fields: this.node.fields?.map((v) => v.copy()),
    })
  }

  toNamedType() {
    return new NamedTypeNodeBuilder({
      name: this.node.name.copy(),
    })
  }

  addInterface(interfaceType: BuilderAstNode<NamedTypeNode>) {
    return new ObjectTypeDefinitionNodeBuilder({
      description: this.node.description?.copy(),
      name: this.node.name.copy(),
      interfaces: [
        ...(this.node.interfaces || []).map((v) => v.copy()),
        interfaceType,
      ],
      directives: this.node.directives?.map((v) => v.copy()),
      fields: this.node.fields?.map((v) => v.copy()),
    })
  }

  addDirective(directive: BuilderAstNode<ConstDirectiveNode>) {
    return new ObjectTypeDefinitionNodeBuilder({
      description: this.node.description?.copy(),
      name: this.node.name.copy(),
      interfaces: this.node.interfaces?.map((v) => v.copy()),
      directives: [
        ...(this.node.directives || []).map((v) => v.copy()),
        directive,
      ],
      fields: this.node.fields?.map((v) => v.copy()),
    })
  }

  addField(field: BuilderAstNode<FieldDefinitionNode>) {
    return new ObjectTypeDefinitionNodeBuilder({
      description: this.node.description?.copy(),
      name: this.node.name.copy(),
      interfaces: this.node.interfaces?.map((v) => v.copy()),
      directives: this.node.directives?.map((v) => v.copy()),
      fields: [...(this.node.fields || []).map((v) => v.copy()), field],
    })
  }
}
