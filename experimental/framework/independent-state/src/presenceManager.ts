/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import type {
	IContainerExtension,
	IExtensionMessage,
	IRuntimeInternal,
} from "@fluidframework/container-definitions/internal";
import type { IContainerRuntime } from "@fluidframework/container-runtime-definitions/internal";
import type { IFluidDataStoreRuntime } from "@fluidframework/datastore-definitions/internal";

import type { ConnectedClientId } from "./baseTypes.js";
import type { IPresence, ISessionClient } from "./presence.js";
import { createPresenceStates, type PresenceStatesInternal } from "./presenceStates.js";
import type {
	PresenceStates as PresenceStates,
	PresenceWorkspaceAddress as PresenceWorkspaceAddress,
	PresenceStatesSchema as PresenceStatesSchema,
} from "./types.js";

interface PresenceStatesEntry<TSchema extends PresenceStatesSchema> {
	externalMap: PresenceStates<TSchema>;
	internalMap: PresenceStatesInternal;
}

/**
 * @internal
 */
export interface IPresenceManager
	extends IPresence,
		Pick<Required<IContainerExtension<[]>>, "processSignal"> {}

/**
 * This interface is a subset of (IContainerRuntime & IRuntimeInternal) and (IFluidDataStoreRuntime) that is needed by the PresenceStates.
 *
 * @privateRemarks
 * Replace with non-DataStore based interface.
 *
 * @internal
 */
export type IEphemeralRuntime = Pick<
	(IContainerRuntime & IRuntimeInternal) | IFluidDataStoreRuntime,
	"clientId" | "getAudience" | "off" | "on" | "submitSignal"
>;

/**
 * Common Presence manager
 */
class PresenceManager implements IPresenceManager {
	public constructor(private readonly runtime: IEphemeralRuntime) {}

	public getAttendees(): ReadonlyMap<ConnectedClientId, ISessionClient> {
		throw new Error("Method not implemented.");
	}
	public getAttendee(clientId: ConnectedClientId): ISessionClient {
		throw new Error("Method not implemented.");
	}
	public getMyself(): ISessionClient {
		throw new Error("Method not implemented.");
	}

	private readonly maps = new Map<string, PresenceStatesEntry<PresenceStatesSchema>>();

	/**
	 * Acquires a Presence States workspace from store or adds new one.
	 *
	 * @param workspaceAddress - Address of the requested Presence States workspace
	 * @param requestedContent - Requested states for the workspace
	 * @returns The Presence State Workspace
	 */
	public getStates<TSchema extends PresenceStatesSchema>(
		workspaceAddress: PresenceWorkspaceAddress,
		requestedContent: TSchema,
	): PresenceStates<TSchema> {
		const mapAddress = `s:${workspaceAddress}`;
		let entry = this.maps.get(mapAddress);
		if (entry) {
			entry.internalMap.ensureContent(requestedContent);
		} else {
			entry = createPresenceStates(this.runtime, requestedContent);
			this.maps.set(mapAddress, entry);
		}
		// Could avoid this cast if ensureContent were to return itself as expected type
		return entry.externalMap as PresenceStates<TSchema>;
	}

	/**
	 * Acquires a Presence Notifications workspace from store or adds new one.
	 *
	 * @param workspaceAddress - Address of the requested Presence Notifications workspace
	 * @param requestedContent - Requested states for the workspace
	 * @returns The Presence State Workspace
	 */
	public getNotifications<TSchema extends PresenceStatesSchema>(
		workspaceAddress: PresenceWorkspaceAddress,
		requestedContent: TSchema,
	): PresenceStates<TSchema> {
		const mapAddress = `n:${workspaceAddress}`;
		let entry = this.maps.get(mapAddress);
		if (entry) {
			entry.internalMap.ensureContent(requestedContent);
		} else {
			entry = createPresenceStates(this.runtime, requestedContent);
			this.maps.set(mapAddress, entry);
		}
		// Could avoid this cast if ensureContent were to return itself as expected type
		return entry.externalMap as PresenceStates<TSchema>;
	}

	/**
	 * Check for Presence message and process it.
	 *
	 * @param address - Address of the message
	 * @param message - Message to be processed
	 * @param local - Whether the message originated locally (`true`) or remotely (`false`)
	 */
	public processSignal(address: string, message: IExtensionMessage, local: boolean): void {
		// Direct to the appropriate Presence Workspace, if present.
		const map = this.maps.get(address);
		if (map) {
			map.internalMap.processSignal(message, local);
		}
	}
}

/**
 * Instantiates Presence Manager
 *
 * @internal
 */
export function createPresenceManager(runtime: IEphemeralRuntime): IPresenceManager {
	return new PresenceManager(runtime);
}

// ============================================================================
// This demonstrates pattern where PresenceStates creation uses a ctor and allows
// instanceof verification for new requests.
//
// /**
//  * @internal
//  */
// export type PresenceStatesFactory<TSchema, T> = new (
// 	containerRuntime: IContainerRuntime & IRuntimeInternal,
// 	initialContent: TSchema,
// ) => PresenceStatesEntry<TSchema, T>;

// class PresenceStatesEntry<TSchema extends PresenceStatesSchema>
// 	implements InstanceType<PresenceStatesFactory<TSchema, PresenceStates<TSchema>>>
// {
// 	public readonly map: PresenceStates<TSchema>;
// 	public readonly processSignal: (signal: IInboundSignalMessage, local: boolean) => void;
// 	public readonly ensureContent: (content: TSchema) => void;

// 	public constructor(
// 		runtime: IEphemeralRuntime,
// 		initialContent: TSchema,
// 	) {
// 		const { externalMap, internalMap } = createPresenceStates(
// 			runtime,
// 			initialContent,
// 		);
// 		this.map = externalMap;
// 		this.processSignal = internalMap.processSignal.bind(internalMap);
// 		this.ensureContent = internalMap.ensureContent.bind(internalMap);
// 	}
// }

// export class PresenceManager implements IContainerExtension<never> {
// 	public readonly extension: IPresenceManager = this;
// 	public readonly interface = this;

// 	public constructor(private readonly runtime: IExtensionRuntime) {}

// 	public onNewContext(): void {
// 		// No-op
// 	}

// 	static readonly extensionId = "dis:bb89f4c0-80fd-4f0c-8469-4f2848ee7f4a";
// 	private readonly maps = new Map<string, PresenceStatesEntry<unknown, unknown>>();

// 	/**
// 	 * Acquires an Presence Workspace from store or adds new one.
// 	 *
// 	 * @param mapAddress - Address of the requested Presence Workspace
// 	 * @param factory - Factory to create the Presence Workspace if not found
// 	 * @returns The Presence Workspace
// 	 */
// 	public acquirePresenceStates<
// 		T extends PresenceStatesFacade<unknown>,
// 		TSchema = T extends PresenceStatesFacade<infer _TSchema> ? _TSchema : never,
// 	>(
// 		containerRuntime: IContainerRuntime & IRuntimeInternal,
// 		mapAddress: PresenceWorkspaceAddress,
// 		requestedContent: TSchema,
// 		factoryFacade: PresenceStatesFactoryFacade<T>,
// 	): T {
// 		const factory = factoryFacade as unknown as PresenceStatesFactory<TSchema, T>;
// 		let entry = this.maps.get(mapAddress);
// 		if (entry) {
// 			assert(entry instanceof factory, "Existing PresenceStates is not of the expected type");
// 			entry.ensureContent(requestedContent);
// 		} else {
//			// TODO create the appropriate ephemeral runtime (map address must be in submitSignal, etc.)
// 			entry = new factory(containerRuntime, requestedContent);
// 			this.maps.set(mapAddress, entry);
// 		}
// 		return entry.map as T;
// 	}
// }
