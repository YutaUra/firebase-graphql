import { PluginFunction, Types } from '@graphql-codegen/plugin-helpers'
import { transformSchemaAST } from '@graphql-codegen/schema-ast'
import { GraphQLSchema, print, visit } from 'graphql'
import { FirestoreSchemaPluginConfig } from './config'
import { FirestoreRulesVisitor } from './visitor'

export const plugin: PluginFunction<FirestoreSchemaPluginConfig, string> = (
  schema: GraphQLSchema,
  documents: Types.DocumentFile[],
  config: FirestoreSchemaPluginConfig,
) => {
  const { schema: _schema, ast } = transformSchemaAST(schema, config)

  const visitor = new FirestoreRulesVisitor(config)

  visit(ast, visitor)

  return print(visitor.buildSchema)
}
