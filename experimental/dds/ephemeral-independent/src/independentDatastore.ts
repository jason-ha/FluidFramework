/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import type { ClientId } from "./baseTypes.js";
import type {
	ClientRecord,
	IndependentDatastoreHandle,
	ValueDirectoryOrState,
} from "./exposedInternalTypes.js";

// type IndependentDatastoreSchemaNode<
// 	TValue extends ValueDirectoryOrState<any> = ValueDirectoryOrState<unknown>,
// > = TValue extends ValueDirectoryOrState<infer T> ? ValueDirectoryOrState<Serializable<T>> : never;

/**
 * @internal
 */
export interface IndependentDatastoreSchema {
	// This type is not precise. It may
	// need to be replaced with IndependentMap schema pattern
	// similar to what is commented out.
	[key: string]: ValueDirectoryOrState<unknown>;
	// [key: string]: IndependentDatastoreSchemaNode;
}

/**
 * @internal
 */
export interface IndependentDatastore<
	TKey extends string,
	TValue extends ValueDirectoryOrState<any>,
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
	TValue extends ValueDirectoryOrState<any>,
>(datastore: IndependentDatastore<TKey, TValue>): IndependentDatastoreHandle<TKey, TValue> {
	return datastore as unknown as IndependentDatastoreHandle<TKey, TValue>;
}

/**
 * @internal
 */
export function datastoreFromHandle<TKey extends string, TValue extends ValueDirectoryOrState<any>>(
	handle: IndependentDatastoreHandle<TKey, TValue>,
): IndependentDatastore<TKey, TValue> {
	return handle as unknown as IndependentDatastore<TKey, TValue>;
}
