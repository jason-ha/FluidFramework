/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import type { InternalUtilityTypes } from "@fluidframework/core-interfaces/internal";

/**
 * A form of type brand that is a templated string with an unrealistic value
 * such that narrowing from a union with it and specific types does not also
 * pickup this this case.
 *
 * @remarks
 * Use with index signature key type when there are known properties that are
 * a subset of the index and the property value type is more specific.
 *
 * @internal
 */
export type BrandedIndex<K extends string | number | bigint> =
	`${K} (__fake in string qualifier to allow distinction from specific overrides of "${K}"__)`;

/**
 * Collection of utility types for working with Object alternates.
 * @remarks
 * A namespace is used to avoid polluting the global namespace with these
 * that are not likely to appear via IntelliSense and keep export maintenance
 * low as required by api-extractor.
 *
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
	 */
	export type FlattenIntersection<T> = T extends Record<string | number | symbol, unknown>
		? {
				[K in keyof T]: T[K];
			}
		: T;

	/**
	 * Expects a type with `key` and `value` properties, and returns a tuple
	 * of the `key` and `value` types.
	 *
	 * @internal
	 */
	export type KeyValuePropertiesToPair<T> = T extends { key: unknown; value: unknown }
		? // make sure value type is something
			// Check against whole T and not T["value"] directly with `T["value"] extends never`
			// as that will separate unions into multiple pair entries.
			T extends { key: unknown; value: never }
			? never
			: [T["key"], T["value"]]
		: never;

	/**
	 * Given a record type, omit symbol keys (as Object.entries and Object.keys does).
	 *
	 * @internal
	 */
	export type PickEnumerableProperties<T> = {
		[K in keyof Required<T> as K extends symbol | undefined
			? never
			: // "K extends string ? `${K}` :" is a hack so that key results never appear as `symbol`.
				// Otherwise, keyof PickEnumerableProperties<T> will be `string | number | symbol`
				// which is not the result and may fail downstream requirements.
				// The only known downside to this hack is if K were somehow a branded string.
				K extends string
				? K
				: K]: T[K];
	};

	/**
	 * Given a record type, omit symbol keys (as Object.entries and Object.keys does).
	 *
	 * @internal
	 */
	export type ValuesOf<T> = T[keyof T];

	/**
	 * Extracts the keys of a record type that are not general/templated index keys.
	 */
	export type LiteralKeys<T> = ValuesOf<{
		[K in keyof Required<T> as InternalUtilityTypes.IfIndexKey<K, never, K>]: K;
	}>;

	/**
	 * Extracts the keys of a record type that are not general/templated index
	 * keys and returns as string (0 would become "0").
	 */
	export type LiteralKeysAsStrings<T> = ValuesOf<{
		[K in keyof Required<T> as InternalUtilityTypes.IfIndexKey<K, never, K>]: K extends number
			? `${K}`
			: K;
	}>;

	/**
	 * Given a record key, transform numerical keys to strings and omit
	 * symbol keys (as Object.entries and Object.keys does).
	 *
	 * @typeparam K - The key to be transformed.
	 * @typeparam IntersectionForRemappedKey - Optional type to be intersected
	 * with a remapped key. If the intersection result is `never`, the intersection
	 * type is ignored, which will likely produce a key that is incompatible with
	 * `T`.
	 *
	 * @internal
	 */
	export type MapNumberIndexToString<
		K extends keyof T,
		T,
		IntersectionForRemappedKey = keyof T,
	> = K extends number
		? number extends K
			? /* => number */ BrandedIndex<number> & IntersectionForRemappedKey extends never
				? BrandedIndex<number>
				: BrandedIndex<number> & IntersectionForRemappedKey
			: /* => literal number */ `${K}` & IntersectionForRemappedKey extends never
				? `${K}`
				: `${K}` & IntersectionForRemappedKey
		: K extends string
			? string extends K
				? /* => string */ BrandedIndex<string>
				: InternalUtilityTypes.IfIndexKey<
						K,
						/* => template string: test for specific required keys */ Extract<
							LiteralKeysAsStrings<T>,
							K
						> extends never
							? /* => no overlap with specific keys */ K
							: InternalUtilityTypes.IfSameType<
									T[K],
									T[Extract<LiteralKeys<T>, K>],
									/* => same type; no distinction needed */ K,
									/* => different type; brand key to distinguish */ K & BrandedIndex<K>
								>,
						/* => literal string */ K
					>
			: K extends symbol
				? never
				: K;

	/**
	 * Extracts the keys of a record type that are general/templated index keys.
	 *
	 * @privateRemarks currently unused locally
	 */
	export type IndexKeys<T> = ValuesOf<{
		// Index keys are renamed to keep generic index entries from overshadowing
		// specific keys with narrower types. Note that the rename is done to the
		// result key and not to the transformed key that will go into the property bag.
		[K in keyof Required<T> as InternalUtilityTypes.IfIndexKey<
			K,
			string extends K ? BrandedIndex<string> : `_IsIndex_${Extract<K, string | number>}`,
			never
		>]: K;
	}>;
}

/**
 * Given a type `T` that is not an array, returns an array of tuples, where
 * each tuple contains a key and its corresponding value type as would be
 * returned by Object.entries.
 *
 * @internal
 */
export type RecordKeyValuePairs<T> =
	// Only after flattening the intersection of key-value property bags,
	// convert to a tuple of key and value types.
	InternalTypedObjectUtils.KeyValuePropertiesToPair<
		InternalTypedObjectUtils.FlattenIntersection<
			InternalTypedObjectUtils.ValuesOf<{
				// Index keys are renamed to keep generic index entries from overshadowing
				// specific keys with narrower types. Note that the rename is done to the
				// result key and not to the transformed key that will go into the property bag.
				[K in keyof InternalTypedObjectUtils.PickEnumerableProperties<
					Required<T>
				> as InternalUtilityTypes.IfIndexKey<
					K,
					string extends K ? BrandedIndex<string> : `_IsIndex_${Extract<K, string | number>}`,
					K
				>]: // generate a key and value property set to allow FlattenIntersection
				// to handle `& [string, ...]` that may pollute the space.
				{
					// Numeric keys are converted to strings (`${number}` or literals like "0").
					key: InternalTypedObjectUtils.MapNumberIndexToString<K, Required<T>>;
					value: Required<T>[K];
				};
			}>
		>
	>[];

/**
 * Given a type `T`, returns an array of tuples, where each tuple contains a key
 * and its corresponding value type as would be returned by Object.entries.
 *
 * @internal
 */
export type KeyValuePairs<T> = T extends object
	? /* object => test for array */ T extends readonly (infer U)[]
		? /* test for exactly array */ U[] extends T
			? /* array */ [`${bigint}`, U][]
			: /* record with numeric key */ RecordKeyValuePairs<T>
		: /* record */ RecordKeyValuePairs<T>
	: never;

/**
 * Makes properties required (removes optional) and excludes `undefined` from value types.
 *
 * @internal
 */
export type RequiredAndNotUndefined<T> = {
	[K in keyof T]-?: Exclude<T[K], undefined>;
};

/**
 * Object.entries retyped to preserve known keys and their types.
 *
 * @remarks
 * Should this be given an object with more properties than are listed in type
 * `T`, the extra properties will be returned, but won't conform to the returned
 * types.
 *
 * In a generic context where `T` is not fully known, this typing will result in
 * an unresolved expression and won't likely be helpful in further processing.
 * In a generic context, prefer using {@link genericObjectEntries} instead.
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
 * {@link objectEntries} instead. Without `undefined` values, this typing
 * provides best handling of objects with optional properties.
 *
 * Should this be given an object with more properties than are listed in type
 * `T`, the extra properties will be returned, but won't conform to the returned
 * types.
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
 * Numeric keys become strings and will not be readily accepted as possible index
 * for `T`.
 *
 * Should this be given an object with more properties than are listed in type
 * `T`, the extra properties will be returned, but won't conform to the returned
 * types.
 *
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export const objectKeys = Object.keys as <const T extends {}>(
	o: T,
) => KeyValuePairs<T>[number][0][];

/**
 * Object.entries retyped to acknowledge that `key`s in result are `keyof T` too.
 *
 * @remarks
 * Prefer using {@link objectEntries} or {@link objectEntriesWithoutUndefined} when
 * `T` is fully known. This version is imprecise as the unresolvable aspect of a
 * generic `T` are not helpful in further processing.
 *
 * Should this be given an object with more properties than are listed in type
 * `T`, the extra properties will be returned, but won't conform to the returned
 * types.
 *
 * @internal
 */
export const genericObjectEntries = Object.entries as <
	const T extends Record<K, unknown>,
	K extends string & keyof T = string & keyof T,
>(
	o: T,
) => [K, Required<T>[keyof T]][];

/**
 * Object.keys retyped to acknowledge that `key`s in result are `keyof T`.
 *
 * @remarks
 * Prefer using {@link objectKeys} when `T` is fully known or constrained to
 * avoid numeric indixes. This version is imprecise as the unresolvable aspect of a
 * generic `T` are not helpful in further processing.
 *
 * Should this be given an object with more properties than are listed in type
 * `T`, the extra properties will be returned, but won't conform to the returned
 * types.
 *
 * @internal
 */
export const genericObjectKeys = Object.keys as <
	const T extends Record<K, unknown>,
	K extends string & keyof T = string & keyof T,
>(
	o: T,
) => K[];
