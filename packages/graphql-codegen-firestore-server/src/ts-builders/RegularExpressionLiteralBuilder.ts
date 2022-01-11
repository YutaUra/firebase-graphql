import { factory as f, RegularExpressionLiteral } from 'typescript'
import { Builder } from './types'

export type RegularExpressionLiteralBuilderOptions = {
  text: string
}

export class RegularExpressionLiteralBuilder
  implements Builder<RegularExpressionLiteral>
{
  constructor(private options: RegularExpressionLiteralBuilderOptions) {}

  build(): RegularExpressionLiteral {
    return f.createRegularExpressionLiteral(this.options.text)
  }

  copy(): RegularExpressionLiteralBuilder {
    return new RegularExpressionLiteralBuilder({
      text: this.options.text,
    })
  }

  static fromRegexp(regexp: RegExp): RegularExpressionLiteralBuilder {
    return new RegularExpressionLiteralBuilder({
      text: regexp.toString(),
    })
  }
}
