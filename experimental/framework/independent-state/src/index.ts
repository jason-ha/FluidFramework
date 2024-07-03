/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

export type { ClientId } from "./baseTypes.js";

export type {
	IndependentMap,
	IndependentMapEntries,
	IndependentMapEntry,
	IndependentMapMethods,
	IndependentMapSchema,
} from "./types.js";

export type { Events, IsEvent, ISubscribable } from "./events.js";

export {
	createIndependentMap,
	type IFluidEphemeralDataStoreRuntime,
} from "./independentMap.js";

export { IndependentMapFactory } from "./independentMapFactory.js";

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
import type * as InternalTypes from "./exposedInternalTypes.js";
/**
 * @beta
 */
// eslint-disable-next-line unicorn/prefer-export-from
export { InternalTypes };
// eslint-disable-next-line no-restricted-syntax
export type * from "./exposedUtilityTypes.js";
