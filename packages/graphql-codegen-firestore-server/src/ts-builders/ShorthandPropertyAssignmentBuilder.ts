import {
  Expression,
  factory as f,
  Identifier,
  ShorthandPropertyAssignment,
} from 'typescript'
import { Builder } from './types'

export type ShorthandPropertyAssignmentBuilderOptions = {
  name: string | Builder<Identifier>
  objectAssignmentInitializer?: Builder<Expression>
}

export class ShorthandPropertyAssignmentBuilder
  implements Builder<ShorthandPropertyAssignment>
{
  constructor(private options: ShorthandPropertyAssignmentBuilderOptions) {}

  build(): ShorthandPropertyAssignment {
    return f.createShorthandPropertyAssignment(
      typeof this.options.name === 'string'
        ? this.options.name
        : this.options.name.build(),
      this.options.objectAssignmentInitializer?.build(),
    )
  }

  copy(): ShorthandPropertyAssignmentBuilder {
    return new ShorthandPropertyAssignmentBuilder({
      name:
        typeof this.options.name === 'string'
          ? this.options.name
          : this.options.name.copy(),
      objectAssignmentInitializer:
        this.options.objectAssignmentInitializer?.copy(),
    })
  }
}
