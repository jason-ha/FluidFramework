/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import { IndependentValue, ManagerFactory, ValueDirectoryOrState } from "./exposedInternalTypes.js";

/**
 * @alpha
 */
export type IndependentMapEntry<
	TKey extends string,
	TValue extends ValueDirectoryOrState<any>,
	TManager = unknown,
> = ManagerFactory<TKey, TValue, TManager>;

/**
 * @alpha
 */
export interface IndependentMapSchema {
	// [key: string]: <T, M>(initialValue: Serializable<M>) => IndependentMapEntry<IndependentValue<T>>;
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
 * @alpha
 */
export type IndependentMapEntries<TSchema extends IndependentMapSchema> = {
	readonly [Key in Exclude<keyof TSchema, keyof IndependentMapMethods<TSchema>>]: ReturnType<
		TSchema[Key]
	>["manager"] extends IndependentValue<infer TManager>
		? TManager
		: never;
};

/**
 * @alpha
 */
export interface IndependentMapMethods<TSchema extends IndependentMapSchema> {
	add<TKey extends string, TValue extends ValueDirectoryOrState<any>, TManager>(
		key: TKey,
		manager: ManagerFactory<TKey, TValue, TManager>,
	): asserts this is IndependentMap<
		TSchema & Record<TKey, ManagerFactory<TKey, TValue, TManager>>
	>;
}

/**
 * @alpha
 */
export type IndependentMap<TSchema extends IndependentMapSchema> = IndependentMapEntries<TSchema> &
	IndependentMapMethods<TSchema>;
