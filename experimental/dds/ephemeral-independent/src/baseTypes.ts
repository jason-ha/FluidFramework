/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import type { JsonEncodable } from "./jsonEncodable.js";

/**
 * @beta
 */
export type ClientId = string;

/**
 * @beta
 */
// TODO: RoundTrippable needs revised to be the consistent pre and post serialization
//       and get a better name.
export type RoundTrippable<T> = JsonEncodable<T>;
