/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import {
	// Most clients should use IndependentMapFactory from @fluid-experimental/independent-state/alpha
	// until the interface is stabilized.
	createIndependentMap,
	type ClientId,
	type IFluidEphemeralDataStoreRuntime,
	Notifications,
} from "../index.js";

// ---- test (example) code ----

const mapInferred = createIndependentMap(
	// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
	{} as IFluidEphemeralDataStoreRuntime,
	{
		notifications: Notifications<
			{
				msg: (message: string) => void;
			},
			string
		>({
			msg: (clientId: ClientId, message: string) => {
				console.log(`${clientId} says, "${message}"`);
			},
		}),
	},
);
// Workaround ts(2775): Assertions require every name in the call target to be declared with an explicit type annotation.
const map: typeof mapInferred = mapInferred;

const NF = Notifications({
	newId: (clientId: ClientId, id: number) => {
		console.log(`${clientId} has a new id: ${id}`);
	},
});

map.add("my_events", NF);
// 	Notifications<
// 		{
// 			newId: (id: number) => void;
// 		},
// 		"events"
// 	>({
// 		newId: (clientId: ClientId, id: number) => {
// 			console.log(`${clientId} has a new id: ${id}`);
// 		},
// 	}),
// );

// const fakeAdd = map.caret.local.pos + map.camera.local.z + map.notifications.local.x;

// // @ts-expect-error local may be set wholly, but partially it is readonly
// map.caret.local.pos = 0;

function logClientValue<
	T /* following extends should not be required: */ extends Record<string, unknown>,
>(name: string, clientId: ClientId, ...content: unknown[]): void {
	console.log(`${clientId} sent unattended notification '${name}' with conent`, ...content);
}

const notifications = map.notifications;

notifications.emit.broadcast("msg", "howdy");

const unattendedOff = notifications.events.on("unsubscribedNotification", logClientValue);
unattendedOff();
