import {
  factory as f,
  NodeFlags,
  VariableDeclaration,
  VariableDeclarationList,
} from 'typescript'
import { Builder } from './types'

export type VariableDeclarationListOptions = {
  declarations?: Builder<VariableDeclaration>[]
  flags?: NodeFlags
}

export class VariableDeclarationListBuilder
  implements Builder<VariableDeclarationList>
{
  constructor(private options: VariableDeclarationListOptions) {}

  build(): VariableDeclarationList {
    return f.createVariableDeclarationList(
      this.options.declarations?.map((v) => v.build()) ?? [],
      this.options.flags,
    )
  }

  copy(): VariableDeclarationListBuilder {
    return new VariableDeclarationListBuilder({
      declarations: this.options.declarations?.map((v) => v.copy()),
      flags: this.options.flags,
    })
  }

  addDeclaration(declaration: Builder<VariableDeclaration>) {
    return new VariableDeclarationListBuilder({
      declarations: [
        ...(this.options.declarations ?? []).map((v) => v.copy()),
        declaration,
      ],
      flags: this.options.flags,
    })
  }
}
