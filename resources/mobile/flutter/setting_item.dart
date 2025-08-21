import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../models/setting.dart';

class SettingItem extends StatefulWidget {
  final Setting setting;
  final bool readonly;
  final Function(Setting, dynamic)? onUpdate;
  final Function(Setting)? onReset;

  const SettingItem({
    Key? key,
    required this.setting,
    this.readonly = false,
    this.onUpdate,
    this.onReset,
  }) : super(key: key);

  @override
  State<SettingItem> createState() => _SettingItemState();
}

class _SettingItemState extends State<SettingItem> {
  late dynamic _localValue;
  late List<String> _arrayValue;
  late TextEditingController _textController;
  late TextEditingController _jsonController;
  bool _showValue = false;
  String? _errorMessage;
  String? _jsonError;

  @override
  void initState() {
    super.initState();
    _initializeValues();
  }

  @override
  void didUpdateWidget(SettingItem oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.setting.value != widget.setting.value) {
      _initializeValues();
    }
  }

  void _initializeValues() {
    _localValue = widget.setting.value;
    _arrayValue = widget.setting.type == SettingType.array && widget.setting.value is List
        ? List<String>.from(widget.setting.value)
        : <String>[];
    
    _textController = TextEditingController(
      text: _localValue?.toString() ?? '',
    );
    
    _jsonController = TextEditingController(
      text: widget.setting.type == SettingType.json
          ? _formatJson(widget.setting.value)
          : '',
    );
  }

  @override
  void dispose() {
    _textController.dispose();
    _jsonController.dispose();
    super.dispose();
  }

  String _formatJson(dynamic value) {
    try {
      if (value == null) return '';
      if (value is String) return value;
      return const JsonEncoder.withIndent('  ').convert(value);
    } catch (e) {
      return value.toString();
    }
  }

  bool get _hasDefaultValue => 
      widget.setting.defaultValue != null;

  bool get _isRequired => 
      widget.setting.validationRules?.contains('required') ?? false;

  String get _placeholder {
    if (_hasDefaultValue) {
      return 'Default: ${widget.setting.defaultValue}';
    }
    return 'Enter ${widget.setting.type.name} value...';
  }

  void _validateAndUpdate() {
    setState(() {
      _errorMessage = null;
    });

    if (_validateValue()) {
      widget.onUpdate?.call(widget.setting, _localValue);
    }
  }

  bool _validateValue() {
    final rules = widget.setting.validationRules ?? [];

    for (final rule in rules) {
      if (rule == 'required' && (_localValue == null || _localValue == '')) {
        setState(() {
          _errorMessage = 'This field is required';
        });
        return false;
      }

      if (rule == 'email' && _localValue != null && _localValue != '') {
        final emailRegex = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$');
        if (!emailRegex.hasMatch(_localValue.toString())) {
          setState(() {
            _errorMessage = 'Please enter a valid email address';
          });
          return false;
        }
      }

      if (rule.startsWith('min:')) {
        final min = int.tryParse(rule.substring(4));
        if (min != null) {
          if (widget.setting.type == SettingType.string && 
              _localValue.toString().length < min) {
            setState(() {
              _errorMessage = 'Minimum length is $min characters';
            });
            return false;
          }
          if ([SettingType.integer, SettingType.float].contains(widget.setting.type) &&
              (double.tryParse(_localValue.toString()) ?? 0) < min) {
            setState(() {
              _errorMessage = 'Minimum value is $min';
            });
            return false;
          }
        }
      }

      if (rule.startsWith('max:')) {
        final max = int.tryParse(rule.substring(4));
        if (max != null) {
          if (widget.setting.type == SettingType.string && 
              _localValue.toString().length > max) {
            setState(() {
              _errorMessage = 'Maximum length is $max characters';
            });
            return false;
          }
          if ([SettingType.integer, SettingType.float].contains(widget.setting.type) &&
              (double.tryParse(_localValue.toString()) ?? 0) > max) {
            setState(() {
              _errorMessage = 'Maximum value is $max';
            });
            return false;
          }
        }
      }
    }

    return true;
  }

  void _handleJsonUpdate() {
    setState(() {
      _jsonError = null;
    });

    try {
      final parsed = jsonDecode(_jsonController.text);
      _localValue = parsed;
      widget.onUpdate?.call(widget.setting, parsed);
    } catch (e) {
      setState(() {
        _jsonError = 'Invalid JSON format';
      });
    }
  }

  void _addArrayItem() {
    setState(() {
      _arrayValue.add('');
    });
  }

  void _removeArrayItem(int index) {
    setState(() {
      _arrayValue.removeAt(index);
    });
    widget.onUpdate?.call(widget.setting, _arrayValue.where((s) => s.isNotEmpty).toList());
  }

  void _updateArrayItem(int index, String value) {
    setState(() {
      _arrayValue[index] = value;
    });
  }

  void _handleArrayUpdate() {
    final filtered = _arrayValue.where((s) => s.isNotEmpty).toList();
    widget.onUpdate?.call(widget.setting, filtered);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final hasError = _errorMessage != null || _jsonError != null;

    return Card(
      elevation: hasError ? 2 : 1,
      color: hasError ? theme.colorScheme.errorContainer.withOpacity(0.1) : null,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              widget.setting.key,
                              style: theme.textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                          if (_isRequired)
                            Text(
                              ' *',
                              style: TextStyle(
                                color: theme.colorScheme.error,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                        ],
                      ),
                      if (widget.setting.description != null) ...[
                        const SizedBox(height: 4),
                        Text(
                          widget.setting.description!,
                          style: theme.textTheme.bodyMedium?.copyWith(
                            color: theme.colorScheme.onSurface.withOpacity(0.7),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                if (!widget.readonly) ...[
                  const SizedBox(width: 8),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (_hasDefaultValue)
                        IconButton(
                          onPressed: () => widget.onReset?.call(widget.setting),
                          icon: const Icon(Icons.refresh),
                          tooltip: 'Reset to default',
                          iconSize: 20,
                        ),
                      if (widget.setting.isEncrypted)
                        IconButton(
                          onPressed: () => setState(() => _showValue = !_showValue),
                          icon: Icon(_showValue ? Icons.visibility_off : Icons.visibility),
                          tooltip: _showValue ? 'Hide value' : 'Show value',
                          iconSize: 20,
                        ),
                    ],
                  ),
                ],
              ],
            ),
            
            const SizedBox(height: 12),
            
            // Field
            _buildField(theme),
            
            // Error Message
            if (_errorMessage != null) ...[
              const SizedBox(height: 8),
              Row(
                children: [
                  Icon(
                    Icons.error_outline,
                    size: 16,
                    color: theme.colorScheme.error,
                  ),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      _errorMessage!,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.error,
                      ),
                    ),
                  ),
                ],
              ),
            ],
            
            // JSON Error
            if (_jsonError != null) ...[
              const SizedBox(height: 8),
              Row(
                children: [
                  Icon(
                    Icons.error_outline,
                    size: 16,
                    color: theme.colorScheme.error,
                  ),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      _jsonError!,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.error,
                      ),
                    ),
                  ),
                ],
              ),
            ],
            
            // Metadata
            if (widget.setting.metadata != null && widget.setting.metadata!.isNotEmpty) ...[
              const SizedBox(height: 12),
              ExpansionTile(
                title: const Text('Additional Information'),
                children: [
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: theme.colorScheme.surface,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: theme.colorScheme.outline.withOpacity(0.2),
                        ),
                      ),
                      child: Text(
                        _formatJson(widget.setting.metadata),
                        style: theme.textTheme.bodySmall?.copyWith(
                          fontFamily: 'monospace',
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildField(ThemeData theme) {
    switch (widget.setting.type) {
      case SettingType.string:
        if (_localValue?.toString().length > 100) {
          return TextField(
            controller: _textController,
            maxLines: 4,
            readOnly: widget.readonly,
            decoration: InputDecoration(
              hintText: _placeholder,
              border: const OutlineInputBorder(),
            ),
            onChanged: (value) => _localValue = value,
            onEditingComplete: _validateAndUpdate,
          );
        }
        return TextField(
          controller: _textController,
          readOnly: widget.readonly,
          obscureText: widget.setting.isEncrypted && !_showValue,
          decoration: InputDecoration(
            hintText: _placeholder,
            border: const OutlineInputBorder(),
          ),
          onChanged: (value) => _localValue = value,
          onEditingComplete: _validateAndUpdate,
        );

      case SettingType.integer:
      case SettingType.float:
        return TextField(
          controller: _textController,
          readOnly: widget.readonly,
          keyboardType: TextInputType.numberWithOptions(
            decimal: widget.setting.type == SettingType.float,
          ),
          inputFormatters: [
            if (widget.setting.type == SettingType.integer)
              FilteringTextInputFormatter.digitsOnly,
            if (widget.setting.type == SettingType.float)
              FilteringTextInputFormatter.allow(RegExp(r'^\d*\.?\d*')),
          ],
          decoration: InputDecoration(
            hintText: _placeholder,
            border: const OutlineInputBorder(),
          ),
          onChanged: (value) {
            if (widget.setting.type == SettingType.integer) {
              _localValue = int.tryParse(value);
            } else {
              _localValue = double.tryParse(value);
            }
          },
          onEditingComplete: _validateAndUpdate,
        );

      case SettingType.boolean:
        return SwitchListTile(
          title: Text(_localValue == true ? 'On' : 'Off'),
          value: _localValue == true,
          onChanged: widget.readonly ? null : (value) {
            setState(() => _localValue = value);
            widget.onUpdate?.call(widget.setting, value);
          },
          contentPadding: EdgeInsets.zero,
        );

      case SettingType.array:
        return Column(
          children: [
            ..._arrayValue.asMap().entries.map((entry) {
              final index = entry.key;
              final value = entry.value;
              
              return Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  children: [
                    Expanded(
                      child: TextField(
                        initialValue: value,
                        readOnly: widget.readonly,
                        decoration: const InputDecoration(
                          border: OutlineInputBorder(),
                        ),
                        onChanged: (newValue) => _updateArrayItem(index, newValue),
                        onEditingComplete: _handleArrayUpdate,
                      ),
                    ),
                    if (!widget.readonly) ...[
                      const SizedBox(width: 8),
                      IconButton(
                        onPressed: () => _removeArrayItem(index),
                        icon: const Icon(Icons.remove_circle_outline),
                        color: theme.colorScheme.error,
                      ),
                    ],
                  ],
                ),
              );
            }),
            if (!widget.readonly)
              Align(
                alignment: Alignment.centerLeft,
                child: TextButton.icon(
                  onPressed: _addArrayItem,
                  icon: const Icon(Icons.add),
                  label: const Text('Add Item'),
                ),
              ),
          ],
        );

      case SettingType.json:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            TextField(
              controller: _jsonController,
              maxLines: 6,
              readOnly: widget.readonly,
              style: const TextStyle(fontFamily: 'monospace'),
              decoration: const InputDecoration(
                hintText: 'Enter valid JSON',
                border: OutlineInputBorder(),
              ),
              onEditingComplete: _handleJsonUpdate,
            ),
          ],
        );

      case SettingType.file:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _textController,
                    readOnly: widget.readonly,
                    decoration: InputDecoration(
                      hintText: _placeholder,
                      border: const OutlineInputBorder(),
                    ),
                    onChanged: (value) => _localValue = value,
                    onEditingComplete: _validateAndUpdate,
                  ),
                ),
                if (!widget.readonly) ...[
                  const SizedBox(width: 8),
                  ElevatedButton.icon(
                    onPressed: () {
                      // Implement file picker
                      // This would open a file picker dialog
                    },
                    icon: const Icon(Icons.folder_open),
                    label: const Text('Browse'),
                  ),
                ],
              ],
            ),
            if (_localValue != null && _isImageFile(_localValue.toString())) ...[
              const SizedBox(height: 8),
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: Image.network(
                  _localValue.toString(),
                  height: 150,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) {
                    return Container(
                      height: 150,
                      color: theme.colorScheme.surfaceVariant,
                      child: const Center(
                        child: Icon(Icons.broken_image),
                      ),
                    );
                  },
                ),
              ),
            ],
          ],
        );

      case SettingType.encrypted:
        return TextField(
          controller: _textController,
          readOnly: widget.readonly,
          obscureText: !_showValue,
          decoration: InputDecoration(
            hintText: _placeholder,
            border: const OutlineInputBorder(),
          ),
          onChanged: (value) => _localValue = value,
          onEditingComplete: _validateAndUpdate,
        );

      default:
        return TextField(
          controller: _textController,
          readOnly: widget.readonly,
          decoration: InputDecoration(
            hintText: _placeholder,
            border: const OutlineInputBorder(),
          ),
          onChanged: (value) => _localValue = value,
          onEditingComplete: _validateAndUpdate,
        );
    }
  }

  bool _isImageFile(String path) {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    final extension = path.split('.').last.toLowerCase();
    return imageExtensions.contains(extension);
  }
}
