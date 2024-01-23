/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import type { RoundTrippable } from "./baseTypes.js";

/**
 * @beta
 */
export interface ValueState<TValue> {
	rev: number;
	timestamp: number;
	value: RoundTrippable<TValue>;
}

/**
 * @beta
 */
export interface ValueDirectory<T> {
	rev: number;
	items: {
		// Caution: any particular item may or may not exist
		// Typescript does not support absent keys without forcing type to also be undefined.
		// See https://github.com/microsoft/TypeScript/issues/42810.
		[name: string | number]: ValueDirectoryOrState<T>;
	};
}

/**
 * @beta
 */
export type ValueDirectoryOrState<T> = ValueState<T> | ValueDirectory<T>;

/**
 * @beta
 */
export declare class IndependentDatastoreHandle<TKey, TValue extends ValueDirectoryOrState<any>> {
	private readonly IndependentDatastoreHandle: IndependentDatastoreHandle<TKey, TValue>;
}

/**
 * Brand to ensure independent values internal type safety without revealing
 * internals that are subject to change.
 *
 * @beta
 */
export declare class IndependentValueBrand<T> {
	private readonly IndependentValue: IndependentValue<T>;
}

/**
 * This type provides no additional functionality over the type it wraps.
 * It is used to ensure type safety within package.
 * Users may find it convenient to just use the type it wraps directly.
 *
 * @privateRemarks
 * Checkout filtering omitting unknown from T (`Omit<T,unknown> &`).
 *
 * @beta
 */
export type IndependentValue<T> = T & IndependentValueBrand<T>;

/**
 * Package internal function declaration for value manager instantiation.
 * @beta
 */
export type ManagerFactory<
	TKey extends string,
	TValue extends ValueDirectoryOrState<any>,
	TManager,
> = (
	key: TKey,
	datastoreHandle: IndependentDatastoreHandle<TKey, TValue>,
) => {
	value: TValue;
	manager: IndependentValue<TManager>;
};
