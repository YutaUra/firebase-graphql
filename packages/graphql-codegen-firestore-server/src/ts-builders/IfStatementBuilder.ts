import { Expression, factory as f, IfStatement, Statement } from 'typescript'
import { Builder } from './types'

export type IfStatementBuilderOptions = {
  expression: Builder<Expression>
  thenStatement: Builder<Statement>
  elseStatement?: Builder<Statement>
}

export class IfStatementBuilder implements Builder<IfStatement> {
  constructor(private options: IfStatementBuilderOptions) {}

  build(): IfStatement {
    return f.createIfStatement(
      this.options.expression.build(),
      this.options.thenStatement.build(),
      this.options.elseStatement?.build(),
    )
  }

  copy(): IfStatementBuilder {
    return new IfStatementBuilder({
      expression: this.options.expression.copy(),
      thenStatement: this.options.thenStatement.copy(),
      elseStatement: this.options.elseStatement?.copy(),
    })
  }
}
