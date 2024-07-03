/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import type { ClientId } from "./baseTypes.js";
import type { InternalTypes } from "./exposedInternalTypes.js";

/**
 * @internal
 */
export interface ClientRecord<TValue extends InternalTypes.ValueDirectoryOrState<unknown>> {
	// Caution: any particular item may or may not exist
	// Typescript does not support absent keys without forcing type to also be undefined.
	// See https://github.com/microsoft/TypeScript/issues/42810.
	[ClientId: ClientId]: TValue;
}

/**
 * @internal
 */
export interface ValueManager<
	TValue,
	TValueState extends
		InternalTypes.ValueDirectoryOrState<TValue> = InternalTypes.ValueDirectoryOrState<TValue>,
> {
	get value(): TValueState;
	update(clientId: ClientId, received: number, value: TValueState): void;
}
