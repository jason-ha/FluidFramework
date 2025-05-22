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
	type BrandedIndex,
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

interface VeryIndexedTypeWithRequiredTemplateIndex extends VeryIndexedType {
	number_34: `number_${number}`;
}

interface VeryIndexedTypeWithTemplateOverride extends VeryIndexedType {
	number_34: `number_57`;
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
const veryIndexedObjectWithTemplateOverride: VeryIndexedTypeWithTemplateOverride = {
	...testObject,
	number_34: "number_57",
};
const veryIndexedObjectWithRequiredTemplateIndex: VeryIndexedTypeWithRequiredTemplateIndex =
	veryIndexedObjectWithTemplateOverride;

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

const basicPropertyBagWithFractionalKey: {
	known: "known_value";
	optional?: "optional_value";
	0.5: "half";
	[symbol: symbol]: "symbol_value";
} = {
	known: "known_value",
	// Omit optional:
	// optional: "optional_value",
	0.5: "half",
	[testSymbol]: "symbol_value",
};

interface StringRecordWithKnownProperties {
	[string: string]: `${string}_value`;
	known: "known_value";
	optional?: "optional_value";
}

const stringRecordWithKnownProperties: StringRecordWithKnownProperties = {
	known: "known_value",
	unnamed: "unnamed_value",
};

const arrayLength5Without4thIndex = [0, "undefined", 2];
arrayLength5Without4thIndex[4] = 4;

function acceptObjectAndKey<TObj>(_obj: TObj, _key: keyof TObj): void {}
function acceptAnyValue<T>(_v: T): void {}

describe("Typed Object helpers", () => {
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

					// verify narrowing by key
					if (key === "known") {
						assertIdenticalTypes(value, "known_value");
					} else {
						assertIdenticalTypes(key, "optional");
						assertIdenticalTypes(value, "optional_value");
					}
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
					if (key === "0") {
						// @ts-expect-error Argument of type '"0"' is not assignable to parameter of type 'symbol | 0 | "known" | "optional"'
						acceptObjectAndKey(basicPropertyBagWithNumericKey, key);
						assertIdenticalTypes(value, "zero");
						assert.deepStrictEqual(value, basicPropertyBagWithNumericKey[0]);
					} else {
						acceptObjectAndKey(basicPropertyBagWithNumericKey, key);
						assertIdenticalTypes(value, createInstanceOf<"known_value" | "optional_value">());
					}
				}
				// Keep this last as it asserts type equality
				assert.deepStrictEqual(entries, expectedEntriesRuntime);
			});

			it("over object with literal string and fractional number (known names/numbers) properties", () => {
				const expectedEntriesTypes =
					createInstanceOf<
						(["known", "known_value"] | ["optional", "optional_value"] | ["0.5", "half"])[]
					>();
				const expectedEntriesRuntime = [
					["known", "known_value"],
					["0.5", "half"],
					// `optional` has been omitted at runtime
					// ["optional", "optional_value"],
				] as const satisfies typeof expectedEntriesTypes;

				// Act
				const entries = objectEntries(basicPropertyBagWithFractionalKey);
				// Verify
				assertIdenticalTypes(entries, expectedEntriesTypes);
				for (const [key, value] of entries) {
					assert.deepStrictEqual(value, basicPropertyBagWithFractionalKey[key]);
					if (key === "0.5") {
						// @ts-expect-error Argument of type '"0.5"' is not assignable to parameter of type 'symbol | 0.5 | "known" | "optional"'
						acceptObjectAndKey(basicPropertyBagWithFractionalKey, key);
						assertIdenticalTypes(value, "half");
						assert.deepStrictEqual(value, basicPropertyBagWithFractionalKey[0.5]);
					} else {
						acceptObjectAndKey(basicPropertyBagWithFractionalKey, key);
						assertIdenticalTypes(value, createInstanceOf<"known_value" | "optional_value">());
					}
				}
				// Keep this last as it asserts type equality
				assert.deepStrictEqual(entries, expectedEntriesRuntime);
			});

			it("over object with `number` index", () => {
				const expectedEntriesTypes =
					createInstanceOf<
						(
							| [templateWithNumber: `number_${number}`, `number_${number}`]
							| [templateWithString: `string_${string}`, `string_${string}`]
							| [templateWithBigint: `bigint_${bigint}`, `bigint_${bigint}`]
							| ["known", "known"]
							| ["optional", "optional"]
							| ["0", "0"]
							| ["undefined", undefined]
							| ["optionalUndefined", undefined]
							// `number` key is intersected with `keyof` to allow that type
							// be useable as a key in the object.
							// "0" is also not a valid key in the object, but intersection
							// with `keyof` would produce `never` and thus is avoided.
							| [
									number: BrandedIndex<number> & keyof VeryIndexedTypeWithNumberIndex,
									`${number}`,
							  ]
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
					if (key === "0") {
						// @ts-expect-error Argument of type '"0"' is not assignable to parameter of type 'keyof VeryIndexedTypeWithNumberIndex'
						acceptObjectAndKey(veryIndexedObjectWithNumberIndex, key);
						assertIdenticalTypes(value, "0");
						assert.deepStrictEqual(value, veryIndexedObjectWithNumberIndex[0]);
					} else {
						acceptObjectAndKey(veryIndexedObjectWithNumberIndex, key);
						assertIdenticalTypes(
							// @ts-expect-error Potential tsc defect; 0 is in the set but not `number`
							value,
							createInstanceOf<(typeof expectedEntriesTypes)[number][1]>(),
						);
						assertIdenticalTypes(
							value,
							createInstanceOf<
								// `${number}` should be a type
								// | `${number}`
								// "0" should not be here are `key === "0"` should have filtered it out
								| "0"
								| `number_${number}`
								| `string_${string}`
								| `bigint_${bigint}`
								| "known"
								| "optional"
								| undefined
							>(),
						);
						if (
							key !== "known" &&
							key !== "optional" &&
							key !== "optionalUndefined" &&
							key !== "undefined"
						) {
							assertIdenticalTypes(
								key,
								createInstanceOf<
									| `number_${number}`
									| `string_${string}`
									| `bigint_${bigint}`
									| (BrandedIndex<number> & keyof VeryIndexedTypeWithNumberIndex)
								>(),
							);
							assertIdenticalTypes(
								value,
								createInstanceOf<
									// `${number}` |
									"0" | `number_${number}` | `string_${string}` | `bigint_${bigint}`
								>(),
							);
						}
					}
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
					if (key === "0") {
						// @ts-expect-error Argument of type '"0"' is not assignable to parameter of type 'keyof VeryIndexedTypeWithNumberAndSymbolIndices'
						acceptObjectAndKey(veryIndexedObjectWithNumberAndSymbolIndices, key);
						assertIdenticalTypes(value, "0");
						assert.deepStrictEqual(value, veryIndexedObjectWithNumberAndSymbolIndices[0]);
					} else {
						acceptObjectAndKey(veryIndexedObjectWithNumberAndSymbolIndices, key);
					}
				}
				// Keep this last as it asserts type equality
				assert.deepStrictEqual(entriesMightHaveSymbol, expectedEntriesRuntime);
			});

			it("over object with `string` index", () => {
				// Act
				const entries = objectEntries(stringRecordWithKnownProperties);

				// Verify
				assertIdenticalTypes(
					entries,
					createInstanceOf<
						(
							| [BrandedIndex<string>, `${string}_value`]
							| ["known", "known_value"]
							| ["optional", "optional_value"]
						)[]
					>(),
				);

				for (const [key, value] of entries) {
					assertIdenticalTypes(
						key,
						createInstanceOf<BrandedIndex<string> | "known" | "optional">(),
					);
					acceptObjectAndKey(stringRecordWithKnownProperties, key);
					assertIdenticalTypes(value, createInstanceOf<`${string}_value`>());
					if (key === "known") {
						assertIdenticalTypes(value, "known_value");
					} else if (key === "optional") {
						assertIdenticalTypes(value, "optional_value");
					} else {
						assertIdenticalTypes(key, createInstanceOf<BrandedIndex<string>>());
						assertIdenticalTypes(value, createInstanceOf<`${string}_value`>());
					}
					assert.deepStrictEqual(value, stringRecordWithKnownProperties[key]);
				}
				// Keep this last as it asserts type equality
				assert.deepStrictEqual(entries, [
					["known", "known_value"],
					["unnamed", "unnamed_value"],
				]);
			});

			it("over object with `string` index and literal number key", () => {
				const expectedEntriesTypes =
					createInstanceOf<
						(
							| [templateWithNumber: `number_${number}`, `number_${number}`]
							| [templateWithString: `string_${string}`, `string_${string}`]
							| [templateWithBigint: `bigint_${bigint}`, `bigint_${bigint}`]
							| ["known", "known"]
							| ["optional", "optional"]
							| ["0", "0"]
							| ["undefined", undefined]
							| ["optionalUndefined", undefined]
							| [string: BrandedIndex<string>, string | undefined]
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
				for (const [key, value] of entries) {
					assertIdenticalTypes(
						key,
						createInstanceOf<
							| `number_${number}`
							| `string_${string}`
							| `bigint_${bigint}`
							| "known"
							| "optional"
							| "0"
							| "undefined"
							| "optionalUndefined"
							| BrandedIndex<string>
						>(),
					);
					assert.deepStrictEqual(value, veryIndexedObjectWithStringIndex[key]);
					acceptObjectAndKey(veryIndexedObjectWithStringIndex, key);
					assertIdenticalTypes(value, createInstanceOf<string | undefined>());
					if (key === "known") {
						assertIdenticalTypes(value, "known");
					} else if (key === "undefined") {
						assertIdenticalTypes(value, undefined);
					} else {
						assertIdenticalTypes(value, createInstanceOf<string | undefined>());
					}
				}
				// Keep this last as it asserts type equality
				assert.deepStrictEqual(entries, expectedEntriesRuntime);
			});

			it("over object with `number` and `string` indices", () => {
				const expectedEntriesTypes =
					createInstanceOf<
						(
							| [templateWithNumber: `number_${number}`, `number_${number}`]
							| [templateWithString: `string_${string}`, `string_${string}`]
							| [templateWithBigint: `bigint_${bigint}`, `bigint_${bigint}`]
							| ["known", "known"]
							| ["optional", "optional"]
							| ["0", "0"]
							| ["undefined", undefined]
							| ["optionalUndefined", undefined]
							// Don't need `& keyof VeryIndexedTypeWithNumberAndStringIndices` here
							// because any `string` is a key of.
							| [number: BrandedIndex<number>, `${number}`]
							| [string: BrandedIndex<string>, string | undefined]
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
				for (const [key, value] of entries) {
					assertIdenticalTypes(
						key,
						createInstanceOf<
							| `number_${number}`
							| `string_${string}`
							| `bigint_${bigint}`
							| "known"
							| "optional"
							| "0"
							| "undefined"
							| "optionalUndefined"
							| BrandedIndex<string>
							| BrandedIndex<number>
						>(),
					);
					assert.deepStrictEqual(value, veryIndexedObjectWithNumberAndStringIndices[key]);
					acceptObjectAndKey(veryIndexedObjectWithNumberAndStringIndices, key);
					assertIdenticalTypes(value, createInstanceOf<string | undefined>());
					if (key === "0") {
						acceptObjectAndKey(veryIndexedObjectWithNumberAndStringIndices, key);
						assertIdenticalTypes(value, "0");
						assert.deepStrictEqual(value, veryIndexedObjectWithNumberAndStringIndices[0]);
					} else if (key === "known") {
						assertIdenticalTypes(value, "known");
					} else {
						assertIdenticalTypes(value, createInstanceOf<string | undefined>());
					}
				}
				// Keep this last as it asserts type equality
				assert.deepStrictEqual(entries, expectedEntriesRuntime);
			});

			it("over object with templated index and a specific required property matching templated index", () => {
				const expectedEntriesTypes =
					createInstanceOf<
						(
							| [templateWithNumber: `number_${number}`, `number_${number}`]
							| ["number_34", `number_${number}`]
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
					["number_34", "number_57"],
				] as const satisfies typeof expectedEntriesTypes;

				// Act
				const entriesNoSymbol = objectEntries(veryIndexedObjectWithRequiredTemplateIndex);
				// Verify
				assertIdenticalTypes(entriesNoSymbol, expectedEntriesTypes);
				for (const [key, value] of entriesNoSymbol) {
					assert.deepStrictEqual(value, veryIndexedObjectWithRequiredTemplateIndex[key]);
					if (key !== "0") {
						acceptObjectAndKey(veryIndexedObjectWithRequiredTemplateIndex, key);
						assertIdenticalTypes(
							value,
							createInstanceOf<
								| `number_${number}`
								| `string_${string}`
								| `bigint_${bigint}`
								| "known"
								| "optional"
								| undefined
							>(),
						);
						if (key === "number_34") {
							// Narrowed but still a type from the union
							assertIdenticalTypes(value, createInstanceOf<`number_${number}`>());
						} else {
							// Unchanged from before
							assertIdenticalTypes(
								value,
								createInstanceOf<
									| `number_${number}`
									| `string_${string}`
									| `bigint_${bigint}`
									| "known"
									| "optional"
									| undefined
								>(),
							);
						}
					}
				}
				// Keep this last as it asserts type equality
				assert.deepStrictEqual(entriesNoSymbol, expectedEntriesRuntime);
			});

			it("over object with templated index and a specific required property and value matching templated index", () => {
				const expectedEntriesTypes =
					createInstanceOf<
						(
							| [
									// Branded per overlap with `number_34` key
									templateWithNumber: `number_${number}` & BrandedIndex<`number_${number}`>,
									`number_${number}`,
							  ]
							| ["number_34", "number_57"]
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
					["number_34", "number_57"],
				] as const satisfies typeof expectedEntriesTypes;

				// Act
				const entriesNoSymbol = objectEntries(veryIndexedObjectWithTemplateOverride);
				// Verify
				assertIdenticalTypes(entriesNoSymbol, expectedEntriesTypes);
				for (const [key, value] of entriesNoSymbol) {
					assert.deepStrictEqual(value, veryIndexedObjectWithTemplateOverride[key]);
					if (key !== "0") {
						acceptObjectAndKey(veryIndexedObjectWithTemplateOverride, key);
						assertIdenticalTypes(
							value,
							createInstanceOf<
								| `number_${number}`
								| `string_${string}`
								| `bigint_${bigint}`
								| "known"
								| "optional"
								| undefined
							>(),
						);
						if (key === "number_34") {
							// Narrowed to specific value type (more specific
							// than covering template type in the union)
							assertIdenticalTypes(value, "number_57");
						} else {
							// Unchanged from before
							assertIdenticalTypes(
								value,
								createInstanceOf<
									| `number_${number}`
									| `string_${string}`
									| `bigint_${bigint}`
									| "known"
									| "optional"
									| undefined
								>(),
							);
						}
					}
				}
				// Keep this last as it asserts type equality
				assert.deepStrictEqual(entriesNoSymbol, expectedEntriesRuntime);
			});
		});

		// eslint-disable-next-line no-template-curly-in-string
		it("returns array of `${bigint}` and value type tuple over array", () => {
			const entries = objectEntries(arrayLength5Without4thIndex);
			type ElementLookupType = (typeof arrayLength5Without4thIndex)[number] | undefined;

			assertIdenticalTypes(entries, createInstanceOf<[`${bigint}`, string | number][]>());
			for (const [key, value] of entries) {
				assertIdenticalTypes(value, createInstanceOf<string | number>());

				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- `any` is result of lookup :(
				const readValueWithoutCast = arrayLength5Without4thIndex[key];
				// @ts-expect-error `any` is not the element type
				// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
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
			// Keep this last as it asserts type equality
			assert.deepStrictEqual(entries, [
				["0", 0],
				["1", "undefined"],
				["2", 2],
				["4", 4],
			]);
		});

		// eslint-disable-next-line no-template-curly-in-string
		it('returns array of `${bigint}` and value type tuple over copied, modified, and "abused" array', () => {
			// Setup
			// Copying will introduce index 3 as `undefined`.
			const alteredArray = [...arrayLength5Without4thIndex];
			// Improper indices are allowed as object properties
			alteredArray[2.5] = "2.5";
			// Non-numbers don't even need to respect array element type
			// eslint-disable-next-line @typescript-eslint/dot-notation
			alteredArray["string"] = { a: "string_value" };
			// The push and 7 write are part of the array
			alteredArray.push("pushed_value");
			alteredArray[7] = "7_value";

			// Act
			const entries = objectEntries(alteredArray);
			type ElementLookupType = (typeof alteredArray)[number] | undefined;

			// Additional properties do not shift the type and thus entries
			// type still matches the original array.
			assertIdenticalTypes(entries, objectEntries(arrayLength5Without4thIndex));
			assertIdenticalTypes(entries, createInstanceOf<[`${bigint}`, string | number][]>());

			for (const [key, value] of entries) {
				assertIdenticalTypes(value, createInstanceOf<string | number>());

				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- `any` is result of lookup :(
				const readValueWithoutCast = alteredArray[key];
				// @ts-expect-error `any` is not the element type
				// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
				assertIdenticalTypes(readValueWithoutCast, createInstanceOf<ElementLookupType>());
				// eslint-disable-next-line @typescript-eslint/no-explicit-any -- gotta match generated `any`
				assertIdenticalTypes(readValueWithoutCast, createInstanceOf<any>());
				// @ts-expect-error '`${bigint}`' is not assignable to parameter of type 'keyof []'
				acceptObjectAndKey(alteredArray, key);

				const readValueWithKeyCast = alteredArray[key as unknown as number];
				assertIdenticalTypes(readValueWithKeyCast, createInstanceOf<ElementLookupType>());

				const parsedKey =
					// @ts-expect-error "string" is not of type `${bigint}`
					key === "string"
						? // comment to keep Biome happy and ts-expect-error limited to one expression
							key
						: Number(key);
				const readValueWithNumericKey = alteredArray[parsedKey];
				assertIdenticalTypes(readValueWithNumericKey, createInstanceOf<ElementLookupType>());
				assert.deepStrictEqual(readValueWithoutCast, readValueWithNumericKey);
			}

			// Keep this last as it asserts type equality
			assert.deepStrictEqual(entries, [
				["0", 0],
				["1", "undefined"],
				["2", 2],
				["3", undefined],
				["4", 4],
				["5", "pushed_value"],
				["7", "7_value"],
				// below are object properties
				["2.5", "2.5"],
				["string", { a: "string_value" }],
			]);
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
					// @ts-expect-error '{ [K in keyof ...' cannot be used to index type '{ [K in Keys as `item_key-${Keys}`]: T; }'
					assert.deepStrictEqual(value, s.items[key]);
					// @ts-expect-error '{ [K in keyof ...'is not assignable to type '`item_key-${Keys}`'
					acceptObjectAndKey(s.items, key);
				}
			});
		});
	});

	describe("objectEntriesWithoutUndefined", () => {
		it("over object returns array of object's known keys and value types as tuple omitting undefined values and entries where value is only undefined", () => {
			const expectedEntriesTypes =
				createInstanceOf<
					(
						| [templateWithNumber: `number_${number}`, `number_${number}`]
						| [templateWithString: `string_${string}`, `string_${string}`]
						| [templateWithBigint: `bigint_${bigint}`, `bigint_${bigint}`]
						| ["known", "known"]
						| ["optional", "optional"]
						| ["0", "0"]
						| [
								number: BrandedIndex<number> & keyof typeof veryIndexedObjectWithNumberIndex,
								`${number}`,
						  ]
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
				if (key === "0") {
					// @ts-expect-error Argument of type '"0"' is not assignable to parameter of type 'keyof VeryIndexedTypeWithNumberIndex'
					acceptObjectAndKey(veryIndexedObjectWithNumberIndex, key);
					assertIdenticalTypes(value, "0");
					assert.deepStrictEqual(value, veryIndexedObjectWithNumberIndex[0]);
				} else {
					acceptObjectAndKey(veryIndexedObjectWithNumberIndex, key);
				}
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
				if (key === "0") {
					// @ts-expect-error Argument of type '"0"' is not assignable to parameter of type 'keyof VeryIndexedTypeWithNumberAndSymbolIndices'
					acceptObjectAndKey(veryIndexedObjectWithNumberAndSymbolIndices, key);
					assertIdenticalTypes(value, "0");
					assert.deepStrictEqual(value, veryIndexedObjectWithNumberAndSymbolIndices[0]);
				} else {
					acceptObjectAndKey(veryIndexedObjectWithNumberAndSymbolIndices, key);
				}
			}
			// Keep this last as it asserts type equality
			assert.deepStrictEqual(entriesWithSymbolIndex, expectedEntriesRuntime);
		});
	});

	describe("objectKeys", () => {
		describe("returns array of object's known keys as strings omitting `symbols`", () => {
			it("over object without `number` or `string` index", () => {
				const noNumberStringOrSymbolKeys = objectKeys(
					veryIndexedObjectWithoutNumberStringOrSymbol,
				);
				assertIdenticalTypes(
					noNumberStringOrSymbolKeys,
					createInstanceOf<
						(
							| `number_${number}`
							| `string_${string}`
							| `bigint_${bigint}`
							| "known"
							| "optional"
							| "0" // is not a `keyof VeryIndexedType`
							| "undefined"
							| "optionalUndefined"
						)[]
					>(),
				);
				assert.deepStrictEqual(noNumberStringOrSymbolKeys, ["0", "known", "undefined"]);
				for (const key of noNumberStringOrSymbolKeys) {
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

			it("over object with `number` index", () => {
				const noStringOrSymbolKeys = objectKeys(veryIndexedObjectWithNumberIndex);
				assertIdenticalTypes(
					noStringOrSymbolKeys,
					createInstanceOf<
						(
							| `number_${number}`
							| `string_${string}`
							| `bigint_${bigint}`
							| "known"
							| "optional"
							| "0" // is not a `keyof VeryIndexedTypeWithNumberIndex`. `& keyof VeryIndexedTypeWithNumberIndex` would be `never`
							| "undefined"
							| "optionalUndefined"
							| (BrandedIndex<number> & keyof VeryIndexedTypeWithNumberIndex)
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
		});

		it("over object with `string` index returns array of keyof object type", () => {
			// Act
			const stringIndexKeys = objectKeys(stringRecordWithKnownProperties);

			// Verify
			assertIdenticalTypes(
				stringIndexKeys,
				createInstanceOf<(BrandedIndex<string> | "known" | "optional")[]>(),
			);
			for (const key of stringIndexKeys) {
				acceptObjectAndKey(stringRecordWithKnownProperties, key);
				// Verify tsc doesn't complain about `key`
				acceptAnyValue(stringRecordWithKnownProperties[key]);
			}
			// Keep this last as it asserts type equality
			assert.deepStrictEqual(stringIndexKeys, ["known", "unnamed"]);
		});

		it("over object with `string` index returns array of keyof object type", () => {
			// Act
			const stringIndexKeys = objectKeys(veryIndexedObjectWithStringIndex);

			// Verify
			assertIdenticalTypes(
				stringIndexKeys,
				createInstanceOf<
					(
						| `number_${number}`
						| `string_${string}`
						| `bigint_${bigint}`
						| "known"
						| "optional"
						| "0"
						| "undefined"
						| "optionalUndefined"
						| BrandedIndex<string>
					)[]
				>(),
			);
			for (const key of stringIndexKeys) {
				acceptObjectAndKey(veryIndexedObjectWithNumberAndStringIndices, key);
				// Verify tsc doesn't complain about `key`
				acceptAnyValue(veryIndexedObjectWithNumberAndStringIndices[key]);
			}
			// Keep this last as it asserts type equality
			assert.deepStrictEqual(stringIndexKeys, ["0", "known", "undefined"]);
		});

		it("over object with `number` and `string` index returns array of keyof object type", () => {
			// Act
			const stringIndexKeys = objectKeys(veryIndexedObjectWithNumberAndStringIndices);

			// Verify
			assertIdenticalTypes(
				stringIndexKeys,
				createInstanceOf<
					(
						| `number_${number}`
						| `string_${string}`
						| `bigint_${bigint}`
						| "known"
						| "optional"
						| "0"
						| "undefined"
						| "optionalUndefined"
						| BrandedIndex<number>
						| BrandedIndex<string>
					)[]
				>(),
			);
			for (const key of stringIndexKeys) {
				acceptObjectAndKey(veryIndexedObjectWithNumberAndStringIndices, key);
				// Verify tsc doesn't complain about `key`
				acceptAnyValue(veryIndexedObjectWithNumberAndStringIndices[key]);
			}
			// Keep this last as it asserts type equality
			assert.deepStrictEqual(stringIndexKeys, ["0", "known", "undefined"]);
		});

		// eslint-disable-next-line no-template-curly-in-string -- the curly is intended
		it("over array returns array of `${bigint}` that are valid keys though TypeScript requires a cast", () => {
			const keys = objectKeys(arrayLength5Without4thIndex);
			type ElementLookupType = (typeof arrayLength5Without4thIndex)[number] | undefined;

			assertIdenticalTypes(keys, createInstanceOf<`${bigint}`[]>());
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
			// Keep this last as it asserts type equality
			assert.deepStrictEqual(keys, ["0", "1", "2", "4"]);
		});
	});
});
