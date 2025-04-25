/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import {
	assertIdenticalTypes,
	createInstanceOf,
} from "@fluidframework/core-interfaces/internal/test-utils";

import { objectEntries, objectEntriesWithoutUndefined, objectKeys } from "../typedObject.js";

interface VeryIndexedType {
	[number: number]: `${number}`;
	[string: string]: string | undefined;
	[symbol: symbol]: "symbol";
	[templateWithNumber: `number_${number}`]: `number_${number}`;
	[templateWithString: `string_${string}`]: `string_${string}`;
	[templateWithBigint: `bigint_${bigint}`]: `bigint_${bigint}`;
	known: "known";
	optional?: "optional";
	0: "0";
	undefined: undefined;
	optionalUndefined?: undefined;
}

const testObject = createInstanceOf<VeryIndexedType>();

describe("Typed Object helpers", () => {
	describe("objectEntries", () => {
		it("over object returns array of object's known keys and value types as tuple", () => {
			const entries = objectEntries(testObject);
			assertIdenticalTypes(
				entries,
				createInstanceOf<
					(
						| [number: `${number}`, `${number}`]
						| [string: string, string | undefined]
						| [symbol: symbol, "symbol"]
						| [templateWithNumber: `number_${number}`, `number_${number}`]
						| [templateWithString: `string_${string}`, `string_${string}`]
						| [templateWithBigint: `bigint_${bigint}`, `bigint_${bigint}`]
						| ["known", "known"]
						| ["optional", "optional"]
						| ["0", "0"]
						| ["undefined", undefined]
						| ["optionalUndefined", undefined]
					)[]
				>(),
			);
		});
	});

	describe("objectEntriesWithoutUndefined", () => {
		it("over object returns array of object's known keys and value types as tuple omitting undefined values and entries where value is only undefined", () => {
			const entries = objectEntriesWithoutUndefined(testObject);
			assertIdenticalTypes(
				entries,
				createInstanceOf<
					(
						| [number: `${number}`, `${number}`]
						| [string: string, string]
						| [symbol: symbol, "symbol"]
						| [templateWithNumber: `number_${number}`, `number_${number}`]
						| [templateWithString: `string_${string}`, `string_${string}`]
						| [templateWithBigint: `bigint_${bigint}`, `bigint_${bigint}`]
						| ["known", "known"]
						| ["optional", "optional"]
						| ["0", "0"]
					)[]
				>(),
			);
		});
	});

	describe("objectKeys", () => {
		it("over object with string index returns array of keyof object type", () => {
			const keys = objectKeys(testObject);
			assertIdenticalTypes(keys, createInstanceOf<(keyof typeof testObject)[]>());
		});

		it("over object without string index returns array of object's known keys as string", () => {
			const keys = objectKeys(
				createInstanceOf<{
					known: "known_value";
					optional?: "optional_value";
					0: "zero";
					[symbol: symbol]: "symbol_value";
				}>(),
			);

			assertIdenticalTypes(keys, createInstanceOf<("known" | "optional" | "0" | symbol)[]>());
		});
	});
});
