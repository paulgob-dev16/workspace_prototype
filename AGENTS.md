# AGENTS.md

## CM360 Workspace prototype location

The CM360 Workspace prototype must be created in a separate standalone folder at the project root:

cm360-workspace/

Do not build this prototype inside the existing projects/ folder.

Do not replace the existing root index.html, PrototypeApp.jsx, or PrototypeApp.css.

The existing root prototype should remain intact.

At the end of the build, add a clear link from the existing root index.html or existing prototype launcher to:

cm360-workspace/index.html

Only add that link in the final linking/polish phase unless explicitly instructed earlier.

## Purpose

This repository contains an existing Workspaces product. We are adding a CM360 Workspaces prototype for managing CM360, Google Studio, and optional DV360 activation flows.

Before making any implementation changes, read:

- `docs/cm360-workspace-product-spec.md`
- `docs/cm360-workspace-implementation-plan.md`
- Any screenshot or design reference provided in the Codex task

This file contains stable rules that apply to every Codex task in this repo.

---

## Core operating rule

Do not hallucinate.

Before using or modifying any route, component, hook, service, API, store, type, or design pattern, inspect the repository and confirm that it exists.

If something is not found, say `not found` in the task summary and create the smallest clearly named mock, fixture, or adapter needed for the current phase. Do not pretend that missing production APIs exist.

---

## Product context

The new feature is a CM360 Workspaces experience. It should let users configure a workspace hierarchy:

```text
Campaign Blueprint
  - CM360 Advertiser
  - CM360 Campaign

Placement Blueprint
  - CM360 Placement(s)
  - Optional DV360 Campaign and Line Item mapping

Ad Blueprint
  - Ad setup
  - Audience mapping
  - Studio Profile connection/configuration for Rich Media DCO
```

The UI must remain consistent with the existing Workspaces environment. Reuse existing patterns for list pages, detail pages, navigation, tables, forms, drawers, modals, chips, toggles, empty states, autosave indicators, validation summaries, and publishing/status feedback.

---

## UI and UX principles

### 1. Clarity over cleverness

- Prioritize immediate comprehension.
- Avoid hidden behavior or magic states.
- Complex logic must be visible through labels, structure, helper text, or status rows.

### 2. Enterprise analytics tone

- The interface should feel professional, calm, structured, and data-centric.
- Avoid playful, overly stylized, or decorative patterns.
- Use color only for functional meaning such as status, emphasis, validation, or risk.

### 3. Reduce cognitive load

- Minimize visible decisions at any one time.
- Use progressive disclosure for advanced settings.
- Group related controls logically.
- Avoid redundant labels, duplicate chips, and repeated status signals.

### 4. Consistency over novelty

- Reuse existing components and interaction patterns.
- Do not introduce a new UI paradigm for isolated cases.
- Similar concepts must behave consistently across the feature.

### 5. Tables as the primary interface

Use tables for managing complex entities, including:

- Workspaces
- Selected CM360 placements
- DV360 mappings
- Ad Blueprints
- Creative previews
- Audience segment mappings
- Studio Profile mappings
- Publishing steps

Use row expansion, drawers, or detail panels for nested detail when appropriate.

### 6. Chips and status indicators

Chips represent system state, for example:

- Draft
- Incomplete
- Complete
- Studio Connected
- Published
- Failed
- Blocked
- Paused
- Outdated Template

Rules:

- Chips must be concise and single-line.
- Do not create multi-line or wrapped chips.
- Do not place duplicate chips that communicate the same state.
- Each chip should communicate one concept only.

### 7. Toggles versus state labels

- Toggles represent user intent, such as `Ad Automation On/Off` or `Connect to DV360 On/Off`.
- Labels and chips represent system state, such as `Published`, `Failed`, or `Studio Connected`.
- Do not use toggles as status indicators.

### 8. Information hierarchy

Show the most important signals first:

- Workspace status
- Validation issues
- Publish readiness
- Account connection state
- Selected advertiser and campaign
- Selected placement count
- Creative count
- Publishing status

Secondary configuration details should be visually de-emphasized or nested.

### 9. Autosave visibility

CM360 Workspaces autosave. The user must always be able to infer save state.

Use existing autosave patterns when available. Example states:

- Saving...
- Saved just now
- Save failed

### 10. Disabled and locked states

Do not silently disable controls.

Every disabled or locked field must explain why it is unavailable. Example:

```text
This Ad Blueprint is locked because the Studio Profile has already been connected. Duplicate the Ad Blueprint to make creative changes.
```

### 11. Accessibility

- Use clear field labels.
- Keep validation messages near the relevant field or row.
- Preserve keyboard and focus behavior from existing components.
- Do not rely on color alone to communicate state.

---

## Engineering rules

### Inspect first

Every implementation phase must begin by inspecting the current code. Identify exact files, components, hooks, services, and conventions to reuse.

### Keep phases narrow

Do only the phase requested. Do not implement future phases early.

### Reuse existing patterns

Prefer existing project components over new ones. This includes:

- Tables
- Selects and multi-selects
- Forms
- Validation messages
- Status chips
- Toggles
- Drawers/modals
- Navigation/tree views
- Empty states
- Upload components
- Asset selectors
- Autosave indicators
- Test utilities

### Do not invent APIs

Real publishing is not part of V1. Do not create production-looking integrations that imply real Google Studio, CM360, or DV360 publishing exists.

If backend support is missing, use a clearly named adapter or fixture layer. Good examples:

```ts
cm360WorkspaceMockAdapter.getAdvertisers()
cm360WorkspaceMockAdapter.getCampaigns(advertiserId)
cm360WorkspaceMockAdapter.getPlacements(campaignId)
cm360WorkspaceMockAdapter.getConnectedDv360Advertisers(cmAdvertiserId)
cm360WorkspaceMockAdapter.getDv360Campaigns(dvAdvertiserId)
cm360WorkspaceMockAdapter.getDv360LineItems(params)
cm360WorkspaceMockAdapter.getStudioAdvertiser(cmAdvertiserId)
cm360WorkspaceMockAdapter.simulatePublishing(workspaceId)
cm360WorkspaceMockAdapter.retryPublishingStep(workspaceId, stepId)
```

Bad examples:

```ts
cm360Api.publishWorkspace()
studioProfileService.connectRealProfile()
dv360Api.pushLineItems()
```

Do not use names that make mock behavior look like production behavior.

### Dependencies

Do not add new production dependencies unless explicitly approved in the task.

### Data and fixtures

- Keep fixtures separate from UI components.
- Do not hardcode demo data directly inside page components.
- Make mock-only behavior obvious in naming and task summaries.

### Tests and checks

When the project has relevant tooling, add or update tests for:

- Validation utilities
- Edit locking rules
- Publishing status transitions
- Duplicate format rules
- Format compatibility rules

Before finishing a phase, run relevant checks if available, such as:

- Typecheck
- Lint
- Unit tests
- Component tests

If checks fail, explain whether the failure is related to the current changes.

---

## Non-negotiable product decisions

- Real publishing is not required in V1.
- Publishing should be represented as a simulated animated/status flow.
- CSV import is a placeholder only.
- DV360 selection is Advertiser -> Campaign -> Line Item.
- Do not include DV360 Insertion Orders in V1.
- A CM360 Placement can connect to multiple DV360 Line Items.
- A CM360 Placement can connect to Line Items from different DV360 Campaigns.
- Multiple Ad Blueprints can exist under the same CM360 Placement.
- Multiple Ad Blueprints under the same CM360 Placement may use the same format.
- Duplicate formats are blocked only within a single Rich Media DCO Ad Blueprint.
- Duplicate formats across separate Ad Blueprints are allowed.
- Rich Media DCO requires a Studio Advertiser connected to the selected CM360 Advertiser.
- Rich Media DCO allows multiple HTML Creatives under one Ad Blueprint, but each format must be unique within that Ad Blueprint.
- Standard Display supports template selection and desktop zip upload.
- Rich Media DCO supports template selection only; desktop upload is unavailable.
- After Studio Profile connection, the Ad Blueprint is locked.
- After publishing, Campaign, Placement, and Ad Blueprints are locked.
- Locked items should be changed through duplication, not direct editing.

---

## Expected Codex task summary

At the end of every task, provide:

```text
Summary
- What changed
- Files changed
- Existing patterns reused
- Mock-only behavior added
- Tests/checks run
- Known gaps or follow-ups
```

If a requirement could not be implemented because a dependency, API, or component was not found, state that explicitly.
