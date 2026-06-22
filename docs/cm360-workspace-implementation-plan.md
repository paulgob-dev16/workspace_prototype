# CM360 Workspaces Implementation Plan

Phase 1 should create the standalone CM360 Workspace prototype shell in:

cm360-workspace/

The first implementation should include:
- cm360-workspace/index.html
- cm360-workspace/CM360WorkspaceApp.jsx or equivalent
- cm360-workspace/cm360-workspace.css or equivalent
- fixture/data files only if needed

Do not add the prototype to projects/.

Do not modify the existing root index.html until the final linking phase unless explicitly instructed.

## How to use this plan

Use this plan with Codex one phase at a time. Do not ask Codex to build the full CM360 Workspace feature in a single task.

Recommended working model:

```text
Discover -> propose -> implement narrow slice -> verify -> summarize -> stop
```

Commit or review the diff after each accepted phase before moving to the next phase.

---

## Prompt prefix for every Codex task

Paste this at the top of every phase prompt:

```text
Read AGENTS.md and docs/cm360-workspace-product-spec.md first.

Anti-hallucination rules:
- Inspect the existing code before making changes.
- Reuse existing Workspace patterns and components.
- Do not invent APIs, routes, services, hooks, components, or data contracts.
- If something does not exist, say "not found" and create the smallest clearly named mock/adapter needed.
- Do not add new dependencies without explicit approval.
- Keep this phase narrow.
- Do not implement future phases.
- At the end, list files changed, checks run, and any assumptions.
```

---

## Phase 0: Discovery only

### Goal

Understand the existing Workspaces implementation before editing code.

### Codex prompt

```text
We are adding a CM360 Workspaces prototype. Do not edit files yet.

Read:
- AGENTS.md
- docs/cm360-workspace-product-spec.md
- the attached screenshot of the existing Workspace structure

Then inspect the existing repository and answer:

1. Where are current Workspaces implemented?
2. What routes/pages/components are used for Workspace list and detail views?
3. What table components are used?
4. What form components are used?
5. What modal/drawer/side-panel patterns are used?
6. How are status chips represented?
7. How are toggles represented?
8. How is autosave represented?
9. How are validation errors represented?
10. How are create/edit/delete/search actions currently handled?
11. Are there existing Producer, Studio Profile, CM360, DV360, asset library, or upload-related APIs/hooks/components?
12. What tests exist for Workspaces or related flows?

Important:
- Do not invent missing APIs.
- Cite exact file paths and component/function names.
- If a pattern does not exist, say "not found".
- Do not implement anything yet.

Output:
- Repository findings
- Existing patterns to reuse
- Gaps
- Recommended phased implementation plan
- Suggested files to change in Phase 1 only
```

### Acceptance criteria

- No files changed.
- Existing relevant components and file paths are identified.
- Missing APIs/components are explicitly called out as `not found`.
- Phase 1 file targets are proposed.

---

## Phase 1: Workspace shell, list, and navigation

### Goal

Add the smallest visible CM360 Workspace shell using existing Workspaces patterns.

### Scope

- Add CM360 as a new Workspace area/tab.
- Add list/search/create/delete/open behavior only if reusable from existing Workspace patterns.
- Add empty state for no CM360 Workspaces.
- Add account-connection notification/empty state if existing account state can be detected.
- Add Workspace detail shell with:
  - Header
  - Workspace status chip
  - Autosave status placeholder
  - Left tree/navigation with Campaign Blueprint, Placement Blueprint, Ad Blueprints, Publishing
  - Main content placeholder for each section

### Do not implement

- Campaign form logic
- Placement form logic
- DV360 mapping
- Ad Blueprint configuration
- Publishing simulation
- Real APIs

### Codex prompt

```text
Implement Phase 1 only: CM360 Workspace shell/list/navigation.

Use docs/cm360-workspace-product-spec.md and the Phase 0 findings.

Scope:
- Add CM360 as a new Workspace area/tab using existing Workspaces navigation patterns.
- Add list/search/create/delete/open behavior only if reusable from existing Workspace patterns.
- Add an empty state for no CM360 Workspaces.
- Add an account-connection empty/notification state if existing account connection state can be detected.
- Add a Workspace detail shell with:
  - Header
  - Workspace status chip
  - Autosave status placeholder
  - Left tree/navigation with:
    - Campaign Blueprint
    - Placement Blueprint
    - Ad Blueprints
    - Publishing
  - Main content placeholder for each section

Do not implement:
- Campaign form logic
- Placement form logic
- DV360 mapping
- Ad Blueprint configuration
- Publishing simulation
- Real APIs

Anti-hallucination rules:
- Reuse existing components where available.
- Do not create fake backend endpoints.
- If data is needed, use a clearly named fixture/mock adapter.
- Do not add new dependencies.
- Keep the diff small.

Acceptance criteria:
- User can navigate to CM360 Workspaces.
- User can see list/search/create/open shell behavior.
- Detail page shows the blueprint structure.
- UI visually matches existing Workspaces patterns.

Before finishing:
- Run relevant lint/type/test commands if available.
- Summarize files changed and checks run.
```

### Acceptance criteria

- CM360 Workspaces area is visible.
- Detail shell shows the intended blueprint hierarchy.
- No future phase features are implemented.

---

## Phase 2: Types, fixtures, adapter layer, and validation utilities

### Goal

Create a grounded domain foundation before building complex UI.

### Scope

- Add or extend types for CM360 Workspace domain objects.
- Add fixture data behind a clearly named mock/adapter layer.
- Add validation utilities.
- Add tests for validation utilities if the project has a test framework.

### Required validation utilities

- Required CM360 Advertiser.
- Required CM360 Campaign.
- At least one CM360 Placement.
- DV360 Advertiser/Campaign/Line Item requirements when DV360 is enabled.
- Ad name required.
- Ad type required.
- Producer required when automation is on.
- Rich Media DCO duplicate formats within the same Ad Blueprint.
- Placement/ad format compatibility.

### Product decisions to enforce

- DV360 flow is Advertiser -> Campaign -> Line Item.
- Do not include Insertion Order.
- Multiple DV360 Line Items per CM360 Placement are allowed.
- Line Items from different DV360 Campaigns are allowed in the same Placement Blueprint.
- Multiple Ad Blueprints can use the same format under the same CM360 Placement.
- Duplicate formats are blocked only inside one Rich Media DCO Ad Blueprint.

### Do not implement

- Full UI forms
- Publishing animation
- Real API calls
- CSV import

### Codex prompt

```text
Implement Phase 2 only: CM360 Workspace domain types, fixture data, adapter layer, and validation utilities.

Use the existing project conventions discovered in Phase 0.

Scope:
- Add/extend types for:
  - CM360 Workspace
  - Campaign Blueprint
  - Placement Blueprint
  - CM360 Placement
  - DV360 Connection
  - Ad Blueprint
  - Standard Display config
  - Rich Media DCO config
  - HTML Creative
  - Audience Mapping
  - Publishing Status
- Add fixture data behind a clearly named adapter layer.
- Add validation utilities for:
  - Required CM360 Advertiser
  - Required CM360 Campaign
  - At least one CM360 Placement
  - DV360 advertiser/campaign/line item requirements when DV360 is enabled
  - Ad name required
  - Ad type required
  - Producer required when automation is on
  - Rich Media DCO duplicate formats within the same Ad Blueprint
  - Placement/ad format compatibility
- Add tests for validation utilities if the project has a test framework.

Important product decisions:
- DV360 flow is Advertiser -> Campaign -> Line Item.
- Do not include Insertion Order.
- Multiple DV360 Line Items per CM360 Placement are allowed.
- Line Items from different DV360 Campaigns are allowed in the same Placement Blueprint.
- Multiple Ad Blueprints can use the same format under the same CM360 Placement.
- Duplicate formats are blocked only inside one Rich Media DCO Ad Blueprint.

Do not implement:
- Full UI forms
- Publishing animation
- Real API calls
- CSV import

Anti-hallucination rules:
- Do not invent backend endpoints.
- Use mock adapter functions only when real APIs are not found.
- Name mock functions clearly so they are not confused with production integrations.

Before finishing:
- Run relevant tests/checks.
- Summarize files changed, validations added, and any API gaps.
```

---

## Phase 3: Campaign Blueprint and Placement Blueprint UI

### Goal

Implement the first real setup flow: selecting CM360 Advertiser, Campaign, and Placements.

### Scope

- Campaign Blueprint form:
  - CM360 Advertiser dropdown
  - CM360 Campaign dropdown dependent on selected advertiser
  - Required validation
  - Complete/incomplete status
- Placement Blueprint UI:
  - Multi-select CM360 Placements from selected campaign
  - Table of selected placements
  - Show placement formats/counts
  - DV360 connection toggle per placement
  - Placeholder area for DV360 mapping when enabled

### Do not implement

- Full DV360 mapping
- Ad Blueprint setup
- Publishing
- CSV import
- Studio Profile configuration

### Codex prompt

```text
Implement Phase 3 only: Campaign Blueprint and Placement Blueprint UI.

Use existing form/table components and the mock/adapter layer from Phase 2.

Scope:
- Campaign Blueprint form:
  - CM360 Advertiser dropdown
  - CM360 Campaign dropdown dependent on selected advertiser
  - Required validation
  - Complete/incomplete status
- Placement Blueprint UI:
  - Multi-select CM360 Placements from selected campaign
  - Table of selected placements
  - Show placement formats/counts
  - DV360 connection toggle per placement
  - Placeholder area for DV360 mapping when enabled

Do not implement:
- Full DV360 mapping yet
- Ad Blueprint setup
- Publishing
- CSV import
- Studio Profile configuration

UX rules:
- Use tables for selected placements.
- Use chips for system status.
- Use toggles only for user intent.
- Disabled fields must explain why they are disabled.
- Keep advanced details hidden or expandable.

Acceptance criteria:
- User can select advertiser and campaign.
- User can select multiple CM360 placements.
- Each selected placement shows formats.
- User can enable/disable DV360 connection per placement.
- Validation summary updates correctly.

Before finishing:
- Add/update tests if applicable.
- Run relevant checks.
- Summarize files changed and patterns reused.
```

---

## Phase 4: DV360 Campaign and Line Item mapping

### Goal

Allow selected CM360 Placements to be mapped to DV360 Advertisers, Campaigns, and Line Items.

### Scope

- For each CM360 Placement with DV360 connection enabled, allow one or more mapping rows.
- Each mapping row supports:
  - DV360 Advertiser
  - DV360 Campaign
  - DV360 Line Item multi-select
- DV360 Advertiser options are limited to advertisers connected to the selected CM360 Advertiser.
- DV360 Campaign options depend on selected DV360 Advertiser.
- DV360 Line Item options depend on selected DV360 Campaign.
- Same CM360 Placement can have mapping rows from different DV360 Campaigns.
- CSV import placeholder only.

### Do not implement

- Real CSV import
- Insertion Orders
- Ad Blueprint UI
- Publishing

### Codex prompt

```text
Implement Phase 4 only: DV360 Campaign + Line Item mapping for selected CM360 Placements.

Scope:
- For each CM360 Placement with DV360 connection enabled, allow one or more mapping rows.
- Each mapping row should support:
  - DV360 Advertiser
  - DV360 Campaign
  - DV360 Line Item multi-select
- DV360 Advertiser options must be limited to advertisers connected to the selected CM360 Advertiser.
- DV360 Campaign options depend on selected DV360 Advertiser.
- DV360 Line Item options depend on selected DV360 Campaign.
- Allow the same CM360 Placement to have mapping rows from different DV360 Campaigns.
- Add CSV import placeholder only.

Do not implement:
- Real CSV import
- Insertion Orders
- Ad Blueprint UI
- Publishing

Required copy for CSV placeholder:
"CSV import will be available once the mapping import endpoint is connected."

Validation:
- When DV360 connection is enabled, require DV360 Advertiser, Campaign, and at least one Line Item.
- Show row-level validation.
- Show Placement Blueprint-level validation summary.

Anti-hallucination rules:
- Do not add DV360 Insertion Order.
- Do not fake working CSV import.
- Use existing select/table components.
- If no reusable multi-select exists, use the closest existing pattern and document the tradeoff.

Before finishing:
- Run relevant tests/checks.
- Summarize files changed.
```

---

## Phase 5: Ad Blueprint list and Standard Display setup

### Goal

Introduce Ad Blueprints and implement Standard Display configuration.

### Scope

- Add Ad Blueprint table under selected Placement Blueprint.
- Support multiple Ad Blueprints for the same Placement Blueprint.
- Fields:
  - Status
  - Ad Name
  - Ad Automation toggle
  - Producer dropdown when automation is on
  - Advanced automation settings placeholder/accordion
  - Ad Type selector
- Implement Standard Display configuration:
  - Media source: From template
  - Media source: Upload from desktop
  - Landing page field
  - URL parameter field
  - Preview table/grid using fixture data
- Add format compatibility validation against selected CM360 Placement formats.

### Do not implement

- Rich Media DCO details beyond selecting the type
- Studio Profile connection
- Audience Segment Mapping
- Publishing

### Codex prompt

```text
Implement Phase 5 only: Ad Blueprint list and Standard Display setup.

Scope:
- Add Ad Blueprint table under selected Placement Blueprint.
- Support creating multiple Ad Blueprints for the same Placement Blueprint.
- Fields:
  - Status
  - Ad Name
  - Ad Automation toggle
  - Producer dropdown when automation is on
  - Advanced automation settings placeholder/accordion:
    - Filter
    - Sort
    - Limit number of Ads per Ad Set
  - Ad Type selector:
    - Standard Display
    - Rich Media DCO
- Implement Standard Display configuration:
  - Media source: From template
  - Media source: Upload from desktop
  - Landing page field
  - URL parameter field
  - Preview table/grid using fixture data
- Add format compatibility validation against selected CM360 Placement formats.

Do not implement:
- Rich Media DCO details beyond selecting the type
- Studio Profile connection
- Audience Segment Mapping
- Publishing

UX rules:
- Table-first list.
- Row opens details using existing drawer/page/modal pattern.
- Previews should show all compatible versions when fixture data has multiple eligible creatives.
- Format mismatch should be explicit and blocking.

Before finishing:
- Run tests/checks.
- Summarize files changed.
```

---

## Phase 6: Rich Media DCO setup

### Goal

Implement Rich Media DCO configuration and duplicate-format validation.

### Scope

- Rich Media DCO requires Studio Advertiser.
- Check whether a Studio Advertiser exists for selected CM360 Advertiser using adapter layer.
- If no Studio Advertiser exists, block Rich Media DCO setup with clear guidance.
- Add Data Source / Secondary Feed selector.
- Add multiple HTML Creative template selection.
- Do not allow desktop upload for Rich Media DCO.
- Enforce unique formats within the same Rich Media DCO Ad Blueprint.
- Allow duplicate formats across separate Ad Blueprints.
- Add Landing Page field:
  - Static
  - Dynamic from Producer or Secondary Feed with macro
- Add URL Parameter field:
  - Dynamic from Producer or Secondary Feed with macro
- Add preview table/grid for each selected HTML Creative.

### Do not implement

- Real Studio API connection
- Publishing
- Audience mapping
- CSV import

### Codex prompt

```text
Implement Phase 6 only: Rich Media DCO Ad Blueprint configuration.

Scope:
- Rich Media DCO requires Studio Advertiser.
- Check whether a Studio Advertiser exists for the selected CM360 Advertiser using the adapter layer.
- If no Studio Advertiser exists, block Rich Media DCO setup with clear guidance.
- Add Data Source / Secondary Feed selector.
- Add multiple HTML Creative template selection.
- Do not allow desktop upload for Rich Media DCO.
- Enforce unique formats within the same Rich Media DCO Ad Blueprint.
- Allow duplicate formats across separate Ad Blueprints.
- Add Landing Page field:
  - Static
  - Dynamic from Producer or Secondary Feed with macro
- Add URL Parameter field:
  - Dynamic from Producer or Secondary Feed with macro
- Add preview table/grid for each selected HTML Creative.

Do not implement:
- Real Studio API connection
- Publishing
- Audience mapping
- CSV import

Validation:
- Studio Advertiser required.
- Data Source required.
- At least one HTML Creative required.
- Duplicate format within same Rich Media DCO Ad Blueprint is blocked.
- Duplicate format across separate Ad Blueprints is allowed.

Required validation copy:
"A Rich Media DCO Ad Blueprint can only contain one HTML Creative per format. Remove one of the duplicate creatives or move it to a separate Ad Blueprint."

Before finishing:
- Run relevant tests/checks.
- Summarize files changed.
```

---

## Phase 7: Audience Segment Mapping and Studio Profile mapping shell

### Goal

Add audience-to-feed mapping and a Studio Profile configuration entry point.

### Scope

- Audience Segment Mapping:
  - Use DV360 Line Items selected in Placement Blueprint.
  - Allow mapping each Line Item to Producer feed fields.
  - Columns: DV360 Line Item, Feed field, Condition, Value, Matching variants, Status.
  - Operators: equals, contains, starts with, is not empty.
- Studio Profile Mapping shell:
  - Rich Media DCO only.
  - Show Studio Profile connection status.
  - Reuse existing Studio Profile UI if it exists.
  - If no existing UI exists, create a minimal mapping shell/table.
  - Carry over obvious auto-mapping values from Producer/Ad Blueprint fixture data if available.

### Do not implement

- Real Studio Profile API connection
- Real Studio rules engine
- Publishing simulation

### Codex prompt

```text
Implement Phase 7 only: Audience Segment Mapping and Studio Profile mapping shell.

Scope:
- Audience Segment Mapping:
  - Use DV360 Line Items selected in Placement Blueprint.
  - Allow mapping each Line Item to Producer feed fields.
  - Table columns:
    - DV360 Line Item
    - Feed field
    - Condition
    - Value
    - Matching variants
    - Status
  - Supported operators:
    - equals
    - contains
    - starts with
    - is not empty
- Studio Profile Mapping shell:
  - For Rich Media DCO Ad Blueprints only.
  - Show Studio Profile connection status.
  - Show mapping table/shell based on existing Studio Profile UI if one exists.
  - Carry over obvious auto-mapping values from Producer/Ad Blueprint fixture data if available.

Do not implement:
- Real Studio Profile API connection
- Real Studio rules engine
- Publishing simulation

Validation:
- Each selected DV360 Line Item should have a mapping or a clear incomplete state.
- Mapping field/condition/value should validate.
- Show matching variant count when fixture data supports it.

Anti-hallucination rules:
- Reuse existing Studio Profile mapping UI if found.
- If no existing UI exists, build a minimal shell only.
- Do not invent Studio API behavior.

Before finishing:
- Run relevant tests/checks.
- Summarize files changed and API gaps.
```

---

## Phase 8: Publishing simulation and lifecycle locking

### Goal

Add simulated publishing progress and enforce editability rules.

### Scope

- Add Publish action when validation passes.
- Clicking Publish starts simulated publishing sequence.
- Show animated progress for:
  1. Studio Profile connection
  2. Push to CM360
  3. Push to DV360, if DV360 Line Items are connected
- Each step has independent status.
- Add fixture/mock scenarios for success and failures.
- Failed steps show error message, retry action, and details.
- Retry can be simulated.
- Implement lifecycle locking rules.

### Lifecycle locking

Draft:

- Everything editable.

Studio Connected:

- Campaign Blueprint editable.
- Placement Blueprint editable.
- Ad Blueprint locked.

Published:

- Campaign Blueprint locked.
- Placement Blueprint locked.
- Ad Blueprint locked.

### Required copy

```text
This Ad Blueprint is locked because the Studio Profile has already been connected. Duplicate the Ad Blueprint to make creative changes.
```

```text
Published Workspaces cannot be edited directly. Duplicate this setup to make changes.
```

### Do not implement

- Real publish APIs
- Real retry APIs
- Real CM360 rotation changes

### Codex prompt

```text
Implement Phase 8 only: simulated publishing flow and lifecycle locking.

Important:
Real publishing is not required. Do not connect to real Google Studio, CM360, or DV360 APIs.

Scope:
- Add Publish action when validation passes.
- Clicking Publish starts a simulated publishing sequence.
- Show animated progress for:
  1. Studio Profile connection
  2. Push to CM360
  3. Push to DV360, if DV360 Line Items are connected
- Each step has independent status:
  - Not started
  - Pending
  - In progress
  - Success
  - Failed
  - Skipped
  - Blocked
- Add fixture/mock scenarios for:
  - Studio success / CM360 success / DV360 success
  - Studio failure
  - CM360 failure
  - DV360 failure
- Failed steps show:
  - Error message
  - Retry action
  - Details drawer or expandable error row
- Retry can be simulated.

Lifecycle locking:
- Draft:
  - Everything editable.
- Studio Connected:
  - Campaign Blueprint editable.
  - Placement Blueprint editable.
  - Ad Blueprint locked.
- Published:
  - Campaign Blueprint locked.
  - Placement Blueprint locked.
  - Ad Blueprint locked.

Locked fields must show explanations:
- "This Ad Blueprint is locked because the Studio Profile has already been connected. Duplicate the Ad Blueprint to make creative changes."
- "Published Workspaces cannot be edited directly. Duplicate this setup to make changes."

Do not implement:
- Real publish APIs
- Real retry APIs
- Real CM360 rotation changes

Before finishing:
- Add tests for locking rules and publishing-state transitions if possible.
- Run relevant checks.
- Summarize files changed.
```

---

## Phase 9: Polish, fixture states, and cleanup

### Goal

Review the implementation against product requirements and UI principles.

### Scope

Review and improve:

- Empty states
- Loading states
- Validation summaries
- Disabled-field explanations
- Autosave visibility
- Status chip consistency
- Toggle usage
- Table density and alignment
- Accessibility labels
- Keyboard/focus behavior if existing components support it
- Error messages
- Mock/demo disclaimers
- Fixture coverage

### Required fixture states

1. No CM360/DV360 accounts connected
2. Empty Workspaces list
3. New draft Workspace
4. Campaign Blueprint partially complete
5. Placement Blueprint with multiple selected placements
6. Placement Blueprint with DV360 disabled
7. Placement Blueprint with DV360 enabled and multiple Line Items
8. Standard Display using template
9. Standard Display using desktop upload
10. Rich Media DCO with multiple HTML Creatives
11. Rich Media DCO blocked because no Studio Advertiser exists
12. Format mismatch
13. Duplicate Rich Media DCO format
14. Audience mappings complete
15. Audience mappings incomplete
16. Studio Profile connected
17. Ad Blueprint locked after Studio connection
18. Published Workspace locked
19. Publishing failed at Studio step
20. Publishing failed at CM360 step
21. Publishing failed at DV360 step
22. Template outdated after Studio connection
23. Template outdated after publishing

### Do not implement

- New feature scope
- Real publishing
- Real CSV import
- DV360 Insertion Orders

### Codex prompt

```text
Implement Phase 9 only: polish, edge states, test coverage, and cleanup.

Scope:
Review the CM360 Workspace implementation against docs/cm360-workspace-product-spec.md and AGENTS.md.

Check and improve:
- Empty states
- Loading states
- Validation summaries
- Disabled-field explanations
- Autosave visibility
- Status chip consistency
- Toggle usage
- Table density and alignment
- Accessibility labels
- Keyboard/focus behavior if existing components support it
- Error messages
- Mock/demo disclaimers
- Fixture coverage

Required fixture states:
1. No CM360/DV360 accounts connected
2. Empty Workspaces list
3. New draft Workspace
4. Campaign Blueprint partially complete
5. Placement Blueprint with multiple selected placements
6. Placement Blueprint with DV360 disabled
7. Placement Blueprint with DV360 enabled and multiple Line Items
8. Standard Display using template
9. Standard Display using desktop upload
10. Rich Media DCO with multiple HTML Creatives
11. Rich Media DCO blocked because no Studio Advertiser exists
12. Format mismatch
13. Duplicate Rich Media DCO format
14. Audience mappings complete
15. Audience mappings incomplete
16. Studio Profile connected
17. Ad Blueprint locked after Studio connection
18. Published Workspace locked
19. Publishing failed at Studio step
20. Publishing failed at CM360 step
21. Publishing failed at DV360 step
22. Template outdated after Studio connection
23. Template outdated after publishing

Do not add new feature scope.

Before finishing:
- Run lint/type/tests.
- Provide final summary:
  - What is implemented
  - What is mocked
  - What is still backend-dependent
  - Known UX/product gaps
```

---

## Review checklist after each phase

Before accepting a Codex diff, check:

- Did it implement only the requested phase?
- Did it reuse existing Workspace components?
- Did it invent any backend APIs?
- Did it add mock data directly inside UI components?
- Did it add unnecessary dependencies?
- Did it introduce new styling patterns unnecessarily?
- Are status chips used only for system state?
- Are toggles used only for user intent?
- Are disabled or locked fields explained?
- Are validations close to the affected field or row?
- Are tests/checks included or explicitly explained?

---

## Suggested commit structure

```text
phase-0-discovery-notes
phase-1-cm360-workspace-shell
phase-2-cm360-domain-validation-fixtures
phase-3-campaign-placement-blueprints
phase-4-dv360-campaign-line-item-mapping
phase-5-ad-blueprints-standard-display
phase-6-rich-media-dco
phase-7-audience-studio-mapping-shell
phase-8-publishing-simulation-locking
phase-9-polish-fixtures-cleanup
```

---

## Final implementation principle

The prototype should make the end-to-end workflow understandable, usable, and visually consistent with existing Workspaces, even when backend actions are mocked or represented as placeholders.

Prioritize:

```text
Useful workflow > complete backend integration
Existing patterns > new UI invention
Clear validation > silent failure
Phase discipline > broad implementation
```
