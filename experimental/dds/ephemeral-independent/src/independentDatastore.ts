/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import type { ClientId } from "./baseTypes.js";
import type { IndependentDatastoreHandle, ValueStateDirectory } from "./exposedInternalTypes.js";
import type { ClientRecord } from "./internalTypes.js";

// type IndependentDatastoreSchemaNode<
// 	TValue extends ValueStateDirectory<any> = ValueStateDirectory<unknown>,
// > = TValue extends ValueStateDirectory<infer T> ? ValueStateDirectory<Serializable<T>> : never;

/**
 * @internal
 */
export interface IndependentDatastoreSchema {
	// This type is not precise. It may
	// need to be replaced with IndependentMap schema pattern
	// similar to what is commented out.
	[Key: string]: ValueStateDirectory<unknown>;
	// [Key: string]: IndependentDatastoreSchemaNode;
}

/**
 * @internal
 */
export interface IndependentDatastore<
	TKey extends string,
	TValue extends ValueStateDirectory<any>,
> {
	localUpdate(key: TKey, value: TValue, forceBroadcast: boolean): void;
	update(key: TKey, clientId: ClientId, value: TValue): void;
	knownValues(key: TKey): {
		self: ClientId | undefined;
		states: ClientRecord<TValue>;
	};
}

/**
 * @internal
 */
export function handleFromDatastore<
	// Constraining TSchema would be great, but it seems nested types (at least with undefined) cause trouble.
	// TSchema as `any` still provides some type safety.
	// TSchema extends IndependentDatastoreSchema,
	TKey extends string /* & keyof TSchema */,
	TValue extends ValueStateDirectory<any>,
>(datastore: IndependentDatastore<TKey, TValue>): IndependentDatastoreHandle<TKey, TValue> {
	return datastore as unknown as IndependentDatastoreHandle<TKey, TValue>;
}

/**
 * @internal
 */
export function datastoreFromHandle<TKey extends string, TValue extends ValueStateDirectory<any>>(
	handle: IndependentDatastoreHandle<TKey, TValue>,
): IndependentDatastore<TKey, TValue> {
	return handle as unknown as IndependentDatastore<TKey, TValue>;
}
