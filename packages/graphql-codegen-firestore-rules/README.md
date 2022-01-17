# `@firebase-graphql/graphql-codegen-firestore-rules`

<div align="center">

[![npm downloads](https://img.shields.io/npm/dm/@firebase-graphql/graphql-codegen-firestore-rules.svg?style=for-the-badge)](https://www.npmjs.com/package/@firebase-graphql/graphql-codegen-firestore-rules)
[![npm](https://img.shields.io/npm/dt/@firebase-graphql/graphql-codegen-firestore-rules.svg?style=for-the-badge)](https://www.npmjs.com/package/@firebase-graphql/graphql-codegen-firestore-rules)
[![npm](https://img.shields.io/npm/l/@firebase-graphql/graphql-codegen-firestore-rules?style=for-the-badge)](https://opensource.org/licenses/MIT)

</div>

## Abstract

- This package is a member of the [`firebase-graphql`](https://github.com/YutaUra/firebase-graphql) package family.
- This package generates a Firestore Rules file from a GraphQL schema which defined firestore structure.
- You can use this package **without** GraphQL

## Example

First, you need to define the structure of the firestore according to the GraphQL format.

```graphql
# firestore.graphql
type User
  @firestore(document: "/users/{id}")
  @auth(
    rules: [
      { allow: owner, ownerField: "id", operations: [create, update] }
      { allow: public, operations: [get, list] }
    ]
  ) {
  id: ID!
  name: String!
  age: Int
}

type Post
  @firestore(document: "/users/{userId}/posts/{id}")
  @auth(
    rules: [
      {
        allow: owner
        ownerField: "userId"
        operations: [create, update, delete]
      }
      { allow: public, operations: [get, list] }
    ]
  ) {
  id: ID!
  userId: ID!
  title: String!
  content: String!
}
```

Then, you can generate the Firestore Rules file. Like this:

```
rules_version = "2"
service cloud.firestore {
  match /databases/{database}/documents {
    function isString(value) {
      return value is string
    }
    function isInt(value) {
      return value is int
    }
    function isBoolean(value) {
      return value is bool
    }
    function isFloat(value) {
      return value is float
    }
    function isID(value) {
      return value is string
    }
    function isDate(value) {
      return value is timestamp
    }
    function isMap(value) {
      return value is map
    }
    function isRequired(source, field) {
      return field in source && source[field] != null
    }
    function isNullable(source, field) {
      return !(field in source) || source[field] == null
    }
    function isLoggedIn() {
      return request.auth != null
    }
    function isAuthUserId(userId) {
      return isLoggedIn() && request.auth.uid == userId
    }
    function isPost(value) {
      return (
        isMap(value) && value.keys().hasOnly(["__typename", "content", "title"])
        && isRequired(value, "__typename") && isString(value.__typename) && value.__typename == "Post"
        && isRequired(value, "content") && isString(value.content)
        && isRequired(value, "title") && isString(value.title)
      )
    }
    function isUser(value) {
      return (
        isMap(value) && value.keys().hasOnly(["__typename", "age", "name"])
        && isRequired(value, "__typename") && isString(value.__typename) && value.__typename == "User"
        && (isNullable(value, "age") || isInt(value.age))
        && isRequired(value, "name") && isString(value.name)
      )
    }
    match /users/{userId}/posts/{id} {
      allow get: if (
        true
      )
      allow list: if (
        true
      )
      allow create: if (
        isPost(request.resource.data)
        && isAuthUserId(userId)
      )
      allow update: if (
        isPost(request.resource.data)
        && isAuthUserId(userId)
      )
      allow delete: if (
        isAuthUserId(userId)
      )
    }
    match /users/{id} {
      allow get: if (
        true
      )
      allow list: if (
        true
      )
      allow create: if (
        isUser(request.resource.data)
        && isAuthUserId(id)
      )
      allow update: if (
        isUser(request.resource.data)
        && isAuthUserId(id)
      )
    }
  }
}
```

## How to use

### Install

```sh
yarn add -D @firebase-graphql/graphql-codegen-firestore-rules @graphql-codegen/cli
```

### Make schema file

```graphql
# firestore.graphql
type User
  @firestore(document: "/users/{id}")
  @auth(
    rules: [
      { allow: owner, ownerField: "id", operations: [create, update] }
      { allow: public, operations: [get, list] }
    ]
  ) {
  id: ID!
  name: String!
  age: Int
}
```

### Configure graphql-codegen file

```yaml
# codegen.yml
generators:
  firestore.rules:
    schema: firestore.graphql
    plugins:
      - '@firebase-graphql/graphql-codegen-firestore-rules'
```

### Generate Firestore Rules file

```sh
yarn graphql-codegen
```

## Concept and Usage

### Data Validation

this package generate validation functions for firestore.rules.

#### Literals

This package supports the following literals:

- `String` → tha value should be a `string`
- `Int` → tha value should be a `int`
- `Float` → tha value should be a `float`
- `Boolean` → tha value should be a `bool`
- `ID` → tha value should be a `string`
- `Date` → tha value should be a `timestamp`

#### Enums

You can define enums in the schema.

```graphql
# firestore.graphql

enum Category {
  IT
  MARKETING
  EDUCATION
}
```

Then, this package generates validation functions for enums. like this:

```
# firestore.rules
function isCategory(value) {
  return value is string && value in ["IT", "MARKETING", "EDUCATION"]
}
```

#### Other Types

```graphql
# firestore.graphql

type Image {
  url: String!
  width: Int!
  height: Int!
}

type User {
  id: ID!
  name: String!
  age: Int
  profileImage: Image
}

type Post {
  id: ID!
  title: String!
  content: String!
  header: Image!
  author: User!
}
```

Then,

```
# firestore.rules
function isImage(value) {
  return (
    isMap(value) && value.keys().hasOnly(["url", "width", "height"])
    && isRequired(value, "url") && isString(value.url)
    && isRequired(value, "width") && isInt(value.width)
    && isRequired(value, "height") && isInt(value.height)
  )
}
functions isUser(value) {
  return (
    isMap(value) && value.keys().hasOnly(["id", "name", "age", "profileImage"])
    && isRequired(value, "id") && isID(value.id)
    && isRequired(value, "name") && isString(value.name)
    && (isNullable(value, "age") || isInt(value.age))
    && isRequired(value, "profileImage") && isImage(value.profileImage)
  )
}
function isPost(value) {
  return (
    isMap(value) && value.keys().hasOnly(["id", "title", "content", "header", "author"])
    && isRequired(value, "id") && isID(value.id)
    && isRequired(value, "title") && isString(value.title)
    && isRequired(value, "content") && isString(value.content)
    && isRequired(value, "header") && isImage(value.header)
    && isRequired(value, "author") && isUser(value.author)
  )
}
```

### Firestore Document Access

You can define `Type` with `@firestore` directive.

```graphql
# firestore.graphql
type User @firestore(document: "/users/{id}") {
  id: ID!
  name: String!
  age: Int
}
```

By doing this, you can generate a match expression for firestore.rules

```
# firestore.rules
match /users/{userId} {
}
```

This way the id field of the User will be treated as a special field and automatically understood to use the value from the path `/users/{id}`.

So, the validation for User will be as follows.

```
# firestore.rules

# Id is not included in the validation, since it is a special field obtained from the path.
function isUser(value) {
  return (
    isMap(value) && value.keys().hasOnly(["__typename", "age", "name"])
    && isRequired(value, "__typename") && isString(value.__typename) && value.__typename == "User"
    && (isNullable(value, "age") || isInt(value.age))
    && isRequired(value, "name") && isString(value.name)
  )
}
```

It is recommended that the `@firestore` directive be used in conjunction with the `@auth` directive, described next.

### Access Control

The @firestore can be followed by an @auth directive to define access controls for that data.

Like this,

```graphql
# firestore.graphql
type User
  @firestore(document: "/users/{id}")
  @auth(rules: [{ allow: public, operations: [get, list] }]) {
  id: ID!
  name: String!
  age: Int
}
```

The `@auth` directive needs to be specified with a rules argument. These rules are calculated as a disjunction.

The format of the rule is as follows

| Field      | Type                                                 | required                                                                  | Description                                              |
| ---------- | ---------------------------------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------- |
| allow      | `public`, `private`, `owner`                         | :white_check_mark:                                                        | type of access control                                   |
| operations | list of {`get`, `list`,`create`, `update`, `delete`} | :white_check_mark:                                                        | The operations to allow access to.                       |
| ownerField | string (but should be field name)                    | :negative_squared_cross_mark: (if `allow: owner` then :white_check_mark:) | Compare that field with the ID of the user accessing it. |

#### Examples

##### Anyone can read and write.

```graphql
# firestore.graphql
type User
  @firestore(document: "/users/{id}")
  @auth(
    rules: [{ allow: public, operations: [get, list, create, update, delete] }]
  ) {
  id: ID!
  name: String!
  age: Int
}
```

```
# firestore.rules

match /users/{id} {
  allow get: if (
    true
  )
  allow list: if (
    true
  )
  allow create: if (
    isUser(request.resource.data)
    && true
  )
  allow update: if (
    isUser(request.resource.data)
    && true
  )
  allow delete: if (
    true
  )
}
```

##### Anyone who is logged in can read and write.

```graphql
# firestore.graphql
type User
  @firestore(document: "/users/{id}")
  @auth(
    rules: [{ allow: private, operations: [get, list, create, update, delete] }]
  ) {
  id: ID!
  name: String!
  age: Int
}
```

```
# firestore.rules

match /users/{id} {
  allow get: if (
    isLoggedIn()
  )
  allow list: if (
    isLoggedIn()
  )
  allow create: if (
    isUser(request.resource.data)
    && isLoggedIn()
  )
  allow update: if (
    isUser(request.resource.data)
    && isLoggedIn()
  )
  allow delete: if (
    isLoggedIn()
  )
}
```

##### Only the owner can read and write.

```graphql
# firestore.graphql
type User
  @firestore(document: "/users/{id}")
  @auth(
    rules: [
      {
        allow: owner
        operations: [get, list, create, update, delete]
        ownerField: "id"
      }
    ]
  ) {
  id: ID!
  name: String!
  age: Int
}
```

```
# firestore.rules

match /users/{id} {
  allow get: if (
    isAuthUserId(id)
  )
  allow list: if (
    isAuthUserId(id)
  )
  allow create: if (
    isUser(request.resource.data)
    && isAuthUserId(id)
  )
  allow update: if (
    isUser(request.resource.data)
    && isAuthUserId(id)
  )
  allow delete: if (
    isAuthUserId(id)
  )
}
```

If the ownerField is not path-based

```graphql
# firestore.graphql
type User
  @firestore(document: "/users/{id}")
  @auth(
    rules: [
      {
        allow: owner
        operations: [get, list, create, update, delete]
        ownerField: "userId"
      }
    ]
  ) {
  id: ID!
  userId: ID!
  name: String!
  age: Int
}
```

```
# firestore.rules

match /users/{id} {
  allow get: if (
    isAuthUserId(resource.data.userId)
  )
  allow list: if (
    isAuthUserId(resource.data.userId)
  )
  allow create: if (
    isUser(request.resource.data)
    && isAuthUserId(request.resource.data.userId)
  )
  allow update: if (
    isUser(request.resource.data)
    && (isAuthUserId(request.resource.data.userId) && isAuthUserId(resource.data.userId))
  )
  allow delete: if (
    isAuthUserId(resource.data.userId)
  )
}
```

### ServerTimestamp

You may want to match the value of a field with its creation or update time, such as createdAt or updatedAt

In such cases, the @createdAt and @updatedAt directives can be used.

```graphql
# firestore.graphql
type User
  @firestore(document: "/users/{id}")
  @auth(
    rules: [{ allow: private, operations: [get, list, create, update, delete] }]
  ) {
  id: ID!
  name: String!
  age: Int
  # The field name can be anything other than "createdAt" or "updatedAt".
  createdAt: Date! @createdAt
  updatedAt: Date! @updatedAt
}
```

And this will generate the following rules

```
# firestore.rules

match /users/{id} {
  allow get: if (
    isLoggedIn()
  )
  allow list: if (
    isLoggedIn()
  )
  allow create: if (
    isUser(request.resource.data)
    && request.resource.data.createdAt == request.time
    && request.resource.data.updatedAt == request.time
    && isLoggedIn()
  )
  allow update: if (
    isUser(request.resource.data)
    && !("createdAt" in request.resource.data)
    && request.resource.data.updatedAt == request.time
    && isLoggedIn()
  )
  allow delete: if (
    isLoggedIn()
  )
}
```

### Contributors

- [@YutaUra](https://github.com/YutaUra)

### License

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
