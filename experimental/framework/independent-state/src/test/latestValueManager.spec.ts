/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import {
	// Most clients should use IndependentMapFactory from @fluid-experimental/independent-state/alpha
	// until the interface is stabilized.
	createIndependentMap,
	type IFluidEphemeralDataStoreRuntime,
	Latest,
	type LatestValueClientData,
} from "../index.js";

// ---- test (example) code ----

const mapInferred = createIndependentMap(
	// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
	{} as IFluidEphemeralDataStoreRuntime,
	{
		cursor: Latest({ x: 0, y: 0 }),
		camera: Latest({ x: 0, y: 0, z: 0 }),
	},
);
// Workaround ts(2775): Assertions require every name in the call target to be declared with an explicit type annotation.
const map: typeof mapInferred = mapInferred;

map.add("caret", Latest({ id: "", pos: 0 }));

const fakeAdd = map.caret.local.pos + map.camera.local.z + map.cursor.local.x;

// @ts-expect-error local may be set wholly, but partially it is readonly
map.caret.local.pos = 0;

function logClientValue<T>({
	clientId,
	value,
}: Pick<LatestValueClientData<T>, "clientId" | "value">): void {
	console.log(clientId, value);
}

const cursor = map.cursor;

cursor.local = { x: 1, y: 2 };

cursor.on("updated", logClientValue);
cursor.off("updated", logClientValue);

for (const clientId of cursor.clients()) {
	logClientValue({ clientId, ...cursor.clientValue(clientId) });
}

for (const { clientId, value } of cursor.clientValues()) {
	logClientValue({ clientId, value });
}
