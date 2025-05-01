/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import { strict as assert } from "node:assert";

import {
	assertIdenticalTypes,
	createInstanceOf,
} from "@fluidframework/core-interfaces/internal/test-utils";

import {
	objectEntries,
	objectEntriesWithoutUndefined,
	objectKeys,
	type KeyValuePairs,
} from "../typedObject.js";

interface VeryIndexedType {
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
interface VeryIndexedTypeWithNumberIndex extends VeryIndexedType {
	[number: number]: `${number}`;
}

// eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
interface VeryIndexedTypeWithStringIndex extends VeryIndexedTypeWithNumberIndex {
	[string: string]: string | undefined;
}

// eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
interface VeryIndexedTypeWithSymbolIndex extends VeryIndexedTypeWithNumberIndex {
	[symbol: symbol]: "symbol";
}

// type VeryIndexedTypeWithGenericType<
// 	Keys extends string | number,
// 	Values extends string = "value",
// > = VeryIndexedType & {
// 	[K in Keys as `mapped_${Keys}`]: `mapped_string_or_number_${Values}`;
// };

// // eslint-disable-next-line @typescript-eslint/no-empty-interface
// interface VeryIndexedTypeWithGenericValuesInterface<Values extends string>
// 	extends VeryIndexedTypeWithGenericType<"Keys" | 5345, Values> {}

interface MapValueState<T, Keys extends string | number> {
	rev: number;
	items: {
		[K in Keys as `item_key-${Keys}`]: T;
	};
}

const testSymbol = Symbol("testSymbol");

const testObject = {
	known: "known",
	0: "0",
	undefined,
	[testSymbol]: "symbol",
} as const;

const veryIndexedObjectWithoutNumberStringOrSymbol: VeryIndexedType = testObject;
const veryIndexedObjectWithoutStringOrSymbol: VeryIndexedTypeWithNumberIndex = testObject;
const veryIndexedObjectWithStringIndex: VeryIndexedTypeWithStringIndex = testObject;
const veryIndexedObjectWithSymbolIndex: VeryIndexedTypeWithSymbolIndex = testObject;

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
	// Omit optional:
	// optional: "optional_value",
	0: "zero",
	[testSymbol]: "symbol_value",
};

const arrayLength5Without4thIndex = [1, "undefined", 3];
arrayLength5Without4thIndex[4] = 5;

function acceptObjectAndKey<TObj>(obj: TObj, key: keyof TObj): void {}

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
		it("over object without `string` index returns array of object's known keys and value types as tuple", () => {
			type keyofVeryIndexedTypeWithSymbolIndex = keyof VeryIndexedTypeWithSymbolIndex;
			const expectedEntriesTypes =
				createInstanceOf<
					(
						| [number: `${number}` & keyofVeryIndexedTypeWithSymbolIndex, `${number}`]
						| [
								templateWithNumber: `number_${number}` & keyofVeryIndexedTypeWithSymbolIndex,
								`number_${number}`,
						  ]
						| [
								templateWithString: `string_${string}` & keyofVeryIndexedTypeWithSymbolIndex,
								`string_${string}`,
						  ]
						| [
								templateWithBigint: `bigint_${bigint}` & keyofVeryIndexedTypeWithSymbolIndex,
								`bigint_${bigint}`,
						  ]
						| ["known", "known"]
						| ["optional", "optional"]
						| ["0" & keyofVeryIndexedTypeWithSymbolIndex, "0"]
						| ["undefined", undefined]
						| ["optionalUndefined", undefined]
					)[]
				>();
			const expectedEntriesRuntime = [
				["0", "0"],
				["known", "known"],
				["undefined", undefined],
			];

			const entriesNoSymbol = objectEntries(veryIndexedObjectWithoutStringOrSymbol);
			assertIdenticalTypes(entriesNoSymbol, expectedEntriesTypes);
			assert.deepStrictEqual(entriesNoSymbol, expectedEntriesRuntime);

			for (const [key, value] of entriesNoSymbol) {
				assert.deepStrictEqual(value, veryIndexedObjectWithoutStringOrSymbol[key]);
				acceptObjectAndKey(veryIndexedObjectWithoutStringOrSymbol, key);
			}

			const entriesMightHaveSymbol = objectEntries(veryIndexedObjectWithSymbolIndex);
			assertIdenticalTypes(entriesMightHaveSymbol, expectedEntriesTypes);
			assert.deepStrictEqual(entriesMightHaveSymbol, expectedEntriesRuntime);

			for (const [key, value] of entriesMightHaveSymbol) {
				assert.deepStrictEqual(value, veryIndexedObjectWithSymbolIndex[key]);
				acceptObjectAndKey(veryIndexedObjectWithSymbolIndex, key);
			}
		});

		it("over object with `string` index returns array of object's known keys and value types as tuple", () => {
			// Don't need `& keyofVeryIndexedTypeWithStringIndex` below because any `string` is a keyof
			// type keyofVeryIndexedTypeWithStringIndex = keyof VeryIndexedTypeWithStringIndex;
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

			const entries = objectEntries(veryIndexedObjectWithStringIndex);
			assertIdenticalTypes(entries, expectedEntriesTypes);
			assert.deepStrictEqual(entries, expectedEntriesRuntime);

			// Note that if `kvp` were split into `[key,value]`, the type of `key` would be `string`
			// as the string index covers all key types.
			for (const kvp of entries) {
				assertIdenticalTypes(kvp[0], createInstanceOf<string>());
				assert.deepStrictEqual(kvp[1], veryIndexedObjectWithStringIndex[kvp[0]]);
				acceptObjectAndKey(veryIndexedObjectWithStringIndex, kvp[0]);
			}
		});

		describe("known limitations", () => {
			// In a generic context the remapping expression cannot be fully resolved.
			// The result appears to be the expression reduced by what knowns there are.
			it("cannot be effectively used in a generic context", <T, Keys extends string>() => {
				// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
				const s = {
					rev: 0,
					items: { ["item_key-foo" as `item_key-${Keys}`]: undefined as unknown as T },
				} as MapValueState<T, Keys>;
				const entries = objectEntries(s.items);

				assertIdenticalTypes(
					// @ts-expect-error result cannot even be matched to alternatively generated type
					// that matches what IntelliSense shows.
					entries,
					createInstanceOf<KeyValuePairs<{ [K in Keys as `item_key-${Keys}`]: T }>>(),
				);

				// Can still be matched to typeof itself
				assertIdenticalTypes(entries, createInstanceOf<typeof entries>());

				for (const [key, value] of entries) {
					// @ts-expect-error '{ [K in keyof MapNumberIndicesToStrings<...' cannot be used to index type '{ [K in Keys as `item_key-${Keys}`]: T; }'
					assert.deepStrictEqual(value, s.items[key]);
					// @ts-expect-error '{ [K in keyof MapNumberIndicesToStrings<...'is not assignable to type '`item_key-${Keys}`'
					acceptObjectAndKey(s.items, key);
				}
			});
		});
	});

	describe("objectEntriesWithoutUndefined", () => {
		it("over object returns array of object's known keys and value types as tuple omitting undefined values and entries where value is only undefined", () => {
			type keyofVeryIndexedTypeWithSymbolIndex = keyof VeryIndexedTypeWithSymbolIndex;
			const expectedEntriesTypes =
				createInstanceOf<
					(
						| [number: `${number}` & keyofVeryIndexedTypeWithSymbolIndex, `${number}`]
						| [
								templateWithNumber: `number_${number}` & keyofVeryIndexedTypeWithSymbolIndex,
								`number_${number}`,
						  ]
						| [
								templateWithString: `string_${string}` & keyofVeryIndexedTypeWithSymbolIndex,
								`string_${string}`,
						  ]
						| [
								templateWithBigint: `bigint_${bigint}` & keyofVeryIndexedTypeWithSymbolIndex,
								`bigint_${bigint}`,
						  ]
						| ["known", "known"]
						| ["optional", "optional"]
						| ["0" & keyofVeryIndexedTypeWithSymbolIndex, "0"]
					)[]
				>();
			const expectedEntriesRuntime = [
				["0", "0"],
				["known", "known"],
				["undefined", undefined],
			];

			const entriesWithoutStringOrSymbol = objectEntriesWithoutUndefined(
				veryIndexedObjectWithoutStringOrSymbol,
			);
			assertIdenticalTypes(entriesWithoutStringOrSymbol, expectedEntriesTypes);
			assert.deepStrictEqual(entriesWithoutStringOrSymbol, expectedEntriesRuntime);

			for (const [key, value] of entriesWithoutStringOrSymbol) {
				assert.deepStrictEqual(value, veryIndexedObjectWithoutStringOrSymbol[key]);
				acceptObjectAndKey(veryIndexedObjectWithoutStringOrSymbol, key);
			}

			const entriesWithSymbolIndex = objectEntriesWithoutUndefined(
				veryIndexedObjectWithSymbolIndex,
			);
			assertIdenticalTypes(entriesWithSymbolIndex, expectedEntriesTypes);
			assert.deepStrictEqual(entriesWithSymbolIndex, expectedEntriesRuntime);

			for (const [key, value] of entriesWithSymbolIndex) {
				assert.deepStrictEqual(value, veryIndexedObjectWithSymbolIndex[key]);
				acceptObjectAndKey(veryIndexedObjectWithSymbolIndex, key);
			}
		});
	});

	describe("objectKeys", () => {
		it("over object without number or string index returns array of object's known keys as string", () => {
			const noStringOrSymbolKeys = objectKeys(veryIndexedObjectWithoutNumberStringOrSymbol);
			assertIdenticalTypes(
				noStringOrSymbolKeys,
				createInstanceOf<
					(
						| "undefined"
						| "known"
						| `number_${number}`
						| `string_${string}`
						| `bigint_${bigint}`
						| "0" // & keyof VeryIndexedType - would make this `never`
						| "optional"
						| "optionalUndefined"
					)[]
				>(),
			);
			assert.deepStrictEqual(noStringOrSymbolKeys, ["0", "known", "undefined"]);
			for (const key of noStringOrSymbolKeys) {
				if (key !== "0") {
					acceptObjectAndKey(veryIndexedObjectWithoutStringOrSymbol, key);
				}
			}

			const keys = objectKeys(basicPropertyBag);
			assertIdenticalTypes(keys, createInstanceOf<("known" | "optional" | "0")[]>());
			assert.deepStrictEqual(keys, ["0", "known"]);
			for (const key of keys) {
				if (key !== "0") {
					acceptObjectAndKey(basicPropertyBag, key);
				}
			}
		});

		it("over object without string index returns array of object's known keys as string", () => {
			const noStringOrSymbolKeys = objectKeys(veryIndexedObjectWithoutStringOrSymbol);
			assertIdenticalTypes(
				noStringOrSymbolKeys,
				createInstanceOf<
					(
						| (`${number}` & keyof VeryIndexedTypeWithNumberIndex)
						| "undefined"
						| "known"
						| `number_${number}`
						| `string_${string}`
						| `bigint_${bigint}`
						| "0" // & keyof VeryIndexedTypeWithNumberIndex)
						| "optional"
						| "optionalUndefined"
					)[]
				>(),
			);
			assert.deepStrictEqual(noStringOrSymbolKeys, ["0", "known", "undefined"]);
			for (const key of noStringOrSymbolKeys) {
				if (key !== "0") {
					acceptObjectAndKey(veryIndexedObjectWithoutStringOrSymbol, key);
				}
			}

			const keys = objectKeys(basicPropertyBag);
			assertIdenticalTypes(keys, createInstanceOf<("known" | "optional" | "0")[]>());
			assert.deepStrictEqual(keys, ["0", "known"]);
			for (const key of keys) {
				if (key !== "0") {
					acceptObjectAndKey(basicPropertyBag, key);
				}
			}
		});

		it("over object with string index returns array of keyof object type", () => {
			const stringIndexKeys = objectKeys(veryIndexedObjectWithStringIndex);
			assertIdenticalTypes(stringIndexKeys, createInstanceOf<(string | number)[]>());
		});

		// eslint-disable-next-line no-template-curly-in-string
		it("over array returns array of `${bigint}` that are valid keys though TypeScript requires a cast", () => {
			const keys = objectKeys(arrayLength5Without4thIndex);
			type ElementLookupType = (typeof arrayLength5Without4thIndex)[number] | undefined;

			assertIdenticalTypes(keys, createInstanceOf<`${bigint}`[]>());
			assert.deepStrictEqual(keys, ["0", "1", "2", "4"]);
			for (const key of keys) {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- `any` is result of lookup :(
				const readValueWithoutCast = arrayLength5Without4thIndex[key];
				// @ts-expect-error `any` is not the element type
				// eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- any is here
				assertIdenticalTypes(readValueWithoutCast, createInstanceOf<ElementLookupType>());
				// eslint-disable-next-line @typescript-eslint/no-explicit-any -- gotta match generated `any`
				assertIdenticalTypes(readValueWithoutCast, createInstanceOf<any>());
				// @ts-expect-error '`${bigint}`' is not assignable to parameter of type 'keyof []'
				acceptObjectAndKey(arrayLength5Without4thIndex, key);

				const readValueWithKeyCast = arrayLength5Without4thIndex[key as unknown as number];
				assertIdenticalTypes(readValueWithKeyCast, createInstanceOf<ElementLookupType>());

				const parsedKey = Number(key);
				const readValueWithNumericKey = arrayLength5Without4thIndex[parsedKey];
				assertIdenticalTypes(readValueWithNumericKey, createInstanceOf<ElementLookupType>());
				assert.deepStrictEqual(readValueWithoutCast, readValueWithNumericKey);
			}
		});
	});
});
