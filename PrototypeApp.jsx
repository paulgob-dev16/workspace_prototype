import React, { useState } from 'react';
import './PrototypeApp.css';

// ============================================================================
// MAIN APP COMPONENT - Orchestrates all state and modal flow
// ============================================================================
export default function PrototypeApp() {
  // Variant selection state
  const [variants, setVariants] = useState({
    digital: {
      selectAll: false,
      items: ['Display', 'Video', 'Native', 'Responsive'],
      selected: new Set(),
    },
    advertisers: {
      selectAll: false,
      items: ['Agency', 'Direct', 'Programmatic', 'Auction'],
      selected: new Set(),
    },
  });

  // Modal visibility states
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showStudioModal, setShowStudioModal] = useState(false);
  const [showRuleModal, setShowRuleModal] = useState(false);

  // Publish modal states
  const [richMediaChecked, setRichMediaChecked] = useState(false);

  // Rule drag-and-drop state
  const [rules, setRules] = useState([
    { id: 1, name: 'Rule 1', order: 0 },
    { id: 2, name: 'Rule 2', order: 1 },
    { id: 3, name: 'Rule 3', order: 2 },
  ]);

  const [draggedRule, setDraggedRule] = useState(null);

  // ============================================================================
  // VARIANT SELECTION HANDLERS
  // ============================================================================

  const toggleVariant = (row, index) => {
    setVariants((prev) => {
      const newSelected = new Set(prev[row].selected);
      if (newSelected.has(index)) {
        newSelected.delete(index);
      } else {
        newSelected.add(index);
      }

      // If we just toggled and deselected, uncheck selectAll
      const isSelectAllNowUnchecked = prev[row].selectAll && newSelected.size !== prev[row].items.length;

      return {
        ...prev,
        [row]: {
          ...prev[row],
          selected: newSelected,
          selectAll: isSelectAllNowUnchecked ? false : prev[row].selectAll,
        },
      };
    });
  };

  const toggleSelectAll = (row) => {
    setVariants((prev) => {
      const newSelectAll = !prev[row].selectAll;
      const newSelected = new Set();

      if (newSelectAll) {
        // Select all items in this row
        prev[row].items.forEach((_, index) => {
          newSelected.add(index);
        });
      }

      return {
        ...prev,
        [row]: {
          ...prev[row],
          selectAll: newSelectAll,
          selected: newSelected,
        },
      };
    });
  };

  // ============================================================================
  // PUBLISH BUTTON LOGIC
  // ============================================================================

  // Publish is enabled only when ALL variants in ANY row are selected
  const isPublishEnabled =
    (variants.digital.selected.size === variants.digital.items.length) ||
    (variants.advertisers.selected.size === variants.advertisers.items.length);

  const handlePublishClick = () => {
    if (isPublishEnabled) {
      setShowPublishModal(true);
    }
  };

  // ============================================================================
  // PUBLISH MODAL HANDLERS
  // ============================================================================

  const handlePublishToConsole = () => {
    console.log('Publishing Variants:', {
      digital: {
        selected: Array.from(variants.digital.selected).map((i) => variants.digital.items[i]),
      },
      advertisers: {
        selected: Array.from(variants.advertisers.selected).map((i) => variants.advertisers.items[i]),
      },
      richMediaEnabled: richMediaChecked,
    });
    alert('Published! Check console for details.');
  };

  const handleConnectStudio = () => {
    setShowPublishModal(false);
    setShowStudioModal(true);
  };

  // ============================================================================
  // STUDIO PROFILE HANDLERS
  // ============================================================================

  const handleCreateRule = () => {
    setShowStudioModal(false);
    setShowRuleModal(true);
  };

  // ============================================================================
  // DRAG AND DROP HANDLERS FOR RULES
  // ============================================================================

  const handleRuleDragStart = (e, ruleId) => {
    setDraggedRule(ruleId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleRuleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleRuleDrop = (e, targetRuleId) => {
    e.preventDefault();
    
    if (draggedRule === null || draggedRule === targetRuleId) return;

    const draggedIndex = rules.findIndex((r) => r.id === draggedRule);
    const targetIndex = rules.findIndex((r) => r.id === targetRuleId);

    // Swap positions
    const newRules = [...rules];
    [newRules[draggedIndex], newRules[targetIndex]] = [newRules[targetIndex], newRules[draggedIndex]];

    // Update order property
    const updatedRules = newRules.map((rule, idx) => ({
      ...rule,
      order: idx,
    }));

    setRules(updatedRules);
    console.log('Rule order updated:', updatedRules);
    setDraggedRule(null);
  };

  const handleRuleDragEnd = () => {
    setDraggedRule(null);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="prototype-app">
      <header className="app-header">
        <h1>Variant Publisher Prototype</h1>
      </header>

      <main className="app-content">
        {/* VARIANT SELECTION TABLE */}
        <section className="variants-section">
          <h2>Select Variants to Publish</h2>

          {/* DIGITAL ROW */}
          <VariantRow
            title="Digital"
            items={variants.digital.items}
            selected={variants.digital.selected}
            selectAll={variants.digital.selectAll}
            onToggleVariant={(index) => toggleVariant('digital', index)}
            onToggleSelectAll={() => toggleSelectAll('digital')}
          />

          {/* ADVERTISERS ROW */}
          <VariantRow
            title="Advertisers"
            items={variants.advertisers.items}
            selected={variants.advertisers.selected}
            selectAll={variants.advertisers.selectAll}
            onToggleVariant={(index) => toggleVariant('advertisers', index)}
            onToggleSelectAll={() => toggleSelectAll('advertisers')}
          />
        </section>

        {/* PUBLISH BUTTON */}
        <section className="publish-section">
          <button
            className={`publish-button ${isPublishEnabled ? 'enabled' : 'disabled'}`}
            onClick={handlePublishClick}
            disabled={!isPublishEnabled}
          >
            {isPublishEnabled ? 'Publish Variants' : 'Select All Variants to Enable Publish'}
          </button>
        </section>
      </main>

      {/* PUBLISH MODAL */}
      {showPublishModal && (
        <Modal title="Publish Variants" onClose={() => setShowPublishModal(false)}>
          <div className="modal-content">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={richMediaChecked}
                onChange={(e) => setRichMediaChecked(e.target.checked)}
              />
              Rich Media
            </label>

            <div className="modal-buttons">
              <button className="btn-primary" onClick={handlePublishToConsole}>
                Publish to CM360
              </button>
              <button className="btn-secondary" onClick={handleConnectStudio}>
                Connect Studio Profile
              </button>
              <button className="btn-cancel" onClick={() => setShowPublishModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* STUDIO PROFILE MODAL */}
      {showStudioModal && (
        <Modal title="Studio Profile" onClose={() => setShowStudioModal(false)}>
          <div className="modal-content">
            <p>Configure your Studio Profile settings.</p>
            <div className="modal-buttons">
              <button className="btn-primary" onClick={handleCreateRule}>
                Create Rule
              </button>
              <button className="btn-cancel" onClick={() => setShowStudioModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* RULE BUILDER MODAL */}
      {showRuleModal && (
        <Modal title="Create Rule" onClose={() => setShowRuleModal(false)}>
          <div className="modal-content rule-builder">
            <p>Drag to reorder rules:</p>
            <div className="rules-container">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className={`rule-item ${draggedRule === rule.id ? 'dragging' : ''}`}
                  draggable
                  onDragStart={(e) => handleRuleDragStart(e, rule.id)}
                  onDragOver={handleRuleDragOver}
                  onDrop={(e) => handleRuleDrop(e, rule.id)}
                  onDragEnd={handleRuleDragEnd}
                >
                  <span className="rule-handle">⋮⋮</span>
                  <span className="rule-name">{rule.name}</span>
                  <span className="rule-order">Order: {rule.order}</span>
                </div>
              ))}
            </div>
            <div className="modal-buttons">
              <button className="btn-cancel" onClick={() => setShowRuleModal(false)}>
                Done
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ============================================================================
// VARIANT ROW COMPONENT - Renders a row with "Select All" and individual checkboxes
// ============================================================================
function VariantRow({ title, items, selected, selectAll, onToggleVariant, onToggleSelectAll }) {
  return (
    <div className="variant-row">
      <div className="row-title">{title}</div>
      <div className="row-content">
        <div className="select-all-item">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={selectAll}
              onChange={onToggleSelectAll}
            />
            Select All Variants
          </label>
        </div>

        <div className="variants-grid">
          {items.map((item, index) => (
            <label key={index} className="checkbox-label variant-item">
              <input
                type="checkbox"
                checked={selected.has(index)}
                onChange={() => onToggleVariant(index)}
              />
              {item}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MODAL COMPONENT - Reusable modal wrapper
// ============================================================================
function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
