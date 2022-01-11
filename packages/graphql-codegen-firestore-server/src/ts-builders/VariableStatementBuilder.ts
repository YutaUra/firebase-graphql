import {
  factory as f,
  Modifier,
  VariableDeclaration,
  VariableDeclarationList,
  VariableStatement,
} from 'typescript'
import { Builder } from './types'

export type VariableStatementBuilderOptions = {
  modifiers?: Builder<Modifier>[]
  declarationList:
    | Builder<VariableDeclarationList>
    | Builder<VariableDeclaration>[]
}

export class VariableStatementBuilder implements Builder<VariableStatement> {
  constructor(private options: VariableStatementBuilderOptions) {}

  build(): VariableStatement {
    return f.createVariableStatement(
      this.options.modifiers?.map((v) => v.build()),
      Array.isArray(this.options.declarationList)
        ? this.options.declarationList.map((v) => v.build())
        : this.options.declarationList.build(),
    )
  }

  copy(): VariableStatementBuilder {
    return new VariableStatementBuilder({
      modifiers: this.options.modifiers?.map((v) => v.copy()),
      declarationList: Array.isArray(this.options.declarationList)
        ? this.options.declarationList.map((v) => v.copy())
        : this.options.declarationList.copy(),
    })
  }

  addModifier(modifier: Builder<Modifier>): VariableStatementBuilder {
    return new VariableStatementBuilder({
      declarationList: Array.isArray(this.options.declarationList)
        ? this.options.declarationList.map((v) => v.copy())
        : this.options.declarationList.copy(),
      modifiers: [
        ...(this.options.modifiers || []).map((v) => v.copy()),
        modifier,
      ],
    })
  }
}
