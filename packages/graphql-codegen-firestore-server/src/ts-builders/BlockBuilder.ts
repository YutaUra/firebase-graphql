import { Block, factory as f, Statement } from 'typescript'
import { Builder } from './types'

export type BlockBuilderOptions = {
  statements?: Builder<Statement>[]
  multiLine?: boolean
}

export class BlockBuilder implements Builder<Block> {
  constructor(private options: BlockBuilderOptions) {}

  build(): Block {
    return f.createBlock(
      this.options.statements?.map((s) => s.build()) ?? [],
      this.options.multiLine,
    )
  }

  copy(): BlockBuilder {
    return new BlockBuilder({
      statements: this.options.statements?.map((s) => s.copy()),
      multiLine: this.options.multiLine,
    })
  }

  addStatement(statement: Builder<Statement>): BlockBuilder {
    return new BlockBuilder({
      statements: [
        ...(this.options.statements ?? []).map((v) => v.copy()),
        statement,
      ],
      multiLine: this.options.multiLine,
    })
  }
}
