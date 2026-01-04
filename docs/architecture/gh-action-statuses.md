# GitHub Action Statuses Specification

## 1. Feature Overview

**Feature Name:** GitHub Action Statuses

**Feature Description:** Display CI/CD status (GitHub Actions) for each Pull Request in the list and detail views.

**Goal:** Provide immediate visual feedback on the build/test status of a PR, allowing users to prioritize reviews based on CI results.

**Status:** ⚠️ Planned

**Note:** Initial implementation will focus on GitHub Actions. Future support for other CI providers can be added via the generic Statuses API.

## 2. System Architecture

- **GitHub Checks API**: The primary source for GitHub Actions results. Uses `octokit.rest.checks.listForRef`.
- **GitHub Statuses API**: (Optional/Fallback) For organizations using legacy status providers. Uses `octokit.rest.repos.getCombinedStatusForRef`.
- **Data Fetching**: Statuses will be fetched concurrently with PR details to minimize latency.

## 3. Functional Requirements

### PR List View
- **Status Indicator**: Each PR item in the list shows a "traffic light" indicator:
    - ✅ Green: All checks passed.
    - ❌ Red: One or more checks failed.
    - ⏳ Yellow: Checks are currently running or pending.
    - ⚪ Grey: No checks found or unknown state.
- **Summary**: Hovering over the status indicator shows a brief summary (e.g., "5/5 checks passed").

### PR Detail View
- **Status Positioning**: The overall CI status must be displayed in the bottom right corner of the header section (alongside the branch information).
- **Checks List**: A dedicated section showing the list of individual check runs.
- **Links**: Each check run should link directly to its GitHub Actions log page.
- **Refresh**: Statuses should refresh when the PR list is manually refreshed.

### Triggering Actions
- **Run Workflow**: Ability to trigger a `workflow_dispatch` for a specific workflow on the PR's head branch.
- **Re-run Checks**: Ability to re-run failed or all check suites associated with the PR's head SHA.
- **Visual Feedback**: Show a loading state/spinner while the action is being triggered.

### Review Module
- **Top Bar Indicator**: The sticky top bar in the review module should display the CI status prominently next to the PR title.
- **Quick Switch**: (Optional) clicking the status should show a summary of failed checks.

### Scenarios

#### Scenario: Viewing CI Status in PR List
```gherkin
Given I am on the PR List page
When the application fetches PR data
Then I should see a colored indicator next to each PR title if there are actions associated with the PR
And a green checkmark should appear for PRs where all GitHub Actions passed
And a red cross should appear for PRs where at least one Action failed
And a animated shape should appear for PRs with Actions in progress
And a grey circle should appear for PRs with no actions associated with the PR
```

#### Scenario: Viewing Detailed Check Results
```gherkin
Given I have selected a PR to view its details
When I look at the header section
Then I should see the overall CI status in the bottom right corner
And I should see a list of all individual check runs
And each check run should have a link to its GitHub log
```

#### Scenario: Triggering a Manual Workflow
```gherkin
Given I am viewing the details of a PR
I can see a button to trigger a manual workflow under the CI status indicator
When I click the button
Then the application should send a workflow_dispatch event to GitHub to trigger the workflow for the branch of the PR
And a loading spinner should be displayed until the request completes
And the CI status should update to "pending" once the workflow starts
```

## 4. Technical Requirements

### Data Model Updates
Update the `MergeRequest` interface in `src/types/index.ts`:

```typescript
export interface CheckRun {
    id: number;
    name: string;
    status: 'queued' | 'in_progress' | 'completed' | 'waiting';
    conclusion: 'success' | 'failure' | 'neutral' | 'cancelled' | 'timed_out' | 'action_required' | 'skipped' | 'stale' | null;
    html_url: string;
}

export interface CIStatus {
    state: 'success' | 'failure' | 'pending' | 'unknown';
    total_count: number;
    success_count: number;
    check_runs: CheckRun[];
}

export interface MergeRequest {
    // ... existing fields
    ci_status?: CIStatus;
}
```

### API Implementation
- **Fetch Statuses**: Use `octokit.rest.checks.listForRef({ owner, repo, ref: head_sha })`.
- **Logic for global state**:
    - If any check is `failure`, `timed_out`, or `action_required` -> `failure`.
    - Else if any check is `queued`, `in_progress`, or `waiting` -> `pending`.
    - Else if all completed checks are `success`, `neutral`, or `skipped` -> `success`.
    - Else -> `unknown`.
- **Triggering Workflow**: Use `octokit.rest.actions.createWorkflowDispatch({ owner, repo, workflow_id, ref: head_ref })`.
- **Re-running Check Suite**: Use `octokit.rest.checks.rereunCheckSuite({ owner, repo, check_suite_id })`.

### UI Components
- Create a `CIStatusBadge` component.
- Update `MrListItem` to include the badge next to the PR title or number.
- Update `MrDetail` to show the list of `CheckRun` items.
- Add an "Actions" menu or button group in `MrDetail` header to trigger runs.
