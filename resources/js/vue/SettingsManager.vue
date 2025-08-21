<template>
  <div class="settings-manager">
    <div class="settings-header">
      <h2 class="settings-title">{{ title || 'Settings' }}</h2>
      <div class="settings-actions">
        <button
          v-if="allowExport"
          @click="exportSettings"
          class="btn btn-outline"
          :disabled="loading"
        >
          <i class="icon-download"></i> Export
        </button>
        <button
          v-if="allowImport"
          @click="showImportDialog = true"
          class="btn btn-outline"
          :disabled="loading"
        >
          <i class="icon-upload"></i> Import
        </button>
        <button
          v-if="hasChanges"
          @click="saveAllSettings"
          class="btn btn-primary"
          :disabled="loading"
        >
          <i class="icon-save"></i> Save All
        </button>
      </div>
    </div>

    <!-- Search and Filters -->
    <div class="settings-toolbar">
      <div class="search-box">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search settings..."
          class="search-input"
        />
        <i class="icon-search"></i>
      </div>
      
      <div class="filter-tabs">
        <button
          v-for="group in availableGroups"
          :key="group.key"
          @click="activeGroup = group.key"
          class="tab-button"
          :class="{ active: activeGroup === group.key }"
        >
          <i v-if="group.icon" :class="group.icon"></i>
          {{ group.name }}
        </button>
      </div>
    </div>

    <!-- Settings Content -->
    <div class="settings-content" v-if="!loading">
      <div v-if="filteredSettings.length === 0" class="empty-state">
        <i class="icon-settings"></i>
        <h3>No settings found</h3>
        <p>Try adjusting your search or filter criteria.</p>
      </div>

      <div v-else class="settings-grid">
        <SettingItem
          v-for="setting in filteredSettings"
          :key="setting.key"
          :setting="setting"
          :readonly="readonly"
          @update="handleSettingUpdate"
          @reset="handleSettingReset"
        />
      </div>
    </div>

    <!-- Loading State -->
    <div v-else class="loading-state">
      <div class="spinner"></div>
      <p>Loading settings...</p>
    </div>

    <!-- Import Dialog -->
    <ImportDialog
      v-if="showImportDialog"
      @close="showImportDialog = false"
      @import="handleImport"
    />

    <!-- Confirmation Dialog -->
    <ConfirmDialog
      v-if="showConfirmDialog"
      :message="confirmMessage"
      @confirm="confirmAction"
      @cancel="showConfirmDialog = false"
    />

    <!-- Notifications -->
    <div v-if="notification" class="notification" :class="notification.type">
      {{ notification.message }}
    </div>
  </div>
</template>

<script>
import SettingItem from './SettingItem.vue'
import ImportDialog from './ImportDialog.vue'
import ConfirmDialog from './ConfirmDialog.vue'
import { useSettings } from '../composables/useSettings'

export default {
  name: 'SettingsManager',
  components: {
    SettingItem,
    ImportDialog,
    ConfirmDialog
  },
  props: {
    title: {
      type: String,
      default: 'Settings'
    },
    groups: {
      type: Array,
      default: () => []
    },
    owner: {
      type: Object,
      default: null
    },
    readonly: {
      type: Boolean,
      default: false
    },
    allowExport: {
      type: Boolean,
      default: true
    },
    allowImport: {
      type: Boolean,
      default: true
    },
    autoSave: {
      type: Boolean,
      default: false
    }
  },
  setup(props, { emit }) {
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
    } = useSettings(props.owner)

    return {
      settings,
      loading,
      error,
      loadSettings,
      updateSetting,
      saveBulkSettings,
      exportSettings,
      importSettings,
      resetSetting
    }
  },
  data() {
    return {
      searchQuery: '',
      activeGroup: 'all',
      changedSettings: new Map(),
      showImportDialog: false,
      showConfirmDialog: false,
      confirmMessage: '',
      confirmAction: null,
      notification: null
    }
  },
  computed: {
    availableGroups() {
      const allGroup = { key: 'all', name: 'All Settings', icon: 'icon-grid' }
      const settingsGroups = this.groups.length > 0 ? this.groups : [
        { key: 'general', name: 'General', icon: 'icon-settings' },
        { key: 'appearance', name: 'Appearance', icon: 'icon-palette' },
        { key: 'notifications', name: 'Notifications', icon: 'icon-bell' },
        { key: 'security', name: 'Security', icon: 'icon-shield' }
      ]
      return [allGroup, ...settingsGroups]
    },
    filteredSettings() {
      let filtered = this.settings

      // Filter by group
      if (this.activeGroup !== 'all') {
        filtered = filtered.filter(setting => 
          setting.group && setting.group.key === this.activeGroup
        )
      }

      // Filter by search query
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase()
        filtered = filtered.filter(setting =>
          setting.key.toLowerCase().includes(query) ||
          (setting.description && setting.description.toLowerCase().includes(query))
        )
      }

      return filtered
    },
    hasChanges() {
      return this.changedSettings.size > 0
    }
  },
  async mounted() {
    await this.loadSettings()
  },
  methods: {
    async handleSettingUpdate(setting, newValue) {
      try {
        if (this.autoSave) {
          await this.updateSetting(setting.key, newValue)
          this.showNotification('Setting saved successfully', 'success')
        } else {
          this.changedSettings.set(setting.key, { setting, newValue })
        }
        
        this.$emit('setting-changed', {
          key: setting.key,
          oldValue: setting.value,
          newValue,
          setting
        })
      } catch (error) {
        this.showNotification(`Failed to update setting: ${error.message}`, 'error')
      }
    },

    async handleSettingReset(setting) {
      this.confirmMessage = `Are you sure you want to reset "${setting.key}" to its default value?`
      this.confirmAction = async () => {
        try {
          await this.resetSetting(setting.key)
          this.changedSettings.delete(setting.key)
          this.showNotification('Setting reset successfully', 'success')
          this.showConfirmDialog = false
        } catch (error) {
          this.showNotification(`Failed to reset setting: ${error.message}`, 'error')
        }
      }
      this.showConfirmDialog = true
    },

    async saveAllSettings() {
      if (this.changedSettings.size === 0) return

      try {
        const settingsToSave = {}
        this.changedSettings.forEach((item, key) => {
          settingsToSave[key] = item.newValue
        })

        await this.saveBulkSettings(settingsToSave)
        this.changedSettings.clear()
        this.showNotification('All settings saved successfully', 'success')
        
        this.$emit('settings-saved', settingsToSave)
      } catch (error) {
        this.showNotification(`Failed to save settings: ${error.message}`, 'error')
      }
    },

    async handleExportSettings() {
      try {
        const exportedData = await this.exportSettings(
          this.activeGroup === 'all' ? [] : [this.activeGroup]
        )
        
        const blob = new Blob([JSON.stringify(exportedData, null, 2)], {
          type: 'application/json'
        })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `settings-${new Date().toISOString().split('T')[0]}.json`
        a.click()
        URL.revokeObjectURL(url)
        
        this.showNotification('Settings exported successfully', 'success')
        this.$emit('settings-exported', exportedData)
      } catch (error) {
        this.showNotification(`Failed to export settings: ${error.message}`, 'error')
      }
    },

    async handleImport(importData, overwrite = false) {
      try {
        await this.importSettings(importData, overwrite)
        await this.loadSettings() // Reload to show imported settings
        this.showImportDialog = false
        this.showNotification('Settings imported successfully', 'success')
        
        this.$emit('settings-imported', importData)
      } catch (error) {
        this.showNotification(`Failed to import settings: ${error.message}`, 'error')
      }
    },

    showNotification(message, type = 'info') {
      this.notification = { message, type }
      setTimeout(() => {
        this.notification = null
      }, 5000)
    }
  }
}
</script>

<style scoped>
.settings-manager {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e2e8f0;
}

.settings-title {
  font-size: 28px;
  font-weight: 600;
  margin: 0;
  color: #1a202c;
}

.settings-actions {
  display: flex;
  gap: 12px;
}

.btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-outline {
  background: white;
  color: #4a5568;
  border-color: #e2e8f0;
}

.btn-outline:hover {
  background: #f7fafc;
  border-color: #cbd5e0;
}

.btn-primary {
  background: #3182ce;
  color: white;
}

.btn-primary:hover {
  background: #2c5aa0;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.settings-toolbar {
  display: flex;
  gap: 20px;
  margin-bottom: 24px;
  align-items: center;
}

.search-box {
  position: relative;
  flex: 1;
  max-width: 400px;
}

.search-input {
  width: 100%;
  padding: 10px 40px 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
}

.search-box .icon-search {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #a0aec0;
}

.filter-tabs {
  display: flex;
  gap: 4px;
}

.tab-button {
  padding: 8px 16px;
  border: none;
  background: transparent;
  color: #4a5568;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.tab-button:hover {
  background: #f7fafc;
}

.tab-button.active {
  background: #3182ce;
  color: white;
}

.settings-content {
  min-height: 400px;
}

.settings-grid {
  display: grid;
  gap: 16px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #a0aec0;
}

.empty-state i {
  font-size: 48px;
  margin-bottom: 16px;
  display: block;
}

.empty-state h3 {
  margin: 0 0 8px 0;
  color: #4a5568;
}

.loading-state {
  text-align: center;
  padding: 60px 20px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e2e8f0;
  border-top: 4px solid #3182ce;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.notification {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 12px 20px;
  border-radius: 6px;
  color: white;
  font-weight: 500;
  z-index: 1000;
  animation: slideIn 0.3s ease-out;
}

.notification.success {
  background: #38a169;
}

.notification.error {
  background: #e53e3e;
}

.notification.info {
  background: #3182ce;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .settings-header {
    flex-direction: column;
    gap: 16px;
  }

  .settings-toolbar {
    flex-direction: column;
    gap: 12px;
  }

  .search-box {
    max-width: none;
  }

  .filter-tabs {
    overflow-x: auto;
    white-space: nowrap;
    width: 100%;
  }
}
</style>
