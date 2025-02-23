/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import type { AzureUser } from "@fluidframework/azure-client/internal";
import type {
	JsonDeserialized,
	JsonSerializable,
} from "@fluidframework/core-interfaces/internal";
// eslint-disable-next-line import/no-internal-modules
import type { ClientSessionId } from "@fluidframework/presence/alpha";

type OrchestratorMessage = ConnectCommand | DisconnectSelfCommand;

interface ConnectCommand {
	command: "connect";
	user: AzureUser;
	containerId?: string;
}

interface DisconnectSelfCommand {
	command: "disconnectSelf";
}

type ActorMessage =
	| AttendeeDisconnectedEvent
	| AttendeeJoinedEvent
	| ReadyEvent
	| DisconnectedSelfEvent
	| ErrorEvent;
interface AttendeeDisconnectedEvent {
	event: "attendeeDisconnected";
	sessionId: ClientSessionId;
}

interface AttendeeJoinedEvent {
	event: "attendeeJoined";
	sessionId: ClientSessionId;
}

interface ReadyEvent {
	event: "ready";
	containerId: string;
	sessionId: ClientSessionId;
}

interface DisconnectedSelfEvent {
	event: "disconnectedSelf";
	sessionId: ClientSessionId;
}

interface ErrorEvent {
	event: "error";
	error: string;
}

// Actor messages sent and received
export type ActorMessageToOrchestrator = JsonSerializable<
	ActorMessage,
	{ AllowExactly: ClientSessionId }
>;
export type ActorMessageFromOrchestrator = JsonDeserialized<
	OrchestratorMessage,
	{ AllowExactly: ClientSessionId }
>;

// Orchestrator messages sent and received
export type OrchestratorMessageToActor = JsonSerializable<
	OrchestratorMessage,
	{ AllowExactly: ClientSessionId }
>;
export type OrchestratorMessageFromActor = JsonDeserialized<
	ActorMessage,
	{ AllowExactly: ClientSessionId }
>;
