/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import type { ClientId } from "./baseTypes.js";
import { ValueDirectoryOrState } from "./exposedInternalTypes.js";

/**
 * @internal
 */
export interface ValueManager<
	TValue,
	TValueState extends ValueDirectoryOrState<TValue> = ValueDirectoryOrState<TValue>,
> {
	get value(): TValueState;
	update(clientId: ClientId, received: number, value: TValueState): void;
}
