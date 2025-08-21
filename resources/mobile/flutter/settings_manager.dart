import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../models/setting.dart';
import '../services/settings_service.dart';
import 'setting_item.dart';
import 'import_dialog.dart';

class SettingsManager extends StatefulWidget {
  final String title;
  final List<SettingGroup> groups;
  final dynamic owner;
  final bool readonly;
  final bool allowExport;
  final bool allowImport;
  final bool autoSave;
  final Function(Setting, dynamic, dynamic)? onSettingChanged;
  final Function(Map<String, dynamic>)? onSettingsSaved;
  final Function(List<Map<String, dynamic>>)? onSettingsExported;
  final Function(List<Map<String, dynamic>>)? onSettingsImported;

  const SettingsManager({
    Key? key,
    this.title = 'Settings',
    this.groups = const [],
    this.owner,
    this.readonly = false,
    this.allowExport = true,
    this.allowImport = true,
    this.autoSave = false,
    this.onSettingChanged,
    this.onSettingsSaved,
    this.onSettingsExported,
    this.onSettingsImported,
  }) : super(key: key);

  @override
  State<SettingsManager> createState() => _SettingsManagerState();
}

class _SettingsManagerState extends State<SettingsManager>
    with TickerProviderStateMixin {
  final SettingsService _settingsService = SettingsService();
  final TextEditingController _searchController = TextEditingController();
  final Map<String, SettingChangeItem> _changedSettings = {};
  
  List<Setting> _settings = [];
  List<Setting> _filteredSettings = [];
  bool _loading = false;
  String? _error;
  String _activeGroup = 'all';
  TabController? _tabController;
  
  List<SettingGroup> get _availableGroups {
    final allGroup = SettingGroup(key: 'all', name: 'All Settings', icon: Icons.grid_view);
    final settingsGroups = widget.groups.isEmpty ? [
      SettingGroup(key: 'general', name: 'General', icon: Icons.settings),
      SettingGroup(key: 'appearance', name: 'Appearance', icon: Icons.palette),
      SettingGroup(key: 'notifications', name: 'Notifications', icon: Icons.notifications),
      SettingGroup(key: 'security', name: 'Security', icon: Icons.security),
    ] : widget.groups;
    return [allGroup, ...settingsGroups];
  }

  bool get hasChanges => _changedSettings.isNotEmpty;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _availableGroups.length, vsync: this);
    _tabController!.addListener(_handleTabChange);
    _searchController.addListener(_filterSettings);
    _loadSettings();
  }

  @override
  void dispose() {
    _tabController?.dispose();
    _searchController.dispose();
    super.dispose();
  }

  void _handleTabChange() {
    if (_tabController!.indexIsChanging) {
      setState(() {
        _activeGroup = _availableGroups[_tabController!.index].key;
      });
      _filterSettings();
    }
  }

  Future<void> _loadSettings() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final settings = await _settingsService.loadSettings(
        owner: widget.owner,
        groups: widget.groups.isEmpty ? null : widget.groups.map((g) => g.key).toList(),
      );
      
      setState(() {
        _settings = settings;
        _loading = false;
      });
      
      _filterSettings();
    } catch (e) {
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  void _filterSettings() {
    List<Setting> filtered = _settings;

    // Filter by group
    if (_activeGroup != 'all') {
      filtered = filtered.where((setting) => 
        setting.group?.key == _activeGroup
      ).toList();
    }

    // Filter by search query
    final query = _searchController.text.toLowerCase();
    if (query.isNotEmpty) {
      filtered = filtered.where((setting) =>
        setting.key.toLowerCase().contains(query) ||
        (setting.description?.toLowerCase().contains(query) ?? false)
      ).toList();
    }

    setState(() {
      _filteredSettings = filtered;
    });
  }

  Future<void> _handleSettingUpdate(Setting setting, dynamic newValue) async {
    try {
      if (widget.autoSave) {
        await _settingsService.updateSetting(
          setting.key,
          newValue,
          owner: widget.owner,
        );
        _showSnackBar('Setting saved successfully', Colors.green);
      } else {
        _changedSettings[setting.key] = SettingChangeItem(
          setting: setting,
          newValue: newValue,
        );
        setState(() {}); // Update hasChanges
      }
      
      widget.onSettingChanged?.call(setting, setting.value, newValue);
    } catch (e) {
      _showSnackBar('Failed to update setting: $e', Colors.red);
    }
  }

  Future<void> _handleSettingReset(Setting setting) async {
    final confirmed = await _showConfirmDialog(
      'Reset Setting',
      'Are you sure you want to reset "${setting.key}" to its default value?',
    );
    
    if (confirmed == true) {
      try {
        await _settingsService.resetSetting(setting.key, owner: widget.owner);
        _changedSettings.remove(setting.key);
        await _loadSettings(); // Reload to show reset value
        _showSnackBar('Setting reset successfully', Colors.green);
      } catch (e) {
        _showSnackBar('Failed to reset setting: $e', Colors.red);
      }
    }
  }

  Future<void> _saveAllSettings() async {
    if (_changedSettings.isEmpty) return;

    setState(() => _loading = true);

    try {
      final settingsToSave = <String, dynamic>{};
      _changedSettings.forEach((key, item) {
        settingsToSave[key] = item.newValue;
      });

      await _settingsService.saveBulkSettings(
        settingsToSave,
        owner: widget.owner,
      );
      
      _changedSettings.clear();
      await _loadSettings(); // Reload to show saved values
      _showSnackBar('All settings saved successfully', Colors.green);
      
      widget.onSettingsSaved?.call(settingsToSave);
    } catch (e) {
      _showSnackBar('Failed to save settings: $e', Colors.red);
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _exportSettings() async {
    try {
      final groups = _activeGroup == 'all' ? <String>[] : [_activeGroup];
      final exportedData = await _settingsService.exportSettings(
        owner: widget.owner,
        groups: groups,
      );
      
      // Copy to clipboard
      await Clipboard.setData(ClipboardData(
        text: exportedData,
      ));
      
      _showSnackBar('Settings exported to clipboard', Colors.green);
      widget.onSettingsExported?.call(exportedData);
    } catch (e) {
      _showSnackBar('Failed to export settings: $e', Colors.red);
    }
  }

  Future<void> _importSettings() async {
    final result = await showDialog<ImportResult>(
      context: context,
      builder: (context) => const ImportDialog(),
    );
    
    if (result != null) {
      try {
        await _settingsService.importSettings(
          result.data,
          overwrite: result.overwrite,
          owner: widget.owner,
        );
        
        await _loadSettings(); // Reload to show imported settings
        _showSnackBar('Settings imported successfully', Colors.green);
        
        widget.onSettingsImported?.call(result.data);
      } catch (e) {
        _showSnackBar('Failed to import settings: $e', Colors.red);
      }
    }
  }

  void _showSnackBar(String message, Color backgroundColor) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: backgroundColor,
        behavior: SnackBarBehavior.floating,
        margin: const EdgeInsets.all(16),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
      ),
    );
  }

  Future<bool?> _showConfirmDialog(String title, String message) {
    return showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Confirm'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.title),
        actions: [
          if (widget.allowExport)
            IconButton(
              onPressed: _loading ? null : _exportSettings,
              icon: const Icon(Icons.download),
              tooltip: 'Export Settings',
            ),
          if (widget.allowImport)
            IconButton(
              onPressed: _loading ? null : _importSettings,
              icon: const Icon(Icons.upload),
              tooltip: 'Import Settings',
            ),
          if (hasChanges)
            IconButton(
              onPressed: _loading ? null : _saveAllSettings,
              icon: const Icon(Icons.save),
              tooltip: 'Save All Changes',
            ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(100),
          child: Column(
            children: [
              // Search Bar
              Padding(
                padding: const EdgeInsets.all(16),
                child: TextField(
                  controller: _searchController,
                  decoration: const InputDecoration(
                    hintText: 'Search settings...',
                    prefixIcon: Icon(Icons.search),
                    border: OutlineInputBorder(),
                    contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  ),
                ),
              ),
              // Group Tabs
              TabBar(
                controller: _tabController,
                isScrollable: true,
                tabs: _availableGroups.map((group) => Tab(
                  icon: Icon(group.icon),
                  text: group.name,
                )).toList(),
              ),
            ],
          ),
        ),
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_loading && _settings.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text('Loading settings...'),
          ],
        ),
      );
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.error_outline,
              size: 64,
              color: Theme.of(context).colorScheme.error,
            ),
            const SizedBox(height: 16),
            Text(
              'Error loading settings',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            Text(
              _error!,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadSettings,
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (_filteredSettings.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.settings_outlined,
              size: 64,
              color: Colors.grey,
            ),
            SizedBox(height: 16),
            Text(
              'No settings found',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w500,
                color: Colors.grey,
              ),
            ),
            SizedBox(height: 8),
            Text(
              'Try adjusting your search or filter criteria.',
              style: TextStyle(color: Colors.grey),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadSettings,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _filteredSettings.length,
        itemBuilder: (context, index) {
          final setting = _filteredSettings[index];
          return Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: SettingItem(
              setting: setting,
              readonly: widget.readonly,
              onUpdate: _handleSettingUpdate,
              onReset: _handleSettingReset,
            ),
          );
        },
      ),
    );
  }
}

class SettingGroup {
  final String key;
  final String name;
  final IconData icon;

  const SettingGroup({
    required this.key,
    required this.name,
    required this.icon,
  });
}

class SettingChangeItem {
  final Setting setting;
  final dynamic newValue;

  const SettingChangeItem({
    required this.setting,
    required this.newValue,
  });
}

class ImportResult {
  final List<Map<String, dynamic>> data;
  final bool overwrite;

  const ImportResult({
    required this.data,
    required this.overwrite,
  });
}
