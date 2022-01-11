import {
  Expression,
  factory as f,
  TemplateMiddle,
  TemplateSpan,
  TemplateTail,
} from 'typescript'
import { Builder } from './types'

export type TemplateSpanBuilderOptions = {
  expression: Builder<Expression>
  literal: Builder<TemplateMiddle> | Builder<TemplateTail>
}

export class TemplateSpanBuilder implements Builder<TemplateSpan> {
  constructor(private options: TemplateSpanBuilderOptions) {}

  build(): TemplateSpan {
    return f.createTemplateSpan(
      this.options.expression.build(),
      this.options.literal.build(),
    )
  }

  copy(): TemplateSpanBuilder {
    return new TemplateSpanBuilder({
      expression: this.options.expression.copy(),
      literal: this.options.literal.copy(),
    })
  }
}
