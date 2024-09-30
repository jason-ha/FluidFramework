/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

/*
 * Hacky support for internal datastore based usages.
 */

import { ConnectionState } from "@fluidframework/container-loader";
import type { IFluidLoadable } from "@fluidframework/core-interfaces";
import { assert } from "@fluidframework/core-utils/internal";
import type { FluidDataStoreRuntime } from "@fluidframework/datastore/internal";
import type { IFluidContainer } from "@fluidframework/fluid-static";
import type {
	IFluidDataStoreContext,
	IInboundSignalMessage,
} from "@fluidframework/runtime-definitions/internal";
import type { SharedObjectKind } from "@fluidframework/shared-object-base";

import type { ClientConnectionId } from "./baseTypes.js";
import { BasicDataStoreFactory, LoadableFluidObject } from "./datastoreSupport.js";
import type { IEphemeralRuntime } from "./internalTypes.js";
import type { IPresence } from "./presence.js";
import { createPresenceManager } from "./presenceManager.js";

import type { IExtensionMessage } from "@fluid-experimental/presence/internal/container-definitions/internal";

function assertSignalMessageIsValid(
	message: IInboundSignalMessage | IExtensionMessage,
): asserts message is IExtensionMessage {
	assert(message.clientId !== null, 0xa58 /* Signal must have a client ID */);
	// The other difference between messages is that `content` for
	// IExtensionMessage is JsonDeserialized and we are fine assuming that.
}

/**
 * Simple FluidObject holding Presence Manager.
 */
class PresenceManagerDataObject extends LoadableFluidObject {
	// Creation of presence manager is deferred until first acquisition to avoid
	// instantiations and stand-up by Summarizer that has no actual use.
	private _presenceManager: IPresence | undefined;

	public constructor(
		runtime: FluidDataStoreRuntime,
		private readonly context: IFluidDataStoreContext,
	) {
		super(runtime);
	}

	public presenceManager(fluidContainer: IFluidContainer): IPresence {
		if (!this._presenceManager) {
			// TODO: investigate if ContainerExtensionStore (path-based address routing for
			// Signals) is readily detectable here and use that presence manager directly.
			const { containerRuntime, deltaManager } = this.context;
			// Connection status is very complicated as runtime evolved to focus on
			// ops for connectivity, including the difference between a connected
			// socket and being caught up. For signalling we care about basic socket
			// connectivity and do not want to wait for catch-up. However, access to
			// clientId (ClientConnectionId) is even more hidden than connection state
			// that can be gleaned from the container. When signals are connected (as
			// seen by connectionState being Connected or CatchingUp) but ops are not
			// (any state but Connected), we are in a situation where we can't
			// determine the clientId and won't get a "connect" event from deltaManager.
			// So pretend that we are not connected until we get the first connection.
			let needsFirstConnection = fluidContainer.connectionState === ConnectionState.CatchingUp;
			const ephemeralRuntime = {
				logger: containerRuntime.baseLogger,
				signalsConnected: () =>
					!needsFirstConnection &&
					(fluidContainer.connectionState === ConnectionState.Connected ||
						fluidContainer.connectionState === ConnectionState.CatchingUp),
				on: deltaManager.on.bind(deltaManager),
				off: deltaManager.off.bind(deltaManager),
				// eslint-disable-next-line unicorn/consistent-destructuring
				getQuorum: this.context.getQuorum.bind(this.context),
				submitSignal: containerRuntime.submitSignal.bind(containerRuntime),
			} satisfies IEphemeralRuntime;
			const manager = createPresenceManager(ephemeralRuntime, {
				clientConnectionId: this.runtime.clientId,
			});
			if (needsFirstConnection) {
				// Register for single "connected" event to get the clientId.
				this.runtime.once("connected", (clientId: ClientConnectionId) => {
					// Check for race with a "disconnect" event (below).
					if (needsFirstConnection) {
						needsFirstConnection = false;
						manager.onFirstConnection(clientId);
					}
				});
				// A single "disconnect" event is also sufficient to ensure we
				// are in a state where clientId may always be available.
				deltaManager.once("disconnect", () => {
					needsFirstConnection = false;
				});
			}
			containerRuntime.on("signal", (message: IInboundSignalMessage, local: boolean) => {
				assertSignalMessageIsValid(message);
				manager.processSignal("", message, local);
			});
			this._presenceManager = manager;
		}
		return this._presenceManager;
	}
}

/**
 * Factory class to create {@link IPresence} in own data store.
 */
class PresenceManagerFactory {
	public is(value: IFluidLoadable | ExperimentalPresenceDO): value is ExperimentalPresenceDO {
		return value instanceof PresenceManagerDataObject;
	}

	public readonly factory = new BasicDataStoreFactory(
		"@fluid-experimental/presence",
		PresenceManagerDataObject,
	);
}

/**
 * Brand for Experimental Presence Data Object.
 *
 * @remarks
 * See {@link acquirePresenceViaDataObject} for example usage.
 *
 * @sealed
 * @alpha
 */
export declare class ExperimentalPresenceDO {
	private readonly _self: ExperimentalPresenceDO;
}

/**
 * DataStore based Presence Manager that is used as fallback for preferred Container
 * Extension based version requires registration. Export SharedObjectKind for registration.
 *
 * @alpha
 */
export const ExperimentalPresenceManager =
	new PresenceManagerFactory() as unknown as SharedObjectKind<
		IFluidLoadable & ExperimentalPresenceDO
	>;

/**
 * Acquire IPresence from a DataStore based Presence Manager
 *
 * @example
 * ```typescript
 * const containerSchema = {
 * 	initialObjects: {
 * 		experimentalPresence: ExperimentalPresenceDO,
 * 	},
 * } satisfies ContainerSchema;
 * ```
 * then
 * ```typescript
 * const presence = acquirePresenceViaDataObject(
 * 	container.initialObjects.experimentalPresence,
 * 	);
 * ```
 *
 * @alpha
 */
export function acquirePresenceViaDataObject(
	fluidContainer: IFluidContainer,
	fluidLoadable: ExperimentalPresenceDO,
): IPresence {
	if (fluidLoadable instanceof PresenceManagerDataObject) {
		return fluidLoadable.presenceManager(fluidContainer);
	}

	throw new Error("Incompatible loadable; make sure to use ExperimentalPresenceManager");
}
