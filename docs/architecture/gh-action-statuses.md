# GitHub Action Statuses Specification

## 1. Feature Overview

**Feature Name:** GitHub Action Statuses

**Feature Description:** Display CI/CD status (GitHub Actions) for each Pull Request in the list and detail views, with the ability to trigger and cancel workflows.

**Goal:** Provide immediate visual feedback on the build/test status of a PR, allowing users to prioritize reviews based on CI results.

**Status:** ✅ Implemented

**Note:** Supports GitHub Actions with polling for real-time updates. Future support for other CI providers can be added via the generic Statuses API.

## 2. System Architecture

- **GitHub Checks API**: The primary source for GitHub Actions results. Uses `octokit.rest.checks.listForRef`.
- **GitHub Actions API**: Used for fetching workflow runs and triggering/canceling workflows.
- **Polling**: CI status is polled at a configurable interval (default 5 seconds) for real-time updates.
- **Data Fetching**: Statuses are fetched concurrently with PR details to minimize latency.

## 3. Functional Requirements

```gherkin
Feature: GitHub Action Statuses
  As a code reviewer
  I want to see the CI/CD status of Pull Requests
  So that I can prioritize reviews based on build results

  Scenario: Viewing CI Status in PR List
    Given I am on the PR List page
    When the application fetches PR data
    Then I should see a colored indicator next to each PR title
    And a green checkmark should appear for PRs where all GitHub Actions passed
    And a red cross should appear for PRs where at least one Action failed
    And an animated indicator should appear for PRs with Actions in progress
    And a grey circle should appear for PRs with no actions associated

  Scenario: Viewing Detailed Check Results
    Given I have selected a PR to view its details
    When I look at the CI status section
    Then I should see a list of workflow runs
    And each workflow run should show its name, status, and timing
    And I should be able to expand to see individual check runs
    And each check run should have a link to its GitHub log

  Scenario: Polling for Status Updates
    Given I am viewing the details of a PR with running Actions
    When the configured polling interval elapses
    Then the CI status should automatically refresh
    And I should see updated statuses without manual refresh

  Scenario: Triggering a Manual Workflow
    Given I am viewing the details of a PR
    And the repository has workflow_dispatch enabled workflows
    When I click the "Run [Workflow Name]" button
    Then the application should send a workflow_dispatch event to GitHub
    And a loading spinner should be displayed until the request completes
    And the CI status should update once the workflow starts

  Scenario: Canceling a Running Workflow
    Given I am viewing the details of a PR
    And there is a workflow currently running
    When I click the "Cancel" button next to the running workflow
    Then the application should send a cancel request to GitHub
    And the workflow status should update to cancelled

  Scenario: Viewing CI Status in Review Mode
    Given I am in Review Mode
    When I look at the top bar
    Then I should see the overall CI status indicator
    And I should see review progress statistics
```

## 4. Technical Requirements

### Data Model

```typescript
export interface CheckRun {
    id: number;
    name: string;
    status: 'queued' | 'in_progress' | 'completed' | 'waiting';
    conclusion: 'success' | 'failure' | 'neutral' | 'cancelled' | 'timed_out' | 'action_required' | 'skipped' | 'stale' | null;
    html_url: string;
    started_at?: string;
    completed_at?: string;
}

export interface CIStatus {
    state: 'success' | 'failure' | 'pending' | 'unknown';
    total_count: number;
    success_count: number;
    check_runs: CheckRun[];
}
```

### API Implementation
- **Fetch Statuses**: Uses `octokit.rest.checks.listForRef({ owner, repo, ref: head_sha })`.
- **Fetch Workflow Runs**: Uses `octokit.rest.actions.listWorkflowRunsForRepo`.
- **Trigger Workflow**: Uses `octokit.rest.actions.createWorkflowDispatch({ owner, repo, workflow_id, ref: head_ref })`.
- **Cancel Workflow**: Uses `octokit.rest.actions.cancelWorkflowRun({ owner, repo, run_id })`.

### Status Calculation Logic
- If any check is `failure`, `timed_out`, or `action_required` → `failure`
- Else if any check is `queued`, `in_progress`, or `waiting` → `pending`
- Else if all completed checks are `success`, `neutral`, or `skipped` → `success`
- Else → `unknown`

### UI Components
- `WorkflowRuns` component displays collapsible workflow run cards.
- Each workflow shows timing information and individual check runs.
- Cancel button appears for running workflows with visual feedback.
- Status polling is managed in `MrDetail` component with configurable interval.
