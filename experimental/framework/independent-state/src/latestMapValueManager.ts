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
	ValueOptionalState,
} from "./exposedInternalTypes.js";
import type { FullyReadonly } from "./exposedUtilityTypes.js";
import { datastoreFromHandle, type IndependentDatastore } from "./independentDatastore.js";
import { brandIVM } from "./independentValue.js";
import type { ValueManager } from "./internalTypes.js";
import type { JsonDeserialized } from "./jsonDeserialized.js";
import type { JsonEncodable } from "./jsonEncodable.js";
import type {
	LatestValueClientData,
	LatestValueData,
	LatestValueMetadata,
} from "./latestValueTypes.js";

/**
 * @beta
 */
export interface LatestMapValueData<T, Keys extends string | number> {
	items: Map<Keys, LatestValueData<T>>;
}

/**
 * @beta
 */
export interface LatestMapValueClientData<T, K extends string | number>
	extends LatestMapValueData<T, K> {
	clientId: ClientId;
}

/**
 * @beta
 */
export interface LatestMapItemValueClientData<T, K extends string | number>
	extends LatestValueClientData<T> {
	key: K;
}

/**
 * @beta
 */
export interface LatestMapItemRemovedClientData<K extends string | number> {
	clientId: ClientId;
	key: K;
	metadata: LatestValueMetadata;
}

/**
 * @beta
 */
export interface LatestMapValueManagerEvents<T, K extends string | number> extends IEvent {
	/**
	 * Raised when any item's value for remote client is updated.
	 * @param updates - Map of one or more values updated.
	 *
	 * @eventProperty
	 */
	(event: "updated", listener: (updates: LatestMapValueClientData<T, K>) => void): void;

	/**
	 * Raised when specific item's value is updated.
	 * @param updatedItem - Updated item value.
	 *
	 * @eventProperty
	 */
	(
		event: "itemUpdated",
		listener: (updatedItem: LatestMapItemValueClientData<T, K>) => void,
	): void;

	/**
	 * Raised when specific item is removed.
	 * @param removedItem - Removed item.
	 *
	 * @eventProperty
	 */
	(
		event: "itemRemoved",
		listener: (removedItem: LatestMapItemRemovedClientData<K>) => void,
	): void;
}

/**
 * @beta
 */
export interface ValueMap<K extends string | number, V> {
	/**
	 * ${@link ValueMap.delete}s all elements in the ValueMap.
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

/**
 * @beta
 */
export interface MapValueState<T> {
	rev: number;
	items: {
		// Caution: any particular item may or may not exist
		// Typescript does not support absent keys without forcing type to also be undefined.
		// See https://github.com/microsoft/TypeScript/issues/42810.
		[name: string | number]: ValueOptionalState<T>;
	};
}

class ValueMapImpl<T, K extends string | number> implements ValueMap<K, T> {
	private countDefined: number;
	constructor(
		private readonly value: MapValueState<T>,
		private readonly localUpdate: (updates: MapValueState<T>, forceUpdate: boolean) => void,
	) {
		// All initial items are expected to be defined.
		// TODO assert all defined and/or update type.
		this.countDefined = Object.keys(value.items).length;
	}

	private updateItem(key: K, value: ValueOptionalState<T>["value"]) {
		this.value.rev += 1;
		const item = this.value.items[key];
		item.rev += 1;
		item.timestamp = Date.now();
		item.value = value;
		const update = { rev: this.value.rev, items: { [key]: item } };
		this.localUpdate(update, /* forceUpdate */ false);
	}

	clear(): void {
		throw new Error("Method not implemented.");
	}
	delete(key: K): boolean {
		const { items } = this.value;
		const hasKey = items[key]?.value !== undefined;
		if (hasKey) {
			this.countDefined -= 1;
			this.updateItem(key, undefined);
		}
		return hasKey;
	}
	forEach(
		callbackfn: (
			value: FullyReadonly<JsonDeserialized<T>>,
			key: K,
			map: ValueMap<K, T>,
		) => void,
		thisArg?: any,
	): void {
		Object.entries(this.value.items).forEach(([key, item]) => {
			if (item.value !== undefined) {
				// TODO: see about typing MapValueState with K
				callbackfn(item.value, key as K, this);
			}
		});
	}
	get(key: K): FullyReadonly<JsonDeserialized<T>> | undefined {
		return this.value.items[key]?.value;
	}
	has(key: K): boolean {
		return this.value.items[key]?.value !== undefined;
	}
	set(key: K, value: JsonEncodable<T> & JsonDeserialized<T>): this {
		if (!(key in this.value.items)) {
			this.countDefined += 1;
			this.value.items[key] = { rev: 0, timestamp: 0, value };
		}
		this.updateItem(key, value);
		return this;
	}
	get size(): number {
		return this.countDefined;
	}
	entries(): IterableIterator<[K, FullyReadonly<JsonDeserialized<T>>]> {
		throw new Error("Method not implemented.");
	}
	keys(): IterableIterator<K> {
		throw new Error("Method not implemented.");
	}
	values(): IterableIterator<FullyReadonly<JsonDeserialized<T>>> {
		throw new Error("Method not implemented.");
	}
	[Symbol.iterator](): IterableIterator<[K, FullyReadonly<JsonDeserialized<T>>]> {
		throw new Error("Method not implemented.");
	}
}

/**
 * @beta
 */
export interface LatestMapValueManager<T, K extends string | number = string | number>
	extends IEventProvider<LatestMapValueManagerEvents<T, K>> {
	readonly local: ValueMap<K, T>;
	clientValues(): IterableIterator<LatestMapValueClientData<T, K>>;
	clients(): ClientId[];
	clientValue(clientId: ClientId): LatestMapValueData<T, K>;
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
		this.local = new ValueMapImpl<T, Keys>(
			value,
			(updates: MapValueState<T>, forceUpdate: boolean) => {
				datastore.localUpdate(key, updates, forceUpdate);
			},
		);
	}

	public readonly local: ValueMap<Keys, T>;

	clientValues(): IterableIterator<LatestMapValueClientData<T, Keys>> {
		throw new Error("Method not implemented.");
	}

	clients(): ClientId[] {
		const allKnownStates = this.datastore.knownValues(this.key);
		return Object.keys(allKnownStates.states).filter(
			(clientId) => clientId !== allKnownStates.self,
		);
	}

	clientValue(clientId: ClientId): LatestMapValueData<T, Keys> {
		const allKnownStates = this.datastore.knownValues(this.key);
		if (!(clientId in allKnownStates.states)) {
			throw new Error("No entry for clientId");
		}
		const clientStateMap = allKnownStates.states[clientId];
		const items = new Map<Keys, LatestValueData<T>>();
		Object.entries(clientStateMap.items).forEach(([key, item]) => {
			const value = item.value;
			if (value !== undefined) {
				items.set(key as Keys, {
					value,
					metadata: { revision: item.rev, timestamp: item.timestamp },
				});
			}
		});
		return { items };
	}

	update(clientId: string, _received: number, value: MapValueState<T>): void {
		const allKnownStates = this.datastore.knownValues(this.key);
		if (!(clientId in allKnownStates.states)) {
			// New client - prepare new client state directory
			allKnownStates.states[clientId] = { rev: value.rev, items: {} };
		}
		const currentState = allKnownStates.states[clientId];
		// Accumulate individual update keys
		const updatedItemKeys: Keys[] = [];
		Object.entries(value.items).forEach(([key, item]) => {
			if (!(key in currentState.items) || currentState.items[key].rev < item.rev) {
				updatedItemKeys.push(key as Keys);
			}
		});

		if (updatedItemKeys.length === 0) {
			return;
		}

		// Store updates
		if (value.rev > currentState.rev) {
			currentState.rev = value.rev;
		}
		const allUpdates: LatestMapValueClientData<T, Keys> = {
			clientId,
			items: new Map<Keys, LatestValueData<T>>(),
		};
		updatedItemKeys.forEach((key) => {
			const item = value.items[key];
			const hadPriorValue = currentState.items[key]?.value;
			currentState.items[key] = item;
			const metadata = { revision: item.rev, timestamp: item.timestamp };
			if (item.value !== undefined) {
				this.emit("itemUpdated", {
					clientId,
					key,
					value: item.value,
					metadata,
				});
				allUpdates.items.set(key, { value: item.value, metadata });
			} else if (hadPriorValue) {
				this.emit("itemRemoved", {
					clientId,
					key,
					metadata,
				});
			}
		});
		this.datastore.update(this.key, clientId, currentState);
		this.emit("updated", allUpdates);
	}
}

/**
 * @beta
 */
export function LatestMap<
	T extends object,
	RegistrationKey extends string,
	Keys extends string | number = string | number,
>(initialValues?: {
	[K in Keys]: JsonEncodable<T> & JsonDeserialized<T>;
}): ManagerFactory<RegistrationKey, MapValueState<T>, LatestMapValueManager<T, Keys>> {
	// LatestMapValueManager takes ownership of values within initialValues.
	const timestamp = Date.now();
	const value: MapValueState<T> = { rev: 0, items: {} };
	if (initialValues !== undefined) {
		Object.keys(initialValues).forEach((key) => {
			value.items[key] = { rev: 0, timestamp, value: initialValues[key as Keys] };
		});
	}
	return (
		key: RegistrationKey,
		datastoreHandle: IndependentDatastoreHandle<RegistrationKey, MapValueState<T>>,
	) => ({
		value,
		manager: brandIVM<LatestMapValueManagerImpl<T, RegistrationKey, Keys>, T, MapValueState<T>>(
			new LatestMapValueManagerImpl(key, datastoreFromHandle(datastoreHandle), value),
		),
	});
}
