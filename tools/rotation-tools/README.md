# Rotation Tools

This package contains scripts and tools for rotation processes.

## Building

In the repo root run install and build:

1. `pnpm install --frozen-lockfile`
2. `pnpm build`

## Usage

This package provides the following scripts:

-   `create-work-items.script.ts`

    This script creates rotation task work items from ADO templates.

### Running the script

1. Before proceeding, acquire an ADO [Personal Access Token](https://dev.azure.com/fluidframework/_usersSettings/tokens) with permission to create Work Items.

    TODO: update project to have powershell script that automatically acquires a temporary PAT.

2. Create rotation work items:

    ```powershell

    cd ./tools/rotation-tools

    # Create rotation story and tasks
    pnpm ts-node ./src/create-work-items/create-work-items.script.ts --config ./ado-project-config.json --api-key [PAT] --iteration-path 'internal\Team Sasha 2023.L' --assigned-to 'alias@microsoft.com'

    # Additional Options

    # use the --optional-tasks with a list of optional tasks names to create
    pnpm ts-node ./src/create-work-items/create-work-items.script.ts --config ./ado-project-config.json --api-key [PAT] --iteration-path 'internal\Team Sasha 2023.L' --assigned-to 'alias@microsoft.com' --optional-tasks fluid-update

    ```

## Notes

-   The script uses task templates defined in [ADO here](https://dev.azure.com/fluidframework/internal/_settings/work-team?type=Task&_a=templates)
-   You can find the current iteration and team-member aliases by looking at an existing task on a team Taskboard.
