/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

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
export type NonSymbolWithOptionalPropertyOf<T extends object> = Exclude<
	{
		[K in keyof T]: T extends Record<K, T[K]> ? never : K;
	}[keyof T],
	undefined | symbol
>;
