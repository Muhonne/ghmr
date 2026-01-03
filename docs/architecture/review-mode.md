# Review Mode Specification

## 1. Feature Overview

**Feature Name:** Review Mode

**Feature Description:** An immersive, keyboard-centric interface for reviewing Pull Request changes, offering side-by-side diffs and progress tracking.

**Goal:** To enable developers to review code changes efficiently without leaving the application, mirroring the speed and utility of native desktop tools.

**Status:** ✅ Implemented

**Note:** Designed for high-speed navigation using keyboard shortcuts.

## 2. System Architecture

- **ReactDiffViewer**: Used for rendering split-view diffs with syntax highlighting.
- **State Management**: Tracks "viewed" status of files locally during the session.
- **Electron**: Handles global keyboard shortcuts (where applicable) or app-level event listeners for navigation.

## 3. Functional Requirements

### File Navigation
- **Navigate Next/Prev**: Users can move between files using `Arrow Down/Up` or `J/K`.
- **Mark as Viewed**: Pressing `Enter` or `Space` marks the current file as viewed and automatically advances to the next unviewed file.
- **Unmark/Back**: Pressing `Backspace` unmarks the current file (or previous if current is top of stack) and moves selection back.
- **Exit**: `Esc` key returns the user to the PR list or main dashboard.

### Visual Feedback
- **Progress Bar**: A visual indicator shows the percentage of files reviewed in the current PR.
- **Syntax Highlighting**: Code changes are displayed with appropriate language-specific coloring.
- **Side-by-Side View**: Changes are shown in a split pane comparison.

## 4. Technical Requirements
- The diff viewer must support large files without significant performance lag.
- Keyboard event listeners must be unbound when leaving the component to prevent memory leaks and unintended actions.
