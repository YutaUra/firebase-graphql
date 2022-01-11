import { Expression, factory as f, ThrowStatement } from 'typescript'
import { Builder } from './types'

export type ThrowStatementBuilderOptions = {
  expression: Builder<Expression>
}

export class ThrowStatementBuilder implements Builder<ThrowStatement> {
  constructor(private options: ThrowStatementBuilderOptions) {}

  build(): ThrowStatement {
    return f.createThrowStatement(this.options.expression.build())
  }

  copy(): ThrowStatementBuilder {
    return new ThrowStatementBuilder({
      expression: this.options.expression.copy(),
    })
  }
}
