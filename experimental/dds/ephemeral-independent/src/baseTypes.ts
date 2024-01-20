/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import type { Serializable } from "@fluidframework/datastore-definitions";

/**
 * @alpha
 */
export type ClientId = string;

/**
 * @alpha
 */
// TODO: RoundTrippable needs revised to be the consistent pre and post serialization
//       and get a better name.
export type RoundTrippable<T> = Serializable<T>;
