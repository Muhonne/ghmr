# Copy Filename and Line Number Specification

## 1. Feature Overview

**Feature Name:** Copy Filename and Line Number

**Feature Description:** Clicking on a line number in the new (right) side of the diff viewer copies that line's content with the filename and line number prefix to the clipboard.

**Goal:** Simplify sharing specific code context in discussions by providing quick access to copy code references.

**Status:** ✅ Implemented

**Note:** Only line numbers on the new/incoming (right) side are clickable. This makes sense because you want to reference code that will exist after the PR is merged.

## 2. System Architecture

The feature uses a `useEffect` hook to attach click event listeners to elements with the `diff-line-new-num` class after the `@git-diff-view` component renders. When a line number is clicked:
1. The line number is extracted from the clicked element
2. The parent row is found and the content from the new side is extracted
3. The formatted string `filename:line content` is written to the clipboard
4. Visual feedback (green highlight) confirms the copy

## 3. Functional Requirements

```gherkin
Feature: Click Line Number to Copy
  As a code reviewer
  I want to click on a line number to copy its content with context
  So that I can easily reference it in chat or issue trackers

  Scenario: Clicking on a new line number
    Given I am viewing a file named "src/utils.ts" in Review Mode
    When I click on line number "42" on the right (new) side
    Then the clipboard should contain "src/utils.ts:42 <line content>"
    And the line number should briefly flash green

  Scenario: Line numbers show pointer cursor
    Given I am viewing a diff in Review Mode
    When I hover over a line number on the new (right) side
    Then the cursor should change to a pointer indicating it's clickable

  Scenario: Old line numbers are not clickable
    Given I am viewing a diff in split view
    When I click on a line number on the old (left) side
    Then nothing should be copied
    And the cursor should not indicate clickability

  Scenario: Copying entire raw file
    Given I am viewing a file in Review Mode
    When I click the "Copy raw file" button
    Then the entire file content should be copied to clipboard
    And a "Copied!" confirmation should be shown
```

## 4. Technical Requirements

### 4.1 Click Handler Implementation

Implementation in `src/components/organisms/ReviewModule.tsx`:

```typescript
// Click handler for line numbers - copies filename:line content
const handleLineNumberClick = useCallback((e: Event) => {
    if (!currentFile) return;
    
    const target = e.currentTarget as HTMLElement;
    const lineNumber = target.textContent?.trim();
    
    if (!lineNumber || !/^\d+$/.test(lineNumber)) return;

    // Find the parent row and get the content from the new side
    const row = target.closest('tr');
    if (!row) return;

    const contentCell = row.querySelector('.diff-line-new-content') as HTMLElement;
    const lineContent = contentCell?.textContent || '';

    const formattedContent = `${currentFile.filename}:${lineNumber} ${lineContent.trim()}`;
    
    navigator.clipboard.writeText(formattedContent).then(() => {
        // Visual feedback - briefly change background color
        target.style.backgroundColor = '#2ea04366';
        setTimeout(() => target.style.backgroundColor = '', 300);
    });
}, [currentFile]);
```

### 4.2 Attaching Handlers After Render

```typescript
useEffect(() => {
    const container = diffContainerRef.current;
    if (!container) return;

    // Small delay to ensure the diff viewer has rendered
    const timeoutId = setTimeout(() => {
        const lineNumbers = container.querySelectorAll('.diff-line-new-num');
        lineNumbers.forEach(el => {
            el.addEventListener('click', handleLineNumberClick);
            (el as HTMLElement).style.cursor = 'pointer';
        });
    }, 100);

    return () => {
        clearTimeout(timeoutId);
        // Cleanup listeners
    };
}, [diffFile, handleLineNumberClick]);
```

### 4.3 CSS Classes Used

The `@git-diff-view/react` library uses these classes:
- `.diff-line-new-num` - Line number cell on the new (right) side
- `.diff-line-new-content` - Content cell on the new (right) side

### 4.4 Copy Raw File Button

A separate button in the header allows copying the entire raw file content:
- Fetches content from GitHub API using `octokit.rest.repos.getContent`
- Decodes base64 content and writes to clipboard
- Shows visual feedback ("Copied!") for 2 seconds
