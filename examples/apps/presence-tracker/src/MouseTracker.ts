/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import {
	type ClientId,
	type IndependentMap,
	Latest,
	type LatestValueManager,
} from "@fluid-experimental/independent-state";
import { TypedEventEmitter } from "@fluid-internal/client-utils";
import type { IAzureAudience } from "@fluidframework/azure-client";
import type { IEvent } from "@fluidframework/core-interfaces";
import type { IMember } from "fluid-framework";

export interface IMouseTrackerEvents extends IEvent {
	(event: "mousePositionChanged", listener: () => void): void;
}

export interface IMousePosition {
	x: number;
	y: number;
}

export interface IMouseSignalPayload {
	userId?: string;
	pos: IMousePosition;
}

export class MouseTracker extends TypedEventEmitter<IMouseTrackerEvents> {
	private readonly cursor: LatestValueManager<IMousePosition>;

	/**
	 * Local map of mouse position status for clients
	 *
	 * ```
	 * Map<ClientId, IMousePosition>
	 * ```
	 */
	private readonly posMap = new Map<ClientId, IMousePosition>();

	constructor(
		public readonly audience: IAzureAudience,
		// eslint-disable-next-line @typescript-eslint/ban-types
		map: IndependentMap<{}>,
	) {
		super();

		map.add("cursor", Latest({ x: 0, y: 0 }));
		this.cursor = map.cursor;

		this.audience.on("memberRemoved", (clientId: string, member: IMember) => {
			this.posMap.delete(clientId);
			this.emit("mousePositionChanged");
		});

		this.cursor.events.on("updated", ({ clientId, value }) => {
			this.posMap.set(clientId, value);
			this.emit("mousePositionChanged");
		});
		window.addEventListener("mousemove", (e) => {
			// Alert all connected clients that there has been a change to a client's mouse position
			this.cursor.local = {
				x: e.clientX,
				y: e.clientY,
			};
		});
	}

	public getMousePresences(): Map<string, IMousePosition> {
		const statuses: Map<string, IMousePosition> = new Map<string, IMousePosition>();
		this.audience.getMembers().forEach((member) => {
			member.connections.forEach((connection) => {
				const position = this.posMap.get(connection.id);
				if (position !== undefined) {
					statuses.set(member.name, position);
				}
			});
		});
		return statuses;
	}
}
