import {
  BindingName,
  ExclamationToken,
  Expression,
  factory as f,
  TypeNode,
  VariableDeclaration,
} from 'typescript'
import { Builder } from './types'

export type VariableDeclarationOptions = {
  name: string | Builder<BindingName>
  exclamationToken?: Builder<ExclamationToken>
  type?: Builder<TypeNode>
  initializer?: Builder<Expression>
}

export class VariableDeclarationBuilder
  implements Builder<VariableDeclaration>
{
  constructor(private options: VariableDeclarationOptions) {}

  build(): VariableDeclaration {
    return f.createVariableDeclaration(
      typeof this.options.name === 'string'
        ? this.options.name
        : this.options.name.build(),
      this.options.exclamationToken?.build(),
      this.options.type?.build(),
      this.options.initializer?.build(),
    )
  }

  copy(): VariableDeclarationBuilder {
    return new VariableDeclarationBuilder({
      name:
        typeof this.options.name === 'string'
          ? this.options.name
          : this.options.name.copy(),
      exclamationToken: this.options.exclamationToken?.copy(),
      type: this.options.type?.copy(),
      initializer: this.options.initializer?.copy(),
    })
  }
}
