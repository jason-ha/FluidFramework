/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import { strict as assert } from "node:assert";

// import type { JsonDeserialized } from "@fluidframework/core-interfaces/internal";
import {
	assertIdenticalTypes,
	createInstanceOf,
} from "@fluidframework/core-interfaces/internal/test-utils";

import { objectEntries, objectEntriesWithoutUndefined, objectKeys } from "../typedObject.js";

interface VeryIndexedType {
	[number: number]: `${number}`;
	[string: string]: string | undefined;
	// [symbol: symbol]: "symbol";
	[templateWithNumber: `number_${number}`]: `number_${number}`;
	[templateWithString: `string_${string}`]: `string_${string}`;
	[templateWithBigint: `bigint_${bigint}`]: `bigint_${bigint}`;
	known: "known";
	optional?: "optional";
	0: "0";
	undefined: undefined;
	optionalUndefined?: undefined;
}

// eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
interface VeryIndexedTypeWithSymbolIndex extends VeryIndexedType {
	[symbol: symbol]: "symbol";
}

// interface MapValueState<T, Keys extends string /* | number */> {
// 	rev: number;
// 	items: {
// 		0: JsonDeserialized<T>;
// 	};
// }

const testSymbol = Symbol("testSymbol");

const veryIndexedObjectMightHaveSymbol: VeryIndexedTypeWithSymbolIndex = {
	known: "known",
	0: "0",
	undefined,
	[testSymbol]: "symbol",
};
const veryIndexedObjectWithoutSymbol: VeryIndexedType = veryIndexedObjectMightHaveSymbol;

const testObjectWithNumberAndSymbolKeys = {
	[testSymbol]: "symbol_value",
	0: "zero",
	1: "one",
	"2": "two",
};

const basicPropertyBag: {
	known: "known_value";
	optional?: "optional_value";
	0: "zero";
	[symbol: symbol]: "symbol_value";
} = {
	known: "known_value",
	// optional: "optional_value",
	0: "zero",
	[testSymbol]: "symbol_value",
};

const arrayLength5Without4thIndex = [1, undefined, 3];
arrayLength5Without4thIndex[4] = 5;

describe.only("Typed Object helpers", () => {
	describe("assumptions", () => {
		it("Object.keys returns strings skipping symbols and array gaps", () => {
			const keys = Object.keys(testObjectWithNumberAndSymbolKeys);
			assert.deepStrictEqual(keys, ["0", "1", "2"]);
			const arrKeys = Object.keys(arrayLength5Without4thIndex);
			assert.deepStrictEqual(arrKeys, ["0", "1", "2", "4"]);
		});
	});

	describe("objectEntries", () => {
		it("over object returns array of object's known keys and value types as tuple", () => {
			const expectedEntriesTypes =
				createInstanceOf<
					(
						| [number: `${number}`, `${number}`]
						| [string: string, string | undefined]
						| [templateWithNumber: `number_${number}`, `number_${number}`]
						| [templateWithString: `string_${string}`, `string_${string}`]
						| [templateWithBigint: `bigint_${bigint}`, `bigint_${bigint}`]
						| ["known", "known"]
						| ["optional", "optional"]
						| ["0", "0"]
						| ["undefined", undefined]
						| ["optionalUndefined", undefined]
					)[]
				>();
			const expectedEntriesRuntime = [
				["0", "0"],
				["known", "known"],
				["undefined", undefined],
			];

			const entriesMightHaveSymbol = objectEntries(veryIndexedObjectMightHaveSymbol);
			assertIdenticalTypes(entriesMightHaveSymbol, expectedEntriesTypes);
			assert.deepStrictEqual(entriesMightHaveSymbol, expectedEntriesRuntime);

			const entriesNoSymbol = objectEntries(veryIndexedObjectWithoutSymbol);
			assertIdenticalTypes(entriesNoSymbol, expectedEntriesTypes);
			assert.deepStrictEqual(entriesNoSymbol, expectedEntriesRuntime);
		});

		// it("can be used in a generic context", <T, Keys extends string /* | number*/>() => {
		// 	// const genericFn = (s: MapValueState<T, Keys>) => {
		// 	const s = {rev: 0, items: {}} as MapValueState<T, Keys>;
		// 		const entries = objectEntries(s.items);
		// 		type Check = keyof typeof s.items;
		// 		assertIdenticalTypes(
		// 			entries,
		// 			createInstanceOf<
		// 				(
		// 					| [keyof typeof s.items, JsonDeserialized<"T">]
		// 					// | [name: string, JsonDeserialized<"T">]
		// 					// | [name: number, JsonDeserialized<T>]
		// 				)[]
		// 			>(),
		// 		);
		// 	});
	});

	describe("objectEntriesWithoutUndefined", () => {
		it("over object returns array of object's known keys and value types as tuple omitting undefined values and entries where value is only undefined", () => {
			const expectedEntriesTypes =
				createInstanceOf<
					(
						| [number: `${number}`, `${number}`]
						| [string: string, string]
						| [templateWithNumber: `number_${number}`, `number_${number}`]
						| [templateWithString: `string_${string}`, `string_${string}`]
						| [templateWithBigint: `bigint_${bigint}`, `bigint_${bigint}`]
						| ["known", "known"]
						| ["optional", "optional"]
						| ["0", "0"]
					)[]
				>();
			const expectedEntriesRuntime = [
				["0", "0"],
				["known", "known"],
				["undefined", undefined],
			];

			const entriesMightHaveSymbol = objectEntriesWithoutUndefined(
				veryIndexedObjectMightHaveSymbol,
			);
			assertIdenticalTypes(entriesMightHaveSymbol, expectedEntriesTypes);
			assert.deepStrictEqual(entriesMightHaveSymbol, expectedEntriesRuntime);

			const entriesNoSymbol = objectEntriesWithoutUndefined(veryIndexedObjectWithoutSymbol);
			assertIdenticalTypes(entriesNoSymbol, expectedEntriesTypes);
			assert.deepStrictEqual(entriesNoSymbol, expectedEntriesRuntime);
		});
	});

	describe("objectKeys", () => {
		it("over object with string index returns array of keyof object type", () => {
			const mightHaveSymbolKeys = objectKeys(veryIndexedObjectMightHaveSymbol);
			assertIdenticalTypes(mightHaveSymbolKeys, createInstanceOf<(string | number)[]>());

			const noSymbolKeys = objectKeys(veryIndexedObjectWithoutSymbol);
			assertIdenticalTypes(
				noSymbolKeys,
				createInstanceOf<(keyof typeof veryIndexedObjectWithoutSymbol)[]>(),
			);
		});

		it("over object without string index returns array of object's known keys as string", () => {
			const keys = objectKeys(basicPropertyBag);

			assertIdenticalTypes(keys, createInstanceOf<("known" | "optional" | "0")[]>());
			assert.deepStrictEqual(keys, ["0", "known"]);
		});

		it("over object without string index returns array of object's known keys as string", () => {
			const keys = objectKeys(arrayLength5Without4thIndex);

			assertIdenticalTypes(keys, createInstanceOf<`${bigint}`[]>());
			assert.deepStrictEqual(keys, ["0", "1", "2", "4"]);
		});
	});
});
