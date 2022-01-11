import { factory as f, NullLiteral } from 'typescript'
import { Builder } from './types'

export type NullBuilderOptions = {}

export class NullBuilder implements Builder<NullLiteral> {
  constructor(private options: NullBuilderOptions) {}

  build(): NullLiteral {
    return f.createNull()
  }

  copy(): NullBuilder {
    return new NullBuilder({})
  }
}
