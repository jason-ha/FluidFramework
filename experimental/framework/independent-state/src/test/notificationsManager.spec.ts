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
	newId: (clientId: ClientId, id: number): void => {
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

function logUnattended(name: string, clientId: ClientId, ...content: unknown[]): void {
	console.log(`${clientId} sent unattended notification '${name}' with content`, ...content);
}

const notifications = map.notifications;

notifications.emit.broadcast("msg", "howdy");

const unattendedOff = notifications.events.on("unattendedNotification", logUnattended);
unattendedOff();
