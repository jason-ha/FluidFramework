/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import {
	// Most clients should use IndependentMapFactory from @fluid-experimental/independent-state/alpha
	// until the interface is stabilized.
	createIndependentMap,
	type IFluidEphemeralDataStoreRuntime,
	type InternalTypes,
	type JsonDeserialized,
	type JsonEncodable,
} from "../index.js";

declare function createValueManager<T, Key extends string>(
	initial: JsonEncodable<T> & JsonDeserialized<T>,
): (
	key: Key,
	datastoreHandle: InternalTypes.IndependentDatastoreHandle<
		Key,
		InternalTypes.ValueRequiredState<T>
	>,
) => {
	value: InternalTypes.ValueRequiredState<T>;
	manager: InternalTypes.IndependentValue<JsonDeserialized<T>>;
};

// ---- test (example) code ----

const mapImplX = createIndependentMap(
	// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
	{} as IFluidEphemeralDataStoreRuntime,
	{
		cursor: createValueManager({ x: 0, y: 0 }),
		camera: () => ({
			value: { rev: 0, timestamp: Date.now(), value: { x: 0, y: 0, z: 0 } },
			// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
			manager: {} as InternalTypes.IndependentValue<{ x: number; y: number; z: number }>,
		}),
	},
);
// Workaround ts(2775): Assertions require every name in the call target to be declared with an explicit type annotation.
const mapImpl: typeof mapImplX = mapImplX;

const initialCaret = { id: "", pos: 0 };
mapImpl.add("caret", createValueManager(initialCaret));

const fakeAdd = mapImpl.camera.z + mapImpl.cursor.x + mapImpl.caret.pos;

// @ts-expect-error should error on typo detection
console.log(mapImpl.curso); // error to highlight typo detection (proper typing in effect)

// example of second add at existing key - results in union of types (should throw at runtime)
mapImpl.add("caret", createValueManager({ dupe: 0 }));

mapImpl.add(
	"undefined",
	// @ts-expect-error should error non-optional undefined
	createValueManager({ undef: undefined }),
);

mapImpl.add(
	"undefOrNum",
	// @ts-expect-error should error on non-optional that may be undefined
	createValueManager<{ undefOrNum: undefined | number }, "undefOrNum">({ undefOrNum: 4 }),
);

// optional undefined is ok - though not recommended to actually specify such properties with
// undefined values as the properties won't come back; they will be absent.
mapImpl.add(
	"optionalUndefined",
	createValueManager<{ undef?: number }, "optionalUndefined">({ undef: undefined }),
);
mapImpl.add(
	"optionalUndefinedPreferred",
	createValueManager<{ undef?: number }, "optionalUndefinedPreferred">({}),
);
