/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import { TestTimeout } from "./installTestTimeout.js";

/**
 * @internal
 */
export interface TimeoutDurationOption {
	/**
	 * Timeout duration in milliseconds, if it is great than 0 and not Infinity
	 * If it is undefined, then it will use test timeout if we are in side the test function
	 * Otherwise, there is no timeout
	 */
	durationMs?: number;
}

/**
 * @internal
 */
export interface TimeoutWithError extends TimeoutDurationOption {
	reject?: true;
	errorMsg?: string;
	// Since there are no required properties, this type explicitly
	// rejects `value` to avoid confusion with TimeoutWithValue.
	value?: never;
}

/**
 * @internal
 */
export interface TimeoutWithValue<T = void> extends TimeoutDurationOption {
	reject: false;
	value: T;
}

export type PromiseExecutor<T = void> = (
	resolve: (value: T | PromiseLike<T>) => void,
	reject: (reason?: any) => void,
) => void;

/**
 * Wraps the given promise with another one that will complete after a specific timeout if the original promise does
 * not resolve by then.
 *
 * @remarks
 * If used inside a mocha test, it uses the test timeout by default and completes the returned promise just before
 * the test timeout hits, so that tests don't time out because of unpredictable awaits.
 * In that scenario the timeout can still be overridden via `timeoutOptions` but it's recommended to use the default value.
 *
 * @param promise - The promise to be wrapped.
 * @param timeoutOptions - Options that can be used to override the timeout and / or define the behavior when
 * the promise is not fulfilled. For example, instead of rejecting the promise, resolve with a specific value.
 * @returns A new promise that will complete when the given promise resolves or the timeout expires.
 * @internal
 */
export async function timeoutAwait<T = void>(
	promise: PromiseLike<T>,
	timeoutOptions: TimeoutWithError | TimeoutWithValue<T> = {},
): Promise<T> {
	return Promise.race([promise, timeoutPromise<T>(() => {}, timeoutOptions)]);
}

/**
 * Creates a promise from the given executor that will complete after a specific timeout.
 *
 * @remarks
 * If used inside a mocha test, it uses the test timeout by default and completes the returned promise just before
 * the test timeout hits, so that tests don't time out because of unpredictable awaits.
 * In that scenario the timeout can still be overridden via `timeoutOptions` but it's recommended to use the default value.
 *
 * @param executor - The executor for the promise.
 * @param timeoutOptions - Options that can be used to override the timeout and / or define the behavior when
 * the promise is not fulfilled. For example, instead of rejecting the promise, resolve with a specific value.
 * @returns A new promise that will complete when the given executor resolves or the timeout expires.
 * @internal
 */
export async function timeoutPromise<T = void>(
	executor: (
		resolve: (value: T | PromiseLike<T>) => void,
		reject: (reason?: any) => void,
	) => void,
	timeoutOptions: TimeoutWithError | TimeoutWithValue<T> = {},
): Promise<T> {
	// create the timeout error outside the async task, so its callstack includes
	// the original call site, this makes it easier to debug
	const err =
		timeoutOptions.reject === false
			? undefined
			: new Error(timeoutOptions.errorMsg ?? "Timed out");
	const executorPromise = getTimeoutPromise(executor, timeoutOptions, err);

	const currentTestTimeout = TestTimeout.getInstance();
	if (currentTestTimeout === undefined) {
		return executorPromise;
	}

	return Promise.race([executorPromise, currentTestTimeout.getPromise()]).catch((e) => {
		if (e === currentTestTimeout) {
			if (timeoutOptions.reject !== false) {
				// If the rejection is because of the timeout then
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				const errorObject = err!;
				errorObject.message = `${
					timeoutOptions.errorMsg ?? "Forcing timeout before test does"
				} (${currentTestTimeout.getTimeout()}ms)`;
				throw errorObject;
			}
			return timeoutOptions.value;
		}
		throw e;
	}) as Promise<T>;
}

// Create a promise based on the timeout options
async function getTimeoutPromise<T = void>(
	executor: (
		resolve: (value: T | PromiseLike<T>) => void,
		reject: (reason?: any) => void,
	) => void,
	timeoutOptions: TimeoutWithError | TimeoutWithValue<T>,
	err: Error | undefined,
): Promise<T> {
	const timeout = timeoutOptions.durationMs ?? 0;
	if (timeout <= 0 || !Number.isFinite(timeout)) {
		return new Promise(executor);
	}

	return new Promise<T>((resolve, reject) => {
		const timeoutRejections = (): void => {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			const errorObject = err!;
			errorObject.message = `${errorObject.message} (${timeout}ms)`;
			reject(errorObject);
		};
		const timer = setTimeout(
			() =>
				timeoutOptions.reject === false ? resolve(timeoutOptions.value) : timeoutRejections(),
			timeout,
		);

		executor(
			(value) => {
				clearTimeout(timer);
				resolve(value);
			},
			(reason: Error) => {
				clearTimeout(timer);
				reject(reason);
			},
		);
	});
}
