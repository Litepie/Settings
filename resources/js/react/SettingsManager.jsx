import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { SettingItem } from './SettingItem';
import { ImportDialog } from './ImportDialog';
import { ConfirmDialog } from './ConfirmDialog';
import { useSettings } from '../hooks/useSettings';
import './SettingsManager.css';

export const SettingsManager = ({
  title = 'Settings',
  groups = [],
  owner = null,
  readonly = false,
  allowExport = true,
  allowImport = true,
  autoSave = false,
  onSettingChanged,
  onSettingsSaved,
  onSettingsExported,
  onSettingsImported
}) => {
  const {
    settings,
    loading,
    error,
    loadSettings,
    updateSetting,
    saveBulkSettings,
    exportSettings,
    importSettings,
    resetSetting
  } = useSettings(owner);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeGroup, setActiveGroup] = useState('all');
  const [changedSettings, setChangedSettings] = useState(new Map());
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({});
  const [notification, setNotification] = useState(null);

  const availableGroups = useMemo(() => {
    const allGroup = { key: 'all', name: 'All Settings', icon: 'grid' };
    const settingsGroups = groups.length > 0 ? groups : [
      { key: 'general', name: 'General', icon: 'settings' },
      { key: 'appearance', name: 'Appearance', icon: 'palette' },
      { key: 'notifications', name: 'Notifications', icon: 'bell' },
      { key: 'security', name: 'Security', icon: 'shield' }
    ];
    return [allGroup, ...settingsGroups];
  }, [groups]);

  const filteredSettings = useMemo(() => {
    let filtered = settings;

    // Filter by group
    if (activeGroup !== 'all') {
      filtered = filtered.filter(setting => 
        setting.group && setting.group.key === activeGroup
      );
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(setting =>
        setting.key.toLowerCase().includes(query) ||
        (setting.description && setting.description.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [settings, activeGroup, searchQuery]);

  const hasChanges = changedSettings.size > 0;

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const showNotification = useCallback((message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  }, []);

  const handleSettingUpdate = useCallback(async (setting, newValue) => {
    try {
      if (autoSave) {
        await updateSetting(setting.key, newValue);
        showNotification('Setting saved successfully', 'success');
      } else {
        setChangedSettings(prev => new Map(prev).set(setting.key, { setting, newValue }));
      }
      
      onSettingChanged?.({
        key: setting.key,
        oldValue: setting.value,
        newValue,
        setting
      });
    } catch (error) {
      showNotification(`Failed to update setting: ${error.message}`, 'error');
    }
  }, [autoSave, updateSetting, onSettingChanged, showNotification]);

  const handleSettingReset = useCallback((setting) => {
    setConfirmConfig({
      message: `Are you sure you want to reset "${setting.key}" to its default value?`,
      onConfirm: async () => {
        try {
          await resetSetting(setting.key);
          setChangedSettings(prev => {
            const newMap = new Map(prev);
            newMap.delete(setting.key);
            return newMap;
          });
          showNotification('Setting reset successfully', 'success');
          setShowConfirmDialog(false);
        } catch (error) {
          showNotification(`Failed to reset setting: ${error.message}`, 'error');
        }
      }
    });
    setShowConfirmDialog(true);
  }, [resetSetting, showNotification]);

  const saveAllSettings = useCallback(async () => {
    if (changedSettings.size === 0) return;

    try {
      const settingsToSave = {};
      changedSettings.forEach((item, key) => {
        settingsToSave[key] = item.newValue;
      });

      await saveBulkSettings(settingsToSave);
      setChangedSettings(new Map());
      showNotification('All settings saved successfully', 'success');
      
      onSettingsSaved?.(settingsToSave);
    } catch (error) {
      showNotification(`Failed to save settings: ${error.message}`, 'error');
    }
  }, [changedSettings, saveBulkSettings, onSettingsSaved, showNotification]);

  const handleExportSettings = useCallback(async () => {
    try {
      const exportedData = await exportSettings(
        activeGroup === 'all' ? [] : [activeGroup]
      );
      
      const blob = new Blob([JSON.stringify(exportedData, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `settings-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      showNotification('Settings exported successfully', 'success');
      onSettingsExported?.(exportedData);
    } catch (error) {
      showNotification(`Failed to export settings: ${error.message}`, 'error');
    }
  }, [exportSettings, activeGroup, onSettingsExported, showNotification]);

  const handleImport = useCallback(async (importData, overwrite = false) => {
    try {
      await importSettings(importData, overwrite);
      await loadSettings(); // Reload to show imported settings
      setShowImportDialog(false);
      showNotification('Settings imported successfully', 'success');
      
      onSettingsImported?.(importData);
    } catch (error) {
      showNotification(`Failed to import settings: ${error.message}`, 'error');
    }
  }, [importSettings, loadSettings, onSettingsImported, showNotification]);

  if (loading && settings.length === 0) {
    return (
      <div className="settings-manager">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-manager">
      {/* Header */}
      <div className="settings-header">
        <h2 className="settings-title">{title}</h2>
        <div className="settings-actions">
          {allowExport && (
            <button
              onClick={handleExportSettings}
              className="btn btn-outline"
              disabled={loading}
            >
              <i className="icon-download"></i> Export
            </button>
          )}
          {allowImport && (
            <button
              onClick={() => setShowImportDialog(true)}
              className="btn btn-outline"
              disabled={loading}
            >
              <i className="icon-upload"></i> Import
            </button>
          )}
          {hasChanges && (
            <button
              onClick={saveAllSettings}
              className="btn btn-primary"
              disabled={loading}
            >
              <i className="icon-save"></i> Save All
            </button>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="settings-toolbar">
        <div className="search-box">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            type="text"
            placeholder="Search settings..."
            className="search-input"
          />
          <i className="icon-search"></i>
        </div>
        
        <div className="filter-tabs">
          {availableGroups.map(group => (
            <button
              key={group.key}
              onClick={() => setActiveGroup(group.key)}
              className={`tab-button ${activeGroup === group.key ? 'active' : ''}`}
            >
              {group.icon && <i className={`icon-${group.icon}`}></i>}
              {group.name}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="settings-content">
        {filteredSettings.length === 0 ? (
          <div className="empty-state">
            <i className="icon-settings"></i>
            <h3>No settings found</h3>
            <p>Try adjusting your search or filter criteria.</p>
          </div>
        ) : (
          <div className="settings-grid">
            {filteredSettings.map(setting => (
              <SettingItem
                key={setting.key}
                setting={setting}
                readonly={readonly}
                onUpdate={handleSettingUpdate}
                onReset={handleSettingReset}
              />
            ))}
          </div>
        )}
      </div>

      {/* Dialogs */}
      {showImportDialog && (
        <ImportDialog
          onClose={() => setShowImportDialog(false)}
          onImport={handleImport}
        />
      )}

      {showConfirmDialog && (
        <ConfirmDialog
          message={confirmConfig.message}
          onConfirm={confirmConfig.onConfirm}
          onCancel={() => setShowConfirmDialog(false)}
        />
      )}

      {/* Notifications */}
      {notification && (
        <div className={`notification notification-${notification.type}`}>
          {notification.message}
        </div>
      )}
    </div>
  );
};
