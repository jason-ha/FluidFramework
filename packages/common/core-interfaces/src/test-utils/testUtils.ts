/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import type { InternalUtilityTypes } from "../exposedInternalUtilityTypes.js";

/**
 * Use to compile-time assert types of two variables are identical.
 *
 * @remarks Note that this has not been found to be reliable when one of the
 * types (especially first type) is `{}` (which is a special type and may be
 * produced during type manipulation intentionally or not).
 */
export function assertIdenticalTypes<const T, const U>(
	_actual: T & InternalUtilityTypes.IfSameType<T, U>,
	_expected: U & InternalUtilityTypes.IfSameType<T, U>,
): InternalUtilityTypes.IfSameType<T, U> {
	return undefined as InternalUtilityTypes.IfSameType<T, U>;
}

/**
 * Creates a non-viable (`undefined`) instance of type T to be used for type checking.
 */
export function createInstanceOf<T>(): T {
	return undefined as T;
}
