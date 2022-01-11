import { factory as f, Modifier, ModifierSyntaxKind } from 'typescript'
import { Builder } from './types'

export type ModifierBuilderOptions = {
  kind: ModifierSyntaxKind
}

export class ModifierBuilder implements Builder<Modifier> {
  constructor(private options: ModifierBuilderOptions) {}

  build(): Modifier {
    return f.createModifier(this.options.kind)
  }

  copy(): ModifierBuilder {
    return new ModifierBuilder({ kind: this.options.kind })
  }
}
