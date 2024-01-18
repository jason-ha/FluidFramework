/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import {
	type IDataObjectProps,
	PureDataObject,
	PureDataObjectFactory,
} from "@fluidframework/aqueduct";

import type { IndependentMap } from "./types.js";

import { createEphemeralIndependentMap } from "./independentMap.js";

/**
 * @alpha
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export type EmptyIndependentMap = IndependentMap<{}>;

/**
 * @alpha
 */
export class EphemeralIndependentDirectory extends PureDataObject {
	public static readonly Name = "@fluidframework/ephemeral-independent-directory";

	public static readonly factory = new PureDataObjectFactory(
		EphemeralIndependentDirectory.Name,
		EphemeralIndependentDirectory,
		[],
		{},
	);

	/**
	 * Provides access to the values at this directory level as a map.
	 */
	public readonly map: EmptyIndependentMap;

	public constructor(props: IDataObjectProps) {
		super(props);
		this.map = createEphemeralIndependentMap(props.runtime, {});
	}
}
