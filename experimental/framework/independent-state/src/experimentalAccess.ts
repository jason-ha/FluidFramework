/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import type {
	ContainerExtensionStore,
	IContainerExtension,
	IExtensionMessage,
	IExtensionRuntime,
} from "@fluidframework/container-definitions/internal";
import type { IContainerExperimental } from "@fluidframework/container-loader/internal";
import { assert } from "@fluidframework/core-utils/internal";
import type { IFluidContainer } from "@fluidframework/fluid-static";
import { isInternalFluidContainer } from "@fluidframework/fluid-static/internal";
import type { IContainerRuntimeBase } from "@fluidframework/runtime-definitions/internal";

import type { IEphemeralRuntime } from "./independentMap.js";
import type { IIndependentStateManager } from "./independentStateManager.js";
import { createPresenceStateManager } from "./independentStateManager.js";
import type { IndependentMap, IndependentMapAddress, IndependentMapSchema } from "./types.js";

function isContainerExtensionStore(
	manager: ContainerExtensionStore | IContainerRuntimeBase | IContainerExperimental,
): manager is ContainerExtensionStore {
	return (manager as ContainerExtensionStore).acquireExtension !== undefined;
}

/**
 * Common Presence manager for a container
 */
class ContainerIndependentStateManager implements IContainerExtension<never> {
	public readonly extension: IIndependentStateManager;
	public readonly interface = this;

	public constructor(runtime: IExtensionRuntime) {
		// TODO create the appropriate ephemeral runtime (map address must be in submitSignal, etc.)
		this.extension = createPresenceStateManager(runtime as unknown as IEphemeralRuntime);
	}

	public onNewContext(): void {
		// No-op
	}

	public static readonly extensionId = "dis:bb89f4c0-80fd-4f0c-8469-4f2848ee7f4a";

	public processSignal(address: string, message: IExtensionMessage, local: boolean): void {
		this.extension.processSignal(address, message, local);
	}
}

/**
 * Acquire an IndependentMap from a Fluid Container
 * @param fluidContainer - Fluid Container to acquire the map from
 * @param id - unique identifier for the map
 * @param requestedContent - workspace
 * @returns the IndependentMap
 *
 * @alpha
 */
export function acquireIndependentMap<TSchema extends IndependentMapSchema>(
	fluidContainer: IFluidContainer,
	id: IndependentMapAddress,
	requestedContent: TSchema,
): IndependentMap<TSchema> {
	assert(
		isInternalFluidContainer(fluidContainer),
		"IFluidContainer was not recognized. Only Containers generated by the Fluid Framework are supported.",
	);
	const innerContainer = fluidContainer.container;

	assert(
		isContainerExtensionStore(innerContainer),
		"Container does not support extensions. Make to enable experimental mode or use acquireIndependentMapViaDataObject.",
	);

	const ism = innerContainer.acquireExtension(
		ContainerIndependentStateManager.extensionId,
		ContainerIndependentStateManager,
	);
	return ism.acquireIndependentMap(id, requestedContent);
}