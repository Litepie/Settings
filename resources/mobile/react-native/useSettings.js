import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';

// Mock API service - replace with your actual API implementation
const settingsApi = {
  async getSettings() {
    // Replace with actual API call
    return fetch('/api/settings', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    }).then(response => response.json());
  },

  async updateSetting(key, value) {
    // Replace with actual API call
    return fetch(`/api/settings/${key}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ value }),
    }).then(response => response.json());
  },

  async resetSetting(key) {
    // Replace with actual API call
    return fetch(`/api/settings/${key}/reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    }).then(response => response.json());
  },

  async bulkUpdate(settings) {
    // Replace with actual API call
    return fetch('/api/settings/bulk', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ settings }),
    }).then(response => response.json());
  },

  async importSettings(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    return fetch('/api/settings/import', {
      method: 'POST',
      body: formData,
    }).then(response => response.json());
  },

  async exportSettings(format = 'json') {
    return fetch(`/api/settings/export?format=${format}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    }).then(response => response.json());
  },

  async getGroups() {
    return fetch('/api/settings/groups', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    }).then(response => response.json());
  },

  async getHistory(key) {
    return fetch(`/api/settings/${key}/history`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    }).then(response => response.json());
  },

  async clearCache() {
    return fetch('/api/settings/cache/clear', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    }).then(response => response.json());
  },
};

export const useSettings = () => {
  const [settings, setSettings] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Load initial data
  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [settingsData, groupsData] = await Promise.all([
        settingsApi.getSettings(),
        settingsApi.getGroups(),
      ]);
      
      setSettings(settingsData.data || []);
      setGroups(groupsData.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load settings');
      Alert.alert('Error', 'Failed to load settings. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh settings (for pull-to-refresh)
  const refreshSettings = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);
      
      const [settingsData, groupsData] = await Promise.all([
        settingsApi.getSettings(),
        settingsApi.getGroups(),
      ]);
      
      setSettings(settingsData.data || []);
      setGroups(groupsData.data || []);
    } catch (err) {
      setError(err.message || 'Failed to refresh settings');
      Alert.alert('Error', 'Failed to refresh settings. Please try again.');
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Update a single setting
  const updateSetting = useCallback(async (setting, newValue) => {
    try {
      const response = await settingsApi.updateSetting(setting.key, newValue);
      
      if (response.success) {
        setSettings(prevSettings =>
          prevSettings.map(s =>
            s.key === setting.key ? { ...s, value: newValue } : s
          )
        );
        
        return { success: true, data: response.data };
      } else {
        throw new Error(response.message || 'Failed to update setting');
      }
    } catch (err) {
      setError(err.message || 'Failed to update setting');
      Alert.alert('Error', `Failed to update ${setting.key}: ${err.message}`);
      return { success: false, error: err.message };
    }
  }, []);

  // Reset setting to default value
  const resetSetting = useCallback(async (setting) => {
    try {
      const response = await settingsApi.resetSetting(setting.key);
      
      if (response.success) {
        setSettings(prevSettings =>
          prevSettings.map(s =>
            s.key === setting.key ? { ...s, value: setting.default_value } : s
          )
        );
        
        Alert.alert('Success', `${setting.key} has been reset to its default value.`);
        return { success: true, data: response.data };
      } else {
        throw new Error(response.message || 'Failed to reset setting');
      }
    } catch (err) {
      setError(err.message || 'Failed to reset setting');
      Alert.alert('Error', `Failed to reset ${setting.key}: ${err.message}`);
      return { success: false, error: err.message };
    }
  }, []);

  // Bulk update multiple settings
  const bulkUpdateSettings = useCallback(async (settingsToUpdate) => {
    try {
      setLoading(true);
      const response = await settingsApi.bulkUpdate(settingsToUpdate);
      
      if (response.success) {
        // Update local state
        setSettings(prevSettings =>
          prevSettings.map(setting => {
            const update = settingsToUpdate.find(u => u.key === setting.key);
            return update ? { ...setting, value: update.value } : setting;
          })
        );
        
        Alert.alert('Success', `${settingsToUpdate.length} settings updated successfully.`);
        return { success: true, data: response.data };
      } else {
        throw new Error(response.message || 'Failed to update settings');
      }
    } catch (err) {
      setError(err.message || 'Failed to update settings');
      Alert.alert('Error', `Failed to update settings: ${err.message}`);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Import settings from file
  const importSettings = useCallback(async (file) => {
    try {
      setLoading(true);
      const response = await settingsApi.importSettings(file);
      
      if (response.success) {
        // Reload settings after import
        await loadSettings();
        Alert.alert('Success', `${response.imported_count || 0} settings imported successfully.`);
        return { success: true, data: response.data };
      } else {
        throw new Error(response.message || 'Failed to import settings');
      }
    } catch (err) {
      setError(err.message || 'Failed to import settings');
      Alert.alert('Error', `Failed to import settings: ${err.message}`);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [loadSettings]);

  // Export settings
  const exportSettings = useCallback(async (format = 'json') => {
    try {
      setLoading(true);
      const response = await settingsApi.exportSettings(format);
      
      if (response.success) {
        Alert.alert('Success', 'Settings exported successfully.');
        return { success: true, data: response.data };
      } else {
        throw new Error(response.message || 'Failed to export settings');
      }
    } catch (err) {
      setError(err.message || 'Failed to export settings');
      Alert.alert('Error', `Failed to export settings: ${err.message}`);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Get setting history
  const getSettingHistory = useCallback(async (key) => {
    try {
      const response = await settingsApi.getHistory(key);
      
      if (response.success) {
        return { success: true, data: response.data };
      } else {
        throw new Error(response.message || 'Failed to get setting history');
      }
    } catch (err) {
      setError(err.message || 'Failed to get setting history');
      Alert.alert('Error', `Failed to get history for ${key}: ${err.message}`);
      return { success: false, error: err.message };
    }
  }, []);

  // Clear settings cache
  const clearCache = useCallback(async () => {
    try {
      const response = await settingsApi.clearCache();
      
      if (response.success) {
        Alert.alert('Success', 'Settings cache cleared successfully.');
        return { success: true, data: response.data };
      } else {
        throw new Error(response.message || 'Failed to clear cache');
      }
    } catch (err) {
      setError(err.message || 'Failed to clear cache');
      Alert.alert('Error', `Failed to clear cache: ${err.message}`);
      return { success: false, error: err.message };
    }
  }, []);

  // Filter settings by group
  const getSettingsByGroup = useCallback((groupKey) => {
    return settings.filter(setting => setting.group === groupKey);
  }, [settings]);

  // Search settings
  const searchSettings = useCallback((query) => {
    if (!query) return settings;
    
    const lowercaseQuery = query.toLowerCase();
    return settings.filter(setting =>
      setting.key.toLowerCase().includes(lowercaseQuery) ||
      setting.description?.toLowerCase().includes(lowercaseQuery) ||
      setting.group?.toLowerCase().includes(lowercaseQuery)
    );
  }, [settings]);

  // Get setting by key
  const getSetting = useCallback((key) => {
    return settings.find(setting => setting.key === key);
  }, [settings]);

  // Check if setting has been modified
  const isSettingModified = useCallback((setting) => {
    return setting.value !== setting.default_value;
  }, []);

  // Get all modified settings
  const getModifiedSettings = useCallback(() => {
    return settings.filter(isSettingModified);
  }, [settings, isSettingModified]);

  // Initialize hook
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return {
    // State
    settings,
    groups,
    loading,
    error,
    refreshing,

    // Actions
    loadSettings,
    refreshSettings,
    updateSetting,
    resetSetting,
    bulkUpdateSettings,
    importSettings,
    exportSettings,
    clearCache,

    // Utilities
    getSettingsByGroup,
    searchSettings,
    getSetting,
    getSettingHistory,
    isSettingModified,
    getModifiedSettings,
  };
};
