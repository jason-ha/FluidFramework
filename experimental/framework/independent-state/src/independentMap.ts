/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import { assert } from "@fluidframework/core-utils/internal";
import type { IFluidDataStoreRuntime } from "@fluidframework/datastore-definitions/internal";
import type { IInboundSignalMessage } from "@fluidframework/runtime-definitions";

import type {
	ManagerFactory,
	ValueDirectory,
	ValueDirectoryOrState,
	ValueOptionalState,
	ValueRequiredState,
} from "./exposedInternalTypes.js";
import { handleFromDatastore, type IndependentDatastore } from "./independentDatastore.js";
import { unbrandIVM } from "./independentValue.js";
import type { ClientRecord } from "./internalTypes.js";
import type { IndependentMap, IndependentMapMethods, IndependentMapSchema } from "./types.js";

interface IndependentMapValueUpdate<TValue extends ValueDirectoryOrState<unknown>> {
	key: string;
	content: TValue;
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
	[key: string]: ClientRecord<ValueDirectoryOrState<unknown>>;
}
// An attempt to make the type more precise, but it is not working.
// If the casting in support code is too much we could keep two references to the same
// complete datastore, but with the respective types desired.
// type ValueElementMap<TSchema extends IndependentMapNodeSchema> =
// 	| {
// 			[Key in keyof TSchema & string]?: {
// 				[ClientId: ClientId]: ValueDirectoryOrState<MapSchemaElement<TSchema,"value",Key>>;
// 			};
// 	  }
// 	| {
// 			[key: string]: ClientRecord<ValueDirectoryOrState<unknown>>;
// 	  };
// interface ValueElementMap<TValue> {
// 	[Id: string]: ClientRecord<ValueDirectoryOrState<TValue>>;
// 	// Version with local packed in is convenient for map, but not for join broadcast to serialize simply.
// 	// [Id: string]: {
// 	// 	local: ValueDirectoryOrState<TValue>;
// 	// 	all: ClientRecord<ValueDirectoryOrState<TValue>>;
// 	// };
// }

/**
 * This interface is a subset of IFluidDataStoreRuntime that is needed by the IndependentMap.
 *
 * @internal
 */
export type IFluidEphemeralDataStoreRuntime = Pick<
	IFluidDataStoreRuntime,
	"clientId" | "getAudience" | "off" | "on" | "submitSignal"
>;

function isValueDirectory<T, TValueState extends ValueRequiredState<T> | ValueOptionalState<T>>(
	value: ValueDirectory<T> | TValueState,
): value is ValueDirectory<T> {
	return "items" in value;
}

function mergeValueDirectory<T, TValueState extends ValueRequiredState<T> | ValueOptionalState<T>>(
	base: TValueState | ValueDirectory<T> | undefined,
	update: TValueState | ValueDirectory<T>,
	timeDelta: number,
): TValueState | ValueDirectory<T> {
	if (!isValueDirectory(update)) {
		if (base === undefined || update.rev > base.rev) {
			return { ...update, timestamp: update.timestamp + timeDelta };
		}
		return base;
	}

	let mergeBase: ValueDirectory<T>;
	if (base === undefined) {
		mergeBase = { rev: update.rev, items: {} };
	} else {
		const baseIsDirectory = isValueDirectory(base);
		if (base.rev >= update.rev) {
			if (!baseIsDirectory) {
				// base is leaf value that is more recent - nothing to do
				return base;
			}
			// While base has more advanced revision, assume mis-ordering or
			// missed and catchup update needs merged in.
			mergeBase = base;
		} else {
			mergeBase = { rev: update.rev, items: baseIsDirectory ? base.items : {} };
		}
	}
	for (const [key, value] of Object.entries(update.items)) {
		const baseElement = mergeBase.items[key];
		mergeBase.items[key] = mergeValueDirectory(baseElement, value, timeDelta);
	}
	return mergeBase;
}

class IndependentMapImpl<TSchema extends IndependentMapSchema>
	implements
		IndependentMapMethods<TSchema>,
		IndependentDatastore<
			keyof TSchema & string,
			MapSchemaElement<TSchema, "value", keyof TSchema & string>
		>
{
	private readonly datastore: ValueElementMap<TSchema> = {};
	public readonly nodes: MapEntries<TSchema>;

	public constructor(
		private readonly runtime: IFluidEphemeralDataStoreRuntime,
		initialContent: TSchema,
	) {
		this.runtime.getAudience().on("addMember", (clientId) => {
			for (const [_key, allKnownState] of Object.entries(this.datastore)) {
				assert(!(clientId in allKnownState), "New client already in independent map");
			}
			// TODO: Send all current state to the new client
		});
		runtime.on("disconnected", () => {
			const { clientId } = this.runtime;
			assert(clientId !== undefined, "Disconnected without local clientId");
			for (const [_key, allKnownState] of Object.entries(this.datastore)) {
				// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
				delete allKnownState[clientId];
			}
			// TODO: Consider caching prior (current) clientId to broadcast when reconnecting so others may remap state.
		});
		runtime.on("connected", () => {
			const { clientId } = this.runtime;
			assert(clientId !== undefined, "Connected without local clientId");
			for (const [key, allKnownState] of Object.entries(this.datastore)) {
				if (key in this.nodes) {
					allKnownState[clientId] = unbrandIVM(this.nodes[key]).value;
				}
			}
		});
		runtime.on("signal", this.processSignal.bind(this));

		// Prepare initial map content from initial state
		{
			const clientId = this.runtime.clientId;
			// eslint-disable-next-line unicorn/no-array-reduce
			const initial = Object.entries(initialContent).reduce(
				(acc, [key, nodeFactory]) => {
					const newNodeData = nodeFactory(key, handleFromDatastore(this));
					acc.nodes[key as keyof TSchema] = newNodeData.manager;
					acc.datastore[key] = {};
					if (clientId !== undefined && clientId) {
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

	public knownValues<Key extends keyof TSchema & string>(
		key: Key,
	): {
		self: string | undefined;
		states: ClientRecord<MapSchemaElement<TSchema, "value", Key>>;
	} {
		return {
			self: this.runtime.clientId,
			states: this.datastore[key],
		};
	}

	public localUpdate<Key extends keyof TSchema & string>(
		key: Key,
		value: MapSchemaElement<TSchema, "value", Key>,
		_forceBroadcast: boolean,
	): void {
		const content = {
			key,
			content: value,
		} satisfies IndependentMapValueUpdate<MapSchemaElement<TSchema, "value", Key>>;
		this.runtime.submitSignal("IndependentMapValueUpdate", content);
	}

	public update<Key extends keyof TSchema & string>(
		key: Key,
		clientId: string,
		value: MapSchemaElement<TSchema, "value", Key>,
	): void {
		const allKnownState = this.datastore[key];
		allKnownState[clientId] = mergeValueDirectory(allKnownState[clientId], value, 0);
	}

	public add<TKey extends string, TValue extends ValueDirectoryOrState<unknown>, TValueManager>(
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
		const { clientId } = this.runtime;
		if (clientId !== undefined && clientId) {
			// Should be able to use .value from factory, but Jsonable allowance for undefined appears
			// to cause a problem. Or it could be that datastore is not precisely typed.
			this.datastore[key][clientId] = unbrandIVM(node).value;
		}
	}

	private processSignal(message: IInboundSignalMessage, local: boolean): void {
		if (local) {
			return;
		}

		const received = Date.now();
		assert(message.clientId !== null, "Map received signal without clientId");
		const timeDelta = received - received;

		// TODO: Maybe most messages can just be general state update and merged.
		if (message.type === "IndependentMapValueUpdate") {
			const { key, keepUnregistered, content } = message.content as IndependentMapValueUpdate<
				ValueDirectoryOrState<unknown>
			>;
			if (key in this.nodes) {
				const node = unbrandIVM(this.nodes[key]);
				node.update(message.clientId, received, content);
			} else if (keepUnregistered) {
				if (!(key in this.datastore)) {
					this.datastore[key] = {};
				}
				const allKnownState = this.datastore[key];
				allKnownState[message.clientId] = mergeValueDirectory(
					allKnownState[message.clientId],
					content,
					timeDelta,
				);
			}
		} else if (message.type === "CompleteIndependentMap") {
			const remoteDatastore = message.content as ValueElementMap<TSchema>;
			for (const [key, remoteAllKnownState] of Object.entries(remoteDatastore)) {
				if (key in this.nodes) {
					const node = unbrandIVM(this.nodes[key]);
					for (const [clientId, value] of Object.entries(remoteAllKnownState)) {
						node.update(clientId, received, value);
					}
				} else {
					// Assume all broadcast state is meant to be kept even if not currently registered.
					if (!(key in this.datastore)) {
						this.datastore[key] = {};
					}
					const localAllKnownState = this.datastore[key];
					for (const [clientId, value] of Object.entries(remoteAllKnownState)) {
						localAllKnownState[clientId] = mergeValueDirectory(
							localAllKnownState[clientId],
							value,
							timeDelta,
						);
					}
				}
			}
		}
	}
}

/**
 * Create a new IndependentMap using the DataStoreRuntime provided.
 * @param runtime - The dedicated runtime to use for the IndependentMap. The requirements
 * are very unstable and will change. Recommendation is to use IndependentMapFactory from
 * `alpha` entrypoint for now.
 * @param initialContent - The initial value managers to register.
 *
 * @internal
 */
export function createIndependentMap<TSchema extends IndependentMapSchema>(
	runtime: IFluidEphemeralDataStoreRuntime,
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
		get(target, p, receiver): unknown {
			if (typeof p === "string") {
				return target[p] ?? nodes[p];
			}
			return Reflect.get(target, p, receiver);
		},
		set(_target, _p, _newValue, _receiver): false {
			return false;
		},
	});
}
