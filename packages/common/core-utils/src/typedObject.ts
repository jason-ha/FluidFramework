/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import type { InternalUtilityTypes } from "@fluidframework/core-interfaces/internal";

/**
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace InternalTypedObjectUtils {
	/**
	 * Creates a simple object type from an intersection of multiple.
	 *
	 * @privateRemarks
	 * `T extends Record` within the implementation encourages tsc to process
	 * intersections within unions.
	 *
	 * @internal
	 * @system
	 */
	export type FlattenIntersection<T> = T extends Record<string | number | symbol, unknown>
		? {
				[K in keyof T]: T[K];
			}
		: T;

	/**
	 * Expects a type with `key` and `value` properties, and returns a tuple
	 * of the key and value types.
	 *
	 * @internal
	 * @system
	 */
	export type KeyValuePropertiesToPair<T> = T extends { key: unknown; value: unknown }
		? // make sure value type is something
			// Check against whole T and not T["value"] directly with `T["value"] extends never`
			// as that will separate unions into multiple pair entries.
			T extends { key: unknown; value: never }
			? never
			: [T["key"], T["value"]]
		: never;
}

/**
 * Given a key type (keyof Foo), transform numerical keys to strings (as
 * Object.entries and Object.keys does). When PrefixForIndexKey is given,
 * an indexed key will also pick up the prefix.
 *
 * @typeparam T - The key to be transformed.
 * @typeparam PrefixForIndexKey - Optional prefix to be added to the key when
 * it appears to be an index key (not a literal).
 * @typeparam IntersectionForRemappedKey - Optional type to be intersected
 * with a remapped key. If the intersection result is `never`, the intersection
 * type is ignored, which will likely produce a key that is incompatible with
 * `T`.
 *
 * @internal
 * @system
 */
export type MapNumberIndicesToStrings<
	T,
	PrefixForIndexKey extends string | number | bigint = "",
	IntersectionForRemappedKey = unknown,
> = {
	[K in keyof T as K extends number
		? number extends K
			? `${PrefixForIndexKey}${K}` & IntersectionForRemappedKey
			: never extends `${K}` & IntersectionForRemappedKey
				? `${K}`
				: `${K}` & IntersectionForRemappedKey
		: K extends string
			? "" extends PrefixForIndexKey
				? K
				: InternalUtilityTypes.IfIndexKey<
						K,
						`${PrefixForIndexKey}${K}` & IntersectionForRemappedKey,
						K
					>
			: K extends symbol
				? never
				: K]: T[K];
};

/**
 * Given a type `T`, returns an array of tuples, where each tuple
 * contains a key and its corresponding value type.
 *
 * @internal
 */
export type KeyValuePairs<T> =
	// Only after flattening the intersection of key-value property bags,
	// convert to a tuple of key and value types.
	InternalTypedObjectUtils.KeyValuePropertiesToPair<
		InternalTypedObjectUtils.FlattenIntersection<
			{
				// Numeric keys are converted to strings (`${number}` or literals like "0").
				// Index keys are renamed to keep generic index entries from overshadowing
				// specific keys with narrower types. Note that the rename is done to the
				// result key and not to the transformed key that will go into the property bag.
				[K in keyof MapNumberIndicesToStrings<Required<T>> as InternalUtilityTypes.IfIndexKey<
					K,
					`_IsIndex_${K}`,
					K
				>]: // generate a key and value property set to allow FlattenIntersection
				// handle `& [string, ...]` that may pollute the space.
				{ key: K & keyof T; value: Required<T>[K] };
				// keyof must match `as` prefix above and is given directly to transform helper.
			}[keyof MapNumberIndicesToStrings<Required<T>, "_IsIndex_">]
		>
	>[];

/**
 * Makes properties required (removes optional) and excludes `undefined` from value types.
 *
 * @internal
 * @system
 */
export type RequiredAndNotUndefined<T> = {
	[K in keyof T]-?: Exclude<T[K], undefined>;
};

/**
 * Object.entries retyped to preserve known keys and their types.
 *
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export const objectEntries = Object.entries as <const T extends {}>(o: T) => KeyValuePairs<T>;

/**
 * Object.entries retyped to preserve known keys and their types.
 *
 * @remarks
 * Given `T` should not contain `undefined` values. If it does, use
 * {@link objectEntries} instead. Without `undefined` values, this
 * typing provides best handling of objects with optional properties.
 *
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export const objectEntriesWithoutUndefined = Object.entries as <const T extends {}>(
	o: T,
) => KeyValuePairs<RequiredAndNotUndefined<T>>;

/**
 * Object.keys retyped to preserve known keys (when possible).
 *
 * @remarks
 * Numeric keys become strings and will not be readily accepted as
 * possible index for `T`.
 *
 * @internal
 */
export const objectKeys = Object.keys as <const T extends object>(
	o: T,
) => (keyof (T extends readonly (infer U)[]
	? { [K in `${bigint}`]: U }
	: MapNumberIndicesToStrings<T, "", keyof T>))[];

/**
 * Object.entries retyped to acknowledge that `key`s in result are `keyof T` too.
 *
 * @remarks
 * Prefer using {@link objectEntries} or {@link objectEntriesWithoutUndefined} when
 * `T` is fully known. This version is imprecise as the unresolvable aspect of a
 * generic `T` are not helpful in further processing.
 *
 * @internal
 */
export const genericObjectEntries = Object.entries as <
	const T extends Record<K, unknown>,
	K extends string & keyof T = string & keyof T,
>(
	o: T,
) => [K, Required<T>[keyof T]][];
