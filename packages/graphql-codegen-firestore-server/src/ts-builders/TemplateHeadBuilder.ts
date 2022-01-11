import { factory as f, TemplateHead, TokenFlags } from 'typescript'
import { Builder } from './types'

export type TemplateHeadBuilderOptions = {
  text: string
  rawText?: string
  templateFlags?: TokenFlags
}

export class TemplateHeadBuilder implements Builder<TemplateHead> {
  constructor(private options: TemplateHeadBuilderOptions) {}

  build(): TemplateHead {
    return f.createTemplateHead(
      this.options.text,
      this.options.rawText,
      this.options.templateFlags,
    )
  }

  copy(): TemplateHeadBuilder {
    return new TemplateHeadBuilder({
      text: this.options.text,
      rawText: this.options.rawText,
      templateFlags: this.options.templateFlags,
    })
  }
}
