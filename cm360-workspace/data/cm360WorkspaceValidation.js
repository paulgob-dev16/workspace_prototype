(function () {
  const VALID_AUDIENCE_OPERATORS = ["equals", "contains", "starts_with", "is_not_empty"];

  function issue(id, severity, location, message, details) {
    return { id, severity, location, message, ...(details || {}) };
  }

  function placementDv360Enabled(placement) {
    return Boolean(placement.dv360Enabled ?? (placement.dv360Connections || []).some((connection) => connection.enabled));
  }

  function matchingVariantCount(referenceData, mapping) {
    const variants = referenceData.producerVariants || [];
    if (!mapping.feedField || !mapping.operator) return 0;
    return variants.filter((variant) => {
      const rawValue = variant[mapping.feedField];
      const value = String(rawValue || "").toLowerCase();
      const expected = String(mapping.value || "").toLowerCase();
      if (mapping.operator === "is_not_empty") return Boolean(rawValue);
      if (!expected) return false;
      if (mapping.operator === "equals") return value === expected;
      if (mapping.operator === "contains") return value.includes(expected);
      if (mapping.operator === "starts_with") return value.startsWith(expected);
      return false;
    }).length;
  }

  function placementFormats(referenceData, placement) {
    const cmPlacement = (referenceData.cm360Placements || []).find((item) => item.id === placement.cmPlacementId);
    return cmPlacement?.formats || placement.formats || [];
  }

  function validatePrototypeAccounts(workspace, referenceData) {
    const issues = [];
    const accountState = referenceData.accountState || {};
    if (!accountState.cm360Connected) {
      issues.push(issue("account-cm360-required", "blocking", "Account", "CM360 account must be connected."));
    }
    return issues;
  }

  function validatePrototypeCampaign(workspace, referenceData) {
    const issues = [];
    if (!workspace.cmAdvertiserId) {
      issues.push(issue("campaign-advertiser-required", "blocking", "Campaign", "CM360 Advertiser is required."));
    }
    if (!workspace.cmCampaignId) {
      issues.push(issue("campaign-campaign-required", "blocking", "Campaign", "CM360 Campaign is required."));
    }
    const campaign = (referenceData.cm360Campaigns || []).find((item) => item.id === workspace.cmCampaignId);
    if (workspace.cmAdvertiserId && campaign && campaign.advertiserId !== workspace.cmAdvertiserId) {
      issues.push(issue("campaign-advertiser-mismatch", "blocking", "Campaign", "CM360 Campaign must belong to the selected CM360 Advertiser."));
    }
    return issues;
  }

  function validatePrototypePlacements(workspace, referenceData) {
    const issues = [];
    const placements = workspace.placementsTree || [];
    if (!placements.length) {
      issues.push(issue("placement-required", "blocking", "Placement", "At least one CM360 Placement is required."));
    }
    placements.forEach((placement) => {
      const cmPlacement = (referenceData.cm360Placements || []).find((item) => item.id === placement.cmPlacementId);
      if (!cmPlacement) {
        issues.push(issue(`placement-missing-${placement.id}`, "blocking", "Placement", "Selected CM360 Placement was not found in prototype fixtures."));
        return;
      }
      if (workspace.cmCampaignId && cmPlacement.campaignId !== workspace.cmCampaignId) {
        issues.push(issue(`placement-campaign-${placement.id}`, "blocking", "Placement", "Placement must belong to the selected CM360 Campaign."));
      }
      if (!cmPlacement.formats || !cmPlacement.formats.length) {
        issues.push(issue(`placement-formats-${placement.id}`, "warning", "Placement", "Placement format information should be available."));
      }
    });
    return issues;
  }

  function validatePrototypeDv360(workspace, referenceData) {
    const issues = [];
    (workspace.placementsTree || []).forEach((placement) => {
      if (!placementDv360Enabled(placement)) return;
      const connections = placement.dv360Connections || [];
      if (!connections.length) {
        issues.push(issue(`dv-row-required-${placement.id}`, "blocking", "DV360", "At least one DV360 mapping row is required when DV360 is enabled."));
      }
      connections.forEach((connection) => {
        if (!connection.enabled) return;
        if (!connection.dvAdvertiserId) {
          issues.push(issue(`dv-advertiser-${connection.id}`, "blocking", "DV360", "DV360 Advertiser is required."));
        }
        const dvAdvertiser = (referenceData.dv360Advertisers || []).find((item) => item.id === connection.dvAdvertiserId);
        if (dvAdvertiser && workspace.cmAdvertiserId && !(dvAdvertiser.connectedCmAdvertiserIds || []).includes(workspace.cmAdvertiserId)) {
          issues.push(issue(`dv-advertiser-link-${connection.id}`, "blocking", "DV360", "DV360 Advertiser must be connected to the selected CM360 Advertiser."));
        }
        if (!connection.dvCampaignId) {
          issues.push(issue(`dv-campaign-${connection.id}`, "blocking", "DV360", "DV360 Campaign is required."));
        }
        if (!connection.lineItemIds || !connection.lineItemIds.length) {
          issues.push(issue(`dv-line-items-${connection.id}`, "blocking", "DV360", "At least one DV360 Line Item is required."));
        }
        const dvCampaign = (referenceData.dv360Campaigns || []).find((item) => item.id === connection.dvCampaignId);
        if (dvCampaign && connection.dvAdvertiserId && dvCampaign.advertiserId !== connection.dvAdvertiserId) {
          issues.push(issue(`dv-flow-${connection.id}`, "blocking", "DV360", "DV360 Campaign must belong to the selected DV360 Advertiser."));
        }
        (connection.lineItemIds || []).forEach((lineItemId) => {
          const lineItem = (referenceData.dv360LineItems || []).find((item) => item.id === lineItemId);
          if (!lineItem || (connection.dvCampaignId && lineItem.campaignId !== connection.dvCampaignId)) {
            issues.push(issue(`dv-line-item-flow-${connection.id}-${lineItemId}`, "blocking", "DV360", "DV360 Line Item must belong to the selected DV360 Campaign."));
          }
        });
      });
    });
    return issues;
  }

  function validatePrototypeAdBlueprints(workspace, referenceData) {
    const issues = [];
    (workspace.placementsTree || []).forEach((placement) => {
      const compatibleFormats = placementFormats(referenceData, placement);
      (placement.adBlueprints || []).forEach((adBlueprint) => {
        if (!adBlueprint.name) {
          issues.push(issue(`ad-name-${adBlueprint.id}`, "blocking", "Ad Blueprint", "Ad name is required."));
        }
        if (!adBlueprint.adType) {
          issues.push(issue(`ad-type-${adBlueprint.id}`, "blocking", "Ad Blueprint", "Ad type is required."));
        }
        if (adBlueprint.adAutomationEnabled && !adBlueprint.producerId) {
          issues.push(issue(`ad-producer-${adBlueprint.id}`, "blocking", "Ad Blueprint", "Producer is required when Ad Automation is on."));
        }
        if (adBlueprint.adType === "standard_display") {
          const config = adBlueprint.standardDisplayConfig || {};
          if (!config.templateId && !config.uploadedBundleId) {
            issues.push(issue(`standard-media-${adBlueprint.id}`, "blocking", "Ad Blueprint", "Standard Display requires either a template or desktop upload."));
          }
        }
        if (adBlueprint.adType === "rich_media_dco") {
          const config = adBlueprint.richMediaDcoConfig || {};
          if (!config.studioAdvertiserId) {
            issues.push(issue(`dco-studio-${adBlueprint.id}`, "blocking", "Studio Connection", "Rich Media DCO requires a Studio Advertiser."));
          }
          if (!config.studioCampaignId) {
            issues.push(issue(`dco-studio-campaign-${adBlueprint.id}`, "blocking", "Studio Connection", "Rich Media DCO requires a Studio Campaign."));
          }
          const studioAdvertiser = (referenceData.studioAdvertisers || []).find((item) => item.id === config.studioAdvertiserId);
          if (config.studioAdvertiserId && (!studioAdvertiser || studioAdvertiser.cmAdvertiserId !== workspace.cmAdvertiserId)) {
            issues.push(issue(`dco-studio-advertiser-flow-${adBlueprint.id}`, "blocking", "Studio Connection", "Studio Advertiser must belong to the selected CM360 Advertiser."));
          }
          const studioCampaign = (referenceData.studioCampaigns || []).find((item) => item.id === config.studioCampaignId);
          if (config.studioCampaignId && (!studioCampaign || (config.studioAdvertiserId && studioCampaign.studioAdvertiserId !== config.studioAdvertiserId))) {
            issues.push(issue(`dco-studio-campaign-flow-${adBlueprint.id}`, "blocking", "Studio Connection", "Studio Campaign must belong to the selected Studio Advertiser."));
          }
          if (!config.htmlCreatives || !config.htmlCreatives.length) {
            issues.push(issue(`dco-html-${adBlueprint.id}`, "blocking", "Ad Blueprint", "Rich Media DCO requires at least one HTML Creative."));
          }
          const formats = (config.htmlCreatives || []).map((creative) => creative.format).filter(Boolean);
          const duplicates = [...new Set(formats.filter((format, index) => formats.indexOf(format) !== index))];
          if (duplicates.length) {
            issues.push(issue(`dco-duplicate-formats-${adBlueprint.id}`, "blocking", "Ad Blueprint", "A Rich Media DCO Ad Blueprint can only contain one HTML Creative per format."));
          }
        }
        (adBlueprint.selectedFormats || []).forEach((format) => {
          if (compatibleFormats.length && !compatibleFormats.includes(format)) {
            issues.push(issue(`ad-format-${adBlueprint.id}-${format}`, "blocking", "Ad Blueprint", "Ad Blueprint formats must be compatible with selected Placement formats."));
          }
        });
      });
    });
    return issues;
  }

  function validatePrototypeAudienceMappings(workspace, referenceData) {
    const issues = [];
    (workspace.placementsTree || []).forEach((placement) => {
      const placementLineItemIds = placementDv360Enabled(placement)
        ? [...new Set((placement.dv360Connections || []).flatMap((connection) => (connection.enabled ? connection.lineItemIds || [] : [])))]
        : [];
      (placement.adBlueprints || []).forEach((adBlueprint) => {
        if (placementLineItemIds.length && (adBlueprint.adAutomationEnabled || adBlueprint.producerId)) {
          const mappedLineItems = new Set((adBlueprint.audienceMappings || []).map((mapping) => mapping.dvLineItemId));
          placementLineItemIds.forEach((lineItemId) => {
            if (!mappedLineItems.has(lineItemId)) {
              issues.push(issue(`audience-mapping-${adBlueprint.id}-${lineItemId}`, "warning", "Audience Mapping", "Each selected DV360 Line Item should have a mapping or a clear incomplete state."));
            }
          });
        }
        (adBlueprint.audienceMappings || []).forEach((mapping) => {
          if (!mapping.feedField || !mapping.operator || (!mapping.value && mapping.operator !== "is_not_empty")) {
            issues.push(issue(`audience-fields-${adBlueprint.id}-${mapping.dvLineItemId}`, "blocking", "Audience Mapping", "Mapping field, condition, and value should be valid."));
          }
          if (mapping.operator && !VALID_AUDIENCE_OPERATORS.includes(mapping.operator)) {
            issues.push(issue(`audience-operator-${adBlueprint.id}-${mapping.dvLineItemId}`, "blocking", "Audience Mapping", "Audience Mapping operator is not supported."));
          }
          if (mapping.feedField && mapping.operator && (mapping.value || mapping.operator === "is_not_empty") && !matchingVariantCount(referenceData || {}, mapping)) {
            issues.push(issue(`audience-no-matches-${adBlueprint.id}-${mapping.dvLineItemId}`, "warning", "Audience Mapping", "Audience Mapping has no matching Producer variants."));
          }
        });
      });
    });
    return issues;
  }

  function validatePrototypeWorkspace(workspace, referenceData) {
    const data = referenceData || {};
    return [
      ...validatePrototypeAccounts(workspace, data),
      ...validatePrototypeCampaign(workspace, data),
      ...validatePrototypePlacements(workspace, data),
      ...validatePrototypeDv360(workspace, data),
      ...validatePrototypeAdBlueprints(workspace, data),
      ...validatePrototypeAudienceMappings(workspace, data),
    ];
  }

  window.cm360WorkspacePrototypeValidation = {
    validatePrototypeAccounts,
    validatePrototypeCampaign,
    validatePrototypePlacements,
    validatePrototypeDv360,
    validatePrototypeAdBlueprints,
    validatePrototypeAudienceMappings,
    validatePrototypeWorkspace,
  };
})();
