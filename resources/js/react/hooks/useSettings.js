import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

export const useSettings = (owner = null) => {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const cacheRef = useRef(new Map());
  const apiBase = '/api/settings';

  const getOwnerParams = useCallback((targetOwner = null) => {
    const ownerToUse = targetOwner || owner;
    if (!ownerToUse) return {};
    
    return {
      owner_type: ownerToUse.constructor.name,
      owner_id: ownerToUse.id
    };
  }, [owner]);

  const getCacheKey = useCallback((key, targetOwner = null) => {
    const ownerToUse = targetOwner || owner;
    if (!ownerToUse) {
      return `global:${key}`;
    }
    return `${ownerToUse.constructor.name}:${ownerToUse.id}:${key}`;
  }, [owner]);

  const loadSettings = useCallback(async (groups = []) => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        ...getOwnerParams(),
        ...(groups.length > 0 && { groups: groups.join(',') })
      };

      const response = await axios.get(apiBase, { params });
      const settingsData = response.data.data || response.data;
      setSettings(settingsData);
      
      // Cache the settings
      settingsData.forEach(setting => {
        const cacheKey = getCacheKey(setting.key, owner);
        cacheRef.current.set(cacheKey, setting.value);
      });
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      setError(errorMessage);
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  }, [getOwnerParams, getCacheKey, owner]);

  const getSetting = useCallback(async (key, defaultValue = null, ownerOverride = null) => {
    const targetOwner = ownerOverride || owner;
    const cacheKey = getCacheKey(key, targetOwner);
    
    // Check cache first
    if (cacheRef.current.has(cacheKey)) {
      return cacheRef.current.get(cacheKey);
    }

    try {
      const params = getOwnerParams(targetOwner);
      const response = await axios.get(`${apiBase}/${key}`, { params });
      const value = response.data.value;
      
      // Cache the value
      cacheRef.current.set(cacheKey, value);
      return value;
    } catch (err) {
      if (err.response?.status === 404) {
        return defaultValue;
      }
      throw err;
    }
  }, [owner, getCacheKey, getOwnerParams]);

  const updateSetting = useCallback(async (key, value, options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const data = {
        value,
        ...getOwnerParams(),
        ...options
      };

      const response = await axios.put(`${apiBase}/${key}`, data);
      
      // Update cache
      const cacheKey = getCacheKey(key, owner);
      cacheRef.current.set(cacheKey, value);
      
      // Update local settings array
      setSettings(prev => prev.map(setting => 
        setting.key === key ? { ...setting, value } : setting
      ));

      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getOwnerParams, getCacheKey, owner]);

  const createSetting = useCallback(async (key, value, options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const data = {
        key,
        value,
        ...getOwnerParams(),
        ...options
      };

      const response = await axios.post(apiBase, data);
      
      // Add to local settings and cache
      const newSetting = { key, value, ...options };
      setSettings(prev => [...prev, newSetting]);
      
      const cacheKey = getCacheKey(key, owner);
      cacheRef.current.set(cacheKey, value);

      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getOwnerParams, getCacheKey, owner]);

  const deleteSetting = useCallback(async (key) => {
    setLoading(true);
    setError(null);

    try {
      const params = getOwnerParams();
      const response = await axios.delete(`${apiBase}/${key}`, { params });
      
      // Remove from cache and local settings
      const cacheKey = getCacheKey(key, owner);
      cacheRef.current.delete(cacheKey);
      
      setSettings(prev => prev.filter(setting => setting.key !== key));

      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getOwnerParams, getCacheKey, owner]);

  const saveBulkSettings = useCallback(async (settingsData) => {
    setLoading(true);
    setError(null);

    try {
      const data = {
        settings: settingsData,
        ...getOwnerParams()
      };

      const response = await axios.post(`${apiBase}/bulk`, data);
      
      // Update cache and local settings
      Object.entries(settingsData).forEach(([key, value]) => {
        const cacheKey = getCacheKey(key, owner);
        cacheRef.current.set(cacheKey, value);
      });

      setSettings(prev => prev.map(setting => {
        if (settingsData.hasOwnProperty(setting.key)) {
          return { ...setting, value: settingsData[setting.key] };
        }
        return setting;
      }));

      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getOwnerParams, getCacheKey, owner]);

  const exportSettings = useCallback(async (groups = []) => {
    try {
      const params = {
        ...getOwnerParams(),
        ...(groups.length > 0 && { groups: groups.join(',') })
      };

      const response = await axios.get(`${apiBase}/export`, { params });
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      setError(errorMessage);
      throw err;
    }
  }, [getOwnerParams]);

  const importSettings = useCallback(async (settingsData, overwrite = false) => {
    setLoading(true);
    setError(null);

    try {
      const data = {
        settings: settingsData,
        overwrite,
        ...getOwnerParams()
      };

      const response = await axios.post(`${apiBase}/import`, data);
      
      // Clear cache to force reload
      cacheRef.current.clear();
      
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getOwnerParams]);

  const resetSetting = useCallback(async (key) => {
    const setting = settings.find(s => s.key === key);
    if (setting && setting.default_value !== null) {
      return await updateSetting(key, setting.default_value);
    }
    return await deleteSetting(key);
  }, [settings, updateSetting, deleteSetting]);

  const clearCache = useCallback((key = null, ownerOverride = null) => {
    if (key) {
      const cacheKey = getCacheKey(key, ownerOverride || owner);
      cacheRef.current.delete(cacheKey);
    } else {
      cacheRef.current.clear();
    }
  }, [getCacheKey, owner]);

  // Custom hook for individual setting management
  const useSetting = useCallback((key, defaultValue = null) => {
    const [value, setValue] = useState(() => {
      const setting = settings.find(s => s.key === key);
      return setting ? setting.value : defaultValue;
    });

    useEffect(() => {
      const setting = settings.find(s => s.key === key);
      if (setting) {
        setValue(setting.value);
      }
    }, [settings, key]);

    const updateValue = useCallback(async (newValue) => {
      try {
        await updateSetting(key, newValue);
        setValue(newValue);
      } catch (error) {
        console.error(`Failed to update setting ${key}:`, error);
        throw error;
      }
    }, [key, updateSetting]);

    return [value, updateValue];
  }, [settings, updateSetting]);

  // Initialize settings on mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return {
    // State
    settings,
    loading,
    error,
    
    // Methods
    loadSettings,
    getSetting,
    updateSetting,
    createSetting,
    deleteSetting,
    saveBulkSettings,
    exportSettings,
    importSettings,
    resetSetting,
    clearCache,
    useSetting
  };
};
