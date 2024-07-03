/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import type {
	JsonDeserialized,
	JsonSerializable,
} from "@fluidframework/core-interfaces/internal";

/**
 * Collection of value types that are not intended to be used/imported
 * directly outside of this package.
 *
 * @beta
 * @system
 */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace InternalTypes {
	/**
	 * @beta
	 * @system
	 */
	export interface ValueStateMetadata {
		rev: number;
		timestamp: number;
	}

	/**
	 * @beta
	 * @system
	 */
	export interface ValueOptionalState<TValue> extends ValueStateMetadata {
		value?: JsonDeserialized<TValue>;
	}

	/**
	 * @beta
	 * @system
	 */
	export interface ValueRequiredState<TValue> extends ValueStateMetadata {
		value: JsonDeserialized<TValue>;
	}

	/**
	 * @beta
	 * @system
	 */
	export interface ValueDirectory<T> {
		rev: number;
		items: {
			// Caution: any particular item may or may not exist
			// Typescript does not support absent keys without forcing type to also be undefined.
			// See https://github.com/microsoft/TypeScript/issues/42810.
			[name: string | number]: ValueOptionalState<T> | ValueDirectory<T>;
		};
	}

	/**
	 * @beta
	 * @system
	 */
	export type ValueDirectoryOrState<T> = ValueRequiredState<T> | ValueDirectory<T>;

	/**
	 * @beta
	 * @system
	 */
	export declare class IndependentDatastoreHandle<
		TKey,
		TValue extends ValueDirectoryOrState<any>,
	> {
		private readonly IndependentDatastoreHandle: IndependentDatastoreHandle<TKey, TValue>;
	}

	/**
	 * Brand to ensure independent values internal type safety without revealing
	 * internals that are subject to change.
	 *
	 * @beta
	 * @system
	 */
	export declare class IndependentValueBrand<T> {
		private readonly IndependentValue: IndependentValue<T>;
	}

	/**
	 * This type provides no additional functionality over the type it wraps.
	 * It is used to ensure type safety within package.
	 * Users may find it convenient to just use the type it wraps directly.
	 *
	 * @privateRemarks
	 * Checkout filtering omitting unknown from T (`Omit<T,unknown> &`).
	 *
	 * @beta
	 * @system
	 */
	export type IndependentValue<T> = T & IndependentValueBrand<T>;

	/**
	 * Package internal function declaration for value manager instantiation.
	 *
	 * @beta
	 * @system
	 */
	export type ManagerFactory<
		TKey extends string,
		TValue extends ValueDirectoryOrState<any>,
		TManager,
	> = (
		key: TKey,
		datastoreHandle: IndependentDatastoreHandle<TKey, TValue>,
	) => {
		value: TValue;
		manager: IndependentValue<TManager>;
	};

	/**
	 * @beta
	 * @system
	 */
	export interface NotificationType {
		name: string;
		args: (JsonSerializable<unknown> & JsonDeserialized<unknown>)[];
	}
}
