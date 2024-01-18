/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import type { Serializable } from "@fluidframework/datastore-definitions";

/**
 * @alpha
 */
export type ClientId = string;

/**
 * @alpha
 */
// TODO: RoundTrippable needs revised to be the consistent pre and post serialization
//       and get a better name.
export type RoundTrippable<T> = Serializable<T>;

/**
 * Brand to ensure independent values internal type safety without revealing
 * internals that are subject to change.
 *
 * @alpha
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
 * @alpha
 */
export type IndependentValue<T> = T & IndependentValueBrand<T>;

/**
 * @alpha
 */
export declare class IndependentDatastoreHandle<TKey, TValue> {
	private readonly IndependentDatastoreHandle: IndependentDatastoreHandle<TKey, TValue>;
}

/**
 * Package internal function declaration for value manager instantiation.
 * @alpha
 */
export type ManagerFactory<TKey extends string, TValue, TManager> = (
	key: TKey,
	datastoreHandle: IndependentDatastoreHandle<TKey, TValue>,
) => {
	value: RoundTrippable<TValue>;
	manager: IndependentValue<TManager>;
};

/**
 * @alpha
 */
export type IndependentMapEntry<
	TKey extends string,
	TValue = RoundTrippable<unknown>,
	TManager = unknown,
> = ManagerFactory<TKey, TValue, TManager>;

/**
 * @alpha
 */
export interface IndependentMapSchema {
	// [Key: string]: <T, M>(initialValue: Serializable<M>) => IndependentMapEntry<IndependentValue<T>>;
	// inference gobbledegook with no basis to work
	// [Key: string]: <P1 extends string, P2,R>(a: P1, b: P2) => R extends ManagerFactory<typeof Key, infer TValue, infer TManager> ? ManagerFactory<typeof Key, TValue, TManager> : never;
	// Comes super close to working, but the instantiation is not viable as factory can be invoked with arbitrary TValue and TManager.
	// [Key: string]: <TKey extends typeof Key & string, TValue, TManager>(
	// 	key: TKey,
	// 	datastoreHandle: IndependentDatastoreHandle<TKey, TValue>,
	// ) => {
	// 	value: RoundTrippable<TValue>;
	// 	manager: IndependentValue<TManager>;
	// };
	// Defaults don't help
	// [Key: string]: <TValue = unknown, TManager = unknown>(
	// 	key: typeof Key,
	// 	datastoreHandle: IndependentDatastoreHandle<typeof Key, TValue>,
	// ) => {
	// 	value: RoundTrippable<TValue>;
	// 	manager: IndependentValue<TManager>;
	// };
	[Key: string]: IndependentMapEntry<typeof Key>;
}

/**
 * @alpha
 */
export type IndependentMapKeys<TSchema extends IndependentMapSchema> = {
	readonly [Key in Exclude<keyof TSchema, keyof IndependentMapMethods<TSchema>>]: ReturnType<
		TSchema[Key]
	>["manager"];
};

/**
 * @alpha
 */
export interface IndependentMapMethods<TSchema extends IndependentMapSchema> {
	add<TKey extends string, TValue, TManager>(
		key: TKey,
		manager: ManagerFactory<TKey, TValue, TManager>,
	): asserts this is IndependentMap<
		TSchema & Record<TKey, ManagerFactory<TKey, TValue, TManager>>
	>;
}

/**
 * @alpha
 */
export type IndependentMap<TSchema extends IndependentMapSchema> = IndependentMapKeys<TSchema> &
	IndependentMapMethods<TSchema>;
