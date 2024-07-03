/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import type { ClientId } from "./baseTypes.js";
import type { InternalTypes } from "./exposedInternalTypes.js";
import type { ClientRecord } from "./internalTypes.js";

// type IndependentDatastoreSchemaNode<
// 	TValue extends InternalTypes.ValueDirectoryOrState<any> = InternalTypes.ValueDirectoryOrState<unknown>,
// > = TValue extends InternalTypes.ValueDirectoryOrState<infer T> ? InternalTypes.ValueDirectoryOrState<T> : never;

/**
 * @internal
 */
export interface IndependentDatastoreSchema {
	// This type is not precise. It may
	// need to be replaced with IndependentMap schema pattern
	// similar to what is commented out.
	[key: string]: InternalTypes.ValueDirectoryOrState<unknown>;
	// [key: string]: IndependentDatastoreSchemaNode;
}

/**
 * @internal
 */
export interface IndependentDatastore<
	TKey extends string,
	TValue extends InternalTypes.ValueDirectoryOrState<any>,
> {
	localUpdate(key: TKey, value: TValue, forceBroadcast: boolean): void;
	update(key: TKey, clientId: ClientId, value: TValue): void;
	knownValues(key: TKey): {
		self: ClientId | undefined;
		states: ClientRecord<TValue>;
	};
}

/**
 * Helper to get a handle from a datastore.
 *
 * @internal
 */
export function handleFromDatastore<
	// Constraining TSchema would be great, but it seems nested types (at least with undefined) cause trouble.
	// TSchema as `unknown` still provides some type safety.
	// TSchema extends IndependentDatastoreSchema,
	TKey extends string /* & keyof TSchema */,
	TValue extends InternalTypes.ValueDirectoryOrState<unknown>,
>(
	datastore: IndependentDatastore<TKey, TValue>,
): InternalTypes.IndependentDatastoreHandle<TKey, TValue> {
	return datastore as unknown as InternalTypes.IndependentDatastoreHandle<TKey, TValue>;
}

/**
 * Helper to get the datastore back from its handle.
 *
 * @internal
 */
export function datastoreFromHandle<
	TKey extends string,
	TValue extends InternalTypes.ValueDirectoryOrState<any>,
>(
	handle: InternalTypes.IndependentDatastoreHandle<TKey, TValue>,
): IndependentDatastore<TKey, TValue> {
	return handle as unknown as IndependentDatastore<TKey, TValue>;
}
