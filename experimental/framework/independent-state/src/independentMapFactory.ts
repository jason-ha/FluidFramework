/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import type { IContainerRuntime } from "@fluidframework/container-runtime-definitions/internal";
import type { IFluidHandle } from "@fluidframework/core-interfaces";
import { assert } from "@fluidframework/core-utils/internal";
import { FluidDataStoreRuntime } from "@fluidframework/datastore/internal";
import type {
	AliasResult,
	IContainerRuntimeBase,
	IFluidDataStoreContext,
	IFluidDataStoreFactory,
	NamedFluidDataStoreRegistryEntry,
} from "@fluidframework/runtime-definitions/internal";

import { createIndependentMap } from "./independentMap.js";
import type { IndependentMap, IndependentMapSchema } from "./types.js";

class IndependentMapDataStoreFactory<TSchema extends IndependentMapSchema>
	implements IFluidDataStoreFactory
{
	public readonly type = "@fluidframework/independent-state-map-data-store";

	public constructor(
		private readonly initialContent: TSchema,
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
			async () => {
				assert(instance !== undefined, "entryPoint is undefined");
				return instance;
			} /* provideEntryPoint */,
		);

		const instance = createIndependentMap<TSchema>(runtime, this.initialContent);

		return runtime;
	}

	public get IFluidDataStoreFactory(): IFluidDataStoreFactory {
		return this;
	}
}

/**
 * Convenience helper class to create ${@link IndependentMap} in own data store.
 *
 * @alpha
 */
export class IndependentMapFactory<TSchema extends IndependentMapSchema> {
	private readonly dataStoreFactory: IndependentMapDataStoreFactory<TSchema>;

	public constructor(
		initialContent: TSchema,
		private readonly alias: string = "independent-state-map.0",
		runtimeClass: typeof FluidDataStoreRuntime = FluidDataStoreRuntime,
	) {
		this.dataStoreFactory = new IndependentMapDataStoreFactory(initialContent, runtimeClass);
	}

	public get registryEntry(): NamedFluidDataStoreRegistryEntry {
		return [this.dataStoreFactory.type, Promise.resolve(this.dataStoreFactory)];
	}

	/**
	 * Creates exclusive data store for ${@link IndependentMap} to work in.
	 */
	public async initializingFirstTime(
		containerRuntime: IContainerRuntimeBase,
	): Promise<AliasResult> {
		return containerRuntime
			.createDataStore(this.dataStoreFactory.type)
			.then(async (datastore) => datastore.trySetAlias(this.alias));
	}

	/**
	 * Provides {@link IndependentMap} once factory has been registered and
	 * instantiation is complete.
	 */
	public async getMap(containerRuntime: IContainerRuntime): Promise<IndependentMap<TSchema>> {
		const entryPointHandle = (await containerRuntime.getAliasedDataStoreEntryPoint(
			this.alias,
		)) as IFluidHandle<IndependentMap<TSchema>> | undefined;

		if (entryPointHandle === undefined) {
			throw new Error(`dataStore [${this.alias}] must exist`);
		}

		return entryPointHandle.get();
	}
}
