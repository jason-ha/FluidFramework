/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import { assert, Deferred } from "@fluidframework/core-utils/internal";
import type * as Mocha from "mocha";

const timeBuffer = 15; // leave 15 ms leeway for finish processing

// TestTimeout class that manages tracking of test timeout. It creates a timer when timeout is in effect,
// and provides a promise that will be rejected some time (as defined by `timeBuffer`) before the test timeout happens.
// This will ensure that async awaits in tests do not end up timing out the tests but resolve / reject
// before that happens.
// Once rejected, a new TestTimeout object will be create for the timeout.
export class TestTimeout {
	private timeout: number = 0;
	private timer: NodeJS.Timeout | undefined;
	private deferred: Deferred<void> = new Deferred<void>();

	private static instance: TestTimeout = new TestTimeout();
	public static updateOnYield(runnable: Mocha.Runnable): void {
		TestTimeout.instance.clearTimer();
		TestTimeout.instance.resetTimer(runnable);
	}

	public static reset(): void {
		TestTimeout.instance.clearTimer();
		TestTimeout.instance = new TestTimeout();
	}

	public static getInstance(): TestTimeout {
		return TestTimeout.instance;
	}

	public async getPromise(): Promise<void> {
		return this.deferred.promise;
	}

	public getTimeout(): number | undefined {
		return this.timeout;
	}

	private constructor() {}

	private resetTimer(runnable: Mocha.Runnable): void {
		assert(!this.timer, "clearTimer should have been called before reset");
		assert(!this.deferred.isCompleted, "can't reset a completed TestTimeout");

		// Check the test timeout setting
		const timeoutFromMochaTest = runnable.timeout();
		if (!(Number.isFinite(timeoutFromMochaTest) && timeoutFromMochaTest > 0)) {
			return;
		}

		// subtract a buffer
		this.timeout = Math.max(timeoutFromMochaTest - timeBuffer, 1);

		// Set up timer to reject near the test timeout.
		this.timer = setTimeout(() => {
			this.deferred.reject(this);
		}, this.timeout);
	}
	private clearTimer(): void {
		if (this.timer) {
			this.deferred = new Deferred();
			clearTimeout(this.timer);
			this.timer = undefined;
		}
	}
}

interface GlobalWithMocha extends NodeJS.Global {
	getMochaModule: () => typeof Mocha;
}

function hasGetMochaModule(
	global: Partial<GlobalWithMocha> & NodeJS.Global,
): global is GlobalWithMocha {
	return global.getMochaModule !== undefined;
}

// Make local copy variable to allow for type narrowing with the hasGetMochaModule type guard.
const globalThisCopy = globalThis;

console.error("Test for installing test timeout patch conditions");
// Only register if we are running with mocha-test-setup loaded (that package is what sets globalThis.getMochaModule).
if (hasGetMochaModule(globalThisCopy)) {
	console.error("Installing test timeout patch");
	// Patch the private methods resetTimeout and clearTimeout on Mocha's runnable objects so we can do the appropriate
	// calls in TestTimeout above when the Mocha methods are called.
	// These are not part of the public API so if Mocha changes how it works, this could break.
	// See https://github.com/mochajs/mocha/blob/8d0ca3ed77ba8a704b2aa8b58267a084a475a51b/lib/runnable.js#L234.
	const mochaModule = globalThisCopy.getMochaModule();
	const runnablePrototype = mochaModule.Runnable.prototype;
	// eslint-disable-next-line @typescript-eslint/unbound-method
	const oldResetTimeoutFunc = runnablePrototype.resetTimeout;
	let resetTimeoutCallDepth = 0;
	// Mocha invokes resetTimeout after each async yield a test performs.
	runnablePrototype.resetTimeout = function (this: Mocha.Runnable) {
		resetTimeoutCallDepth++;
		try {
			oldResetTimeoutFunc.call(this);
		} finally {
			resetTimeoutCallDepth--;
		}
		TestTimeout.updateOnYield(this);
	};
	// eslint-disable-next-line @typescript-eslint/unbound-method
	const oldClearTimeoutFunc = runnablePrototype.clearTimeout;
	runnablePrototype.clearTimeout = function (this: Mocha.Runnable) {
		if (resetTimeoutCallDepth === 0) {
			// Mocha's runnable invokes clearTimeout as part of its resetTimeout as well as at the end of Runnables.
			// We only want to fully reset the TestTimeout instance at the end of each runnable, not on JS turn boundaries.
			TestTimeout.reset();
		}
		oldClearTimeoutFunc.call(this);
	};
}
