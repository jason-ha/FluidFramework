/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import type { IEphemeralRuntime, LatestMapItemValueClientData } from "../index.js";
import { LatestMap } from "../index.js";
import {
	// Most clients should use acquirePresence from @fluid-experimental/presence
	// until the interface is stabilized.
	createPresenceStates as createIndependentMap,
} from "../presenceStates.js";

// ---- test (example) code ----

const { externalMap } = createIndependentMap(
	// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
	{} as IEphemeralRuntime,
	{
		fixedMap: LatestMap({ key1: { x: 0, y: 0 }, key2: { ref: "default", someId: 0 } }),
	},
);
// Workaround ts(2775): Assertions require every name in the call target to be declared with an explicit type annotation.
const map: typeof externalMap = externalMap;

map.fixedMap.local.get("key1");
// @ts-expect-error with inferred keys only those named it init are accessible
map.fixedMap.local.get("key3");

map.fixedMap.local.set("key2", { x: 0, y: 2 });
map.fixedMap.local.set("key2", { ref: "string", someId: -1 });
// inferred case may allow "alternate" properties to be set undefined, but those will never transmit
map.fixedMap.local.set("key2", { x: undefined, y: undefined, ref: "string", someId: -1 });
// @ts-expect-error with inferred type partial values are errors
map.fixedMap.local.set("key2", { x: 0 });
// @ts-expect-error with inferred heterogenous type mixed type values are errors
map.fixedMap.local.set("key2", { x: 0, y: 2, ref: "a", someId: 3 });

for (const key of map.fixedMap.local.keys()) {
	const value = map.fixedMap.local.get(key);
	console.log(key, value);
}

interface PointerData {
	x: number;
	y: number;
	pressure?: number;
	tilt?: number;
}

map.add("pointers", LatestMap<PointerData, "pointers">({}));

const pointers = map.pointers;
const localPointers = pointers.local;

function logClientValue<T>({
	clientId,
	key,
	value,
}: Pick<
	LatestMapItemValueClientData<T, string | number>,
	"clientId" | "key" | "value"
>): void {
	console.log(clientId, key, value);
}

localPointers.set("pen", { x: 1, y: 2 });

const pointerItemUpdatedOff = pointers.events.on("itemUpdated", logClientValue);
pointerItemUpdatedOff();

for (const clientId of pointers.clients()) {
	const clientData = pointers.clientValue(clientId);
	for (const [key, { value }] of clientData.items.entries()) {
		logClientValue({ clientId, key, value });
	}
}

for (const { clientId, items } of pointers.clientValues()) {
	for (const [key, { value }] of items.entries()) logClientValue({ clientId, key, value });
}

pointers.events.on("itemRemoved", ({ clientId, key }) =>
	logClientValue<string>({ clientId, key, value: "<removed>" }),
);

pointers.events.on("updated", ({ clientId, items }) => {
	for (const [key, { value }] of items.entries()) logClientValue({ clientId, key, value });
});
