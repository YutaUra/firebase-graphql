import {
  ArrowFunction,
  ConciseBody,
  EqualsGreaterThanToken,
  factory as f,
  Modifier,
  ParameterDeclaration,
  TypeNode,
  TypeParameterDeclaration,
} from 'typescript'
import { Builder } from './types'

export type ArrowFunctionBuilderOptions = {
  modifiers?: Builder<Modifier>[]
  typeParameters?: Builder<TypeParameterDeclaration>[]
  parameters?: Builder<ParameterDeclaration>[]
  type?: Builder<TypeNode>
  equalsGreaterThanToken?: Builder<EqualsGreaterThanToken>
  body: Builder<ConciseBody>
}

export class ArrowFunctionBuilder implements Builder<ArrowFunction> {
  constructor(private options: ArrowFunctionBuilderOptions) {}

  build(): ArrowFunction {
    return f.createArrowFunction(
      this.options.modifiers?.map((m) => m.build()),
      this.options.typeParameters?.map((t) => t.build()),
      this.options.parameters?.map((p) => p.build()) ?? [],
      this.options.type?.build(),
      this.options.equalsGreaterThanToken?.build(),
      this.options.body.build(),
    )
  }

  copy(): ArrowFunctionBuilder {
    return new ArrowFunctionBuilder({
      modifiers: this.options.modifiers?.map((m) => m.copy()),
      typeParameters: this.options.typeParameters?.map((t) => t.copy()),
      parameters: this.options.parameters?.map((p) => p.copy()),
      type: this.options.type?.copy(),
      equalsGreaterThanToken: this.options.equalsGreaterThanToken?.copy(),
      body: this.options.body.copy(),
    })
  }

  addModifier(modifier: Builder<Modifier>): ArrowFunctionBuilder {
    return new ArrowFunctionBuilder({
      modifiers: [
        ...(this.options.modifiers ?? []).map((v) => v.copy()),
        modifier,
      ],
      typeParameters: this.options.typeParameters?.map((v) => v.copy()),
      parameters: this.options.parameters?.map((v) => v.copy()),
      type: this.options.type?.copy(),
      equalsGreaterThanToken: this.options.equalsGreaterThanToken?.copy(),
      body: this.options.body.copy(),
    })
  }

  addTypeParameter(
    typeParameter: Builder<TypeParameterDeclaration>,
  ): ArrowFunctionBuilder {
    return new ArrowFunctionBuilder({
      modifiers: this.options.modifiers?.map((v) => v.copy()),
      typeParameters: [
        ...(this.options.typeParameters ?? []).map((v) => v.copy()),
        typeParameter,
      ],
      parameters: this.options.parameters?.map((v) => v.copy()),
      type: this.options.type?.copy(),
      equalsGreaterThanToken: this.options.equalsGreaterThanToken?.copy(),
      body: this.options.body.copy(),
    })
  }

  addParameter(parameter: Builder<ParameterDeclaration>): ArrowFunctionBuilder {
    return new ArrowFunctionBuilder({
      modifiers: this.options.modifiers?.map((v) => v.copy()),
      typeParameters: this.options.typeParameters?.map((v) => v.copy()),
      parameters: [
        ...(this.options.parameters ?? []).map((v) => v.copy()),
        parameter,
      ],
      type: this.options.type?.copy(),
      equalsGreaterThanToken: this.options.equalsGreaterThanToken?.copy(),
      body: this.options.body.copy(),
    })
  }
}
