/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import {
	NonSymbolWithDefinedNonFunctionPropertyOf,
	NonSymbolWithUndefinedNonFunctionPropertyOf,
} from "./exposedUtilityTypes.js";

/**
 * Type constraint for types that are likely deserializable from JSON or have a custom
 * alternate type.
 *
 * @beta
 */
export type JsonDeserializedTypeWith<T> =
	| null
	| boolean
	| number
	| string
	| T
	| { [key: string | number]: JsonDeserializedTypeWith<T> }
	| JsonDeserializedTypeWith<T>[];

/**
 * Used to constrain a type `T` to types that are deserializable from JSON.
 *
 * When used as a filter to inferred generic `T`, a compile-time error can be
 * produced trying to assign `JsonDeserialized<T>` to `T`.
 *
 * Deserialized JSON never contains `undefined` values, so properties with
 * `undefined` values become optional. If the original property was not already
 * optional, then compilation of assignment will fail.
 *
 * Similarly, function valued properties are removed.
 *
 * @beta
 */
export type JsonDeserialized<T, TReplaced = never> = /* test for 'any' */ boolean extends (
	T extends never ? true : false
)
	? /* 'any' => */ JsonDeserializedTypeWith<TReplaced>
	: /* test for 'unknown' */ unknown extends T
	? /* 'unknown' => */ JsonDeserializedTypeWith<TReplaced>
	: /* test for Jsonable primitive types */ T extends null | boolean | number | string | TReplaced
	? /* primitive types => */ T
	: // eslint-disable-next-line @typescript-eslint/ban-types
	/* test for not a function */ Extract<T, Function> extends never
	? /* not a function => test for object */ T extends object
		? /* object => test for array */ T extends (infer E)[]
			? /* array => */ JsonDeserialized<E, TReplaced>[]
			: /* property bag => */
			  /* properties with symbol keys or function values are removed */
			  {
					/* properties with defined values are recursed */
					[K in NonSymbolWithDefinedNonFunctionPropertyOf<T>]: JsonDeserialized<
						T[K],
						TReplaced
					>;
			  } & {
					/* properties that may have undefined values are optional */
					[K in NonSymbolWithUndefinedNonFunctionPropertyOf<T>]?: JsonDeserialized<
						T[K],
						TReplaced
					>;
			  }
		: /* not an object => */ never
	: /* function => */ never;
