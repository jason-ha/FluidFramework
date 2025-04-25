/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * JSON.stringify replacer function that replaces `bigint` values with a string representation.
 */
export function replaceBigInt(_key: string, value: unknown): unknown {
	if (typeof value === "bigint") {
		return `<bigint>${value.toString()}</bigint>`;
	}
	return value;
}

/**
 * JSON.parse reviver function that instantiates `bigint` values from specfic string representation.
 */
export function reviveBigInt(_key: string, value: unknown): unknown {
	if (
		typeof value === "string" &&
		value.startsWith("<bigint>") &&
		value.endsWith("</bigint>")
	) {
		return BigInt(value.slice(8, -9));
	}
	return value;
}
