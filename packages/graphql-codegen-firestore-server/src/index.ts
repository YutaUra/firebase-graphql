import { PluginFunction, Types } from '@graphql-codegen/plugin-helpers'
import { transformSchemaAST } from '@graphql-codegen/schema-ast'
import { GraphQLSchema, print, visit } from 'graphql'
import ts from 'typescript'
import { FirestoreServerPluginConfig } from './config'
import { FirestoreServerVisitor } from './visitor'

export const plugin: PluginFunction<
  FirestoreServerPluginConfig,
  Types.ComplexPluginOutput
> = (
  schema: GraphQLSchema,
  documents: Types.DocumentFile[],
  config: FirestoreServerPluginConfig,
) => {
  const { ast } = transformSchemaAST(schema, config)

  const visitor = new FirestoreServerVisitor(config)

  visit(ast, visitor)

  const printer = ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed,
  })

  return {
    prepend: [
      '/* eslint-disable */',
      '// prettier-ignore',
      `import { ApolloServerBase, GraphQLExecutionResult, GraphQLRequest } from "apollo-server-core";`,
      `import { DocumentNode, getOperationAST, OperationTypeNode, parse, subscribe } from "graphql";`,
      `import { FirebaseApp } from 'firebase/app'`,
      `import { doc, FirestoreDataConverter, getDoc, getFirestore } from 'firebase/firestore'`,
      `import { gql } from 'graphql-tag'`,
    ],
    content:
      `class ApolloServerLocal extends ApolloServerBase {
  async execute(
    request: Omit<GraphQLRequest, "query"> & {
      query: string | DocumentNode;
    },
    integrationContextArgument?: any
  ): Promise<
    | GraphQLExecutionResult
    | AsyncGenerator<GraphQLExecutionResult, void, void>
    | GraphQLExecutionResult
  > {
    const query =
    typeof request.query === "string" ? parse(request.query) : request.query;
    const ast = getOperationAST(query, request.operationName);

    if (!ast) {
      throw new Error("Must provide query string or a document");
    }
    if (ast.operation !== OperationTypeNode.SUBSCRIPTION) {
      return this.executeOperation(
        request,
        integrationContextArgument
      ) as Promise<GraphQLExecutionResult>;
    }

    const { schema, rootValue, context } = await this.graphQLServerOptions();

    return await subscribe({
      schema,
      document: query,
      rootValue,
      contextValue: context,
      variableValues: request.variables,
      operationName: request.operationName,
    });
  }
}
` +
      `
const typeDefs = gql\`
directive @firestore(document: String!) on OBJECT

${print(ast)}
\`;

${printer.printFile(visitor.buildCode)}
`,
  }
}
