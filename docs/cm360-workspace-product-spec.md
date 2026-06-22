# CM360 Workspaces Product Spec

## Prototype placement

This CM360 Workspace prototype should be implemented as a standalone prototype in:

cm360-workspace/

It should not be implemented inside:

projects/

The standalone prototype should include its own index.html and supporting files.

The existing root prototype must remain unchanged until the final linking phase.

At the end of the build, the CM360 Workspace prototype should be linked from the existing root experience so it can be opened from the main prototype entry point.

## 1. Overview

This document defines the CM360 Workspaces prototype. The goal is to add a new Workspaces experience that lets customers configure CM360, Google Studio, and optional DV360 activation flows in a way that is consistent with the existing Workspaces environment.

The customer should be able to manage CM360 activations similarly to other channel activations, while supporting CM360-specific, Studio-specific, and DV360-specific needs.

---

## 2. Product goal

Create a new CM360 Workspaces area where customers can manage:

1. CM360 placement campaigns for rich media ads going through Google Studio to CM360.
2. CM360 placement campaigns for rich media ads going through Google Studio to CM360 and DV360.
3. CM360 placement campaigns for standard display and rich media ads trafficked directly to CM360.

The first version is a UI prototype with mock/fixture-backed data where needed. Real publishing is not required yet.

---

## 3. V1 scope

### In scope

- New CM360 Workspaces tab/area.
- Workspace list/search/create/open/edit/delete behavior, consistent with existing Workspaces.
- Account connection notification/empty state when CM360/DV360 accounts are unavailable.
- Autosave visibility.
- Campaign Blueprint setup.
- Placement Blueprint setup.
- DV360 Campaign and Line Item mapping.
- Ad Blueprint creation and configuration.
- Standard Display setup.
- Rich Media DCO setup.
- Studio Advertiser guard for Rich Media DCO.
- Audience Segment Mapping.
- Studio Profile mapping shell/configuration entry point.
- Simulated publishing flow with animated/status feedback.
- Draft, Studio Connected, Published, Failed, Paused, and Outdated Template states.
- Edit-locking rules across lifecycle states.
- Validation and publish-readiness summary.
- Fixture/mock states for key scenarios.

### Out of scope for V1

- Real publishing to Google Studio, CM360, or DV360.
- Real retry APIs.
- Real CSV import implementation.
- DV360 Insertion Order selection.
- Full backend orchestration.
- Complex Studio rules engine implementation beyond existing reusable capabilities.
- Real CM360 creative rotation changes for outdated templates, unless existing APIs already support it.

---

## 4. Conceptual hierarchy

The CM360 Workspace follows this tree:

```text
Campaign Blueprint
  - Advertiser
  - CM360 Campaign

Placement Blueprint
  - CM360 Placement(s)
  - Optional DV360 Line Item connection(s)

Ad Blueprint
  - Ad setup
  - Audience Mapping
  - Studio Profile connection/configuration
```

Recommended UI labels:

- Campaign Blueprint
- Placement Blueprint
- Ad Blueprint

Use existing Workspaces terminology if it is already strongly established and more consistent with the product.

---

## 5. Workspace management

Users must be able to:

- Create a CM360 Workspace.
- Edit a CM360 Workspace.
- Delete a CM360 Workspace.
- Search CM360 Workspaces.
- Open a CM360 Workspace.
- See the Workspace status.
- See whether a Workspace is draft, partially configured, published, failed, or locked.

The list and management experience should match existing Workspaces patterns.

### Empty state

When there are no CM360 Workspaces:

```text
No CM360 Workspaces yet
Create a Workspace to configure CM360 placements, ads, and optional DV360 mappings.
```

### Account connection state

Customers need CM360 and DV360 accounts connected to Smartly. This workflow already exists elsewhere in the product.

If no relevant accounts are identified for the company/user, show a notification or empty state:

```text
No CM360 or DV360 accounts connected
Connect your accounts to create and publish CM360 Workspaces.
```

Use the existing account connection workflow if available. If it is not available, show a placeholder CTA using existing UI conventions.

---

## 6. Layout requirements

Use the screenshot of the existing Workspace structure as the main visual reference.

### Header

The Workspace detail header should show:

- Workspace name
- Workspace status chip
- Autosave status
- Selected CM360 Advertiser
- Selected CM360 Campaign
- Validation summary or review issues action
- Primary action: Publish
- Secondary action: Duplicate
- More actions only if consistent with existing patterns

Example:

```text
Summer Launch Workspace  [Draft]
CM360 Advertiser: Nike EMEA
CM360 Campaign: Summer Launch 2026
Saved just now
[Review issues] [Publish]
```

### Left navigation or tree

Use the existing Workspace navigation pattern. A recommended structure:

```text
Campaign Blueprint       Complete
Placement Blueprint      2 issues
Ad Blueprints            Draft
Publishing               Not started
```

If nested Ad Blueprint entries are supported:

```text
Ad Blueprints
  - Homepage DCO          Studio Connected
  - ROS Static Display    Draft
```

Do not overload the tree with too much detail. Detailed configuration belongs in the main content area.

### Main content

The main content area should render the selected section:

1. Campaign Blueprint editor
2. Placement Blueprint editor
3. DV360 mapping
4. Ad Blueprint list/detail
5. Audience Segment Mapping
6. Studio Profile Configuration
7. Publishing Status

### Optional right panel

Use a right panel only if the existing product already has this pattern. Good content for a right panel:

- Validation summary
- Publish readiness
- Preview summary
- Selected entity details

---

## 7. Lifecycle states and editability

### Draft

Before publishing, the Workspace is in Draft mode.

Editable in Draft:

- Campaign Blueprint
- Placement Blueprint
- DV360 mapping
- Ad Blueprint
- Audience mapping
- Studio Profile mapping/configuration

### Studio Connected

After the Studio Profile is connected:

Editable:

- Campaign Blueprint
- Placement Blueprint
- DV360 Line Item connections

Locked:

- Ad Blueprint

Required locked-state copy:

```text
This Ad Blueprint is locked because the Studio Profile has already been connected. Duplicate the Ad Blueprint to make creative changes.
```

### Published

After publishing:

Locked:

- Campaign Blueprint
- Placement Blueprint
- Ad Blueprint

Required locked-state copy:

```text
Published Workspaces cannot be edited directly. Duplicate this setup to make changes.
```

### Outdated Template

If a selected template has updates after Studio connection or publishing:

- Show `Outdated Template` status.
- Notify the user that updating requires duplicating the Ad Blueprint.
- The duplicated Ad Blueprint should produce another Studio Profile.
- The old Studio Profile should be marked `Paused`.
- The outdated CM360 Creative rotation should be set to `No` if supported by existing APIs. If not supported, represent this as a pending/manual action.

---

## 8. Campaign Blueprint

To start a Campaign Blueprint, the customer must select:

### CM360 Advertiser

- Required.
- Dropdown.
- If the user has access to multiple advertisers, allow selection.
- If only one advertiser is available, preselect it but still show it.

### CM360 Campaign

- Required.
- Dropdown of existing campaigns under the selected CM360 Advertiser.
- Disabled until advertiser is selected.
- Use dependent dropdown behavior.

### Summary example

```text
Campaign Blueprint
Advertiser: Nike EMEA
Campaign: Summer Launch 2026
Status: Complete
```

### Validation

- CM360 Advertiser is required.
- CM360 Campaign is required.
- Campaign must belong to selected Advertiser.

---

## 9. Placement Blueprint

The customer configures CM360 Placements under the selected Campaign.

### CM360 Placement selection

- Required.
- Multi-select dropdown.
- Options come from the selected CM360 Campaign.
- Multiple CM360 Placements can be selected in the same blueprint.

### Format summary

For each selected placement, show how many formats are included. Ideally show actual format chips or a compact format list.

Example table:

```text
Placement name | Formats           | DV360 connected | Line items | Status
Homepage Hero  | 300x250, 300x600  | Yes             | 3          | Complete
Sports ROS     | 728x90            | No              | 0          | Needs mapping
```

### DV360 connection intent

For each selected CM360 Placement, the customer can decide whether the placement should connect to DV360 Line Items.

Use a toggle or existing equivalent control:

```text
Connect this placement to DV360 line items: On / Off
```

This toggle represents user intent, not system status.

### Validation

- At least one CM360 Placement is required.
- Each selected Placement must belong to the selected Campaign.
- Placement format information should be shown where available.

---

## 10. DV360 mapping

DV360 mapping is optional per CM360 Placement.

For V1, the DV360 selection model is:

```text
CM360 Placement
  -> DV360 Advertiser
  -> DV360 Campaign
  -> DV360 Line Item(s)
```

Do not include DV360 Insertion Orders in V1.

### Requirements

For each selected CM360 Placement with DV360 connection enabled:

1. Choose DV360 Advertiser.
   - Only show DV360 Advertisers connected to the selected CM360 Advertiser.

2. Choose DV360 Campaign.
   - Options depend on the selected DV360 Advertiser.

3. Choose DV360 Line Item(s).
   - Options depend on the selected DV360 Campaign.
   - Multiple Line Items can be selected per CM360 Placement.
   - Line Items from different DV360 Campaigns can be used in the same Placement Blueprint.

### Recommended table

Use one or more mapping rows per CM360 Placement:

```text
CM360 Placement | DV360 Advertiser | DV360 Campaign | DV360 Line Items              | Status
Homepage Hero   | Nike EMEA        | Summer Launch  | Movie Lovers, Sport Lovers    | Complete
Homepage Hero   | Nike EMEA        | Retargeting    | Cart Abandoners               | Complete
```

### CSV import placeholder

CSV import can be shown as a placeholder only.

Required copy:

```text
CSV import will be available once the mapping import endpoint is connected.
```

Do not fake a successful CSV import flow.

### Validation

When DV360 connection is enabled:

- DV360 Advertiser is required.
- DV360 Campaign is required.
- At least one DV360 Line Item is required.
- Row-level validation should be visible near the row.
- Placement-level validation should roll up to the validation summary.

---

## 11. Ad Blueprint overview

Customers assign creatives to the Placement Blueprint through Ad Blueprints.

Multiple Ad Blueprints can be added to the same CM360 Placement Blueprint.

It is allowed for multiple Ad Blueprints under the same CM360 Placement to use the same format.

Example allowed setup:

```text
CM360 Placement: Homepage Hero 300x600

Ad Blueprint A
- Format: 300x600
- Studio Profile: Profile A
- Feed: Product Feed A

Ad Blueprint B
- Format: 300x600
- Studio Profile: Profile B
- Feed: Product Feed B
```

Do not block duplicate formats across separate Ad Blueprints.

### Ad Blueprint table

Example:

```text
Ad Name            | Type            | Automation | Formats           | Studio Profile | Status           | Issues
Homepage DCO       | Rich Media DCO  | On         | 300x250, 300x600  | Connected      | Studio Connected | 0
ROS Static Display | Standard Display| Off        | 728x90            | Not required   | Draft            | 1
```

Selecting a row should open the existing detail pattern, such as a drawer, modal, or detail page.

### Required fields

Each Ad Blueprint includes:

- Status
- Ad Name
- Ad Automation toggle
- Producer selection when automation is on
- Optional automation settings
- Ad Type
- Creative/media source
- Landing page configuration
- URL parameter configuration
- Preview
- Validation
- Audience Segment Mapping if DV360 Line Items exist
- Studio Profile connection/configuration if Rich Media DCO is selected

---

## 12. Ad Automation

Each Ad Blueprint has an Ad Automation toggle.

### Automation on

When Ad Automation is on:

- Customer selects a Producer from a dropdown.
- Optional automation settings are available:
  - Filter
  - Sort
  - Limit number of Ads per Ad Set

Use progressive disclosure for advanced automation settings.

Example:

```text
Ad Automation: On
Producer: Summer Product Feed
Advanced settings
  - Filter
  - Sort
  - Limit number of ads
```

### Automation off

When Ad Automation is off:

- Customer is expected to upload or select a final zip bundle manually, depending on ad type.

Recommended copy:

```text
Automation is off. Upload or select the final creative bundle manually.
```

---

## 13. Ad Type selection

The customer must choose one of two ad types:

1. Standard Display
2. Rich Media DCO

Use a segmented control, card selector, or existing product pattern.

Changing Ad Type after configuration may reset incompatible fields. If data would be lost, confirm the change with a modal using existing confirmation patterns.

---

## 14. Standard Display Ad

If Standard Display is selected, the customer configures an HTML Ad.

### Media

Allow two source options:

1. From template
   - Pick an HTML template from the asset library.

2. Upload from desktop
   - Upload a final zip bundle from desktop.

### Landing Page field

This is part of the CM Creative configuration.

- Can be static.
- Can be dynamic from the Producer feed.
- Dynamic values should support macros.

### URL Parameter field

This is part of the CM Creative configuration.

- Can be static or dynamic if supported by the existing product.
- Dynamic values should support Producer feed macros.

### Preview

Show previews of creatives in the Workspace.

If filters and automation settings make multiple zip bundles eligible for the Ad Blueprint, the preview must show all compatible creative versions.

Example preview table:

```text
Creative   | Format | Source   | Landing page | URL parameters | Status
Template A | 300x250| Producer | Dynamic      | Dynamic        | Compatible
Template B | 300x600| Producer | Dynamic      | Dynamic        | Compatible
```

### Validation

Validate whether the formats available under the CM360 Placement Blueprint are compatible with formats from the Ad Blueprint.

Example copy:

```text
Format mismatch
The selected placement supports 300x250 and 300x600, but this Ad Blueprint includes 728x90.
```

---

## 15. Rich Media DCO Ad

If Rich Media DCO is selected, a Studio Profile is required.

### Studio Advertiser guard

Before allowing Rich Media DCO setup:

- Check whether a Studio Advertiser exists for the selected CM360 Advertiser.
- There is only one Studio Advertiser per CM360 Advertiser.
- If a Studio Advertiser is not found, block Rich Media DCO creation/configuration.

Required copy:

```text
No Studio Advertiser connected
A Studio Advertiser must be connected to this CM360 Advertiser before you can create a Rich Media DCO Ad Blueprint.
```

Use an existing help link or setup workflow if available. If not, show a placeholder CTA consistent with the app.

### Data Source

Known as Secondary Feed.

- Required.
- Select from available data sources.
- Filtering of the secondary feed should be considered in the design, but only implemented if dependent selection is supported by the Studio Profile API.

If dependent selection is not supported, show no unavailable behavior.

### HTML Creative

Rich Media DCO allows multiple HTML Creatives under the same Ad Blueprint.

Media source:

1. From template
   - Pick HTML templates from the asset library.

2. Upload from desktop
   - Not available for Rich Media DCO.
   - Do not show this as an enabled option.
   - If shown for consistency, disable it with explanatory copy:

```text
Desktop upload is not available for Rich Media DCO.
```

### Format uniqueness rule

Formats must be unique within a single Rich Media DCO Ad Blueprint.

Allowed:

```text
300x600 + 300x250
```

Not allowed inside the same Rich Media DCO Ad Blueprint:

```text
300x250 + 300x250
```

Required validation copy:

```text
A Rich Media DCO Ad Blueprint can only contain one HTML Creative per format. Remove one of the duplicate creatives or move it to a separate Ad Blueprint.
```

Duplicate formats across separate Ad Blueprints are allowed and should not block publishing.

### Landing Page field

Can be static or dynamic.

Static:

- CM Creative contains the static URL.
- Landing page is not a dynamic field in the zip bundle.

Dynamic:

- Value comes from Producer feed or Secondary Feed.
- Uses macro syntax.
- Zip bundle contains the dynamic element.

### URL Parameter field

Can be dynamic from Producer feed or Secondary Feed using macros.

### Preview

Show previews for each selected HTML Creative.

If filters and automation settings make multiple zip bundles eligible, show all compatible versions.

---

## 16. Audience Segment Mapping

Each DV360 Line Item represents an audience group.

Customers may need to choose which Producer feed variant is assigned to each audience. The mapping is based on Producer feed values.

Examples:

```text
DV360 Line Item "Movie Lovers" -> Producer field "Variant name" contains "Movie"
DV360 Line Item "Sport Lovers" -> Producer field "Theme" contains "Sports"
```

### Table

Use a table-first UI:

```text
DV360 Line Item | Feed field   | Condition | Value  | Matching variants | Status
Movie Lovers    | Variant name | contains  | Movie  | 24                | Complete
Sport Lovers    | Theme        | contains  | Sports | 18                | Complete
```

### Supported operators

If the product does not already have a convention, start with:

- equals
- contains
- starts with
- is not empty

### Validation

- Each selected DV360 Line Item should have a mapping or a clear incomplete state.
- Mapping field, condition, and value must be valid.
- Show matching variant count if data is available.

---

## 17. Studio Profile connection and configuration

For every Rich Media DCO Ad Blueprint, there must be a Studio Profile connection.

The Studio Profile connection is based on:

```text
Ad Blueprint = selected template(s) + selected data source
```

Once the Ad Blueprint setup is complete, Studio Profile Configuration can start.

Requirements:

- Customer can start Studio Profile mapping.
- Relevant auto-mapping from Producer and Ad Blueprint should be carried over when possible.
- Existing Studio Profile capabilities must be preserved.
- Reuse existing Studio Profile mapping UI if it exists.
- If no existing UI exists, create a structured mapping shell/table only.

Important behavior:

- Multiple Ad Blueprints can exist under the same CM360 Placement.
- One CM360 Placement can contain two 300x600 creatives from different Studio Profiles, zip bundles, or feeds.
- Do not block this scenario.

---

## 18. Publishing simulation

Real publishing is not required in V1.

The user should be able to click Publish when the Workspace is valid. Clicking Publish should start a simulated status flow that communicates the expected publishing sequence.

### Steps

1. Studio Profile connection
2. Push to CM360
3. Push to DV360, if DV360 Line Items are connected

### Statuses

Each step has an independent status:

- Not started
- Pending
- In progress
- Success
- Failed
- Skipped
- Blocked

### Example in-progress table

```text
Step                      | Target        | Status      | Last updated | Action
Studio Profile connection | Google Studio | In progress | Just now     | -
Push to CM360             | CM360         | Pending     | -            | -
Push to DV360             | DV360         | Pending     | -            | -
```

### Example completed table

```text
Step                      | Target        | Status  | Last updated | Action
Studio Profile connection | Google Studio | Success | 10:42        | View details
Push to CM360             | CM360         | Success | 10:43        | View details
Push to DV360             | DV360         | Success | 10:44        | View details
```

### Failure behavior

- If Studio Profile connection fails, CM360 and DV360 publishing should be blocked/interrupted.
- If CM360 push fails, DV360 publishing should not proceed.
- If DV360 push fails, Studio and CM360 may still be successful.

Each failed step should expose:

- Clear error message
- Retry action, simulated if needed
- Details drawer or expandable error row

### Prototype disclaimer

Only show prototype/demo disclaimers if the existing product has a development/demo pattern for that. Do not expose technical wording to production users unless necessary.

Possible demo copy:

```text
Publishing simulation
This prototype shows the expected publishing sequence. Real publishing will be connected in a later release.
```

---

## 19. Validation summary

Before enabling Publish, all blocking validations must pass.

### Account validation

- CM360 account connected.
- DV360 account connected if DV360 Line Items are used.
- Studio Advertiser connected for Rich Media DCO.

### Campaign Blueprint validation

- CM360 Advertiser selected.
- CM360 Campaign selected.

### Placement Blueprint validation

- At least one CM360 Placement selected.
- Placement belongs to selected Campaign.
- Format information exists where available.

### DV360 validation

When DV360 connection is enabled:

- DV360 Advertiser selected.
- DV360 Advertiser is connected to selected CM360 Advertiser.
- DV360 Campaign selected.
- At least one DV360 Line Item selected.
- Multiple Line Items are allowed.
- Line Items from different DV360 Campaigns are allowed.

### Ad Blueprint validation

- Ad Name required.
- Ad Type required.
- Producer required if Ad Automation is on.
- Manual upload or template required if Ad Automation is off, depending on ad type.
- Landing page configuration valid.
- URL parameter configuration valid.
- Formats from Ad Blueprint compatible with selected CM360 Placement formats.
- Rich Media DCO requires Studio Advertiser and Studio Profile configuration.
- Rich Media DCO allows multiple HTML Creatives.
- Rich Media DCO requires unique formats within the same Ad Blueprint.
- Duplicate formats across different Ad Blueprints are allowed.

### Audience Mapping validation

- Each selected DV360 Line Item should have a mapping or a clear incomplete state.
- Mapping field, condition, and value must be valid.
- Matching variant count should be shown if available.

### Publishing validation

Before Publish is enabled:

- Campaign Blueprint complete.
- Placement Blueprint complete.
- Required Ad Blueprint fields complete.
- Studio Profile configuration complete for Rich Media DCO.
- Format compatibility passes.
- Required audience mappings complete.
- No blocking errors remain.

---

## 20. Conceptual data model

Use existing project conventions where possible. This model is a functional guide, not a required exact implementation.

```ts
type WorkspaceStatus =
  | 'draft'
  | 'incomplete'
  | 'studio_connected'
  | 'publishing'
  | 'published'
  | 'failed'
  | 'locked';

type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'failed';

type CM360Workspace = {
  id: string;
  name: string;
  type: 'cm360';
  status: WorkspaceStatus;
  autosaveStatus: AutosaveStatus;
  campaignBlueprint: CampaignBlueprint;
  placementBlueprints: PlacementBlueprint[];
  adBlueprints: AdBlueprint[];
  publishingStatus: PublishingStatus;
  createdAt: string;
  updatedAt: string;
};

type CampaignBlueprint = {
  cmAdvertiserId?: string;
  cmAdvertiserName?: string;
  cmCampaignId?: string;
  cmCampaignName?: string;
  status: 'incomplete' | 'complete';
};

type PlacementBlueprint = {
  id: string;
  cmPlacementIds: string[];
  placements: CMPlacement[];
  dv360Connections: DV360Connection[];
  status: 'incomplete' | 'complete' | 'issues';
};

type CMPlacement = {
  id: string;
  name: string;
  formats: string[];
  campaignId: string;
};

type DV360Connection = {
  id: string;
  cmPlacementId: string;
  enabled: boolean;
  dvAdvertiserId?: string;
  dvCampaignId?: string;
  lineItemIds: string[];
};

type AdBlueprint = {
  id: string;
  name: string;
  status: 'draft' | 'incomplete' | 'studio_connected' | 'published' | 'failed' | 'locked' | 'paused' | 'outdated_template';
  placementBlueprintId: string;
  cmPlacementIds: string[];
  adAutomationEnabled: boolean;
  producerId?: string;
  automationSettings?: AutomationSettings;
  adType?: 'standard_display' | 'rich_media_dco';
  standardDisplayConfig?: StandardDisplayConfig;
  richMediaDcoConfig?: RichMediaDcoConfig;
  audienceMappings: AudienceMapping[];
  studioProfileConnection?: StudioProfileConnection;
  validationIssues: ValidationIssue[];
};

type AutomationSettings = {
  filter?: unknown;
  sort?: unknown;
  limitAdsPerAdSet?: number;
};

type StandardDisplayConfig = {
  mediaSource?: 'template' | 'desktop_upload';
  templateId?: string;
  uploadedBundleId?: string;
  landingPage?: FieldMapping;
  urlParameters?: FieldMapping;
  previews: CreativePreview[];
};

type RichMediaDcoConfig = {
  studioAdvertiserId?: string;
  studioProfileId?: string;
  dataSourceId?: string;
  htmlCreatives: HtmlCreative[];
  landingPage?: FieldMapping;
  urlParameters?: FieldMapping;
  previews: CreativePreview[];
};

type HtmlCreative = {
  id: string;
  templateId: string;
  format: string;
  previewUrl?: string;
};

type FieldMapping = {
  mode: 'static' | 'dynamic';
  staticValue?: string;
  source?: 'producer' | 'secondary_feed';
  field?: string;
  macro?: string;
};

type CreativePreview = {
  id: string;
  name: string;
  format: string;
  source: string;
  previewUrl?: string;
  compatibility: 'compatible' | 'mismatch' | 'unknown';
};

type AudienceMapping = {
  dvLineItemId: string;
  feedField?: string;
  operator?: 'equals' | 'contains' | 'starts_with' | 'is_not_empty';
  value?: string;
  matchingVariantCount?: number;
};

type StudioProfileConnection = {
  studioAdvertiserId?: string;
  studioProfileId?: string;
  status: 'not_started' | 'pending' | 'connected' | 'failed' | 'paused';
  errorMessage?: string;
};

type PublishingStatus = {
  studioProfile: PublishingStepStatus;
  cm360: PublishingStepStatus;
  dv360?: PublishingStepStatus;
};

type PublishingStepStatus = {
  stepId: 'studio_profile' | 'cm360' | 'dv360';
  target: 'google_studio' | 'cm360' | 'dv360';
  status: 'not_started' | 'pending' | 'in_progress' | 'success' | 'failed' | 'skipped' | 'blocked';
  lastUpdatedAt?: string;
  errorMessage?: string;
};

type ValidationIssue = {
  id: string;
  severity: 'blocking' | 'warning' | 'info';
  location: string;
  message: string;
};
```

---

## 21. Required UI and fixture states

Include or prepare fixture/demo states for:

1. No CM360/DV360 accounts connected.
2. Empty Workspaces list.
3. Workspace list with search results.
4. New draft Workspace.
5. Campaign Blueprint partially complete.
6. Placement Blueprint with multiple selected placements.
7. Placement Blueprint with DV360 disabled.
8. Placement Blueprint with DV360 enabled and multiple Line Items.
9. Standard Display Ad Blueprint using template.
10. Standard Display Ad Blueprint using desktop upload.
11. Rich Media DCO Ad Blueprint with multiple HTML Creatives.
12. Rich Media DCO blocked because no Studio Advertiser exists.
13. Format mismatch validation error.
14. Duplicate format validation error for Rich Media DCO.
15. Audience mappings complete.
16. Audience mappings incomplete.
17. Studio Profile connected.
18. Ad Blueprint locked after Studio connection.
19. Published Workspace fully locked.
20. Publishing success simulation.
21. Publishing failed at Studio step.
22. Publishing failed at CM360 step.
23. Publishing failed at DV360 step.
24. Template outdated after Studio connection.
25. Template outdated after publishing.

---

## 22. Acceptance criteria

The implementation is acceptable when:

1. CM360 Workspaces appear as a new Workspace area/tab.
2. Users can create, edit, delete, and search CM360 Workspaces consistently with existing Workspaces.
3. The Workspace detail page reflects the hierarchy: Campaign Blueprint, Placement Blueprint, Ad Blueprint, Publishing.
4. Campaign Blueprint supports CM360 Advertiser and Campaign selection.
5. Placement Blueprint supports multiple CM360 Placements.
6. Placement rows show format information where available.
7. DV360 Line Item connection can be enabled per CM360 Placement.
8. DV360 mapping uses Advertiser -> Campaign -> Line Item.
9. DV360 Insertion Order is not shown or required.
10. DV360 Advertiser options are limited to advertisers connected to the selected CM360 Advertiser.
11. Multiple DV360 Line Items can be selected per CM360 Placement.
12. DV360 Line Items from different campaigns can be selected in the same Placement Blueprint.
13. CSV import for DV360 mapping is visible as a placeholder only.
14. Ad Blueprint supports Standard Display and Rich Media DCO.
15. Ad Automation toggle behaves as user intent, not system status.
16. Standard Display supports template selection and desktop zip upload.
17. Rich Media DCO supports template selection only, not desktop upload.
18. Rich Media DCO supports multiple HTML Creatives in one Ad Blueprint.
19. Rich Media DCO enforces unique formats within the same Ad Blueprint.
20. Duplicate formats across separate Ad Blueprints are allowed.
21. Rich Media DCO is blocked if no Studio Advertiser exists for the selected CM360 Advertiser.
22. Preview areas show compatible creative versions.
23. Format compatibility between placements and Ad Blueprints is validated.
24. Audience Segment Mapping supports mapping DV360 Line Items to Producer feed fields.
25. Studio Profile connection is represented clearly.
26. Publishing is implemented as a simulated animated/status flow only.
27. Publishing shows independent statuses for Studio Profile connection, CM360 push, and DV360 push.
28. Failure states for Studio, CM360, and DV360 are available as fixtures or mock scenarios.
29. Failed publishing steps expose retry and error detail actions, even if retry is simulated.
30. Draft Workspaces are editable.
31. Ad Blueprints lock after Studio Profile connection.
32. Full Workspace locks after publishing.
33. Locked fields explain why they are locked.
34. Outdated templates are surfaced clearly.
35. Autosave state is visible.
36. UI follows existing Workspaces styling and avoids unnecessary new patterns.

---

## 23. Recommended implementation priority

```text
1. Workspace structure and navigation
2. Campaign Blueprint setup
3. Placement Blueprint setup
4. DV360 Campaign and Line Item mapping
5. Ad Blueprint creation
6. Standard Display configuration
7. Rich Media DCO configuration
8. Format validation
9. Audience Segment Mapping
10. Studio Profile connection UI
11. Simulated publishing animation/status flow
12. Locking rules after Studio connection and publishing
13. Placeholder CSV import
```

Do not spend time on:

```text
- Real publishing API integration
- Real CSV import implementation
- DV360 Insertion Order support
- Complex backend orchestration
```
