import { transformSchemaAST } from '@graphql-codegen/schema-ast'
import {
  buildSchema,
  GraphQLSchema,
  ObjectTypeDefinitionNode,
  visit,
} from 'graphql'
import {
  FirestoreCoreConfig,
  FirestoreCoreParsedConfig,
  FirestoreCoreVisitor,
  FirestoreDocumentMatch,
  FirestoreField,
  FirestoreType,
} from '../src'

class TestVisitor extends FirestoreCoreVisitor<
  FirestoreCoreConfig,
  FirestoreCoreParsedConfig
> {
  firebaseTypes: {
    node: ObjectTypeDefinitionNode
    directives: FirestoreType['directives']
    match: FirestoreDocumentMatch
    fields: FirestoreField[]
  }[]
  constructor(
    schema: GraphQLSchema,
    pluginConfig: FirestoreCoreConfig,
    additionalConfig: Partial<FirestoreCoreParsedConfig> = {},
  ) {
    super(schema, pluginConfig, additionalConfig)

    this.firebaseTypes = []
  }

  FirestoreTypeDefinition(
    node: ObjectTypeDefinitionNode,
    directives: FirestoreType['directives'],
    match: FirestoreDocumentMatch,
    fields: FirestoreField[],
  ) {
    this.firebaseTypes.push({
      node,
      directives,
      match,
      fields,
    })
  }
}

const testPlugin = (schema: GraphQLSchema) => {
  const { schema: _schema, ast } = transformSchemaAST(schema, {})

  const visitor = new TestVisitor(_schema, { ignoreNoAuthWarning: true })

  visit(ast, visitor)

  return visitor.firebaseTypes
}

describe('@firebase-graphql/graphql-codegen-firestore-core', () => {
  test('Absolutely successful', () => {
    expect(true).toBeTruthy()
  })

  describe('detect firestore type', () => {
    test('without firestore type', () => {
      const schema = buildSchema(/* GraphQL */ `
        type User {
          name: String
        }
        type Query {
          getUser(name: String): User
        }
      `)
      const result = testPlugin(schema)
      expect(result).toHaveLength(0)
    })
    test('one firestore type', () => {
      const schema = buildSchema(
        /* GraphQL */ `
          type User @firestore(document: "/users/{id}") {
            name: String
            id: ID!
          }
          type Query {
            getUser(name: String): User
          }
        `,
        { assumeValid: true },
      )
      const result = testPlugin(schema)
      expect(result).toHaveLength(1)
    })

    test('multiple firestore type', () => {
      const schema = buildSchema(
        /* GraphQL */ `
          type User @firestore(document: "/users/{id}") {
            name: String
            id: ID!
          }
          type Post @firestore(document: "/users/{userId}/posts/{id}") {
            name: String
            id: ID!
            userId: ID!
          }
        `,
        { assumeValid: true },
      )
      const result = testPlugin(schema)
      expect(result).toHaveLength(2)
    })
  })

  describe('firestore directive test', () => {
    test('document argument', () => {
      const schema = buildSchema(
        /* GraphQL */ `
          type User @firestore(document: "/users/{id}") {
            name: String
            id: ID!
          }
          type Post @firestore(document: "/users/{userId}/posts/{id}") {
            name: String
            id: ID!
            userId: ID!
          }
        `,
        { assumeValid: true },
      )
      const result = testPlugin(schema)
      expect(result[0].directives.firestore.document).toBe('/users/{id}')
      expect(result[1].directives.firestore.document).toBe(
        '/users/{userId}/posts/{id}',
      )
    })

    describe('document match paths', () => {
      test('mapper fields', () => {
        const schema = buildSchema(
          /* GraphQL */ `
            type User @firestore(document: "/users/{id}") {
              name: String
              id: ID!
            }
            type Post @firestore(document: "/users/{userId}/posts/{id}") {
              name: String
              id: ID!
              userId: ID!
            }
          `,
          { assumeValid: true },
        )
        const result = testPlugin(schema)
        expect(new Set(result[0].match.mapperFields)).toStrictEqual(
          new Set(['id']),
        )
        expect(new Set(result[1].match.mapperFields)).toStrictEqual(
          new Set(['userId', 'id']),
        )
      })

      test('auto id field', () => {
        const schema = buildSchema(
          /* GraphQL */ `
            type User @firestore(document: "/users/{id}") {
              name: String
              id: ID!
            }
            type Post @firestore(document: "/users/{userId}/posts/{id}") {
              name: String
              id: ID!
              userId: ID!
            }
            type Tag @firestore(document: "/tags/prefix-{id}") {
              id: ID!
              name: String
            }
          `,
          { assumeValid: true },
        )
        const result = testPlugin(schema)
        expect(result[0].match.autoIdField).toBe('id')
        expect(result[1].match.autoIdField).toBe('id')
        expect(result[2].match.autoIdField).toBeNull()
      })
    })

    describe('firestore match', () => {
      describe('invalid document', () => {
        test("document should start with '/'", () => {
          const schema = buildSchema(
            /* GraphQL */ `
              type User @firestore(document: "users/{id}") {
                id: ID!
                name: String
              }
            `,
            { assumeValid: true },
          )
          expect(() => testPlugin(schema)).toThrowError(
            '"document" argument must start with "/"',
          )
        })
        test("document should have event '/'s", () => {
          const schema = buildSchema(
            /* GraphQL */ `
              type User @firestore(document: "/users/{id}/test") {
                id: ID!
                name: String
              }
            `,
            { assumeValid: true },
          )
          expect(() => testPlugin(schema)).toThrowError(
            "@firestore's document must have even number of '/'.",
          )
        })
      })
    })
  })

  describe('"@createdAt" and "@updatedAt" directive', () => {
    test('"@createdAt" should be non-nullable', async () => {
      const schema = buildSchema(
        /* GraphQL */ `
          scalar Date
          type User @firestore(document: "/users/{id}") {
            id: ID!
            createdAt: Date @createdAt
          }
        `,
        { assumeValid: true },
      )
      expect(() => testPlugin(schema)).toThrowError(
        '@createdAt field must be non-nullable Date type.',
      )
    })
    test('"@updatedAt" should be non-nullable', async () => {
      const schema = buildSchema(
        /* GraphQL */ `
          scalar Date
          type User @firestore(document: "/users/{id}") {
            id: ID!
            updatedAt: Date @updatedAt
          }
        `,
        { assumeValid: true },
      )
      expect(() => testPlugin(schema)).toThrowError(
        '@updatedAt field must be non-nullable Date type.',
      )
    })

    test('@createdAt should be Date', async () => {
      const schema = buildSchema(
        /* GraphQL */ `
          scalar Test
          type User @firestore(document: "/users/{id}") {
            id: ID!
            createdAt: Test @createdAt
          }
        `,
        { assumeValid: true },
      )
      expect(() => testPlugin(schema)).toThrowError(
        '@createdAt field must be non-nullable Date type.',
      )
    })

    test('@updatedAt should be Date', async () => {
      const schema = buildSchema(
        /* GraphQL */ `
          scalar Test
          type User @firestore(document: "/users/{id}") {
            id: ID!
            createdAt: Test @updatedAt
          }
        `,
        { assumeValid: true },
      )
      expect(() => testPlugin(schema)).toThrowError(
        '@updatedAt field must be non-nullable Date type.',
      )
    })
  })

  describe('"@auth" directive test', () => {
    describe('owner rule', () => {
      test('owner rules should have ownerField', () => {
        const schema = buildSchema(
          /* GraphQL */ `
            type User
              @firestore(document: "/users/{id}")
              @auth(rules: [{ allow: owner, operations: [get] }]) {
              id: ID!
              name: String
            }
          `,
          { assumeValid: true },
        )
        expect(() => testPlugin(schema)).toThrowError(
          '"ownerField" argument is required when "allow" argument is "owner"',
        )
      })

      test('ownerField not found', async () => {
        const schema = buildSchema(
          /* GraphQL */ `
            type User
              @firestore(document: "/users/{id}")
              @auth(
                rules: [{ allow: owner, ownerField: "test", operations: [get] }]
              ) {
              id: ID!
              name: String
            }
          `,
          { assumeValid: true },
        )
        expect(() => testPlugin(schema)).toThrowError(
          '"ownerField" argument must be a valid field name',
        )
      })

      test('ownerField must not be list type', async () => {
        const schema = buildSchema(
          /* GraphQL */ `
            type User
              @firestore(document: "/users/{id}")
              @auth(
                rules: [{ allow: owner, ownerField: "name", operations: [get] }]
              ) {
              id: ID!
              name: [String]
            }
          `,
          { assumeValid: true },
        )
        expect(() => testPlugin(schema)).toThrowError(
          '"ownerField" argument must be a non-list field',
        )
      })
      test('ownerField must not be String or ID', async () => {
        const schema = buildSchema(
          /* GraphQL */ `
            type User
              @firestore(document: "/users/{id}")
              @auth(
                rules: [{ allow: owner, ownerField: "name", operations: [get] }]
              ) {
              id: ID!
              name: Int
            }
          `,
          { assumeValid: true },
        )
        expect(() => testPlugin(schema)).toThrowError(
          '"ownerField" argument must be a String or ID field',
        )
      })
    })
  })
})
