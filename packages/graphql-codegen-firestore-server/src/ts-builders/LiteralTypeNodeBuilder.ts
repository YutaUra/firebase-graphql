import { factory as f, LiteralTypeNode } from 'typescript'
import { Builder } from './types'

export type LiteralTypeNodeBuilderOptions = {
  literal: Builder<LiteralTypeNode['literal']>
}

export class LiteralTypeNodeBuilder implements Builder<LiteralTypeNode> {
  constructor(private options: LiteralTypeNodeBuilderOptions) {}

  build(): LiteralTypeNode {
    return f.createLiteralTypeNode(this.options.literal.build())
  }

  copy(): LiteralTypeNodeBuilder {
    return new LiteralTypeNodeBuilder({
      literal: this.options.literal.copy(),
    })
  }
}
