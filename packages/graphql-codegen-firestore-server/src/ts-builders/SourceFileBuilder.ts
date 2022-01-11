import {
  EndOfFileToken,
  factory as f,
  NodeFlags,
  SourceFile,
  Statement,
} from 'typescript'
import { Builder } from './types'

export type SourceFileBuilderOptions = {
  statements: Builder<Statement>[]
  endOfFileToken: Builder<EndOfFileToken>
  flags: NodeFlags
}

export class SourceFileBuilder implements Builder<SourceFile> {
  constructor(private options: SourceFileBuilderOptions) {}

  build(): SourceFile {
    return f.createSourceFile(
      this.options.statements.map((v) => v.build()),
      this.options.endOfFileToken.build(),
      this.options.flags,
    )
  }

  copy(): Builder<SourceFile> {
    return new SourceFileBuilder({
      statements: this.options.statements.map((v) => v.copy()),
      endOfFileToken: this.options.endOfFileToken.copy(),
      flags: this.options.flags,
    })
  }

  addStatement(statement: Builder<Statement>): SourceFileBuilder {
    return new SourceFileBuilder({
      ...this.options,
      statements: [...this.options.statements, statement],
    })
  }
}
