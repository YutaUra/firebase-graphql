import {
  FirestoreCoreVisitor,
  FirestoreDocumentMatch,
  FirestoreField,
} from '@firebase-graphql/graphql-codegen-firestore-core'
import { ParsedTypesConfig } from '@graphql-codegen/visitor-plugin-common'
import {
  FieldDefinitionNode,
  GraphQLSchema,
  Kind,
  ObjectTypeDefinitionNode,
} from 'graphql'
import { FirestoreRulesPluginConfig } from './config'
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

export interface FirestoreRulesPluginParsedConfig extends ParsedTypesConfig {}

export class FirestoreRulesVisitor<
  TRawConfig extends FirestoreRulesPluginConfig = FirestoreRulesPluginConfig,
  TParsedConfig extends FirestoreRulesPluginParsedConfig = FirestoreRulesPluginParsedConfig,
> extends FirestoreCoreVisitor<TRawConfig, TParsedConfig> {
  private children: (FirestoreRulesMatchAst | FirestoreRulesFunctionAst)[]
  constructor(
    private schema: GraphQLSchema,
    pluginConfig: TRawConfig,
    additionalConfig: Partial<TParsedConfig> = {},
  ) {
    super(pluginConfig, {
      ...(additionalConfig || {}),
    } as TParsedConfig)

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
                name: 'isTimestamp',
                args: ['value'],
                statement: 'value is timestamp',
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
              ...this.children,
            ],
          },
        ],
      },
    }
  }

  private getValidateScalarFunctionName(field: FieldDefinitionNode) {
    const typeName =
      field.type.kind === Kind.NON_NULL_TYPE &&
      field.type.type.kind === Kind.NAMED_TYPE
        ? field.type.type.name.value
        : field.type.kind === Kind.NAMED_TYPE
        ? field.type.name.value
        : null

    switch (typeName) {
      case 'String':
      case 'ID':
        return 'isString'
      case 'Timestamp':
        return 'isTimestamp'
      default:
        return null
    }
  }

  private getValidateFieldStatement(field: FieldDefinitionNode): string | null {
    const validateFunctionName = this.getValidateScalarFunctionName(field)
    if (!validateFunctionName) return null

    const isRequired = field.type.kind === Kind.NON_NULL_TYPE

    if (isRequired) {
      return [
        `isRequired(data, "${field.name.value}")`,
        `${validateFunctionName}(data.${field.name.value})`,
      ].join(' && ')
    }

    return (
      '(' +
      [
        `isNullable(data, "${field.name.value}")`,
        `${validateFunctionName}(data.${field.name.value})`,
      ].join(' || ') +
      ')'
    )
  }

  private getValidateFunction(
    fields: readonly FieldDefinitionNode[],
  ): FirestoreRulesFunctionAst {
    return {
      kind: FirestoreRulesAstKind.FUNCTION,
      name: 'validate',
      args: ['data'],
      statement: fields
        .map(this.getValidateFieldStatement)
        .filter(Boolean)
        .map((v, index, arr) => `${v}${index === arr.length - 1 ? '' : ' &&'}`),
    }
  }

  private getDefaultRules() {
    return {
      [FirestoreRulesAuthOperation.GET]: [],
      [FirestoreRulesAuthOperation.LIST]: [],
      [FirestoreRulesAuthOperation.CREATE]: ['validate(request.resource.data)'],
      [FirestoreRulesAuthOperation.UPDATE]: ['validate(request.resource.data)'],
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
            : `isAuthUserId(request.resource.data.${ownerField})`
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
  ) {
    if (!auth) {
      // TODO
      return {}
    }

    const { rules } = auth

    const defaultRules = this.getDefaultRules()

    return Object.fromEntries(
      Object.values(FirestoreRulesAuthOperation).map<
        [FirestoreRulesAuthOperation, string[]]
      >((operation) => [
        operation,
        [
          ...defaultRules[operation].map((v) => `${v} &&`),

          ...this.getAuthRulesCondition(
            rules.filter((rule) => rule.operations.includes(operation)),
            operation,
            mapperFields,
          ).map(
            (v, index, arr) =>
              `${index === 0 ? '(' : ''}(${v})${
                index === arr.length - 1 ? ')' : ' ||'
              }`,
          ),
        ],
      ]),
    )
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
      children: [
        this.getValidateFunction(
          node.fields?.filter(
            (filed) => !match.mapperFields.includes(filed.name.value),
          ) ?? [],
        ),
      ],
      allow: this.getAuthRules(node, directives.auth, match.mapperFields),
    })
  }
}
