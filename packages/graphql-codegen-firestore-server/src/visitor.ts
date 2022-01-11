import {
  FirestoreCoreVisitor,
  FirestoreDocumentMatch,
  FirestoreField,
  FirestoreType,
} from '@firebase-graphql/graphql-codegen-firestore-core'
import { ParsedTypesConfig } from '@graphql-codegen/visitor-plugin-common'
import { camelCase } from 'change-case'
import { ObjectTypeDefinitionNode } from 'graphql'
import ts, { NodeFlags, SyntaxKind } from 'typescript'
import { FirestoreServerPluginConfig } from './config'
import { ArrowFunctionBuilder } from './ts-builders/ArrowFunctionBuilder'
import { AwaitExpressionBuilder } from './ts-builders/AwaitExpressionBuilder'
import { BinaryExpressionBuilder } from './ts-builders/BinaryExpressionBuilder'
import { BlockBuilder } from './ts-builders/BlockBuilder'
import { CallExpressionBuilder } from './ts-builders/CallExpressionBuilder'
import { EndOfFileTokenBuilder } from './ts-builders/EndOfFileTokenBuilder'
import { EqualsGreaterThanTokenBuilder } from './ts-builders/EqualsGreaterThanTokenBuilder'
import { IdentifierBuilder } from './ts-builders/IdentifierBuilder'
import { IfStatementBuilder } from './ts-builders/IfStatementBuilder'
import { MethodDeclarationBuilder } from './ts-builders/MethodDeclarationBuilder'
import { ModifierBuilder } from './ts-builders/ModifierBuilder'
import { NewExpressionBuilder } from './ts-builders/NewExpressionBuilder'
import { NullBuilder } from './ts-builders/NullBuilder'
import { ObjectLiteralExpressionBuilder } from './ts-builders/ObjectLiteralExpressionBuilder'
import { ParameterDeclarationBuilder } from './ts-builders/ParameterDeclarationBuilder'
import { PrefixUnaryExpressionBuilder } from './ts-builders/PrefixUnaryExpressionBuilder'
import { PropertyAccessExpressionBuilder } from './ts-builders/PropertyAccessExpressionBuilder'
import { PropertyAssignmentBuilder } from './ts-builders/PropertyAssignmentBuilder'
import { RegularExpressionLiteralBuilder } from './ts-builders/RegularExpressionLiteralBuilder'
import { ReturnStatementBuilder } from './ts-builders/ReturnStatementBuilder'
import { ShorthandPropertyAssignmentBuilder } from './ts-builders/ShorthandPropertyAssignmentBuilder'
import { SourceFileBuilder } from './ts-builders/SourceFileBuilder'
import { TemplateExpressionBuilder } from './ts-builders/TemplateExpressionBuilder'
import { TemplateHeadBuilder } from './ts-builders/TemplateHeadBuilder'
import { TemplateSpanBuilder } from './ts-builders/TemplateSpanBuilder'
import { TemplateTailBuilder } from './ts-builders/TemplateTailBuilder'
import { ThrowStatementBuilder } from './ts-builders/ThrowStatementBuilder'
import { TypeReferenceNodeBuilder } from './ts-builders/TypeReferenceNodeBuilder'
import { Builder } from './ts-builders/types'
import { VariableDeclarationBuilder } from './ts-builders/VariableDeclarationBuilder'
import { VariableDeclarationListBuilder } from './ts-builders/VariableDeclarationListBuilder'
import { VariableStatementBuilder } from './ts-builders/VariableStatementBuilder'

const isNotNullable = <T>(value: T | null | undefined): value is T =>
  value !== null && value !== undefined

export interface FirestoreServerPluginParsedConfig extends ParsedTypesConfig {}

export class FirestoreServerVisitor<
  TRawConfig extends FirestoreServerPluginConfig = FirestoreServerPluginConfig,
  TParsedConfig extends FirestoreServerPluginParsedConfig = FirestoreServerPluginParsedConfig,
> extends FirestoreCoreVisitor<TRawConfig, TParsedConfig> {
  private _resolvers: Builder<ts.ObjectLiteralElementLike>[]
  private _queries: Builder<ts.ObjectLiteralElementLike>[]
  private _mutations: Builder<ts.ObjectLiteralElementLike>[]
  private _subscriptions: Builder<ts.ObjectLiteralElementLike>[]
  private _statements: Builder<ts.Statement>[]

  constructor(
    pluginConfig: TRawConfig,
    additionalConfig: Partial<TParsedConfig> = {},
  ) {
    super(pluginConfig, {
      ...(additionalConfig || {}),
    } as TParsedConfig)

    this._resolvers = []
    this._queries = []
    this._mutations = []
    this._subscriptions = []
    this._statements = []
  }

  _getFirestore(firebaseApp: IdentifierBuilder) {
    return new VariableDeclarationBuilder({
      name: 'firestore',
      initializer: new CallExpressionBuilder({
        expression: new IdentifierBuilder({
          text: 'getFirestore',
        }),
        argumentsArray: [firebaseApp],
      }),
    })
  }

  _createServer() {
    const args = {
      app: new IdentifierBuilder({ text: 'app' }),
    }

    const firestore = this._getFirestore(args.app)

    return new VariableStatementBuilder({
      declarationList: new VariableDeclarationListBuilder({
        flags: ts.NodeFlags.Const,
      }).addDeclaration(
        new VariableDeclarationBuilder({
          name: new IdentifierBuilder({ text: 'createServer' }),
          initializer: new ArrowFunctionBuilder({
            equalsGreaterThanToken: new EqualsGreaterThanTokenBuilder(),
            parameters: [
              new ParameterDeclarationBuilder({
                name: args.app,
                type: new TypeReferenceNodeBuilder({
                  typeName: new IdentifierBuilder({ text: 'FirebaseApp' }),
                }),
              }),
            ],
            body: new BlockBuilder({ multiLine: true })
              .addStatement(
                new VariableStatementBuilder({
                  declarationList: new VariableDeclarationListBuilder({
                    flags: NodeFlags.Const,
                  }).addDeclaration(firestore),
                }),
              )
              .addStatement(
                new VariableStatementBuilder({
                  declarationList: new VariableDeclarationListBuilder({
                    flags: NodeFlags.Const,
                    declarations: [
                      new VariableDeclarationBuilder({
                        name: 'resolvers',
                        type: new TypeReferenceNodeBuilder({
                          typeName: new IdentifierBuilder({
                            text: 'Resolvers',
                          }),
                        }),
                        initializer: new ObjectLiteralExpressionBuilder({
                          multiLine: true,
                          properties: [...this._resolvers],
                        })
                          .addProperty(
                            new PropertyAssignmentBuilder({
                              name: new IdentifierBuilder({
                                text: 'Query',
                              }),
                              initializer: new ObjectLiteralExpressionBuilder({
                                multiLine: true,
                                properties: [...this._queries],
                              }),
                            }),
                          )
                          .addProperty(
                            new PropertyAssignmentBuilder({
                              name: new IdentifierBuilder({
                                text: 'Mutation',
                              }),
                              initializer: new ObjectLiteralExpressionBuilder({
                                multiLine: true,
                                properties: [...this._mutations],
                              }),
                            }),
                          )
                          .addProperty(
                            new PropertyAssignmentBuilder({
                              name: new IdentifierBuilder({
                                text: 'Subscription',
                              }),
                              initializer: new ObjectLiteralExpressionBuilder({
                                multiLine: true,
                                properties: [...this._subscriptions],
                              }),
                            }),
                          ),
                      }),
                    ],
                  }),
                }),
              )
              .addStatement(
                new ReturnStatementBuilder({
                  expression: new NewExpressionBuilder({
                    expression: new IdentifierBuilder({
                      text: 'ApolloServerLocal',
                    }),
                  }).addArgument(
                    new ObjectLiteralExpressionBuilder({})
                      .addProperty(
                        new ShorthandPropertyAssignmentBuilder({
                          name: new IdentifierBuilder({ text: 'typeDefs' }),
                        }),
                      )
                      .addProperty(
                        new ShorthandPropertyAssignmentBuilder({
                          name: new IdentifierBuilder({
                            text: 'resolvers',
                          }),
                        }),
                      ),
                  ),
                }),
              ),
          }),
        }),
      ),
    })
  }

  get buildCode(): ts.SourceFile {
    return new SourceFileBuilder({
      statements: this._statements,
      endOfFileToken: new EndOfFileTokenBuilder(),
      flags: ts.NodeFlags.None,
    })
      .addStatement(
        this._createServer().addModifier(
          new ModifierBuilder({ kind: SyntaxKind.ExportKeyword }),
        ),
      )
      .build()
  }

  private _processConverter_toFirestore(
    node: ObjectTypeDefinitionNode,
    directives: FirestoreType['directives'],
    match: FirestoreDocumentMatch,
    fields: FirestoreField[],
  ) {
    const args = {
      modelObject: new IdentifierBuilder({ text: 'modelObject' }),
    }
    return new MethodDeclarationBuilder({
      name: 'toFirestore',
      parameters: [
        new ParameterDeclarationBuilder({
          name: args.modelObject,
        }),
      ],
      body: new BlockBuilder({ multiLine: true }).addStatement(
        new ReturnStatementBuilder({
          expression: new ObjectLiteralExpressionBuilder({
            multiLine: true,
            properties: fields
              .map((field) => {
                if (field.isRelation) {
                  return null
                }
                if (match.mapperFields.includes(field.name.value)) {
                  return null
                }
                return new PropertyAssignmentBuilder({
                  name: new IdentifierBuilder({
                    text: field.name.value,
                  }),
                  initializer: new PropertyAccessExpressionBuilder({
                    expression: args.modelObject,
                    name: field.name.value,
                  }),
                })
              })
              .filter(isNotNullable),
          }).addProperty(
            new PropertyAssignmentBuilder({
              name: '__typename',
              initializer: new PropertyAccessExpressionBuilder({
                expression: args.modelObject,
                name: '__typename',
              }),
            }),
          ),
        }),
      ),
    })
  }

  private _processConverter_fromFirestore(
    node: ObjectTypeDefinitionNode,
    directives: FirestoreType['directives'],
    match: FirestoreDocumentMatch,
    fields: FirestoreField[],
  ) {
    const args = {
      snapshot: new IdentifierBuilder({ text: 'snapshot' }),
    }
    return new MethodDeclarationBuilder({
      name: 'fromFirestore',
      parameters: [
        new ParameterDeclarationBuilder({
          name: args.snapshot,
        }),
      ],
      body: new BlockBuilder({ multiLine: true })
        .addStatement(
          new VariableStatementBuilder({
            declarationList: new VariableDeclarationListBuilder({
              flags: NodeFlags.Const,
            }).addDeclaration(
              new VariableDeclarationBuilder({
                name: 'match',
                initializer: new CallExpressionBuilder({
                  expression: new PropertyAccessExpressionBuilder({
                    expression: new PropertyAccessExpressionBuilder({
                      expression: new PropertyAccessExpressionBuilder({
                        expression: args.snapshot,
                        name: 'ref',
                      }),
                      name: 'path',
                    }),
                    name: 'match',
                  }),
                }).addArgument(
                  RegularExpressionLiteralBuilder.fromRegexp(
                    new RegExp(
                      `^${directives.firestore.document.replace(
                        /{(?<field>[^}]+)}/g,
                        '(?<$<field>>[^/]+)',
                      )}$`,
                    ),
                  ),
                ),
              }),
            ),
          }),
        )
        .addStatement(
          new IfStatementBuilder({
            expression: new BinaryExpressionBuilder({
              left: new PrefixUnaryExpressionBuilder({
                operand: new IdentifierBuilder({ text: 'match' }),
                operator: SyntaxKind.ExclamationToken,
              }),
              operator: SyntaxKind.BarBarToken,
              right: new PrefixUnaryExpressionBuilder({
                operator: SyntaxKind.ExclamationToken,
                operand: new PropertyAccessExpressionBuilder({
                  expression: new IdentifierBuilder({ text: 'match' }),
                  name: 'groups',
                }),
              }),
            }),
            thenStatement: new BlockBuilder({ multiLine: true }).addStatement(
              new ThrowStatementBuilder({
                expression: new NewExpressionBuilder({
                  expression: new IdentifierBuilder({
                    text: 'Error',
                  }),
                }).addArgument(
                  new TemplateExpressionBuilder({
                    head: new TemplateHeadBuilder({
                      text: 'Invalid post path. got ',
                    }),
                    templateSpans: [
                      new TemplateSpanBuilder({
                        expression: new PropertyAccessExpressionBuilder({
                          expression: new PropertyAccessExpressionBuilder({
                            expression: args.snapshot,
                            name: 'ref',
                          }),
                          name: 'path',
                        }),
                        literal: new TemplateTailBuilder({
                          text: '',
                          rawText: '',
                        }),
                      }),
                    ],
                  }),
                ),
              }),
            ),
          }),
        )
        .addStatement(
          new VariableStatementBuilder({
            declarationList: new VariableDeclarationListBuilder({
              flags: NodeFlags.Const,
            }).addDeclaration(
              new VariableDeclarationBuilder({
                name: 'data',
                initializer: new CallExpressionBuilder({
                  expression: new PropertyAccessExpressionBuilder({
                    expression: args.snapshot,
                    name: 'data',
                  }),
                }),
              }),
            ),
          }),
        )
        .addStatement(
          new ReturnStatementBuilder({
            expression: new ObjectLiteralExpressionBuilder({
              multiLine: true,
              properties: fields
                .map((field) => {
                  if (field.isRelation) {
                    return null
                  }
                  if (match.mapperFields.includes(field.name.value)) {
                    return new PropertyAssignmentBuilder({
                      name: field.name.value,
                      initializer: new PropertyAccessExpressionBuilder({
                        expression: new PropertyAccessExpressionBuilder({
                          expression: new IdentifierBuilder({ text: 'match' }),
                          name: 'groups',
                        }),
                        name: field.name.value,
                      }),
                    })
                  }
                  return new PropertyAssignmentBuilder({
                    name: field.name.value,
                    initializer: new PropertyAccessExpressionBuilder({
                      expression: new IdentifierBuilder({ text: 'data' }),
                      name: field.name.value,
                    }),
                  })
                })
                .filter(isNotNullable),
            }).addProperty(
              new PropertyAssignmentBuilder({
                name: '__typename',
                initializer: new PropertyAccessExpressionBuilder({
                  expression: new IdentifierBuilder({ text: 'data' }),
                  name: '__typename',
                }),
              }),
            ),
          }),
        ),
    })
  }

  private _processConverter(
    node: ObjectTypeDefinitionNode,
    directives: FirestoreType['directives'],
    match: FirestoreDocumentMatch,
    fields: FirestoreField[],
  ) {
    const converter = new VariableDeclarationBuilder({
      name: `${camelCase(node.name.value)}Converter`,
      type: new TypeReferenceNodeBuilder({
        typeName: 'FirestoreDataConverter',
        typeArguments: [
          new TypeReferenceNodeBuilder({ typeName: node.name.value }),
        ],
      }),
      initializer: new ObjectLiteralExpressionBuilder({
        multiLine: true,
      })
        .addProperty(
          this._processConverter_toFirestore(node, directives, match, fields),
        )
        .addProperty(
          this._processConverter_fromFirestore(node, directives, match, fields),
        ),
    })

    this._statements.push(
      new VariableStatementBuilder({
        declarationList: new VariableDeclarationListBuilder({
          declarations: [converter],
          flags: NodeFlags.Const,
        }),
      }),
    )

    return converter
  }

  private _processGetQuery(
    node: ObjectTypeDefinitionNode,
    directives: FirestoreType['directives'],
    match: FirestoreDocumentMatch,
    fields: FirestoreField[],
    converter: VariableDeclarationBuilder,
  ) {
    this._queries.push(
      new MethodDeclarationBuilder({
        name: new IdentifierBuilder({ text: `get${node.name.value}` }),
        modifiers: [new ModifierBuilder({ kind: SyntaxKind.AsyncKeyword })],
        parameters: [
          new ParameterDeclarationBuilder({
            name: new IdentifierBuilder({ text: 'parent' }),
          }),
          new ParameterDeclarationBuilder({
            name: new IdentifierBuilder({ text: 'args' }),
          }),
          new ParameterDeclarationBuilder({
            name: new IdentifierBuilder({ text: 'context' }),
          }),
          new ParameterDeclarationBuilder({
            name: new IdentifierBuilder({ text: 'info' }),
          }),
        ],
        body: new BlockBuilder({ multiLine: true })
          .addStatement(
            new VariableStatementBuilder({
              declarationList: new VariableDeclarationListBuilder({
                flags: NodeFlags.Const,
              }).addDeclaration(
                new VariableDeclarationBuilder({
                  name: 'res',
                  initializer: new AwaitExpressionBuilder({
                    expression: new CallExpressionBuilder({
                      expression: new IdentifierBuilder({ text: 'getDoc' }),
                      argumentsArray: [
                        new CallExpressionBuilder({
                          expression: new PropertyAccessExpressionBuilder({
                            expression: new CallExpressionBuilder({
                              expression: new IdentifierBuilder({
                                text: 'doc',
                              }),
                              argumentsArray: [
                                new IdentifierBuilder({ text: 'firestore' }),
                                TemplateExpressionBuilder.fromCode(
                                  `\`${directives.firestore.document.replace(
                                    /{(?<field>[^}]+)}/g,
                                    '$${args.$<field>}',
                                  )}\``,
                                ),
                              ],
                            }),
                            name: 'withConverter',
                          }),
                          argumentsArray: [
                            new IdentifierBuilder({
                              text: `${camelCase(node.name.value)}Converter`,
                            }),
                          ],
                        }),
                      ],
                    }),
                  }),
                }),
              ),
            }),
          )
          .addStatement(
            new ReturnStatementBuilder({
              expression: new BinaryExpressionBuilder({
                left: new CallExpressionBuilder({
                  expression: new PropertyAccessExpressionBuilder({
                    expression: new IdentifierBuilder({ text: 'res' }),
                    name: 'data',
                  }),
                }),
                operator: SyntaxKind.QuestionQuestionToken,
                right: new NullBuilder({}),
              }),
            }),
          ),
      }),
    )
  }

  private _processType(
    node: ObjectTypeDefinitionNode,
    directives: FirestoreType['directives'],
    match: FirestoreDocumentMatch,
    fields: FirestoreField[],
  ) {
    const converter = this._processConverter(node, directives, match, fields)
    this._processGetQuery(node, directives, match, fields, converter)
  }

  override FirestoreTypeDefinition(
    node: ObjectTypeDefinitionNode,
    directives: FirestoreType['directives'],
    match: FirestoreDocumentMatch,
    fields: FirestoreField[],
  ) {
    this._processType(node, directives, match, fields)
  }
}
