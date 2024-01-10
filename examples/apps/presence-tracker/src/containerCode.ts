/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import {
	ModelContainerRuntimeFactory,
	getDataStoreEntryPoint,
} from "@fluid-example/example-utils";
import { Signaler, ISignaler } from "@fluid-experimental/data-objects";
import { IndependentMapFactory } from "@fluid-experimental/independent-state/internal";
import { IContainer } from "@fluidframework/container-definitions/internal";
import { IContainerRuntime } from "@fluidframework/container-runtime-definitions/internal";
import { createServiceAudience } from "@fluidframework/fluid-static/internal";

import { createMockServiceMember } from "./Audience.js";
import { FocusTracker } from "./FocusTracker.js";
import { MouseTracker } from "./MouseTracker.js";

export interface ITrackerAppModel {
	readonly focusTracker: FocusTracker;
	readonly mouseTracker: MouseTracker;
}

class TrackerAppModel implements ITrackerAppModel {
	public constructor(
		public readonly focusTracker: FocusTracker,
		public readonly mouseTracker: MouseTracker,
	) {}
}

const signalerId = "signaler";

function createIndependentMapFactory() {
	return new IndependentMapFactory({});
}

export class TrackerContainerRuntimeFactory extends ModelContainerRuntimeFactory<ITrackerAppModel> {
	private readonly independentMapFactory: ReturnType<typeof createIndependentMapFactory>;
	constructor() {
		const independentMapFactory = createIndependentMapFactory();
		super(
			new Map([
				// registryEntries
				Signaler.factory.registryEntry,
				independentMapFactory.registryEntry,
			]),
		);
		this.independentMapFactory = independentMapFactory;
	}

	/**
	 * {@inheritDoc ModelContainerRuntimeFactory.containerInitializingFirstTime}
	 */
	protected async containerInitializingFirstTime(runtime: IContainerRuntime) {
		await Promise.all([
			runtime
				.createDataStore(Signaler.factory.type)
				.then(async (signaler) => signaler.trySetAlias(signalerId)),
			this.independentMapFactory.initializingFirstTime(runtime),
		]);
	}

	protected async createModel(runtime: IContainerRuntime, container: IContainer) {
		const focusTracker = getDataStoreEntryPoint<ISignaler>(runtime, signalerId).then(
			(signaler) => new FocusTracker(container, audience, signaler),
		);

		const mouseTracker = this.independentMapFactory
			.getMap(runtime)
			.then((map) => new MouseTracker(audience, map));

		const audience = createServiceAudience({
			container,
			createServiceMember: createMockServiceMember,
		});

		return new TrackerAppModel(await focusTracker, await mouseTracker);
	}
}
