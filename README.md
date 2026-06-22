# Paul Live Template Editor Prototype

A self-contained browser prototype for the Live Template Editor table flow shown in the supplied screenshots and prompt.

## How To Run

Open `index.html` in a modern browser. No build step, package install, or dev server is required.

## What Is Implemented

- Enterprise table layout for `Producers > Paul Live Template Editor`
- Header metadata, Table/Preview/Logic tabs, toolbar controls, and logic filter chips
- Sticky variant-name column with activation toggles, status chips, row menus, and expandable format rows
- Grouped table columns for Activations, Targeting, Platform, Quality, and Content
- Header-pair content connectors for Headline-to-CTA and Image-to-Video
- Connector popover with disconnect/cancel actions
- Column management for content columns, preserving saved connections while hidden
- Pencil edit affordances on editable table cells
- Compact anchored edit popovers with current value, editable value, preview, validation, save, and cancel
- Macro editing for Creative name, Headline, CTA, Image, and Video
- Image and Video asset pickers with pre-saved asset options and `No asset`
- Add Variant dropdown with `Add manually` and `Generate with AI`
- Add variants modal with:
  - Required variant name validation
  - Use default values setup
  - Duplicate an existing variant setup
  - Repeatable variant blocks
  - Table insertion and success toast after creation
- Logic tab with `+ Add tier`
- Tier creation for Audience Targeting, Schedule Targeting, Geo Targeting, Weather Targeting, and Product Match
- Audience Targeting setup with source actions, segment details, Manual entry, and ID mapping popup
- Mapping validation and table Rule/Filter summary updates
- Rule cells now choose from configured Logic tiers
- Filter cells now open a value picker populated by the selected Rule's Logic settings
- Schedule Targeting now supports Dayparting with timezone, date range, presets, custom weekday/time ranges, validation, and live summaries
- The Table Targeting group now includes a Schedule column populated by Schedule Targeting rules from Logic

## Notes

The prototype is intentionally dependency-free and keeps this phase focused on content element connectors, table-cell editing, asset selection, and logic-tier setup.
