/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

export type { ClientConnectionId } from "./baseTypes.js";

export type { BroadcastControls, BroadcastControlSettings } from "./broadcastControlsTypes.js";

export type { InternalTypes } from "./exposedInternalTypes.js";

export type { InternalUtilityTypes } from "./exposedUtilityTypes.js";

export type {
	KeySchemaValidator,
	LatestMap,
	LatestMapArguments,
	LatestMapArgumentsRaw,
	LatestMapClientData,
	LatestMapEvents,
	LatestMapFactory,
	LatestMapItemRemovedClientData,
	LatestMapItemUpdatedClientData,
	LatestMapRaw,
	LatestMapRawEvents,
	StateMap,
} from "./latestMapTypes.js";

export type {
	Latest,
	LatestArguments,
	LatestArgumentsRaw,
	LatestEvents,
	LatestFactory,
	LatestRaw,
	LatestRawEvents,
} from "./latestTypes.js";

export type {
	Accessor,
	LatestClientData,
	LatestData,
	LatestMetadata,
	ProxiedValueAccessor,
	RawValueAccessor,
	StateSchemaValidator,
	ValueAccessor,
} from "./latestValueTypes.js";

export type {
	NotificationsManager,
	NotificationsManagerEvents,
	NotificationListenable,
	NotificationEmitter,
	NotificationSubscriberSignatures,
} from "./notificationsManagerTypes.js";

export type {
	Attendee,
	AttendeeId,
	AttendeesEvents,
	Presence,
	PresenceEvents,
	PresenceWithNotifications,
} from "./presence.js";
export { AttendeeStatus } from "./presence.js";

export type {
	AnyWorkspace,
	NotificationsWorkspace,
	NotificationsWorkspaceSchema,
	StatesWorkspace,
	StatesWorkspaceEntries,
	StatesWorkspaceEntry,
	StatesWorkspaceSchema,
	WorkspaceAddress,
} from "./types.js";
