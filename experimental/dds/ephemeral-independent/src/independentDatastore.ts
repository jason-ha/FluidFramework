/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import type { ValueElement } from "./internalTypes.js";
import type { ClientId, IndependentDatastoreHandle, RoundTrippable } from "./types.js";

// type IndependentDatastoreSchemaNode<
// 	TValue = unknown,
// 	TSerialized extends Serializable<TValue> = Serializable<TValue>,
// > = TSerialized extends Serializable<TValue> ? TValue : never;

/**
 * @internal
 */
export interface IndependentDatastoreSchema {
	// This type is very odd. It may not be doing much and may
	// need to be replaced with IndependentMap schema pattern
	// similar to what is commented out.
	// For now, it seems to work.
	[Key: string]: ReturnType<<TValue>() => TValue>;
	// [Key: string]: IndependentDatastoreSchemaNode;
}

/**
 * @internal
 */
export interface IndependentDatastore<
	TSchema extends IndependentDatastoreSchema,
	TKey extends keyof TSchema & string = keyof TSchema & string,
> {
	localUpdate(key: TKey, forceBroadcast: boolean): void;
	update(
		key: TKey,
		clientId: ClientId,
		rev: number,
		timestamp: number,
		value: RoundTrippable<TSchema[TKey]>,
	): void;
	knownValues(key: TKey): {
		self: ClientId | undefined;
		states: ValueElement<TSchema[TKey]>;
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
	TValue,
>(datastore: IndependentDatastore<any, TKey>): IndependentDatastoreHandle<TKey, TValue> {
	return datastore as unknown as IndependentDatastoreHandle<TKey, TValue>;
}

/**
 * @internal
 */
export function datastoreFromHandle<TKey extends string, TValue>(
	handle: IndependentDatastoreHandle<TKey, TValue>,
): IndependentDatastore<Record<TKey, TValue>> {
	return handle as unknown as IndependentDatastore<Record<TKey, TValue>>;
}
