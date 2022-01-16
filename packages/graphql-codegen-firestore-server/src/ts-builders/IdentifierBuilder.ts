import { factory as f, Identifier, MemberName } from 'typescript'
import { CallExpressionBuilder } from './CallExpressionBuilder'
import { PropertyAccessExpressionBuilder } from './PropertyAccessExpressionBuilder'
import { Builder } from './types'

export type IdentifierOptions = {
  text: string
}

export class IdentifierBuilder implements Builder<Identifier> {
  constructor(private options: IdentifierOptions) {}

  build(): Identifier {
    return f.createIdentifier(this.options.text)
  }

  copy(): IdentifierBuilder {
    return new IdentifierBuilder({ text: this.options.text })
  }

  dot(name: string | Builder<MemberName>) {
    return new PropertyAccessExpressionBuilder({
      expression: this.copy(),
      name,
    })
  }

  call() {
    return new CallExpressionBuilder({
      expression: this.copy(),
    })
  }
}
