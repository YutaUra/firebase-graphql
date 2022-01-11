import { factory as f, TemplateTail, TokenFlags } from 'typescript'
import { Builder } from './types'

export type TemplateTailBuilderOptions = {
  text: string
  rawText?: string
  templateFlags?: TokenFlags
}

export class TemplateTailBuilder implements Builder<TemplateTail> {
  constructor(private options: TemplateTailBuilderOptions) {}

  build(): TemplateTail {
    return f.createTemplateTail(
      this.options.text,
      this.options.rawText,
      this.options.templateFlags,
    )
  }

  copy(): TemplateTailBuilder {
    return new TemplateTailBuilder({
      text: this.options.text,
      rawText: this.options.rawText,
      templateFlags: this.options.templateFlags,
    })
  }
}
