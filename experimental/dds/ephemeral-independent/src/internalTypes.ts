/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import type { ClientId, RoundTrippable } from "./types.js";

/**
 * @internal
 */
export interface ValueState<TValue> {
	rev: number;
	timestamp: number;
	value: RoundTrippable<TValue>;
}

/**
 * @internal
 */
export interface ValueElement<TValue> {
	[Id: string]: ValueState<TValue>;
}

/**
 * @internal
 */
export interface ValueManager<TValue> {
	get value(): ValueState<TValue>;
	update(
		clientId: ClientId,
		revision: number,
		timestamp: number,
		value: RoundTrippable<TValue>,
	): void;
}
