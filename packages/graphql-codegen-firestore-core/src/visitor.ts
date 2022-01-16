import {
  BaseVisitor,
  ParsedConfig,
  RawConfig,
} from '@graphql-codegen/visitor-plugin-common'
import {
  GraphQLSchema,
  Kind,
  NameNode,
  ObjectTypeDefinitionNode,
  TypeNode,
} from 'graphql'
import {
  FirestoreRelationType,
  FirestoreRulesAuthOperation,
  FirestoreRulesAuthStrategy,
} from './directives'
import { InferNodeTransformer, NodeTransformer as t } from './schema-validators'

const firestoreTypeTransformer = t
  .objectTypeDefinition()
  .directive('firestore', t.directive().arg('document', t.string()))
  .directive(
    'auth',
    t
      .directive()
      .arg(
        'rules',
        t.list(
          t
            .object()
            .field('allow', t.enum(FirestoreRulesAuthStrategy))
            .field('operations', t.list(t.enum(FirestoreRulesAuthOperation)))
            .field('ownerField', t.string().nullable()),
        ),
      )
      .nullable(),
  )

const FirestoreFieldDirectiveTransformer = t
  .directive()
  .arg('type', t.enum(FirestoreRelationType))
  .arg('fields', t.list(t.string()).nullable())

export type FirestoreType = InferNodeTransformer<
  typeof firestoreTypeTransformer
>

export type FirestoreFieldDirective = InferNodeTransformer<
  typeof FirestoreFieldDirectiveTransformer
>

export type FirestoreDocumentMatch = {
  mapperFields: string[]
  autoIdField: string | null
}

export type FirestoreField = {
  kind: Kind.FIELD_DEFINITION
  name: NameNode
  type: TypeNode
} & (
  | {
      isRelation: true
      relationTo: NameNode
      isList: boolean
      relationType: FirestoreRelationType
      fields: string[]
      directive: FirestoreFieldDirective
    }
  | ({
      isRelation: false
      relationTo: null
    } & (
      | {
          isCreatedAt: true
          isUpdatedAt: boolean
          type: {
            kind: Kind.NAMED_TYPE
            name: {
              kind: Kind.NAME
              value: 'Date'
            }
          }
        }
      | {
          isCreatedAt: boolean
          isUpdatedAt: true
          type: {
            kind: Kind.NAMED_TYPE
            name: {
              kind: Kind.NAME
              value: 'Date'
            }
          }
        }
      | {
          isCreatedAt: false
          isUpdatedAt: false
        }
    ))
)

export interface FirestoreCoreConfig extends RawConfig {
  ignoreNoAuthWarning?: boolean
}

export interface FirestoreCoreParsedConfig extends ParsedConfig {
  ignoreNoAuthWarning?: boolean
}

export class FirestoreCoreVisitor<
  TRawConfig extends FirestoreCoreConfig,
  TParsedConfig extends FirestoreCoreParsedConfig,
> extends BaseVisitor<TRawConfig, TParsedConfig> {
  protected schema: GraphQLSchema

  constructor(
    schema: GraphQLSchema,
    pluginConfig: TRawConfig,
    additionalConfig: Partial<TParsedConfig> = {},
  ) {
    super(pluginConfig, {
      ...additionalConfig,
      ignoreNoAuthWarning:
        additionalConfig.ignoreNoAuthWarning ??
        pluginConfig.ignoreNoAuthWarning,
    })

    this.schema = schema
  }

  private getFirestoreDirective(node: ObjectTypeDefinitionNode) {
    const { directives } = firestoreTypeTransformer.transform(node)

    if (!directives.firestore.document.startsWith('/')) {
      throw new Error('"document" argument must start with "/"')
    }

    if (directives.auth) {
      directives.auth.rules.forEach((rule) => {
        if (rule.allow === FirestoreRulesAuthStrategy.OWNER) {
          if (!rule.ownerField) {
            throw new Error(
              '"ownerField" argument is required when "allow" argument is "owner"',
            )
          }
          const ownerField = node.fields?.find(
            (field) => field.name.value === rule.ownerField,
          )
          if (!ownerField) {
            throw new Error(
              `"ownerField" argument must be a valid field name in type "${node.name.value}.${rule.ownerField}"`,
            )
          }
          const ownerFieldType =
            ownerField.type.kind === Kind.NON_NULL_TYPE
              ? ownerField.type.type
              : ownerField.type
          if (ownerFieldType.kind === Kind.LIST_TYPE) {
            throw new Error(
              `"ownerField" argument must be a non-list field in type "${node.name.value}.${rule.ownerField}"`,
            )
          }
          if (
            ownerFieldType.name.value !== 'String' &&
            ownerFieldType.name.value !== 'ID'
          ) {
            throw new Error(
              `"ownerField" argument must be a String or ID field in type "${node.name.value}.${ownerField.name.value}"`,
            )
          }
        }
      })
    }

    return directives
  }

  /**
   * @example
   * console.log(_parseMatchPath("/users/{id}"))
   * {
   *   mapperFields: ["id"],
   *   autoIdField: "id"
   * }
   * @example
   * console.log(_parseMatchPath("/users/{userId}/posts/{postId}"))
   * {
   *   mapperFields: ["userId", "postId"],
   *   autoIdField: "postId"
   * }
   * @example
   * console.log(_parseMatchPath("/users/{userId}/posts/{id}-something"))
   * {
   *   mapperFields: ["userId", "id"],
   *   autoIdField: null
   * }
   */
  protected _parseMatchPath(path: string): FirestoreDocumentMatch {
    const [fst, ...paths] = path.split('/')
    if (fst !== '') {
      throw new Error(
        `@firestore's document must start with '/'. but got "${path}"`,
      )
    }
    if (paths.length % 2 !== 0) {
      throw new Error(
        `@firestore's document must have even number of '/'. but got "${path}" (number of '/' is ${
          paths.length + 1
        })`,
      )
    }
    const mapperFields: string[] = []
    let autoIdField: string | null = null

    ;[...paths].reverse().forEach((v, index) => {
      // collection name
      if (index % 2 === 1) {
        // if collection name has mapper field
        if (v.match(/{([^}]+)}/)) {
          throw new Error(
            `@firestore's document's collection name must not have dynamic mapper value (ex. '/{collection}/{id}'). but got "${path}"`,
          )
        }
        return
      }

      const match = v.match(/{[^}]+}/)?.map((v) => v.replace(/[{}]/g, ''))
      if (!match) return
      mapperFields.push(...match)
      if (index === 0 && match.length === 1 && v === `{${match[0]}}`) {
        autoIdField = match[0]
      }
    })

    return {
      mapperFields,
      autoIdField,
    }
  }

  private _processFirestoreFields(
    node: ObjectTypeDefinitionNode,
  ): FirestoreField[] {
    if (!node.fields) return []

    return node.fields.map<FirestoreField>((field) => {
      const directives = field.directives ?? []

      const relationNode = directives.find(
        (directive) => directive.name.value === 'relation',
      )
      if (!relationNode) {
        const isCreatedAt =
          field.directives?.some((v) => v.name.value === 'createdAt') ?? false
        if (isCreatedAt) {
          if (
            field.type.kind !== Kind.NON_NULL_TYPE ||
            field.type.type.kind !== Kind.NAMED_TYPE ||
            field.type.type.name.value !== 'Date'
          ) {
            throw new Error(
              `@createdAt field must be non-nullable Date type. ${node.name.value}.${field.name.value}`,
            )
          }
        }
        const isUpdatedAt =
          field.directives?.some((v) => v.name.value === 'updatedAt') ?? false
        if (isUpdatedAt) {
          if (
            field.type.kind !== Kind.NON_NULL_TYPE ||
            field.type.type.kind !== Kind.NAMED_TYPE ||
            field.type.type.name.value !== 'Date'
          ) {
            throw new Error(
              `@updatedAt field must be non-nullable Date type. ${node.name.value}.${field.name.value}`,
            )
          }
        }

        return {
          kind: field.kind,
          name: field.name,
          type: field.type,
          isRelation: false,
          relationTo: null,
          isCreatedAt,
          isUpdatedAt,
        } as FirestoreField
      }
      const directive =
        FirestoreFieldDirectiveTransformer.transform(relationNode)

      if (field.type.kind === Kind.LIST_TYPE) {
        if (field.type.type.kind !== Kind.NAMED_TYPE) {
          throw new Error(
            `@firestore's field must be a named type. but got "${field.kind}"`,
          )
        }

        return {
          kind: field.kind,
          name: field.name,
          type: field.type,
          isRelation: true,
          relationTo: field.type.type.name,
          isList: true,
          fields: [],
          relationType: directive.type,
          directive,
        }
      }
      if (field.type.kind !== Kind.NAMED_TYPE) {
        throw new Error(
          `@firestore's field must be a named type. but got "${field.kind}"`,
        )
      }
      const targetNode = this.schema.getType(field.type.name.value)
        ?.astNode as ObjectTypeDefinitionNode
      const target = firestoreTypeTransformer.transform(targetNode)
      const match = this._parseMatchPath(target.directives.firestore.document)
      if (match.mapperFields.length !== directive.fields?.length) {
        throw new Error(
          `@firestore's field must have same number of mapper fields and fields. but got "${field.kind}"`,
        )
      } else if (
        !directive.fields.every((v) =>
          node.fields?.map((v) => v.name.value).includes(v),
        )
      ) {
        throw new Error(
          `@relation's fields must be a fields of ${targetNode.name.value} type. but got ${directive.fields}`,
        )
      }

      return {
        kind: field.kind,
        name: field.name,
        type: field.type,
        isRelation: true,
        relationTo: field.type.name,
        isList: false,
        fields: directive.fields,
        relationType: directive.type,
        directive,
      }
    })
  }

  private _processFirestoreType(node: ObjectTypeDefinitionNode) {
    const directives = this.getFirestoreDirective(node)
    const match = this._parseMatchPath(directives.firestore.document)
    const fields = this._processFirestoreFields(node)

    if (!directives.auth && !this.config.ignoreNoAuthWarning) {
      console.warn(
        `[warn] \`type ${node.name.value} @firestore { ... }\` doesn't have '@auth' directive.`,
      )
    }

    this.FirestoreTypeDefinition(node, directives, match, fields)
  }

  ObjectTypeDefinition(node: ObjectTypeDefinitionNode) {
    const firestoreDirective = node.directives?.find(
      (directive) => directive.name.value === 'firestore',
    )

    if (firestoreDirective) {
      this._processFirestoreType(node)
    }
  }

  protected FirestoreTypeDefinition(
    node: ObjectTypeDefinitionNode,
    directives: FirestoreType['directives'],
    match: FirestoreDocumentMatch,
    fields: FirestoreField[],
  ) {}
}
