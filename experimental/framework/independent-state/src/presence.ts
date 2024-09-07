/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import type { ConnectedClientId as ConnectedClientId } from "./baseTypes.js";
import type { InternalTypes } from "./exposedInternalTypes.js";
import type { NotificationsManager } from "./notificationsManager.js";
import type {
	PresenceStates as PresenceStates,
	PresenceWorkspaceAddress as PresenceWorkspaceAddress,
	PresenceStatesSchema as PresenceStatesSchema,
} from "./types.js";

/**
 * @alpha
 */
export interface ISessionClient {
	/**
	 * Get current client connection id.
	 *
	 * @returns Current client connection id.
	 *
	 * @remarks
	 * Connection id will change on reconnection.
	 */
	currentClientId(): ConnectedClientId;
}

/**
 * @alpha
 */
export interface IPresence {
	getAttendees(): ReadonlyMap<ConnectedClientId, ISessionClient>;
	getAttendee(clientId: ConnectedClientId): ISessionClient;
	getMyself(): ISessionClient;

	/**
	 * Acquires a PresenceStates workspace from store or adds new one.
	 *
	 * @param workspaceAddress - Address of the requested PresenceStates Workspace
	 * @returns A PresenceStates workspace
	 */
	getStates<StatesSchema extends PresenceStatesSchema>(
		workspaceAddress: PresenceWorkspaceAddress,
		requestedContent: StatesSchema,
	): PresenceStates<StatesSchema>;

	/**
	 * Acquires a Notifications workspace from store or adds new one.
	 *
	 * @param workspaceAddress - Address of the requested Notifications Workspace
	 * @returns A Notifications workspace
	 */
	getNotifications<
		NotificationsSchema extends {
			[key: string]: InternalTypes.ManagerFactory<
				typeof key,
				InternalTypes.ValueRequiredState<InternalTypes.NotificationType>,
				NotificationsManager<any>
			>;
		},
	>(
		notifcationsId: PresenceWorkspaceAddress,
		requestedContent: NotificationsSchema,
	): PresenceStates<NotificationsSchema, NotificationsManager<any>>;
}
