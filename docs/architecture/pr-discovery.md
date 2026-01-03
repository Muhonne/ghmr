# PR Discovery Specification

## 1. Feature Overview

**Feature Name:** PR Discovery & GitHub Integration

**Feature Description:** Automatically connects to GitHub to identify and list relevant Pull Requests (specifically those authored by the user) for review and tracking.

**Goal:** To provide a centralized dashboard of active work without requiring manual URL entry or searching.

**Status:** ✅ Implemented

**Note:** Currently scoped to "Authored by me" but extensible to "Review requested" in the future.

## 2. System Architecture

- **GitHub API**: Uses the REST/GraphQL API to fetch pull requests.
- **Authentication**: Uses Personal Access Tokens (PAT) stored in the secure store.
- **Polling/Fetching**: Fetches data on app load or manual refresh.

## 3. Functional Requirements

### Authentication
- User provides a Personal Access Token (PAT).
- Token is verified against GitHub API.
- Token is stored securely on the local machine (not in plain text if possible, or essentially local-only).

### PR Listing
- **Auto-Fetch**: On launch, the app queries for open PRs where `author = @me`.
- **List View**: Displays PR Title, Branch Name, ID, and potentially Status.
- **Quick Actions**: Clicking a PR item opens it in Review Mode.

## 4. Technical Requirements
- **Error Handling**: Must gracefully handle network failures or invalid tokens (403/401 errors).
- **Rate Limiting**: Should respect GitHub API rate limits.
- **Data Shape**: API responses should be normalized to a consistent internal `PullRequest` interface.
