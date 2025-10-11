/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import type { ILayerCompatSupportRequirements } from "@fluid-internal/client-utils";

/**
 * Identifying characteristics of a registrant for checking runtime compatibility.
 *
 * @internal
 */
export interface ExtensionCompatibilityDetails {
	/**
	 * Compatibility generation.
	 */
	readonly generation: number;
	/**
	 * Semver string representing the version of the registrant.
	 */
	readonly version: string;
	/**
	 * Set of capabilities supported by the registrant.
	 */
	readonly capabilities: ReadonlySet<string>;
}

/**
 * Description of expectations for an extension instance.
 *
 * Provided to {@link ContainerExtensionProvider.getExtension} and used to
 * validate existing extension is runtime compatible.
 *
 * @internal
 */
export interface ContainerExtensionRequirements {
	readonly hostRequirements: ILayerCompatSupportRequirements;
	readonly instanceRequirements: ExtensionCompatibilityDetails;
}

/* eslint-disable @fluid-internal/fluid/no-hyphen-after-jsdoc-tag -- false positive AB#50920 */
/**
 * Unique identifier for extension
 *
 * @remarks
 * A string known to all clients working with a certain ContainerExtension and unique
 * among ContainerExtensions. Not `/` may be used in the string. Recommend using
 * concatenation of: type of unique identifier, `:` (required), and unique identifier.
 *
 * @example Examples
 * ```typescript
 *   "guid:g0fl001d-1415-5000-c00l-g0fa54g0b1g1"
 *   "name:@foo-scope_bar:v1"
 * ```
 *
 * @internal
 */
export type ContainerExtensionId = `${string}:${string}`;
/* eslint-enable @fluid-internal/fluid/no-hyphen-after-jsdoc-tag */

/**
 * @sealed
 * @internal
 */
export interface ContainerExtensionProvider {
	/**
	 * Gets an extension from store.
	 *
	 * @param id - Identifier for the requested extension
	 * @param requirements - Extension compatibility requirements
	 * @param context - Custom use context for extension
	 * @returns The extension
	 */
	getExtension<TInterface, TUseContext extends unknown[] = []>(
		id: ContainerExtensionId,
		requirements: ContainerExtensionRequirements,
		...context: TUseContext
	): TInterface;
}
