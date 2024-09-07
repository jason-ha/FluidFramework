/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import type { JsonDeserialized } from "@fluidframework/core-interfaces/internal";

import type { ConnectedClientId } from "./baseTypes.js";
import type { InternalUtilityTypes } from "./exposedUtilityTypes.js";

/**
 * Metadata for the value state.
 *
 * @beta
 */
export interface LatestValueMetadata {
	/**
	 * The revision number for value that increases as value is changed.
	 */
	revision: number;
	/**
	 * Local time when the value was last updated.
	 * @remarks Currently this is a placeholder for future implementation.
	 */
	timestamp: number;
}

/**
 * State of a value and its metadata.
 *
 * @beta
 */
export interface LatestValueData<T> {
	value: InternalUtilityTypes.FullyReadonly<JsonDeserialized<T>>;
	metadata: LatestValueMetadata;
}

/**
 * State of a specific client's value and its metadata.
 *
 * @beta
 */
export interface LatestValueClientData<T> extends LatestValueData<T> {
	clientId: ConnectedClientId;
}
