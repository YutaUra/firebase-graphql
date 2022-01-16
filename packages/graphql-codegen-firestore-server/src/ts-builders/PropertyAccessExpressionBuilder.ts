import {
  Expression,
  factory as f,
  MemberName,
  PropertyAccessExpression,
} from 'typescript'
import { CallExpressionBuilder } from './CallExpressionBuilder'
import { Builder } from './types'

export type PropertyAccessExpressionBuilderOptions = {
  expression: Builder<Expression>
  name: string | Builder<MemberName>
}

export class PropertyAccessExpressionBuilder
  implements Builder<PropertyAccessExpression>
{
  constructor(private options: PropertyAccessExpressionBuilderOptions) {}

  build(): PropertyAccessExpression {
    return f.createPropertyAccessExpression(
      this.options.expression.build(),
      typeof this.options.name === 'string'
        ? this.options.name
        : this.options.name.build(),
    )
  }

  copy(): PropertyAccessExpressionBuilder {
    return new PropertyAccessExpressionBuilder({
      expression: this.options.expression.copy(),
      name:
        typeof this.options.name === 'string'
          ? this.options.name
          : this.options.name.copy(),
    })
  }

  dot(name: string | Builder<MemberName>) {
    return new PropertyAccessExpressionBuilder({
      expression: this.copy(),
      name,
    })
  }

  call() {
    return new CallExpressionBuilder({
      expression: this.copy(),
    })
  }
}
