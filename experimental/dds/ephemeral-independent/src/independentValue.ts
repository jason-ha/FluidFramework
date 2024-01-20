/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import type { ValueManager, ValueStateDirectory } from "./internalTypes.js";
import type { IndependentValue } from "./types.js";

/**
 * @internal
 */
export function brandIVM<
	TManagerInterface,
	TValue,
	TValueState extends ValueStateDirectory<TValue>,
>(
	manager: TManagerInterface & ValueManager<TValue, TValueState>,
): IndependentValue<TManagerInterface> {
	return manager as TManagerInterface as IndependentValue<TManagerInterface>;
}

/**
 * @internal
 */
export function unbrandIVM<
	TManagerInterface,
	TValue,
	TValueState extends ValueStateDirectory<TValue>,
>(branded: IndependentValue<TManagerInterface>): ValueManager<TValue, TValueState> {
	return branded as unknown as ValueManager<TValue, TValueState>;
}
