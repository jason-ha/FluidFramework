/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import type { IFluidDataStoreRuntime, Serializable } from "@fluidframework/datastore-definitions";

// Proper clients use EphemeralIndependentDirectory from @fluid-experimental/ephemeral-independent
// until the interface is stabilized.
import { createEphemeralIndependentMap } from "../independentMap.js";

import type { InternalTypes, RoundTrippable } from "../index.js";

declare function createValueManager<T, Key extends string>(
	initial: Serializable<T>,
): (
	key: Key,
	datastoreHandle: InternalTypes.IndependentDatastoreHandle<Key, InternalTypes.ValueState<T>>,
) => {
	value: InternalTypes.ValueState<T>;
	manager: InternalTypes.IndependentValue<RoundTrippable<T>>;
};

// ---- test (example) code ----

const mapImplX = createEphemeralIndependentMap(
	// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
	{} as IFluidDataStoreRuntime,
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
console.log(mapImpl.curso.x); // error to highlight typo detection (proper typing in effect)

// example of second add at existing key - results in union of types (should throw at runtime)
mapImpl.add("caret", createValueManager({ dupe: 0 }));
