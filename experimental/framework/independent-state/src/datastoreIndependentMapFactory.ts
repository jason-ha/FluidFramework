/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Hacky support for internal datastore based usages.
 */

// imports
import type { IContainerRuntime } from "@fluidframework/container-runtime-definitions/internal";
import type { IFluidHandle, IFluidLoadable } from "@fluidframework/core-interfaces";
import type { FluidDataStoreRuntime } from "@fluidframework/datastore/internal";
import type {
	AliasResult,
	IContainerRuntimeBase,
	NamedFluidDataStoreRegistryEntry,
} from "@fluidframework/runtime-definitions/internal";
import type { SharedObjectKind } from "@fluidframework/shared-object-base";

import { BasicDataStoreFactory, LoadableFluidObject } from "./datastoreSupport.js";
import { createIndependentMap } from "./independentMap.js";
import type { IndependentMap, IndependentMapSchema } from "./types.js";

/**
 * Interface to provide independent map.
 * @alpha
 */
export interface IProvideIndependentMap<TSchema extends IndependentMapSchema> {
	readonly map: IndependentMap<TSchema>;
}

// Explicit return type is left out it is inexpressible except as abstract class
// which will not satisfy BasicDataStoreFactory requirements.
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function createIndependentMapFluidObjectClass<TSchema extends IndependentMapSchema>(
	initialContent: TSchema,
) {
	return class IndependentMapFluidObject
		extends LoadableFluidObject
		implements IProvideIndependentMap<TSchema>
	{
		public readonly map: IndependentMap<TSchema>;

		public constructor(runtime: FluidDataStoreRuntime) {
			super(runtime);
			this.map = createIndependentMap<TSchema>(runtime, initialContent).externalMap;
		}
	};
}

const factoryType = "@fluidframework/independent-state-map-data-store";

/**
 * Convenience helper class to create ${@link IndependentMap} in own data store.
 *
 * @internal
 */
export class IndependentMapFactoryInternal<TSchema extends IndependentMapSchema> {
	private readonly factory: BasicDataStoreFactory<typeof factoryType>;

	public constructor(
		initialContent: TSchema,
		private readonly alias: string = "independent-state-map.0",
	) {
		this.factory = new BasicDataStoreFactory(
			factoryType,
			createIndependentMapFluidObjectClass(initialContent),
		);
	}

	public get registryEntry(): NamedFluidDataStoreRegistryEntry {
		return [this.factory.type, Promise.resolve(this.factory)];
	}

	/**
	 * Creates exclusive data store for ${@link IndependentMap} to work in.
	 */
	public async initializingFirstTime(
		containerRuntime: IContainerRuntimeBase,
	): Promise<AliasResult> {
		return containerRuntime
			.createDataStore(this.factory.type)
			.then(async (datastore) => datastore.trySetAlias(this.alias));
	}

	/**
	 * Provides {@link IndependentMap} once factory has been registered and
	 * instantiation is complete.
	 */
	public async getMap(containerRuntime: IContainerRuntime): Promise<IndependentMap<TSchema>> {
		const entryPointHandle = (await containerRuntime.getAliasedDataStoreEntryPoint(
			this.alias,
		)) as IFluidHandle<IProvideIndependentMap<TSchema>> | undefined;

		if (entryPointHandle === undefined) {
			throw new Error(`dataStore [${this.alias}] must exist`);
		}

		const obj = await entryPointHandle.get();
		return obj.map;
	}
}

/**
 * Provides factory
 * @alpha
 */
export function IndependentMapFactory<TSchema extends IndependentMapSchema>(
	initialObjects: TSchema,
): SharedObjectKind<IFluidLoadable & IProvideIndependentMap<TSchema>> {
	return new IndependentMapFactoryInternal(initialObjects) as unknown as SharedObjectKind<
		IFluidLoadable & IProvideIndependentMap<TSchema>
	>;
}
