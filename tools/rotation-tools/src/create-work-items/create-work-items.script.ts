#!/usr/bin/env node

/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * This script creates a User Story work item and children task work items
 * based on ADO templates.
 */

import * as yargs from "yargs";
import { WorkItemManager } from "../azure-devops-node-api-helpers/WorkItemCreation";

const userStoryTemplateId = "d8ed2210-1cf1-4ff7-972c-966a05725983";
const defaultStoryTitle = "Work Rotation";

// Either a guid representing a template id, or an object representing when tha
interface TemplateInfo {
	/**
	 * id for the template
	 */
	id: string;
	/**
	 * Indicates an optional task template. If true the task is only created if specified in the
	 * --optional-tasks argument list.
	 */
	isOptional?: boolean;
	/**
	 * Optional name of this task, required if isOptional==true.
	 */
	name?: string;
}

// !!! --- needs updated for FluidFramework ADO --- !!!  (and should move to a config file)
// Not hard-coding the templates to use and instead getting them via config here would be better.
// Task templates in ADO: https://dev.azure.com/Intentional/intent/_settings/work-team?type=Task&_a=templates
const taskTemplateInfo: TemplateInfo[] = [
	// Audit Component Governance Alerts task
	{ id: "7b2d54ef-274d-4dc9-8bce-65747640cc08" },
	// Support Log task
	{ id: "19f024e1-8b79-4cf4-b143-943501145294" },
	// Telemetry Report task
	{ id: "53634835-ca71-4ec0-8ad9-606de0ba2e53" },
	// Update typescript-pipe dependencies task
	{ id: "8ce0c182-04ab-45df-97e9-cf6df3594a56" },
	// Update language-tools dependencies task
	{ id: "0f850ca0-b2c9-4a9e-88b9-5387aef3e17b" },
	// Weekly typescript-pipe release & FI task
	{ id: "1208ce74-ccf7-46cd-a198-07870306ee03" },

	// Optional tasks, use argument --optional-tasks taskName1,taskName2.. to create optional tasks
	// @fluidframework package update
	{ isOptional: true, name: "fluid-update", id: "7cbb7d2f-fca4-49f3-b342-c2c077b59b98" },
];

const args = yargs
	.usage(
		"$0 [options] - Creates a set of work items for a rotation" +
			`(title defaults to "${defaultStoryTitle}")`,
	)
	.option("organization-name", {
		type: "string",
		demandOption: true,
		description: "ADO organization to create work items under.",
	})
	.option("project-name", {
		type: "string",
		demandOption: true,
		description: "ADO project.",
	})
	.option("api-key", {
		type: "string",
		description: "ADO API key with vso.work_write scope. Uses env ADO_TOKEN if not specified.",
	})
	.option("area-path", {
		type: "string",
		description: "ADO Area path to use for the work items.",
	})
	.option("iteration-path", {
		type: "string",
		description: "ADO Iteration path to use for the work items.",
	})
	.option("assigned-to", {
		type: "string",
		description: 'Id of user to assigned to: "alias@microsoft.com".',
	})
	.option("story-title", {
		type: "string",
		default: defaultStoryTitle,
		description: `Title to give the story work item.`,
	})
	.option("optional-tasks", {
		type: "string",
		description: 'Comma separated list of optional task names to create".',
	})
	.config()
	.help("h")
	.alias("h", "help").argv;

/**
 * Colors supported by ConsoleUtilities.
 */
enum Color {
	Red = "\x1b[31m",
	Blue = "\x1b[34m",
	Green = "\x1b[32m",
	Yellow = "\x1b[33m",
	/**
	 * Color code for resetting the color back to default.
	 */
	reset = "\u001b[0m",
}

/**
 * Logs the provided message as a warning in blue.
 */
function logInfo(message: string): void {
	console.log(`${Color.Blue}INFO: ${message}${Color.reset}`);
}

const organization = args["organization-name"];
const project = args["project-name"];

const areaPath = args["area-path"];
const iterationPath = args["iteration-path"];
const assignedTo = args["assigned-to"];
const optionalTasks = args["optional-tasks"];
const optionalTaskSet = new Set<string>();
const storyTitle = args["story-title"];

if (optionalTasks) {
	// yargs will replace commas with spaces when separating arguments
	optionalTasks.split(" ").forEach((taskName) => {
		if (!optionalTaskSet.has(taskName)) {
			optionalTaskSet.add(taskName);
		}
	});
}

const projectUrl = `https://dev.azure.com/${organization}/${project}`;

// Use || to check for empty string as well.
// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
const apiAccessToken = args["api-key"] || process.env.ADO_TOKEN;
if (!apiAccessToken) {
	throw new Error(
		"No valid API token was given or found in the environment. Azure Devops API cannot be used.",
	);
}

const manager = WorkItemManager.create(
	`https://dev.azure.com/${organization}/`,
	project,
	apiAccessToken,
);

const templateIds = taskTemplateInfo
	.filter(
		({ isOptional, name }) =>
			isOptional === undefined ||
			isOptional === false ||
			(isOptional === true && optionalTaskSet.has(`${name}`)),
	)
	.map(({ id }) => id);

async function main(): Promise<void> {
	logInfo(` Creating Rotation ADO Work Items
	ORG: ${organization}
	PROJECT: ${project}

	AREA: ${areaPath}
	ITERATION: ${iterationPath}
	ASSIGN: ${assignedTo}

	OPTIONAL TASKS: ${Array.from(optionalTaskSet.values())}
	`);

	const userStoryId = await createPlatformSupportUserStory();
	for (const id of templateIds) {
		// Do this sequentially to get a predictable task order.
		await createPlatformSupportTaskCategory(id, userStoryId);
	}
	logInfo(
		`Work creation complete! Please verify contents of the story here:\n\n${projectUrl}/_workitems/edit/${userStoryId}`,
	);
}

async function createPlatformSupportUserStory(): Promise<number> {
	const { id } = await manager.createFromTemplate(
		userStoryTemplateId,
		storyTitle,
		undefined,
		undefined,
		areaPath,
		iterationPath,
		assignedTo,
	);
	if (id === undefined) {
		throw new Error("Failed to create a parent user story with valid id.");
	}
	logInfo(`Created user story ${projectUrl}/_workitems/edit/${id}.`);
	return id;
}

async function createPlatformSupportTaskCategory(
	templateId: string,
	parentId: number,
): Promise<void> {
	let wasTemplated = false;
	const titleDeriver = (templateTitle: string): string => {
		if (templateTitle.includes("(day)")) {
			wasTemplated = true;
			return templateTitle.replace("(day)", "(Monday)");
		}
		return templateTitle;
	};
	let workItem = await manager.createFromTemplate(
		templateId,
		titleDeriver,
		undefined,
		parentId,
		areaPath,
		iterationPath,
		assignedTo,
	);
	logInfo(`Created subtask ${projectUrl}/_workitems/edit/${workItem.id}.`);

	if (wasTemplated) {
		// Do the remaining days sequentially to get a predictable order.
		for (const day of ["Tuesday", "Wednesday", "Thursday", "Friday"]) {
			workItem = await manager.createFromTemplate(
				templateId,
				(title) => title.replace("(day)", `(${day})`),
				undefined,
				parentId,
				areaPath,
				iterationPath,
				assignedTo,
			);
			logInfo(`Created subtask ${projectUrl}/_workitems/edit/${workItem.id}.`);
		}
	}
}

main().catch((err) => {
	console.log(`Encountered the following error creating work items:\n${err}`);
});
