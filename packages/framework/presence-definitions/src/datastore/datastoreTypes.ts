/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import type { AttendeeId, ClientConnectionId } from "@fluid-internal/presence-definitions";
import type { InternalTypes } from "@fluid-internal/presence-definitions/internal";

/**
 * `ConnectionValueState` is known value state for `clientToSessionId` data.
 *
 * @remarks
 * It is {@link InternalTypes.ValueRequiredState} with a known value type.
 */
interface ConnectionValueState extends InternalTypes.ValueStateMetadata {
	value: AttendeeId;
}

/**
 * The system workspace's datastore structure.
 */
export interface SystemWorkspaceDatastore {
	clientToSessionId: {
		[ConnectionId: ClientConnectionId]: ConnectionValueState;
	};
}
