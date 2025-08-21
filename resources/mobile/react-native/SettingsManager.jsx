import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { SettingItem } from './SettingItem';
import { ImportDialog } from './ImportDialog';
import { useSettings } from '../hooks/useSettings';

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
  onSettingsImported,
  style,
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
    resetSetting,
  } = useSettings(owner);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeGroup, setActiveGroup] = useState('all');
  const [changedSettings, setChangedSettings] = useState(new Map());
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [notification, setNotification] = useState(null);

  const availableGroups = useMemo(() => {
    const allGroup = { key: 'all', name: 'All Settings', icon: 'grid-view' };
    const settingsGroups = groups.length > 0 ? groups : [
      { key: 'general', name: 'General', icon: 'settings' },
      { key: 'appearance', name: 'Appearance', icon: 'palette' },
      { key: 'notifications', name: 'Notifications', icon: 'notifications' },
      { key: 'security', name: 'Security', icon: 'security' },
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

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showNotification = useCallback((message, type = 'info') => {
    setNotification({ message, type });
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
        setting,
      });
    } catch (error) {
      showNotification(`Failed to update setting: ${error.message}`, 'error');
    }
  }, [autoSave, updateSetting, onSettingChanged, showNotification]);

  const handleSettingReset = useCallback((setting) => {
    Alert.alert(
      'Reset Setting',
      `Are you sure you want to reset "${setting.key}" to its default value?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await resetSetting(setting.key);
              setChangedSettings(prev => {
                const newMap = new Map(prev);
                newMap.delete(setting.key);
                return newMap;
              });
              showNotification('Setting reset successfully', 'success');
            } catch (error) {
              showNotification(`Failed to reset setting: ${error.message}`, 'error');
            }
          },
        },
      ]
    );
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
      
      // On React Native, you might want to share the data or copy to clipboard
      // This depends on your specific implementation
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

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.headerActions}>
        {allowExport && (
          <TouchableOpacity
            style={[styles.actionButton, loading && styles.disabledButton]}
            onPress={handleExportSettings}
            disabled={loading}
          >
            <Icon name="download" size={20} color="#666" />
          </TouchableOpacity>
        )}
        {allowImport && (
          <TouchableOpacity
            style={[styles.actionButton, loading && styles.disabledButton]}
            onPress={() => setShowImportDialog(true)}
            disabled={loading}
          >
            <Icon name="upload" size={20} color="#666" />
          </TouchableOpacity>
        )}
        {hasChanges && (
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton, loading && styles.disabledButton]}
            onPress={saveAllSettings}
            disabled={loading}
          >
            <Icon name="save" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchBox}>
        <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search settings..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
      </View>
    </View>
  );

  const renderGroupTabs = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.tabsContainer}
      contentContainerStyle={styles.tabsContent}
    >
      {availableGroups.map(group => (
        <TouchableOpacity
          key={group.key}
          style={[
            styles.tab,
            activeGroup === group.key && styles.activeTab,
          ]}
          onPress={() => setActiveGroup(group.key)}
        >
          <Icon
            name={group.icon}
            size={16}
            color={activeGroup === group.key ? '#007AFF' : '#666'}
          />
          <Text
            style={[
              styles.tabText,
              activeGroup === group.key && styles.activeTabText,
            ]}
          >
            {group.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderContent = () => {
    if (loading && settings.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <Icon name="error-outline" size={64} color="#FF3B30" />
          <Text style={styles.errorTitle}>Error loading settings</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadSettings}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (filteredSettings.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Icon name="settings" size={64} color="#999" />
          <Text style={styles.emptyTitle}>No settings found</Text>
          <Text style={styles.emptyMessage}>
            Try adjusting your search or filter criteria.
          </Text>
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadSettings} />
        }
      >
        {filteredSettings.map(setting => (
          <SettingItem
            key={setting.key}
            setting={setting}
            readonly={readonly}
            onUpdate={handleSettingUpdate}
            onReset={handleSettingReset}
            style={styles.settingItem}
          />
        ))}
      </ScrollView>
    );
  };

  const renderNotification = () => {
    if (!notification) return null;

    const backgroundColor = {
      success: '#34C759',
      error: '#FF3B30',
      info: '#007AFF',
    }[notification.type] || '#007AFF';

    return (
      <View style={[styles.notification, { backgroundColor }]}>
        <Text style={styles.notificationText}>{notification.message}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, style]}>
      {renderHeader()}
      {renderSearchBar()}
      {renderGroupTabs()}
      {renderContent()}
      {renderNotification()}
      
      <Modal
        visible={showImportDialog}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowImportDialog(false)}
      >
        <ImportDialog
          onClose={() => setShowImportDialog(false)}
          onImport={handleImport}
        />
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
    minWidth: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  disabledButton: {
    opacity: 0.5,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    color: '#000',
  },
  tabsContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  tabsContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
  },
  activeTab: {
    backgroundColor: '#E3F2FD',
  },
  tabText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#007AFF',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  settingItem: {
    marginBottom: 12,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  errorMessage: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '500',
    color: '#666',
  },
  emptyMessage: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  notification: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 100 : 80,
    left: 16,
    right: 16,
    padding: 12,
    borderRadius: 8,
    zIndex: 1000,
  },
  notificationText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});
