/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import type { IFluidDataStoreRuntime } from "@fluidframework/datastore-definitions";

import { Latest, type LatestValueClientData } from "../index.js";

// Proper clients use EphemeralIndependentDirectory from @fluid-experimental/ephemeral-independent
// eslint-disable-next-line import/no-internal-modules
import { createEphemeralIndependentMap } from "../independentMap.js";

// ---- test (example) code ----

const mapInferred = createEphemeralIndependentMap(
	// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
	{} as IFluidDataStoreRuntime,
	{
		cursor: Latest({ x: 0, y: 0 }),
		camera: Latest({ x: 0, y: 0, z: 0 }),
	},
);
// Workaround ts(2775): Assertions require every name in the call target to be declared with an explicit type annotation.
const map: typeof mapInferred = mapInferred;

map.add("caret", Latest({ id: "", pos: 0 }));

const fakeAdd = map.caret.local.pos + map.camera.local.z + map.cursor.local.x;

// TODO: make direct write to local an error. The object returned by local should be readonly.
map.caret.local.pos = 0; // error

function logClientValue<T>({
	clientId,
	value,
}: Pick<LatestValueClientData<T>, "clientId" | "value">) {
	console.log(clientId, value);
}

const cursor = map.cursor;

cursor.local = { x: 1, y: 2 };

cursor.on("update", logClientValue);
cursor.off("update", logClientValue);

cursor.clients().forEach((clientId) => {
	logClientValue({ clientId, ...cursor.clientValue(clientId) });
});

for (const { clientId, value } of cursor.clientValues()) {
	logClientValue({ clientId, value });
}
