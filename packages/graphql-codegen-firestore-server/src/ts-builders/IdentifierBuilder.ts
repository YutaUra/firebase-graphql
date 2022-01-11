import { factory as f, Identifier } from 'typescript'
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
}
