import { AwaitExpression, Expression, factory as f } from 'typescript'
import { Builder } from './types'

export type AwaitExpressionBuilderOptions = {
  expression: Builder<Expression>
}

export class AwaitExpressionBuilder implements Builder<AwaitExpression> {
  constructor(private options: AwaitExpressionBuilderOptions) {}

  build(): AwaitExpression {
    return f.createAwaitExpression(this.options.expression.build())
  }

  copy(): AwaitExpressionBuilder {
    return new AwaitExpressionBuilder({
      expression: this.options.expression.copy(),
    })
  }
}
