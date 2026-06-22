(function () {
  const fixtures = window.cm360WorkspacePrototypeFixtures || {};
  let prototypeWorkspaces = clone(fixtures.workspaces || []);

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function nowId(prefix) {
    return `${prefix}-${Date.now()}`;
  }

  function cmAdvertiserName(id) {
    return (fixtures.cm360Advertisers || []).find((advertiser) => advertiser.id === id)?.name || "CM360 Advertiser not selected";
  }

  function cmCampaignName(id) {
    return (fixtures.cm360Campaigns || []).find((campaign) => campaign.id === id)?.name || "CM360 Campaign not selected";
  }

  function cmCampaignById(id) {
    return (fixtures.cm360Campaigns || []).find((campaign) => campaign.id === id) || null;
  }

  function placementById(id) {
    return (fixtures.cm360Placements || []).find((placement) => placement.id === id) || null;
  }

  function dvCampaignById(id) {
    return (fixtures.dv360Campaigns || []).find((campaign) => campaign.id === id) || null;
  }

  function lineItemsForCampaign(dvCampaignId) {
    return (fixtures.dv360LineItems || []).filter((lineItem) => lineItem.campaignId === dvCampaignId);
  }

  function studioAdvertiserForCmAdvertiser(cmAdvertiserId) {
    return (fixtures.studioAdvertisers || []).find((advertiser) => advertiser.cmAdvertiserId === cmAdvertiserId) || null;
  }

  function studioCampaignById(id) {
    return (fixtures.studioCampaigns || []).find((campaign) => campaign.id === id) || null;
  }

  function richMediaTemplateById(templateId) {
    return (fixtures.creativeTemplates || []).find((template) => template.id === templateId && template.type === "rich_media_dco") || null;
  }

  function templateById(templateId) {
    return (fixtures.creativeTemplates || []).find((template) => template.id === templateId) || null;
  }

  function placementFormats(placement) {
    const cmPlacement = placementById(placement?.cmPlacementId);
    return cmPlacement?.formats || placement?.formats || [];
  }

  function templateSupportedByPlacement(templateId, placement) {
    const template = templateById(templateId);
    const formats = placementFormats(placement);
    return Boolean(template && (!formats.length || formats.includes(template.format)));
  }

  function findWorkspacePlacement(workspaceId, placementId) {
    const workspace = prototypeWorkspaces.find((item) => item.id === workspaceId);
    if (!workspace) return {};
    const placement = (workspace.placementsTree || []).find((item) => item.id === placementId);
    return { workspace, placement };
  }

  function findWorkspaceAdBlueprint(workspaceId, placementId, adBlueprintId) {
    const { workspace, placement } = findWorkspacePlacement(workspaceId, placementId);
    if (!workspace || !placement) return {};
    const adBlueprint = (placement.adBlueprints || []).find((item) => item.id === adBlueprintId);
    return { workspace, placement, adBlueprint };
  }

  function countAdBlueprints(workspace) {
    return (workspace.placementsTree || []).reduce((total, placement) => total + (placement.adBlueprints || []).length, 0);
  }

  function getValidationIssues(workspace) {
    const validation = window.cm360WorkspacePrototypeValidation;
    if (!validation || typeof validation.validatePrototypeWorkspace !== "function") return [];
    return validation.validatePrototypeWorkspace(workspace, getPrototypeReferenceData()).filter((issue) => issue.severity === "blocking");
  }

  function hydrateWorkspace(workspace) {
    const hydrated = clone(workspace);
    hydrated.advertiser = cmAdvertiserName(hydrated.cmAdvertiserId);
    hydrated.campaign = cmCampaignName(hydrated.cmCampaignId);
    hydrated.placements = `${(hydrated.placementsTree || []).length} selected`;
    hydrated.adBlueprints = String(countAdBlueprints(hydrated));
    hydrated.validationIssues = getValidationIssues(hydrated).length;

    (hydrated.placementsTree || []).forEach((placement) => {
      const cmPlacement = placementById(placement.cmPlacementId);
      placement.name = placement.name || cmPlacement?.name || "Unnamed placement";
      placement.formats = cmPlacement?.formats || placement.formats || [];
      placement.formatSummary = Array.isArray(placement.formats) ? placement.formats.join(", ") : placement.formats;
      placement.dv360Enabled = Boolean(placement.dv360Enabled ?? (placement.dv360Connections || []).some((connection) => connection.enabled));
      placement.dv360Connections = (placement.dv360Connections || []).map((connection) => ({ enabled: true, lineItemIds: [], ...connection }));
      (placement.adBlueprints || []).forEach((adBlueprint) => {
        if (adBlueprint.standardDisplayConfig) {
          adBlueprint.standardDisplayConfig = {
            mediaSource: "template",
            templateId: "",
            uploadedBundleId: "",
            uploadedBundleName: "",
            uploadedFormat: "",
            landingPageMode: "static",
            landingPageValue: "",
            urlParameterMode: "static",
            urlParameterValue: "",
            ...adBlueprint.standardDisplayConfig,
          };
        }
        if (adBlueprint.richMediaDcoConfig) {
          adBlueprint.richMediaDcoConfig = {
            studioAdvertiserId: "",
            studioCampaignId: "",
            dataSourceId: "",
            htmlCreatives: [],
            landingPageMode: "static",
            landingPageValue: "",
            urlParameterMode: "dynamic",
            urlParameterValue: "",
            ...adBlueprint.richMediaDcoConfig,
          };
        }
        sanitizeAdBlueprintCompatibility(adBlueprint, placement);
        syncStandardDisplayFormats(adBlueprint);
        syncRichMediaDcoFormats(adBlueprint);
        adBlueprint.formatSummary = Array.isArray(adBlueprint.selectedFormats) ? adBlueprint.selectedFormats.join(", ") : adBlueprint.formatSummary || "";
      });
    });

    return hydrated;
  }

  function getPrototypeReferenceData() {
    return {
      accountState: clone(fixtures.accountState || {}),
      cm360Advertisers: clone(fixtures.cm360Advertisers || []),
      cm360Campaigns: clone(fixtures.cm360Campaigns || []),
      cm360Placements: clone(fixtures.cm360Placements || []),
      dv360Advertisers: clone(fixtures.dv360Advertisers || []),
      dv360Campaigns: clone(fixtures.dv360Campaigns || []),
      dv360LineItems: clone(fixtures.dv360LineItems || []),
      producers: clone(fixtures.producers || []),
      producerFeedFields: clone(fixtures.producerFeedFields || []),
      producerVariants: clone(fixtures.producerVariants || []),
      audienceMappingSuggestions: clone(fixtures.audienceMappingSuggestions || []),
      studioProfileMappings: clone(fixtures.studioProfileMappings || []),
      creativeTemplates: clone(fixtures.creativeTemplates || []),
      dataSources: clone(fixtures.dataSources || []),
      studioAdvertisers: clone(fixtures.studioAdvertisers || []),
      studioCampaigns: clone(fixtures.studioCampaigns || []),
    };
  }

  function getPrototypeWorkspaces() {
    return prototypeWorkspaces.map(hydrateWorkspace);
  }

  function getPrototypeWorkspace(workspaceId) {
    const workspace = prototypeWorkspaces.find((item) => item.id === workspaceId);
    return workspace ? hydrateWorkspace(workspace) : null;
  }

  function createPrototypeWorkspace(input) {
    const workspace = {
      id: nowId("cm360-workspace"),
      name: String(input?.name || "").trim(),
      status: "Draft",
      statusStyle: "gray",
      autosaveStatus: "saved",
      updatedAt: "Saved just now",
      owner: "Media Ops",
      cmAdvertiserId: "",
      cmCampaignId: "",
      campaignBlueprint: {
        id: "campaign-blueprint",
        name: "",
        status: "Needs setup",
        statusStyle: "yellow",
      },
      placementsTree: [],
      publishingStatus: {
        status: "not_started",
        steps: [
          { stepId: "studio_profile", target: "google_studio", status: "not_started" },
          { stepId: "cm360", target: "cm360", status: "not_started" },
          { stepId: "dv360", target: "dv360", status: "not_started" },
        ],
      },
    };
    prototypeWorkspaces.unshift(workspace);
    return hydrateWorkspace(workspace);
  }

  function createPlacementFromCmPlacement(cmPlacement, existingPlacement) {
    return {
      ...(existingPlacement || {}),
      id: existingPlacement?.id || `placement-${cmPlacement.id.replace(/^cmpl-/, "")}`,
      cmPlacementId: cmPlacement.id,
      name: cmPlacement.name,
      status: existingPlacement?.status || "Needs setup",
      statusStyle: existingPlacement?.statusStyle || "yellow",
      dv360Enabled: Boolean(existingPlacement?.dv360Enabled ?? (existingPlacement?.dv360Connections || []).some((connection) => connection.enabled)),
      dv360Connections: existingPlacement?.dv360Connections || [],
      adBlueprints: existingPlacement?.adBlueprints || [],
    };
  }

  function updatePrototypeCampaign(workspaceId, input) {
    const workspace = prototypeWorkspaces.find((item) => item.id === workspaceId);
    if (!workspace) return null;

    const nextAdvertiserId = String(input?.cmAdvertiserId || "");
    let nextCampaignId = String(input?.cmCampaignId || "");
    const selectedCampaign = cmCampaignById(nextCampaignId);

    if (!nextAdvertiserId || (selectedCampaign && selectedCampaign.advertiserId !== nextAdvertiserId)) {
      nextCampaignId = "";
    }

    const previousCampaignId = workspace.cmCampaignId;
    workspace.cmAdvertiserId = nextAdvertiserId;
    workspace.cmCampaignId = nextCampaignId;
    workspace.campaignBlueprint = {
      ...(workspace.campaignBlueprint || { id: "campaign-blueprint" }),
      name: nextCampaignId ? cmCampaignName(nextCampaignId) : "",
      status: nextAdvertiserId && nextCampaignId ? "Complete" : "Needs setup",
      statusStyle: nextAdvertiserId && nextCampaignId ? "green" : "yellow",
    };

    if (!nextCampaignId || previousCampaignId !== nextCampaignId) {
      workspace.placementsTree = [];
    }

    workspace.updatedAt = "Saved just now";
    return hydrateWorkspace(workspace);
  }

  function updatePrototypePlacements(workspaceId, cmPlacementIds) {
    const workspace = prototypeWorkspaces.find((item) => item.id === workspaceId);
    if (!workspace) return null;

    const selectedIds = new Set(cmPlacementIds || []);
    const existingByCmPlacementId = new Map((workspace.placementsTree || []).map((placement) => [placement.cmPlacementId, placement]));
    const selectedPlacements = (fixtures.cm360Placements || [])
      .filter((placement) => selectedIds.has(placement.id) && placement.campaignId === workspace.cmCampaignId)
      .map((placement) => createPlacementFromCmPlacement(placement, existingByCmPlacementId.get(placement.id)));

    workspace.placementsTree = selectedPlacements;
    workspace.updatedAt = "Saved just now";
    return hydrateWorkspace(workspace);
  }

  function createEmptyDv360Connection() {
    return {
      id: nowId("dvconn"),
      enabled: true,
      dvAdvertiserId: "",
      dvCampaignId: "",
      lineItemIds: [],
    };
  }

  function updatePrototypePlacementDv360Enabled(workspaceId, placementId, enabled) {
    const { workspace, placement } = findWorkspacePlacement(workspaceId, placementId);
    if (!workspace || !placement) return null;
    placement.dv360Enabled = Boolean(enabled);
    placement.dv360Connections = placement.dv360Connections || [];
    if (placement.dv360Enabled && !placement.dv360Connections.length) {
      placement.dv360Connections.push(createEmptyDv360Connection());
    }
    workspace.updatedAt = "Saved just now";
    return hydrateWorkspace(workspace);
  }

  function addPrototypeDv360MappingRow(workspaceId, placementId) {
    const { workspace, placement } = findWorkspacePlacement(workspaceId, placementId);
    if (!workspace || !placement) return null;
    placement.dv360Enabled = true;
    placement.dv360Connections = placement.dv360Connections || [];
    placement.dv360Connections.push(createEmptyDv360Connection());
    workspace.updatedAt = "Saved just now";
    return hydrateWorkspace(workspace);
  }

  function updatePrototypeDv360MappingRow(workspaceId, placementId, rowId, input) {
    const { workspace, placement } = findWorkspacePlacement(workspaceId, placementId);
    if (!workspace || !placement) return null;
    const row = (placement.dv360Connections || []).find((connection) => connection.id === rowId);
    if (!row) return hydrateWorkspace(workspace);

    if (Object.prototype.hasOwnProperty.call(input || {}, "dvAdvertiserId")) {
      row.dvAdvertiserId = String(input.dvAdvertiserId || "");
      const currentCampaign = dvCampaignById(row.dvCampaignId);
      if (!row.dvAdvertiserId || (currentCampaign && currentCampaign.advertiserId !== row.dvAdvertiserId)) {
        row.dvCampaignId = "";
        row.lineItemIds = [];
      }
    }

    if (Object.prototype.hasOwnProperty.call(input || {}, "dvCampaignId")) {
      row.dvCampaignId = String(input.dvCampaignId || "");
      row.lineItemIds = [];
    }

    if (Object.prototype.hasOwnProperty.call(input || {}, "lineItemIds")) {
      const validLineItems = new Set(lineItemsForCampaign(row.dvCampaignId).map((lineItem) => lineItem.id));
      row.lineItemIds = (input.lineItemIds || []).filter((lineItemId) => validLineItems.has(lineItemId));
    }

    row.enabled = true;
    workspace.updatedAt = "Saved just now";
    return hydrateWorkspace(workspace);
  }

  function removePrototypeDv360MappingRow(workspaceId, placementId, rowId) {
    const { workspace, placement } = findWorkspacePlacement(workspaceId, placementId);
    if (!workspace || !placement) return null;
    placement.dv360Connections = (placement.dv360Connections || []).filter((connection) => connection.id !== rowId);
    workspace.updatedAt = "Saved just now";
    return hydrateWorkspace(workspace);
  }

  function defaultStandardDisplayConfig(format) {
    return {
      mediaSource: "template",
      templateId: "",
      uploadedBundleId: "",
      uploadedBundleName: "",
      uploadedFormat: format || "",
      landingPageMode: "static",
      landingPageValue: "https://example.com",
      urlParameterMode: "static",
      urlParameterValue: "utm_source=cm360&utm_medium=display",
    };
  }

  function defaultRichMediaDcoConfig(cmAdvertiserId) {
    const studioAdvertiser = studioAdvertiserForCmAdvertiser(cmAdvertiserId);
    return {
      studioAdvertiserId: studioAdvertiser?.id || "",
      studioCampaignId: "",
      dataSourceId: "",
      htmlCreatives: [],
      landingPageMode: "static",
      landingPageValue: "https://example.com",
      urlParameterMode: "dynamic",
      urlParameterValue: "{{studio.url_parameters}}",
    };
  }

  function createEmptyAdBlueprint(placement) {
    const defaultFormat = (placement.formats || placementById(placement.cmPlacementId)?.formats || [])[0] || "";
    return {
      id: nowId("ad"),
      name: "Untitled Ad Blueprint",
      status: "Draft",
      statusStyle: "gray",
      adAutomationEnabled: false,
      producerId: "",
      adType: "standard_display",
      selectedFormats: defaultFormat ? [defaultFormat] : [],
      standardDisplayConfig: defaultStandardDisplayConfig(defaultFormat),
      richMediaDcoConfig: null,
      audienceMappings: [],
      studioProfileMappings: [],
      studioProfileConnection: null,
    };
  }

  function sanitizeAdBlueprintCompatibility(adBlueprint, placement) {
    const formats = placementFormats(placement);
    if (!formats.length) return;

    if (adBlueprint.adType === "standard_display") {
      const config = adBlueprint.standardDisplayConfig || {};
      const template = templateById(config.templateId);
      if (config.mediaSource === "template" && template && !formats.includes(template.format)) {
        config.templateId = "";
      }
      if (config.mediaSource === "upload" && config.uploadedFormat && !formats.includes(config.uploadedFormat)) {
        config.uploadedFormat = "";
      }
      adBlueprint.standardDisplayConfig = config;
    }

    if (adBlueprint.adType === "rich_media_dco") {
      const config = adBlueprint.richMediaDcoConfig || {};
      config.htmlCreatives = (config.htmlCreatives || []).filter((creative) => formats.includes(creative.format));
      adBlueprint.richMediaDcoConfig = config;
    }
  }

  function syncStandardDisplayFormats(adBlueprint) {
    if (adBlueprint.adType !== "standard_display") return;
    const config = adBlueprint.standardDisplayConfig || {};
    const template = (fixtures.creativeTemplates || []).find((item) => item.id === config.templateId);
    if (config.mediaSource === "template" && template?.format) {
      adBlueprint.selectedFormats = [template.format];
      return;
    }
    if (config.mediaSource === "upload" && config.uploadedFormat) {
      adBlueprint.selectedFormats = [config.uploadedFormat];
      return;
    }
    adBlueprint.selectedFormats = [];
  }

  function syncRichMediaDcoFormats(adBlueprint) {
    if (adBlueprint.adType !== "rich_media_dco") return;
    adBlueprint.selectedFormats = (adBlueprint.richMediaDcoConfig?.htmlCreatives || []).map((creative) => creative.format).filter(Boolean);
  }

  function addPrototypeAdBlueprint(workspaceId, placementId) {
    const { workspace, placement } = findWorkspacePlacement(workspaceId, placementId);
    if (!workspace || !placement) return null;
    placement.adBlueprints = placement.adBlueprints || [];
    const adBlueprint = createEmptyAdBlueprint(placement);
    placement.adBlueprints.push(adBlueprint);
    workspace.updatedAt = "Saved just now";
    return hydrateWorkspace(workspace);
  }

  function duplicatePrototypeAdBlueprint(workspaceId, placementId, adBlueprintId) {
    const { workspace, placement, adBlueprint } = findWorkspaceAdBlueprint(workspaceId, placementId, adBlueprintId);
    if (!workspace || !placement || !adBlueprint) return null;
    const duplicate = clone(adBlueprint);
    duplicate.id = nowId("ad-copy");
    duplicate.name = `${adBlueprint.name || "Ad Blueprint"} copy`;
    duplicate.status = "Draft";
    duplicate.statusStyle = "gray";
    placement.adBlueprints.push(duplicate);
    workspace.updatedAt = "Saved just now";
    return hydrateWorkspace(workspace);
  }

  function deletePrototypeAdBlueprint(workspaceId, placementId, adBlueprintId) {
    const { workspace, placement } = findWorkspacePlacement(workspaceId, placementId);
    if (!workspace || !placement) return null;
    placement.adBlueprints = (placement.adBlueprints || []).filter((adBlueprint) => adBlueprint.id !== adBlueprintId);
    workspace.updatedAt = "Saved just now";
    return hydrateWorkspace(workspace);
  }

  function updatePrototypeAdBlueprint(workspaceId, placementId, adBlueprintId, input) {
    const { workspace, placement, adBlueprint } = findWorkspaceAdBlueprint(workspaceId, placementId, adBlueprintId);
    if (!workspace || !placement || !adBlueprint) return null;

    if (Object.prototype.hasOwnProperty.call(input || {}, "name")) {
      adBlueprint.name = String(input.name || "");
    }
    if (Object.prototype.hasOwnProperty.call(input || {}, "adAutomationEnabled")) {
      adBlueprint.adAutomationEnabled = Boolean(input.adAutomationEnabled);
      if (!adBlueprint.adAutomationEnabled) adBlueprint.producerId = "";
    }
    if (Object.prototype.hasOwnProperty.call(input || {}, "producerId")) {
      adBlueprint.producerId = String(input.producerId || "");
    }
    if (Object.prototype.hasOwnProperty.call(input || {}, "adType")) {
      adBlueprint.adType = String(input.adType || "");
      if (adBlueprint.adType === "standard_display" && !adBlueprint.standardDisplayConfig) {
        adBlueprint.standardDisplayConfig = defaultStandardDisplayConfig((adBlueprint.selectedFormats || [])[0]);
      }
      if (adBlueprint.adType === "rich_media_dco") {
        adBlueprint.standardDisplayConfig = null;
        if (!adBlueprint.richMediaDcoConfig) {
          adBlueprint.richMediaDcoConfig = defaultRichMediaDcoConfig(workspace.cmAdvertiserId);
        }
      }
    }
    if (Object.prototype.hasOwnProperty.call(input || {}, "standardDisplayConfig")) {
      adBlueprint.standardDisplayConfig = {
        ...defaultStandardDisplayConfig((adBlueprint.selectedFormats || [])[0]),
        ...(adBlueprint.standardDisplayConfig || {}),
        ...(input.standardDisplayConfig || {}),
      };
    }
    if (Object.prototype.hasOwnProperty.call(input || {}, "richMediaDcoConfig")) {
      const currentConfig = {
        ...defaultRichMediaDcoConfig(workspace.cmAdvertiserId),
        ...(adBlueprint.richMediaDcoConfig || {}),
      };
      const nextConfig = { ...(input.richMediaDcoConfig || {}) };
      if (Object.prototype.hasOwnProperty.call(nextConfig, "studioAdvertiserId")) {
        const currentStudioCampaign = studioCampaignById(currentConfig.studioCampaignId);
        if (!nextConfig.studioAdvertiserId || (currentStudioCampaign && currentStudioCampaign.studioAdvertiserId !== nextConfig.studioAdvertiserId)) {
          nextConfig.studioCampaignId = "";
        }
      }
      if (Object.prototype.hasOwnProperty.call(nextConfig, "htmlCreativeTemplateIds")) {
        nextConfig.htmlCreatives = (nextConfig.htmlCreativeTemplateIds || [])
          .map((templateId) => richMediaTemplateById(templateId))
          .filter((template) => templateSupportedByPlacement(template?.id, placement))
          .filter(Boolean)
          .map((template) => ({
            id: `html-${template.id}`,
            templateId: template.id,
            format: template.format,
          }));
        delete nextConfig.htmlCreativeTemplateIds;
      }
      adBlueprint.richMediaDcoConfig = {
        ...currentConfig,
        ...nextConfig,
      };
    }
    if (Object.prototype.hasOwnProperty.call(input || {}, "audienceMappings")) {
      adBlueprint.audienceMappings = input.audienceMappings || [];
    }
    if (Object.prototype.hasOwnProperty.call(input || {}, "studioProfileMappings")) {
      adBlueprint.studioProfileMappings = input.studioProfileMappings || [];
    }
    sanitizeAdBlueprintCompatibility(adBlueprint, placement);
    syncStandardDisplayFormats(adBlueprint);
    syncRichMediaDcoFormats(adBlueprint);
    workspace.updatedAt = "Saved just now";
    return hydrateWorkspace(workspace);
  }

  function updatePrototypeAudienceMapping(workspaceId, placementId, adBlueprintId, lineItemId, input) {
    const { workspace, adBlueprint } = findWorkspaceAdBlueprint(workspaceId, placementId, adBlueprintId);
    if (!workspace || !adBlueprint) return null;
    const mappings = adBlueprint.audienceMappings || [];
    const existingIndex = mappings.findIndex((mapping) => mapping.dvLineItemId === lineItemId);
    const current = existingIndex >= 0 ? mappings[existingIndex] : { dvLineItemId: lineItemId, feedField: "", operator: "", value: "" };
    const next = { ...current, ...(input || {}) };
    if (next.operator === "is_not_empty") next.value = "";
    if (existingIndex >= 0) mappings[existingIndex] = next;
    else mappings.push(next);
    adBlueprint.audienceMappings = mappings;
    workspace.updatedAt = "Saved just now";
    return hydrateWorkspace(workspace);
  }

  function clearPrototypeAudienceMapping(workspaceId, placementId, adBlueprintId, lineItemId) {
    const { workspace, adBlueprint } = findWorkspaceAdBlueprint(workspaceId, placementId, adBlueprintId);
    if (!workspace || !adBlueprint) return null;
    adBlueprint.audienceMappings = (adBlueprint.audienceMappings || []).filter((mapping) => mapping.dvLineItemId !== lineItemId);
    workspace.updatedAt = "Saved just now";
    return hydrateWorkspace(workspace);
  }

  function applyPrototypeAudienceSuggestion(workspaceId, placementId, adBlueprintId, lineItemId) {
    const suggestion = (fixtures.audienceMappingSuggestions || []).find((item) => item.lineItemId === lineItemId);
    return updatePrototypeAudienceMapping(workspaceId, placementId, adBlueprintId, lineItemId, suggestion || {});
  }

  function markPrototypeStudioProfileMappingReviewed(workspaceId, placementId, adBlueprintId, rowId) {
    const { workspace, adBlueprint } = findWorkspaceAdBlueprint(workspaceId, placementId, adBlueprintId);
    if (!workspace || !adBlueprint) return null;
    const defaults = clone(fixtures.studioProfileMappings || []);
    const existing = adBlueprint.studioProfileMappings?.length ? adBlueprint.studioProfileMappings : defaults;
    adBlueprint.studioProfileMappings = existing.map((row) => (row.id === rowId ? { ...row, status: "Complete" } : row));
    workspace.updatedAt = "Saved just now";
    return hydrateWorkspace(workspace);
  }

  function updatePrototypePublishingStatus(workspaceId, publishingStatus, options) {
    const workspace = prototypeWorkspaces.find((item) => item.id === workspaceId);
    if (!workspace) return null;
    workspace.publishingStatus = clone(publishingStatus || {});
    if (options?.published) {
      workspace.publishingStatus.status = "published";
      workspace.status = "Published";
      workspace.statusStyle = "green";
      workspace.updatedAt = "Published just now";
      workspace.campaignBlueprint = {
        ...(workspace.campaignBlueprint || {}),
        status: "Published",
        statusStyle: "green",
      };
      (workspace.placementsTree || []).forEach((placement) => {
        placement.status = "Published";
        placement.statusStyle = "green";
        (placement.adBlueprints || []).forEach((adBlueprint) => {
          adBlueprint.status = "Published";
          adBlueprint.statusStyle = "green";
        });
      });
    } else {
      workspace.updatedAt = "Publishing simulation running";
    }
    return hydrateWorkspace(workspace);
  }

  function deletePrototypeWorkspace(workspaceId) {
    const existing = prototypeWorkspaces.find((workspace) => workspace.id === workspaceId);
    prototypeWorkspaces = prototypeWorkspaces.filter((workspace) => workspace.id !== workspaceId);
    return Boolean(existing);
  }

  function getPrototypeCm360Advertisers() {
    return clone(fixtures.cm360Advertisers || []).filter((advertiser) => advertiser.id !== "cmadv-unselected");
  }

  function getPrototypeCm360Campaigns(cmAdvertiserId) {
    return clone(fixtures.cm360Campaigns || []).filter((campaign) => campaign.advertiserId === cmAdvertiserId);
  }

  function getPrototypeCm360Placements(cmCampaignId) {
    return clone(fixtures.cm360Placements || []).filter((placement) => placement.campaignId === cmCampaignId);
  }

  function getPrototypeConnectedDv360Advertisers(cmAdvertiserId) {
    return clone(fixtures.dv360Advertisers || []).filter((advertiser) => (advertiser.connectedCmAdvertiserIds || []).includes(cmAdvertiserId));
  }

  function getPrototypeDv360Campaigns(dvAdvertiserId) {
    return clone(fixtures.dv360Campaigns || []).filter((campaign) => campaign.advertiserId === dvAdvertiserId);
  }

  function getPrototypeDv360LineItems(dvCampaignId) {
    return clone(fixtures.dv360LineItems || []).filter((lineItem) => lineItem.campaignId === dvCampaignId);
  }

  function getPrototypeStudioAdvertiser(cmAdvertiserId) {
    return clone(studioAdvertiserForCmAdvertiser(cmAdvertiserId));
  }

  function getPrototypeStudioAdvertisers(cmAdvertiserId) {
    return clone(fixtures.studioAdvertisers || []).filter((advertiser) => advertiser.cmAdvertiserId === cmAdvertiserId);
  }

  function getPrototypeStudioCampaigns(studioAdvertiserId) {
    return clone(fixtures.studioCampaigns || []).filter((campaign) => campaign.studioAdvertiserId === studioAdvertiserId);
  }

  function getPrototypeProducers() {
    return clone(fixtures.producers || []);
  }

  function getPrototypeProducerFeedFields() {
    return clone(fixtures.producerFeedFields || []);
  }

  function getPrototypeProducerVariants() {
    return clone(fixtures.producerVariants || []);
  }

  function getPrototypeAudienceMappingSuggestions() {
    return clone(fixtures.audienceMappingSuggestions || []);
  }

  function getPrototypeStudioProfileMappings() {
    return clone(fixtures.studioProfileMappings || []);
  }

  function getPrototypeStandardDisplayTemplates() {
    return clone(fixtures.creativeTemplates || []).filter((template) => template.type === "standard_display");
  }

  function getPrototypeRichMediaDcoTemplates() {
    return clone(fixtures.creativeTemplates || []).filter((template) => template.type === "rich_media_dco");
  }

  function getPrototypeDataSources() {
    return clone(fixtures.dataSources || []);
  }

  window.cm360WorkspacePrototypeAdapter = {
    getPrototypeReferenceData,
    getPrototypeWorkspaces,
    getPrototypeWorkspace,
    createPrototypeWorkspace,
    updatePrototypeCampaign,
    updatePrototypePlacements,
    updatePrototypePlacementDv360Enabled,
    addPrototypeDv360MappingRow,
    updatePrototypeDv360MappingRow,
    removePrototypeDv360MappingRow,
    addPrototypeAdBlueprint,
    duplicatePrototypeAdBlueprint,
    deletePrototypeAdBlueprint,
    updatePrototypeAdBlueprint,
    updatePrototypeAudienceMapping,
    clearPrototypeAudienceMapping,
    applyPrototypeAudienceSuggestion,
    markPrototypeStudioProfileMappingReviewed,
    updatePrototypePublishingStatus,
    deletePrototypeWorkspace,
    getPrototypeCm360Advertisers,
    getPrototypeCm360Campaigns,
    getPrototypeCm360Placements,
    getPrototypeConnectedDv360Advertisers,
    getPrototypeDv360Campaigns,
    getPrototypeDv360LineItems,
    getPrototypeStudioAdvertiser,
    getPrototypeStudioAdvertisers,
    getPrototypeStudioCampaigns,
    getPrototypeProducers,
    getPrototypeProducerFeedFields,
    getPrototypeProducerVariants,
    getPrototypeAudienceMappingSuggestions,
    getPrototypeStudioProfileMappings,
    getPrototypeStandardDisplayTemplates,
    getPrototypeRichMediaDcoTemplates,
    getPrototypeDataSources,
  };
})();
