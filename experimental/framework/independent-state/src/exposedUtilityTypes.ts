/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Returns non-symbol keys for optional properties of an object type.
 *
 * @beta
 */
export type NonSymbolWithOptionalPropertyOf<T extends object> = Exclude<
	{
		[K in keyof T]: T extends Record<K, T[K]> ? never : K;
	}[keyof T],
	undefined | symbol
>;

/**
 * Returns non-symbol keys for required properties of an object type.
 *
 * @beta
 */
export type NonSymbolWithRequiredPropertyOf<T extends object> = Exclude<
	{
		[K in keyof T]: T extends Record<K, T[K]> ? K : never;
	}[keyof T],
	undefined | symbol
>;

/**
 * Returns non-symbol keys for defined, non-function properties of an object type.
 *
 * @beta
 */
export type NonSymbolWithDefinedNonFunctionPropertyOf<T extends object> = Exclude<
	{
		// eslint-disable-next-line @typescript-eslint/ban-types
		[K in keyof T]: undefined extends T[K] ? never : T[K] extends Function ? never : K;
	}[keyof T],
	undefined | symbol
>;

/**
 * Returns non-symbol keys for undefined, non-function properties of an object type.
 *
 * @beta
 */
export type NonSymbolWithUndefinedNonFunctionPropertyOf<T extends object> = Exclude<
	{
		// eslint-disable-next-line @typescript-eslint/ban-types
		[K in keyof T]: undefined extends T[K] ? (T[K] extends Function ? never : K) : never;
	}[keyof T],
	undefined | symbol
>;

/**
 * Filters a type `T` to types for undefined that is not viable in an array (or tuple) that
 * must go through JSON serialization.
 * If `T` is `undefined`, then an error literal string type is returned with hopes of being
 * informative. When result is unioned with `string`, then the error string will be eclipsed
 * by the union. In that case undefined will still not be an option, but source of the error
 * may be harder to discover.
 *
 * @beta
 */
export type JsonForArrayItem<T, TReplaced, TBlessed> =
	// Some initial filtering must be provided before a test for undefined.
	// These tests are expected to match those in JsonEncodable/JsonDecodable.
	/* test for 'any' */ boolean extends (T extends never ? true : false)
		? /* 'any' => */ TBlessed
		: /* test for 'unknown' */ unknown extends T
		? /* 'unknown' => */ TBlessed
		: /* test for Jsonable primitive types */ T extends
				| null
				| boolean
				| number
				| string
				| TReplaced
		? /* primitive types => */ T
		: /* test for undefined possibility */ undefined extends T
		? /* undefined | ... => */ "error-array-or-tuple-may-not-allow-undefined-value-consider-null"
		: TBlessed;

/**
 * Checks for a type that is simple class of number and string indexed types to numbers and strings.
 * @beta
 */
export type IsEnumLike<T extends object> = T extends readonly (infer _)[]
	? /* array => */ false
	: T extends {
			// all numerical indices should refer to a string
			readonly [i: number]: string;
			// string indices may be string or number
			readonly [p: string]: number | string;
	  }
	? /* test for a never or any property */ true extends {
			[K in keyof T]: T[K] extends never ? true : never;
	  }[keyof T]
		? false
		: true
	: false;

/**
 * Checks for that type is exactly `object`.
 * @beta
 */
export type IsExactlyObject<T extends object> =
	/* test for more than type with all optional properties */ object extends Required<T>
		? /* test for `{}` */ false extends T
			? /* `{}` => */ false
			: /* `object` => */ true
		: /* optional or required properties => */ false;

/**
 * Recursively/deeply makes all properties of a type readonly.
 *
 * @beta
 */
export type FullyReadonly<T> = {
	readonly [K in keyof T]: FullyReadonly<T[K]>;
};