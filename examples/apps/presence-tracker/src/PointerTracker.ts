/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import {
	type ClientId,
	type IndependentMap,
	LatestMap,
	type LatestMapValueManager,
} from "@fluid-experimental/independent-state";
import { TypedEventEmitter } from "@fluid-internal/client-utils";
import type { IEvent } from "@fluidframework/core-interfaces";
import type { IMember, IServiceAudience } from "fluid-framework";

export interface IPointerTrackerEvents extends IEvent {
	(event: "pointerChanged", listener: () => void): void;
}

type PointerId = PointerEvent["pointerId"];

export interface IPointerInfo {
	x: number;
	y: number;
	pressure: number;
}

export class PointerTracker extends TypedEventEmitter<IPointerTrackerEvents> {
	private readonly pointers: LatestMapValueManager<IPointerInfo, PointerId>;

	/**
	 * Local map of pointer position status for clients
	 *
	 * ```
	 * Map<ClientId, Map<number, IPointerPosition>>
	 * ```
	 */
	private readonly pointersMap = new Map<ClientId, Map<PointerId, IPointerInfo>>();

	constructor(
		public readonly audience: IServiceAudience<IMember>,
		// eslint-disable-next-line @typescript-eslint/ban-types
		map: IndependentMap<{}>,
	) {
		super();

		map.add("pointers", LatestMap<IPointerInfo, "pointers", PointerId>());
		this.pointers = map.pointers;

		this.audience.on("memberRemoved", (clientId: ClientId, member: IMember) => {
			this.pointersMap.delete(clientId);
			this.emit("pointerChanged");
		});

		this.pointers.events.on("updated", ({ clientId, items }) => {
			const clientPointers = this.getClientPointers(clientId);
			items.forEach((item, key) => {
				clientPointers.set(key, item.value);
			});
			this.emit("pointerChanged");
		});

		this.pointers.events.on("itemRemoved", ({ clientId, key }) => {
			if (this.pointersMap.get(clientId)?.delete(key) ?? false) {
				this.emit("pointerChanged");
			}
		});

		window.addEventListener("pointermove", (e) => {
			// Alert all connected clients that there has been a change to a client's pointer info
			this.pointers.local.set(e.pointerId, {
				x: e.clientX,
				y: e.clientY,
				pressure: e.pressure,
			});
		});

		window.addEventListener("pointerleave", (e) => {
			// Alert all connected clients that client's pointer is gone
			this.pointers.local.delete(e.pointerId);
		});
	}

	private getClientPointers(clientId: ClientId): Map<PointerId, IPointerInfo> {
		let clientPointers = this.pointersMap.get(clientId);
		if (clientPointers === undefined) {
			clientPointers = new Map();
			this.pointersMap.set(clientId, clientPointers);
		}
		return clientPointers;
	}

	public getPointerPresences(): Map<string, IPointerInfo> {
		const statuses = new Map<string, IPointerInfo>();
		this.audience.getMembers().forEach((member) => {
			member.connections.forEach((connection) => {
				const pointers = this.pointersMap.get(connection.id);
				if (pointers !== undefined) {
					pointers.forEach((pointer, pointerId) =>
						statuses.set(`${(member as any).userName}.${pointerId}`, pointer),
					);
				}
			});
		});
		return statuses;
	}
}
