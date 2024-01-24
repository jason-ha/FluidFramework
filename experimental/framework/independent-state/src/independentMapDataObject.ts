/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import type { FluidObject } from "@fluidframework/core-interfaces";
import { assert } from "@fluidframework/core-utils";
import { FluidDataStoreRuntime } from "@fluidframework/datastore";
import type { IFluidDataStoreRuntime } from "@fluidframework/datastore-definitions";
import type {
	IFluidDataStoreContext,
	IFluidDataStoreFactory,
	NamedFluidDataStoreRegistryEntry,
} from "@fluidframework/runtime-definitions";

import type { IndependentMap } from "./types.js";

import { createIndependentMap } from "./independentMap.js";

/**
 * @alpha
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export type EmptyIndependentMap = IndependentMap<{}>;

class IndependentMapDOFactory implements IFluidDataStoreFactory {
	public readonly type = IndependentMapDO.Name;

	/**
	 * This is where we do data store setup.
	 *
	 * @param context - data store context used to load a data store runtime
	 */
	public async instantiateDataStore(context: IFluidDataStoreContext, existing: boolean) {
		// Create a new runtime for our data store, as if via new FluidDataStoreRuntime,
		// The runtime is what Fluid uses to route to our data store
		const runtime: FluidDataStoreRuntime = new FluidDataStoreRuntime( // calls new FluidDataStoreRuntime(...)
			context,
			/* ISharedObjectRegistry */ new Map(),
			existing,
			async (rt: IFluidDataStoreRuntime) => {
				assert(instance !== undefined, "entryPoint is undefined");
				return instance;
			} /* provideEntryPoint */,
		);

		const instance = new IndependentMapDO(runtime);

		return runtime;
	}

	public get IFluidDataStoreFactory() {
		return this;
	}
}

/**
 * @alpha
 */
export class IndependentMapDO implements FluidObject {
	public static readonly Name = "@fluidframework/independent-state-map";

	public static readonly RegistryEntry: NamedFluidDataStoreRegistryEntry = [
		IndependentMapDO.Name,
		Promise.resolve(new IndependentMapDOFactory()),
	];

	/**
	 * Provides access to the values at this directory level as a map.
	 */
	public readonly map: EmptyIndependentMap;

	public constructor(runtime: IFluidDataStoreRuntime) {
		this.map = createIndependentMap(runtime, {});
	}
}
