/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import type { ClientId, RoundTrippable } from "./types.js";

/**
 * @alpha
 */
export interface ValueState<TValue> {
	rev: number;
	timestamp: number;
	value: RoundTrippable<TValue>;
}

/**
 * @alpha
 */
export type ValueStateDirectory<T> =
	| ValueState<T>
	| { [Subdirectory: string | number]: ValueStateDirectory<T> };

/**
 * @internal
 */
export interface ClientRecord<TValue extends ValueStateDirectory<any>> {
	[ClientId: ClientId]: TValue;
}

/**
 * @internal
 */
export interface ValueManager<
	TValue,
	TValueState extends ValueStateDirectory<TValue> = ValueStateDirectory<TValue>,
> {
	get value(): TValueState;
	update(clientId: ClientId, received: number, value: TValueState): void;
}
