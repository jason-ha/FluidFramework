/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * @beta
 */
export type NonSymbolWithOptionalPropertyOf<T extends object> = Exclude<
	{
		[K in keyof T]: T extends Record<K, T[K]> ? never : K;
	}[keyof T],
	undefined | symbol
>;

/**
 * @beta
 */
export type NonSymbolWithRequiredPropertyOf<T extends object> = Exclude<
	{
		[K in keyof T]: T extends Record<K, T[K]> ? K : never;
	}[keyof T],
	undefined | symbol
>;

/**
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
 * @beta
 */
export type FullyReadonly<T> = {
	readonly [K in keyof T]: FullyReadonly<T[K]>;
};
