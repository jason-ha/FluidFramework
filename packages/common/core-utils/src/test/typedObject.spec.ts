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
interface VeryIndexedTypeWithStringIndex extends VeryIndexedType {
	[string: string]: string | undefined;
}

interface VeryIndexedTypeWithNumberAndStringIndices
	extends VeryIndexedTypeWithNumberIndex,
		VeryIndexedTypeWithStringIndex {}

// eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
interface VeryIndexedTypeWithNumberAndSymbolIndices extends VeryIndexedTypeWithNumberIndex {
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
const veryIndexedObjectWithNumberIndex: VeryIndexedTypeWithNumberIndex = testObject;
const veryIndexedObjectWithStringIndex: VeryIndexedTypeWithStringIndex = testObject;
const veryIndexedObjectWithNumberAndStringIndices: VeryIndexedTypeWithNumberAndStringIndices =
	testObject;
const veryIndexedObjectWithNumberAndSymbolIndices: VeryIndexedTypeWithNumberAndSymbolIndices =
	testObject;

const basicPropertyBag: {
	known: "known_value";
	optional?: "optional_value";
	[symbol: symbol]: "symbol_value";
} = {
	known: "known_value",
	optional: "optional_value",
	[testSymbol]: "symbol_value",
};

const basicPropertyBagWithNumericKey: {
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

function acceptObjectAndKey<TObj>(_obj: TObj, _key: keyof TObj): void {}
function acceptAnyValue<T>(_v: T): void {}

describe.only("Typed Object helpers", () => {
	describe("assumptions", () => {
		it("Object.keys returns strings skipping symbols and array gaps", () => {
			const keys = Object.keys(basicPropertyBagWithNumericKey);
			assert.deepStrictEqual(keys, ["0", "known"]);
			const arrKeys = Object.keys(arrayLength5Without4thIndex);
			assert.deepStrictEqual(arrKeys, ["0", "1", "2", "4"]);
		});
	});

	describe("objectEntries", () => {
		describe("returns array of object's known keys and value types as tuple omitting `symbol` keys", () => {
			it("over object with literal string (known names) properties", () => {
				type ExpectedEntriesTypes = (
					| ["known", "known_value"]
					| ["optional", "optional_value"]
				)[];
				const expectedEntries: ExpectedEntriesTypes = [
					["known", "known_value"],
					["optional", "optional_value"],
				];

				// Act
				const entries = objectEntries(basicPropertyBag);
				// Verify
				assertIdenticalTypes(entries, expectedEntries);
				assert.deepStrictEqual(entries, expectedEntries);
				for (const [key, value] of entries) {
					assert.deepStrictEqual(value, basicPropertyBag[key]);
					acceptObjectAndKey(basicPropertyBag, key);
				}
			});

			it("over object with literal string and number (known names/numbers) properties", () => {
				const expectedEntriesTypes =
					createInstanceOf<
						(["known", "known_value"] | ["optional", "optional_value"] | ["0", "zero"])[]
					>();
				const expectedEntriesRuntime = [
					["0", "zero"],
					["known", "known_value"],
					// `optional` has been omitted at runtime
					// ["optional", "optional_value"],
				] as const satisfies typeof expectedEntriesTypes;

				// Act
				const entries = objectEntries(basicPropertyBagWithNumericKey);
				// Verify
				assertIdenticalTypes(entries, expectedEntriesTypes);
				for (const [key, value] of entries) {
					assert.deepStrictEqual(value, basicPropertyBagWithNumericKey[key]);
					acceptObjectAndKey(basicPropertyBagWithNumericKey, key);
				}
				// Keep this last as it asserts type equality
				assert.deepStrictEqual(entries, expectedEntriesRuntime);
			});

			it("over object with `number` index", () => {
				type keyofVeryIndexedTypeWithNumberIndex = keyof VeryIndexedTypeWithNumberIndex;
				const expectedEntriesTypes =
					createInstanceOf<
						(
							| [number: `${number}` & keyofVeryIndexedTypeWithNumberIndex, `${number}`]
							| [
									templateWithNumber: `number_${number}` & keyofVeryIndexedTypeWithNumberIndex,
									`number_${number}`,
							  ]
							| [
									templateWithString: `string_${string}` & keyofVeryIndexedTypeWithNumberIndex,
									`string_${string}`,
							  ]
							| [
									templateWithBigint: `bigint_${bigint}` & keyofVeryIndexedTypeWithNumberIndex,
									`bigint_${bigint}`,
							  ]
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
				] as const satisfies typeof expectedEntriesTypes;

				// Act
				const entriesNoSymbol = objectEntries(veryIndexedObjectWithNumberIndex);
				// Verify
				assertIdenticalTypes(entriesNoSymbol, expectedEntriesTypes);
				for (const [key, value] of entriesNoSymbol) {
					assert.deepStrictEqual(value, veryIndexedObjectWithNumberIndex[key]);
					acceptObjectAndKey(veryIndexedObjectWithNumberIndex, key);
				}
				// Keep this last as it asserts type equality
				assert.deepStrictEqual(entriesNoSymbol, expectedEntriesRuntime);

				// Act
				const entriesMightHaveSymbol = objectEntries(
					veryIndexedObjectWithNumberAndSymbolIndices,
				);
				// Verify
				assertIdenticalTypes(entriesMightHaveSymbol, expectedEntriesTypes);
				for (const [key, value] of entriesMightHaveSymbol) {
					assert.deepStrictEqual(value, veryIndexedObjectWithNumberAndSymbolIndices[key]);
					acceptObjectAndKey(veryIndexedObjectWithNumberAndSymbolIndices, key);
				}
				// Keep this last as it asserts type equality
				assert.deepStrictEqual(entriesMightHaveSymbol, expectedEntriesRuntime);
			});

			it("over object with `string` index", () => {
				// Don't need `& keyofVeryIndexedTypeWithStringIndex` below because any `string` is a keyof
				// type keyofVeryIndexedTypeWithStringIndex = keyof VeryIndexedTypeWithStringIndex;
				const expectedEntriesTypes =
					createInstanceOf<
						(
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
				] as const satisfies typeof expectedEntriesTypes;

				// Act
				const entries = objectEntries(veryIndexedObjectWithStringIndex);
				// Verify
				assertIdenticalTypes(entries, expectedEntriesTypes);
				// Note that if `kvp` were split into `[key,value]`, the type of `key` would be `string`
				// as the string index covers all key types.
				for (const kvp of entries) {
					assertIdenticalTypes(kvp[0], createInstanceOf<string>());
					assert.deepStrictEqual(kvp[1], veryIndexedObjectWithStringIndex[kvp[0]]);
					acceptObjectAndKey(veryIndexedObjectWithStringIndex, kvp[0]);
				}
				// Keep this last as it asserts type equality
				assert.deepStrictEqual(entries, expectedEntriesRuntime);
			});

			it("over object with `number` and `string` indices", () => {
				// Don't need `& keyofVeryIndexedTypeWithNumberAndStringIndices` below because any `string` is a keyof
				// type keyofVeryIndexedTypeWithNumberAndStringIndices = keyof VeryIndexedTypeWithNumberAndStringIndices;
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
				] as const satisfies typeof expectedEntriesTypes;

				// Act
				const entries = objectEntries(veryIndexedObjectWithNumberAndStringIndices);
				// Verify
				assertIdenticalTypes(entries, expectedEntriesTypes);
				// Note that if `kvp` were split into `[key,value]`, the type of `key` would be `string`
				// as the string index covers all key types.
				for (const kvp of entries) {
					assertIdenticalTypes(kvp[0], createInstanceOf<string>());
					assert.deepStrictEqual(kvp[1], veryIndexedObjectWithNumberAndStringIndices[kvp[0]]);
					acceptObjectAndKey(veryIndexedObjectWithNumberAndStringIndices, kvp[0]);
				}
				// Keep this last as it asserts type equality
				assert.deepStrictEqual(entries, expectedEntriesRuntime);
			});
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

				// Act
				const entries = objectEntries(s.items);

				// Verify
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
			type keyofVeryIndexedTypeWithNumberIndex = keyof typeof veryIndexedObjectWithNumberIndex;
			const expectedEntriesTypes =
				createInstanceOf<
					(
						| [number: `${number}` & keyofVeryIndexedTypeWithNumberIndex, `${number}`]
						| [
								templateWithNumber: `number_${number}` & keyofVeryIndexedTypeWithNumberIndex,
								`number_${number}`,
						  ]
						| [
								templateWithString: `string_${string}` & keyofVeryIndexedTypeWithNumberIndex,
								`string_${string}`,
						  ]
						| [
								templateWithBigint: `bigint_${bigint}` & keyofVeryIndexedTypeWithNumberIndex,
								`bigint_${bigint}`,
						  ]
						| ["known", "known"]
						| ["optional", "optional"]
						| ["0" & keyofVeryIndexedTypeWithNumberIndex, "0"]
					)[]
				>();
			const expectedEntriesRuntime = [
				["0", "0"],
				["known", "known"],
				["undefined", undefined],
			];

			// Act
			const entriesWithoutStringOrSymbol = objectEntriesWithoutUndefined(
				veryIndexedObjectWithNumberIndex,
			);
			// Verify
			assertIdenticalTypes(entriesWithoutStringOrSymbol, expectedEntriesTypes);
			for (const [key, value] of entriesWithoutStringOrSymbol) {
				assert.deepStrictEqual(value, veryIndexedObjectWithNumberIndex[key]);
				acceptObjectAndKey(veryIndexedObjectWithNumberIndex, key);
			}
			// Keep this last as it asserts type equality
			assert.deepStrictEqual(entriesWithoutStringOrSymbol, expectedEntriesRuntime);

			// Act
			// Same results expected for object that also has `symbol` index
			const entriesWithSymbolIndex = objectEntriesWithoutUndefined(
				veryIndexedObjectWithNumberAndSymbolIndices,
			);
			// Verify
			assertIdenticalTypes(entriesWithSymbolIndex, expectedEntriesTypes);
			for (const [key, value] of entriesWithSymbolIndex) {
				assert.deepStrictEqual(value, veryIndexedObjectWithNumberAndSymbolIndices[key]);
				acceptObjectAndKey(veryIndexedObjectWithNumberAndSymbolIndices, key);
			}
			// Keep this last as it asserts type equality
			assert.deepStrictEqual(entriesWithSymbolIndex, expectedEntriesRuntime);
		});
	});

	describe("objectKeys", () => {
		it("over object without `number` or `string` index returns array of object's known keys as string", () => {
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
				// Verify tsc doesn't complain about `key` possibly being `"0"`
				const value = veryIndexedObjectWithoutNumberStringOrSymbol[key];

				if (key === "0") {
					// @ts-expect-error Argument of type '"0"' is not assignable to parameter of type 'keyof VeryIndexedTypeWithNumberIndex'
					acceptObjectAndKey(veryIndexedObjectWithoutNumberStringOrSymbol, key);
					assert.deepStrictEqual(value, veryIndexedObjectWithoutNumberStringOrSymbol[0]);
				} else {
					acceptObjectAndKey(veryIndexedObjectWithoutNumberStringOrSymbol, key);
				}
			}

			const keys = objectKeys(basicPropertyBagWithNumericKey);
			assertIdenticalTypes(keys, createInstanceOf<("known" | "optional" | "0")[]>());
			assert.deepStrictEqual(keys, ["0", "known"]);
			for (const key of keys) {
				// Verify tsc doesn't complain about `key` possibly being `"0"`
				const value = basicPropertyBagWithNumericKey[key];

				if (key === "0") {
					// @ts-expect-error Argument of type '"0"' is not assignable to parameter of type 'keyof VeryIndexedTypeWithNumberIndex'
					acceptObjectAndKey(basicPropertyBagWithNumericKey, key);
					assert.deepStrictEqual(value, basicPropertyBagWithNumericKey[0]);
				} else {
					acceptObjectAndKey(basicPropertyBagWithNumericKey, key);
				}
			}
		});

		it("over object without `string` index returns array of object's known keys as string", () => {
			const noStringOrSymbolKeys = objectKeys(veryIndexedObjectWithNumberIndex);
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
				// Verify tsc doesn't complain about `key` possibly being `"0"`
				const value = veryIndexedObjectWithNumberIndex[key];

				if (key === "0") {
					// @ts-expect-error Argument of type '"0"' is not assignable to parameter of type 'keyof VeryIndexedTypeWithNumberIndex'
					acceptObjectAndKey(veryIndexedObjectWithNumberIndex, key);
					assert.deepStrictEqual(value, veryIndexedObjectWithNumberIndex[0]);
				} else {
					acceptObjectAndKey(veryIndexedObjectWithNumberIndex, key);
				}
			}
		});

		it("over object with `string` index returns array of keyof object type", () => {
			// Act
			const stringIndexKeys = objectKeys(veryIndexedObjectWithNumberAndStringIndices);

			// Verify
			assertIdenticalTypes(stringIndexKeys, createInstanceOf<(string | number)[]>());
			for (const key of stringIndexKeys) {
				acceptObjectAndKey(veryIndexedObjectWithNumberAndStringIndices, key);
				// Verify tsc doesn't complain about `key`
				acceptAnyValue(veryIndexedObjectWithNumberAndStringIndices[key]);
			}
			// Keep this last as it asserts type equality
			assert.deepStrictEqual(stringIndexKeys, ["0", "known", "undefined"]);
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
