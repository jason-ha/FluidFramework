/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import type { ClientId } from "./baseTypes.js";
import { ValueStateDirectory } from "./exposedInternalTypes.js";

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
