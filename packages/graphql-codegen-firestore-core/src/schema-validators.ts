import {
  ASTNode,
  ConstDirectiveNode,
  ConstObjectFieldNode,
  ConstValueNode,
  Kind,
} from 'graphql'
import {
  FirestoreRulesAuthOperation,
  FirestoreRulesAuthStrategy,
} from './directives'

type EnumLike = {
  [k: string]: string | number
  [nu: number]: string
}

type Node = ASTNode

type Transformer<T, V> = (node: Readonly<T>) => V

interface INodeTransformer<K extends unknown, V extends Node = Node> {
  transform(value: Readonly<V>): K
}

export type InferNodeTransformer<T> = T extends NodeTransformer<infer V>
  ? V
  : never

export class NodeTransformer<K extends unknown, V extends Node = Node>
  implements INodeTransformer<K, V>
{
  protected constructor(private transformer: Transformer<Node, K>) {}

  static int() {
    return new IntValueNodeTransformer()
  }
  static float() {
    return new FloatValueNodeTransformer()
  }

  static string() {
    return new StringValueNodeTransformer()
  }

  static object() {
    return new ConstObjectValueNodeTransformer({})
  }

  static list<T>(itemTransformer: INodeTransformer<T>) {
    return new ConstListValueNodeTransformer(itemTransformer)
  }

  static enum<T extends Record<string, string>>(_enum: T) {
    return new EnumValueNodeTransformer(_enum)
  }

  static directive() {
    return new ConstDirectiveNodeTransformer({})
  }

  static objectTypeDefinition() {
    return new ObjectTypeDefinitionNodeTransformer({
      directives: {},
      fields: {},
    })
  }

  nullable(): NullValueNodeTransformer<K> {
    return new NullValueNodeTransformer(this)
  }

  transform(value: Readonly<Node>): K {
    return this.transformer(value)
  }
}

export class NullValueNodeTransformer<T> extends NodeTransformer<T | null> {
  constructor(transformer: INodeTransformer<T>) {
    super((node) => {
      if (node.kind === Kind.NULL) {
        return null
      }
      return transformer.transform(node)
    })
  }
}

export class IntValueNodeTransformer extends NodeTransformer<number> {
  constructor() {
    super((node) => {
      if (node.kind === Kind.INT) {
        return Number(node.value)
      }
      throw new Error(`Expected Int, but got ${node.kind}`)
    })
  }
}

export class FloatValueNodeTransformer extends NodeTransformer<number> {
  constructor() {
    super((node) => {
      if (node.kind === Kind.FLOAT) {
        return Number(node.value)
      }
      throw new Error(`Expected Float, but got ${node.kind}`)
    })
  }
}

export class StringValueNodeTransformer extends NodeTransformer<string> {
  constructor() {
    super((node) => {
      if (node.kind === Kind.STRING) {
        return node.value
      }
      throw new Error(`Expected String, but got ${node.kind}`)
    })
  }
}

export class EnumValueNodeTransformer<
  T extends EnumLike,
> extends NodeTransformer<T[keyof T]> {
  constructor(_enum: T) {
    super((node) => {
      if (node.kind !== Kind.ENUM) {
        throw new Error(
          `Expected Enum(${Object.values(_enum).join(', ')}), but got ${
            node.kind
          }`,
        )
      }
      if (!Object.values(_enum).includes(node.value))
        throw new Error(
          `Expected Enum(${Object.values(_enum).join(', ')}), but got ${
            node.kind
          }(${node.value})`,
        )

      return node.value as T[keyof T]
    })
  }
}

export class ConstListValueNodeTransformer<T> extends NodeTransformer<T[]> {
  constructor(itemTransformer: INodeTransformer<T>) {
    super((node) => {
      if (node.kind === Kind.LIST) {
        return node.values.map((item) => itemTransformer.transform(item))
      }
      throw new Error(`Expected List, but got ${node.kind}`)
    })
  }
}

type ConstObjectFieldsTransformer<T extends {}> = {
  [K in keyof T]: INodeTransformer<T[K]>
}

export class ConstObjectValueNodeTransformer<
  T extends {} = {},
> extends NodeTransformer<T> {
  constructor(private fieldsTransformer: ConstObjectFieldsTransformer<T>) {
    super((node) => {
      if (node.kind !== Kind.OBJECT) {
        throw new Error(`Expected Object, but got ${node.kind}`)
      }

      return Object.fromEntries(
        Object.entries<INodeTransformer<T[keyof T]>>(fieldsTransformer).map(
          ([fieldName, fieldTransformer]) => {
            const field = node.fields.find((v) => v.name.value === fieldName)
            return [
              fieldName,
              fieldTransformer.transform(
                field?.value ?? {
                  kind: Kind.NULL,
                },
              ),
            ] as [keyof T, T[keyof T]]
          },
        ),
      ) as T
    })
  }

  field<
    K extends string,
    V,
    S extends {
      [Key in keyof T | K]: Key extends keyof T
        ? Key extends K
          ? T[Key] & V
          : T[Key]
        : V
    },
  >(fieldName: K, transformer: INodeTransformer<V>) {
    return new ConstObjectValueNodeTransformer<S>({
      ...this.fieldsTransformer,
      [fieldName]: transformer,
    } as ConstObjectFieldsTransformer<S>)
  }
}

type ObjectTypeDefinitionTransformer<T extends {}, V extends {}> = {
  directives: {
    [K in keyof T]: INodeTransformer<T[K], ConstDirectiveNode>
  }
  fields: {
    [K in keyof V]: INodeTransformer<V[K], ConstObjectFieldNode>
  }
}

export class ObjectTypeDefinitionNodeTransformer<
  T1 extends {},
  T2 extends {},
> extends NodeTransformer<{
  directives: T1
  fields: T2
}> {
  constructor(
    private objectTypeDefinitionTransformer: ObjectTypeDefinitionTransformer<
      T1,
      T2
    >,
  ) {
    super((node) => {
      if (node.kind !== Kind.OBJECT_TYPE_DEFINITION) {
        throw new Error(`Expected ObjectTypeDefinition, but got ${node.kind}`)
      }

      return {
        directives: Object.fromEntries(
          Object.entries<INodeTransformer<T1[keyof T1]>>(
            objectTypeDefinitionTransformer.directives,
          ).map(([directiveName, fieldTransformer]) => {
            const directive = node.directives?.find(
              (v) => v.name.value === directiveName,
            )

            return [
              directiveName,
              fieldTransformer.transform(
                directive ?? {
                  kind: Kind.NULL,
                },
              ),
            ] as [keyof T1, T1[keyof T1]]
          }),
        ) as T1,
        fields: Object.fromEntries(
          Object.entries<INodeTransformer<T2[keyof T2]>>(
            objectTypeDefinitionTransformer.fields,
          ).map(([fieldName, fieldTransformer]) => {
            const directive = node.directives?.find(
              (v) => v.name.value === fieldName,
            )

            return [
              fieldName,
              fieldTransformer.transform(
                directive ?? {
                  kind: Kind.NULL,
                },
              ),
            ] as [keyof T2, T2[keyof T2]]
          }),
        ) as T2,
      }
    })
  }

  directive<
    K extends string,
    V,
    S extends {
      [Key in keyof T1 | K]: Key extends keyof T1
        ? Key extends K
          ? T1[Key] & V
          : T1[Key]
        : V
    },
  >(fieldName: K, transformer: INodeTransformer<V, ConstDirectiveNode>) {
    return new ObjectTypeDefinitionNodeTransformer<S, T2>({
      ...this.objectTypeDefinitionTransformer,
      directives: {
        ...this.objectTypeDefinitionTransformer.directives,
        [fieldName]: transformer,
      },
    } as ObjectTypeDefinitionTransformer<S, T2>)
  }

  field<
    K extends string,
    V,
    S extends {
      [Key in keyof T2 | K]: Key extends keyof T2
        ? Key extends K
          ? T2[Key] & V
          : T2[Key]
        : V
    },
  >(fieldName: K, transformer: INodeTransformer<V, ConstObjectFieldNode>) {
    return new ObjectTypeDefinitionNodeTransformer<T1, S>({
      ...this.objectTypeDefinitionTransformer,
      fields: {
        ...this.objectTypeDefinitionTransformer.fields,
        [fieldName]: transformer,
      },
    } as ObjectTypeDefinitionTransformer<T1, S>)
  }
}

type ConstDirectiveTransformer<T extends {}> = {
  [K in keyof T]: INodeTransformer<T[K]>
}

export class ConstDirectiveNodeTransformer<
  T extends {},
> extends NodeTransformer<T> {
  constructor(private constDirectiveTransformer: ConstDirectiveTransformer<T>) {
    super((node) => {
      if (node.kind !== Kind.DIRECTIVE) {
        throw new Error(`Expected Directive, but got ${node.kind}`)
      }

      return Object.fromEntries(
        Object.entries<INodeTransformer<T[keyof T]>>(
          constDirectiveTransformer,
        ).map(([argName, fieldTransformer]) => {
          const arg = node.arguments?.find((v) => v.name.value === argName)

          return [
            argName,
            fieldTransformer.transform(
              arg?.value ?? {
                kind: Kind.NULL,
              },
            ),
          ] as [keyof T, T[keyof T]]
        }),
      ) as T
    })
  }

  arg<
    K extends string,
    V,
    S extends {
      [Key in keyof T | K]: Key extends keyof T
        ? Key extends K
          ? T[Key] & V
          : T[Key]
        : V
    },
  >(fieldName: K, transformer: INodeTransformer<V>) {
    return new ConstDirectiveNodeTransformer<S>({
      ...this.constDirectiveTransformer,
      [fieldName]: transformer,
    } as ConstDirectiveTransformer<S>)
  }
}

const authRuleValidator = (rule: Readonly<ConstValueNode>) => {
  const authRule = NodeTransformer.object()
    .field('allow', NodeTransformer.enum(FirestoreRulesAuthStrategy))
    .field(
      'operations',
      NodeTransformer.list(NodeTransformer.enum(FirestoreRulesAuthOperation)),
    )
    .transform(rule)

  switch (authRule.allow) {
    case FirestoreRulesAuthStrategy.OWNER:
      return {
        ...authRule,
        allow: FirestoreRulesAuthStrategy.OWNER,
      } as const
    case FirestoreRulesAuthStrategy.PRIVATE:
      return {
        ...authRule,
        allow: FirestoreRulesAuthStrategy.PRIVATE,
      } as const
    case FirestoreRulesAuthStrategy.PUBLIC:
      return {
        ...authRule,
        allow: FirestoreRulesAuthStrategy.PUBLIC,
      } as const
    default:
      return undefined as never
  }
}

export const authDirectiveValidator = (
  directive: Readonly<ConstDirectiveNode>,
) => {
  const rules = directive.arguments?.find((arg) => arg.name.value === 'rules')
  if (!rules) throw new Error('@auth directive must have a rules argument')

  const authRules = NodeTransformer.list({
    transform: authRuleValidator,
  }).transform(rules.value)

  return authRules
}
