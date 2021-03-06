import {
  CallExpression,
  Expression,
  factory as f,
  MemberName,
  TypeNode,
} from 'typescript'
import { AwaitExpressionBuilder } from './AwaitExpressionBuilder'
import { PropertyAccessExpressionBuilder } from './PropertyAccessExpressionBuilder'
import { Builder } from './types'

export type CallExpressionBuilderOptions = {
  expression: Builder<Expression>
  typeArguments?: Builder<TypeNode>[]
  argumentsArray?: Builder<Expression>[]
}

export class CallExpressionBuilder implements Builder<CallExpression> {
  constructor(private options: CallExpressionBuilderOptions) {}

  build(): CallExpression {
    return f.createCallExpression(
      this.options.expression.build(),
      this.options.typeArguments?.map((v) => v.build()),
      this.options.argumentsArray?.map((v) => v.build()),
    )
  }

  copy(): CallExpressionBuilder {
    return new CallExpressionBuilder({
      expression: this.options.expression.copy(),
      typeArguments: this.options.typeArguments?.map((v) => v.copy()),
      argumentsArray: this.options.argumentsArray?.map((v) => v.copy()),
    })
  }

  addTypeArgument(typeArgument: Builder<TypeNode>) {
    return new CallExpressionBuilder({
      expression: this.options.expression.copy(),
      typeArguments: [
        ...(this.options.typeArguments ?? []).map((v) => v.copy()),
        typeArgument,
      ],
      argumentsArray: this.options.argumentsArray?.map((v) => v.copy()),
    })
  }

  addArgument(argument: Builder<Expression>) {
    return new CallExpressionBuilder({
      expression: this.options.expression.copy(),
      typeArguments: this.options.typeArguments?.map((v) => v.copy()),
      argumentsArray: [
        ...(this.options.argumentsArray ?? []).map((v) => v.copy()),
        argument,
      ],
    })
  }

  await() {
    return new AwaitExpressionBuilder({
      expression: this.copy(),
    })
  }

  dot(name: string | Builder<MemberName>) {
    return new PropertyAccessExpressionBuilder({
      expression: this.copy(),
      name,
    })
  }
}
