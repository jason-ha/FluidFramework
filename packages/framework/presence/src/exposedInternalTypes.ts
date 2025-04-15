/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import type {
	JsonDeserialized,
	JsonSerializable,
} from "@fluidframework/core-interfaces/internal/exposedUtilityTypes";

/**
 * Collection of value types that are not intended to be used/imported
 * directly outside of this package.
 *
 * @alpha
 * @system
 */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace InternalTypes {
	/**
	 * @system
	 */
	export interface ValueStateMetadata {
		rev: number;
		timestamp: number;
	}

	/**
	 * @system
	 */
	export interface IValueOptionalState<TValue> extends ValueStateMetadata {
		value?: JsonDeserialized<TValue>;
	}

	/**
	 * @system
	 */
	export interface IValueRequiredState<TValue> extends ValueStateMetadata {
		value: JsonDeserialized<TValue>;
	}

	/**
	 * @system
	 */
	export interface IValueDirectory<T> {
		rev: number;
		items: {
			// Caution: any particular item may or may not exist
			// Typescript does not support absent keys without forcing type to also be undefined.
			// See https://github.com/microsoft/TypeScript/issues/42810.
			[name: string | number]: IValueOptionalState<T> | IValueDirectory<T>;
		};
	}

	/**
	 * @system
	 */
	export type IValueDirectoryOrState<T> = IValueRequiredState<T> | IValueDirectory<T>;

	/**
	 * @system
	 */
	export interface MapValueState<T, Keys extends string | number> {
		rev: number;
		items: {
			// Caution: any particular item may or may not exist
			// Typescript does not support absent keys without forcing type to also be undefined.
			// See https://github.com/microsoft/TypeScript/issues/42810.
			[name in Keys]: IValueOptionalState<T>;
		};
	}

	/**
	 * @system
	 */
	export declare class StateDatastoreHandle<TKey, TValue extends IValueDirectoryOrState<any>> {
		private readonly StateDatastoreHandle: StateDatastoreHandle<TKey, TValue>;
	}

	/**
	 * Brand to ensure state values internal type safety without revealing
	 * internals that are subject to change.
	 *
	 * @system
	 */
	export declare class StateValueBrand<T> {
		private readonly StateValue: StateValue<T>;
	}

	/**
	 * This type provides no additional functionality over the type it wraps.
	 * It is used to ensure type safety within package.
	 * Users may find it convenient to just use the type it wraps directly.
	 *
	 * @privateRemarks
	 * Checkout filtering omitting unknown from T (`Omit<T,unknown> &`).
	 *
	 * @system
	 */
	export type StateValue<T> = T & StateValueBrand<T>;

	/**
	 * Package internal function declaration for value manager instantiation.
	 *
	 * @system
	 */
	export type ManagerFactory<
		TKey extends string,
		TValue extends IValueDirectoryOrState<any>,
		TManager,
	> = { instanceBase: new (...args: any[]) => any } & ((
		key: TKey,
		datastoreHandle: StateDatastoreHandle<TKey, TValue>,
	) => {
		initialData?: { value: TValue; allowableUpdateLatencyMs: number | undefined };
		manager: StateValue<TManager>;
	});

	/**
	 * @system
	 */
	export interface NotificationType {
		name: string;
		args: (JsonSerializable<unknown> & JsonDeserialized<unknown>)[];
	}
}
