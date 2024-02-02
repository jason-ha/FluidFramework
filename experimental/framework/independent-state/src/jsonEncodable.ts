/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

/* eslint-disable @rushstack/no-new-null */

import type {
	IsEnumLike,
	IsExactlyObject,
	JsonForArrayItem,
	NonSymbolWithOptionalPropertyOf,
	NonSymbolWithRequiredPropertyOf,
} from "./exposedUtilityTypes.js";
import type { JsonTypeWith } from "./jsonType.js";

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
 * {@link JsonTypeWith}`<never>` and should not be used if precise type safety is desired.
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
	? /* 'any' => */ JsonTypeWith<TReplaced>
	: /* test for 'unknown' */ unknown extends T
	? /* 'unknown' => */ JsonTypeWith<TReplaced>
	: /* test for JSON Encodable primitive types or given alternate */ T extends
			| null
			| boolean
			| number
			| string
			| TReplaced
	? /* primitive types => */ T
	: // eslint-disable-next-line @typescript-eslint/ban-types
	/* test for not a function */ Extract<T, Function> extends never
	? /* not a function => test for object */ T extends object
		? /* object => test for array */ T extends readonly (infer _)[]
			? /* array => */ {
					/* array items may not not allow undefined */
					/* use homomorphic mapped type to preserve tuple type */
					[K in keyof T]: JsonForArrayItem<
						T[K],
						TReplaced,
						JsonEncodable<T[K], TReplaced>
					>;
			  }
			: /* not an array => test for exactly `object` */ IsExactlyObject<T> extends true
			? /* `object` => */ JsonTypeWith<TReplaced>
			: /* test for enum like types */ IsEnumLike<T> extends true
			? /* enum or similar simple type (return as-is) => */ T
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
