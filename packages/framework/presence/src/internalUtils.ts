/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import type { DeepReadonly } from "@fluidframework/core-interfaces/internal";

/**
 * Returns union of types of values in a record.
 */
export type RecordEntryTypes<T> = T[keyof T];

// TODO: use objectEntries from core-utils

type MapNumberIndicesToStrings<T> = {
	[K in keyof T as K extends number ? `${K}` : K]: T[K];
};

type KeyValuePairs<T> = {
	[K in keyof MapNumberIndicesToStrings<Required<T>>]: [K, Required<T>[K]];
}[keyof MapNumberIndicesToStrings<Required<T>>][];

/**
 * Object.entries retyped to preserve known keys and their types.
 *
 * @internal
 */
export const objectEntries = Object.entries as <T>(o: T) => KeyValuePairs<T>;

/**
 * Retrieve a value from a record with the given key, or create a new entry if
 * the key is not in the record.
 *
 * @param record - The record to index/update
 * @param key - The key to lookup in the record
 * @param defaultValue - a function which returns a default value. This is
 * called and used to set an initial value for the given key in the record if
 * none exists.
 * @returns either the existing value for the given key, or the newly-created
 * value (the result of `defaultValue`)
 */
export function getOrCreateRecord<K extends string | number | symbol, V>(
	record: Record<K, V>,
	key: K,
	defaultValue: (key: K) => V,
): V {
	if (!(key in record)) {
		record[key] = defaultValue(key);
	}
	return record[key];
}

/**
 * Do nothing helper to apply deep immutability to a value's type.
 */
export function asDeeplyReadonly<T>(value: T): DeepReadonly<T> {
	return value as DeepReadonly<T>;
}
