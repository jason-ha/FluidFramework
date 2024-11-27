/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import { createEmitter } from "@fluid-internal/client-utils";
import type { Listeners } from "@fluidframework/core-interfaces";
import type { JsonTypeWith } from "@fluidframework/presence/internal/core-interfaces";
import type { InternalTypes } from "@fluidframework/presence/internal/exposedInternalTypes";
import type { InternalUtilityTypes } from "@fluidframework/presence/internal/exposedUtilityTypes";

import type { ValueManager } from "./internalTypes.js";
import type {
	NotificationEmitter,
	NotificationsManager,
	NotificationsManagerEvents,
	NotificationSubscriptions,
} from "./notificationsManagerTypes.js";
import type { ISessionClient } from "./sessionClientTypes.js";
import { datastoreFromHandle, type StateDatastore } from "./stateDatastore.js";
import { brandIVM } from "./valueManager.js";

/**
 * Object.keys retyped to support specific records keys and
 * branded string-based keys.
 */
const recordKeys = Object.keys as <K extends string>(o: Partial<Record<K, unknown>>) => K[];

class NotificationsManagerImpl<
	T extends InternalUtilityTypes.NotificationListeners<T>,
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
				{
					rev: 0,
					timestamp: 0,
					value: { name, args: [...(args as JsonTypeWith<never>[])] },
					ignoreUnmonitored: true,
				},
				// This is a notification, so we want to send it immediately.
				{ allowableUpdateLatencyMs: 0 },
			);
		},
		unicast: (name, targetClient, ...args) => {
			this.datastore.localUpdate(
				this.key,
				{
					rev: 0,
					timestamp: 0,
					value: { name, args: [...(args as JsonTypeWith<never>[])] },
					ignoreUnmonitored: true,
				},
				// This is a notification, so we want to send it immediately.
				{ allowableUpdateLatencyMs: 0, targetClientId: targetClient.getConnectionId() },
			);
		},
	};

	// Workaround for types
	private readonly notificationsInternal = createEmitter<NotificationSubscriptions<T>>();

	// @ts-expect-error TODO
	public readonly notifications: NotificationListenable<T> = this.notificationsInternal;

	public constructor(
		private readonly key: Key,
		private readonly datastore: StateDatastore<
			Key,
			InternalTypes.ValueRequiredState<InternalTypes.NotificationType>
		>,
		initialSubscriptions: Partial<NotificationSubscriptions<T>>,
	) {
		// Add event listeners provided at instantiation
		for (const subscriptionName of recordKeys(initialSubscriptions)) {
			// Lingering Event typing issues with Notifications specialization requires
			// this cast. The only thing that really matters is that name is a string.
			const name = subscriptionName as keyof Listeners<NotificationSubscriptions<T>>;
			const value = initialSubscriptions[subscriptionName];
			// This check should not be needed while using exactOptionalPropertyTypes, but
			// typescript appears to ignore that with Partial<>. Good to be defensive
			// against callers sending `undefined` anyway.
			if (value !== undefined) {
				this.notificationsInternal.on(name, value);
			}
		}
	}

	public update(
		client: ISessionClient,
		_received: number,
		value: InternalTypes.ValueRequiredState<InternalTypes.NotificationType>,
	): void {
		const eventName = value.value.name as keyof Listeners<NotificationSubscriptions<T>>;
		if (this.notificationsInternal.hasListeners(eventName)) {
			// Without schema validation, we don't know that the args are the correct type.
			// For now we assume the user is sending the correct types and there is no corruption along the way.
			const args = [client, ...value.value.args] as Parameters<
				NotificationSubscriptions<T>[typeof eventName]
			>;
			this.notificationsInternal.emit(eventName, ...args);
		} else {
			this.events.emit(
				"unattendedNotification",
				value.value.name,
				client,
				...value.value.args,
			);
		}
	}
}

/**
 * Factory for creating a {@link NotificationsManager}.
 *
 * @remarks
 * Typescript inference for `Notifications` is not working correctly yet.
 * Explicitly specify generics to make result types usable.
 *
 * @alpha
 */
export function Notifications<
	T extends InternalUtilityTypes.NotificationListeners<T>,
	Key extends string = string,
>(
	initialSubscriptions: Partial<NotificationSubscriptions<T>>,
): InternalTypes.ManagerFactory<
	Key,
	InternalTypes.ValueRequiredState<InternalTypes.NotificationType>,
	NotificationsManager<T>
> {
	const factory = (
		key: Key,
		datastoreHandle: InternalTypes.StateDatastoreHandle<
			Key,
			InternalTypes.ValueRequiredState<InternalTypes.NotificationType>
		>,
	): {
		manager: InternalTypes.StateValue<NotificationsManager<T>>;
	} => ({
		manager: brandIVM<
			NotificationsManagerImpl<T, Key>,
			InternalTypes.NotificationType,
			InternalTypes.ValueRequiredState<InternalTypes.NotificationType>
		>(
			new NotificationsManagerImpl(
				key,
				datastoreFromHandle(datastoreHandle),
				initialSubscriptions,
			),
		),
	});
	return Object.assign(factory, { instanceBase: NotificationsManagerImpl });
}
