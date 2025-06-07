import React, { useState, useEffect } from 'react';
import { presetManager, ProjectPreset, PresetCategory } from '../utils/presetManager';
import { TextOverlay, EffectParameter } from '../types/visual';

interface PresetManagerProps {
  isOpen: boolean;
  onClose: () => void;
  currentEffect: string;
  effectParameters: { [key: string]: EffectParameter };
  textOverlays: TextOverlay[];
  onLoadPreset: (preset: ProjectPreset) => void;
}

export const PresetManager: React.FC<PresetManagerProps> = ({
  isOpen,
  onClose,
  currentEffect,
  effectParameters,
  textOverlays,
  onLoadPreset
}) => {
  const [view, setView] = useState<'browse' | 'save' | 'import'>('browse');
  const [categories, setCategories] = useState<PresetCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('built-in');
  const [presets, setPresets] = useState<ProjectPreset[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<ProjectPreset | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTags, setSearchTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  
  // Save preset form state
  const [saveForm, setSaveForm] = useState({
    name: '',
    description: '',
    tags: [] as string[],
    newTag: ''
  });

  // Import/Export state
  const [importData, setImportData] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedCategory) {
      loadPresetsByCategory();
    }
  }, [selectedCategory, searchQuery, searchTags]);

  const loadData = () => {
    const cats = presetManager.getCategories();
    const tags = presetManager.getAllTags();
    setCategories(cats);
    setAllTags(tags);
    
    if (!selectedCategory && cats.length > 0) {
      setSelectedCategory(cats[0].id);
    }
  };

  const loadPresetsByCategory = () => {
    let categoryPresets: ProjectPreset[];
    
    if (searchQuery || searchTags.length > 0) {
      categoryPresets = presetManager.searchPresets(searchQuery, searchTags);
    } else {
      categoryPresets = presetManager.getPresetsByCategory(selectedCategory);
    }
    
    setPresets(categoryPresets);
  };

  const handleLoadPreset = (preset: ProjectPreset) => {
    presetManager.addPresetToRecentlyUsed(preset.id);
    onLoadPreset(preset);
    onClose();
  };

  const handleSavePreset = () => {
    if (!saveForm.name.trim()) return;

    const preset = {
      name: saveForm.name,
      description: saveForm.description,
      thumbnail: '',
      settings: {
        currentEffect,
        effectParameters,
        textOverlays
      },
      tags: saveForm.tags,
      version: '1.0.0'
    };

    const id = presetManager.savePreset(preset);
    if (id) {
      setSaveForm({ name: '', description: '', tags: [], newTag: '' });
      setView('browse');
      loadData();
      loadPresetsByCategory();
    }
  };

  const handleDeletePreset = (preset: ProjectPreset) => {
    if (preset.tags.includes('built-in')) {
      alert('Built-in presets cannot be deleted.');
      return;
    }

    if (confirm(`Delete preset "${preset.name}"?`)) {
      presetManager.deletePreset(preset.id);
      loadPresetsByCategory();
      setSelectedPreset(null);
    }
  };

  const handleDuplicatePreset = (preset: ProjectPreset) => {
    const newId = presetManager.duplicatePreset(preset.id);
    if (newId) {
      loadPresetsByCategory();
    }
  };

  const handleExportPreset = (preset: ProjectPreset) => {
    const jsonData = presetManager.exportPreset(preset.id);
    if (jsonData) {
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${preset.name.replace(/[^a-z0-9]/gi, '_')}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleImportPreset = () => {
    if (!importData.trim()) return;

    const id = presetManager.importPreset(importData);
    if (id) {
      setImportData('');
      setView('browse');
      loadData();
      loadPresetsByCategory();
      alert('Preset imported successfully!');
    } else {
      alert('Failed to import preset. Please check the format.');
    }
  };

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setImportData(content);
    };
    reader.readAsText(file);
  };

  const addTag = () => {
    if (saveForm.newTag.trim() && !saveForm.tags.includes(saveForm.newTag.trim())) {
      setSaveForm(prev => ({
        ...prev,
        tags: [...prev.tags, prev.newTag.trim()],
        newTag: ''
      }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setSaveForm(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const toggleSearchTag = (tag: string) => {
    setSearchTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="preset-manager-overlay">
      <div className="preset-manager">
        {/* Header */}
        <div className="preset-header">
          <h2>Preset Manager</h2>
          <div className="header-controls">
            <div className="view-tabs">
              <button 
                className={view === 'browse' ? 'active' : ''}
                onClick={() => setView('browse')}
              >
                Browse
              </button>
              <button 
                className={view === 'save' ? 'active' : ''}
                onClick={() => setView('save')}
              >
                Save
              </button>
              <button 
                className={view === 'import' ? 'active' : ''}
                onClick={() => setView('import')}
              >
                Import/Export
              </button>
            </div>
            <button onClick={onClose} className="close-button">×</button>
          </div>
        </div>

        {/* Browse View */}
        {view === 'browse' && (
          <div className="browse-view">
            {/* Search and Filters */}
            <div className="search-section">
              <input
                type="text"
                placeholder="Search presets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              
              <div className="tag-filters">
                {allTags.map(tag => (
                  <button
                    key={tag}
                    className={`tag-filter ${searchTags.includes(tag) ? 'active' : ''}`}
                    onClick={() => toggleSearchTag(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="browse-content">
              {/* Categories Sidebar */}
              <div className="categories-sidebar">
                {categories.map(category => (
                  <button
                    key={category.id}
                    className={`category-item ${selectedCategory === category.id ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <div className="category-name">{category.name}</div>
                    <div className="category-count">
                      {presetManager.getPresetsByCategory(category.id).length}
                    </div>
                  </button>
                ))}
              </div>

              {/* Presets Grid */}
              <div className="presets-grid">
                {presets.map(preset => (
                  <div
                    key={preset.id}
                    className={`preset-card ${selectedPreset?.id === preset.id ? 'selected' : ''}`}
                    onClick={() => setSelectedPreset(preset)}
                  >
                    <div className="preset-thumbnail">
                      {preset.thumbnail ? (
                        <img src={preset.thumbnail} alt={preset.name} />
                      ) : (
                        <div className="thumbnail-placeholder">
                          <span>{preset.settings.currentEffect.toUpperCase()}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="preset-info">
                      <h4>{preset.name}</h4>
                      <p>{preset.description}</p>
                      <div className="preset-tags">
                        {preset.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="tag">{tag}</span>
                        ))}
                      </div>
                    </div>

                    <div className="preset-actions">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLoadPreset(preset);
                        }}
                        className="load-button"
                      >
                        Load
                      </button>
                      
                      <div className="action-menu">
                        <button className="menu-button">⋮</button>
                        <div className="action-dropdown">
                          <button onClick={() => handleDuplicatePreset(preset)}>
                            Duplicate
                          </button>
                          <button onClick={() => handleExportPreset(preset)}>
                            Export
                          </button>
                          {!preset.tags.includes('built-in') && (
                            <button 
                              onClick={() => handleDeletePreset(preset)}
                              className="delete-action"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Preset Details */}
            {selectedPreset && (
              <div className="preset-details">
                <h3>{selectedPreset.name}</h3>
                <p>{selectedPreset.description}</p>
                <div className="preset-stats">
                  <div className="stat">
                    <span>Effect:</span>
                    <span>{selectedPreset.settings.currentEffect}</span>
                  </div>
                  <div className="stat">
                    <span>Text Overlays:</span>
                    <span>{selectedPreset.settings.textOverlays.length}</span>
                  </div>
                  <div className="stat">
                    <span>Created:</span>
                    <span>{new Date(selectedPreset.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="preset-tags">
                  {selectedPreset.tags.map(tag => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Save View */}
        {view === 'save' && (
          <div className="save-view">
            <h3>Save Current Configuration</h3>
            
            <div className="save-form">
              <div className="form-group">
                <label>Preset Name:</label>
                <input
                  type="text"
                  value={saveForm.name}
                  onChange={(e) => setSaveForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter preset name..."
                />
              </div>

              <div className="form-group">
                <label>Description:</label>
                <textarea
                  value={saveForm.description}
                  onChange={(e) => setSaveForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe this preset..."
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label>Tags:</label>
                <div className="tag-input">
                  <input
                    type="text"
                    value={saveForm.newTag}
                    onChange={(e) => setSaveForm(prev => ({ ...prev, newTag: e.target.value }))}
                    placeholder="Add tag..."
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  />
                  <button onClick={addTag}>Add</button>
                </div>
                
                <div className="selected-tags">
                  {saveForm.tags.map(tag => (
                    <span key={tag} className="tag">
                      {tag}
                      <button onClick={() => removeTag(tag)}>×</button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="current-config">
                <h4>Current Configuration:</h4>
                <div className="config-item">
                  <span>Effect:</span>
                  <span>{currentEffect}</span>
                </div>
                <div className="config-item">
                  <span>Text Overlays:</span>
                  <span>{textOverlays.length}</span>
                </div>
                <div className="config-item">
                  <span>Parameters:</span>
                  <span>{Object.keys(effectParameters).length} effects configured</span>
                </div>
              </div>

              <button 
                onClick={handleSavePreset}
                className="save-button"
                disabled={!saveForm.name.trim()}
              >
                Save Preset
              </button>
            </div>
          </div>
        )}

        {/* Import/Export View */}
        {view === 'import' && (
          <div className="import-view">
            <h3>Import/Export Presets</h3>
            
            <div className="import-section">
              <h4>Import Preset</h4>
              <div className="import-methods">
                <div className="import-method">
                  <label>Import from file:</label>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportFile}
                    className="file-input"
                  />
                </div>
                
                <div className="import-method">
                  <label>Or paste JSON data:</label>
                  <textarea
                    value={importData}
                    onChange={(e) => setImportData(e.target.value)}
                    placeholder="Paste preset JSON data here..."
                    rows={8}
                    className="import-textarea"
                  />
                  <button 
                    onClick={handleImportPreset}
                    className="import-button"
                    disabled={!importData.trim()}
                  >
                    Import Preset
                  </button>
                </div>
              </div>
            </div>

            <div className="export-section">
              <h4>Export Presets</h4>
              <p>Use the export button on individual presets in the Browse tab to download them as JSON files.</p>
            </div>
          </div>
        )}

        <style>{`
          .preset-manager-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
          }

          .preset-manager {
            background: #1a1a1a;
            border-radius: 12px;
            width: 90%;
            max-width: 1200px;
            height: 80%;
            display: flex;
            flex-direction: column;
            overflow: hidden;
          }

          .preset-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            border-bottom: 1px solid #333;
            background: #2a2a2a;
          }

          .preset-header h2 {
            color: white;
            margin: 0;
          }

          .header-controls {
            display: flex;
            align-items: center;
            gap: 20px;
          }

          .view-tabs {
            display: flex;
            gap: 5px;
            background: #333;
            border-radius: 6px;
            padding: 3px;
          }

          .view-tabs button {
            padding: 8px 16px;
            background: transparent;
            color: #ccc;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.2s;
          }

          .view-tabs button.active {
            background: #4ecdc4;
            color: white;
          }

          .close-button {
            width: 32px;
            height: 32px;
            background: #e74c3c;
            color: white;
            border: none;
            border-radius: 50%;
            cursor: pointer;
            font-size: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .browse-view {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
          }

          .search-section {
            padding: 20px;
            border-bottom: 1px solid #333;
          }

          .search-input {
            width: 100%;
            padding: 10px;
            background: #333;
            border: 1px solid #444;
            border-radius: 6px;
            color: white;
            margin-bottom: 10px;
          }

          .tag-filters {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
          }

          .tag-filter {
            padding: 4px 12px;
            background: #333;
            color: #ccc;
            border: 1px solid #444;
            border-radius: 16px;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.2s;
          }

          .tag-filter.active {
            background: #4ecdc4;
            color: white;
            border-color: #4ecdc4;
          }

          .browse-content {
            flex: 1;
            display: flex;
            overflow: hidden;
          }

          .categories-sidebar {
            width: 200px;
            background: #2a2a2a;
            border-right: 1px solid #333;
            overflow-y: auto;
          }

          .category-item {
            width: 100%;
            padding: 15px;
            background: transparent;
            color: #ccc;
            border: none;
            border-bottom: 1px solid #333;
            cursor: pointer;
            text-align: left;
            transition: background 0.2s;
          }

          .category-item:hover {
            background: rgba(255, 255, 255, 0.05);
          }

          .category-item.active {
            background: rgba(78, 205, 196, 0.2);
            color: white;
          }

          .category-name {
            font-weight: 500;
          }

          .category-count {
            font-size: 12px;
            opacity: 0.7;
            margin-top: 4px;
          }

          .presets-grid {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 20px;
            align-content: start;
          }

          .preset-card {
            background: #333;
            border-radius: 8px;
            overflow: hidden;
            cursor: pointer;
            transition: all 0.2s;
            border: 2px solid transparent;
          }

          .preset-card:hover {
            border-color: rgba(78, 205, 196, 0.5);
          }

          .preset-card.selected {
            border-color: #4ecdc4;
          }

          .preset-thumbnail {
            height: 120px;
            background: #444;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .thumbnail-placeholder {
            color: #999;
            font-size: 14px;
            font-weight: bold;
          }

          .preset-info {
            padding: 15px;
          }

          .preset-info h4 {
            color: white;
            margin: 0 0 8px 0;
            font-size: 16px;
          }

          .preset-info p {
            color: #ccc;
            margin: 0 0 10px 0;
            font-size: 14px;
            line-height: 1.4;
          }

          .preset-tags {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
          }

          .tag {
            padding: 2px 8px;
            background: #4ecdc4;
            color: white;
            border-radius: 12px;
            font-size: 11px;
            white-space: nowrap;
          }

          .preset-actions {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px;
            border-top: 1px solid #444;
          }

          .load-button {
            padding: 8px 16px;
            background: #4ecdc4;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            transition: background 0.2s;
          }

          .load-button:hover {
            background: #45b7b8;
          }

          .action-menu {
            position: relative;
          }

          .menu-button {
            width: 24px;
            height: 24px;
            background: #444;
            color: #ccc;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .action-dropdown {
            position: absolute;
            right: 0;
            top: 100%;
            background: #2a2a2a;
            border: 1px solid #444;
            border-radius: 4px;
            min-width: 120px;
            display: none;
            z-index: 10;
          }

          .action-menu:hover .action-dropdown {
            display: block;
          }

          .action-dropdown button {
            width: 100%;
            padding: 8px 12px;
            background: transparent;
            color: #ccc;
            border: none;
            text-align: left;
            cursor: pointer;
            transition: background 0.2s;
          }

          .action-dropdown button:hover {
            background: rgba(255, 255, 255, 0.1);
          }

          .action-dropdown .delete-action {
            color: #e74c3c;
          }

          .preset-details {
            width: 300px;
            padding: 20px;
            background: #2a2a2a;
            border-left: 1px solid #333;
            overflow-y: auto;
          }

          .preset-details h3 {
            color: white;
            margin: 0 0 10px 0;
          }

          .preset-stats {
            margin: 20px 0;
          }

          .stat {
            display: flex;
            justify-content: space-between;
            margin: 8px 0;
            color: #ccc;
            font-size: 14px;
          }

          .save-view, .import-view {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
          }

          .save-view h3, .import-view h3 {
            color: white;
            margin: 0 0 20px 0;
          }

          .save-form {
            max-width: 500px;
          }

          .form-group {
            margin-bottom: 20px;
          }

          .form-group label {
            display: block;
            color: #ccc;
            margin-bottom: 8px;
            font-weight: 500;
          }

          .form-group input, .form-group textarea {
            width: 100%;
            padding: 10px;
            background: #333;
            border: 1px solid #444;
            border-radius: 4px;
            color: white;
            resize: vertical;
          }

          .tag-input {
            display: flex;
            gap: 10px;
            margin-bottom: 10px;
          }

          .tag-input input {
            flex: 1;
          }

          .tag-input button {
            padding: 10px 16px;
            background: #4ecdc4;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          }

          .selected-tags {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
          }

          .selected-tags .tag {
            display: flex;
            align-items: center;
            gap: 6px;
          }

          .selected-tags .tag button {
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            padding: 0;
            width: 16px;
            height: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: background 0.2s;
          }

          .selected-tags .tag button:hover {
            background: rgba(255, 255, 255, 0.2);
          }

          .current-config {
            background: #333;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
          }

          .current-config h4 {
            color: white;
            margin: 0 0 10px 0;
          }

          .config-item {
            display: flex;
            justify-content: space-between;
            margin: 8px 0;
            color: #ccc;
            font-size: 14px;
          }

          .save-button {
            width: 100%;
            padding: 12px;
            background: #4ecdc4;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
            font-weight: 500;
            transition: background 0.2s;
          }

          .save-button:hover:not(:disabled) {
            background: #45b7b8;
          }

          .save-button:disabled {
            background: #666;
            cursor: not-allowed;
          }

          .import-section, .export-section {
            margin-bottom: 30px;
          }

          .import-section h4, .export-section h4 {
            color: white;
            margin: 0 0 15px 0;
          }

          .import-methods {
            max-width: 500px;
          }

          .import-method {
            margin-bottom: 20px;
          }

          .import-method label {
            display: block;
            color: #ccc;
            margin-bottom: 8px;
          }

          .file-input {
            width: 100%;
            padding: 8px;
            background: #333;
            border: 1px solid #444;
            border-radius: 4px;
            color: white;
          }

          .import-textarea {
            width: 100%;
            min-height: 120px;
            padding: 10px;
            background: #333;
            border: 1px solid #444;
            border-radius: 4px;
            color: white;
            font-family: monospace;
            resize: vertical;
          }

          .import-button {
            width: 100%;
            padding: 10px;
            background: #4ecdc4;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 10px;
            transition: background 0.2s;
          }

          .import-button:hover:not(:disabled) {
            background: #45b7b8;
          }

          .import-button:disabled {
            background: #666;
            cursor: not-allowed;
          }

          .export-section p {
            color: #ccc;
            line-height: 1.5;
          }
        `}</style>
      </div>
    </div>
  );
};