# Re-Review Logic Specification

## 1. Feature Overview

**Feature Name:** Smart Re-review & State Management

**Feature Description:** Logic to handle the state of viewed files when new commits are pushed to a previously reviewed Pull Request.

**Goal:** to ensure that users are immediately aware of which files have changed since their last review, while preserving "viewed" status for files that remain untouched.

**Status:** ⚠️ Planned

**Note:** This is critical for the "incremental review" workflow.

## 2. System Architecture

- **Local State Store**: Expands the local storage schema to track not just `boolean viewed`, but `string viewedAtSha` (the SHA of the PR HEAD when the file was marked viewed).
- **Diff Comparison**: On PR reload/fetch, the system compares the current PR HEAD SHA against stored SHAs.

## 3. Functional Requirements

### State Tracking
- When a user marks `file_A.ts` as **Viewed**, the system records:
  - `filePath`: `file_A.ts`
  - `reviewedCommit`: `<current_pr_head_sha>`

### Handling New Commits
- When the app detects a new commit on the PR branch (Head SHA changes):
  - **Iterate** through all files in the PR.
  - **Check**: Has the file content changed between `reviewedCommit` and `currentHead`?
    - *Scenario 1 (No change)*: If the file is identical to the version previously reviewed, keep status as **Viewed**.
    - *Scenario 2 (Changed)*: If the file has been modified in the new commits, reset status to **Unviewed**.
    - *Scenario 3 (New file)*: Treat as **Unviewed**.

### User Interface
- Visually highlight files that were "RESET" to distinguishing them from files that were never reviewed. (Optional but recommended).
- Progress bar should update to reflect the drop in completion percentage.

## 4. Technical Requirements
- **Efficiency**: verification needs to be lightweight. We can likely rely on GitHub's API `sha` for the file blob.
  - If `file.sha` (current) != `file.sha` (at time of view), then it changed.
  - This avoids needing to diff file contents manually.
- **Persistence**: This state must survive app restarts.
<--- test if this works --->