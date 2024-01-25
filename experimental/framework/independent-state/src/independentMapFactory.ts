/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import { assert } from "@fluidframework/core-utils";
import { FluidDataStoreRuntime } from "@fluidframework/datastore";
import type {
	IFluidDataStoreContext,
	IFluidDataStoreFactory,
	NamedFluidDataStoreRegistryEntry,
} from "@fluidframework/runtime-definitions";

import type { IndependentMap, IndependentMapSchema } from "./types.js";

import { createIndependentMap } from "./independentMap.js";

/**
 * Local implementation of Promise.withResolvers
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/withResolvers
 */
function promiseWithResolves<T>(): {
	promise: Promise<T>;
	resolve: (value: T | PromiseLike<T>) => void;
	reject: (reason?: any) => void;
} {
	let resolveFn: (value: T | PromiseLike<T>) => void;
	let rejectFn: (reason?: any) => void;
	const promise = new Promise<T>((resolve, reject) => {
		resolveFn = resolve;
		rejectFn = reject;
	});
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	return { promise, resolve: resolveFn!, reject: rejectFn! };
}

/**
 * @alpha
 */
export class IndependentMapFactory<TSchema extends IndependentMapSchema>
	implements IFluidDataStoreFactory
{
	public readonly type = "@fluidframework/independent-state-map";

	constructor(
		private readonly initialContent: TSchema,
		private readonly runtimeClass: typeof FluidDataStoreRuntime = FluidDataStoreRuntime,
	) {
		const { promise, resolve } = promiseWithResolves<IndependentMap<TSchema>>();
		this.map = promise;
		this.resolveMap = resolve;
	}

	public get registryEntry() {
		return [this.type, Promise.resolve(this)] satisfies NamedFluidDataStoreRegistryEntry;
	}

	/**
	 * Provides {@link IndependentMap} once factory has been registered and
	 * instantiation is complete.
	 */
	public readonly map: Promise<IndependentMap<TSchema>>;

	private readonly resolveMap: (
		value: IndependentMap<TSchema> | PromiseLike<IndependentMap<TSchema>>,
	) => void;

	/**
	 * This is where we do data store setup.
	 *
	 * @param context - data store context used to load a data store runtime
	 */
	public async instantiateDataStore(context: IFluidDataStoreContext, existing: boolean) {
		// Create a new runtime for our data store, as if via new FluidDataStoreRuntime,
		// The runtime is what Fluid uses to route to our data store.
		const runtime: FluidDataStoreRuntime = new this.runtimeClass( // calls new FluidDataStoreRuntime(...)
			context,
			/* ISharedObjectRegistry */ new Map(),
			existing,
			async () => {
				assert(instance !== undefined, "entryPoint is undefined");
				return instance;
			} /* provideEntryPoint */,
		);

		const instance = createIndependentMap<TSchema>(runtime, this.initialContent);
		this.resolveMap(instance);

		return runtime;
	}

	public get IFluidDataStoreFactory() {
		return this;
	}
}
