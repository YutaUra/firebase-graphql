import { EqualsGreaterThanToken, factory as f, SyntaxKind } from 'typescript'
import { Builder } from './types'

export class EqualsGreaterThanTokenBuilder
  implements Builder<EqualsGreaterThanToken>
{
  constructor() {}

  build() {
    return f.createToken(SyntaxKind.EqualsGreaterThanToken)
  }

  copy(): EqualsGreaterThanTokenBuilder {
    return new EqualsGreaterThanTokenBuilder()
  }
}
