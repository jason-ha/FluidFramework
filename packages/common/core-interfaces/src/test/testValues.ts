/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import type { JsonTypeWith } from "../jsonType.js";

/* eslint-disable jsdoc/require-jsdoc */
/* eslint-disable unicorn/no-null */

export const boolean: boolean = true as boolean; // Use `as` to avoid type conversion to `true`
export const number: number = 0;
export const string: string = "";
export const symbol = Symbol("symbol");
export const uniqueSymbol: unique symbol = Symbol("unique symbol");
export const bigint: bigint = 0n;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const aFunction = (): any => {};
export const unknownValueOfSimpleRecord = { key: "value" } as unknown;
export const unknownValueWithBigint = { bigint: 1n } as unknown;
export const voidValue = null as unknown as void;
const never = null as never;

export enum NumericEnum {
	zero,
	one,
	two,
}
export enum StringEnum {
	a = "a",
	b = "b",
}
export const enum ConstHeterogenousEnum {
	zero,
	a = "a",
}
export enum ComputedEnum {
	fixed,
	computed = (<T>(v: T): T => v)(5),
}
// Define these enum values with functions to avoid static analysis determining their specific value.
export const numericEnumValue = ((): NumericEnum => NumericEnum.one)();
export const stringEnumValue = ((): StringEnum => StringEnum.a)();
export const constHeterogenousEnumValue = ((): ConstHeterogenousEnum =>
	ConstHeterogenousEnum.a)();
export const computedEnumValue = ((): ComputedEnum => ComputedEnum.computed)();

// Functions are objects and they may have arbitrary properties
export const functionWithProperties = Object.assign(
	(): number => {
		return 2;
	},
	{ property: 5 },
);

// #region Array types

export const arrayOfNumbers: number[] = [0, 1, 2];
export const arrayOfNumbersSparse: number[] = [0];
arrayOfNumbersSparse[3] = 3;
export const arrayOfNumbersOrUndefined = [0, undefined, 2];
export const arrayOfSymbols: symbol[] = [Symbol("symbol")];
export const arrayOfFunctions = [aFunction];
export const arrayOfSymbolsAndObjects: (symbol | { property: string })[] = [Symbol("symbol")];

// #endregion

// #region Object (record) types

export const object: object = { key: "value" };
export const emptyObject = {};
export const objectWithBoolean = { boolean: true };
export const objectWithNumber = { number: 0 };
export const objectWithString = { string: "" };
export const objectWithSymbol = { symbol: Symbol("objectSymbol") };
export const objectWithBigint = { bigint: 0n };
export const objectWithFunction = { function: (): void => {} };
export const objectWithFunctionWithProperties = { function: functionWithProperties };
export const objectWithStringOrSymbol = {
	stringOrSymbol: Symbol("objectSymbol") as string | symbol,
};
export const objectWithBigintOrString = { bigintOrString: "not bigint" as string | bigint };
export const objectWithFunctionOrSymbol = {
	functionOrSymbol: ((): void => {}) as (() => void) | symbol,
};
export const objectWithOptionalBigint: { bigint?: bigint } = { bigint: 0n };

export const objectWithUndefined = {
	undef: undefined,
};
export const objectWithOptionalUndefined: {
	optUndef?: undefined;
} = { optUndef: undefined };
export interface ObjectWithOptionalNumber {
	optNumber?: number;
}
export const objectWithOptionalNumberNotPresent: ObjectWithOptionalNumber = {};
// @ts-expect-error exactOptionalPropertyTypes requires `optNumber?: number` to allow `undefined` for this assignment
export const objectWithOptionalNumberUndefined: ObjectWithOptionalNumber = {
	optNumber: undefined,
};
export const objectWithOptionalNumberDefined: ObjectWithOptionalNumber = { optNumber: 4 };
export interface ObjectWithNumberOrUndefined {
	numOrUndef: number | undefined;
}
export const objectWithNumberOrUndefinedUndefined: ObjectWithNumberOrUndefined = {
	numOrUndef: undefined,
};
export const objectWithNumberOrUndefinedNumbered: ObjectWithNumberOrUndefined = {
	numOrUndef: 5.2,
};
export const objectWithOptionalUndefinedEnclosingRequiredUndefined: {
	opt?: { requiredUndefined: number | undefined };
} = { opt: { requiredUndefined: undefined } };
export const objectWithNever = {
	never,
};

interface ObjectWithReadonly {
	readonly readonly: number;
}
export const objectWithReadonly: ObjectWithReadonly = { readonly: 5 };
class ClassImplementsObjectWithReadonly implements ObjectWithReadonly {
	public get readonly(): number {
		throw new Error("ClassImplementsObjectWithReadonly reading 'readonly'");
		return 4;
	}
}
export const objectWithReadonlyViaGetter: ObjectWithReadonly =
	new ClassImplementsObjectWithReadonly();

interface ObjectWithGetter {
	get getter(): number;
}
class ClassImplementsObjectWithGetter implements ObjectWithGetter {
	public get getter(): number {
		throw new Error("ClassImplementsObjectWithGetter reading 'getter'");
		return 4.2;
	}
}
export const objectWithGetter: ObjectWithGetter = new ClassImplementsObjectWithGetter();
export const objectWithGetterViaValue: ObjectWithGetter = { getter: 0 };

interface ObjectWithSetter {
	set setter(v: string);
}
class ClassImplementsObjectWithSetter implements ObjectWithSetter {
	public set setter(v: string) {
		throw new Error(`ClassImplementsObjectWithSetter writing 'setter' as ${v}`);
	}
}
export const objectWithSetter: ObjectWithSetter = new ClassImplementsObjectWithSetter();
export const objectWithSetterViaValue: ObjectWithSetter = { setter: "value" };
interface ObjectWithMatchedGetterAndSetterProperty {
	get property(): number;
	set property(v: number);
}
export const objectWithMatchedGetterAndSetterPropertyViaValue: ObjectWithMatchedGetterAndSetterProperty =
	{ property: 0 };
class ClassImplementsObjectWithMatchedGetterAndSetterProperty
	implements ObjectWithMatchedGetterAndSetterProperty
{
	public get property(): number {
		throw new Error(
			"ClassImplementsObjectWithMatchedGetterAndSetterProperty reading 'property'",
		);
		return 2;
	}
	public set property(v: number) {
		throw new Error(
			`ClassImplementsObjectWithMatchedGetterAndSetterProperty writing 'property' as ${v}`,
		);
	}
}
export const objectWithMatchedGetterAndSetterProperty: ObjectWithMatchedGetterAndSetterProperty =
	new ClassImplementsObjectWithMatchedGetterAndSetterProperty();
interface ObjectWithMismatchedGetterAndSetterProperty {
	get property(): number;
	set property(v: string);
}
class ClassImplementsObjectWithMismatchedGetterAndSetterProperty
	implements ObjectWithMismatchedGetterAndSetterProperty
{
	public get property(): number {
		throw new Error(
			"ClassImplementsObjectWithMismatchedGetterAndSetterProperty reading 'property'",
		);
		return 3;
	}
	public set property(v: string) {
		throw new Error(
			`ClassImplementsObjectWithMismatchedGetterAndSetterProperty writing 'property' as ${v}`,
		);
	}
}
export const objectWithMismatchedGetterAndSetterProperty: ObjectWithMismatchedGetterAndSetterProperty =
	new ClassImplementsObjectWithMismatchedGetterAndSetterProperty();
export const objectWithMismatchedGetterAndSetterPropertyViaValue: ObjectWithMismatchedGetterAndSetterProperty =
	{ property: 0 };

// #region Recursive types

/* eslint-disable @typescript-eslint/consistent-type-definitions */

type ObjectWithPossibleRecursion = {
	[x: string]: ObjectWithPossibleRecursion | string;
};
export const objectWithPossibleRecursion: ObjectWithPossibleRecursion = {
	recursive: { stop: "here" },
};
type ObjectWithOptionalRecursion = {
	recursive?: ObjectWithOptionalRecursion;
};
export const objectWithRecursion: ObjectWithOptionalRecursion = {
	recursive: {},
};
export const objectWithEmbeddedRecursion = {
	outer: objectWithRecursion,
};
export const objectWithSelfReference: ObjectWithOptionalRecursion = {};
objectWithSelfReference.recursive = objectWithSelfReference;

type ObjectWithAlternatingRecursionA = {
	recurseA: ObjectWithAlternatingRecursionB | number;
};
type ObjectWithAlternatingRecursionB = {
	recurseB: ObjectWithAlternatingRecursionA | "stop";
};
export const objectWithAlternatingRecursion: ObjectWithAlternatingRecursionA = {
	recurseA: {
		recurseB: {
			recurseA: {
				recurseB: "stop",
			},
		},
	},
};

export type ObjectWithSymbolOrRecursion = {
	recurse: ObjectWithSymbolOrRecursion | symbol;
};
export const objectWithSymbolOrRecursion: ObjectWithSymbolOrRecursion = {
	recurse: { recurse: Symbol("stop") },
};

/* eslint-enable @typescript-eslint/consistent-type-definitions */

export const simpleJson: JsonTypeWith<never> = { a: [{ b: { b2: 8 }, c: true }] };

// #endregion

// #region with literal types
export const objectWithLiterals = {
	true: true,
	false: false,
	zero: 0,
	string: "string",
	null: null,
} as const;
export const tupleWithLiterals = [true, false, 0, "string", null, 1e113] as const;
export const arrayOfLiterals: readonly (
	| true
	| 0
	| 1
	| "string"
	| "hello"
	// eslint-disable-next-line @rushstack/no-new-null
	| null
)[] = [true, 0, 1, "string", "hello", null];
// #endregion

// #region Class types
export class ClassWithPrivateData {
	public public = "public";
	// @ts-expect-error secret is never read
	private readonly secret = 0;
}
export const classInstanceWithPrivateData = new ClassWithPrivateData();
export class ClassWithPrivateMethod {
	public public = "public";
	// @ts-expect-error getSecret is never read
	private getSecret(): number {
		return 0;
	}
}
export const classInstanceWithPrivateMethod = new ClassWithPrivateMethod();
export class ClassWithPrivateGetter {
	public public = "public";
	// @ts-expect-error secret is never read
	private get secret(): number {
		return this.public.length;
	}
}
export const classInstanceWithPrivateGetter = new ClassWithPrivateGetter();
export class ClassWithPrivateSetter {
	public public = "public";
	// @ts-expect-error secret is never read
	private set secret(v: string) {
		this.public = v;
	}
}
export const classInstanceWithPrivateSetter = new ClassWithPrivateSetter();
export class ClassWithPublicData {
	public public = "public";
}
export const classInstanceWithPublicData = new ClassWithPublicData();
export class ClassWithPublicMethod {
	public public = "public";
	public getSecret(): number {
		return 0;
	}
}
export const classInstanceWithPublicMethod = new ClassWithPublicMethod();

/* eslint-enable unicorn/no-null */
/* eslint-enable jsdoc/require-jsdoc */