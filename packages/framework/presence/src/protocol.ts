/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import type { InternalUtilityTypes } from "@fluidframework/core-interfaces/internal/exposedUtilityTypes";
import type { IInboundSignalMessage } from "@fluidframework/runtime-definitions/internal";

import type { ClientConnectionId } from "./baseTypes.js";
import type { ClientSessionId } from "./presence.js";
import type { ClientUpdateEntry } from "./presenceStates.js";
import type { SystemWorkspaceDatastore } from "./systemWorkspace.js";

/**
 * @internal
 */
export interface SystemDatastore {
	"system:presence": SystemWorkspaceDatastore;
}

/**
 * @internal
 */
export interface GeneralDatastoreMessageContent {
	[WorkspaceAddress: string]: {
		[StateValueManagerKey: string]: {
			[ClientSessionId: ClientSessionId]: ClientUpdateEntry;
		};
	};
}

type DatastoreMessageContent = InternalUtilityTypes.FlattenIntersection<
	GeneralDatastoreMessageContent & SystemDatastore
>;

/**
 * @internal
 */
export const datastoreUpdateMessageType = "Pres:DatastoreUpdate";
/**
 * @internal
 */
export interface DatastoreUpdateMessage extends IInboundSignalMessage {
	type: typeof datastoreUpdateMessageType;
	content: {
		sendTimestamp: number;
		avgLatency: number;
		isComplete?: true;
		data: DatastoreMessageContent;
	};
}

/**
 * @internal
 */
export const joinMessageType = "Pres:ClientJoin";
/**
 * @internal
 */
export interface ClientJoinMessage extends IInboundSignalMessage {
	type: typeof joinMessageType;
	content: {
		updateProviders: ClientConnectionId[];
		sendTimestamp: number;
		avgLatency: number;
		data: DatastoreMessageContent;
	};
}
