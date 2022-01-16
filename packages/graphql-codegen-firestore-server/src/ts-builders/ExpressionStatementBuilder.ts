import { Expression, ExpressionStatement, factory as f } from 'typescript'
import { Builder } from './types'

export type ExpressionStatementBuilderOptions = {
  expression: Builder<Expression>
}

export class ExpressionStatementBuilder
  implements Builder<ExpressionStatement>
{
  constructor(private options: ExpressionStatementBuilderOptions) {}

  build(): ExpressionStatement {
    return f.createExpressionStatement(this.options.expression.build())
  }

  copy(): ExpressionStatementBuilder {
    return new ExpressionStatementBuilder({
      expression: this.options.expression.copy(),
    })
  }
}
