(function () {
  const fixtures = window.cm360WorkspacePrototypeFixtures || { workspaces: [] };
  const adapter = window.cm360WorkspacePrototypeAdapter || null;
  const validation = window.cm360WorkspacePrototypeValidation || null;
  const root = document.getElementById("cm360WorkspaceApp");

  function cloneWorkspace(workspace) {
    return JSON.parse(JSON.stringify(workspace));
  }

  function getPrototypeWorkspaces() {
    if (adapter && typeof adapter.getPrototypeWorkspaces === "function") {
      return adapter.getPrototypeWorkspaces();
    }
    return (fixtures.workspaces || []).map(cloneWorkspace);
  }

  const initialWorkspaces = getPrototypeWorkspaces();

  const state = {
    view: "list",
    workspaces: initialWorkspaces,
    search: "",
    selectedWorkspaceId: initialWorkspaces[0] ? initialWorkspaces[0].id : "",
    selectedNode: { type: "campaign" },
    expandedNodes: new Set(["campaign"]),
    createOpen: false,
    createName: "",
    createError: "",
    toast: "",
    toastTimer: 0,
    autosaveText: "Saved just now",
    autosaveTimer: 0,
    publishingTimers: [],
  };

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function chip(label, style) {
    return `<span class="chip ${escapeHtml(style || "gray")}">${escapeHtml(label)}</span>`;
  }

  function refreshWorkspaces() {
    if (adapter && typeof adapter.getPrototypeWorkspaces === "function") {
      state.workspaces = adapter.getPrototypeWorkspaces();
    }
  }

  function currentWorkspace() {
    return state.workspaces.find((workspace) => workspace.id === state.selectedWorkspaceId) || state.workspaces[0] || null;
  }

  function placementCount(workspace) {
    return (workspace.placementsTree || []).length;
  }

  function adBlueprintCount(workspace) {
    return (workspace.placementsTree || []).reduce((total, placement) => total + (placement.adBlueprints || []).length, 0);
  }

  function nodeKey(type, id) {
    return id ? `${type}:${id}` : type;
  }

  function statusStyle(status, fallback) {
    if (fallback) return fallback;
    const normalized = String(status || "").toLowerCase();
    if (normalized === "complete" || normalized === "published") return "green";
    if (normalized === "studio connected") return "blue";
    if (normalized === "failed" || normalized.includes("issue")) return "red";
    if (normalized === "needs setup") return "yellow";
    return "gray";
  }

  function readableStatus(value, fallback) {
    const status = typeof value === "object" && value ? value.label || value.status : value;
    if (!status) return fallback || "Not started";
    return String(status)
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function formatSummary(value, fallback) {
    if (Array.isArray(value)) return value.length ? value.join(", ") : fallback;
    return value || fallback;
  }

  function referenceData() {
    if (adapter && typeof adapter.getPrototypeReferenceData === "function") {
      return adapter.getPrototypeReferenceData();
    }
    return {
      accountState: fixtures.accountState || {},
      cm360Advertisers: fixtures.cm360Advertisers || [],
      cm360Campaigns: fixtures.cm360Campaigns || [],
      cm360Placements: fixtures.cm360Placements || [],
    };
  }

  function getAdvertisers() {
    if (adapter && typeof adapter.getPrototypeCm360Advertisers === "function") {
      return adapter.getPrototypeCm360Advertisers();
    }
    return (fixtures.cm360Advertisers || []).filter((advertiser) => advertiser.id !== "cmadv-unselected");
  }

  function getCampaigns(cmAdvertiserId) {
    if (!cmAdvertiserId) return [];
    if (adapter && typeof adapter.getPrototypeCm360Campaigns === "function") {
      return adapter.getPrototypeCm360Campaigns(cmAdvertiserId);
    }
    return (fixtures.cm360Campaigns || []).filter((campaign) => campaign.advertiserId === cmAdvertiserId);
  }

  function getPlacements(cmCampaignId) {
    if (!cmCampaignId) return [];
    if (adapter && typeof adapter.getPrototypeCm360Placements === "function") {
      return adapter.getPrototypeCm360Placements(cmCampaignId);
    }
    return (fixtures.cm360Placements || []).filter((placement) => placement.campaignId === cmCampaignId);
  }

  function getDvAdvertisers(cmAdvertiserId) {
    if (!cmAdvertiserId) return [];
    if (adapter && typeof adapter.getPrototypeConnectedDv360Advertisers === "function") {
      return adapter.getPrototypeConnectedDv360Advertisers(cmAdvertiserId);
    }
    return (fixtures.dv360Advertisers || []).filter((advertiser) => (advertiser.connectedCmAdvertiserIds || []).includes(cmAdvertiserId));
  }

  function getDvCampaigns(dvAdvertiserId) {
    if (!dvAdvertiserId) return [];
    if (adapter && typeof adapter.getPrototypeDv360Campaigns === "function") {
      return adapter.getPrototypeDv360Campaigns(dvAdvertiserId);
    }
    return (fixtures.dv360Campaigns || []).filter((campaign) => campaign.advertiserId === dvAdvertiserId);
  }

  function getDvLineItems(dvCampaignId) {
    if (!dvCampaignId) return [];
    if (adapter && typeof adapter.getPrototypeDv360LineItems === "function") {
      return adapter.getPrototypeDv360LineItems(dvCampaignId);
    }
    return (fixtures.dv360LineItems || []).filter((lineItem) => lineItem.campaignId === dvCampaignId);
  }

  function getProducers() {
    if (adapter && typeof adapter.getPrototypeProducers === "function") {
      return adapter.getPrototypeProducers();
    }
    return fixtures.producers || [];
  }

  function getProducerFeedFields() {
    if (adapter && typeof adapter.getPrototypeProducerFeedFields === "function") {
      return adapter.getPrototypeProducerFeedFields();
    }
    return fixtures.producerFeedFields || [];
  }

  function getProducerVariants() {
    if (adapter && typeof adapter.getPrototypeProducerVariants === "function") {
      return adapter.getPrototypeProducerVariants();
    }
    return fixtures.producerVariants || [];
  }

  function getAudienceMappingSuggestions() {
    if (adapter && typeof adapter.getPrototypeAudienceMappingSuggestions === "function") {
      return adapter.getPrototypeAudienceMappingSuggestions();
    }
    return fixtures.audienceMappingSuggestions || [];
  }

  function getStudioProfileMappingRows(adBlueprint) {
    if (adBlueprint.studioProfileMappings?.length) return adBlueprint.studioProfileMappings;
    if (adapter && typeof adapter.getPrototypeStudioProfileMappings === "function") {
      return adapter.getPrototypeStudioProfileMappings();
    }
    return fixtures.studioProfileMappings || [];
  }

  function getStandardDisplayTemplates() {
    if (adapter && typeof adapter.getPrototypeStandardDisplayTemplates === "function") {
      return adapter.getPrototypeStandardDisplayTemplates();
    }
    return (fixtures.creativeTemplates || []).filter((template) => template.type === "standard_display");
  }

  function getRichMediaDcoTemplates() {
    if (adapter && typeof adapter.getPrototypeRichMediaDcoTemplates === "function") {
      return adapter.getPrototypeRichMediaDcoTemplates();
    }
    return (fixtures.creativeTemplates || []).filter((template) => template.type === "rich_media_dco");
  }

  function getDataSources() {
    if (adapter && typeof adapter.getPrototypeDataSources === "function") {
      return adapter.getPrototypeDataSources();
    }
    return fixtures.dataSources || [];
  }

  function getStudioAdvertiser(cmAdvertiserId) {
    if (!cmAdvertiserId) return null;
    if (adapter && typeof adapter.getPrototypeStudioAdvertiser === "function") {
      return adapter.getPrototypeStudioAdvertiser(cmAdvertiserId);
    }
    return (fixtures.studioAdvertisers || []).find((advertiser) => advertiser.cmAdvertiserId === cmAdvertiserId) || null;
  }

  function getStudioAdvertisers(cmAdvertiserId) {
    if (!cmAdvertiserId) return [];
    if (adapter && typeof adapter.getPrototypeStudioAdvertisers === "function") {
      return adapter.getPrototypeStudioAdvertisers(cmAdvertiserId);
    }
    return (fixtures.studioAdvertisers || []).filter((advertiser) => advertiser.cmAdvertiserId === cmAdvertiserId);
  }

  function getStudioCampaigns(studioAdvertiserId) {
    if (!studioAdvertiserId) return [];
    if (adapter && typeof adapter.getPrototypeStudioCampaigns === "function") {
      return adapter.getPrototypeStudioCampaigns(studioAdvertiserId);
    }
    return (fixtures.studioCampaigns || []).filter((campaign) => campaign.studioAdvertiserId === studioAdvertiserId);
  }

  function selectedCmPlacementIds(workspace) {
    return new Set((workspace.placementsTree || []).map((placement) => placement.cmPlacementId));
  }

  function issuesFor(workspace, locations) {
    if (!validation || typeof validation.validatePrototypeWorkspace !== "function") return [];
    const wanted = new Set(locations);
    return validation.validatePrototypeWorkspace(workspace, referenceData()).filter((issue) => wanted.has(issue.location));
  }

  function dv360IssuesForPlacement(workspace, placement) {
    if (!validation || typeof validation.validatePrototypeDv360 !== "function") return [];
    const rowIds = new Set((placement.dv360Connections || []).map((connection) => connection.id));
    const setupIssues = validation.validatePrototypeDv360(workspace, referenceData()).filter((issue) => {
      if (issue.id === `dv-row-required-${placement.id}`) return true;
      return Array.from(rowIds).some((rowId) => issue.id.includes(rowId));
    });
    const accountIssues =
      validation.validatePrototypeAccounts && typeof validation.validatePrototypeAccounts === "function"
        ? validation.validatePrototypeAccounts(workspace, referenceData()).filter((issue) => issue.placementId === placement.id)
        : [];
    return [...accountIssues, ...setupIssues];
  }

  function issuesForAdBlueprint(workspace, placement, adBlueprint) {
    if (!validation || typeof validation.validatePrototypeAdBlueprints !== "function") return [];
    const allowedIds = new Set([
      `ad-name-${adBlueprint.id}`,
      `ad-type-${adBlueprint.id}`,
      `ad-producer-${adBlueprint.id}`,
      `standard-media-${adBlueprint.id}`,
      `dco-studio-${adBlueprint.id}`,
      `dco-studio-advertiser-flow-${adBlueprint.id}`,
      `dco-studio-campaign-${adBlueprint.id}`,
      `dco-studio-campaign-flow-${adBlueprint.id}`,
      `dco-html-${adBlueprint.id}`,
      `dco-duplicate-formats-${adBlueprint.id}`,
    ]);
    const adIssues = validation.validatePrototypeAdBlueprints(workspace, referenceData()).filter((issue) => {
      if (allowedIds.has(issue.id)) return true;
      return issue.id.startsWith(`ad-format-${adBlueprint.id}-`);
    });
    return adIssues;
  }

  function issuesForAudienceMapping(workspace, adBlueprint) {
    if (!validation || typeof validation.validatePrototypeAudienceMappings !== "function") return [];
    return validation.validatePrototypeAudienceMappings(workspace, referenceData()).filter((issue) => issue.id.includes(adBlueprint.id));
  }

  function workspaceValidationIssues(workspace) {
    if (!workspace || !validation || typeof validation.validatePrototypeWorkspace !== "function") return [];
    return validation.validatePrototypeWorkspace(workspace, referenceData());
  }

  function issueCounts(workspace) {
    const issues = workspaceValidationIssues(workspace);
    return {
      all: issues.length,
      blocking: issues.filter((issue) => issue.severity === "blocking").length,
      warning: issues.filter((issue) => issue.severity === "warning").length,
    };
  }

  function hasDv360LineItems(workspace) {
    return (workspace.placementsTree || []).some((placement) =>
      (placement.dv360Connections || []).some((connection) => connection.enabled && (connection.lineItemIds || []).length)
    );
  }

  function isPublishingInProgress(workspace) {
    return String(workspace?.publishingStatus?.status || "").toLowerCase() === "in_progress";
  }

  function completedPlacementCount(workspace) {
    if (!workspace) return 0;
    return (workspace.placementsTree || []).filter((placement) => {
      if (!placement.cmPlacementId) return false;
      return dv360IssuesForPlacement(workspace, placement).length === 0;
    }).length;
  }

  function completedAdBlueprintCount(workspace) {
    if (!workspace) return 0;
    return (workspace.placementsTree || []).reduce(
      (total, placement) => total + (placement.adBlueprints || []).filter((adBlueprint) => issuesForAdBlueprint(workspace, placement, adBlueprint).length === 0).length,
      0
    );
  }

  function publishingReadiness(workspace) {
    const counts = issueCounts(workspace);
    const completedPlacements = completedPlacementCount(workspace);
    const completedAds = completedAdBlueprintCount(workspace);
    const setupComplete = completedPlacements > 0 && completedAds > 0;
    return {
      ready: Boolean(workspace && counts.all === 0 && setupComplete && !isWorkspaceLocked(workspace) && !isPublishingInProgress(workspace)),
      setupComplete,
      completedPlacements,
      completedAds,
      issues: counts.all,
    };
  }

  function issueChip(workspace) {
    const counts = issueCounts(workspace);
    if (counts.blocking) return chip(`${counts.blocking} issue${counts.blocking === 1 ? "" : "s"}`, "red");
    if (counts.warning) return chip(`${counts.warning} warning${counts.warning === 1 ? "" : "s"}`, "yellow");
    return chip("No issues", "green");
  }

  function renderIssueList(issues, emptyText) {
    if (!issues.length) {
      return emptyText ? `<div class="issue-list empty"><span>${escapeHtml(emptyText)}</span></div>` : "";
    }
    return `
      <div class="issue-list" role="status">
        ${issues
          .slice(0, 5)
          .map(
            (issue) => `
              <div class="issue-row ${escapeHtml(issue.severity || "warning")}">
                <div>
                  <span>${escapeHtml(issue.location || "Workspace")}</span>
                  <strong>${escapeHtml(issue.message)}</strong>
                </div>
                ${
                  issue.placementId
                    ? `<button class="text-button issue-action" type="button" data-action="open-issue-placement" data-placement-id="${escapeHtml(issue.placementId)}">Open Placement</button>`
                    : ""
                }
              </div>
            `
          )
          .join("")}
        ${issues.length > 5 ? `<div class="issue-more">${issues.length - 5} more review item${issues.length - 5 === 1 ? "" : "s"}</div>` : ""}
      </div>
    `;
  }

  function isWorkspaceLocked(workspace) {
    return String(workspace?.status || "").toLowerCase() === "published";
  }

  function isAdBlueprintLocked(workspace, adBlueprint) {
    return isWorkspaceLocked(workspace) || adBlueprint?.studioProfileConnection?.status === "connected";
  }

  function renderLockNotice(message) {
    if (!message) return "";
    return `
      <div class="lock-notice" role="status">
        <strong>Locked</strong>
        <span>${escapeHtml(message)}</span>
      </div>
    `;
  }

  function adBlueprintLockMessage(workspace, adBlueprint) {
    if (isWorkspaceLocked(workspace)) return "This Workspace is published. Duplicate the setup to make changes.";
    if (adBlueprint?.studioProfileConnection?.status === "connected") {
      return "This Ad Blueprint is locked because the Studio Profile has already been connected. Duplicate the Ad Blueprint to make creative changes.";
    }
    return "";
  }

  function renderOptions(items, selectedId, placeholder) {
    return [
      `<option value="">${escapeHtml(placeholder)}</option>`,
      ...items.map((item) => `<option value="${escapeHtml(item.id)}" ${item.id === selectedId ? "selected" : ""}>${escapeHtml(item.name)}</option>`),
    ].join("");
  }

  function renderTemplateOptions(items, selectedId, placeholder, placementFormats) {
    const formats = Array.isArray(placementFormats) ? placementFormats : [];
    return [
      `<option value="">${escapeHtml(placeholder)}</option>`,
      ...items.map((item) => {
        const compatible = !formats.length || formats.includes(item.format);
        const label = compatible ? item.name : `${item.name} - Not supported by selected placement`;
        return `<option value="${escapeHtml(item.id)}" ${item.id === selectedId && compatible ? "selected" : ""} ${compatible ? "" : "disabled"}>${escapeHtml(label)}</option>`;
      }),
    ].join("");
  }

  function renderFormatOptions(formats, selectedFormat, placeholder) {
    return [
      `<option value="">${escapeHtml(placeholder)}</option>`,
      ...(formats || []).map((format) => `<option value="${escapeHtml(format)}" ${format === selectedFormat ? "selected" : ""}>${escapeHtml(format)}</option>`),
    ].join("");
  }

  function renderMultiOptions(items, selectedIds) {
    const selected = new Set(selectedIds || []);
    return items.map((item) => `<option value="${escapeHtml(item.id)}" ${selected.has(item.id) ? "selected" : ""}>${escapeHtml(item.name)}</option>`).join("");
  }

  function renderValidationList(issues, emptyText) {
    if (!issues.length && !emptyText) return "";
    return `
      <div class="validation-list ${issues.length ? "has-issues" : ""}" role="status">
        ${
          issues.length
            ? issues.map((issue) => `<div class="validation-item">${escapeHtml(issue.message)}</div>`).join("")
            : `<div class="validation-item muted">${escapeHtml(emptyText)}</div>`
        }
      </div>
    `;
  }

  function renderFormatChips(formats) {
    const values = Array.isArray(formats) ? formats : [];
    if (!values.length) return '<span class="muted-text">Format data not available</span>';
    return `<div class="format-chip-list">${values.map((format) => chip(format, "gray")).join("")}</div>`;
  }

  function dv360RowState(workspace, row) {
    const dvAdvertisers = getDvAdvertisers(workspace.cmAdvertiserId);
    const advertiserValid = Boolean(dvAdvertisers.find((advertiser) => advertiser.id === row.dvAdvertiserId));
    const campaigns = getDvCampaigns(row.dvAdvertiserId);
    const campaignValid = Boolean(campaigns.find((campaign) => campaign.id === row.dvCampaignId));
    const lineItems = getDvLineItems(row.dvCampaignId);
    const lineItemsValid = (row.lineItemIds || []).every((lineItemId) => lineItems.some((lineItem) => lineItem.id === lineItemId));
    if ((row.dvAdvertiserId && !advertiserValid) || (row.dvCampaignId && !campaignValid) || !lineItemsValid) {
      return { label: "Invalid", style: "red" };
    }
    if (!row.dvAdvertiserId || !row.dvCampaignId || !(row.lineItemIds || []).length) {
      return { label: "Needs setup", style: "yellow" };
    }
    return { label: "Complete", style: "green" };
  }

  function dv360PlacementState(workspace, placement) {
    if (!placement.dv360Enabled) return { label: "Not connected", style: "gray" };
    const rows = placement.dv360Connections || [];
    if (!rows.length) return { label: "Needs setup", style: "yellow" };
    const states = rows.map((row) => dv360RowState(workspace, row));
    if (states.some((stateItem) => stateItem.label === "Invalid")) return { label: "Invalid", style: "red" };
    if (states.some((stateItem) => stateItem.label === "Needs setup")) return { label: "Needs setup", style: "yellow" };
    return { label: "Connected", style: "green" };
  }

  function selectedLineItemNames(row) {
    const lineItems = getDvLineItems(row.dvCampaignId);
    return (row.lineItemIds || [])
      .map((lineItemId) => lineItems.find((lineItem) => lineItem.id === lineItemId)?.name)
      .filter(Boolean);
  }

  function selectedDv360LineItemsForPlacement(placement) {
    const lineItemIds = (placement.dv360Connections || []).flatMap((connection) => (connection.enabled ? connection.lineItemIds || [] : []));
    const uniqueIds = [...new Set(lineItemIds)];
    return uniqueIds
      .map((lineItemId) => {
        const reference = referenceData();
        const lineItem = (reference.dv360LineItems || []).find((item) => item.id === lineItemId);
        const campaign = (reference.dv360Campaigns || []).find((item) => item.id === lineItem?.campaignId);
        return lineItem ? { ...lineItem, campaignName: campaign?.name || "" } : null;
      })
      .filter(Boolean);
  }

  function adTypeLabel(value) {
    if (value === "standard_display") return "Standard Display";
    if (value === "rich_media_dco") return "Rich Media DCO";
    return "Not selected";
  }

  function creativeSourceLabel(adBlueprint) {
    if (adBlueprint.adType === "rich_media_dco") {
      const count = adBlueprint.richMediaDcoConfig?.htmlCreatives?.length || 0;
      return count ? `${count} HTML Creative${count === 1 ? "" : "s"}` : "Not selected";
    }
    const config = adBlueprint.standardDisplayConfig || {};
    if (config.mediaSource === "upload") return config.uploadedBundleName || "Desktop upload";
    if (config.templateId) return getStandardDisplayTemplates().find((template) => template.id === config.templateId)?.name || "Template";
    return "Not selected";
  }

  function adBlueprintState(workspace, placement, adBlueprint) {
    const issues = issuesForAdBlueprint(workspace, placement, adBlueprint);
    if (issues.some((issue) => issue.id.startsWith(`ad-format-${adBlueprint.id}-`))) return { label: "Invalid", style: "red" };
    if (issues.length) return { label: "Needs setup", style: "yellow" };
    if (adBlueprint.status) return { label: adBlueprint.status, style: adBlueprint.statusStyle || statusStyle(adBlueprint.status) };
    return { label: "Draft", style: "gray" };
  }

  function renderAdFormatMismatch(workspace, placement, adBlueprint) {
    const issues = issuesForAdBlueprint(workspace, placement, adBlueprint).filter((issue) => issue.id.startsWith(`ad-format-${adBlueprint.id}-`));
    if (!issues.length) return "";
    const placementFormats = formatSummary(placement.formats, "no formats");
    const adFormats = formatSummary(adBlueprint.selectedFormats, "no formats");
    return `
      <div class="validation-list has-issues" role="alert">
        <div class="validation-item">Format mismatch. The selected placement supports ${escapeHtml(placementFormats)}, but this Ad Blueprint includes ${escapeHtml(adFormats)}.</div>
      </div>
    `;
  }

  function standardDisplayPreviewRows(placement, adBlueprint) {
    const config = adBlueprint.standardDisplayConfig || {};
    if (adBlueprint.adType !== "standard_display") return [];
    if (config.mediaSource === "template") {
      const selectedTemplate = getStandardDisplayTemplates().find((template) => template.id === config.templateId);
      const templates = selectedTemplate ? [selectedTemplate] : getStandardDisplayTemplates().filter((template) => (placement.formats || []).includes(template.format));
      return templates.map((template) => ({
        id: template.id,
        creative: template.name,
        format: template.format,
        source: "Template",
        landingPage: config.landingPageValue || "Not set",
        urlParameters: config.urlParameterValue || "Not set",
        status: (placement.formats || []).includes(template.format) ? "Compatible" : "Mismatch",
      }));
    }
    const format = config.uploadedFormat || (adBlueprint.selectedFormats || [])[0] || "";
    return [
      {
        id: "prototype-upload",
        creative: config.uploadedBundleName || "Prototype desktop bundle",
        format,
        source: "Desktop upload",
        landingPage: config.landingPageValue || "Not set",
        urlParameters: config.urlParameterValue || "Not set",
        status: (placement.formats || []).includes(format) ? "Compatible" : "Mismatch",
      },
    ];
  }

  function selectedDcoTemplateIds(adBlueprint) {
    return (adBlueprint.richMediaDcoConfig?.htmlCreatives || []).map((creative) => creative.templateId).filter(Boolean);
  }

  function dcoTemplateName(templateId) {
    return getRichMediaDcoTemplates().find((template) => template.id === templateId)?.name || "HTML Creative";
  }

  function richMediaDcoPreviewRows(placement, adBlueprint) {
    const config = adBlueprint.richMediaDcoConfig || {};
    return (config.htmlCreatives || []).map((creative) => {
      const template = getRichMediaDcoTemplates().find((item) => item.id === creative.templateId);
      const format = creative.format || template?.format || "";
      return {
        id: creative.id || creative.templateId,
        creative: template?.name || dcoTemplateName(creative.templateId),
        format,
        landingPage: config.landingPageValue || "Not set",
        urlParameters: config.urlParameterValue || "Not set",
        status: (placement.formats || []).includes(format) ? "Compatible" : "Mismatch",
      };
    });
  }

  function audienceMappingFor(adBlueprint, lineItemId) {
    return (adBlueprint.audienceMappings || []).find((mapping) => mapping.dvLineItemId === lineItemId) || {
      dvLineItemId: lineItemId,
      feedField: "",
      operator: "",
      value: "",
    };
  }

  function audienceSuggestionFor(lineItemId) {
    return getAudienceMappingSuggestions().find((suggestion) => suggestion.lineItemId === lineItemId) || null;
  }

  function audienceMatchCount(mapping) {
    const variants = getProducerVariants();
    if (!mapping.feedField || !mapping.operator) return 0;
    return variants.filter((variant) => {
      const rawValue = variant[mapping.feedField];
      const actual = String(rawValue || "").toLowerCase();
      const expected = String(mapping.value || "").toLowerCase();
      if (mapping.operator === "is_not_empty") return Boolean(rawValue);
      if (!expected) return false;
      if (mapping.operator === "equals") return actual === expected;
      if (mapping.operator === "contains") return actual.includes(expected);
      if (mapping.operator === "starts_with") return actual.startsWith(expected);
      return false;
    }).length;
  }

  function audienceMappingState(mapping) {
    if (!mapping.feedField || !mapping.operator || (!mapping.value && mapping.operator !== "is_not_empty")) return { label: "Needs setup", style: "yellow" };
    if (!["equals", "contains", "starts_with", "is_not_empty"].includes(mapping.operator)) return { label: "Invalid", style: "red" };
    if (!audienceMatchCount(mapping)) return { label: "No matches", style: "red" };
    return { label: "Complete", style: "green" };
  }

  function studioMappingState(rows, adBlueprint) {
    if (adBlueprint.adType !== "rich_media_dco") return { label: "Not required", style: "gray" };
    const config = adBlueprint.richMediaDcoConfig || {};
    if (!config.studioAdvertiserId || !config.studioCampaignId || !(config.htmlCreatives || []).length) return { label: "Needs setup", style: "yellow" };
    if (rows.some((row) => row.status === "Missing")) return { label: "Missing", style: "red" };
    if (rows.some((row) => row.status === "Needs review")) return { label: "Needs review", style: "yellow" };
    return { label: "Complete", style: "green" };
  }

  function setAutosaveSaving() {
    state.autosaveText = "Saving...";
    window.clearTimeout(state.autosaveTimer);
    state.autosaveTimer = window.setTimeout(() => {
      state.autosaveText = "Saved just now";
      refreshWorkspaces();
      render();
    }, 650);
  }

  function syncSelectedNode(workspace) {
    if (!workspace || state.selectedNode.type === "campaign") return;
    const placement = findPlacement(workspace, state.selectedNode.placementId);
    if (!placement) {
      state.selectedNode = { type: "campaign" };
      return;
    }
    if (state.selectedNode.type === "ad" && !findAdBlueprint(workspace, state.selectedNode.placementId, state.selectedNode.adBlueprintId)) {
      state.selectedNode = { type: "campaign" };
    }
  }

  function campaignRootLabel(workspace) {
    if (workspace.campaignBlueprint?.name) return workspace.campaignBlueprint.name;
    if (workspace.campaign && !workspace.campaign.toLowerCase().includes("not selected")) return workspace.campaign;
    return "Campaign Blueprint";
  }

  function findPlacement(workspace, placementId) {
    return (workspace.placementsTree || []).find((placement) => placement.id === placementId) || null;
  }

  function findAdBlueprint(workspace, placementId, adBlueprintId) {
    const placement = findPlacement(workspace, placementId);
    return placement ? (placement.adBlueprints || []).find((adBlueprint) => adBlueprint.id === adBlueprintId) || null : null;
  }

  function selectedNodeDetails(workspace) {
    const selected = state.selectedNode || { type: "campaign" };
    if (selected.type === "placement") {
      const placement = findPlacement(workspace, selected.placementId);
      if (placement) return { type: "placement", item: placement };
    }
    if (selected.type === "ad") {
      const placement = findPlacement(workspace, selected.placementId);
      const adBlueprint = findAdBlueprint(workspace, selected.placementId, selected.adBlueprintId);
      if (placement && adBlueprint) return { type: "ad", item: adBlueprint, placement };
    }
    return { type: "campaign", item: workspace.campaignBlueprint || {} };
  }

  function filteredWorkspaces() {
    const query = state.search.trim().toLowerCase();
    if (!query) return state.workspaces;
    return state.workspaces.filter((workspace) =>
      [workspace.name, workspace.status, workspace.advertiser, workspace.campaign, workspace.owner]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }

  function showToast(message) {
    state.toast = message;
    window.clearTimeout(state.toastTimer);
    state.toastTimer = window.setTimeout(() => {
      state.toast = "";
      render();
    }, 2400);
  }

  function renderShell(content) {
    const workspace = state.view === "detail" ? currentWorkspace() : null;
    const counts = issueCounts(workspace);
    const reviewLabel = workspace ? `Review issues ${counts.all ? counts.all : ""}` : "Review issues";
    const readiness = publishingReadiness(workspace);
    return `
      <div class="cm-app">
        <header class="topbar">
          <div class="brand-mark" aria-hidden="true">CM</div>
          <div class="topbar-copy">
            <div class="breadcrumb">
              <button class="crumb-button" type="button" data-action="show-list">Workspaces</button>
              <span aria-hidden="true">></span>
              <strong>${state.view === "detail" && currentWorkspace() ? escapeHtml(currentWorkspace().name) : "CM360 Workspaces"}</strong>
            </div>
            <div class="sync-line">${escapeHtml(state.autosaveText)}</div>
          </div>
          <div class="topbar-actions">
            <button class="icon-button" type="button" aria-label="More actions">...</button>
            <button class="secondary-button" type="button" disabled title="${workspace ? "Validation details are shown in the preview panel." : "Open a Workspace to review validation details."}">
              ${escapeHtml(reviewLabel.trim())}
            </button>
            <button class="primary-button" type="button" data-action="start-publishing" ${readiness.ready ? "" : "disabled"} title="${readiness.ready ? "Start local publishing simulation." : "Complete Placement and Ad Blueprint setup before publishing."}">Publish</button>
          </div>
        </header>
        <div class="commandbar" aria-label="Workspace commands">
          <button class="command-button" type="button" data-action="open-create">Create</button>
          <button class="command-button" type="button" disabled>Edit</button>
          <button class="command-button" type="button" disabled>Duplicate</button>
          <button class="command-button" type="button" disabled>Filter</button>
        </div>
        ${content}
        ${state.createOpen ? renderCreateModal() : ""}
        <div class="toast ${state.toast ? "show" : ""}" role="status" aria-live="polite">${escapeHtml(state.toast)}</div>
      </div>
    `;
  }

  function renderAccountNotice() {
    const notice = fixtures.accountNotice;
    if (!notice) return "";
    return `
      <section class="notice-band" aria-label="Account connection notice">
        <div>
          <strong>${escapeHtml(notice.title)}</strong>
          <span>${escapeHtml(notice.body)}</span>
        </div>
        <button class="secondary-button" type="button" disabled>${escapeHtml(notice.action)}</button>
      </section>
    `;
  }

  function renderListView() {
    const rows = filteredWorkspaces();
    return renderShell(`
      <main class="list-layout">
        <section class="list-header">
          <div>
            <div class="eyebrow">CM360 activation setup</div>
            <h1>CM360 Workspaces</h1>
            <p>Manage workspace drafts for CM360 placements, ads, and optional DV360 mappings.</p>
          </div>
          <button class="primary-button" type="button" data-action="open-create">Create Workspace</button>
        </section>
        ${renderAccountNotice()}
        <section class="toolbar-band" aria-label="Workspace search">
          <div class="toolbar-status">${rows.length} workspace${rows.length === 1 ? "" : "s"}</div>
          <label class="search-field">
            <span>Search</span>
            <input id="workspaceSearch" type="search" value="${escapeHtml(state.search)}" placeholder="Search CM360 Workspaces" />
          </label>
        </section>
        <section class="table-shell" aria-label="CM360 Workspace list">
          <table>
            <thead>
              <tr>
                <th style="width: 28%">Workspace</th>
                <th style="width: 13%">Status</th>
                <th style="width: 18%">CM360 Advertiser</th>
                <th style="width: 18%">CM360 Campaign</th>
                <th style="width: 10%">Issues</th>
                <th style="width: 13%">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${rows.length ? rows.map(renderWorkspaceRow).join("") : renderEmptyRows()}
            </tbody>
          </table>
        </section>
      </main>
    `);
  }

  function renderWorkspaceRow(workspace) {
    return `
      <tr>
        <td>
          <span class="workspace-name">${escapeHtml(workspace.name)}</span>
          <span class="workspace-sub">${escapeHtml(workspace.updatedAt)} - ${escapeHtml(workspace.owner)}</span>
        </td>
        <td>${chip(workspace.status, workspace.statusStyle)}</td>
        <td><span class="truncate">${escapeHtml(workspace.advertiser)}</span></td>
        <td><span class="truncate">${escapeHtml(workspace.campaign)}</span></td>
        <td>${issueChip(workspace)}</td>
        <td>
          <div class="row-actions">
            <button class="text-button" type="button" data-action="open-workspace" data-id="${escapeHtml(workspace.id)}">Open</button>
            <button class="text-button danger" type="button" data-action="delete-workspace" data-id="${escapeHtml(workspace.id)}">Delete</button>
          </div>
        </td>
      </tr>
    `;
  }

  function renderEmptyRows() {
    const title = state.workspaces.length ? "No CM360 Workspaces match current search" : "No CM360 Workspaces yet";
    const body = state.workspaces.length
      ? "Clear search or create a Workspace to continue."
      : "Create a Workspace to configure CM360 placements, ads, and optional DV360 mappings.";
    return `
      <tr class="empty-row">
        <td colspan="6">
          <div class="empty-state">
            <strong>${escapeHtml(title)}</strong>
            <span>${escapeHtml(body)}</span>
            <button class="primary-button" type="button" data-action="open-create">Create Workspace</button>
          </div>
        </td>
      </tr>
    `;
  }

  function renderDetailView() {
    const workspace = currentWorkspace();
    if (!workspace) {
      state.view = "list";
      return renderListView();
    }
    syncSelectedNode(workspace);
    const issues = workspaceValidationIssues(workspace);
    const counts = issueCounts(workspace);

    return renderShell(`
      <main class="detail-layout">
        <aside class="workspace-tree" aria-label="Workspace navigation">
          <div class="filter-block">
            <div class="filter-title">By published status</div>
            <div class="status-filters" aria-label="Published status filters">
              <button class="status-filter active" type="button">Draft</button>
              <button class="status-filter" type="button" disabled>Active</button>
              <button class="status-filter" type="button" disabled>Paused</button>
              <button class="status-filter" type="button" disabled>Archived</button>
            </div>
          </div>
          <div class="select-row">
            <span>Select:</span>
            <button class="pill-button active" type="button">Entities ${1 + placementCount(workspace) + adBlueprintCount(workspace)}</button>
          </div>
          <div class="tree-list">
            ${renderWorkspaceTree(workspace)}
          </div>
        </aside>
        <section class="detail-main">
          ${renderWorkspaceHeader(workspace)}
          ${renderSelectedNodeCard(workspace)}
          ${renderPublishingCard(workspace)}
        </section>
        <aside class="right-panel" aria-label="Workspace preview and issues">
          <div class="panel-title">Workspace preview</div>
          <div class="issue-summary ${counts.blocking ? "has-issues" : ""}">
            <strong>${counts.blocking ? `${counts.blocking} blocking issue${counts.blocking === 1 ? "" : "s"}` : counts.warning ? `${counts.warning} warning${counts.warning === 1 ? "" : "s"}` : "No current validation issues"}</strong>
            <span>${counts.blocking ? "Resolve blocking items before simulated publishing." : counts.warning ? "Warnings should be reviewed before handoff." : "Campaign, Placement, and Ad Blueprint setup pass prototype validation."}</span>
          </div>
          <div class="preview-card">
            <div class="preview-card-head">
              <strong>${escapeHtml(workspace.name)}</strong>
            </div>
            <dl>
              <div><dt>Advertiser</dt><dd>${escapeHtml(workspace.advertiser)}</dd></div>
              <div><dt>Campaign</dt><dd>${escapeHtml(workspace.campaign)}</dd></div>
              <div><dt>Placements</dt><dd>${placementCount(workspace)} selected</dd></div>
              <div><dt>Ad Blueprints</dt><dd>${adBlueprintCount(workspace)}</dd></div>
            </dl>
          </div>
          <div class="panel-section">
            <div class="panel-title">Validation summary</div>
            ${renderIssueList(issues, "No validation items found in the local prototype rules.")}
          </div>
        </aside>
      </main>
    `);
  }

  function renderWorkspaceHeader(workspace) {
    const counts = issueCounts(workspace);
    const locked = isWorkspaceLocked(workspace);
    const readiness = publishingReadiness(workspace);
    return `
      <section class="workspace-detail-header">
        <div>
          <div class="title-line">
            <h1>${escapeHtml(workspace.name)}</h1>
            ${chip(workspace.status, workspace.statusStyle)}
          </div>
          <div class="meta-grid">
            <span>Autosave: ${escapeHtml(workspace.updatedAt)}</span>
            <span>CM360 Advertiser: ${escapeHtml(workspace.advertiser)}</span>
            <span>CM360 Campaign: ${escapeHtml(workspace.campaign)}</span>
            <span>Validation: ${counts.blocking ? `${counts.blocking} blocking` : counts.warning ? `${counts.warning} warning${counts.warning === 1 ? "" : "s"}` : "Ready in prototype"}</span>
            ${locked ? "<span>Editing: Locked after publish</span>" : "<span>Editing: Draft controls available</span>"}
          </div>
        </div>
        <div class="header-actions">
          <button class="secondary-button" type="button" data-action="show-list">Back to list</button>
          <button class="secondary-button" type="button" disabled>Duplicate</button>
          <button class="primary-button" type="button" data-action="start-publishing" ${readiness.ready ? "" : "disabled"} title="${readiness.ready ? "Start local publishing simulation." : "Complete Placement and Ad Blueprint setup before publishing."}">Publish</button>
        </div>
      </section>
    `;
  }

  function renderWorkspaceTree(workspace) {
    const campaignExpanded = state.expandedNodes.has("campaign");
    const placements = workspace.placementsTree || [];
    return `
      <div class="tree-branch">
        ${renderTreeNode({
          type: "campaign",
          id: "campaign",
          label: campaignRootLabel(workspace),
          sublabel: "Campaign",
          status: workspace.campaignBlueprint?.status || "Needs setup",
          statusStyle: workspace.campaignBlueprint?.statusStyle,
          expandable: true,
          expanded: campaignExpanded,
          level: 0,
          selectAction: "select-node",
          toggleAction: "toggle-node",
        })}
        ${
          campaignExpanded
            ? placements.length
              ? placements.map((placement) => renderPlacementBranch(placement)).join("")
              : '<div class="tree-empty level-1">No placements added</div>'
            : ""
        }
      </div>
    `;
  }

  function renderPlacementBranch(placement) {
    const key = nodeKey("placement", placement.id);
    const expanded = state.expandedNodes.has(key);
    const adBlueprints = placement.adBlueprints || [];
    return `
      <div class="tree-branch">
        ${renderTreeNode({
          type: "placement",
          id: placement.id,
          label: placement.name,
          sublabel: "Placement",
          status: placement.status,
          statusStyle: placement.statusStyle,
          expandable: true,
          expanded,
          level: 1,
          selectAction: "select-node",
          toggleAction: "toggle-node",
        })}
        ${
          expanded
            ? adBlueprints.length
              ? adBlueprints.map((adBlueprint) => renderAdNode(placement, adBlueprint)).join("")
              : '<div class="tree-empty level-2">No Ad Blueprints added</div>'
            : ""
        }
      </div>
    `;
  }

  function renderAdNode(placement, adBlueprint) {
    return renderTreeNode({
      type: "ad",
      id: adBlueprint.id,
      placementId: placement.id,
      label: adBlueprint.name,
      sublabel: "Ad Blueprint",
      status: adBlueprint.status,
      statusStyle: adBlueprint.statusStyle,
      expandable: false,
      expanded: false,
      level: 2,
      selectAction: "select-node",
    });
  }

  function renderTreeNode(node) {
    const selected = state.selectedNode || { type: "campaign" };
    const isActive =
      selected.type === node.type &&
      (node.type === "campaign" ||
        (node.type === "placement" && selected.placementId === node.id) ||
        (node.type === "ad" && selected.placementId === node.placementId && selected.adBlueprintId === node.id));
    const key = node.type === "campaign" ? "campaign" : nodeKey(node.type, node.id);
    const nodePayload = node.type === "ad" ? `${node.placementId}:${node.id}` : node.id;
    return `
      <div class="tree-node level-${node.level} ${isActive ? "active" : ""}">
        ${
          node.expandable
            ? `<button class="tree-toggle" type="button" data-action="${escapeHtml(node.toggleAction)}" data-node-key="${escapeHtml(key)}" aria-label="${node.expanded ? "Collapse" : "Expand"} ${escapeHtml(node.label)}">${node.expanded ? "v" : ">"}</button>`
            : '<span class="tree-toggle-spacer"></span>'
        }
        <button class="tree-select" type="button" data-action="${escapeHtml(node.selectAction)}" data-node-type="${escapeHtml(node.type)}" data-node-id="${escapeHtml(nodePayload)}">
          <span class="tree-icon" aria-hidden="true"></span>
          <span class="tree-copy">
            <strong>${escapeHtml(node.label)}</strong>
            <span>${escapeHtml(node.sublabel)}</span>
          </span>
          ${chip(node.status, statusStyle(node.status, node.statusStyle))}
        </button>
      </div>
    `;
  }

  function renderSelectedNodeCard(workspace) {
    const details = selectedNodeDetails(workspace);
    if (details.type === "placement") return renderPlacementCard(workspace, details.item);
    if (details.type === "ad") return renderAdBlueprintCard(details.item, details.placement);
    return `${renderCampaignCard(workspace)}${renderPlacementCard(workspace, null)}`;
  }

  function renderCampaignCard(workspace) {
    const campaign = workspace.campaignBlueprint || {};
    const advertisers = getAdvertisers();
    const campaigns = getCampaigns(workspace.cmAdvertiserId);
    const campaignDisabled = !workspace.cmAdvertiserId;
    const campaignIssues = issuesFor(workspace, ["Campaign"]);
    const configured = Boolean(workspace.cmAdvertiserId && workspace.cmCampaignId);
    const locked = isWorkspaceLocked(workspace);
    return `
      <section class="content-card">
        <header class="card-head">
          <div>
            <h2>Campaign Blueprint</h2>
            <p>Select the CM360 Advertiser and CM360 Campaign for this Workspace.</p>
          </div>
          ${chip(campaign.status || "Needs setup", campaign.statusStyle)}
        </header>
        <div class="form-panel">
          ${renderLockNotice(locked ? "This Workspace is published. Duplicate the setup to change the Campaign Blueprint." : "")}
          <fieldset class="lock-fieldset" ${locked ? "disabled" : ""}>
            <div class="form-grid">
              <label class="field">
                <span>CM360 Advertiser</span>
                <select id="cmAdvertiserSelect" data-action="select-advertiser">
                  ${renderOptions(advertisers, workspace.cmAdvertiserId, "Select advertiser")}
                </select>
              </label>
              <label class="field">
                <span>CM360 Campaign</span>
                <select id="cmCampaignSelect" data-action="select-campaign" ${campaignDisabled ? "disabled" : ""}>
                  ${renderOptions(campaigns, workspace.cmCampaignId, campaignDisabled ? "Select advertiser first" : "Select campaign")}
                </select>
                <small>${campaignDisabled ? "Select a CM360 Advertiser before choosing a campaign." : "Campaign options are filtered by the selected advertiser."}</small>
              </label>
            </div>
            ${renderValidationList(campaignIssues, configured ? "Campaign Blueprint is configured." : "")}
            ${
              configured
                ? `<div class="summary-strip">
                    <div><span>Selected advertiser</span><strong>${escapeHtml(workspace.advertiser)}</strong></div>
                    <div><span>Selected campaign</span><strong>${escapeHtml(workspace.campaign)}</strong></div>
                    <div><span>Placements</span><strong>${placementCount(workspace)} selected</strong></div>
                  </div>`
                : ""
            }
          </fieldset>
        </div>
      </section>
    `;
  }

  function renderPlacementCard(workspace, selectedPlacement) {
    const availablePlacements = getPlacements(workspace.cmCampaignId);
    const selectedIds = selectedCmPlacementIds(workspace);
    const placementIssues = issuesFor(workspace, ["Placement"]);
    const title = selectedPlacement ? `Placement Blueprint: ${selectedPlacement.name}` : "Placement Blueprint";
    const status = selectedPlacement?.status || (placementCount(workspace) ? "Draft" : "Needs setup");
    const statusColor = selectedPlacement?.statusStyle || (placementCount(workspace) ? "gray" : "yellow");
    const disabled = !workspace.cmCampaignId;
    const locked = isWorkspaceLocked(workspace);
    return `
      <section class="content-card">
        <header class="card-head">
          <div>
            <h2>${escapeHtml(title)}</h2>
            <p>${disabled ? "Select a CM360 Campaign before adding placements." : "Choose the CM360 Placements that belong under this Campaign."}</p>
          </div>
          ${chip(status, statusColor)}
        </header>
        <div class="form-panel">
          ${renderLockNotice(locked ? "This Workspace is published. Duplicate the setup to change placements or Ad Blueprints." : "")}
          <fieldset class="lock-fieldset" ${locked ? "disabled" : ""}>
            <div class="checkbox-panel ${disabled ? "disabled" : ""}" aria-label="CM360 Placement selection">
              ${
                disabled
                  ? '<div class="disabled-note">Select a CM360 Campaign before adding placements.</div>'
                  : availablePlacements
                      .map(
                        (placement) => `
                          <label class="checkbox-row">
                            <input type="checkbox" data-action="toggle-placement" value="${escapeHtml(placement.id)}" ${selectedIds.has(placement.id) ? "checked" : ""} />
                            <span>
                              <strong>${escapeHtml(placement.name)}</strong>
                              <em>${escapeHtml((placement.formats || []).length)} format${(placement.formats || []).length === 1 ? "" : "s"}</em>
                            </span>
                            ${renderFormatChips(placement.formats)}
                          </label>
                        `
                      )
                      .join("")
              }
            </div>
            ${renderValidationList(placementIssues, placementCount(workspace) ? "Selected placements belong to the current CM360 Campaign." : "")}
            ${renderSelectedPlacementsTable(workspace)}
            ${selectedPlacement ? renderDv360MappingPanel(workspace, selectedPlacement) : renderCsvImportPlaceholder()}
            ${selectedPlacement ? renderAdBlueprintTable(workspace, selectedPlacement) : ""}
          </fieldset>
        </div>
      </section>
    `;
  }

  function renderSelectedPlacementsTable(workspace) {
    const placements = workspace.placementsTree || [];
    if (!workspace.cmCampaignId) {
      return `
        <div class="table-empty">
          <strong>No campaign selected</strong>
          <span>Select a CM360 Campaign before adding placements.</span>
        </div>
      `;
    }
    if (!placements.length) {
      return `
        <div class="table-empty">
          <strong>No placements selected</strong>
          <span>Select one or more CM360 Placements to add them under the Campaign node.</span>
        </div>
      `;
    }
    return `
      <div class="inline-table-shell">
        <table class="compact-table">
          <thead>
            <tr>
              <th style="width: 28%">Placement</th>
              <th style="width: 24%">Formats</th>
              <th style="width: 17%">DV360 connected</th>
              <th style="width: 14%">Ad Blueprints</th>
              <th style="width: 11%">Status</th>
              <th style="width: 6%"> </th>
            </tr>
          </thead>
          <tbody>
            ${placements
              .map(
                (placement) => `
                  <tr>
                    <td>
                      <span class="workspace-name">${escapeHtml(placement.name)}</span>
                      <span class="workspace-sub">${escapeHtml(placement.cmPlacementId)}</span>
                    </td>
                    <td>
                      ${renderFormatChips(placement.formats)}
                      <span class="workspace-sub">${(placement.formats || []).length} format${(placement.formats || []).length === 1 ? "" : "s"}</span>
                    </td>
                    <td>${(() => {
                      const stateItem = dv360PlacementState(workspace, placement);
                      return chip(stateItem.label, stateItem.style);
                    })()}</td>
                    <td>${(placement.adBlueprints || []).length}</td>
                    <td>${chip(placement.status, placement.statusStyle)}</td>
                    <td><button class="text-button danger" type="button" data-action="remove-placement" data-id="${escapeHtml(placement.cmPlacementId)}">Remove</button></td>
                  </tr>
                `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderDv360MappingPanel(workspace, placement) {
    const stateItem = dv360PlacementState(workspace, placement);
    const issues = dv360IssuesForPlacement(workspace, placement);
    return `
      <section class="subsection-panel" aria-label="DV360 mapping">
        <div class="subsection-head">
          <div>
            <h3>DV360 mapping</h3>
            <p>Connect this CM360 Placement to DV360 Line Items when media activation needs DV360 audiences.</p>
          </div>
          ${chip(stateItem.label, stateItem.style)}
        </div>
        <div class="placement-summary-grid">
          <div>
            <span>Placement</span>
            <strong>${escapeHtml(placement.name)}</strong>
          </div>
          <div>
            <span>Formats</span>
            <strong>${escapeHtml(formatSummary(placement.formats, "Format data not available"))}</strong>
          </div>
          <div>
            <span>Mapping rows</span>
            <strong>${(placement.dv360Connections || []).length}</strong>
          </div>
        </div>
        <div class="toggle-row">
          <div>
            <strong>Connect to DV360</strong>
            <span>Toggle on to map DV360 Advertisers, Campaigns, and Line Items for this placement.</span>
          </div>
          <label class="switch-control">
            <input type="checkbox" data-action="toggle-dv360-enabled" data-placement-id="${escapeHtml(placement.id)}" ${placement.dv360Enabled ? "checked" : ""} />
            <span>${placement.dv360Enabled ? "On" : "Off"}</span>
          </label>
        </div>
        ${
          placement.dv360Enabled
            ? `${renderDv360MappingTable(workspace, placement)}${renderValidationList(issues, issues.length ? "" : "DV360 mapping rows are complete for this placement.")}`
            : '<div class="table-empty"><strong>Not connected</strong><span>DV360 fields are not required while this placement is Off.</span></div>'
        }
        ${renderCsvImportPlaceholder()}
      </section>
    `;
  }

  function renderDv360MappingTable(workspace, placement) {
    const rows = placement.dv360Connections || [];
    const addButton = `<button class="secondary-button" type="button" data-action="add-dv360-row" data-placement-id="${escapeHtml(placement.id)}">Add mapping row</button>`;
    if (!rows.length) {
      return `
        <div class="subsection-actions">${addButton}</div>
        <div class="table-empty">
          <strong>No DV360 mapping rows</strong>
          <span>Add a row to select DV360 Advertiser, Campaign, and Line Items.</span>
        </div>
      `;
    }
    return `
      <div class="subsection-actions">${addButton}</div>
      <div class="inline-table-shell">
        <table class="compact-table dv360-table">
          <thead>
            <tr>
              <th style="width: 18%">CM360 Placement</th>
              <th style="width: 19%">DV360 Advertiser</th>
              <th style="width: 19%">DV360 Campaign</th>
              <th style="width: 24%">DV360 Line Items</th>
              <th style="width: 10%">Status</th>
              <th style="width: 10%">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map((row) => renderDv360MappingRow(workspace, placement, row)).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderDv360MappingRow(workspace, placement, row) {
    const advertisers = getDvAdvertisers(workspace.cmAdvertiserId);
    const campaigns = getDvCampaigns(row.dvAdvertiserId);
    const lineItems = getDvLineItems(row.dvCampaignId);
    const campaignDisabled = !row.dvAdvertiserId;
    const lineItemsDisabled = !row.dvCampaignId;
    const stateItem = dv360RowState(workspace, row);
    const selectedNames = selectedLineItemNames(row);
    return `
      <tr>
        <td>
          <span class="workspace-name">${escapeHtml(placement.name)}</span>
          <span class="workspace-sub">${escapeHtml(placement.cmPlacementId)}</span>
        </td>
        <td>
          <label class="table-field">
            <select data-action="select-dv-advertiser" data-placement-id="${escapeHtml(placement.id)}" data-row-id="${escapeHtml(row.id)}">
              ${renderOptions(advertisers, row.dvAdvertiserId, "Select advertiser")}
            </select>
          </label>
        </td>
        <td>
          <label class="table-field">
            <select data-action="select-dv-campaign" data-placement-id="${escapeHtml(placement.id)}" data-row-id="${escapeHtml(row.id)}" ${campaignDisabled ? "disabled" : ""}>
              ${renderOptions(campaigns, row.dvCampaignId, campaignDisabled ? "Select advertiser first" : "Select campaign")}
            </select>
            <small>${campaignDisabled ? "Select a DV360 Advertiser before choosing a Campaign." : "Campaign options depend on the selected DV360 Advertiser."}</small>
          </label>
        </td>
        <td>
          <label class="table-field">
            <select multiple size="3" data-action="select-dv-line-items" data-placement-id="${escapeHtml(placement.id)}" data-row-id="${escapeHtml(row.id)}" ${lineItemsDisabled ? "disabled" : ""}>
              ${renderMultiOptions(lineItems, row.lineItemIds)}
            </select>
            <small>${lineItemsDisabled ? "Select a DV360 Campaign before choosing Line Items." : selectedNames.length ? escapeHtml(selectedNames.join(", ")) : "Choose one or more Line Items."}</small>
          </label>
        </td>
        <td>${chip(stateItem.label, stateItem.style)}</td>
        <td><button class="text-button danger" type="button" data-action="remove-dv360-row" data-placement-id="${escapeHtml(placement.id)}" data-row-id="${escapeHtml(row.id)}">Remove</button></td>
      </tr>
    `;
  }

  function renderCsvImportPlaceholder() {
    return `
      <div class="csv-placeholder">
        <div>
          <strong>CSV import</strong>
          <span>CSV import will be available once the mapping import endpoint is connected.</span>
        </div>
        <button class="secondary-button" type="button" disabled>Coming soon</button>
      </div>
    `;
  }

  function renderAdBlueprintTable(workspace, placement) {
    const adBlueprints = placement.adBlueprints || [];
    return `
      <section class="subsection-panel" aria-label="Ad Blueprints">
        <div class="subsection-head">
          <div>
            <h3>Ad Blueprints</h3>
            <p>Manage Standard Display and Rich Media DCO Ad Blueprints for this Placement.</p>
          </div>
          <button class="secondary-button" type="button" data-action="add-ad-blueprint" data-placement-id="${escapeHtml(placement.id)}">Add Ad Blueprint</button>
        </div>
        ${
          adBlueprints.length
            ? `<div class="inline-table-shell">
                <table class="compact-table ad-blueprint-table">
                  <thead>
                    <tr>
                      <th style="width: 18%">Ad Name</th>
                      <th style="width: 14%">Type</th>
                      <th style="width: 12%">Automation</th>
                      <th style="width: 16%">Formats</th>
                      <th style="width: 16%">Creative Source</th>
                      <th style="width: 10%">Status</th>
                      <th style="width: 6%">Issues</th>
                      <th style="width: 8%">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${adBlueprints.map((adBlueprint) => renderAdBlueprintRow(workspace, placement, adBlueprint)).join("")}
                  </tbody>
                </table>
              </div>`
            : '<div class="table-empty"><strong>No Ad Blueprints added</strong><span>Add an Ad Blueprint to configure Standard Display setup for this Placement.</span></div>'
        }
      </section>
    `;
  }

  function renderAdBlueprintRow(workspace, placement, adBlueprint) {
    const issues = issuesForAdBlueprint(workspace, placement, adBlueprint);
    const stateItem = adBlueprintState(workspace, placement, adBlueprint);
    return `
      <tr>
        <td>
          <span class="workspace-name">${escapeHtml(adBlueprint.name || "Untitled Ad Blueprint")}</span>
          <span class="workspace-sub">${escapeHtml(adBlueprint.id)}</span>
        </td>
        <td>${escapeHtml(adTypeLabel(adBlueprint.adType))}</td>
        <td>${adBlueprint.adAutomationEnabled ? chip("On", "blue") : chip("Off", "gray")}</td>
        <td>${renderFormatChips(adBlueprint.selectedFormats)}</td>
        <td><span class="truncate">${escapeHtml(creativeSourceLabel(adBlueprint))}</span></td>
        <td>${chip(stateItem.label, stateItem.style)}</td>
        <td>${issues.length ? chip(String(issues.length), "red") : chip("0", "green")}</td>
        <td>
          <div class="row-actions stacked-actions">
            <button class="text-button" type="button" data-action="open-ad-blueprint" data-placement-id="${escapeHtml(placement.id)}" data-ad-id="${escapeHtml(adBlueprint.id)}">Open</button>
            <button class="text-button" type="button" data-action="duplicate-ad-blueprint" data-placement-id="${escapeHtml(placement.id)}" data-ad-id="${escapeHtml(adBlueprint.id)}">Duplicate</button>
            <button class="text-button danger" type="button" data-action="delete-ad-blueprint" data-placement-id="${escapeHtml(placement.id)}" data-ad-id="${escapeHtml(adBlueprint.id)}">Delete</button>
          </div>
        </td>
      </tr>
    `;
  }

  function renderAdBlueprintCard(adBlueprint, placement) {
    const workspace = currentWorkspace();
    const stateItem = workspace ? adBlueprintState(workspace, placement, adBlueprint) : { label: adBlueprint.status || "Draft", style: adBlueprint.statusStyle || "gray" };
    const issues = workspace ? issuesForAdBlueprint(workspace, placement, adBlueprint) : [];
    const locked = isAdBlueprintLocked(workspace, adBlueprint);
    const lockMessage = adBlueprintLockMessage(workspace, adBlueprint);
    return `
      <section class="content-card">
        <header class="card-head">
          <div>
            <h2>Ad Blueprint</h2>
            <p>Configure ad setup, automation intent, and Standard Display creative source.</p>
          </div>
          ${chip(stateItem.label, stateItem.style)}
        </header>
        <div class="form-panel">
          ${renderLockNotice(lockMessage)}
          <fieldset class="lock-fieldset" ${locked ? "disabled" : ""}>
            <div class="placement-summary-grid">
              <div>
                <span>Parent placement</span>
                <strong>${escapeHtml(placement.name)}</strong>
              </div>
              <div>
                <span>Placement formats</span>
                <strong>${escapeHtml(formatSummary(placement.formats, "No formats"))}</strong>
              </div>
              <div>
                <span>Ad formats</span>
                <strong>${escapeHtml(formatSummary(adBlueprint.selectedFormats, "Not selected"))}</strong>
              </div>
            </div>
            <div class="form-grid">
              <label class="field">
                <span>Ad Name</span>
                <input type="text" data-action="edit-ad-name" data-placement-id="${escapeHtml(placement.id)}" data-ad-id="${escapeHtml(adBlueprint.id)}" value="${escapeHtml(adBlueprint.name || "")}" placeholder="Name this Ad Blueprint" />
              </label>
              <label class="field">
                <span>Ad Type</span>
                <select data-action="select-ad-type" data-placement-id="${escapeHtml(placement.id)}" data-ad-id="${escapeHtml(adBlueprint.id)}">
                  <option value="">Select type</option>
                  <option value="standard_display" ${adBlueprint.adType === "standard_display" ? "selected" : ""}>Standard Display</option>
                  <option value="rich_media_dco" ${adBlueprint.adType === "rich_media_dco" ? "selected" : ""}>Rich Media DCO</option>
                </select>
              </label>
            </div>
            ${renderAdAutomationPanel(adBlueprint, placement)}
            ${adBlueprint.adType === "rich_media_dco" ? renderRichMediaDcoPanel(workspace, placement, adBlueprint) : renderStandardDisplayPanel(placement, adBlueprint)}
            ${renderAudienceSegmentMappingPanel(workspace, placement, adBlueprint)}
            ${renderStudioProfileMappingPanel(workspace, placement, adBlueprint)}
            ${renderAdFormatMismatch(workspace, placement, adBlueprint)}
            ${renderValidationList(issues.filter((issue) => !issue.id.startsWith(`ad-format-${adBlueprint.id}-`)), issues.length ? "" : "Ad Blueprint setup is complete for this phase.")}
          </fieldset>
        </div>
      </section>
    `;
  }

  function renderAdAutomationPanel(adBlueprint, placement) {
    const producers = getProducers();
    return `
      <section class="subsection-panel" aria-label="Ad Automation">
        <div class="toggle-row">
          <div>
            <strong>Ad Automation</strong>
            <span>${adBlueprint.adAutomationEnabled ? "Use Producer data to create dynamic ad variants." : "Automation is off. Upload or select the final creative bundle manually."}</span>
          </div>
          <label class="switch-control">
            <input type="checkbox" data-action="toggle-ad-automation" data-placement-id="${escapeHtml(placement.id)}" data-ad-id="${escapeHtml(adBlueprint.id)}" ${adBlueprint.adAutomationEnabled ? "checked" : ""} />
            <span>${adBlueprint.adAutomationEnabled ? "On" : "Off"}</span>
          </label>
        </div>
        ${
          adBlueprint.adAutomationEnabled
            ? `<div class="form-grid">
                <label class="field">
                  <span>Producer</span>
                  <select data-action="select-ad-producer" data-placement-id="${escapeHtml(placement.id)}" data-ad-id="${escapeHtml(adBlueprint.id)}">
                    ${renderOptions(producers, adBlueprint.producerId, "Select Producer")}
                  </select>
                </label>
                <div class="advanced-box">
                  <strong>Advanced automation settings</strong>
                  <div class="advanced-grid">
                    <span>Filter</span>
                    <em>Not configured</em>
                    <span>Sort</span>
                    <em>Default feed order</em>
                    <span>Limit number of Ads per Ad Set</span>
                    <em>No limit</em>
                  </div>
                </div>
              </div>`
            : ""
        }
      </section>
    `;
  }

  function renderRichMediaDcoPanel(workspace, placement, adBlueprint) {
    const studioAdvertisers = getStudioAdvertisers(workspace.cmAdvertiserId);
    const config = adBlueprint.richMediaDcoConfig || {};
    const studioCampaigns = getStudioCampaigns(config.studioAdvertiserId);
    const studioIssues = issuesForAdBlueprint(workspace, placement, adBlueprint).filter((issue) => issue.location === "Studio Connection");

    return `
      <section class="subsection-panel" aria-label="Rich Media DCO setup">
        <div class="subsection-head">
          <div>
            <h3>Rich Media DCO setup</h3>
            <p>Connect the Studio destination and select one or more HTML Creatives. Desktop upload is unavailable for Rich Media DCO.</p>
          </div>
          ${chip("Rich Media DCO", "blue")}
        </div>
        ${renderStudioConnectionFields(workspace, placement, adBlueprint, studioAdvertisers, studioCampaigns, studioIssues)}
        <div class="form-grid">
          <div class="readonly-box dco-upload-disabled">
            <strong>Desktop upload is not available for Rich Media DCO.</strong>
            <span>Use HTML templates from the asset/template library fixture data.</span>
          </div>
          <div class="readonly-box">
            <strong>HTML Creatives</strong>
            <span>${(config.htmlCreatives || []).length} selected from prototype template fixtures.</span>
          </div>
        </div>
        ${renderDcoCreativeSelector(placement, adBlueprint)}
        <div class="form-grid">
          ${renderValueModeField({
            placement,
            adBlueprint,
            label: "Landing page",
            mode: config.landingPageMode || "static",
            value: config.landingPageValue || "",
            modeAction: "select-dco-landing-mode",
            valueAction: "edit-dco-landing-page",
            helper: "Dynamic landing pages can use prototype macros.",
            dynamicLabel: "Dynamic macro",
            dynamicAlwaysAvailable: true,
            placeholder: "https://example.com",
          })}
          ${renderValueModeField({
            placement,
            adBlueprint,
            label: "URL parameters",
            mode: config.urlParameterMode || "dynamic",
            value: config.urlParameterValue || "",
            modeAction: "select-dco-url-mode",
            valueAction: "edit-dco-url-parameters",
            helper: "URL parameters can use prototype macros.",
            dynamicLabel: "Dynamic macro",
            dynamicAlwaysAvailable: true,
            placeholder: "utm_source=cm360",
          })}
        </div>
        ${renderRichMediaDcoPreviewTable(placement, adBlueprint)}
      </section>
    `;
  }

  function renderStudioConnectionFields(workspace, placement, adBlueprint, studioAdvertisers, studioCampaigns, studioIssues) {
    const config = adBlueprint.richMediaDcoConfig || {};
    const campaignDisabled = !config.studioAdvertiserId;
    return `
      <section class="nested-section" aria-label="Studio Connection">
        <div class="subsection-head compact-subsection-head">
          <div>
            <h3>Studio Connection</h3>
            <p>Choose the prototype Studio Advertiser and Studio Campaign for this Rich Media DCO Ad Blueprint.</p>
          </div>
          ${chip(config.studioAdvertiserId && config.studioCampaignId ? "Connected" : "Needs setup", config.studioAdvertiserId && config.studioCampaignId ? "green" : "yellow")}
        </div>
        <div class="form-grid">
          <label class="field">
            <span>Studio Advertiser</span>
            <select data-action="select-studio-advertiser" data-placement-id="${escapeHtml(placement.id)}" data-ad-id="${escapeHtml(adBlueprint.id)}">
              ${renderOptions(studioAdvertisers, config.studioAdvertiserId, studioAdvertisers.length ? "Select Studio Advertiser" : "No Studio Advertiser available")}
            </select>
            <small>${studioAdvertisers.length ? "Options are filtered by the selected CM360 Advertiser." : "No Studio Advertiser fixture is connected to this CM360 Advertiser."}</small>
          </label>
          <label class="field">
            <span>Studio Campaign</span>
            <select data-action="select-studio-campaign" data-placement-id="${escapeHtml(placement.id)}" data-ad-id="${escapeHtml(adBlueprint.id)}" ${campaignDisabled ? "disabled" : ""}>
              ${renderOptions(studioCampaigns, config.studioCampaignId, campaignDisabled ? "Select Studio Advertiser first" : "Select Studio Campaign")}
            </select>
            <small>${campaignDisabled ? "Select a Studio Advertiser before choosing a Studio Campaign." : "Campaign options depend on the selected Studio Advertiser."}</small>
          </label>
        </div>
        ${renderValidationList(studioIssues, config.studioAdvertiserId && config.studioCampaignId ? "Studio Connection is configured for this prototype." : "")}
      </section>
    `;
  }

  function renderDcoCreativeSelector(placement, adBlueprint) {
    const selectedTemplateIds = new Set(selectedDcoTemplateIds(adBlueprint));
    const templates = getRichMediaDcoTemplates();
    return `
      <div class="inline-table-shell">
        <table class="compact-table dco-creative-table">
          <thead>
            <tr>
              <th style="width: 8%">Use</th>
              <th style="width: 32%">Template name</th>
              <th style="width: 16%">Format</th>
              <th style="width: 22%">Source</th>
              <th style="width: 12%">Status</th>
              <th style="width: 10%">Action</th>
            </tr>
          </thead>
          <tbody>
            ${templates
              .map((template) => {
                const selected = selectedTemplateIds.has(template.id) && (placement.formats || []).includes(template.format);
                const compatible = (placement.formats || []).includes(template.format);
                return `
                  <tr class="${compatible ? "" : "disabled-row"}">
                    <td>
                      <input type="checkbox" data-action="toggle-dco-creative" data-placement-id="${escapeHtml(placement.id)}" data-ad-id="${escapeHtml(adBlueprint.id)}" value="${escapeHtml(template.id)}" ${selected ? "checked" : ""} ${compatible ? "" : "disabled"} />
                    </td>
                    <td><span class="workspace-name">${escapeHtml(template.name)}</span></td>
                    <td>${chip(template.format, compatible ? "gray" : "red")}</td>
                    <td>Template library</td>
                    <td>${chip(compatible ? "Compatible" : "Not supported", compatible ? "green" : "gray")}<span class="workspace-sub">${compatible ? "Available for this placement" : "Not supported by selected placement"}</span></td>
                    <td><button class="text-button" type="button" data-action="open-dco-template" disabled>Preview</button></td>
                  </tr>
                `;
              })
              .join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderStandardDisplayPanel(placement, adBlueprint) {
    const config = adBlueprint.standardDisplayConfig || {};
    const templates = getStandardDisplayTemplates();
    return `
      <section class="subsection-panel" aria-label="Standard Display setup">
        <div class="subsection-head">
          <div>
            <h3>Standard Display setup</h3>
            <p>Configure the HTML Ad source and preview compatible creative versions.</p>
          </div>
          ${chip("Standard Display", "gray")}
        </div>
        <div class="form-grid">
          <label class="field">
            <span>Media source</span>
            <select data-action="select-standard-media-source" data-placement-id="${escapeHtml(placement.id)}" data-ad-id="${escapeHtml(adBlueprint.id)}">
              <option value="template" ${config.mediaSource !== "upload" ? "selected" : ""}>From template</option>
              <option value="upload" ${config.mediaSource === "upload" ? "selected" : ""}>Upload from desktop</option>
            </select>
          </label>
          ${
            config.mediaSource === "upload"
              ? `<label class="field">
                  <span>Prototype upload</span>
                  <input type="text" data-action="edit-upload-name" data-placement-id="${escapeHtml(placement.id)}" data-ad-id="${escapeHtml(adBlueprint.id)}" value="${escapeHtml(config.uploadedBundleName || "")}" placeholder="final-creative-bundle.zip" />
                  <small>Prototype only: final zip bundle upload will be connected later.</small>
                </label>`
              : `<label class="field">
                  <span>HTML template</span>
                  <select data-action="select-standard-template" data-placement-id="${escapeHtml(placement.id)}" data-ad-id="${escapeHtml(adBlueprint.id)}">
                    ${renderTemplateOptions(templates, config.templateId, "Select template", placement.formats)}
                  </select>
                  <small>Only templates matching selected Placement formats can be selected.</small>
                </label>`
          }
        </div>
        ${
          config.mediaSource === "upload"
            ? `<label class="field compact-field">
                <span>Uploaded bundle format</span>
                <select data-action="select-upload-format" data-placement-id="${escapeHtml(placement.id)}" data-ad-id="${escapeHtml(adBlueprint.id)}">
                  ${renderFormatOptions(placement.formats || [], config.uploadedFormat, "Select format")}
                </select>
                <small>Upload format must match the selected Placement formats.</small>
              </label>`
            : ""
        }
        <div class="form-grid">
          ${renderValueModeField({
            placement,
            adBlueprint,
            label: "Landing page",
            mode: config.landingPageMode || "static",
            value: config.landingPageValue || "",
            modeAction: "select-landing-mode",
            valueAction: "edit-landing-page",
            helper: "Dynamic values can use Producer feed macros.",
            placeholder: "https://example.com",
          })}
          ${renderValueModeField({
            placement,
            adBlueprint,
            label: "URL parameters",
            mode: config.urlParameterMode || "static",
            value: config.urlParameterValue || "",
            modeAction: "select-url-mode",
            valueAction: "edit-url-parameters",
            helper: "Dynamic values can use Producer feed macros.",
            placeholder: "utm_source=cm360",
          })}
        </div>
        ${renderStandardDisplayPreviewTable(placement, adBlueprint)}
      </section>
    `;
  }

  function renderValueModeField(config) {
    const dynamicDisabled = !config.dynamicAlwaysAvailable && !config.adBlueprint.adAutomationEnabled;
    return `
      <div class="value-mode-field">
        <label class="field">
          <span>${escapeHtml(config.label)}</span>
          <select data-action="${escapeHtml(config.modeAction)}" data-placement-id="${escapeHtml(config.placement.id)}" data-ad-id="${escapeHtml(config.adBlueprint.id)}">
            <option value="static" ${config.mode !== "dynamic" ? "selected" : ""}>Static value</option>
            <option value="dynamic" ${config.mode === "dynamic" ? "selected" : ""} ${dynamicDisabled ? "disabled" : ""}>${escapeHtml(config.dynamicLabel || "Dynamic macro")}</option>
          </select>
          <small>${dynamicDisabled ? "Turn on Ad Automation to use Producer feed macros." : escapeHtml(config.helper)}</small>
        </label>
        <label class="field">
          <span>${config.mode === "dynamic" ? escapeHtml(config.dynamicLabel || "Producer macro") : "Value"}</span>
          <input type="text" data-action="${escapeHtml(config.valueAction)}" data-placement-id="${escapeHtml(config.placement.id)}" data-ad-id="${escapeHtml(config.adBlueprint.id)}" value="${escapeHtml(config.value)}" placeholder="${escapeHtml(config.mode === "dynamic" ? "{{feed.field}}" : config.placeholder)}" />
        </label>
      </div>
    `;
  }

  function renderStandardDisplayPreviewTable(placement, adBlueprint) {
    const rows = standardDisplayPreviewRows(placement, adBlueprint);
    if (!rows.length) {
      return '<div class="table-empty"><strong>No Standard Display preview yet</strong><span>Select a template or upload source to preview compatible creative versions.</span></div>';
    }
    return `
      <div class="inline-table-shell">
        <table class="compact-table preview-table">
          <thead>
            <tr>
              <th style="width: 23%">Creative</th>
              <th style="width: 12%">Format</th>
              <th style="width: 14%">Source</th>
              <th style="width: 21%">Landing page</th>
              <th style="width: 20%">URL parameters</th>
              <th style="width: 10%">Status</th>
            </tr>
          </thead>
          <tbody>
            ${rows
              .map(
                (row) => `
                  <tr>
                    <td><span class="workspace-name">${escapeHtml(row.creative)}</span></td>
                    <td>${chip(row.format || "Not set", row.status === "Compatible" ? "gray" : "red")}</td>
                    <td>${escapeHtml(row.source)}</td>
                    <td><span class="truncate">${escapeHtml(row.landingPage)}</span></td>
                    <td><span class="truncate">${escapeHtml(row.urlParameters)}</span></td>
                    <td>${chip(row.status, row.status === "Compatible" ? "green" : "red")}</td>
                  </tr>
                `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderRichMediaDcoPreviewTable(placement, adBlueprint) {
    const rows = richMediaDcoPreviewRows(placement, adBlueprint);
    if (!rows.length) {
      return '<div class="table-empty"><strong>No DCO preview yet</strong><span>Select one or more HTML Creatives to preview Rich Media DCO versions.</span></div>';
    }
    return `
      <div class="inline-table-shell">
        <table class="compact-table preview-table">
          <thead>
            <tr>
              <th style="width: 28%">Creative</th>
              <th style="width: 12%">Format</th>
              <th style="width: 24%">Landing page</th>
              <th style="width: 24%">URL parameters</th>
              <th style="width: 10%">Status</th>
            </tr>
          </thead>
          <tbody>
            ${rows
              .map(
                (row) => `
                  <tr>
                    <td><span class="workspace-name">${escapeHtml(row.creative)}</span></td>
                    <td>${chip(row.format || "Not set", row.status === "Compatible" ? "gray" : "red")}</td>
                    <td><span class="truncate">${escapeHtml(row.landingPage)}</span></td>
                    <td><span class="truncate">${escapeHtml(row.urlParameters)}</span></td>
                    <td>${chip(row.status, row.status === "Compatible" ? "green" : "red")}</td>
                  </tr>
                `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderAudienceSegmentMappingPanel(workspace, placement, adBlueprint) {
    const lineItems = selectedDv360LineItemsForPlacement(placement);
    if (!placement.dv360Enabled || !lineItems.length) {
      return `
        <section class="subsection-panel" aria-label="Audience Segment Mapping">
          <div class="subsection-head">
            <div>
              <h3>Audience Segment Mapping</h3>
              <p>Map DV360 Line Items to Producer feed conditions.</p>
            </div>
            ${chip("Not ready", "gray")}
          </div>
          <div class="table-empty">
            <strong>No DV360 Line Items selected for this placement.</strong>
            <span>Add Line Items in the Placement Blueprint before configuring audience mapping.</span>
          </div>
        </section>
      `;
    }

    if (!adBlueprint.adAutomationEnabled && !adBlueprint.producerId) {
      return `
        <section class="subsection-panel" aria-label="Audience Segment Mapping">
          <div class="subsection-head">
            <div>
              <h3>Audience Segment Mapping</h3>
              <p>Map DV360 Line Items to Producer feed conditions.</p>
            </div>
            ${chip("Needs setup", "yellow")}
          </div>
          <div class="table-empty">
            <strong>Audience mapping requires Producer feed context.</strong>
            <span>Turn on Ad Automation or select a feed source before mapping audiences.</span>
          </div>
        </section>
      `;
    }

    const issues = issuesForAudienceMapping(workspace, adBlueprint);
    return `
      <section class="subsection-panel" aria-label="Audience Segment Mapping">
        <div class="subsection-head">
          <div>
            <h3>Audience Segment Mapping</h3>
            <p>Each DV360 Line Item represents an audience group mapped to feed conditions.</p>
          </div>
          ${chip(issues.length ? "Needs review" : "Complete", issues.length ? "yellow" : "green")}
        </div>
        <div class="inline-table-shell">
          <table class="compact-table audience-table">
            <thead>
              <tr>
                <th style="width: 18%">DV360 Line Item</th>
                <th style="width: 17%">Feed field</th>
                <th style="width: 14%">Condition</th>
                <th style="width: 17%">Value</th>
                <th style="width: 12%">Matching variants</th>
                <th style="width: 10%">Status</th>
                <th style="width: 12%">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${lineItems.map((lineItem) => renderAudienceMappingRow(placement, adBlueprint, lineItem)).join("")}
            </tbody>
          </table>
        </div>
        ${renderValidationList(issues, issues.length ? "" : "Audience mappings are complete for selected Line Items.")}
      </section>
    `;
  }

  function renderAudienceMappingRow(placement, adBlueprint, lineItem) {
    const mapping = audienceMappingFor(adBlueprint, lineItem.id);
    const stateItem = audienceMappingState(mapping);
    const suggestion = audienceSuggestionFor(lineItem.id);
    const valueDisabled = mapping.operator === "is_not_empty";
    return `
      <tr>
        <td>
          <span class="workspace-name">${escapeHtml(lineItem.name)}</span>
          <span class="workspace-sub">${escapeHtml(lineItem.campaignName)}</span>
        </td>
        <td>
          <label class="table-field">
            <select data-action="select-audience-feed-field" data-placement-id="${escapeHtml(placement.id)}" data-ad-id="${escapeHtml(adBlueprint.id)}" data-line-item-id="${escapeHtml(lineItem.id)}">
              ${renderOptions(getProducerFeedFields(), mapping.feedField, "Select field")}
            </select>
          </label>
        </td>
        <td>
          <label class="table-field">
            <select data-action="select-audience-operator" data-placement-id="${escapeHtml(placement.id)}" data-ad-id="${escapeHtml(adBlueprint.id)}" data-line-item-id="${escapeHtml(lineItem.id)}">
              ${renderOptions(
                [
                  { id: "equals", name: "equals" },
                  { id: "contains", name: "contains" },
                  { id: "starts_with", name: "starts with" },
                  { id: "is_not_empty", name: "is not empty" },
                ],
                mapping.operator,
                "Select condition"
              )}
            </select>
          </label>
        </td>
        <td>
          <label class="table-field">
            <input type="text" data-action="edit-audience-value" data-placement-id="${escapeHtml(placement.id)}" data-ad-id="${escapeHtml(adBlueprint.id)}" data-line-item-id="${escapeHtml(lineItem.id)}" value="${escapeHtml(mapping.value || "")}" ${valueDisabled ? "disabled" : ""} placeholder="${valueDisabled ? "Not required" : "Value"}" />
          </label>
        </td>
        <td>${audienceMatchCount(mapping)}</td>
        <td>${chip(stateItem.label, stateItem.style)}</td>
        <td>
          <div class="row-actions stacked-actions">
            ${suggestion ? `<button class="text-button" type="button" data-action="apply-audience-suggestion" data-placement-id="${escapeHtml(placement.id)}" data-ad-id="${escapeHtml(adBlueprint.id)}" data-line-item-id="${escapeHtml(lineItem.id)}">Apply suggestion</button>` : ""}
            <button class="text-button danger" type="button" data-action="clear-audience-mapping" data-placement-id="${escapeHtml(placement.id)}" data-ad-id="${escapeHtml(adBlueprint.id)}" data-line-item-id="${escapeHtml(lineItem.id)}">Clear</button>
          </div>
        </td>
      </tr>
    `;
  }

  function renderStudioProfileMappingPanel(workspace, placement, adBlueprint) {
    if (adBlueprint.adType !== "rich_media_dco") {
      return `
        <section class="subsection-panel" aria-label="Studio Profile Mapping">
          <div class="subsection-head">
            <div>
              <h3>Studio Profile Mapping</h3>
              <p>Studio Profile Mapping is only required for Rich Media DCO.</p>
            </div>
            ${chip("Not required", "gray")}
          </div>
        </section>
      `;
    }

    const config = adBlueprint.richMediaDcoConfig || {};
    const studioAdvertiser = getStudioAdvertisers(workspace.cmAdvertiserId).find((advertiser) => advertiser.id === config.studioAdvertiserId);
    const studioCampaign = getStudioCampaigns(config.studioAdvertiserId).find((campaign) => campaign.id === config.studioCampaignId);
    const dcoComplete = Boolean(studioAdvertiser && studioCampaign && (config.htmlCreatives || []).length);
    if (!dcoComplete) {
      return `
        <section class="subsection-panel" aria-label="Studio Profile Mapping">
          <div class="subsection-head">
            <div>
              <h3>Studio Profile Mapping</h3>
              <p>Studio field mapping shell for Rich Media DCO Ad Blueprints.</p>
            </div>
            ${chip("Needs setup", "yellow")}
          </div>
          <div class="table-empty">
            <strong>Complete Rich Media DCO setup before configuring Studio Profile Mapping.</strong>
            <span>Select a Studio Advertiser, Studio Campaign, and at least one HTML Creative first.</span>
          </div>
        </section>
      `;
    }

    const rows = getStudioProfileMappingRows(adBlueprint);
    const stateItem = studioMappingState(rows, adBlueprint);
    return `
      <section class="subsection-panel" aria-label="Studio Profile Mapping">
        <div class="subsection-head">
          <div>
            <h3>Studio Profile Mapping</h3>
            <p>Prototype shell only. No real Studio Profile API connection is made.</p>
          </div>
          ${chip(stateItem.label, stateItem.style)}
        </div>
        <div class="placement-summary-grid">
          <div><span>Studio Advertiser</span><strong>${escapeHtml(studioAdvertiser?.name || "Not selected")}</strong></div>
          <div><span>Studio Campaign</span><strong>${escapeHtml(studioCampaign?.name || "Not selected")}</strong></div>
          <div><span>HTML Creatives</span><strong>${(config.htmlCreatives || []).length}</strong></div>
        </div>
        <div class="inline-table-shell">
          <table class="compact-table studio-map-table">
            <thead>
              <tr>
                <th style="width: 20%">Studio field</th>
                <th style="width: 20%">Source</th>
                <th style="width: 24%">Suggested mapping</th>
                <th style="width: 16%">Status</th>
                <th style="width: 20%">Action</th>
              </tr>
            </thead>
            <tbody>
              ${rows.map((row) => renderStudioProfileMappingRow(placement, adBlueprint, row)).join("")}
            </tbody>
          </table>
        </div>
      </section>
    `;
  }

  function renderStudioProfileMappingRow(placement, adBlueprint, row) {
    const style = row.status === "Auto-mapped" || row.status === "Complete" ? "green" : row.status === "Missing" ? "red" : "yellow";
    return `
      <tr>
        <td><span class="workspace-name">${escapeHtml(row.studioField)}</span></td>
        <td>${escapeHtml(row.source)}</td>
        <td><span class="truncate">${escapeHtml(row.suggestedMapping)}</span></td>
        <td>${chip(row.status, style)}</td>
        <td>
          ${
            row.status === "Needs review"
              ? `<button class="text-button" type="button" data-action="mark-studio-mapping-reviewed" data-placement-id="${escapeHtml(placement.id)}" data-ad-id="${escapeHtml(adBlueprint.id)}" data-row-id="${escapeHtml(row.id)}">Mark reviewed</button>`
              : '<span class="muted-text">No action</span>'
          }
        </td>
      </tr>
    `;
  }

  function publishingStatusStyle(status) {
    const normalized = String(status || "").toLowerCase();
    if (normalized === "published" || normalized === "complete" || normalized === "success") return "green";
    if (normalized === "failed" || normalized === "blocked") return "red";
    if (normalized === "in_progress") return "blue";
    if (normalized === "pending") return "yellow";
    return "gray";
  }

  function publishingStepLabel(step) {
    if (step.stepId === "studio_profile") return "Studio Profile";
    if (step.stepId === "cm360") return "CM360";
    if (step.stepId === "dv360") return "DV360";
    return readableStatus(step.stepId, "Step");
  }

  function renderPublishingCard(workspace) {
    const publishing = typeof workspace.publishingStatus === "object" && workspace.publishingStatus ? workspace.publishingStatus : { status: workspace.publishingStatus || "not_started", steps: [] };
    const publishingLabel = readableStatus(publishing, "Not started");
    const counts = issueCounts(workspace);
    const publishingInProgress = isPublishingInProgress(workspace);
    const readiness = publishingReadiness(workspace);
    const dv360Required = hasDv360LineItems(workspace);
    const steps = publishing.steps?.length
      ? publishing.steps
      : [
          { stepId: "studio_profile", target: "google_studio", status: "not_started" },
          { stepId: "cm360", target: "cm360", status: "not_started" },
          { stepId: "dv360", target: "dv360", status: dv360Required ? "not_started" : "skipped" },
        ];
    return `
      <section class="content-card compact-card" aria-label="Publishing status">
        <header class="card-head">
          <div>
            <h2>Publishing</h2>
            <p>Prototype-only readiness view. Publishing remains separate from the Campaign, Placement, and Ad Blueprint hierarchy.</p>
          </div>
          ${chip(publishingLabel, publishingStatusStyle(publishing.status))}
        </header>
        <div class="publishing-body">
          <div class="readiness-strip">
            <div>
              <span>Validation</span>
              <strong>${counts.blocking ? `${counts.blocking} blocking` : counts.warning ? `${counts.warning} warning${counts.warning === 1 ? "" : "s"}` : "Ready"}</strong>
            </div>
            <div>
              <span>Publish action</span>
              <button class="primary-button" type="button" data-action="start-publishing" ${readiness.ready ? "" : "disabled"}>
                ${publishingInProgress ? "Publishing..." : isWorkspaceLocked(workspace) ? "Published" : "Publish"}
              </button>
            </div>
          </div>
          ${
            !readiness.ready && !publishingInProgress && !isWorkspaceLocked(workspace)
              ? '<div class="readonly-box">Complete Placement and Ad Blueprint setup before publishing.</div>'
              : ""
          }
          ${
            counts.all
              ? `<div class="validation-list has-issues" role="status">
                  ${workspaceValidationIssues(workspace)
                    .slice(0, 4)
                    .map((issue) => `<div class="validation-item">${escapeHtml(issue.message)}</div>`)
                    .join("")}
                </div>`
              : ""
          }
          <div class="publishing-step-list">
            ${steps
              .map(
                (step) => `
                  <div class="publishing-step">
                    <span>${escapeHtml(publishingStepLabel(step))}</span>
                    ${chip(readableStatus(step.status, "Not started"), publishingStatusStyle(step.status))}
                  </div>
                `
              )
              .join("")}
          </div>
          <div class="readonly-box">No real CM360, DV360, or Studio publishing call is made from this standalone prototype.</div>
        </div>
      </section>
    `;
  }

  function renderPlaceholderCard(config) {
    return `
      <section class="content-card">
        <header class="card-head">
          <div>
            <h2>${escapeHtml(config.title)}</h2>
            <p>${escapeHtml(config.description)}</p>
          </div>
        </header>
        <div class="placeholder-table">
          ${config.rows
            .map(
              ([label, value]) => `
                <div class="placeholder-row">
                  <span>${escapeHtml(label)}</span>
                  <strong>${escapeHtml(value)}</strong>
                </div>
              `
            )
            .join("")}
        </div>
        <div class="callout">
          <strong>Configuration placeholder</strong>
          <span>Detailed setup remains unavailable until the required blueprint information is ready.</span>
        </div>
      </section>
    `;
  }

  function renderCreateModal() {
    return `
      <div class="modal-overlay" role="presentation" data-action="close-create">
        <section class="modal" role="dialog" aria-modal="true" aria-labelledby="createWorkspaceTitle">
          <header class="modal-head">
            <h2 id="createWorkspaceTitle">Create CM360 Workspace</h2>
            <button class="modal-close" type="button" aria-label="Close" data-action="close-create">x</button>
          </header>
          <div class="modal-body">
            <div class="field">
              <label for="newWorkspaceName">Workspace name</label>
              <input id="newWorkspaceName" type="text" value="${escapeHtml(state.createName)}" placeholder="e.g. Q3 CM360 launch workspace" />
              <div class="field-error" role="alert">${escapeHtml(state.createError)}</div>
            </div>
            <div class="readonly-box">New Workspaces start with a Campaign root and no placements or Ad Blueprints.</div>
          </div>
          <footer class="modal-footer">
            <button class="ghost-button" type="button" data-action="close-create">Cancel</button>
            <button class="primary-button" type="button" data-action="create-workspace">Create Workspace</button>
          </footer>
        </section>
      </div>
    `;
  }

  function createWorkspace() {
    const name = state.createName.trim();
    if (!name) {
      state.createError = "Workspace name is required.";
      render();
      return;
    }

    let workspace;
    if (adapter && typeof adapter.createPrototypeWorkspace === "function") {
      workspace = adapter.createPrototypeWorkspace({ name });
      refreshWorkspaces();
    } else {
      workspace = {
        id: `cm360-workspace-${Date.now()}`,
        name,
        status: "Draft",
        statusStyle: "gray",
        advertiser: "CM360 Advertiser not selected",
        campaign: "CM360 Campaign not selected",
        updatedAt: "Saved just now",
        owner: "Media Ops",
        placements: "0 selected",
        adBlueprints: "0",
        validationIssues: 2,
        campaignBlueprint: {
          id: "campaign-blueprint",
          name: "",
          status: "Needs setup",
          statusStyle: "yellow",
        },
        placementsTree: [],
        publishingStatus: "Not started",
      };
      state.workspaces.unshift(workspace);
    }

    state.selectedWorkspaceId = workspace.id;
    state.selectedNode = { type: "campaign" };
    state.expandedNodes = new Set(["campaign"]);
    state.createOpen = false;
    state.createName = "";
    state.createError = "";
    state.view = "detail";
    showToast("Workspace created.");
    render();
  }

  function deleteWorkspace(id) {
    const workspace = state.workspaces.find((item) => item.id === id);
    if (adapter && typeof adapter.deletePrototypeWorkspace === "function") {
      adapter.deletePrototypeWorkspace(id);
      refreshWorkspaces();
    } else {
      state.workspaces = state.workspaces.filter((item) => item.id !== id);
    }
    if (state.selectedWorkspaceId === id) {
      state.selectedWorkspaceId = state.workspaces[0] ? state.workspaces[0].id : "";
      state.view = "list";
    }
    showToast(workspace ? "Workspace deleted." : "Workspace removed.");
    render();
  }

  function markAutosaving() {
    setAutosaveSaving();
  }

  function setPrototypePublishingStatus(workspaceId, publishingStatus, options) {
    if (adapter && typeof adapter.updatePrototypePublishingStatus === "function") {
      adapter.updatePrototypePublishingStatus(workspaceId, publishingStatus, options);
      refreshWorkspaces();
      return;
    }
    const workspace = state.workspaces.find((item) => item.id === workspaceId);
    if (!workspace) return;
    workspace.publishingStatus = publishingStatus;
    if (options?.published) {
      workspace.status = "Published";
      workspace.statusStyle = "green";
      workspace.updatedAt = "Published just now";
    }
  }

  function publishingStepsFor(workspace, activeStepId) {
    const dv360Required = hasDv360LineItems(workspace);
    const stepIds = ["studio_profile", "cm360", "dv360"];
    return stepIds.map((stepId) => {
      if (stepId === "dv360" && !dv360Required) {
        return { stepId, target: "dv360", status: "skipped" };
      }
      if (stepId === activeStepId) {
        return { stepId, target: stepId === "studio_profile" ? "google_studio" : stepId, status: "in_progress" };
      }
      return { stepId, target: stepId === "studio_profile" ? "google_studio" : stepId, status: "pending" };
    });
  }

  function completePublishingStep(workspace, stepId) {
    const publishing = workspace.publishingStatus || {};
    const steps = (publishing.steps || publishingStepsFor(workspace, "")).map((step) =>
      step.stepId === stepId ? { ...step, status: "success" } : step
    );
    return { status: "in_progress", steps };
  }

  function setActivePublishingStep(workspace, stepId) {
    const publishing = workspace.publishingStatus || {};
    const steps = (publishing.steps || publishingStepsFor(workspace, "")).map((step) => {
      if (step.status === "success" || step.status === "skipped") return step;
      return { ...step, status: step.stepId === stepId ? "in_progress" : "pending" };
    });
    return { status: "in_progress", steps };
  }

  function startPublishingSimulation() {
    const workspace = currentWorkspace();
    if (!workspace) return;
    const readiness = publishingReadiness(workspace);
    if (!readiness.ready) {
      showToast("Complete Placement and Ad Blueprint setup before publishing.");
      return;
    }

    state.publishingTimers.forEach((timer) => window.clearTimeout(timer));
    state.publishingTimers = [];

    const dv360Required = hasDv360LineItems(workspace);
    const started = { status: "in_progress", steps: publishingStepsFor(workspace, "studio_profile") };
    setPrototypePublishingStatus(workspace.id, started);
    state.autosaveText = "Publishing simulation running";
    showToast("Publishing simulation started.");
    render();

    const advance = (delay, callback) => {
      const timer = window.setTimeout(callback, delay);
      state.publishingTimers.push(timer);
    };

    advance(700, () => {
      const latest = currentWorkspace();
      if (!latest || latest.id !== workspace.id) return;
      setPrototypePublishingStatus(workspace.id, setActivePublishingStep({ ...latest, publishingStatus: completePublishingStep(latest, "studio_profile") }, "cm360"));
      render();
    });

    advance(1400, () => {
      const latest = currentWorkspace();
      if (!latest || latest.id !== workspace.id) return;
      const afterCm360 = completePublishingStep(latest, "cm360");
      if (!dv360Required) {
        setPrototypePublishingStatus(workspace.id, { status: "published", steps: afterCm360.steps }, { published: true });
        state.autosaveText = "Published just now";
        showToast("Workspace published in prototype.");
        render();
        return;
      }
      setPrototypePublishingStatus(workspace.id, setActivePublishingStep({ ...latest, publishingStatus: afterCm360 }, "dv360"));
      render();
    });

    if (dv360Required) {
      advance(2100, () => {
        const latest = currentWorkspace();
        if (!latest || latest.id !== workspace.id) return;
        const afterDv360 = completePublishingStep(latest, "dv360");
        setPrototypePublishingStatus(workspace.id, { status: "published", steps: afterDv360.steps }, { published: true });
        state.autosaveText = "Published just now";
        showToast("Workspace published in prototype.");
        render();
      });
    }
  }

  function updateCampaignSelection(cmAdvertiserId, cmCampaignId) {
    const workspace = currentWorkspace();
    if (!workspace) return;
    if (adapter && typeof adapter.updatePrototypeCampaign === "function") {
      adapter.updatePrototypeCampaign(workspace.id, { cmAdvertiserId, cmCampaignId });
      refreshWorkspaces();
    }
    state.selectedNode = { type: "campaign" };
    state.expandedNodes.add("campaign");
    markAutosaving();
    render();
  }

  function updatePlacementSelection(cmPlacementIds) {
    const workspace = currentWorkspace();
    if (!workspace) return;
    if (adapter && typeof adapter.updatePrototypePlacements === "function") {
      adapter.updatePrototypePlacements(workspace.id, cmPlacementIds);
      refreshWorkspaces();
    }
    syncSelectedNode(currentWorkspace());
    state.expandedNodes.add("campaign");
    markAutosaving();
    render();
  }

  function updateDv360Enabled(placementId, enabled) {
    const workspace = currentWorkspace();
    if (!workspace) return;
    if (adapter && typeof adapter.updatePrototypePlacementDv360Enabled === "function") {
      adapter.updatePrototypePlacementDv360Enabled(workspace.id, placementId, enabled);
      refreshWorkspaces();
    }
    state.selectedNode = { type: "placement", placementId };
    state.expandedNodes.add("campaign");
    state.expandedNodes.add(nodeKey("placement", placementId));
    markAutosaving();
    render();
  }

  function addDv360Row(placementId) {
    const workspace = currentWorkspace();
    if (!workspace) return;
    if (adapter && typeof adapter.addPrototypeDv360MappingRow === "function") {
      adapter.addPrototypeDv360MappingRow(workspace.id, placementId);
      refreshWorkspaces();
    }
    state.selectedNode = { type: "placement", placementId };
    markAutosaving();
    render();
  }

  function updateDv360Row(placementId, rowId, input) {
    const workspace = currentWorkspace();
    if (!workspace) return;
    if (adapter && typeof adapter.updatePrototypeDv360MappingRow === "function") {
      adapter.updatePrototypeDv360MappingRow(workspace.id, placementId, rowId, input);
      refreshWorkspaces();
    }
    state.selectedNode = { type: "placement", placementId };
    markAutosaving();
    render();
  }

  function removeDv360Row(placementId, rowId) {
    const workspace = currentWorkspace();
    if (!workspace) return;
    if (adapter && typeof adapter.removePrototypeDv360MappingRow === "function") {
      adapter.removePrototypeDv360MappingRow(workspace.id, placementId, rowId);
      refreshWorkspaces();
    }
    state.selectedNode = { type: "placement", placementId };
    markAutosaving();
    render();
  }

  function addAdBlueprint(placementId) {
    const workspace = currentWorkspace();
    if (!workspace) return;
    if (adapter && typeof adapter.addPrototypeAdBlueprint === "function") {
      const updated = adapter.addPrototypeAdBlueprint(workspace.id, placementId);
      refreshWorkspaces();
      const placement = updated?.placementsTree?.find((item) => item.id === placementId);
      const adBlueprint = placement?.adBlueprints?.[placement.adBlueprints.length - 1];
      if (adBlueprint) state.selectedNode = { type: "ad", placementId, adBlueprintId: adBlueprint.id };
    }
    state.expandedNodes.add("campaign");
    state.expandedNodes.add(nodeKey("placement", placementId));
    markAutosaving();
    render();
  }

  function duplicateAdBlueprint(placementId, adBlueprintId) {
    const workspace = currentWorkspace();
    if (!workspace) return;
    if (adapter && typeof adapter.duplicatePrototypeAdBlueprint === "function") {
      const updated = adapter.duplicatePrototypeAdBlueprint(workspace.id, placementId, adBlueprintId);
      refreshWorkspaces();
      const placement = updated?.placementsTree?.find((item) => item.id === placementId);
      const duplicate = placement?.adBlueprints?.[placement.adBlueprints.length - 1];
      if (duplicate) state.selectedNode = { type: "ad", placementId, adBlueprintId: duplicate.id };
    }
    state.expandedNodes.add("campaign");
    state.expandedNodes.add(nodeKey("placement", placementId));
    markAutosaving();
    render();
  }

  function deleteAdBlueprint(placementId, adBlueprintId) {
    const workspace = currentWorkspace();
    if (!workspace) return;
    if (adapter && typeof adapter.deletePrototypeAdBlueprint === "function") {
      adapter.deletePrototypeAdBlueprint(workspace.id, placementId, adBlueprintId);
      refreshWorkspaces();
    }
    if (state.selectedNode.type === "ad" && state.selectedNode.adBlueprintId === adBlueprintId) {
      state.selectedNode = { type: "placement", placementId };
    }
    markAutosaving();
    render();
  }

  function updateAdBlueprint(placementId, adBlueprintId, input) {
    const workspace = currentWorkspace();
    if (!workspace) return;
    if (adapter && typeof adapter.updatePrototypeAdBlueprint === "function") {
      adapter.updatePrototypeAdBlueprint(workspace.id, placementId, adBlueprintId, input);
      refreshWorkspaces();
    }
    state.selectedNode = { type: "ad", placementId, adBlueprintId };
    markAutosaving();
    render();
  }

  function updateAudienceMapping(placementId, adBlueprintId, lineItemId, input) {
    const workspace = currentWorkspace();
    if (!workspace) return;
    if (adapter && typeof adapter.updatePrototypeAudienceMapping === "function") {
      adapter.updatePrototypeAudienceMapping(workspace.id, placementId, adBlueprintId, lineItemId, input);
      refreshWorkspaces();
    }
    state.selectedNode = { type: "ad", placementId, adBlueprintId };
    markAutosaving();
    render();
  }

  function clearAudienceMapping(placementId, adBlueprintId, lineItemId) {
    const workspace = currentWorkspace();
    if (!workspace) return;
    if (adapter && typeof adapter.clearPrototypeAudienceMapping === "function") {
      adapter.clearPrototypeAudienceMapping(workspace.id, placementId, adBlueprintId, lineItemId);
      refreshWorkspaces();
    }
    state.selectedNode = { type: "ad", placementId, adBlueprintId };
    markAutosaving();
    render();
  }

  function applyAudienceSuggestion(placementId, adBlueprintId, lineItemId) {
    const workspace = currentWorkspace();
    if (!workspace) return;
    if (adapter && typeof adapter.applyPrototypeAudienceSuggestion === "function") {
      adapter.applyPrototypeAudienceSuggestion(workspace.id, placementId, adBlueprintId, lineItemId);
      refreshWorkspaces();
    }
    state.selectedNode = { type: "ad", placementId, adBlueprintId };
    markAutosaving();
    render();
  }

  function markStudioMappingReviewed(placementId, adBlueprintId, rowId) {
    const workspace = currentWorkspace();
    if (!workspace) return;
    if (adapter && typeof adapter.markPrototypeStudioProfileMappingReviewed === "function") {
      adapter.markPrototypeStudioProfileMappingReviewed(workspace.id, placementId, adBlueprintId, rowId);
      refreshWorkspaces();
    }
    state.selectedNode = { type: "ad", placementId, adBlueprintId };
    markAutosaving();
    render();
  }

  function handleClick(event) {
    const actionTarget = event.target.closest("[data-action]");
    if (!actionTarget) return;
    const action = actionTarget.dataset.action;

    if (action === "show-list") {
      state.view = "list";
      render();
      return;
    }

    if (action === "open-workspace") {
      state.selectedWorkspaceId = actionTarget.dataset.id;
      state.selectedNode = { type: "campaign" };
      state.expandedNodes = new Set(["campaign"]);
      state.view = "detail";
      render();
      return;
    }

    if (action === "delete-workspace") {
      deleteWorkspace(actionTarget.dataset.id);
      return;
    }

    if (action === "start-publishing") {
      startPublishingSimulation();
      return;
    }

    if (action === "remove-placement") {
      const workspace = currentWorkspace();
      const removeId = actionTarget.dataset.id;
      const nextIds = (workspace?.placementsTree || []).map((placement) => placement.cmPlacementId).filter((id) => id !== removeId);
      updatePlacementSelection(nextIds);
      return;
    }

    if (action === "open-issue-placement") {
      const placementId = actionTarget.dataset.placementId;
      state.selectedNode = { type: "placement", placementId };
      state.expandedNodes.add("campaign");
      state.expandedNodes.add(nodeKey("placement", placementId));
      render();
      return;
    }

    if (action === "add-dv360-row") {
      addDv360Row(actionTarget.dataset.placementId);
      return;
    }

    if (action === "remove-dv360-row") {
      removeDv360Row(actionTarget.dataset.placementId, actionTarget.dataset.rowId);
      return;
    }

    if (action === "add-ad-blueprint") {
      addAdBlueprint(actionTarget.dataset.placementId);
      return;
    }

    if (action === "open-ad-blueprint") {
      state.selectedNode = { type: "ad", placementId: actionTarget.dataset.placementId, adBlueprintId: actionTarget.dataset.adId };
      state.expandedNodes.add("campaign");
      state.expandedNodes.add(nodeKey("placement", actionTarget.dataset.placementId));
      render();
      return;
    }

    if (action === "duplicate-ad-blueprint") {
      duplicateAdBlueprint(actionTarget.dataset.placementId, actionTarget.dataset.adId);
      return;
    }

    if (action === "delete-ad-blueprint") {
      deleteAdBlueprint(actionTarget.dataset.placementId, actionTarget.dataset.adId);
      return;
    }

    if (action === "apply-audience-suggestion") {
      applyAudienceSuggestion(actionTarget.dataset.placementId, actionTarget.dataset.adId, actionTarget.dataset.lineItemId);
      return;
    }

    if (action === "clear-audience-mapping") {
      clearAudienceMapping(actionTarget.dataset.placementId, actionTarget.dataset.adId, actionTarget.dataset.lineItemId);
      return;
    }

    if (action === "mark-studio-mapping-reviewed") {
      markStudioMappingReviewed(actionTarget.dataset.placementId, actionTarget.dataset.adId, actionTarget.dataset.rowId);
      return;
    }

    if (action === "toggle-node") {
      const key = actionTarget.dataset.nodeKey;
      if (state.expandedNodes.has(key)) state.expandedNodes.delete(key);
      else state.expandedNodes.add(key);
      render();
      return;
    }

    if (action === "select-node") {
      const type = actionTarget.dataset.nodeType;
      const id = actionTarget.dataset.nodeId;
      if (type === "campaign") state.selectedNode = { type: "campaign" };
      if (type === "placement") state.selectedNode = { type: "placement", placementId: id };
      if (type === "ad") {
        const [placementId, adBlueprintId] = id.split(":");
        state.selectedNode = { type: "ad", placementId, adBlueprintId };
      }
      render();
      return;
    }

    if (action === "open-create") {
      state.createOpen = true;
      state.createName = "";
      state.createError = "";
      render();
      const input = document.getElementById("newWorkspaceName");
      if (input) input.focus();
      return;
    }

    if (action === "close-create") {
      if (actionTarget.classList.contains("modal-overlay") && event.target !== actionTarget) return;
      state.createOpen = false;
      state.createError = "";
      render();
      return;
    }

    if (action === "create-workspace") {
      createWorkspace();
    }
  }

  function handleInput(event) {
    if (event.target.id === "workspaceSearch") {
      state.search = event.target.value;
      render();
      const input = document.getElementById("workspaceSearch");
      if (input) {
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      }
      return;
    }

    if (event.target.id === "newWorkspaceName") {
      state.createName = event.target.value;
      state.createError = "";
      return;
    }
  }

  function handleChange(event) {
    const actionTarget = event.target.closest("[data-action]");
    if (!actionTarget) return;
    const action = actionTarget.dataset.action;
    const workspace = currentWorkspace();
    if (!workspace) return;

    if (action === "select-advertiser") {
      updateCampaignSelection(actionTarget.value, "");
      return;
    }

    if (action === "select-campaign") {
      updateCampaignSelection(workspace.cmAdvertiserId, actionTarget.value);
      return;
    }

    if (action === "toggle-placement") {
      const checkedIds = Array.from(root.querySelectorAll('input[data-action="toggle-placement"]:checked')).map((input) => input.value);
      updatePlacementSelection(checkedIds);
      return;
    }

    if (action === "toggle-dv360-enabled") {
      updateDv360Enabled(actionTarget.dataset.placementId, actionTarget.checked);
      return;
    }

    if (action === "select-dv-advertiser") {
      updateDv360Row(actionTarget.dataset.placementId, actionTarget.dataset.rowId, { dvAdvertiserId: actionTarget.value });
      return;
    }

    if (action === "select-dv-campaign") {
      updateDv360Row(actionTarget.dataset.placementId, actionTarget.dataset.rowId, { dvCampaignId: actionTarget.value });
      return;
    }

    if (action === "select-dv-line-items") {
      const lineItemIds = Array.from(actionTarget.selectedOptions).map((option) => option.value);
      updateDv360Row(actionTarget.dataset.placementId, actionTarget.dataset.rowId, { lineItemIds });
      return;
    }

    if (action === "toggle-ad-automation") {
      updateAdBlueprint(actionTarget.dataset.placementId, actionTarget.dataset.adId, { adAutomationEnabled: actionTarget.checked });
      return;
    }

    if (action === "select-ad-producer") {
      updateAdBlueprint(actionTarget.dataset.placementId, actionTarget.dataset.adId, { producerId: actionTarget.value });
      return;
    }

    if (action === "select-ad-type") {
      updateAdBlueprint(actionTarget.dataset.placementId, actionTarget.dataset.adId, { adType: actionTarget.value });
      return;
    }

    if (action === "select-standard-media-source") {
      updateAdBlueprint(actionTarget.dataset.placementId, actionTarget.dataset.adId, {
        standardDisplayConfig: {
          mediaSource: actionTarget.value,
          templateId: "",
          uploadedBundleId: "",
          uploadedBundleName: "",
        },
      });
      return;
    }

    if (action === "select-standard-template") {
      updateAdBlueprint(actionTarget.dataset.placementId, actionTarget.dataset.adId, { standardDisplayConfig: { templateId: actionTarget.value } });
      return;
    }

    if (action === "select-upload-format") {
      updateAdBlueprint(actionTarget.dataset.placementId, actionTarget.dataset.adId, { standardDisplayConfig: { uploadedFormat: actionTarget.value } });
      return;
    }

    if (action === "select-landing-mode") {
      updateAdBlueprint(actionTarget.dataset.placementId, actionTarget.dataset.adId, { standardDisplayConfig: { landingPageMode: actionTarget.value } });
      return;
    }

    if (action === "select-url-mode") {
      updateAdBlueprint(actionTarget.dataset.placementId, actionTarget.dataset.adId, { standardDisplayConfig: { urlParameterMode: actionTarget.value } });
      return;
    }

    if (action === "select-studio-advertiser") {
      updateAdBlueprint(actionTarget.dataset.placementId, actionTarget.dataset.adId, { richMediaDcoConfig: { studioAdvertiserId: actionTarget.value } });
      return;
    }

    if (action === "select-studio-campaign") {
      updateAdBlueprint(actionTarget.dataset.placementId, actionTarget.dataset.adId, { richMediaDcoConfig: { studioCampaignId: actionTarget.value } });
      return;
    }

    if (action === "select-audience-feed-field") {
      updateAudienceMapping(actionTarget.dataset.placementId, actionTarget.dataset.adId, actionTarget.dataset.lineItemId, { feedField: actionTarget.value });
      return;
    }

    if (action === "select-audience-operator") {
      updateAudienceMapping(actionTarget.dataset.placementId, actionTarget.dataset.adId, actionTarget.dataset.lineItemId, { operator: actionTarget.value });
      return;
    }

    if (action === "toggle-dco-creative") {
      const selectedTemplateIds = Array.from(
        root.querySelectorAll(`input[data-action="toggle-dco-creative"][data-placement-id="${actionTarget.dataset.placementId}"][data-ad-id="${actionTarget.dataset.adId}"]:checked:not(:disabled)`)
      ).map((input) => input.value);
      updateAdBlueprint(actionTarget.dataset.placementId, actionTarget.dataset.adId, { richMediaDcoConfig: { htmlCreativeTemplateIds: selectedTemplateIds } });
      return;
    }

    if (action === "select-dco-landing-mode") {
      updateAdBlueprint(actionTarget.dataset.placementId, actionTarget.dataset.adId, { richMediaDcoConfig: { landingPageMode: actionTarget.value } });
      return;
    }

    if (action === "select-dco-url-mode") {
      updateAdBlueprint(actionTarget.dataset.placementId, actionTarget.dataset.adId, { richMediaDcoConfig: { urlParameterMode: actionTarget.value } });
      return;
    }

    if (action === "edit-ad-name") {
      updateAdBlueprint(actionTarget.dataset.placementId, actionTarget.dataset.adId, { name: actionTarget.value });
      return;
    }

    if (action === "edit-upload-name") {
      updateAdBlueprint(actionTarget.dataset.placementId, actionTarget.dataset.adId, {
        standardDisplayConfig: {
          uploadedBundleName: actionTarget.value,
          uploadedBundleId: actionTarget.value ? "prototype-upload-bundle" : "",
        },
      });
      return;
    }

    if (action === "edit-landing-page") {
      updateAdBlueprint(actionTarget.dataset.placementId, actionTarget.dataset.adId, { standardDisplayConfig: { landingPageValue: actionTarget.value } });
      return;
    }

    if (action === "edit-url-parameters") {
      updateAdBlueprint(actionTarget.dataset.placementId, actionTarget.dataset.adId, { standardDisplayConfig: { urlParameterValue: actionTarget.value } });
      return;
    }

    if (action === "edit-dco-landing-page") {
      updateAdBlueprint(actionTarget.dataset.placementId, actionTarget.dataset.adId, { richMediaDcoConfig: { landingPageValue: actionTarget.value } });
      return;
    }

    if (action === "edit-dco-url-parameters") {
      updateAdBlueprint(actionTarget.dataset.placementId, actionTarget.dataset.adId, { richMediaDcoConfig: { urlParameterValue: actionTarget.value } });
      return;
    }

    if (action === "edit-audience-value") {
      updateAudienceMapping(actionTarget.dataset.placementId, actionTarget.dataset.adId, actionTarget.dataset.lineItemId, { value: actionTarget.value });
    }
  }

  function handleKeydown(event) {
    if (event.key === "Escape" && state.createOpen) {
      state.createOpen = false;
      state.createError = "";
      render();
    }
  }

  function render() {
    root.innerHTML = state.view === "detail" ? renderDetailView() : renderListView();
  }

  root.addEventListener("click", handleClick);
  root.addEventListener("input", handleInput);
  root.addEventListener("change", handleChange);
  document.addEventListener("keydown", handleKeydown);
  render();
})();
