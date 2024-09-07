/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import type { ConnectedClientId, IEphemeralRuntime } from "../index.js";
import { Notifications } from "../index.js";
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
		notifications: Notifications<
			{
				msg: (message: string) => void;
			},
			string
		>({
			msg: (clientId: ConnectedClientId, message: string) => {
				console.log(`${clientId} says, "${message}"`);
			},
		}),
	},
);
// Workaround ts(2775): Assertions require every name in the call target to be declared with an explicit type annotation.
const map: typeof externalMap = externalMap;

const NF = Notifications({
	newId: (clientId: ConnectedClientId, id: number): void => {
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
// 		newId: (clientId: ConnectedClientId, id: number) => {
// 			console.log(`${clientId} has a new id: ${id}`);
// 		},
// 	}),
// );

function logUnattended(
	name: string,
	clientId: ConnectedClientId,
	...content: unknown[]
): void {
	console.log(`${clientId} sent unattended notification '${name}' with content`, ...content);
}

const notifications = map.notifications;

notifications.emit.broadcast("msg", "howdy");

const unattendedOff = notifications.events.on("unattendedNotification", logUnattended);
unattendedOff();
