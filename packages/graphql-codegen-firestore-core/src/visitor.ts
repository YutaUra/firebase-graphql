import {
  BaseVisitor,
  ParsedConfig,
  RawConfig,
} from '@graphql-codegen/visitor-plugin-common'
import {
  ASTVisitFn,
  Kind,
  NameNode,
  ObjectTypeDefinitionNode,
  TypeNode,
} from 'graphql'
import {
  FirestoreRulesAuthOperation,
  FirestoreRulesAuthStrategy,
} from './directives'
import { NodeTransformer, NodeTransformer as t } from './schema-validators'

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

export type FirestoreType =
  typeof firestoreTypeTransformer extends NodeTransformer<infer T> ? T : never

export type FirestoreDocumentMatch = {
  mapperFields: string[]
  autoIdField: null
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
    }
  | {
      isRelation: false
      relationTo: null
    }
)

export class FirestoreCoreVisitor<
  TRawConfig extends RawConfig,
  TParsedConfig extends ParsedConfig,
> extends BaseVisitor<TRawConfig, TParsedConfig> {
  constructor(
    pluginConfig: TRawConfig,
    additionalConfig: Partial<TParsedConfig> = {},
  ) {
    super(pluginConfig, {
      ...(additionalConfig || {}),
    } as TParsedConfig)
  }

  private getFirestoreDirective(node: ObjectTypeDefinitionNode) {
    const { directives } = firestoreTypeTransformer.transform(node)

    if (!directives.firestore.document.startsWith('/')) {
      throw new Error('"document" argument must start with "/"')
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
  private _parseMatchPath(path: string): FirestoreDocumentMatch {
    const [fst, ...paths] = path.split('/')
    if (fst !== '') {
      throw new Error(
        `@firestore's document must start with '/'. but got "${path}"`,
      )
    }
    if (paths.length % 2 !== 0) {
      throw new Error(
        `@firestore's document must have odd number of '/'. but got "${path}" (number of '/' is ${
          paths.length + 1
        })`,
      )
    }
    const mapperFields: string[] = []
    let autoIdField: string | null = null

    ;[...paths].reverse().forEach((v, index) => {
      if (index % 2 === 1) {
        // collection name
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

      const isRelation = directives.some(
        (directive) =>
          directive.name.value === 'hasOne' ||
          directive.name.value === 'hasMany',
      )
      if (isRelation) {
        console.log(field)
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
          }
        }
        if (field.type.kind !== Kind.NAMED_TYPE) {
          throw new Error(
            `@firestore's field must be a named type. but got "${field.kind}"`,
          )
        }
        return {
          kind: field.kind,
          name: field.name,
          type: field.type,
          isRelation: true,
          relationTo: field.type.name,
          isList: false,
        }
      }
      return {
        kind: field.kind,
        name: field.name,
        type: field.type,
        isRelation: false,
        relationTo: null,
      }
    })
  }

  private _processFirestoreType(node: ObjectTypeDefinitionNode) {
    const directives = this.getFirestoreDirective(node)
    const match = this._parseMatchPath(directives.firestore.document)
    const fields = this._processFirestoreFields(node)

    if (!directives.auth) {
      console.warn(
        `[warn] \`type ${node.name.value} @firestore { ... }\` doesn't have '@auth' directive.`,
      )
    }

    this.FirestoreTypeDefinition(node, directives, match, fields)
  }

  ObjectTypeDefinition: ASTVisitFn<ObjectTypeDefinitionNode> = (node) => {
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
