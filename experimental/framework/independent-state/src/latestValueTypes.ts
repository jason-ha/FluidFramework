/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import type { ClientId } from "./baseTypes.js";
import type { FullyReadonly } from "./exposedUtilityTypes.js";
import type { JsonDeserialized } from "./jsonDeserialized.js";

/**
 * @beta
 */

export interface LatestValueMetadata {
	revision: number;
	timestamp: number;
}

/**
 * @beta
 */
export interface LatestValueData<T> {
	value: FullyReadonly<JsonDeserialized<T>>;
	metadata: LatestValueMetadata;
}

/**
 * @beta
 */
export interface LatestValueClientData<T> extends LatestValueData<T> {
	clientId: ClientId;
}
