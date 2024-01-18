/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import { assert } from "@fluidframework/core-utils";
import type { IFluidDataStoreRuntime } from "@fluidframework/datastore-definitions";
import type { IInboundSignalMessage } from "@fluidframework/runtime-definitions";

import { type IndependentDatastore, handleFromDatastore } from "./independentDatastore.js";
import { unbrandIVM } from "./independentValue.js";
import type { ValueElement, ValueState } from "./internalTypes.js";
import type {
	ClientId,
	IndependentMap,
	IndependentMapMethods,
	IndependentMapSchema,
	ManagerFactory,
	RoundTrippable,
} from "./types.js";

interface IndependentMapValueUpdate extends ValueState<unknown> {
	key: string;
	keepUnregistered?: true;
}

type MapSchemaElement<
	TSchema extends IndependentMapSchema,
	Part extends keyof ReturnType<TSchema[keyof TSchema]>,
	Keys extends keyof TSchema = keyof TSchema,
> = ReturnType<TSchema[Keys]>[Part];

type IndependentSubSchemaFromMapSchema<
	TSchema extends IndependentMapSchema,
	Part extends keyof ReturnType<TSchema[keyof TSchema]>,
> = {
	[Key in keyof TSchema]: MapSchemaElement<TSchema, Part, Key>;
};

type IndependentDatastoreSchemaFromMapSchema<TSchema extends IndependentMapSchema> =
	IndependentSubSchemaFromMapSchema<TSchema, "value">;
type MapEntries<TSchema extends IndependentMapSchema> = IndependentSubSchemaFromMapSchema<
	TSchema,
	"manager"
>;

/**
 * ValueElementMap is a map of key to a map of clientId to ValueState.
 * It is not restricted to the schema of the map as it may receive updates from other clients
 * with managers that have not been registered locally. Each map node is responsible for keeping
 * all sessions state to be able to pick arbitrary client to rebroadcast to others.
 *
 * This generic aspect makes some typing difficult. The loose typing is not broadcast to the
 * consumers that are expected to maintain their schema over multiple versions of clients.
 */
interface ValueElementMap<_TSchema extends IndependentMapSchema> {
	[Key: string]: { [ClientId: ClientId]: ValueState<unknown> };
}
// An attempt to make the type more precise, but it is not working.
// If the casting in support code is too much we could keep two references to the same
// complete datastore, but with the respective types desired.
// type ValueElementMap<TSchema extends IndependentMapNodeSchema> =
// 	| {
// 			[Key in keyof TSchema & string]?: {
// 				[ClientId: ClientId]: ValueState<MapSchemaElement<TSchema,"value",Key>>;
// 			};
// 	  }
// 	| {
// 			[Key: string]: { [ClientId: ClientId]: ValueState<unknown> };
// 	  };
// interface ValueElementMap<TValue> {
// 	[Id: string]: { [ClientId: ClientId]: ValueState<TValue> };
// 	// Version with local packed in is convenient for map, but not for join broadcast to serialize simply.
// 	// [Id: string]: {
// 	// 	local: ValueState<TValue>;
// 	// 	all: { [ClientId: ClientId]: ValueState<TValue> };
// 	// };
// }

class IndependentMapImpl<TSchema extends IndependentMapSchema>
	implements
		IndependentMapMethods<TSchema>,
		IndependentDatastore<IndependentDatastoreSchemaFromMapSchema<TSchema>>
{
	private readonly datastore: ValueElementMap<TSchema> = {};
	public readonly nodes: MapEntries<TSchema>;

	constructor(
		private readonly runtime: IFluidDataStoreRuntime,
		initialContent: TSchema,
	) {
		this.runtime.getAudience().on("addMember", (clientId) => {
			Object.entries(this.datastore).forEach(([_key, allKnownState]) => {
				assert(!(clientId in allKnownState), "New client already in independent map");
			});
			// TODO: Send all current state to the new client
		});
		runtime.on("disconnected", () => {
			const { clientId } = this.runtime;
			assert(clientId !== undefined, "Disconnected without local clientId");
			Object.entries(this.datastore).forEach(([_key, allKnownState]) => {
				// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
				delete allKnownState[clientId];
			});
			// TODO: Consider caching prior (current) clientId to broadcast when reconnecting so others may remap state.
		});
		runtime.on("connected", () => {
			const { clientId } = this.runtime;
			assert(clientId !== undefined, "Connected without local clientId");
			Object.entries(this.datastore).forEach(([key, allKnownState]) => {
				if (key in this.nodes) {
					allKnownState[clientId] = unbrandIVM(this.nodes[key]).value;
				}
			});
		});
		runtime.on("signal", this.processSignal.bind(this));

		// Prepare initial map content from initial state
		{
			const clientId = this.runtime.clientId;
			const initial = Object.entries(initialContent).reduce(
				(acc, [key, nodeFactory]) => {
					const newNodeData = nodeFactory(key, handleFromDatastore(this));
					acc.nodes[key as keyof TSchema] = newNodeData.manager;
					acc.datastore[key] = {};
					if (clientId) {
						// Should be able to use newNodeData.value, but Jsonable allowance for undefined appears
						// to cause a problem. Or it could be that datastore is not precisely typed
						acc.datastore[key][clientId] = unbrandIVM(newNodeData.manager).value;
					}
					return acc;
				},
				{
					nodes: {} as unknown as MapEntries<TSchema>,
					datastore: {} as unknown as ValueElementMap<TSchema>,
				},
			);
			this.nodes = initial.nodes;
			this.datastore = initial.datastore;
		}
	}

	knownValues<Key extends keyof TSchema & string>(
		key: Key,
	): {
		self: string | undefined;
		states: ValueElement<MapSchemaElement<TSchema, "value", Key>>;
	} {
		return {
			self: this.runtime.clientId,
			states: this.datastore[key] as ValueElement<MapSchemaElement<TSchema, "value", Key>>,
		};
	}

	localUpdate(key: keyof TSchema & string, _forceBroadcast: boolean): void {
		const content = {
			key,
			...unbrandIVM(this.nodes[key]).value,
		} satisfies IndependentMapValueUpdate;
		this.runtime.submitSignal("IndependentMapValueUpdate", content);
	}

	update(
		key: keyof TSchema & string,
		clientId: string,
		rev: number,
		timestamp: number,
		value: RoundTrippable<unknown>,
	): void {
		const allKnownState = this.datastore[key];
		allKnownState[clientId] = { rev, timestamp, value };
	}

	add<TKey extends string, TValue, TValueManager>(
		key: TKey,
		nodeFactory: ManagerFactory<TKey, TValue, TValueManager>,
	): asserts this is IndependentMap<
		TSchema & Record<TKey, ManagerFactory<TKey, TValue, TValueManager>>
	> {
		assert(!(key in this.nodes), "Already have entry for key in map");
		const node = nodeFactory(key, handleFromDatastore(this)).manager;
		this.nodes[key] = node;
		if (key in this.datastore) {
			// Already have received state from other clients. Kept in `all`.
			// TODO: Send current `all` state to state manager.
		} else {
			this.datastore[key] = {};
		}
		// If we have a clientId, then add the local state entry to the all state.
		if (this.runtime.clientId) {
			// Should be able to use .value from factory, but Jsonable allowance for undefined appears
			// to cause a problem. Or it could be that datastore is not precisely typed.
			this.datastore[key][this.runtime.clientId] = unbrandIVM(node).value;
		}
	}

	private processSignal(message: IInboundSignalMessage, local: boolean) {
		if (local) {
			return;
		}

		const timestamp = Date.now();
		assert(message.clientId !== null, "Map received signal without clientId");

		// TODO: Maybe most messages can just be general state update and merged.
		if (message.type === "IndependentMapValueUpdate") {
			const {
				key: key,
				keepUnregistered,
				rev,
				value,
			} = message.content as IndependentMapValueUpdate;
			if (key in this.nodes) {
				const node = unbrandIVM(this.nodes[key]);
				node.update(message.clientId, rev, timestamp, value);
			} else if (keepUnregistered) {
				if (!(key in this.datastore)) {
					this.datastore[key] = {};
				}
				const allKnownState = this.datastore[key];
				allKnownState[message.clientId] = { rev, timestamp, value };
			}
		} else if (message.type === "CompleteIndependentMap") {
			const remoteDatastore = message.content as ValueElementMap<TSchema>;
			for (const [key, remoteAllKnownState] of Object.entries(remoteDatastore)) {
				if (key in this.nodes) {
					const node = unbrandIVM(this.nodes[key]);
					for (const [clientId, value] of Object.entries(remoteAllKnownState)) {
						node.update(clientId, value.rev, value.timestamp, value.value);
					}
				} else {
					// Assume all broadcast state is meant to be kept even if not currently registered.
					if (!(key in this.datastore)) {
						this.datastore[key] = {};
					}
					const localAllKnownState = this.datastore[key];
					for (const [clientId, value] of Object.entries(remoteAllKnownState)) {
						localAllKnownState[clientId] = value;
					}
				}
			}
		}
	}
}

/**
 * @internal
 */
export function createEphemeralIndependentMap<TSchema extends IndependentMapSchema>(
	runtime: IFluidDataStoreRuntime,
	initialContent: TSchema,
): IndependentMap<TSchema> {
	const map = new IndependentMapImpl(runtime, initialContent);

	// Capture the top level "public" map. Both the map implementation and
	// the wrapper object reference this object.
	const nodes = map.nodes;

	// Create a wrapper object that has just the public interface methods and nothing more.
	const wrapper = {
		add: map.add.bind(map),
	};

	return new Proxy(wrapper as IndependentMap<TSchema>, {
		get(target, p, receiver) {
			if (typeof p === "string") {
				return target[p] ?? nodes[p];
			}
			return Reflect.get(target, p, receiver);
		},
		set(_target, _p, _newValue, _receiver) {
			return false;
		},
	});
}
