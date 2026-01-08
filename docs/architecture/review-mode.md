# Review Mode Specification

## 1. Feature Overview

**Feature Name:** Review Mode

**Feature Description:** An immersive, keyboard-centric interface for reviewing Pull Request changes, offering side-by-side diffs, folder-grouped file navigation, and progress tracking.

**Goal:** To enable developers to review code changes efficiently without leaving the application, mirroring the speed and utility of native desktop tools.

**Status:** ✅ Implemented

**Note:** Designed for high-speed navigation using keyboard shortcuts. Built with Tauri for cross-platform desktop support.

## 2. System Architecture

- **ReactDiffViewer**: Used for rendering split-view diffs with syntax highlighting.
- **State Management**: Tracks "viewed" status of files locally, persisted across sessions.
- **Folder Grouping**: Files are organized by directory in the sidebar, with root-level files displayed first followed by alphabetically sorted folders.
- **Visual File Order**: Keyboard navigation follows the visual order of files (grouped by folder), not the raw API order.
- **Tauri**: Provides native desktop window management and secure storage.

## 3. Functional Requirements

```gherkin
Feature: Review Mode
  As a code reviewer
  I want to navigate through file changes efficiently
  So that I can complete code reviews quickly

  Scenario: Entering Review Mode
    Given I have selected a Pull Request
    When I click the "Review" button or press Enter on a file
    Then I should see the diff viewer with the current file's changes
    And I should see a sidebar with files grouped by folder

  Scenario: Navigating to Next File
    Given I am in Review Mode viewing a file
    When I press "ArrowRight" or "j"
    Then I should see the next file in the visual order (folder-grouped)
    And the sidebar selection should update to highlight the current file

  Scenario: Navigating to Previous File
    Given I am in Review Mode viewing a file
    When I press "ArrowLeft" or "k"
    Then I should see the previous file in the visual order (folder-grouped)
    And navigation should work across folder boundaries

  Scenario: Marking File as Viewed and Advancing
    Given I am in Review Mode viewing an unviewed file
    When I press "Enter" or "Space"
    Then the current file should be marked as viewed
    And I should automatically advance to the next unviewed file
    And the progress indicator should update

  Scenario: Unmarking File and Going Back
    Given I am in Review Mode viewing a viewed file
    When I press "Backspace"
    Then the current file should be unmarked (set to unviewed)
    And I should navigate to the previous file in visual order

  Scenario: Scrolling Within a File
    Given I am in Review Mode viewing a long file
    When I press "ArrowDown"
    Then the diff view should scroll down smoothly
    When I press "ArrowUp"
    Then the diff view should scroll up smoothly

  Scenario: Exiting Review Mode
    Given I am in Review Mode
    When I press "Escape"
    Then I should return to the PR Detail view

  Scenario: Folder Collapse/Expand in Sidebar
    Given I am in Review Mode with files in multiple folders
    When I click on a folder header in the sidebar
    Then the folder should collapse or expand
    And the file count should be shown next to the folder name
```

## 4. Technical Requirements

- The diff viewer must support large files without significant performance lag.
- Keyboard event listeners must be unbound when leaving the component to prevent memory leaks and unintended actions.
- Visual file order is computed using the `getVisualFileOrder` utility in `src/utils/fileOrder.ts`.
- File navigation functions (`getNextFileIndex`, `getPrevFileIndex`) ensure navigation follows the grouped display order.
- Scroll position resets to top when switching files.
