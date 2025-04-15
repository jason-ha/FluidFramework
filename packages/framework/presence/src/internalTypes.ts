/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import type { ExtensionRuntime } from "@fluidframework/container-definitions/internal";

import type { InternalTypes } from "./exposedInternalTypes.js";
import type { ClientSessionId, ISessionClient } from "./presence.js";
import type { ClientJoinMessage, DatastoreUpdateMessage } from "./protocol.js";

/**
 * @internal
 */
export interface ClientRecord<TValue extends InternalTypes.ValueDirectoryOrState<unknown>> {
	// Caution: any particular item may or may not exist
	// Typescript does not support absent keys without forcing type to also be undefined.
	// See https://github.com/microsoft/TypeScript/issues/42810.
	[ClientSessionId: ClientSessionId]: TValue;
}

/**
 * This interface is a subset of (IContainerRuntime & IRuntimeInternal) and
 * (IFluidDataStoreRuntime) that is needed by the Presence States.
 *
 * @privateRemarks
 * Replace with non-DataStore based interface.
 *
 * @internal
 */
export type IEphemeralRuntime = Omit<ExtensionRuntime, "logger" | "submitAddressedSignal"> &
	// Apart from tests, there is always a logger. So this could be promoted to required.
	Partial<Pick<ExtensionRuntime, "logger">> & {
		/**
		 * Submits the signal to be sent to other clients.
		 * @param type - Type of the signal.
		 * @param content - Content of the signal. Should be a JSON serializable object or primitive.
		 * @param targetClientId - When specified, the signal is only sent to the provided client id.
		 */
		submitSignal: (
			message: Omit<ClientJoinMessage | DatastoreUpdateMessage, "clientId">,
		) => void;
	};

/**
 * @internal
 */
export interface ValueManager<
	TValue,
	TValueState extends
		InternalTypes.ValueDirectoryOrState<TValue> = InternalTypes.ValueDirectoryOrState<TValue>,
> {
	// Most value managers should provide value - implement Required<ValueManager<...>>
	readonly value?: TValueState;
	update(client: ISessionClient, received: number, value: TValueState): PostUpdateAction[];
}

/**
 * @internal
 */
export type PostUpdateAction = () => void;
