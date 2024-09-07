/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import type { ConnectedClientId } from "./baseTypes.js";
import type { ISubscribable } from "./events.js";
import { createEmitter } from "./events.js";
import type { InternalTypes } from "./exposedInternalTypes.js";
import type { InternalUtilityTypes } from "./exposedUtilityTypes.js";
import type { ValueManager } from "./internalTypes.js";
import { datastoreFromHandle, type StateDatastore } from "./stateDatastore.js";
import { brandIVM } from "./valueManager.js";

/**
 * @beta
 */
export interface NotificationsManagerEvents {
	/**
	 * Raised when notification is received, but no subscribers were found.
	 *
	 * @eventProperty
	 */
	unattendedNotification: (
		name: string,
		sender: ConnectedClientId,
		...content: unknown[]
	) => void;
}

/**
 * An object which allows the registration of listeners so that subscribers can be
 * notified when a notification happens.
 *
 * @beta
 */
export interface NotificationSubscribable<
	E extends InternalUtilityTypes.NotificationEvents<E>,
> {
	/**
	 * Register a notification listener.
	 * @param notificationName - the name of the notification
	 * @param listener - the handler to run when the notification is received from other client
	 * @returns a function which will deregister the listener when run. This function
	 * has undefined behavior if called more than once.
	 */
	on<K extends keyof InternalUtilityTypes.NotificationEvents<E>>(
		notificationName: K,
		listener: (
			sender: ConnectedClientId,
			...args: InternalUtilityTypes.JsonDeserializedParameters<E[K]>
		) => void,
	): () => void;
}

/**
 * Record of notification subscriptions.
 *
 * @beta
 */
export type NotificationSubscriptions<E extends InternalUtilityTypes.NotificationEvents<E>> = {
	[K in string & keyof InternalUtilityTypes.NotificationEvents<E>]: (
		sender: ConnectedClientId,
		...args: InternalUtilityTypes.JsonSerializableParameters<E[K]>
	) => void;
};

/**
 * Interface for a notification emitter that can send typed notification to other clients.
 *
 * @beta
 */
export interface NotificationEmitter<E extends InternalUtilityTypes.NotificationEvents<E>> {
	/**
	 * Emits a notification with the specified name and arguments, notifying all clients.
	 * @param notificationName - the name of the notification to fire
	 * @param args - the arguments sent with the notification
	 */
	broadcast<K extends string & keyof InternalUtilityTypes.NotificationEvents<E>>(
		notificationName: K,
		...args: Parameters<E[K]>
	): void;

	/**
	 * Emits a notification with the specified name and arguments, notifying a single client.
	 * @param notificationName - the name of the notification to fire
	 * @param targetClientId - the single client to notify
	 * @param args - the arguments sent with the notification
	 */
	unicast<K extends string & keyof InternalUtilityTypes.NotificationEvents<E>>(
		notificationName: K,
		targetClientId: ConnectedClientId,
		...args: Parameters<E[K]>
	): void;
}

/**
 * Value manager that provides notifications from this client to others and subscription
 * to their notifications.
 *
 * @remarks Create using {@link Latest} registered to {@link PresenceStates}.
 *
 * @beta
 */
export interface NotificationsManager<T extends InternalUtilityTypes.NotificationEvents<T>> {
	/**
	 * Events for Notifications manager.
	 */
	readonly events: ISubscribable<NotificationsManagerEvents>;

	/**
	 * Send notifications to other clients.
	 */
	readonly emit: NotificationEmitter<T>;

	/**
	 * Provides subscription to notifications from other clients.
	 */
	readonly notifications: NotificationSubscribable<T>;
}

class NotificationsManagerImpl<
	T extends InternalUtilityTypes.NotificationEvents<T>,
	Key extends string,
> implements
		NotificationsManager<T>,
		ValueManager<
			InternalTypes.NotificationType,
			InternalTypes.ValueRequiredState<InternalTypes.NotificationType>
		>
{
	public readonly events = createEmitter<NotificationsManagerEvents>();

	public readonly emit: NotificationEmitter<T> = {
		broadcast: (name, ...args) => {
			this.datastore.localUpdate(
				this.key,
				// @ts-expect-error TODO
				{ rev: 0, timestamp: 0, value: { name, args: [...args] } },
				true,
			);
		},
		unicast: (name, targetClientId, ...args) => {
			this.datastore.localUpdate(
				this.key,
				// @ts-expect-error TODO
				{ rev: 0, timestamp: 0, value: { name, args: [...args] } },
				targetClientId,
			);
		},
	};

	// @ts-expect-error TODO
	public readonly notifications: NotificationSubscribable<T> =
		// @ts-expect-error TODO
		createEmitter<NotificationSubscriptions<T>>();

	public constructor(
		private readonly key: Key,
		private readonly datastore: StateDatastore<
			Key,
			InternalTypes.ValueRequiredState<InternalTypes.NotificationType>
		>,
		_initialSubscriptions: NotificationSubscriptions<T>,
		public readonly value: InternalTypes.ValueRequiredState<InternalTypes.NotificationType>,
	) {}

	public update(
		clientId: string,
		_received: number,
		value: InternalTypes.ValueRequiredState<InternalTypes.NotificationType>,
	): void {
		this.events.emit(
			"unattendedNotification",
			value.value.name,
			clientId,
			...value.value.args,
		);
	}
}

/**
 * Factory for creating a {@link NotificationsManager}.
 *
 * @beta
 */
export function Notifications<
	T extends InternalUtilityTypes.NotificationEvents<T>,
	Key extends string,
>(
	initialSubscriptions: NotificationSubscriptions<T>,
): InternalTypes.ManagerFactory<
	Key,
	InternalTypes.ValueRequiredState<InternalTypes.NotificationType>,
	NotificationsManager<T>
> {
	const value: InternalTypes.ValueRequiredState<InternalTypes.NotificationType> = {
		rev: 0,
		timestamp: Date.now(),
		value: { name: "", args: [] },
	};
	return (
		key: Key,
		datastoreHandle: InternalTypes.StateDatastoreHandle<
			Key,
			InternalTypes.ValueRequiredState<InternalTypes.NotificationType>
		>,
	) => ({
		value,
		manager: brandIVM<
			NotificationsManagerImpl<T, Key>,
			InternalTypes.NotificationType,
			InternalTypes.ValueRequiredState<InternalTypes.NotificationType>
		>(
			new NotificationsManagerImpl(
				key,
				datastoreFromHandle(datastoreHandle),
				initialSubscriptions,
				value,
			),
		),
	});
}
