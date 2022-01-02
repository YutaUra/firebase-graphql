import {
  BaseVisitor,
  ParsedTypesConfig,
} from '@graphql-codegen/visitor-plugin-common'
import autoBind from 'auto-bind'
import {
  ASTVisitFn,
  ConstDirectiveNode,
  FieldDefinitionNode,
  GraphQLSchema,
  Kind,
  ObjectTypeDefinitionNode,
} from 'graphql'
import { FirestoreRulesPluginConfig } from './config'
import {
  FirestoreRulesAstKind,
  FirestoreRulesFunctionAst,
  FirestoreRulesMatchAllowKind,
  FirestoreRulesMatchAst,
  FirestoreRulesRootAst,
} from './rules-ast'

export interface FirestoreRulesPluginParsedConfig extends ParsedTypesConfig {}

export class FirestoreRulesVisitor<
  TRawConfig extends FirestoreRulesPluginConfig = FirestoreRulesPluginConfig,
  TParsedConfig extends FirestoreRulesPluginParsedConfig = FirestoreRulesPluginParsedConfig,
> extends BaseVisitor<TRawConfig, TParsedConfig> {
  private children: (FirestoreRulesMatchAst | FirestoreRulesFunctionAst)[]
  constructor(
    private schema: GraphQLSchema,
    pluginConfig: TRawConfig,
    additionalConfig: Partial<TParsedConfig> = {},
  ) {
    super(pluginConfig, {
      ...(additionalConfig || {}),
    } as TParsedConfig)

    autoBind(this)
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
              ...this.children,
            ],
          },
        ],
      },
    }
  }

  getValidateScalarFunctionName(field: FieldDefinitionNode) {
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

  getValidateFieldStatement(field: FieldDefinitionNode): string | null {
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

  getValidateFunction(
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

  processFirestoreType(
    node: ObjectTypeDefinitionNode,
    directive: ConstDirectiveNode,
  ) {
    const documentArg = directive?.arguments?.find(
      (arg) => arg.name.value === 'document',
    )

    if (!documentArg) {
      throw new Error(`@firestore directive must have a 'document' argument`)
    }

    if (documentArg.value.kind !== Kind.STRING) {
      // TODO: give a better error message
      throw new Error('"document" argument must be a string')
    }

    if (!documentArg.value.value.startsWith('/')) {
      throw new Error('"document" argument must start with "/"')
    }

    this.children.push({
      kind: FirestoreRulesAstKind.MATCH,
      target: documentArg.value.value,
      children: [this.getValidateFunction(node.fields ?? [])],
      allow: {
        [FirestoreRulesMatchAllowKind.CREATE]:
          'validate(request.resource.data)',
      },
    })
  }

  ObjectTypeDefinition: ASTVisitFn<ObjectTypeDefinitionNode> = (node) => {
    const firestoreDirective = node.directives?.find(
      (directive) => directive.name.value === 'firestore',
    )

    if (firestoreDirective) {
      this.processFirestoreType(node, firestoreDirective)
    }
  }
}
