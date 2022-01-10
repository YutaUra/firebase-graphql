import { NamedTypeNodeBuilder } from './NamedTypeNodeBuilder'
import { NameNodeBuilder } from './NameNodeBuilder'

export const Scalars = {
  String: new NamedTypeNodeBuilder({
    name: new NameNodeBuilder({ value: 'String' }),
  }),
  ID: new NamedTypeNodeBuilder({
    name: new NameNodeBuilder({ value: 'ID' }),
  }),
  Timestamp: new NamedTypeNodeBuilder({
    name: new NameNodeBuilder({ value: 'Timestamp' }),
  }),
}
