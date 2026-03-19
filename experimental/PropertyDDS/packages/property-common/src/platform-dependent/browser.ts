/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Create an array with random uint32 values
 *
 * @param {number} length - size of a new array
 * @return {Uint32Array} - an array with random values
 */
function generateRandomUInt32Array(length: number): Uint32Array {
	const array = new Uint32Array(length);
	// eslint-disable-next-line @typescript-eslint/strict-boolean-expressions, @typescript-eslint/no-explicit-any -- preserve original code for IE 11 support
	const crypto = window.crypto || (window as any).msCrypto; // IE 11 support
	crypto.getRandomValues(array);
	return array;
}

export { generateRandomUInt32Array };
