import { PluginFunction, Types } from '@graphql-codegen/plugin-helpers'
import { transformSchemaAST } from '@graphql-codegen/schema-ast'
import { GraphQLSchema, visit } from 'graphql'
import { FirestoreRulesPluginConfig } from './config'
import { renderRules } from './render-rules'
import { FirestoreRulesVisitor } from './visitor'

export const plugin: PluginFunction<FirestoreRulesPluginConfig, string> = (
  schema: GraphQLSchema,
  documents: Types.DocumentFile[],
  config: FirestoreRulesPluginConfig,
) => {
  const { schema: _schema, ast } = transformSchemaAST(schema, config)

  const visitor = new FirestoreRulesVisitor(_schema, config)

  visit(ast, visitor)

  return renderRules(visitor.rules, { indent: '  ' })
}
