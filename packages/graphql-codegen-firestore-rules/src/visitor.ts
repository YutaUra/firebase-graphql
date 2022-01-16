import {
  FirestoreCoreVisitor,
  FirestoreDocumentMatch,
  FirestoreField,
} from '@firebase-graphql/graphql-codegen-firestore-core'
import {
  EnumTypeDefinitionNode,
  GraphQLSchema,
  Kind,
  ObjectTypeDefinitionNode,
} from 'graphql'
import {
  FirestoreRulesPluginConfig,
  FirestoreRulesPluginParsedConfig,
} from './config'
import {
  FirestoreRulesAuthOperation,
  FirestoreRulesAuthStrategy,
} from './directives'
import {
  FirestoreRulesAstKind,
  FirestoreRulesFunctionAst,
  FirestoreRulesMatchAst,
  FirestoreRulesRootAst,
} from './rules-ast'
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

type FirestoreType = typeof firestoreTypeTransformer extends NodeTransformer<
  infer T
>
  ? T
  : never

export class FirestoreRulesVisitor<
  TRawConfig extends FirestoreRulesPluginConfig = FirestoreRulesPluginConfig,
  TParsedConfig extends FirestoreRulesPluginParsedConfig = FirestoreRulesPluginParsedConfig,
> extends FirestoreCoreVisitor<TRawConfig, TParsedConfig> {
  private functions: FirestoreRulesFunctionAst[]
  private children: (FirestoreRulesMatchAst | FirestoreRulesFunctionAst)[]
  constructor(
    schema: GraphQLSchema,
    pluginConfig: TRawConfig,
    additionalConfig: Partial<TParsedConfig> = {},
  ) {
    super(schema, pluginConfig, additionalConfig)

    this.functions = []
    this.children = []
  }

  get rules(): FirestoreRulesRootAst {
    return {
      kind: FirestoreRulesAstKind.ROOT,
      version: '2',
      service: {
        kind: FirestoreRulesAstKind.SERVICE,
        children: [
          {
            kind: FirestoreRulesAstKind.MATCH,
            target: '/databases/{database}/documents',
            children: [
              // Functions
              {
                kind: FirestoreRulesAstKind.FUNCTION,
                name: 'isString',
                args: ['value'],
                statement: 'value is string',
              },
              {
                kind: FirestoreRulesAstKind.FUNCTION,
                name: 'isInt',
                args: ['value'],
                statement: 'value is int',
              },
              {
                kind: FirestoreRulesAstKind.FUNCTION,
                name: 'isBoolean',
                args: ['value'],
                statement: 'value is bool',
              },
              {
                kind: FirestoreRulesAstKind.FUNCTION,
                name: 'isFloat',
                args: ['value'],
                statement: 'value is float',
              },
              {
                kind: FirestoreRulesAstKind.FUNCTION,
                name: 'isID',
                args: ['value'],
                statement: 'value is string',
              },
              {
                kind: FirestoreRulesAstKind.FUNCTION,
                name: 'isDate',
                args: ['value'],
                statement: 'value is timestamp',
              },
              {
                kind: FirestoreRulesAstKind.FUNCTION,
                name: 'isMap',
                args: ['value'],
                statement: 'value is map',
              },
              {
                kind: FirestoreRulesAstKind.FUNCTION,
                name: 'isRequired',
                args: ['source', 'field'],
                statement: 'field in source && source[field] != null',
              },
              {
                kind: FirestoreRulesAstKind.FUNCTION,
                name: 'isNullable',
                args: ['source', 'field'],
                statement: '!(field in source) || source[field] == null',
              },
              {
                kind: FirestoreRulesAstKind.FUNCTION,
                name: 'isLoggedIn',
                args: [],
                statement: 'request.auth != null',
              },
              {
                kind: FirestoreRulesAstKind.FUNCTION,
                name: 'isAuthUserId',
                args: ['userId'],
                statement: 'isLoggedIn() && request.auth.uid == userId',
              },
              ...this.functions,
              ...this.children,
            ],
          },
        ],
      },
    }
  }

  private getDefaultRules(node: ObjectTypeDefinitionNode) {
    return {
      [FirestoreRulesAuthOperation.GET]: [],
      [FirestoreRulesAuthOperation.LIST]: [],
      [FirestoreRulesAuthOperation.CREATE]: [
        `is${node.name.value}(request.resource.data)`,
      ],
      [FirestoreRulesAuthOperation.UPDATE]: [
        `is${node.name.value}(request.resource.data)`,
      ],
      [FirestoreRulesAuthOperation.DELETE]: [],
    }
  }

  private getAuthRuleCondition(
    {
      allow,
      ownerField,
    }: NonNullable<FirestoreType['directives']['auth']>['rules'][number],
    operation: FirestoreRulesAuthOperation,
    mapperFields: string[],
  ) {
    if (allow === FirestoreRulesAuthStrategy.PUBLIC) {
      return 'true'
    } else if (allow === FirestoreRulesAuthStrategy.PRIVATE) {
      return 'isLoggedIn()'
    } else if (allow === FirestoreRulesAuthStrategy.OWNER) {
      if (!ownerField) {
        throw new Error(
          `'owner' auth strategy requires ownerField to be specified in the auth directive`,
        )
      }
      const isOwnerFieldMapped = mapperFields.includes(ownerField)

      switch (operation) {
        case FirestoreRulesAuthOperation.GET:
        case FirestoreRulesAuthOperation.LIST:
          return isOwnerFieldMapped
            ? `isAuthUserId(${ownerField})`
            : `isAuthUserId(resource.data.${ownerField})`
        case FirestoreRulesAuthOperation.DELETE:
          return isOwnerFieldMapped
            ? `isAuthUserId(${ownerField})`
            : `isAuthUserId(resource.data.${ownerField})`
        case FirestoreRulesAuthOperation.CREATE:
          return isOwnerFieldMapped
            ? `isAuthUserId(${ownerField})`
            : `isAuthUserId(request.resource.data.${ownerField})`
        case FirestoreRulesAuthOperation.UPDATE:
          return isOwnerFieldMapped
            ? `isAuthUserId(${ownerField})`
            : `(isAuthUserId(request.resource.data.${ownerField}) && isAuthUserId(resource.data.${ownerField}))`
        default:
          throw new Error(`Unsupported operation: ${operation}`)
      }
    } else {
      throw new Error(`Unsupported auth strategy: ${allow}`)
    }
  }

  private getAuthRulesCondition(
    rules: NonNullable<FirestoreType['directives']['auth']>['rules'],
    operation: FirestoreRulesAuthOperation,
    mapperFields: string[],
  ) {
    return rules.map((rule) =>
      this.getAuthRuleCondition(rule, operation, mapperFields),
    )
  }

  private getAuthRules(
    node: ObjectTypeDefinitionNode,
    auth: FirestoreType['directives']['auth'],
    mapperFields: string[],
    fields: FirestoreField[],
  ) {
    const defaultRules = this.getDefaultRules(node)
    const createdAtFields = fields.filter((v) => !v.isRelation && v.isCreatedAt)
    const updatedAtFields = fields.filter((v) => !v.isRelation && v.isUpdatedAt)

    const defaultAllows = {
      [FirestoreRulesAuthOperation.GET]: [
        ...defaultRules[FirestoreRulesAuthOperation.GET],
      ],
      [FirestoreRulesAuthOperation.LIST]: [
        ...defaultRules[FirestoreRulesAuthOperation.LIST],
      ],
      [FirestoreRulesAuthOperation.CREATE]: [
        ...defaultRules[FirestoreRulesAuthOperation.CREATE],
        ...createdAtFields.map(
          (field) =>
            `&& request.resource.data.${field.name.value} == request.time`,
        ),
        ...updatedAtFields.map(
          (field) =>
            `&& request.resource.data.${field.name.value} == request.time`,
        ),
      ],
      [FirestoreRulesAuthOperation.UPDATE]: [
        ...defaultRules[FirestoreRulesAuthOperation.UPDATE],
        ...createdAtFields.map(
          (field) => `&& !("${field.name.value}" in request.resource.data)`,
        ),
        ...updatedAtFields.map(
          (field) =>
            `&& request.resource.data.${field.name.value} == request.time`,
        ),
      ],
      [FirestoreRulesAuthOperation.DELETE]: [
        ...defaultRules[FirestoreRulesAuthOperation.DELETE],
      ],
    }

    if (!auth) {
      return defaultAllows
    }

    const { rules } = auth

    return Object.fromEntries(
      Object.values(FirestoreRulesAuthOperation).map<
        [FirestoreRulesAuthOperation, string[]]
      >((operation) => {
        const authRules = this.getAuthRulesCondition(
          rules.filter((rule) => rule.operations.includes(operation)),
          operation,
          mapperFields,
        )
        if (authRules.length === 0) {
          return [operation, []]
        } else if (authRules.length === 1) {
          return [
            operation,
            [
              ...defaultAllows[operation],
              `${defaultAllows[operation].length > 0 ? '&& ' : ''}${
                authRules[0]
              }`,
            ],
          ]
        }
        return [
          operation,
          [
            ...defaultAllows[operation],
            ...authRules.map(
              (v, index, arr) =>
                `${
                  index === 0
                    ? `${defaultAllows[operation].length > 0 ? '&& ' : ''}(`
                    : '|| '
                }${v}${index === arr.length - 1 ? ')' : ''}`,
            ),
          ],
        ]
      }),
    )
  }

  EnumTypeDefinition(node: EnumTypeDefinitionNode) {
    if (node.values) {
      this.functions.push({
        kind: FirestoreRulesAstKind.FUNCTION,
        name: `is${node.name.value}`,
        args: ['value'],
        statement: `isString(value) && value in [${node.values
          .map((v) => `"${v.name.value}"`)
          .join(', ')}]`,
      })
    }
  }

  override ObjectTypeDefinition(node: ObjectTypeDefinitionNode) {
    if (node.fields) {
      const firestore = node.directives?.find(
        (v) => v.name.value === 'firestore',
      )
      const documentArg = firestore?.arguments?.find(
        (v) => v.name.value === 'document',
      )
      if (firestore && !documentArg)
        throw Error(
          "graphql directive 'firestore' must have 'document' argument",
        )
      if (documentArg && documentArg.value.kind !== Kind.STRING)
        throw new Error(
          "graphql directive 'firestore' 'document' argument must be string",
        )
      const match =
        documentArg && documentArg.value.kind === Kind.STRING
          ? this._parseMatchPath(documentArg.value.value)
          : undefined

      const modelField = node.fields
        .filter((v) => !v.directives?.some((d) => d.name.value === 'relation'))
        .filter((v) => {
          if (!match) return true
          return !match.mapperFields.includes(v.name.value)
        })
      this.functions.push({
        kind: FirestoreRulesAstKind.FUNCTION,
        name: `is${node.name.value}`,
        args: ['value'],
        statement: [
          `isMap(value) && value.keys().hasOnly(["__typename", ${modelField
            .map((v) => `"${v.name.value}"`)
            .join(', ')}])`,
          `&& isRequired(value, "__typename") && isString(value.__typename) && value.__typename == "${node.name.value}"`,
          ...modelField.map((v) => {
            if (v.type.kind === Kind.NON_NULL_TYPE) {
              if (v.type.type.kind === Kind.LIST_TYPE) {
                throw new Error(
                  `List Type is not supported. ${node.name.value}.${v.name.value} is a list type`,
                )
              }
              return `&& isRequired(value, "${v.name.value}") && is${v.type.type.name.value}(value.${v.name.value})`
            }
            if (v.type.kind === Kind.LIST_TYPE) {
              throw new Error(
                `List Type is not supported. ${node.name.value}.${v.name.value} is a list type`,
              )
            }
            return `&& (isNullable(value, "${v.name.value}") || is${v.type.name.value}(value.${v.name.value}))`
          }),
        ],
      })
    }
    super.ObjectTypeDefinition(node)
  }

  override FirestoreTypeDefinition(
    node: ObjectTypeDefinitionNode,
    directives: FirestoreType['directives'],
    match: FirestoreDocumentMatch,
    fields: FirestoreField[],
  ) {
    this.children.push({
      kind: FirestoreRulesAstKind.MATCH,
      target: directives.firestore.document,
      children: [],
      allow: this.getAuthRules(
        node,
        directives.auth,
        match.mapperFields,
        fields,
      ),
    })
  }
}
