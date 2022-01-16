import { Expression, factory as f, NonNullExpression } from 'typescript'
import { Builder } from './types'

export type NonNullExpressionBuilderOptions = {
  expression: Builder<Expression>
}

export class NonNullExpressionBuilder implements Builder<NonNullExpression> {
  constructor(private options: NonNullExpressionBuilderOptions) {}

  build(): NonNullExpression {
    return f.createNonNullExpression(this.options.expression.build())
  }

  copy(): NonNullExpressionBuilder {
    return new NonNullExpressionBuilder({
      expression: this.options.expression.copy(),
    })
  }
}
