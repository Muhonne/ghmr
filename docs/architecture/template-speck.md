# Feature Specification Template

This template outlines the standard format for feature specifications in the `docs/architecture/` directory.

## When to Create a Spec File

Spec files should be created for:
- **New features** that require detailed technical design documentation
- **Security-critical features** that need comprehensive design documentation (e.g., encryption, access control)
- **Complex integrations** that require detailed architectural decisions

**Note:** Most feature functionality should be documented in `docs/architecture.md` and `docs/frontend.md`. Spec files are reserved for features that need standalone, detailed design documentation.

## Template Structure

```markdown
# Feature Name Specification

## 1. Feature Overview

**Feature Name:** [Name]

**Feature Description:** [Brief description]

**Goal:** [What problem does this solve?]

**Status:** ✅ Implemented | ⚠️ Planned | ❌ Not Started

**Note:** [Any important context or constraints]

## 2. System Architecture

[If applicable, describe the architecture with diagrams]

## 3. Functional Requirements

[Use Gherkin syntax for user-facing features]

```gherkin
Feature: [Feature Name]
  As a [role]
  I want [capability]
  So that [benefit]

  Scenario: [Scenario Name]
    Given [precondition]
    When [action]
    Then [outcome]
```

## 4. Technical Requirements

[Implementation details, data models, API calls, etc.]
```