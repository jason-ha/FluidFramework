/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import { IndependentValue, ManagerFactory, ValueStateDirectory } from "./exposedInternalTypes.js";

/**
 * @alpha
 */
export type IndependentMapEntry<
	TKey extends string,
	TValue extends ValueStateDirectory<any>,
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
	// [Key: string]: <TKey extends typeof Key & string, TValue extends ValueStateDirectory<any>, TManager>(
	// 	key: TKey,
	// 	datastoreHandle: IndependentDatastoreHandle<TKey, TValue>,
	// ) => {
	// 	value: TValue;
	// 	manager: IndependentValue<TManager>;
	// };
	// Defaults don't help
	// [Key: string]: <TValue extends ValueStateDirectory<any> = ValueStateDirectory<unknown>, TManager = unknown>(
	// 	key: typeof Key,
	// 	datastoreHandle: IndependentDatastoreHandle<typeof Key, TValue>,
	// ) => {
	// 	value: TValue;
	// 	manager: IndependentValue<TManager>;
	// };
	[Key: string]: IndependentMapEntry<typeof Key, ValueStateDirectory<any>>;
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
	add<TKey extends string, TValue extends ValueStateDirectory<any>, TManager>(
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
