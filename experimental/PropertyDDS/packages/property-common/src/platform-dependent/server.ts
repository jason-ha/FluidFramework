/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

// eslint-disable-next-line import-x/no-nodejs-modules
import * as crypto from "node:crypto";

/**
 * Create an array with random uint32 values
 *
 * @param {number} length - size of a new array
 * @return {readonly number[] | Uint32Array} - an array with random values
 */
function generateRandomUInt32Array(length: number): readonly number[] | Uint32Array {
	const buffer = Buffer.alloc(length * 4);
	crypto.randomFillSync(buffer);
	return Array.from({ length }, (_, i) => buffer.readUIntBE(i * 4, 4));
}

export { generateRandomUInt32Array };
