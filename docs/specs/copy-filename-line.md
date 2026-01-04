# Copy Filename and Line Number Specification

## 1. Feature Overview

**Feature Name:** Copy Filename and Line Number

**Feature Description:** When a user selects text in the code viewer and presses `Cmd+C` (or `Ctrl+C`), the clipboard content should be formatted as "filename:line <selection>" instead of just the selected text.

**Goal:** Simplify sharing specific code context in discussions by automatically including the file location.

**Status:** ⚠️ Planned

**Note:** This overrides the default copy behavior specifically within the code diff/viewer area.

## 2. System Architecture

The feature handles clipboard events within the `ReviewModule` component. It interacts with the `window.getSelection()` API to retrieve the selected text and DOM traversal to identify the corresponding line numbers.

## 3. Functional Requirements

```gherkin
Feature: Enhanced Copying
  As a reviewer
  I want to copy code with its location context
  So that I can easily reference it in chat or issue trackers

  Scenario: Copying selected text
    Given I am viewing a file named "src/utils.ts"
    And I have selected text "const foo = bar" on line 42
    When I press "Cmd+C"
    Then the clipboard should contain "src/utils.ts:42 const foo = bar"
    
  Scenario: Copying multiline selection
    Given I am viewing a file named "src/utils.ts"
    And I have selected text spanning from line 10 to 12
    When I press "Cmd+C"
    Then the clipboard should contain "src/utils.ts:10 <selected_text>"
```

## 4. Technical Requirements

- Intercept "copy" event or `Cmd+C` keystroke in the `ReviewModule`.
- Determine the start line number of the current text selection relative to the diff viewer's line rendering.
- Access the current file's path from the component state.
- Format the string as `${filename}:${lineNumber} ${selectedText}`.
- Write the formatted string to the system clipboard.
- Ensure standard copy behavior is preserved outside the review context.
