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

/**
 * @beta
 */
export interface LatestValueMetadata {
	revision: number;
	timestamp: number;
}

/**
 * @beta
 */
export interface LatestValueData<T> {
	value: FullyReadonly<JsonDeserialized<T>>;
	metadata: LatestValueMetadata;
}

/**
 * @beta
 */
export interface LatestValueClientData<T> extends LatestValueData<T> {
	clientId: ClientId;
}

/**
 * @beta
 */
export interface LatestValueManagerEvents<T> extends IEvent {
	/**
	 * .
	 *
	 * @eventProperty
	 */
	(event: "update", listener: (update: LatestValueClientData<T>) => void): void;
}

/**
 * @beta
 */
export interface LatestValueManager<T> extends IEventProvider<LatestValueManagerEvents<T>> {
	get local(): FullyReadonly<JsonDeserialized<T>>;
	set local(value: JsonEncodable<T> & JsonDeserialized<T>);
	clientValues(): IterableIterator<LatestValueClientData<T>>;
	clients(): ClientId[];
	clientValue(clientId: ClientId): LatestValueData<T>;
}

class LatestValueManagerImpl<T, Key extends string>
	extends TypedEventEmitter<LatestValueManagerEvents<T>>
	implements LatestValueManager<T>, ValueManager<T, ValueState<T>>
{
	public constructor(
		private readonly key: Key,
		private readonly datastore: IndependentDatastore<Key, ValueState<T>>,
		public readonly value: ValueState<T>,
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

	update(clientId: string, _received: number, value: ValueState<T>): void {
		const allKnownStates = this.datastore.knownValues(this.key);
		if (clientId in allKnownStates.states) {
			const currentState = allKnownStates.states[clientId];
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
export function Latest<T extends object, Key extends string>(
	initialValue: JsonEncodable<T> & JsonDeserialized<T> & object,
): ManagerFactory<Key, ValueState<T>, LatestValueManager<T>> {
	// LatestValueManager takes ownership of initialValue but makes a shallow
	// copy for basic protection.
	const value: ValueState<T> = { rev: 0, timestamp: Date.now(), value: { ...initialValue } };
	return (key: Key, datastoreHandle: IndependentDatastoreHandle<Key, ValueState<T>>) => ({
		value,
		manager: brandIVM<LatestValueManagerImpl<T, Key>, T, ValueState<T>>(
			new LatestValueManagerImpl(key, datastoreFromHandle(datastoreHandle), value),
		),
	});
}