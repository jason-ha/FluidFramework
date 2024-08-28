/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import type {
	IContainerExtension,
	IExtensionMessage,
} from "@fluidframework/container-definitions/internal";

import {
	createIndependentMap,
	type IEphemeralRuntime,
	type IndependentMapInternal,
} from "./independentMap.js";
import type { IndependentMap, IndependentMapAddress, IndependentMapSchema } from "./types.js";

interface IndependentMapEntry<TSchema extends IndependentMapSchema> {
	externalMap: IndependentMap<TSchema>;
	internalMap: IndependentMapInternal;
}

/**
 * @internal
 */
export interface IIndependentStateManager
	extends Pick<Required<IContainerExtension<[]>>, "processSignal"> {
	/**
	 * Acquires an Independent Map from store or adds new one.
	 *
	 * @param mapAddress - Address of the requested Independent Map
	 * @param factory - Factory to create the Independent Map if not found
	 * @returns The Independent Map
	 */
	acquireIndependentMap<TSchema extends IndependentMapSchema>(
		mapAddress: IndependentMapAddress,
		requestedContent: TSchema,
	): IndependentMap<TSchema>;
}

/**
 * Common Presence manager
 */
class IndependentStateManager implements IIndependentStateManager {
	public constructor(private readonly runtime: IEphemeralRuntime) {}

	private readonly maps = new Map<string, IndependentMapEntry<IndependentMapSchema>>();

	/**
	 * Acquires an Independent Map from store or adds new one.
	 *
	 * @param mapAddress - Address of the requested Independent Map
	 * @param factory - Factory to create the Independent Map if not found
	 * @returns The Independent Map
	 */
	public acquireIndependentMap<TSchema extends IndependentMapSchema>(
		mapAddress: IndependentMapAddress,
		requestedContent: TSchema,
	): IndependentMap<TSchema> {
		let entry = this.maps.get(mapAddress);
		if (entry) {
			entry.internalMap.ensureContent(requestedContent);
		} else {
			entry = createIndependentMap(this.runtime, requestedContent);
			this.maps.set(mapAddress, entry);
		}
		// Could avoid this cast if ensureContent were to return itself as expected type
		return entry.externalMap as IndependentMap<TSchema>;
	}

	/**
	 * Check for Independent State message and process it.
	 *
	 * @param address - Address of the message
	 * @param message - Message to be processed
	 * @param local - Whether the message originated locally (`true`) or remotely (`false`)
	 */
	public processSignal(address: string, message: IExtensionMessage, local: boolean): void {
		// Direct to the appropriate Independent Map, if present.
		const map = this.maps.get(address);
		if (map) {
			map.internalMap.processSignal(message, local);
		}
	}
}

/**
 * Instantiates Presence State Manager
 *
 * @internal
 */
export function createPresenceStateManager(
	runtime: IEphemeralRuntime,
): IIndependentStateManager {
	return new IndependentStateManager(runtime);
}

// ============================================================================
// This demonstrates pattern where IndependentMap creation uses a ctor and allows
// instanceof verification for new requests.
//
// /**
//  * @internal
//  */
// export type IndependentMapFactory<TSchema, T> = new (
// 	containerRuntime: IContainerRuntime & IRuntimeInternal,
// 	initialContent: TSchema,
// ) => IndependentMapEntry<TSchema, T>;

// class IndependentMapEntry<TSchema extends IndependentMapSchema>
// 	implements InstanceType<IndependentMapFactory<TSchema, IndependentMap<TSchema>>>
// {
// 	public readonly map: IndependentMap<TSchema>;
// 	public readonly processSignal: (signal: IInboundSignalMessage, local: boolean) => void;
// 	public readonly ensureContent: (content: TSchema) => void;

// 	public constructor(
// 		runtime: IEphemeralRuntime,
// 		initialContent: TSchema,
// 	) {
// 		const { externalMap, internalMap } = createIndependentMap(
// 			runtime,
// 			initialContent,
// 		);
// 		this.map = externalMap;
// 		this.processSignal = internalMap.processSignal.bind(internalMap);
// 		this.ensureContent = internalMap.ensureContent.bind(internalMap);
// 	}
// }

// export class IndependentStateManager implements IContainerExtension<never> {
// 	public readonly extension: IIndependentStateManager = this;
// 	public readonly interface = this;

// 	public constructor(private readonly runtime: IExtensionRuntime) {}

// 	public onNewContext(): void {
// 		// No-op
// 	}

// 	static readonly extensionId = "dis:bb89f4c0-80fd-4f0c-8469-4f2848ee7f4a";
// 	private readonly maps = new Map<string, IndependentMapEntry<unknown, unknown>>();

// 	/**
// 	 * Acquires an Independent Map from store or adds new one.
// 	 *
// 	 * @param mapAddress - Address of the requested Independent Map
// 	 * @param factory - Factory to create the Independent Map if not found
// 	 * @returns The Independent Map
// 	 */
// 	public acquireIndependentMap<
// 		T extends IndependentMapFacade<unknown>,
// 		TSchema = T extends IndependentMapFacade<infer _TSchema> ? _TSchema : never,
// 	>(
// 		containerRuntime: IContainerRuntime & IRuntimeInternal,
// 		mapAddress: IndependentMapAddress,
// 		requestedContent: TSchema,
// 		factoryFacade: IndependentMapFactoryFacade<T>,
// 	): T {
// 		const factory = factoryFacade as unknown as IndependentMapFactory<TSchema, T>;
// 		let entry = this.maps.get(mapAddress);
// 		if (entry) {
// 			assert(entry instanceof factory, "Existing IndependentMap is not of the expected type");
// 			entry.ensureContent(requestedContent);
// 		} else {
//			// TODO create the appropriate ephemeral runtime (map address must be in submitSignal, etc.)
// 			entry = new factory(containerRuntime, requestedContent);
// 			this.maps.set(mapAddress, entry);
// 		}
// 		return entry.map as T;
// 	}
// }
