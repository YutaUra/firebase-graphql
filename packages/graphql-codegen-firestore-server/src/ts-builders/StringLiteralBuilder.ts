import { factory as f, StringLiteral } from 'typescript'
import { Builder } from './types'

export type StringLiteralBuilderOptions = {
  text: string
  isSingleQuote?: boolean
}

export class StringLiteralBuilder implements Builder<StringLiteral> {
  constructor(private options: StringLiteralBuilderOptions) {}

  build(): StringLiteral {
    return f.createStringLiteral(this.options.text, this.options.isSingleQuote)
  }

  copy(): StringLiteralBuilder {
    return new StringLiteralBuilder({
      text: this.options.text,
      isSingleQuote: this.options.isSingleQuote,
    })
  }
}
