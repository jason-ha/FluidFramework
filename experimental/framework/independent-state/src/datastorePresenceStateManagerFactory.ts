/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Hacky support for internal datastore based usages.
 */

// imports
// import type { IContainerRuntime } from "@fluidframework/container-runtime-definitions/internal";
import type { IFluidLoadable } from "@fluidframework/core-interfaces";
import type { FluidDataStoreRuntime } from "@fluidframework/datastore/internal";
// import type {
// 	AliasResult,
// 	IContainerRuntimeBase,
// 	NamedFluidDataStoreRegistryEntry,
// } from "@fluidframework/runtime-definitions/internal";
import type { SharedObjectKind } from "@fluidframework/shared-object-base";

import { BasicDataStoreFactory, LoadableFluidObject } from "./datastoreSupport.js";
import {
	createPresenceStateManager,
	type IIndependentStateManager,
} from "./independentStateManager.js";
import type { IndependentMap, IndependentMapAddress, IndependentMapSchema } from "./types.js";

/**
 * Simple FluidObject holding Presence State Manager.
 */
class PresenceSateManagerDataObject extends LoadableFluidObject {
	public readonly psm: IIndependentStateManager;

	public constructor(runtime: FluidDataStoreRuntime) {
		super(runtime);
		// TODO: investigate if ContainerExtensionStore (path-based address routing for
		// Signals) is readily detectable here and use that presence manager directly.
		this.psm = createPresenceStateManager(runtime);
	}
}

/**
 * Factory class to create {@link IIndependentStateManager} in own data store.
 */
class PresenceStateManagerFactory {
	public is(value: IFluidLoadable | ExperimentalPresenceDO): value is ExperimentalPresenceDO {
		return value instanceof PresenceSateManagerDataObject;
	}

	public readonly factory = new BasicDataStoreFactory(
		"@fluidframework/presence-state-data-store",
		PresenceSateManagerDataObject,
	);

	// #region Encapsulated model support

	// private readonly alias: string = "system:presence-state-manager";

	// public get registryEntry(): NamedFluidDataStoreRegistryEntry {
	// 	return [this.factory.type, Promise.resolve(this.factory)];
	// }

	// /**
	//  * Creates exclusive data store for {@link IIndependentStateManager} to work in.
	//  */
	// public async initializingFirstTime(
	// 	containerRuntime: IContainerRuntimeBase,
	// ): Promise<AliasResult> {
	// 	return containerRuntime
	// 		.createDataStore(this.factory.type)
	// 		.then(async (datastore) => datastore.trySetAlias(this.alias));
	// }

	// /**
	//  * Provides {@link IIndependentStateManager} once factory has been registered and
	//  * instantiation is complete.
	//  */
	// public async getStateManager(
	// 	containerRuntime: IContainerRuntime,
	// ): Promise<IIndependentStateManager> {
	// 	const entryPointHandle = (await containerRuntime.getAliasedDataStoreEntryPoint(
	// 		this.alias,
	// 	)) as IFluidHandle<IIndependentStateManager> | undefined;

	// 	if (entryPointHandle === undefined) {
	// 		throw new Error(`dataStore [${this.alias}] must exist`);
	// 	}

	// 	return entryPointHandle.get();
	// }

	// #endregion
}

/**
 * Brand for Experimental Presence Data Object.
 *
 * @remarks
 * See {@link acquireIndependentMapViaDataObject} for example usage.
 *
 * @alpha
 */
export declare class ExperimentalPresenceDO {
	private readonly _self: ExperimentalPresenceDO;
}

/**
 * DataStore based Presence State Manager that is used as fallback for preferred Container
 * Extension based version requires registration. Export SharedObjectKind for registration.
 *
 * @alpha
 */
export const ExperimentalPresenceManager =
	new PresenceStateManagerFactory() as unknown as SharedObjectKind<
		IFluidLoadable & ExperimentalPresenceDO
	>;

/**
 * Acquire an IndependentMap from a DataStore based Presence State Manager
 *
 * @example
 * ```typescript
 * const containerSchema = {
 * 	initialObjects: {
 * 		experimentalPresence: ExperimentalPresenceDO,
 * 	},
 * } satisfies ContainerSchema;
 * ```
 * then
 * ```typescript
 * const presenceWorkspace = acquireIndependentMapViaDataObject(
 * 	container.initialObjects.experimentalPresence,
 * 	"name:my-package/presence-workspace",
 * 	{ ...schema }
 * 	);
 * ```
 *
 * @alpha
 */
export async function acquireIndependentMapViaDataObject<TSchema extends IndependentMapSchema>(
	fluidLoadable: ExperimentalPresenceDO,
	id: IndependentMapAddress,
	requestedContent: TSchema,
): Promise<IndependentMap<TSchema>> {
	if (fluidLoadable instanceof PresenceSateManagerDataObject) {
		return fluidLoadable.psm.acquireIndependentMap(id, requestedContent);
	}

	throw new Error("Incompatible loadable; make sure to use ExperimentalPresenceManager");
}
