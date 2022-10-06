/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import type { Runner } from "mocha";

// Mocha has an unresolved security issue. To avoid production dependence on mocha locally define the constants we need
// assuring that they have the same value as our mocha package. These are long-established and never expected to change.
export const MochaRunnerConstants: {
    EVENT_RUN_END: (typeof Runner.constants)["EVENT_RUN_END"];
    EVENT_SUITE_END: (typeof Runner.constants)["EVENT_SUITE_END"];
    EVENT_TEST_BEGIN: (typeof Runner.constants)["EVENT_TEST_BEGIN"];
    EVENT_TEST_END: (typeof Runner.constants)["EVENT_TEST_END"];
    EVENT_TEST_FAIL: (typeof Runner.constants)["EVENT_TEST_FAIL"];
} = {
    EVENT_RUN_END: "end",
    EVENT_SUITE_END: "suite end",
    EVENT_TEST_BEGIN: "test",
    EVENT_TEST_END: "test end",
    EVENT_TEST_FAIL: "fail",
};
