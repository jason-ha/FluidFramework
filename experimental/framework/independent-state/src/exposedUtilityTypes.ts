/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import type {
	InternalUtilityTypes,
	JsonDeserialized,
	JsonSerializable,
} from "@fluidframework/core-interfaces/internal";

/**
 * Recursively/deeply makes all properties of a type readonly.
 *
 * @beta
 */
export type FullyReadonly<T> = {
	readonly [K in keyof T]: FullyReadonly<T[K]>;
};

/**
 * `true` iff the given type is an acceptable shape for a notification.
 *
 * @beta
 */
export type IsNotificationEvent<Event> = Event extends (...args: infer P) => void
	? InternalUtilityTypes.IfSameType<P, JsonSerializable<P> & JsonDeserialized<P>, true, false>
	: false;

/**
 * Used to specify the kinds of notifications emitted by a {@link NotificationSubscribable}.
 *
 * @remarks
 *
 * Any object type is a valid NotificationEvents, but only the notification-like
 * properties of that type will be included.
 *
 * @example
 *
 * ```typescript
 * interface MyNotifications {
 *   load: (user: string, data: IUserData) => void;
 *   requestPause: (period: number) => void;
 * }
 * ```
 *
 * @beta
 */
export type NotificationEvents<E> = {
	[P in string & keyof E as IsNotificationEvent<E[P]> extends true ? P : never]: E[P];
};

/**
 * JsonDeserialized version of the parameters of a function.
 *
 * @beta
 */
export type JsonDeserializedParameters<T extends (...args: any) => any> = T extends (
	...args: infer P
) => any
	? JsonDeserialized<P>
	: never;

/**
 * JsonSerializable version of the parameters of a function.
 *
 * @beta
 */
export type JsonSerializableParameters<T extends (...args: any) => any> = T extends (
	...args: infer P
) => any
	? JsonSerializable<P>
	: never;
