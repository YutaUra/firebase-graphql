import { Expression, factory as f, NewExpression, TypeNode } from 'typescript'
import { Builder } from './types'

export type NewExpressionBuilderOptions = {
  expression: Builder<Expression>
  typeArguments?: Builder<TypeNode>[]
  argumentsArray?: Builder<Expression>[]
}

export class NewExpressionBuilder implements Builder<NewExpression> {
  constructor(private options: NewExpressionBuilderOptions) {}

  build(): NewExpression {
    return f.createNewExpression(
      this.options.expression.build(),
      this.options.typeArguments?.map((v) => v.build()),
      this.options.argumentsArray?.map((v) => v.build()),
    )
  }

  copy(): NewExpressionBuilder {
    return new NewExpressionBuilder({
      expression: this.options.expression.copy(),
      typeArguments: this.options.typeArguments?.map((v) => v.copy()),
      argumentsArray: this.options.argumentsArray?.map((v) => v.copy()),
    })
  }

  addTypeArgument(typeArgument: Builder<TypeNode>) {
    return new NewExpressionBuilder({
      expression: this.options.expression.copy(),
      typeArguments: [
        ...(this.options.typeArguments ?? []).map((v) => v.copy()),
        typeArgument,
      ],
      argumentsArray: this.options.argumentsArray?.map((v) => v.copy()),
    })
  }

  addArgument(argument: Builder<Expression>) {
    return new NewExpressionBuilder({
      expression: this.options.expression.copy(),
      typeArguments: this.options.typeArguments?.map((v) => v.copy()),
      argumentsArray: [
        ...(this.options.argumentsArray ?? []).map((v) => v.copy()),
        argument,
      ],
    })
  }
}
