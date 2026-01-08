# Re-Review Logic Specification

## 1. Feature Overview

**Feature Name:** Smart Re-review & State Management

**Feature Description:** Logic to handle the state of viewed files when new commits are pushed to a previously reviewed Pull Request.

**Goal:** To ensure that users are immediately aware of which files have changed since their last review, while preserving "viewed" status for files that remain untouched.

**Status:** ✅ Implemented

**Note:** This is critical for the "incremental review" workflow.

## 2. System Architecture

- **Local State Store**: The storage schema tracks `viewedAtSha` (the SHA of the file blob when marked viewed) for each file.
- **SHA Comparison**: On PR reload/fetch, the system compares current file SHAs against stored SHAs to determine if files have changed.
- **Secure Storage**: Uses Tauri's secure store or localStorage for persistence across sessions.

## 3. Functional Requirements

```gherkin
Feature: Smart Re-review
  As a code reviewer
  I want my review progress to persist intelligently
  So that I only need to re-review files that have actually changed

  Scenario: Marking a File as Viewed
    Given I am reviewing a Pull Request
    When I mark a file as viewed
    Then the system should record the file path and its current SHA
    And the file should appear with a green checkmark

  Scenario: File Unchanged After New Commits
    Given I have previously marked "src/utils.ts" as viewed
    And a new commit is pushed that does not modify "src/utils.ts"
    When I refresh or reload the Pull Request
    Then "src/utils.ts" should remain marked as viewed
    And the progress percentage should be preserved

  Scenario: File Changed After New Commits
    Given I have previously marked "src/utils.ts" as viewed
    And a new commit is pushed that modifies "src/utils.ts"
    When I refresh or reload the Pull Request
    Then "src/utils.ts" should be reset to unviewed
    And the progress percentage should decrease accordingly

  Scenario: New File Added
    Given I am reviewing a Pull Request
    And a new commit adds a new file "src/newFile.ts"
    When I refresh or reload the Pull Request
    Then "src/newFile.ts" should appear as unviewed
    And the total file count should increase

  Scenario: Progress Persists Across Sessions
    Given I have marked several files as viewed
    When I close and reopen the application
    Then my review progress should be restored
    And viewed files should still be marked appropriately
```

## 4. Technical Requirements

### State Tracking
- When a user marks `file_A.ts` as **Viewed**, the system records:
  - `filePath`: `file_A.ts`
  - `reviewedSha`: `<current_file_blob_sha>`

### SHA Comparison Logic
- **Efficiency**: Verification uses GitHub's API `sha` for the file blob.
  - If `file.sha` (current) != `file.sha` (at time of view), then it changed.
  - This avoids needing to diff file contents manually.
- **Implementation**: The `isFileViewed` function in `src/utils/reReview.ts` compares stored SHA with current SHA.

### Persistence
- State survives app restarts via Tauri's secure store or localStorage.
- Storage key format: `viewed_${mrId}` containing a map of `{ [filename]: sha }`.
