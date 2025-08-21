import { ref, reactive, computed } from 'vue'
import axios from 'axios'

export function useSettings(owner = null) {
  const settings = ref([])
  const loading = ref(false)
  const error = ref(null)

  const state = reactive({
    cache: new Map(),
    apiBase: '/api/settings'
  })

  const ownerParams = computed(() => {
    if (!owner) return {}
    return {
      owner_type: owner.constructor.name,
      owner_id: owner.id
    }
  })

  async function loadSettings(groups = []) {
    loading.value = true
    error.value = null

    try {
      const params = {
        ...ownerParams.value,
        ...(groups.length > 0 && { groups: groups.join(',') })
      }

      const response = await axios.get(state.apiBase, { params })
      settings.value = response.data.data || response.data
      
      // Cache the settings
      settings.value.forEach(setting => {
        const cacheKey = getCacheKey(setting.key, owner)
        state.cache.set(cacheKey, setting.value)
      })
    } catch (err) {
      error.value = err.response?.data?.message || err.message
      console.error('Failed to load settings:', err)
    } finally {
      loading.value = false
    }
  }

  async function getSetting(key, defaultValue = null, ownerOverride = null) {
    const targetOwner = ownerOverride || owner
    const cacheKey = getCacheKey(key, targetOwner)
    
    // Check cache first
    if (state.cache.has(cacheKey)) {
      return state.cache.get(cacheKey)
    }

    try {
      const params = getOwnerParams(targetOwner)
      const response = await axios.get(`${state.apiBase}/${key}`, { params })
      const value = response.data.value
      
      // Cache the value
      state.cache.set(cacheKey, value)
      return value
    } catch (err) {
      if (err.response?.status === 404) {
        return defaultValue
      }
      throw err
    }
  }

  async function updateSetting(key, value, options = {}) {
    loading.value = true
    error.value = null

    try {
      const data = {
        value,
        ...ownerParams.value,
        ...options
      }

      const response = await axios.put(`${state.apiBase}/${key}`, data)
      
      // Update cache
      const cacheKey = getCacheKey(key, owner)
      state.cache.set(cacheKey, value)
      
      // Update local settings array
      const settingIndex = settings.value.findIndex(s => s.key === key)
      if (settingIndex >= 0) {
        settings.value[settingIndex].value = value
      }

      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createSetting(key, value, options = {}) {
    loading.value = true
    error.value = null

    try {
      const data = {
        key,
        value,
        ...ownerParams.value,
        ...options
      }

      const response = await axios.post(state.apiBase, data)
      
      // Add to local settings and cache
      const newSetting = { key, value, ...options }
      settings.value.push(newSetting)
      
      const cacheKey = getCacheKey(key, owner)
      state.cache.set(cacheKey, value)

      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteSetting(key) {
    loading.value = true
    error.value = null

    try {
      const params = ownerParams.value
      const response = await axios.delete(`${state.apiBase}/${key}`, { params })
      
      // Remove from cache and local settings
      const cacheKey = getCacheKey(key, owner)
      state.cache.delete(cacheKey)
      
      const settingIndex = settings.value.findIndex(s => s.key === key)
      if (settingIndex >= 0) {
        settings.value.splice(settingIndex, 1)
      }

      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function saveBulkSettings(settingsData) {
    loading.value = true
    error.value = null

    try {
      const data = {
        settings: settingsData,
        ...ownerParams.value
      }

      const response = await axios.post(`${state.apiBase}/bulk`, data)
      
      // Update cache and local settings
      Object.entries(settingsData).forEach(([key, value]) => {
        const cacheKey = getCacheKey(key, owner)
        state.cache.set(cacheKey, value)
        
        const settingIndex = settings.value.findIndex(s => s.key === key)
        if (settingIndex >= 0) {
          settings.value[settingIndex].value = value
        }
      })

      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function exportSettings(groups = []) {
    try {
      const params = {
        ...ownerParams.value,
        ...(groups.length > 0 && { groups: groups.join(',') })
      }

      const response = await axios.get(`${state.apiBase}/export`, { params })
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || err.message
      throw err
    }
  }

  async function importSettings(settingsData, overwrite = false) {
    loading.value = true
    error.value = null

    try {
      const data = {
        settings: settingsData,
        overwrite,
        ...ownerParams.value
      }

      const response = await axios.post(`${state.apiBase}/import`, data)
      
      // Clear cache to force reload
      state.cache.clear()
      
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function resetSetting(key) {
    const setting = settings.value.find(s => s.key === key)
    if (setting && setting.default_value !== null) {
      return await updateSetting(key, setting.default_value)
    }
    return await deleteSetting(key)
  }

  function clearCache(key = null, ownerOverride = null) {
    if (key) {
      const cacheKey = getCacheKey(key, ownerOverride || owner)
      state.cache.delete(cacheKey)
    } else {
      state.cache.clear()
    }
  }

  function getCacheKey(key, targetOwner) {
    if (!targetOwner) {
      return `global:${key}`
    }
    return `${targetOwner.constructor.name}:${targetOwner.id}:${key}`
  }

  function getOwnerParams(targetOwner) {
    if (!targetOwner) return {}
    return {
      owner_type: targetOwner.constructor.name,
      owner_id: targetOwner.id
    }
  }

  // Watch settings for reactive updates
  function watchSetting(key, callback, immediate = false) {
    const setting = computed(() => {
      const found = settings.value.find(s => s.key === key)
      return found ? found.value : null
    })

    return watch(setting, callback, { immediate })
  }

  // Computed helper for getting a specific setting reactively
  function useSetting(key, defaultValue = null) {
    return computed({
      get() {
        const setting = settings.value.find(s => s.key === key)
        return setting ? setting.value : defaultValue
      },
      set(value) {
        updateSetting(key, value)
      }
    })
  }

  return {
    // State
    settings: readonly(settings),
    loading: readonly(loading),
    error: readonly(error),
    
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
    watchSetting,
    useSetting
  }
}
