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

export type { JsonDeserializedTypeWith, JsonDeserialized } from "./jsonDeserialized.js";

export type { JsonEncodableTypeWith, JsonEncodable } from "./jsonEncodable.js";

export { createIndependentMap, type IFluidEphemeralDataStoreRuntime } from "./independentMap.js";

export { type EmptyIndependentMap, IndependentMapDO } from "./independentMapDataObject.js";

export {
	Latest,
	type LatestValueClientData,
	type LatestValueData,
	type LatestValueManager,
	type LatestValueManagerEvents,
	type LatestValueMetadata,
} from "./latestValueManager.js";

// Below here are things that are used by the above, but not part of the desired API surface.
import type * as InternalTypes from "./exposedInternalTypes.js";
export { InternalTypes };
import type * as InternalUtilityTypes from "./exposedUtilityTypes.js";
export { InternalUtilityTypes };