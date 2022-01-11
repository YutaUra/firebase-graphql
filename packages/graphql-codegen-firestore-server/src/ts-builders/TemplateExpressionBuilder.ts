import ts, {
  factory as f,
  TemplateExpression,
  TemplateHead,
  TemplateSpan,
} from 'typescript'
import { Builder, toBuilder } from './types'

export type TemplateExpressionBuilderOptions = {
  head: Builder<TemplateHead>
  templateSpans?: Builder<TemplateSpan>[]
}

export class TemplateExpressionBuilder implements Builder<TemplateExpression> {
  constructor(private options: TemplateExpressionBuilderOptions) {}

  build(): TemplateExpression {
    return f.createTemplateExpression(
      this.options.head.build(),
      this.options.templateSpans?.map((v) => v.build()) ?? [],
    )
  }

  copy(): TemplateExpressionBuilder {
    return new TemplateExpressionBuilder({
      head: this.options.head.copy(),
      templateSpans: this.options.templateSpans?.map((v) => v.copy()),
    })
  }

  static fromCode(code: string) {
    const statement = ts.createSourceFile(
      'TemplateExpressionBuilder.fromCode.ts',
      code,
      ts.ScriptTarget.ESNext,
    ).statements[0]
    if (!ts.isExpressionStatement(statement)) {
      throw new Error(`Expected expression statement, got ${statement.kind}`)
    }
    if (!ts.isTemplateExpression(statement.expression)) {
      throw new Error(
        `Expected template expression, got ${statement.expression.kind}`,
      )
    }
    const templateExpression = statement.expression

    return new TemplateExpressionBuilder({
      head: toBuilder(templateExpression.head),
      templateSpans: templateExpression.templateSpans.map(toBuilder),
    })
  }

  addTemplateSpan(
    templateSpan: Builder<TemplateSpan>,
  ): TemplateExpressionBuilder {
    return new TemplateExpressionBuilder({
      head: this.options.head.copy(),
      templateSpans: [
        ...(this.options.templateSpans ?? []).map((v) => v.copy()),
        templateSpan,
      ],
    })
  }
}
