/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import type {
	InternalUtilityTypes as CoreInternalUtilityTypes,
	JsonDeserialized,
	JsonSerializable,
} from "@fluidframework/core-interfaces/internal";

/**
 * Collection of utility types that are not intended to be used/imported
 * directly outside of this package.
 *
 * @beta
 * @system
 */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace InternalUtilityTypes {
	/**
	 * Recursively/deeply makes all properties of a type readonly.
	 *
	 * @beta
	 * @system
	 */
	export type FullyReadonly<T> = {
		readonly [K in keyof T]: FullyReadonly<T[K]>;
	};

	/**
	 * `true` iff the given type is an acceptable shape for a notification.
	 *
	 * @beta
	 * @system
	 */
	export type IsNotificationEvent<Event> = Event extends (...args: infer P) => void
		? CoreInternalUtilityTypes.IfSameType<
				P,
				JsonSerializable<P> & JsonDeserialized<P>,
				true,
				false
			>
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
	 * @system
	 */
	export type NotificationEvents<E> = {
		[P in string & keyof E as IsNotificationEvent<E[P]> extends true ? P : never]: E[P];
	};

	/**
	 * {@link @fluidframework/core-interfaces#JsonDeserialized} version of the parameters of a function.
	 *
	 * @beta
	 * @system
	 */
	export type JsonDeserializedParameters<T extends (...args: any) => any> = T extends (
		...args: infer P
	) => any
		? JsonDeserialized<P>
		: never;

	/**
	 * {@link @fluidframework/core-interfaces#JsonSerializable} version of the parameters of a function.
	 *
	 * @beta
	 * @system
	 */
	export type JsonSerializableParameters<T extends (...args: any) => any> = T extends (
		...args: infer P
	) => any
		? JsonSerializable<P>
		: never;
}
