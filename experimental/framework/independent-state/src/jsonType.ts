/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Type constraint for types that are likely encodable as JSON, deserializable from JSON,
 * or have a custom alternate type.
 *
 * @remarks
 * Use `JsonTypeWith<never>` for just JSON encodable/deserializable types.
 * See {@link JsonEncodable} for encoding pitfalls.
 *
 * @privateRemarks
 * Prefer using `JsonEncodable<unknown>` or `JsonDeserialized<unknown>` over this type that
 * is an implementation detail.
 * @beta
 */
export type JsonTypeWith<T> =
	| null
	| boolean
	| number
	| string
	| T
	| { [key: string | number]: JsonTypeWith<T> }
	| JsonTypeWith<T>[];