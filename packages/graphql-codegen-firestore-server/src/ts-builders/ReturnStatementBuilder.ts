import { Expression, factory as f, ReturnStatement } from 'typescript'
import { Builder } from './types'

export type ReturnStatementBuilderOptions = {
  expression?: Builder<Expression>
}

export class ReturnStatementBuilder implements Builder<ReturnStatement> {
  constructor(private options: ReturnStatementBuilderOptions) {}

  build(): ReturnStatement {
    return f.createReturnStatement(this.options.expression?.build())
  }

  copy(): ReturnStatementBuilder {
    return new ReturnStatementBuilder({
      expression: this.options.expression?.copy(),
    })
  }
}
