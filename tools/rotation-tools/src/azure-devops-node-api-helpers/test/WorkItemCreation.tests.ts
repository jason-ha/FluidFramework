/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */
import { WebApi } from "azure-devops-node-api";
import { ICoreApi } from "azure-devops-node-api/CoreApi";
import {
	JsonPatchDocument,
	JsonPatchOperation,
} from "azure-devops-node-api/interfaces/common/VSSInterfaces";
import { TeamContext, TeamProject } from "azure-devops-node-api/interfaces/CoreInterfaces";
import {
	WorkItem,
	WorkItemExpand,
	WorkItemTemplate,
} from "azure-devops-node-api/interfaces/WorkItemTrackingInterfaces";
import { IWorkItemTrackingApi } from "azure-devops-node-api/WorkItemTrackingApi";
import { expect } from "chai";
import { applyPatch } from "fast-json-patch";
import { link, WorkItemManager } from "../WorkItemCreation";

// `any` used for interfacing with external library
/* eslint-disable @typescript-eslint/no-explicit-any */

const projectName = "fake-project";

class MockWebApi {
	private readonly coreApi: ICoreApi;
	private readonly workItemTrackingApi: IWorkItemTrackingApi;

	public constructor(apis: { coreApi?: any; workItemTrackingApi?: any }) {
		this.coreApi = apis.coreApi ?? (new MockCoreApi() as unknown as ICoreApi);
		this.workItemTrackingApi =
			apis.workItemTrackingApi ??
			(new MockWorkItemTrackingApi(new Map()) as unknown as IWorkItemTrackingApi);
	}

	public getCoreApi(): Promise<ICoreApi> {
		return Promise.resolve(this.coreApi);
	}

	public getWorkItemTrackingApi(): Promise<IWorkItemTrackingApi> {
		return Promise.resolve(this.workItemTrackingApi);
	}
}

class MockCoreApi {
	private readonly project: TeamProject;

	public constructor(project?: TeamProject) {
		this.project = project ?? {
			name: "test-project",
			id: "test-id",
			defaultTeam: { name: "test-project", id: "test-id" },
		};
	}

	public getProject(): Promise<TeamProject> {
		return Promise.resolve(this.project);
	}
}

class MockWorkItemTrackingApi {
	private readonly idToWorkItem: Map<number, WorkItem>;
	private readonly idToWorkItemTemplate: Map<string, WorkItemTemplate>;

	public constructor(
		idToWorkItemTemplate: Map<string, WorkItemTemplate>,
		idToWorkItem?: Map<number, WorkItem>,
	) {
		this.idToWorkItemTemplate = idToWorkItemTemplate;
		this.idToWorkItem = idToWorkItem ?? new Map();
	}

	public getWorkItem(
		id: number,
		_fields?: string[],
		_asOf?: Date,
		_expand?: WorkItemExpand,
		_project?: string,
	): Promise<WorkItem> {
		const item = this.idToWorkItem.get(id);
		return item === undefined
			? Promise.reject(
					new Error(
						`MockWorkItemTrackingApi was missing a mocked work item for id ${id}.`,
					),
			  )
			: Promise.resolve(item);
	}

	public getTemplate(teamContext: TeamContext, templateId: string): Promise<WorkItemTemplate> {
		const template = this.idToWorkItemTemplate.get(templateId);
		return template === undefined
			? Promise.reject(
					new Error(
						`MockWorkItemTrackingApi was missing a mocked template for templateId ${templateId}`,
					),
			  )
			: Promise.resolve(template);
	}

	/**
	 * Inverse of this, which is defined in azure-devops-node-api:
	 * ```typescript
	 * export declare enum Operation {
	 *     Add = 0,
	 *     Remove = 1,
	 *     Replace = 2,
	 *     Move = 3,
	 *     Copy = 4,
	 *     Test = 5
	 *}
	 * ```
	 * (note that this is a `declare enum`, not just an `enum` so the nicencess is lost at ts-compile time)
	 *
	 * This inverse is necessary because fast-json-patch expects strings for the different json patch document operation types (rather than
	 * these number enum values)
	 */
	private static ADOOperationToFastJsonPatchOperation = [
		"add",
		"remove",
		"replace",
		"move",
		"copy",
		"test",
	];

	public createWorkItem(
		_customHeaders: any,
		document: JsonPatchDocument,
		_project: string,
		_type: string,
		_validateOnly?: boolean,
		_bypassRules?: boolean,
		_suppressNotifications?: boolean,
		_expand?: WorkItemExpand,
	): Promise<WorkItem> {
		const fastJsonPatchDocument = (document as JsonPatchOperation[]).map((operation) => ({
			...operation,
			op: MockWorkItemTrackingApi.ADOOperationToFastJsonPatchOperation[operation.op],
		}));
		const result = applyPatch({ fields: {}, relations: [] }, fastJsonPatchDocument as any[]);
		return Promise.resolve(result.newDocument as WorkItem);
	}
}

function getMockWebApi(
	mockedTemplates: Map<string, WorkItemTemplate>,
	mockedWorkItems?: Map<number, WorkItem>,
): WebApi {
	const coreApi = new MockCoreApi();
	const workItemTrackingApi = new MockWorkItemTrackingApi(mockedTemplates, mockedWorkItems);
	return new MockWebApi({ coreApi, workItemTrackingApi }) as unknown as WebApi;
}

describe("Work item creation tests", () => {
	it("Create a work item according to the template", async () => {
		const title = "Task example title";
		const description = `Sample description with a ${link("https://www.bing.com", "link")}`;
		const templateId = "template-id";
		const mockedTemplates = new Map([
			[
				templateId,
				{
					name: "Sample Template",
					workItemTypeName: "task",
					fields: { "System.Iteration": "example-iteration" },
				},
			],
		]);

		const manager = new WorkItemManager(projectName, getMockWebApi(mockedTemplates));
		const workItem = await manager.createFromTemplate(templateId, title, description);
		expect(workItem).to.have.property("fields");
		expect(workItem.fields)
			.to.have.property("System.Iteration")
			.that.equals(
				"example-iteration",
				"Created work item should inherit iteration from template",
			);
		expect(workItem.fields)
			.to.have.property("Title")
			.that.equals(title, "Created work item should use title from arguments");
		expect(workItem.fields)
			.to.have.property("System.Description")
			.that.equals(description, "Created work item should use description from arguments");
	});

	it("Gives a reasonable error on creation when missing API credentials", async () => {
		let errorCaught = false;
		const orgUrl = "https://www.microsoft.com/fake-org";
		try {
			await WorkItemManager.create(orgUrl, projectName);
		} catch (err) {
			errorCaught = true;
			expect(err).instanceOf(Error);
			expect((err as Error).message).to.include("No API token");
		}

		expect(errorCaught).to.equal(true, "An error should be thrown if no API token is present.");
	});

	it("Makes a parent work item when requested", async () => {
		const title = "Task with parent item";
		const description = "Sample description";
		const templateId = "template-id";
		const parentId = 5;
		const parentUrl = "https://www.microsoft.com/mock-url";

		const mockedTemplates = new Map([
			[
				templateId,
				{
					name: "Sample Template",
					workItemTypeName: "task",
					fields: {},
				},
			],
		]);
		const mockedWorkItems = new Map([
			[parentId, { fields: { Title: "Mocked parent item" }, url: parentUrl }],
		]);
		const manager = new WorkItemManager(
			projectName,
			getMockWebApi(mockedTemplates, mockedWorkItems),
		);
		const workItem = await manager.createFromTemplate(templateId, title, description, parentId);
		expect(workItem).to.have.property("relations").that.is.instanceOf(Array).with.length(1);
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		expect(workItem.relations![0]).to.deep.equal(
			{ rel: "System.LinkTypes.Hierarchy-Reverse", url: parentUrl },
			"Created work item should have a a parent link pointing to the parent work item.",
		);
	});
});
