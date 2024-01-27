/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

/* eslint-disable @rushstack/no-new-null */

import type {
	JsonForArrayItem,
	NonSymbolWithOptionalPropertyOf,
	NonSymbolWithRequiredPropertyOf,
} from "./exposedUtilityTypes.js";

/**
 * Type constraint for types that are likely encodable as JSON or have a custom
 * alternate type.
 *
 * @remarks
 * Use `JsonEncodableTypeWith<never>` for just JSON encodable types.
 * See {@link JsonEncodable} for encoding pitfalls.
 *
 * @privateRemarks
 * Perfer using `JsonEncodable<unknown>` over this type that is an implementation detail.
 * @beta
 */
export type JsonEncodableTypeWith<T> =
	| null
	| boolean
	| number
	| string
	| T
	| { [key: string | number]: JsonEncodableTypeWith<T> }
	| JsonEncodableTypeWith<T>[];

/**
 * Used to constrain a type `T` to types that are serializable as JSON.
 * Produces a compile-time error if `T` contains non-JsonEncodable members.
 *
 * @remarks
 * Note that this does NOT prevent using of values with non-json compatible data,
 * it only prevents using values with types that include non-json compatible data.
 * This means that one can, for example, pass in a value typed with json compatible
 * interface into this function,
 * that could actually be a class with lots on non-json compatible fields and methods.
 *
 * Important: `T extends JsonEncodable<T>` is incorrect (does not even compile).
 *
 * The optional 'TReplaced' parameter may be used to permit additional leaf types to support
 * situations where a `replacer` is used to handle special values (e.g., `JsonEncodable<{ x: IFluidHandle }, IFluidHandle>`).
 *
 * Note that `JsonEncodable<T>` does not protect against the following pitfalls when serializing with JSON.stringify():
 *
 * - Non-finite numbers (`NaN`, `+/-Infinity`) are coerced to `null`.
 *
 * - prototypes and non-enumerable properties are lost.
 *
 * - `ArrayLike` types that are not arrays and are serialized as `{ length: number }`.
 *
 * Also, `JsonEncodable<T>` does not prevent the construction of circular references.
 *
 * Using `JsonEncodable<unknown>` or `JsonEncodable<any>` is a type alias for
 * {@link JsonEncodableTypeWith}`<never>` and should not be used if precise type safety is desired.
 *
 * @example Typical usage
 *
 * ```typescript
 * function foo<T>(value: JsonEncodable<T>) { ... }
 * ```
 * @beta
 */
export type JsonEncodable<T, TReplaced = never> = /* test for 'any' */ boolean extends (
	T extends never ? true : false
)
	? /* 'any' => */ JsonEncodableTypeWith<TReplaced>
	: /* test for 'unknown' */ unknown extends T
	? /* 'unknown' => */ JsonEncodableTypeWith<TReplaced>
	: /* test for JsonEncodable primitive types */ T extends
			| null
			| boolean
			| number
			| string
			| TReplaced
	? /* primitive types => */ T
	: // eslint-disable-next-line @typescript-eslint/ban-types
	/* test for not a function */ Extract<T, Function> extends never
	? /* not a function => test for object */ T extends object
		? /* object => test for array */ T extends (infer _)[]
			? /* array => */ {
					/* array items may not not allow undefined */
					/* use homomorphic mapped type to preserve tuple type */
					[K in keyof T]: JsonForArrayItem<
						T[K],
						TReplaced,
						JsonEncodable<T[K], TReplaced>
					>;
			  }
			: /* property bag => */ {
					/* required properties are recursed and may not have undefined values. */
					[K in NonSymbolWithRequiredPropertyOf<T>]-?: undefined extends T[K]
						? "error-required-property-may-not-allow-undefined-value"
						: JsonEncodable<T[K], TReplaced>;
			  } & {
					/* optional properties are recursed and allowed to preserve undefined value type. */
					[K in NonSymbolWithOptionalPropertyOf<T>]?: JsonEncodable<
						T[K],
						TReplaced | undefined
					>;
			  } & {
					/* symbol properties are rejected */
					[K in keyof T & symbol]: never;
			  }
		: /* not an object => */ never
	: /* function => */ never;
