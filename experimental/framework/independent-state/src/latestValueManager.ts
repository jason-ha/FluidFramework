/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import { TypedEventEmitter } from "@fluid-internal/client-utils";
import type { IEvent, IEventProvider } from "@fluidframework/core-interfaces";

import type { ClientId } from "./baseTypes.js";
import type {
	IndependentDatastoreHandle,
	ManagerFactory,
	ValueState,
} from "./exposedInternalTypes.js";
import type { FullyReadonly } from "./exposedUtilityTypes.js";
import { datastoreFromHandle, type IndependentDatastore } from "./independentDatastore.js";
import { brandIVM } from "./independentValue.js";
import type { ValueManager } from "./internalTypes.js";
import type { JsonDeserialized } from "./jsonDeserialized.js";
import type { JsonEncodable } from "./jsonEncodable.js";
import type { LatestValueClientData, LatestValueMetadata } from "./latestValueTypes.js";

/**
 * @beta
 */
export interface LatestMapValueData<T> {
	items: {
		[name: string | number]: {
			value: FullyReadonly<JsonDeserialized<T>>;
			metadata: LatestValueMetadata;
		};
	};
}

/**
 * @beta
 */
export interface LatestMapValueClientData<T> extends LatestMapValueData<T> {
	clientId: ClientId;
}

/**
 * @beta
 */
export interface LatestMapValueManagerEvents<T, K extends string | number> extends IEvent {
	/**
	 * Raised when any item's value for remote client is updated.
	 * @param update - Map of one or more values updated.
	 *
	 * @eventProperty
	 */
	(event: "update", listener: (update: LatestMapValueClientData<T>) => void): void;

	/**
	 * Raised when specific item's value is updated.
	 * @param key - Key of updated value.
	 * @param updateItem - Updated value.
	 *
	 * @eventProperty
	 */
	(event: "itemUpdate", listener: (key: K, updateItem: LatestValueClientData<T>) => void): void;
}

/**
 * @beta
 */
export interface ValueMap<K extends string | number, V> {
	/**
	 * ${@link delete}s all elements in the ValueMap.
	 */
	clear(): void;
	/**
	 * @returns true if an element in the ValueMap existed and has been removed, or false if the element does not exist.
	 */
	delete(key: K): boolean;
	/**
	 * Executes a provided function once per each key/value pair in the ValueMap, in arbitrary order.
	 */
	forEach(
		callbackfn: (
			value: FullyReadonly<JsonDeserialized<V>>,
			key: K,
			map: ValueMap<K, V>,
		) => void,
		thisArg?: any,
	): void;
	/**
	 * Returns a specified element from the ValueMap object.
	 * @returns Returns the element associated with the specified key. If no element is associated with the specified key, undefined is returned.
	 */
	get(key: K): FullyReadonly<JsonDeserialized<V>> | undefined;
	/**
	 * @returns boolean indicating whether an element with the specified key exists or not.
	 */
	has(key: K): boolean;
	/**
	 * Adds a new element with a specified key and value to the ValueMap. If an element with the same key already exists, the element will be updated.
	 */
	set(key: K, value: JsonEncodable<V> & JsonDeserialized<V>): this;
	/**
	 * @returns the number of elements in the ValueMap.
	 */
	readonly size: number;
}

export interface MapValueState<T> {
	rev: number;
	items: {
		// Caution: any particular item may or may not exist
		// Typescript does not support absent keys without forcing type to also be undefined.
		// See https://github.com/microsoft/TypeScript/issues/42810.
		[name: string | number]: ValueState<T>;
	};
}

class ValueMapImpl<T, K extends string | number> implements ValueMap<K, T> {
	constructor(private readonly value: MapValueState<T>) {
		this.size = Object.keys(value.items).length;
	}

	clear(): void {
		throw new Error("Method not implemented.");
	}
	delete(key: string | number): boolean {
		throw new Error("Method not implemented.");
	}
	forEach(
		callbackfn: (
			value: FullyReadonly<JsonDeserialized<T>>,
			key: K,
			map: ValueMap<K, T>,
		) => void,
		thisArg?: any,
	): void {
		throw new Error("Method not implemented.");
	}
	get(key: string | number): FullyReadonly<JsonDeserialized<T>> | undefined {
		throw new Error("Method not implemented.");
	}
	has(key: string | number): boolean {
		throw new Error("Method not implemented.");
	}
	set(key: string | number, value: JsonEncodable<T> & JsonDeserialized<T>): this {
		throw new Error("Method not implemented.");
	}
	readonly size: number;
	entries(): IterableIterator<[string | number, FullyReadonly<JsonDeserialized<T>>]> {
		throw new Error("Method not implemented.");
	}
	keys(): IterableIterator<string | number> {
		throw new Error("Method not implemented.");
	}
	values(): IterableIterator<FullyReadonly<JsonDeserialized<T>>> {
		throw new Error("Method not implemented.");
	}
	[Symbol.iterator](): IterableIterator<[string | number, FullyReadonly<JsonDeserialized<T>>]> {
		throw new Error("Method not implemented.");
	}
}

/**
 * @beta
 */
export interface LatestMapValueManager<T, K extends string | number = string | number>
	extends IEventProvider<LatestMapValueManagerEvents<T, K>> {
	readonly local: ValueMap<K, T>;
	clientValues(): IterableIterator<LatestMapValueClientData<T>>;
	clients(): ClientId[];
	clientValue(clientId: ClientId): LatestMapValueData<T>;
}

class LatestMapValueManagerImpl<
		T,
		RegistrationKey extends string,
		Keys extends string | number = string | number,
	>
	extends TypedEventEmitter<LatestMapValueManagerEvents<T, Keys>>
	implements LatestMapValueManager<T, Keys>, ValueManager<T, MapValueState<T>>
{
	public constructor(
		private readonly key: RegistrationKey,
		private readonly datastore: IndependentDatastore<RegistrationKey, MapValueState<T>>,
		public readonly value: MapValueState<T>,
	) {
		super();
		this.local = new ValueMapImpl<T, Keys>(value);
	}

	public local: ValueMap<Keys, T>;

	clientValues(): IterableIterator<LatestMapValueClientData<T>> {
		throw new Error("Method not implemented.");
	}

	clients(): ClientId[] {
		const allKnownStates = this.datastore.knownValues(this.key);
		return Object.keys(allKnownStates.states).filter(
			(clientId) => clientId !== allKnownStates.self,
		);
	}

	clientValue(clientId: ClientId): LatestMapValueData<T> {
		const allKnownStates = this.datastore.knownValues(this.key);
		if (!(clientId in allKnownStates.states)) {
			throw new Error("No entry for clientId");
		}
		const clientStateMap = allKnownStates.states[clientId];
		const items: LatestMapValueData<T>["items"] = {};
		Object.entries(clientStateMap.items).forEach(([key, item]) => {
			const value = item.value;
			if (value !== undefined) {
				items[key] = {
					value,
					metadata: { revision: item.rev, timestamp: item.timestamp },
				};
			}
		});
		return { items };
	}

	update(clientId: string, _received: number, value: MapValueState<T>): void {
		const allKnownStates = this.datastore.knownValues(this.key);
		const updatedItemKeys: string[] = [];
		if (clientId in allKnownStates.states) {
			const currentState = allKnownStates.states[clientId];
			Object.entries(value.items).forEach(([key, item]) => {
				if (key in currentState.items) {
					const currentItem = currentState.items[key];
					if (currentItem.rev < item.rev) {
						// TODO - move this later based on updatedItemKeys
						this.emit("itemUpdate", key, {
							clientId,
							value: item.value,
							metadata: { revision: item.rev, timestamp: item.timestamp },
						});
						updatedItemKeys.push(key as Keys & string);
					}
				}
			});
			// TODO - here and below
			if (currentState.rev >= value.rev) {
				return;
			}
		}
		this.datastore.update(this.key, clientId, value);
		this.emit("update", {
			clientId,
			value: value.value,
			metadata: { revision: value.rev, timestamp: value.timestamp },
		});
	}
}

/**
 * @beta
 */
export function LatestMap<
	T extends object,
	RegistrationKey extends string,
	Keys extends string | number = string | number,
>(
	initialValues: JsonEncodable<T> & JsonDeserialized<T> & object,
): ManagerFactory<RegistrationKey, MapValueState<T>, LatestMapValueManager<T, Keys>> {
	// LatestMapValueManager takes ownership of values within initialValues but makes a shallow
	// copy for basic protection.
	const value: MapValueState<T> = { rev: 0, items: {} }; // timestamp: Date.now(), value: { ...initialValue } };
	return (
		key: RegistrationKey,
		datastoreHandle: IndependentDatastoreHandle<RegistrationKey, MapValueState<T>>,
	) => ({
		value,
		manager: brandIVM<LatestMapValueManagerImpl<T, RegistrationKey>, T, MapValueState<T>>(
			new LatestMapValueManagerImpl(key, datastoreFromHandle(datastoreHandle), value),
		),
	});
}
