/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

module.exports = {
	plugins: ["@typescript-eslint"],
	extends: [
		// eslint-disable-next-line node/no-extraneous-require
		require.resolve("@fluidframework/eslint-config-fluid/minimal"),
		"prettier",
	],
	rules: {
		"import/no-internal-modules": "off",
		"@typescript-eslint/strict-boolean-expressions": "off",
		"unicorn/filename-case": [
			"error",
			{
				cases: {
					camelCase: true,
					pascalCase: true,
				},
				ignore: [/.*\.script\.ts$/],
			},
		],
	},
};
