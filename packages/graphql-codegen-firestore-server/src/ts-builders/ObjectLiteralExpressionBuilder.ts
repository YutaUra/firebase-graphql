import {
  factory as f,
  ObjectLiteralElementLike,
  ObjectLiteralExpression,
} from 'typescript'
import { Builder } from './types'

export type ObjectLiteralExpressionOptions = {
  properties?: Builder<ObjectLiteralElementLike>[]
  multiLine?: boolean
}

export class ObjectLiteralExpressionBuilder
  implements Builder<ObjectLiteralExpression>
{
  constructor(private options: ObjectLiteralExpressionOptions) {}

  build(): ObjectLiteralExpression {
    return f.createObjectLiteralExpression(
      this.options.properties?.map((p) => p.build()),
      this.options.multiLine,
    )
  }

  copy(): ObjectLiteralExpressionBuilder {
    return new ObjectLiteralExpressionBuilder({
      properties: this.options.properties?.map((p) => p.copy()),
      multiLine: this.options.multiLine,
    })
  }

  addProperty(
    property: Builder<ObjectLiteralElementLike>,
  ): ObjectLiteralExpressionBuilder {
    return new ObjectLiteralExpressionBuilder({
      properties: [
        ...(this.options.properties ?? []).map((v) => v.copy()),
        property,
      ],
      multiLine: this.options.multiLine,
    })
  }
}
