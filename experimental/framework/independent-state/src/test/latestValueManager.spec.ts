/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import {
	// Most clients should use acquireIndependentMap from @fluid-experimental/independent-state
	// until the interface is stabilized.
	createIndependentMap,
} from "../independentMap.js";
import { type IEphemeralRuntime, Latest, type LatestValueClientData } from "../index.js";

// ---- test (example) code ----

const { externalMap } = createIndependentMap(
	// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
	{} as IEphemeralRuntime,
	"name:test",
	{
		cursor: Latest({ x: 0, y: 0 }),
		camera: Latest({ x: 0, y: 0, z: 0 }),
	},
);
// Workaround ts(2775): Assertions require every name in the call target to be declared with an explicit type annotation.
const map: typeof externalMap = externalMap;

map.add("caret", Latest({ id: "", pos: 0 }));

const fakeAdd = map.caret.local.pos + map.camera.local.z + map.cursor.local.x;

// @ts-expect-error local may be set wholly, but partially it is readonly
map.caret.local.pos = 0;

function logClientValue<
	T /* following extends should not be required: */ extends Record<string, unknown>,
>({ clientId, value }: Pick<LatestValueClientData<T>, "clientId" | "value">): void {
	console.log(clientId, value);
}

// Create new cursor state
const cursor = map.cursor;

// Update our cursor position
cursor.local = { x: 1, y: 2 };

// Listen to others cursor updates
const cursorUpdatedOff = cursor.events.on("updated", ({ clientId, value }) =>
	console.log(`client ${clientId}'s cursor is now at (${value.x},${value.y})`),
);
cursorUpdatedOff();

for (const clientId of cursor.clients()) {
	logClientValue({ clientId, ...cursor.clientValue(clientId) });
}

// Enumerate all cursor values
for (const { clientId, value } of cursor.clientValues()) {
	logClientValue({ clientId, value });
}
