# Copy Filename and Line Number Specification

## 1. Feature Overview

**Feature Name:** Copy Filename and Line Number

**Feature Description:** When a user selects text in the code viewer and presses `Cmd+C` (or `Ctrl+C`), the clipboard content should be formatted as "filename:line <selection>" instead of just the selected text.

**Goal:** Simplify sharing specific code context in discussions by automatically including the file location.

**Status:** ✅ Implemented

**Note:** This overrides the default copy behavior specifically within the code diff/viewer area.

## 2. System Architecture

The feature handles clipboard events within the `ReviewModule` component. It interacts with the `window.getSelection()` API to retrieve the selected text and DOM traversal to identify the corresponding line numbers.

## 3. Functional Requirements

```gherkin
Feature: Enhanced Copying
  As a reviewer
  I want to copy code with its location context
  So that I can easily reference it in chat or issue trackers

  Scenario: Copying selected text with Cmd+C
    Given I am viewing a file named "src/utils.ts"
    And I have selected text "const foo = bar" on line 42
    When I press "Cmd+C" or "Ctrl+C"
    Then the clipboard should contain "src/utils.ts:42 const foo = bar"
    
  Scenario: Copying multiline selection with Cmd+C
    Given I am viewing a file named "src/utils.ts"
    And I have selected text spanning from line 10 to 12
    When I press "Cmd+C" or "Ctrl+C"
    Then the clipboard should contain "src/utils.ts:10 <selected_text>"
    
  Scenario: Clicking line number in incoming changes
    Given I am viewing a file named "src/utils.ts"
    And line 42 contains "const foo = bar"
    When I click on the line number "42" in the incoming changes column
    Then the clipboard should contain "src/utils.ts:42 const foo = bar"
    And visual feedback should indicate the copy action succeeded
    
  Scenario: Clicking line number with no content
    Given I am viewing a file with a deleted line
    When I click on a line number in the old/outgoing changes column
    Then no copy action should occur
    And only incoming changes line numbers should be clickable
```

## 4. Technical Requirements

### 4.1 Copy on Cmd+C (Selected Text)
- Intercept "copy" event or `Cmd+C` / `Ctrl+C` keystroke in the `ReviewModule`.
- Determine the start line number of the current text selection relative to the diff viewer's line rendering.
- Access the current file's path from the component state.
- Format the string as `${filename}:${lineNumber} ${selectedText}`.
- Write the formatted string to the system clipboard.
- Ensure standard copy behavior is preserved outside the review context.

### 4.2 Copy on Line Number Click (Incoming Changes)
- Add click event handlers to line numbers in the incoming changes column (new/right side of diff).
- On click, extract the line number and the full text content of that line.
- Format the string as `${filename}:${lineNumber} ${lineContent}`.
- Write the formatted string to the system clipboard using the Clipboard API.
- Provide visual feedback (e.g., brief highlight or tooltip) to confirm the copy action.
- Style line numbers to indicate they are clickable (e.g., cursor pointer on hover).
- Only enable this behavior for incoming changes (new lines), not outgoing changes (deleted lines).
