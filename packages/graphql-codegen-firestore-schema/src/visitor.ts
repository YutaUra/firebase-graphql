import {
  FirestoreCoreVisitor,
  FirestoreDocumentMatch,
  FirestoreField,
  FirestoreType,
} from '@firebase-graphql/graphql-codegen-firestore-core'
import { ParsedTypesConfig } from '@graphql-codegen/visitor-plugin-common'
import {
  DefinitionNode,
  DocumentNode,
  FieldDefinitionNode,
  Kind,
  ObjectTypeDefinitionNode,
} from 'graphql'
import { FirestoreSchemaPluginConfig } from './config'
import { FieldDefinitionNodeBuilder } from './graphql-builders/FieldDefinitionNodeBuilder'
import { InputObjectTypeDefinitionNodeBuilder } from './graphql-builders/InputObjectTypeDefinitionNodeBuilder'
import { InputValueDefinitionNodeBuilder } from './graphql-builders/InputValueDefinitionNodeBuilder'
import { ListTypeNodeBuilder } from './graphql-builders/ListTypeNodeBuilder'
import { NamedTypeNodeBuilder } from './graphql-builders/NamedTypeNodeBuilder'
import { NameNodeBuilder } from './graphql-builders/NameNodeBuilder'
import { ObjectTypeDefinitionNodeBuilder } from './graphql-builders/ObjectTypeDefinitionNodeBuilder'
import { Scalars } from './graphql-builders/Scalars'
import { TypeNodeBuilder } from './graphql-builders/TypeNodeBuilder'

const isNotNullable = <T>(value: T | null | undefined): value is T =>
  value !== null && value !== undefined

export interface FirestoreRulesPluginParsedConfig extends ParsedTypesConfig {}

export class FirestoreRulesVisitor<
  TRawConfig extends FirestoreSchemaPluginConfig = FirestoreSchemaPluginConfig,
  TParsedConfig extends FirestoreRulesPluginParsedConfig = FirestoreRulesPluginParsedConfig,
> extends FirestoreCoreVisitor<TRawConfig, TParsedConfig> {
  private query: FieldDefinitionNode[]
  private mutation: FieldDefinitionNode[]
  private subscription: FieldDefinitionNode[]
  private definitions: DefinitionNode[]
  constructor(
    pluginConfig: TRawConfig,
    additionalConfig: Partial<TParsedConfig> = {},
  ) {
    super(pluginConfig, {
      ...(additionalConfig || {}),
    } as TParsedConfig)

    this.query = []
    this.mutation = []
    this.subscription = []
    this.definitions = []
  }

  get buildSchema(): DocumentNode {
    return {
      kind: Kind.DOCUMENT,
      definitions: [
        ...this.definitions,
        {
          kind: Kind.OBJECT_TYPE_DEFINITION,
          name: { kind: Kind.NAME, value: 'Query' },
          fields: [...this.query],
        },
        {
          kind: Kind.OBJECT_TYPE_DEFINITION,
          name: { kind: Kind.NAME, value: 'Mutation' },
          fields: [...this.mutation],
        },
        {
          kind: Kind.OBJECT_TYPE_DEFINITION,
          name: { kind: Kind.NAME, value: 'Subscription' },
          fields: [...this.subscription],
        },
      ],
    }
  }

  private _processGetQuery(node: ObjectTypeDefinitionNode) {
    this.query.push(
      new FieldDefinitionNodeBuilder({
        name: new NameNodeBuilder({ value: `get${node.name.value}` }),
        type: new NamedTypeNodeBuilder({
          name: new NameNodeBuilder({ value: node.name.value }),
        }),
      })
        .addArgument(
          new InputValueDefinitionNodeBuilder({
            name: new NameNodeBuilder({ value: 'id' }),
            type: Scalars.ID.required(),
          }),
        )
        .build(),
    )
  }

  private _processListQuery(node: ObjectTypeDefinitionNode) {
    this.query.push(
      new FieldDefinitionNodeBuilder({
        name: new NameNodeBuilder({ value: `list${node.name.value}s` }),
        type: new ListTypeNodeBuilder({
          type: new NamedTypeNodeBuilder({
            name: new NameNodeBuilder({ value: node.name.value }),
          }),
        }),
      })
        .addArgument(
          new InputValueDefinitionNodeBuilder({
            name: new NameNodeBuilder({ value: 'nextToken' }),
            type: Scalars.String,
          }),
        )
        .build(),
    )
  }

  private _processQuery(node: ObjectTypeDefinitionNode) {
    this._processGetQuery(node)
    this._processListQuery(node)
  }

  private _processCreateMutation(
    node: ObjectTypeDefinitionNode,
    match: FirestoreDocumentMatch,
    fields: FirestoreField[],
  ) {
    const createInput = new InputObjectTypeDefinitionNodeBuilder({
      name: new NameNodeBuilder({ value: `Create${node.name.value}Input` }),
      fields: fields
        .map((field) => {
          if (field.name.value === match.autoIdField) {
            return new InputValueDefinitionNodeBuilder({
              name: NameNodeBuilder.fromNode(field.name),
              type: Scalars.ID,
            })
          }
          if (match.mapperFields.includes(field.name.value)) {
            return new InputValueDefinitionNodeBuilder({
              name: NameNodeBuilder.fromNode(field.name),
              type: Scalars.ID.required(),
            })
          }
          if (field.isRelation) {
            return null
          }
          return new InputValueDefinitionNodeBuilder({
            name: NameNodeBuilder.fromNode(field.name),
            type: TypeNodeBuilder.fromNode(field.type),
          })
        })
        .filter(isNotNullable),
    })
    this.definitions.push(createInput.build())

    this.mutation.push(
      new FieldDefinitionNodeBuilder({
        name: new NameNodeBuilder({ value: `create${node.name.value}` }),
        type: new NamedTypeNodeBuilder({
          name: new NameNodeBuilder({ value: node.name.value }),
        }),
      })
        .addArgument(
          new InputValueDefinitionNodeBuilder({
            name: new NameNodeBuilder({ value: 'input' }),
            type: createInput.toNamedType().required(),
          }),
        )
        .build(),
    )
  }

  private _processUpdateMutation(
    node: ObjectTypeDefinitionNode,
    match: FirestoreDocumentMatch,
    fields: FirestoreField[],
  ) {
    const updateInput = new InputObjectTypeDefinitionNodeBuilder({
      name: new NameNodeBuilder({ value: `Update${node.name.value}Input` }),
      fields: fields
        .map((field) => {
          if (match.mapperFields.includes(field.name.value)) {
            return new InputValueDefinitionNodeBuilder({
              name: NameNodeBuilder.fromNode(field.name),
              type: Scalars.ID.required(),
            })
          }
          if (field.isRelation) {
            return null
          }
          return new InputValueDefinitionNodeBuilder({
            name: NameNodeBuilder.fromNode(field.name),
            type: TypeNodeBuilder.fromNode(field.type).nullable(),
          })
        })
        .filter(isNotNullable),
    })
    this.definitions.push(updateInput.build())

    this.mutation.push(
      new FieldDefinitionNodeBuilder({
        name: new NameNodeBuilder({ value: `update${node.name.value}` }),
        type: new NamedTypeNodeBuilder({
          name: new NameNodeBuilder({ value: node.name.value }),
        }),
      })
        .addArgument(
          new InputValueDefinitionNodeBuilder({
            name: new NameNodeBuilder({ value: 'input' }),
            type: updateInput.toNamedType().required(),
          }),
        )
        .build(),
    )
  }

  private _processDeleteMutation(
    node: ObjectTypeDefinitionNode,
    match: FirestoreDocumentMatch,
    fields: FirestoreField[],
  ) {
    const deleteInput = new InputObjectTypeDefinitionNodeBuilder({
      name: new NameNodeBuilder({ value: `Delete${node.name.value}Input` }),
      fields: fields
        .map((field) => {
          if (match.mapperFields.includes(field.name.value)) {
            return new InputValueDefinitionNodeBuilder({
              name: NameNodeBuilder.fromNode(field.name),
              type: Scalars.ID.required(),
            })
          }
          return null
        })
        .filter(isNotNullable),
    })
    this.definitions.push(deleteInput.build())

    this.mutation.push(
      new FieldDefinitionNodeBuilder({
        name: new NameNodeBuilder({ value: `delete${node.name.value}` }),
        type: new NamedTypeNodeBuilder({
          name: new NameNodeBuilder({ value: node.name.value }),
        }),
      })
        .addArgument(
          new InputValueDefinitionNodeBuilder({
            name: new NameNodeBuilder({ value: 'input' }),
            type: deleteInput.toNamedType().required(),
          }),
        )
        .build(),
    )
  }

  private _processMutation(
    node: ObjectTypeDefinitionNode,
    match: FirestoreDocumentMatch,
    fields: FirestoreField[],
  ) {
    this._processCreateMutation(node, match, fields)
    this._processUpdateMutation(node, match, fields)
    this._processDeleteMutation(node, match, fields)
  }

  private _processOnAddSubscription(node: ObjectTypeDefinitionNode) {
    this.subscription.push(
      new FieldDefinitionNodeBuilder({
        name: new NameNodeBuilder({ value: `on${node.name.value}Added` }),
        type: new NamedTypeNodeBuilder({
          name: NameNodeBuilder.fromNode(node.name),
        }),
      }).build(),
    )
  }

  private _processOnUpdateSubscription(node: ObjectTypeDefinitionNode) {
    this.subscription.push(
      new FieldDefinitionNodeBuilder({
        name: new NameNodeBuilder({ value: `on${node.name.value}Updated` }),
        type: new NamedTypeNodeBuilder({
          name: NameNodeBuilder.fromNode(node.name),
        }),
      }).build(),
    )
  }

  private _processOnDeleteSubscription(node: ObjectTypeDefinitionNode) {
    this.subscription.push(
      new FieldDefinitionNodeBuilder({
        name: new NameNodeBuilder({ value: `on${node.name.value}Deleted` }),
        type: new NamedTypeNodeBuilder({
          name: NameNodeBuilder.fromNode(node.name),
        }),
      }).build(),
    )
  }

  private _processSubscription(node: ObjectTypeDefinitionNode) {
    this._processOnAddSubscription(node)
    this._processOnUpdateSubscription(node)
    this._processOnDeleteSubscription(node)
  }

  private _processType(
    node: ObjectTypeDefinitionNode,
    fields: FirestoreField[],
  ) {
    const connection = new ObjectTypeDefinitionNodeBuilder({
      name: new NameNodeBuilder({ value: `${node.name.value}Connection` }),
    })
      .addField(
        new FieldDefinitionNodeBuilder({
          name: new NameNodeBuilder({ value: 'items' }),
          type: new ListTypeNodeBuilder({
            type: new NamedTypeNodeBuilder({
              name: NameNodeBuilder.fromNode(node.name),
            }).required(),
          }).required(),
        }),
      )
      .addField(
        new FieldDefinitionNodeBuilder({
          name: new NameNodeBuilder({ value: 'nextToken' }),
          type: Scalars.String,
        }),
      )
    this.definitions.push(connection.build())

    this.definitions.push(
      new ObjectTypeDefinitionNodeBuilder({
        name: NameNodeBuilder.fromNode(node.name),
        fields: fields.map((field) => {
          if (!field.isRelation) {
            return FieldDefinitionNodeBuilder.fromNode(field)
          }
          if (field.type.kind === Kind.NON_NULL_TYPE) {
            throw new Error(
              `Relation field ${field.name.value} cannot be non-nullable`,
            )
          }
          if (!field.isList) {
            return new FieldDefinitionNodeBuilder({
              name: NameNodeBuilder.fromNode(field.name),
              type: new NamedTypeNodeBuilder({
                name: NameNodeBuilder.fromNode(field.relationTo),
              }),
            })
          }
          return new FieldDefinitionNodeBuilder({
            name: NameNodeBuilder.fromNode(field.name),
            type: connection.toNamedType(),
          }).addArgument(
            new InputValueDefinitionNodeBuilder({
              name: new NameNodeBuilder({ value: 'nextToken' }),
              type: Scalars.String,
            }),
          )
        }),
      }).build(),
    )
  }

  override FirestoreTypeDefinition(
    node: ObjectTypeDefinitionNode,
    directives: FirestoreType['directives'],
    match: FirestoreDocumentMatch,
    fields: FirestoreField[],
  ) {
    this._processQuery(node)
    this._processMutation(node, match, fields)
    this._processSubscription(node)
    this._processType(node, fields)
  }
}
