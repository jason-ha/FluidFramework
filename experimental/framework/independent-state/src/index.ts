/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

export type { ConnectedClientId } from "./baseTypes.js";

export type { Events, IsEvent, ISubscribable } from "./events.js";

export type {
	PresenceStates,
	PresenceWorkspaceAddress,
	PresenceStatesEntries,
	PresenceStatesEntry,
	PresenceStatesMethods,
	PresenceStatesSchema,
} from "./types.js";

export type { IPresence, ISessionClient } from "./presence.js";

// Consider not exporting this internal type.
export { type IEphemeralRuntime } from "./presenceManager.js";

export { acquirePresence } from "./experimentalAccess.js";

export {
	acquirePresenceViaDataObject,
	type ExperimentalPresenceDO,
	ExperimentalPresenceManager,
} from "./datastorePresenceManagerFactory.js";

export type { LatestValueControls } from "./latestValueControls.js";
export {
	LatestMap,
	type LatestMapItemRemovedClientData,
	type LatestMapItemValueClientData,
	type LatestMapValueClientData,
	type LatestMapValueManager,
	type LatestMapValueManagerEvents,
	type MapValueState,
	type ValueMap,
} from "./latestMapValueManager.js";
export {
	Latest,
	type LatestValueManager,
	type LatestValueManagerEvents,
} from "./latestValueManager.js";
export type {
	LatestValueClientData,
	LatestValueData,
	LatestValueMetadata,
} from "./latestValueTypes.js";

export {
	type NotificationEmitter,
	type NotificationSubscribable,
	type NotificationSubscriptions,
	Notifications,
	type NotificationsManager,
	type NotificationsManagerEvents,
} from "./notificationsManager.js";

// Below here are things that are used by the above, but not part of the desired API surface.
// eslint-disable-next-line no-restricted-syntax
export type * from "./exposedInternalTypes.js";
// eslint-disable-next-line no-restricted-syntax
export type * from "./exposedUtilityTypes.js";