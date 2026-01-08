# File Organization Specification

## 1. Feature Overview

**Feature Name:** Folder-Grouped File Organization

**Feature Description:** Files in Pull Requests are organized by directory, with collapsible folder sections and consistent navigation order across all views.

**Goal:** To provide a clear, hierarchical view of changes that matches the project structure, making it easier to understand the scope of changes.

**Status:** ✅ Implemented

**Note:** The same folder grouping is used in both the PR Detail view and Review Mode sidebar for consistency.

## 2. System Architecture

- **File Grouping Logic**: Shared utility in `src/utils/fileOrder.ts` that groups files by directory path.
- **Visual Order**: Files are sorted with root-level files first, followed by directories in alphabetical order.
- **Navigation Sync**: Keyboard navigation follows the visual order, not the raw API order.
- **State Management**: Collapsed/expanded state of folders is managed locally per component.

## 3. Functional Requirements

```gherkin
Feature: Folder-Grouped File Organization
  As a code reviewer
  I want to see files organized by folder
  So that I can understand the structure of changes at a glance

  Scenario: Viewing Files Grouped by Folder
    Given I am viewing a PR with files in multiple directories
    When I look at the file list
    Then I should see root-level files at the top
    And I should see folder headers below the root files
    And folders should be sorted alphabetically
    And files within each folder should be grouped together

  Scenario: Collapsing a Folder
    Given I am viewing a PR with files in the "src/components" folder
    When I click on the "src/components" folder header
    Then the files within that folder should be hidden
    And the folder header should show a collapse indicator
    And the file count should still be visible

  Scenario: Expanding a Collapsed Folder
    Given I have collapsed the "src/utils" folder
    When I click on the "src/utils" folder header again
    Then the files within that folder should become visible
    And the folder header should show an expand indicator

  Scenario: Auto-Expand on Navigation
    Given I have collapsed a folder containing the currently selected file
    When I navigate to a file within that folder
    Then the folder should automatically expand
    And the selected file should be visible

  Scenario: Keyboard Navigation Follows Visual Order
    Given I am viewing a PR with root files and folder files
    And the current file is the last root-level file
    When I press "ArrowDown" or "j"
    Then I should navigate to the first file in the first folder
    And navigation should respect the visual grouping order

  Scenario: File Count Display
    Given I am viewing a PR with folders
    When I look at a folder header
    Then I should see the number of files in that folder
    And the count should update if files are added or removed

  Scenario: Consistent Display Across Views
    Given I am viewing a PR in the Detail view
    When I switch to Review Mode
    Then the folder organization should be identical
    And the same folders should be collapsed/expanded
```

## 4. Technical Requirements

### File Ordering Utility (`src/utils/fileOrder.ts`)

```typescript
// Returns indices in visual display order
function getVisualFileOrder(files: MRFile[]): number[];

// Navigate to next file in visual order
function getNextFileIndex(currentIndex: number, visualOrder: number[]): number;

// Navigate to previous file in visual order  
function getPrevFileIndex(currentIndex: number, visualOrder: number[]): number;
```

### Grouping Algorithm
1. Iterate through files and extract directory path from each filename
2. Group files by directory path (root files have empty string as path)
3. Sort directory keys: root ('') first, then alphabetically
4. Flatten into visual order array preserving group order

### UI Components
- **MrDetail**: Uses grouped file list with collapsible folder headers
- **ReviewSidebar**: Uses same grouping logic with compact folder display
- **App.tsx**: Uses `visualFileOrder` for keyboard navigation in both Detail and Review views

### Styling
- Root-level files have standard indentation
- Files within folders have additional left padding (24px)
- Folder headers show chevron icon, folder icon, path, and file count
- Selected file has blue left border and subtle background highlight
