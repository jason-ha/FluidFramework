/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import { getPersonalAccessTokenHandler, WebApi } from "azure-devops-node-api";
import { ICoreApi } from "azure-devops-node-api/CoreApi";
import {
	JsonPatchOperation,
	Operation,
} from "azure-devops-node-api/interfaces/common/VSSInterfaces";
import { TeamContext, TeamProject } from "azure-devops-node-api/interfaces/CoreInterfaces";
import {
	WorkItem,
	WorkItemExpand,
} from "azure-devops-node-api/interfaces/WorkItemTrackingInterfaces";
import { IWorkItemTrackingApi } from "azure-devops-node-api/WorkItemTrackingApi";

/**
 * Helper class which encapsulates any Azure DevOps API calls necessary to work with work items.
 */
export class WorkItemManager {
	private readonly projectName: string;
	private readonly coreApiPromise: Promise<ICoreApi>;
	private readonly workItemTrackingApiPromise: Promise<IWorkItemTrackingApi>;

	public constructor(projectName: string, connection: WebApi) {
		this.projectName = projectName;
		this.coreApiPromise = connection.getCoreApi();
		this.workItemTrackingApiPromise = connection.getWorkItemTrackingApi();
	}

	public static create(orgUrl: string, projectName: string, token: string): WorkItemManager {
		const authHandler = getPersonalAccessTokenHandler(token);
		const connection = new WebApi(orgUrl, authHandler);
		return new WorkItemManager(projectName, connection);
	}

	/**
	 * Creates a work item from a template.
	 *
	 * @param templateId - Guid for the template the work item should be based on.
	 * @param title - Title for the created work item.
	 * Can either be a string or a function which receives the template's base title as a parameter (useful for, e.g. templates with
	 * templated titles)
	 * @param description - Description for the created work item.
	 * @param parentId - Optional parent for the created work item.
	 */
	public async createFromTemplate(
		templateId: string,
		// eslint-disable-next-line @typescript-eslint/no-shadow
		title: string | ((baseTitle: string) => string) = (title) => title,
		description?: string,
		parentId?: number,
		areaPath?: string,
		iterationPath?: string,
		assignedTo?: string,
	): Promise<WorkItem> {
		const [coreApi, workItemTrackingApi] = await Promise.all([
			this.coreApiPromise,
			this.workItemTrackingApiPromise,
		]);
		const project: TeamProject = await coreApi.getProject(this.projectName);

		if (!project.defaultTeam) {
			throw new Error(
				`Default team could not be determined from project information: ${JSON.stringify(
					project,
				)}`,
			);
		}
		const teamContext: TeamContext = {
			project: project.name,
			projectId: project.id,
			team: project.defaultTeam.name,
			teamId: project.defaultTeam.id,
		};

		const parentPromise = parentId
			? workItemTrackingApi.getWorkItem(
					parentId,
					undefined,
					undefined,
					WorkItemExpand.None,
					this.projectName,
			  )
			: undefined;
		const template = await workItemTrackingApi.getTemplate(teamContext, templateId);
		const patchDocument: JsonPatchOperation[] = Object.entries(template.fields || {})
			.filter(([key, _]) => key !== "System.Title")
			.map(([key, field]: [unknown, string]) => ({
				op: Operation.Add,
				path: `/fields/${key}`,
				value: field,
			}));

		if (typeof title === "string") {
			patchDocument.push({ op: Operation.Add, path: "/fields/Title", value: title });
		} else {
			const baseTitle = template.fields["System.Title"] ?? "";
			patchDocument.push({
				op: Operation.Add,
				path: "/fields/Title",
				value: title(baseTitle),
			});
		}

		if (description !== undefined) {
			patchDocument.push({
				op: Operation.Add,
				path: "/fields/System.Description",
				value: description,
			});
		}

		if (areaPath !== undefined) {
			patchDocument.push({
				op: Operation.Add,
				path: "/fields/System.AreaPath",
				value: areaPath,
			});
		}

		if (iterationPath !== undefined) {
			patchDocument.push({
				op: Operation.Add,
				path: "/fields/System.IterationPath",
				value: iterationPath,
			});
		}

		if (assignedTo !== undefined) {
			patchDocument.push({
				op: Operation.Add,
				path: "/fields/System.AssignedTo",
				value: assignedTo,
			});
		}

		if (parentPromise) {
			// Add a link to the parent work item.
			const parent = await parentPromise;
			if (parent.url) {
				patchDocument.push({
					op: Operation.Add,
					path: "/relations/-",
					value: {
						// https://docs.microsoft.com/en-us/azure/devops/boards/queries/link-type-reference?view=azure-devops
						rel: "System.LinkTypes.Hierarchy-Reverse",
						url: parent.url,
					},
				});
			}
		}

		// Create a new work item from the template.
		return workItemTrackingApi.createWorkItem(
			undefined,
			patchDocument,
			this.projectName,
			template.workItemTypeName,
		);
	}
}

/**
 * Gets an html representation of a link
 *
 * @param url - url the link should point to
 * @param text - display text for the link
 */
export function link(url: string, text: string): string {
	return `<a href=${url}>${text}</a>`;
}

/**
 * Gets an html representation of bolded text
 *
 * @param text - text to bold
 */
export function bold(text: string): string {
	return `<b>${text}</b>`;
}
