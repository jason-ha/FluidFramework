/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import type { IConnectionDetails } from "@fluidframework/container-definitions/internal";
import { assert } from "@fluidframework/core-utils/internal";
import { createSessionId } from "@fluidframework/id-compressor/internal";
import type {
	ITelemetryLoggerExt,
	MonitoringContext,
} from "@fluidframework/telemetry-utils/internal";
import { createChildMonitoringContext } from "@fluidframework/telemetry-utils/internal";

import type { ClientConnectionId } from "./baseTypes.js";
import type { IEphemeralRuntime } from "./internalTypes.js";
import type {
	ClientSessionId,
	IPresence,
	ISessionClient,
	PresenceEvents,
} from "./presence.js";
import type { PresenceDatastoreManager } from "./presenceDatastoreManager.js";
import { PresenceDatastoreManagerImpl } from "./presenceDatastoreManager.js";
import type { SystemWorkspace, SystemWorkspaceDatastore } from "./systemWorkspace.js";
import { createSystemWorkspace } from "./systemWorkspace.js";
import type {
	PresenceStates,
	PresenceWorkspaceAddress,
	PresenceStatesSchema,
} from "./types.js";

import type {
	IContainerExtension,
	IExtensionMessage,
} from "@fluid-experimental/presence/internal/container-definitions/internal";
import type { IEmitter } from "@fluid-experimental/presence/internal/events";
import { createEmitter } from "@fluid-experimental/presence/internal/events";

/**
 * Portion of the container extension requirements ({@link IContainerExtension}) that are delegated to presence manager.
 *
 * @internal
 */
export type PresenceExtensionInterface = Required<
	Pick<IContainerExtension<never>, "processSignal">
>;

/**
 * Kludge to manage special connection delay where
 * runtime.signalsConnected() is true but clientConnectionId is undefined at
 * the time of construction. In this situation, registration for
 * "connect" event is insufficient (it has already occurred) and the
 * caller must provide the clientConnectionId explicitly.
 */
export interface FirstConnectionWorkaround {
	onFirstConnection(clientConnectionId: ClientConnectionId): void;
}

/**
 * The Presence manager
 */
class PresenceManager
	implements IPresence, PresenceExtensionInterface, FirstConnectionWorkaround
{
	private readonly datastoreManager: PresenceDatastoreManager;
	private readonly systemWorkspace: SystemWorkspace;

	public readonly events = createEmitter<PresenceEvents>();

	private readonly mc: MonitoringContext | undefined = undefined;

	public constructor(
		runtime: IEphemeralRuntime,
		clientConnectionId: ClientConnectionId | undefined,
		clientSessionId: ClientSessionId,
	) {
		const logger = runtime.logger;
		if (logger) {
			this.mc = createChildMonitoringContext({ logger, namespace: "Presence" });
			this.mc.logger.sendTelemetryEvent({ eventName: "PresenceInstantiated" });
		}

		[this.datastoreManager, this.systemWorkspace] = setupSubComponents(
			clientSessionId,
			runtime,
			this.events,
			this.mc?.logger,
		);

		runtime.on("connect", (details: IConnectionDetails) => {
			assert(
				runtime.signalsConnected(),
				"connection inconsistency: connect event when not connected",
			);
			this.onConnect(details.clientId);
		});
		runtime.on("disconnect", () => {
			assert(
				!runtime.signalsConnected(),
				"connection inconsistency: disconnect event while still connected",
			);
			this.onDisconnect();
		});

		// Check if already connected at the time of construction.
		if (clientConnectionId !== undefined && runtime.signalsConnected()) {
			this.onConnect(clientConnectionId);
		}
	}

	public onFirstConnection(clientConnectionId: ClientConnectionId): void {
		this.onConnect(clientConnectionId);
	}

	private onConnect(clientConnectionId: ClientConnectionId): void {
		this.systemWorkspace.onConnectionAdded(clientConnectionId);
		this.datastoreManager.joinSession(clientConnectionId);
	}

	private onDisconnect(): void {
		this.datastoreManager.leaveSession();
	}

	public getAttendees(): ReadonlySet<ISessionClient> {
		return this.systemWorkspace.getAttendees();
	}

	public getAttendee(clientId: ClientConnectionId | ClientSessionId): ISessionClient {
		return this.systemWorkspace.getAttendee(clientId);
	}

	public getMyself(): ISessionClient {
		return this.systemWorkspace.getMyself();
	}

	public getStates<TSchema extends PresenceStatesSchema>(
		workspaceAddress: PresenceWorkspaceAddress,
		requestedContent: TSchema,
	): PresenceStates<TSchema> {
		return this.datastoreManager.getWorkspace(`s:${workspaceAddress}`, requestedContent);
	}

	public getNotifications<TSchema extends PresenceStatesSchema>(
		workspaceAddress: PresenceWorkspaceAddress,
		requestedContent: TSchema,
	): PresenceStates<TSchema> {
		return this.datastoreManager.getWorkspace(`n:${workspaceAddress}`, requestedContent);
	}

	/**
	 * Check for Presence message and process it.
	 *
	 * @param address - Address of the message
	 * @param message - Message to be processed
	 * @param local - Whether the message originated locally (`true`) or remotely (`false`)
	 */
	public processSignal(address: string, message: IExtensionMessage, local: boolean): void {
		this.datastoreManager.processSignal(message, local);
	}
}

/**
 * Helper for Presence Manager setup
 *
 * Presence Manager is outermost layer of the presence system and has two main
 * sub-components:
 * 1. PresenceDatastoreManager: Manages the unified general data for states and
 * registry for workspaces.
 * 2. SystemWorkspace: Custom internal workspace for system states including
 * attendee management. It is registered with the PresenceDatastoreManager.
 */
function setupSubComponents(
	clientSessionId: ClientSessionId,
	runtime: IEphemeralRuntime,
	events: IEmitter<PresenceEvents>,
	logger: ITelemetryLoggerExt | undefined,
): [PresenceDatastoreManager, SystemWorkspace] {
	const systemWorkspaceDatastore: SystemWorkspaceDatastore = {
		clientToSessionId: {},
	};
	const systemWorkspaceConfig = createSystemWorkspace(
		clientSessionId,
		systemWorkspaceDatastore,
		events,
	);
	const datastoreManager = new PresenceDatastoreManagerImpl(
		clientSessionId,
		runtime,
		systemWorkspaceConfig.workspace.getAttendee.bind(systemWorkspaceConfig.workspace),
		logger,
		systemWorkspaceDatastore,
		systemWorkspaceConfig.statesEntry,
	);
	return [datastoreManager, systemWorkspaceConfig.workspace];
}

/**
 * Instantiates Presence Manager
 *
 * @internal
 */
export function createPresenceManager(
	runtime: IEphemeralRuntime,
	{
		clientConnectionId,
		clientSessionId = createSessionId() as ClientSessionId,
	}: {
		clientConnectionId: ClientConnectionId | undefined;
		clientSessionId?: ClientSessionId;
	},
): IPresence & PresenceExtensionInterface & FirstConnectionWorkaround {
	return new PresenceManager(runtime, clientConnectionId, clientSessionId);
}
