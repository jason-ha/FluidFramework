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
	ValueRequiredState,
} from "./exposedInternalTypes.js";
import type { FullyReadonly } from "./exposedUtilityTypes.js";
import { datastoreFromHandle, type IndependentDatastore } from "./independentDatastore.js";
import { brandIVM } from "./independentValue.js";
import type { ValueManager } from "./internalTypes.js";
import type { JsonDeserialized } from "./jsonDeserialized.js";
import type { JsonEncodable } from "./jsonEncodable.js";
import type { LatestValueClientData, LatestValueData } from "./latestValueTypes.js";

/**
 * @beta
 */
export interface LatestValueManagerEvents<T> extends IEvent {
	/**
	 * Raised when remote client's value is updated, which may be the same value.
	 *
	 * @eventProperty
	 */
	(event: "updated", listener: (update: LatestValueClientData<T>) => void): void;
}

/**
 * Value manager that provides the latest known value from this client to others and read access to their values.
 * All participant clients must provide a value.
 *
 * @remarks Create using {@link Latest} registered to {@link IndependentMap}.
 *
 * @beta
 */
export interface LatestValueManager<T> extends IEventProvider<LatestValueManagerEvents<T>> {
	/**
	 * Current state for this client.
	 * State for this client that will be transmitted to all other connected clients.
	 * @remarks Manager assumes ownership of the value and its references. Make a deep clone before
	 * setting, if needed. No comparison is done to detect changes; all sets are transmitted.
	 */
	get local(): FullyReadonly<JsonDeserialized<T>>;
	set local(value: JsonEncodable<T> & JsonDeserialized<T>);
	/**
	 * Iterable access to remote clients' values.
	 * @remarks This is not yet implemented.
	 */
	clientValues(): IterableIterator<LatestValueClientData<T>>;
	/**
	 * Array of known clients' identifiers.
	 */
	clients(): ClientId[];
	/**
	 * Access to a specific client's value.
	 */
	clientValue(clientId: ClientId): LatestValueData<T>;
}

class LatestValueManagerImpl<T, Key extends string>
	extends TypedEventEmitter<LatestValueManagerEvents<T>>
	implements LatestValueManager<T>, ValueManager<T, ValueRequiredState<T>>
{
	public constructor(
		private readonly key: Key,
		private readonly datastore: IndependentDatastore<Key, ValueRequiredState<T>>,
		public readonly value: ValueRequiredState<T>,
	) {
		super();
	}

	get local(): FullyReadonly<JsonDeserialized<T>> {
		return this.value.value;
	}

	set local(value: JsonEncodable<T> & JsonDeserialized<T>) {
		this.value.rev += 1;
		this.value.timestamp = Date.now();
		this.value.value = value;
		this.datastore.localUpdate(this.key, this.value, /* forceUpdate */ false);
	}

	clientValues(): IterableIterator<LatestValueClientData<T>> {
		throw new Error("Method not implemented.");
	}

	clients(): ClientId[] {
		const allKnownStates = this.datastore.knownValues(this.key);
		return Object.keys(allKnownStates.states).filter(
			(clientId) => clientId !== allKnownStates.self,
		);
	}

	clientValue(clientId: ClientId): LatestValueData<T> {
		const allKnownStates = this.datastore.knownValues(this.key);
		if (clientId in allKnownStates.states) {
			const { value, rev: revision } = allKnownStates.states[clientId];
			return { value, metadata: { revision, timestamp: Date.now() } };
		}
		throw new Error("No entry for clientId");
	}

	update(clientId: string, _received: number, value: ValueRequiredState<T>): void {
		const allKnownStates = this.datastore.knownValues(this.key);
		if (clientId in allKnownStates.states) {
			const currentState = allKnownStates.states[clientId];
			if (currentState.rev >= value.rev) {
				return;
			}
		}
		this.datastore.update(this.key, clientId, value);
		this.emit("updated", {
			clientId,
			value: value.value,
			metadata: { revision: value.rev, timestamp: value.timestamp },
		});
	}
}

/**
 * Factory for creating a {@link LatestValueManager}.
 *
 * @beta
 */
export function Latest<T extends object, Key extends string>(
	initialValue: JsonEncodable<T> & JsonDeserialized<T> & object,
): ManagerFactory<Key, ValueRequiredState<T>, LatestValueManager<T>> {
	// LatestValueManager takes ownership of initialValue but makes a shallow
	// copy for basic protection.
	const value: ValueRequiredState<T> = {
		rev: 0,
		timestamp: Date.now(),
		value: { ...initialValue },
	};
	return (key: Key, datastoreHandle: IndependentDatastoreHandle<Key, ValueRequiredState<T>>) => ({
		value,
		manager: brandIVM<LatestValueManagerImpl<T, Key>, T, ValueRequiredState<T>>(
			new LatestValueManagerImpl(key, datastoreFromHandle(datastoreHandle), value),
		),
	});
}
