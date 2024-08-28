/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Hacky support for internal datastore based usages.
 */

// imports
// import type { IContainerRuntime } from "@fluidframework/container-runtime-definitions/internal";
import type { IFluidHandle, IFluidLoadable } from "@fluidframework/core-interfaces";
import { FluidDataStoreRuntime } from "@fluidframework/datastore/internal";
import type { IFluidDataStoreRuntime } from "@fluidframework/datastore-definitions/internal";
import type {
	AliasResult,
	IContainerRuntimeBase,
	IFluidDataStoreContext,
	IFluidDataStoreFactory,
	NamedFluidDataStoreRegistryEntry,
} from "@fluidframework/runtime-definitions/internal";
import type { SharedObjectKind } from "@fluidframework/shared-object-base";

// import { createIndependentMap } from "./independentMap.js";
import {
	createPresenceStateManager,
	type IIndependentStateManager,
} from "./independentStateManager.js";
import type { IndependentMap, IndependentMapAddress, IndependentMapSchema } from "./types.js";

class PresenceStateManagerDataStoreFactory implements IFluidDataStoreFactory {
	public readonly type = "@fluidframework/presence-state-data-store";

	public constructor(
		private readonly runtimeClass: typeof FluidDataStoreRuntime = FluidDataStoreRuntime,
	) {}

	/**
	 * This is where we do data store setup.
	 *
	 * @param context - data store context used to load a data store runtime
	 */
	public async instantiateDataStore(
		context: IFluidDataStoreContext,
		existing: boolean,
	): Promise<FluidDataStoreRuntime> {
		// Create a new runtime for our data store, as if via new FluidDataStoreRuntime,
		// The runtime is what Fluid uses to route to our data store.
		const runtime: FluidDataStoreRuntime = new this.runtimeClass(
			// calls new FluidDataStoreRuntime(...)
			context,
			/* ISharedObjectRegistry */ new Map(),
			existing,
			async (runtimeProvided: IFluidDataStoreRuntime) => {
				return new PresenceStateManagerFactory(runtimeProvided);
			} /* provideEntryPoint */,
		);

		// createIndependentMap(runtime, {}).externalMap;

		return runtime;
	}

	public get IFluidDataStoreFactory(): IFluidDataStoreFactory {
		return this;
	}
}

/**
 * Convenience helper class to create {@link IIndependentStateManager} in own data store.
 */
class PresenceStateManagerFactory implements IFluidLoadable {
	public static is(
		value: IFluidLoadable | ExperimentalPresenceDO,
	): value is ExperimentalPresenceDO {
		return value instanceof PresenceStateManagerFactory;
	}

	public static readonly factory = new PresenceStateManagerDataStoreFactory(
		FluidDataStoreRuntime,
	);
	private static readonly alias: string = "system:presence-state-manager";

	public static get registryEntry(): NamedFluidDataStoreRegistryEntry {
		return [
			PresenceStateManagerFactory.factory.type,
			Promise.resolve(PresenceStateManagerFactory.factory),
		];
	}

	/**
	 * Creates exclusive data store for {@link IIndependentStateManager} to work in.
	 */
	public static async initializingFirstTime(
		containerRuntime: IContainerRuntimeBase,
	): Promise<AliasResult> {
		return containerRuntime
			.createDataStore(PresenceStateManagerFactory.factory.type)
			.then(async (datastore) => datastore.trySetAlias(PresenceStateManagerFactory.alias));
	}

	public readonly psm: IIndependentStateManager;

	public constructor(private readonly runtime: IFluidDataStoreRuntime) {
		this.psm = createPresenceStateManager(runtime);
	}

	public get IFluidLoadable(): IFluidLoadable {
		return this;
	}

	/**
	 * Handle to a data store
	 */
	public get handle(): IFluidHandle<IIndependentStateManager> {
		return this.runtime.entryPoint as IFluidHandle<IIndependentStateManager>;
	}

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
}

/**
 * Brand for
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
	PresenceStateManagerFactory as unknown as SharedObjectKind<
		IFluidLoadable & ExperimentalPresenceDO
	>;

/**
 * Acquire an IndependentMap from a DataStore based Presence State Manager
 *
 * @alpha
 */
export async function acquireIndependentMapViaDataObject<TSchema extends IndependentMapSchema>(
	fluidLoadable: ExperimentalPresenceDO,
	id: IndependentMapAddress,
	requestedContent: TSchema,
): Promise<IndependentMap<TSchema>> {
	if (fluidLoadable instanceof PresenceStateManagerFactory) {
		return fluidLoadable.psm.acquireIndependentMap(id, requestedContent);
	}

	throw new Error("Incompatible loadable; make sure to use ExperimentalPresenceManager");
}
