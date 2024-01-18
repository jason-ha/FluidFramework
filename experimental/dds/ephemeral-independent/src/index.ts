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
