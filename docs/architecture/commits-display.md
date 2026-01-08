# Commits Display Specification

## 1. Feature Overview

**Feature Name:** Commits Display

**Feature Description:** Display commit history for each Pull Request with author information, timestamps, and commit messages.

**Goal:** To provide context about the development history of a PR, helping reviewers understand how changes evolved.

**Status:** ✅ Implemented

**Note:** Commits are shown in reverse chronological order (latest first) for easier tracking of recent changes.

## 2. System Architecture

- **GitHub API**: Fetches commits using `octokit.rest.pulls.listCommits`.
- **UI Component**: Hover tooltip in the PR Detail header displays commit list.
- **Relative Timestamps**: Commit dates are displayed as relative times (e.g., "2h ago").

## 3. Functional Requirements

```gherkin
Feature: Commits Display
  As a code reviewer
  I want to see the commit history of a Pull Request
  So that I can understand the progression of changes

  Scenario: Viewing Commit Count
    Given I am viewing a PR with 5 commits
    When I look at the PR header
    Then I should see "5 commits" with a git commit icon

  Scenario: Hovering to See Commits
    Given I am viewing a PR with commits
    When I hover over the commits indicator
    Then I should see a tooltip with the list of commits
    And the most recent commit should be at the top

  Scenario: Viewing Commit Details
    Given I am viewing the commits tooltip
    When I look at a commit entry
    Then I should see the short SHA (7 characters)
    And I should see the commit author name
    And I should see a relative timestamp (e.g., "3h ago")
    And I should see the commit message (first line only)

  Scenario: Relative Timestamps Display
    Given I am viewing commits made at various times
    Then commits made less than 1 minute ago should show "just now"
    And commits made less than 1 hour ago should show "Xm ago"
    And commits made less than 24 hours ago should show "Xh ago"
    And commits made less than 7 days ago should show "Xd ago"
    And older commits should show the date

  Scenario: Tooltip Persistence on Hover
    Given the commits tooltip is visible
    When I move my mouse into the tooltip area
    Then the tooltip should remain visible
    And I should be able to scroll through commits if there are many
```

## 4. Technical Requirements

### Data Model

```typescript
export interface Commit {
    sha: string;
    message: string;
    author: string;
    date: string;
}
```

### API Implementation
- Uses `octokit.rest.pulls.listCommits({ owner, repo, pull_number })` to fetch commits.
- Only the first line of commit messages is shown to keep the display compact.

### Timestamp Formatting
```typescript
const formatRelativeTime = (dateStr: string) => {
    const diffMs = now.getTime() - date.getTime();
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
};
```

### UI Styling
- Tooltip uses portal rendering to avoid z-index issues
- Maximum height with overflow scroll for long commit lists
- Short SHA displayed in accent color monospace font
- Border separators between commit entries
