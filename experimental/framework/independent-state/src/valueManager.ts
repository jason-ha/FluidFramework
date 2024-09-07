/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import type { InternalTypes } from "./exposedInternalTypes.js";
import type { ValueManager } from "./internalTypes.js";

/**
 * Given a value manager, return opaque InternalTypes.IndependentValue.
 *
 * @internal
 */
export function brandIVM<
	TManagerInterface,
	TValue,
	TValueState extends InternalTypes.ValueDirectoryOrState<TValue>,
>(
	manager: TManagerInterface & ValueManager<TValue, TValueState>,
): InternalTypes.StateValue<TManagerInterface> {
	return manager as TManagerInterface as InternalTypes.StateValue<TManagerInterface>;
}

/**
 * Extract the value manager from an opaque InternalTypes.IndependentValue.
 *
 * @internal
 */
export function unbrandIVM<
	TManagerInterface,
	TValue,
	TValueState extends InternalTypes.ValueDirectoryOrState<TValue>,
>(branded: InternalTypes.StateValue<TManagerInterface>): ValueManager<TValue, TValueState> {
	return branded as unknown as ValueManager<TValue, TValueState>;
}
