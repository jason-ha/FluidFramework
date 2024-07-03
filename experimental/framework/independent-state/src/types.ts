/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import type {
	IndependentValue,
	ManagerFactory,
	ValueDirectoryOrState,
} from "./exposedInternalTypes.js";

/**
 * Single entry in {@link IndependentMapSchema}.
 *
 * @beta
 */
export type IndependentMapEntry<
	TKey extends string,
	TValue extends ValueDirectoryOrState<unknown>,
	TManager = unknown,
> = ManagerFactory<TKey, TValue, TManager>;

/**
 * Schema for an {@link IndependentMap}.
 *
 * Keys of schema are the keys of the {@link IndependentMap} providing access to `Value Manager`s.
 *
 * @beta
 */
export interface IndependentMapSchema {
	// [key: string]: <T, M>(initialValue: JsonSerializable<M>) => IndependentMapEntry<IndependentValue<T>>;
	// inference gobbledegook with no basis to work
	// [key: string]: <P1 extends string, P2,R>(a: P1, b: P2) => R extends ManagerFactory<typeof Key, infer TValue, infer TManager> ? ManagerFactory<typeof Key, TValue, TManager> : never;
	// Comes super close to working, but the instantiation is not viable as factory can be invoked with arbitrary TValue and TManager.
	// [key: string]: <TKey extends typeof Key & string, TValue extends ValueDirectoryOrState<any>, TManager>(
	// 	key: TKey,
	// 	datastoreHandle: IndependentDatastoreHandle<TKey, TValue>,
	// ) => {
	// 	value: TValue;
	// 	manager: IndependentValue<TManager>;
	// };
	// Defaults don't help
	// [key: string]: <TValue extends ValueDirectoryOrState<any> = ValueDirectoryOrState<unknown>, TManager = unknown>(
	// 	key: typeof Key,
	// 	datastoreHandle: IndependentDatastoreHandle<typeof Key, TValue>,
	// ) => {
	// 	value: TValue;
	// 	manager: IndependentValue<TManager>;
	// };
	[key: string]: IndependentMapEntry<typeof key, ValueDirectoryOrState<any>>;
}

/**
 * Map of `Value Manager`s registered with {@link IndependentMap}.
 *
 * @beta
 */
export type IndependentMapEntries<TSchema extends IndependentMapSchema> = {
	/**
	 * Registered `Value Manager`s
	 */
	readonly [Key in Exclude<keyof TSchema, keyof IndependentMapMethods<TSchema>>]: ReturnType<
		TSchema[Key]
	>["manager"] extends IndependentValue<infer TManager>
		? TManager
		: never;
};

/**
 * Provides methods for managing `Value Manager`s in {@link IndependentMap}.
 *
 * @beta
 */
export interface IndependentMapMethods<TSchema extends IndependentMapSchema> {
	/**
	 * Registers a new `Value Manager` with the {@link IndependentMap}.
	 * @param key - new unique key for the `Value Manager`
	 * @param manager - factory for creating a `Value Manager`
	 */
	add<TKey extends string, TValue extends ValueDirectoryOrState<any>, TManager>(
		key: TKey,
		manager: ManagerFactory<TKey, TValue, TManager>,
	): asserts this is IndependentMap<
		TSchema & Record<TKey, ManagerFactory<TKey, TValue, TManager>>
	>;
}

/**
 * `IndependentMap` maintains a registry of `Value Manager`s that all share and provide access to
 * independent state values across client members in a session.
 *
 * `Value Manager`s offer variations on how to manage states, but all share same principle that
 * each client's state is independent and may only be updated by originating client.
 *
 * @beta
 */
export type IndependentMap<TSchema extends IndependentMapSchema> =
	IndependentMapEntries<TSchema> & IndependentMapMethods<TSchema>;
