import {
  BindingName,
  Decorator,
  DotDotDotToken,
  Expression,
  factory as f,
  Modifier,
  ParameterDeclaration,
  QuestionToken,
  TypeNode,
} from 'typescript'
import { Builder } from './types'

export type ParameterDeclarationBuilderOptions = {
  decorators?: Builder<Decorator>[]
  modifiers?: Builder<Modifier>[]
  dotDotDotToken?: Builder<DotDotDotToken>
  name: string | Builder<BindingName>
  questionToken?: Builder<QuestionToken>
  type?: Builder<TypeNode>
  initializer?: Builder<Expression>
}

export class ParameterDeclarationBuilder
  implements Builder<ParameterDeclaration>
{
  constructor(private options: ParameterDeclarationBuilderOptions) {}

  build(): ParameterDeclaration {
    return f.createParameterDeclaration(
      this.options.decorators?.map((v) => v.build()),
      this.options.modifiers?.map((v) => v.build()),
      this.options.dotDotDotToken?.build(),
      typeof this.options.name === 'string'
        ? this.options.name
        : this.options.name.build(),
      this.options.questionToken?.build(),
      this.options.type?.build(),
      this.options.initializer?.build(),
    )
  }

  copy(): ParameterDeclarationBuilder {
    return new ParameterDeclarationBuilder({
      decorators: this.options.decorators?.map((v) => v.copy()),
      modifiers: this.options.modifiers?.map((v) => v.copy()),
      dotDotDotToken: this.options.dotDotDotToken?.copy(),
      name:
        typeof this.options.name === 'string'
          ? this.options.name
          : this.options.name.copy(),
      questionToken: this.options.questionToken?.copy(),
      type: this.options.type?.copy(),
      initializer: this.options.initializer?.copy(),
    })
  }

  addDecorator(decorator: Builder<Decorator>): ParameterDeclarationBuilder {
    return new ParameterDeclarationBuilder({
      decorators: [
        ...(this.options.decorators ?? []).map((v) => v.copy()),
        decorator,
      ],
      modifiers: this.options.modifiers?.map((v) => v.copy()),
      dotDotDotToken: this.options.dotDotDotToken?.copy(),
      name:
        typeof this.options.name === 'string'
          ? this.options.name
          : this.options.name.copy(),
      questionToken: this.options.questionToken?.copy(),
      type: this.options.type?.copy(),
      initializer: this.options.initializer?.copy(),
    })
  }

  addModifier(modifier: Builder<Modifier>): ParameterDeclarationBuilder {
    return new ParameterDeclarationBuilder({
      decorators: this.options.decorators?.map((v) => v.copy()),
      modifiers: [
        ...(this.options.modifiers ?? []).map((v) => v.copy()),
        modifier,
      ],
      dotDotDotToken: this.options.dotDotDotToken?.copy(),
      name:
        typeof this.options.name === 'string'
          ? this.options.name
          : this.options.name.copy(),
      questionToken: this.options.questionToken?.copy(),
      type: this.options.type?.copy(),
      initializer: this.options.initializer?.copy(),
    })
  }
}
