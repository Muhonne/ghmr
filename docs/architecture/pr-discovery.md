# PR Discovery Specification

## 1. Feature Overview

**Feature Name:** PR Discovery & GitHub Integration

**Feature Description:** Automatically connects to GitHub to identify and list relevant Pull Requests (specifically those authored by the user) for review and tracking.

**Goal:** To provide a centralized dashboard of active work without requiring manual URL entry or searching.

**Status:** ✅ Implemented

**Note:** Currently scoped to "Authored by me" but extensible to "Review requested" in the future.

## 2. System Architecture

- **GitHub API**: Uses the REST API via Octokit to fetch pull requests.
- **Authentication**: Uses Personal Access Tokens (PAT) stored in Tauri's secure store.
- **Pagination**: Fetches all PR files using Octokit's pagination iterator to handle PRs with more than 30 files.
- **Polling/Fetching**: Fetches data on app load or manual refresh (`Cmd+R` / `Ctrl+R`).

## 3. Functional Requirements

```gherkin
Feature: PR Discovery
  As a developer
  I want to see all my open Pull Requests in one place
  So that I can quickly access and review my work

  Scenario: Initial Authentication
    Given I am launching the app for the first time
    When I enter a valid GitHub Personal Access Token
    Then the token should be validated against the GitHub API
    And the token should be stored securely
    And I should be redirected to the PR list view

  Scenario: Invalid Token
    Given I am on the settings page
    When I enter an invalid GitHub token
    Then I should see an authentication error message
    And I should remain on the settings page

  Scenario: Fetching Open PRs
    Given I am authenticated with a valid token
    When the app loads or I refresh the list
    Then I should see a list of all my open Pull Requests
    And each PR should display its title, repository, and PR number

  Scenario: PR with Many Files
    Given I have a Pull Request with more than 30 changed files
    When the app fetches the PR details
    Then all files should be loaded (not just the first 30)
    And the file count should match the actual number of changes

  Scenario: Selecting a PR
    Given I am viewing the PR list
    When I click on a PR or press Enter while it's selected
    Then I should be taken to the PR Detail view
    And I should see the list of changed files

  Scenario: Keyboard Navigation in PR List
    Given I am viewing the PR list
    When I press "ArrowDown" or "j"
    Then the selection should move to the next PR
    When I press "ArrowUp" or "k"
    Then the selection should move to the previous PR

  Scenario: Refreshing PR List
    Given I am viewing the PR list
    When I press "Cmd+R" or "Ctrl+R"
    Then the PR list should refresh with latest data from GitHub
    And any new PRs should appear in the list
```

## 4. Technical Requirements

- **Error Handling**: Must gracefully handle network failures or invalid tokens (403/401 errors).
- **Rate Limiting**: Should respect GitHub API rate limits with appropriate error messages.
- **Data Shape**: API responses are normalized to the internal `MergeRequest` interface.
- **Pagination**: Uses `octokit.paginate.iterator` to fetch all files for PRs with more than 30 changes.
- **File Fetching**: Each PR fetches files, commits, and details concurrently for performance.
