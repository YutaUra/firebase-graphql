import { EndOfFileToken, factory as f, SyntaxKind } from 'typescript'
import { Builder } from './types'

export class EndOfFileTokenBuilder implements Builder<EndOfFileToken> {
  constructor() {}

  build() {
    return f.createToken(SyntaxKind.EndOfFileToken)
  }

  copy(): EndOfFileTokenBuilder {
    return new EndOfFileTokenBuilder()
  }
}
