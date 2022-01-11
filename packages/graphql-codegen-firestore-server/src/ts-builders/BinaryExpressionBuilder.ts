import {
  BinaryExpression,
  BinaryOperator,
  BinaryOperatorToken,
  Expression,
  factory as f,
} from 'typescript'
import { Builder, isBuilder } from './types'

export type BinaryExpressionBuilderOptions = {
  left: Builder<Expression>
  operator: BinaryOperator | Builder<BinaryOperatorToken>
  right: Builder<Expression>
}

export class BinaryExpressionBuilder implements Builder<BinaryExpression> {
  constructor(private options: BinaryExpressionBuilderOptions) {}

  build(): BinaryExpression {
    return f.createBinaryExpression(
      this.options.left.build(),
      isBuilder(this.options.operator)
        ? this.options.operator.build()
        : this.options.operator,
      this.options.right.build(),
    )
  }

  copy(): BinaryExpressionBuilder {
    return new BinaryExpressionBuilder({
      left: this.options.left.copy(),
      operator: isBuilder(this.options.operator)
        ? this.options.operator.copy()
        : this.options.operator,
      right: this.options.right.copy(),
    })
  }
}
