/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import type {
	IndependentMap as IndependentMapFacade,
	IndependentMapAddress,
	IndependentMapFactory as IndependentMapFactoryFacade,
	IndependentStateManager as IndependentStateManagerFacade,
} from "@fluidframework/container-definitions/internal";
import type { IContainerExperimental } from "@fluidframework/container-loader/internal";
import type { IndependentMapFactory } from "@fluidframework/container-runtime/internal";
import { assert } from "@fluidframework/core-utils/internal";
import type { IFluidContainer } from "@fluidframework/fluid-static";
import type { IFluidContainerInternal } from "@fluidframework/fluid-static/internal";
import type {
	IContainerRuntimeBase,
	IInboundSignalMessage,
} from "@fluidframework/runtime-definitions/internal";

import { createIndependentMap, type IEphemeralRuntime } from "./independentMap.js";
import type { IndependentMap, IndependentMapSchema } from "./types.js";

function isIndependentStateManagerFacade(
	manager: IndependentStateManagerFacade | IContainerRuntimeBase | IContainerExperimental,
): manager is IndependentStateManagerFacade {
	return (manager as IndependentStateManagerFacade).acquireIndependentMap !== undefined;
}

/**
 * Acquire an IndependentMap from a Fluid Container
 * @param fluidContainer - Fluid Container to acquire the map from
 * @param id - unique identifier for the map
 * @param requestedContent -
 * @returns the IndependentMap
 *
 * @alpha
 */
export function acquireIndependentMap<TSchema extends IndependentMapSchema>(
	fluidContainer: IFluidContainer,
	id: IndependentMapAddress,
	requestedContent: TSchema,
): IndependentMap<TSchema> {
	const fluidContainerInternal = fluidContainer as IFluidContainerInternal;
	assert(
		fluidContainerInternal.INTERNAL_CONTAINER_DO_NOT_USE !== undefined,
		"IFluidContainer does not have inner container",
	);
	const innerContainer = fluidContainerInternal.INTERNAL_CONTAINER_DO_NOT_USE();
	assert(
		isIndependentStateManagerFacade(innerContainer),
		"Container does not support Independent State",
	);
	return acquireIndependentMapFromManager(innerContainer, id, requestedContent);
}

/**
 * Acquire an IndependentMap from a Container Runtime
 * @internal
 */
export function acquireIndependentMapInternal<TSchema extends IndependentMapSchema>(
	runtime: IContainerRuntimeBase,
	id: IndependentMapAddress,
	requestedContent: TSchema,
): IndependentMap<TSchema> {
	assert(
		isIndependentStateManagerFacade(runtime),
		"Runtime does not support Independent State",
	);
	return acquireIndependentMapFromManager(runtime, id, requestedContent);
}

function facade<TSchema extends IndependentMapSchema>(
	factory: IndependentMapFactory<TSchema, IndependentMap<TSchema>>,
): IndependentMapFactoryFacade<IndependentMapFacade<TSchema>> {
	return factory;
}

type ConstructorReturnType<T extends abstract new (...args: any) => any> =
	T extends abstract new (...args: any) => infer P ? P : never;

class IndependentMapEntry<TSchema extends IndependentMapSchema>
	implements ConstructorReturnType<IndependentMapFactory<TSchema, IndependentMap<TSchema>>>
{
	public readonly map: IndependentMap<TSchema>;
	public readonly processSignal: (signal: IInboundSignalMessage, local: boolean) => void;
	public readonly ensureContent: (content: TSchema) => void;

	public constructor(
		runtime: IEphemeralRuntime,
		signalAddress: string,
		initialContent: TSchema,
	) {
		const { externalMap, internalMap } = createIndependentMap(
			runtime,
			signalAddress,
			initialContent,
		);
		this.map = externalMap;
		this.processSignal = internalMap.processSignal.bind(internalMap);
		this.ensureContent = internalMap.ensureContent.bind(internalMap);
	}
}

/**
 * Acquire an IndependentMap from IndependentStateManager
 */
function acquireIndependentMapFromManager<TSchema extends IndependentMapSchema>(
	manager: IndependentStateManagerFacade,
	id: IndependentMapAddress,
	requestedContent: TSchema,
): IndependentMap<TSchema> {
	const mapFacade = manager.acquireIndependentMap(
		id,
		requestedContent,
		facade(IndependentMapEntry<TSchema>),
	);
	return mapFacade as unknown as IndependentMap<TSchema>;
}
