import {
  Expression,
  factory as f,
  PropertyAssignment,
  PropertyName,
} from 'typescript'
import { Builder } from './types'

export type PropertyAssignmentBuilderOptions = {
  name: string | Builder<PropertyName>
  initializer: Builder<Expression>
}

export class PropertyAssignmentBuilder implements Builder<PropertyAssignment> {
  constructor(private options: PropertyAssignmentBuilderOptions) {}

  build(): PropertyAssignment {
    return f.createPropertyAssignment(
      typeof this.options.name === 'string'
        ? this.options.name
        : this.options.name.build(),
      this.options.initializer.build(),
    )
  }

  copy(): Builder<PropertyAssignment> {
    return new PropertyAssignmentBuilder({
      name:
        typeof this.options.name === 'string'
          ? this.options.name
          : this.options.name.copy(),
      initializer: this.options.initializer.copy(),
    })
  }
}
