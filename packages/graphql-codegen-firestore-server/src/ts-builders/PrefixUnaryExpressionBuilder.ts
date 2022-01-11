import {
  Expression,
  factory as f,
  PrefixUnaryExpression,
  PrefixUnaryOperator,
} from 'typescript'
import { Builder } from './types'

export type PrefixUnaryExpressionBuilderOptions = {
  operator: PrefixUnaryOperator
  operand: Builder<Expression>
}

export class PrefixUnaryExpressionBuilder
  implements Builder<PrefixUnaryExpression>
{
  constructor(private options: PrefixUnaryExpressionBuilderOptions) {}

  build(): PrefixUnaryExpression {
    return f.createPrefixUnaryExpression(
      this.options.operator,
      this.options.operand.build(),
    )
  }

  copy(): PrefixUnaryExpressionBuilder {
    return new PrefixUnaryExpressionBuilder({
      operator: this.options.operator,
      operand: this.options.operand.copy(),
    })
  }
}
