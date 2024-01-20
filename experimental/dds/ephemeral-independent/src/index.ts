/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

export type {
	ClientId,
	IndependentDatastoreHandle,
	IndependentMap,
	IndependentMapMethods,
	IndependentMapEntry,
	IndependentMapSchema,
	IndependentMapKeys,
	IndependentValue,
	IndependentValueBrand,
	ManagerFactory,
	RoundTrippable,
} from "./types.js";

export {
	type EmptyIndependentMap,
	EphemeralIndependentDirectory,
} from "./ephemeralIndependentDirectory.js";

export {
	Latest,
	type LatestValueClientData,
	type LatestValueData,
	type LatestValueManager,
	type LatestValueManagerEvents,
	type LatestValueMetadata,
} from "./latestValueManager.js";

// Below here are things that are used by the above, but not part of the desired API surface.
// TODO: Make these internal types look more internal. API-extractor has
// issue https://github.com/microsoft/rushstack/issues/3639 that will cause non-public types
// to appear as public using the below syntax.
// import type * as InternalTypes from "./internalTypes.js";
// export { InternalTypes };
export { ValueState, ValueStateDirectory } from "./internalTypes.js";
