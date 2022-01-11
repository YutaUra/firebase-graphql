import {
  AsteriskToken,
  Block,
  Decorator,
  factory as f,
  MethodDeclaration,
  Modifier,
  ParameterDeclaration,
  PropertyName,
  QuestionToken,
  TypeNode,
  TypeParameterDeclaration,
} from 'typescript'
import { Builder } from './types'

export type MethodDeclarationBuilderOptions = {
  decorators?: Builder<Decorator>[]
  modifiers?: Builder<Modifier>[]
  asteriskToken?: Builder<AsteriskToken>
  name: string | Builder<PropertyName>
  questionToken?: Builder<QuestionToken>
  typeParameters?: Builder<TypeParameterDeclaration>[]
  parameters?: Builder<ParameterDeclaration>[]
  type?: Builder<TypeNode>
  body?: Builder<Block>
}

export class MethodDeclarationBuilder implements Builder<MethodDeclaration> {
  constructor(private options: MethodDeclarationBuilderOptions) {}

  build(): MethodDeclaration {
    return f.createMethodDeclaration(
      this.options.decorators?.map((v) => v.build()),
      this.options.modifiers?.map((v) => v.build()),
      this.options.asteriskToken?.build(),
      typeof this.options.name === 'string'
        ? this.options.name
        : this.options.name.build(),
      this.options.questionToken?.build(),
      this.options.typeParameters?.map((v) => v.build()),
      this.options.parameters?.map((v) => v.build()) ?? [],
      this.options.type?.build(),
      this.options.body?.build(),
    )
  }

  copy(): MethodDeclarationBuilder {
    return new MethodDeclarationBuilder({
      name:
        typeof this.options.name === 'string'
          ? this.options.name
          : this.options.name.copy(),
      decorators: this.options.decorators?.map((v) => v.copy()),
      modifiers: this.options.modifiers?.map((v) => v.copy()),
      asteriskToken: this.options.asteriskToken?.copy(),
      questionToken: this.options.questionToken?.copy(),
      typeParameters: this.options.typeParameters?.map((v) => v.copy()),
      parameters: this.options.parameters?.map((v) => v.copy()),
      type: this.options.type?.copy(),
      body: this.options.body?.copy(),
    })
  }

  addDecorator(decorator: Builder<Decorator>): MethodDeclarationBuilder {
    return new MethodDeclarationBuilder({
      name:
        typeof this.options.name === 'string'
          ? this.options.name
          : this.options.name.copy(),
      decorators: [
        ...(this.options.decorators || []).map((v) => v.copy()),
        decorator,
      ],
      modifiers: this.options.modifiers?.map((v) => v.copy()),
      asteriskToken: this.options.asteriskToken?.copy(),
      questionToken: this.options.questionToken?.copy(),
      typeParameters: this.options.typeParameters?.map((v) => v.copy()),
      parameters: this.options.parameters?.map((v) => v.copy()),
      type: this.options.type?.copy(),
      body: this.options.body?.copy(),
    })
  }

  addModifier(modifier: Builder<Modifier>): MethodDeclarationBuilder {
    return new MethodDeclarationBuilder({
      name:
        typeof this.options.name === 'string'
          ? this.options.name
          : this.options.name.copy(),
      decorators: this.options.decorators?.map((v) => v.copy()),
      modifiers: [
        ...(this.options.modifiers || []).map((v) => v.copy()),
        modifier,
      ],
      asteriskToken: this.options.asteriskToken?.copy(),
      questionToken: this.options.questionToken?.copy(),
      typeParameters: this.options.typeParameters?.map((v) => v.copy()),
      parameters: this.options.parameters?.map((v) => v.copy()),
      type: this.options.type?.copy(),
      body: this.options.body?.copy(),
    })
  }

  addAsteriskToken(
    asteriskToken: Builder<AsteriskToken>,
  ): MethodDeclarationBuilder {
    return new MethodDeclarationBuilder({
      name:
        typeof this.options.name === 'string'
          ? this.options.name
          : this.options.name.copy(),
      decorators: this.options.decorators?.map((v) => v.copy()),
      modifiers: this.options.modifiers?.map((v) => v.copy()),
      asteriskToken: asteriskToken,
      questionToken: this.options.questionToken?.copy(),
      typeParameters: this.options.typeParameters?.map((v) => v.copy()),
      parameters: this.options.parameters?.map((v) => v.copy()),
      type: this.options.type?.copy(),
      body: this.options.body?.copy(),
    })
  }

  addQuestionToken(
    questionToken: Builder<QuestionToken>,
  ): MethodDeclarationBuilder {
    return new MethodDeclarationBuilder({
      name:
        typeof this.options.name === 'string'
          ? this.options.name
          : this.options.name.copy(),
      decorators: this.options.decorators?.map((v) => v.copy()),
      modifiers: this.options.modifiers?.map((v) => v.copy()),
      asteriskToken: this.options.asteriskToken?.copy(),
      questionToken: questionToken,
      typeParameters: this.options.typeParameters?.map((v) => v.copy()),
      parameters: this.options.parameters?.map((v) => v.copy()),
      type: this.options.type?.copy(),
      body: this.options.body?.copy(),
    })
  }

  addTypeParameter(
    typeParameter: Builder<TypeParameterDeclaration>,
  ): MethodDeclarationBuilder {
    return new MethodDeclarationBuilder({
      name:
        typeof this.options.name === 'string'
          ? this.options.name
          : this.options.name.copy(),
      decorators: this.options.decorators?.map((v) => v.copy()),
      modifiers: this.options.modifiers?.map((v) => v.copy()),
      asteriskToken: this.options.asteriskToken?.copy(),
      questionToken: this.options.questionToken?.copy(),
      typeParameters: [
        ...(this.options.typeParameters || []).map((v) => v.copy()),
        typeParameter,
      ],
      parameters: this.options.parameters?.map((v) => v.copy()),
      type: this.options.type?.copy(),
      body: this.options.body?.copy(),
    })
  }

  addParameter(
    parameter: Builder<ParameterDeclaration>,
  ): MethodDeclarationBuilder {
    return new MethodDeclarationBuilder({
      name:
        typeof this.options.name === 'string'
          ? this.options.name
          : this.options.name.copy(),
      decorators: this.options.decorators?.map((v) => v.copy()),
      modifiers: this.options.modifiers?.map((v) => v.copy()),
      asteriskToken: this.options.asteriskToken?.copy(),
      questionToken: this.options.questionToken?.copy(),
      typeParameters: this.options.typeParameters?.map((v) => v.copy()),
      parameters: [
        ...(this.options.parameters || []).map((v) => v.copy()),
        parameter,
      ],
      type: this.options.type?.copy(),
      body: this.options.body?.copy(),
    })
  }
}
