/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

"use strict";

// This is a slimmed down version of @fluid-internal/mocha-test-setup/mocharc-common.cjs
// extracted here to avoid circular dependencies. The below function and sibling
// `test-config.json` file should be removed once telemetry interface definitions are
// moved to a separate telemetry-definitions package and the circular dependency can be
// resolved.

const path = require("path");

function getFluidTestMochaConfig(packageDir) {
	const config = {
		"recursive": true,
		"unhandled-rejections": "strict",
		"node-option": [
			// Allow test-only indexes to be imported. Search the FF repo for package.json files with this condition to see example usage.
			"conditions=allow-ff-test-exports",
			// Performance tests benefit from having access to GC, and memory tests require it.
			// Exposing it here avoids all packages which do perf testing from having to expose it.
			// Note that since "node-option" is explicitly set,
			// these must be provided here and not via mocha's --v8-expose-gc.
			"expose-gc",
		],
	};

	if (process.env.FLUID_TEST_TIMEOUT !== undefined) {
		config["timeout"] = process.env.FLUID_TEST_TIMEOUT;
	}

	const packageJson = require(`${packageDir}/package.json`);
	config["reporter"] = `mocha-multi-reporters`;
	// See https://www.npmjs.com/package/mocha-multi-reporters#cmroutput-option
	const outputFilePrefix = "";
	if (!process.env.SILENT_TEST_OUTPUT) {
		console.log(
			`Writing test results relative to package to nyc/${outputFilePrefix}junit-report.xml`,
		);
	}
	const suiteName = packageJson.name;
	config["reporter-options"] = [
		`configFile=${path.join(
			__dirname,
			"test-config.json",
		)},cmrOutput=xunit+output+${outputFilePrefix}:xunit+suiteName+${suiteName}`,
	];

	if (process.env.FLUID_TEST_FORBID_ONLY !== undefined) {
		config["forbid-only"] = true;
	}

	return config;
}

const packageDir = __dirname;
const config = getFluidTestMochaConfig(packageDir);
module.exports = config;
