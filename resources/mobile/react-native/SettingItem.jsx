import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

export const SettingItem = ({ setting, readonly = false, onUpdate, onReset, style }) => {
  const [localValue, setLocalValue] = useState(setting.value);
  const [showValue, setShowValue] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [arrayValue, setArrayValue] = useState(
    Array.isArray(setting.value) ? [...setting.value] : []
  );
  const [jsonValue, setJsonValue] = useState(
    setting.type === 'json' ? JSON.stringify(setting.value, null, 2) : ''
  );

  const textInputRef = useRef(null);

  const hasError = !!errorMessage || !!jsonError;
  const hasDefaultValue = setting.default_value != null;
  const isRequired = setting.validation_rules?.includes('required');
  
  const placeholder = hasDefaultValue 
    ? `Default: ${setting.default_value}` 
    : `Enter ${setting.type} value...`;

  useEffect(() => {
    setLocalValue(setting.value);
    if (setting.type === 'array') {
      setArrayValue(Array.isArray(setting.value) ? [...setting.value] : []);
    }
    if (setting.type === 'json') {
      setJsonValue(JSON.stringify(setting.value, null, 2));
    }
  }, [setting.value, setting.type]);

  const validateValue = (value = localValue) => {
    setErrorMessage('');
    
    if (!setting.validation_rules) return true;

    const rules = Array.isArray(setting.validation_rules) 
      ? setting.validation_rules 
      : [];

    for (const rule of rules) {
      if (rule === 'required' && (!value || value === '')) {
        setErrorMessage('This field is required');
        return false;
      }
      
      if (rule === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          setErrorMessage('Please enter a valid email address');
          return false;
        }
      }
      
      if (rule.startsWith('min:')) {
        const min = parseInt(rule.split(':')[1]);
        if (setting.type === 'string' && value.length < min) {
          setErrorMessage(`Minimum length is ${min} characters`);
          return false;
        }
        if (['integer', 'float'].includes(setting.type) && value < min) {
          setErrorMessage(`Minimum value is ${min}`);
          return false;
        }
      }
      
      if (rule.startsWith('max:')) {
        const max = parseInt(rule.split(':')[1]);
        if (setting.type === 'string' && value.length > max) {
          setErrorMessage(`Maximum length is ${max} characters`);
          return false;
        }
        if (['integer', 'float'].includes(setting.type) && value > max) {
          setErrorMessage(`Maximum value is ${max}`);
          return false;
        }
      }
    }

    return true;
  };

  const handleUpdate = () => {
    if (validateValue()) {
      onUpdate?.(setting, localValue);
    }
  };

  const handleArrayUpdate = () => {
    setErrorMessage('');
    const filteredArray = arrayValue.filter(item => item.trim() !== '');
    onUpdate?.(setting, filteredArray);
  };

  const handleJsonUpdate = () => {
    setJsonError('');
    
    try {
      const parsed = JSON.parse(jsonValue);
      onUpdate?.(setting, parsed);
    } catch (error) {
      setJsonError('Invalid JSON format');
    }
  };

  const addArrayItem = () => {
    setArrayValue([...arrayValue, '']);
  };

  const removeArrayItem = (index) => {
    const newArray = [...arrayValue];
    newArray.splice(index, 1);
    setArrayValue(newArray);
    onUpdate?.(setting, newArray.filter(item => item.trim() !== ''));
  };

  const updateArrayItem = (index, value) => {
    const newArray = [...arrayValue];
    newArray[index] = value;
    setArrayValue(newArray);
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Setting',
      `Are you sure you want to reset "${setting.key}" to its default value?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: () => onReset?.(setting) },
      ]
    );
  };

  const renderField = () => {
    switch (setting.type) {
      case 'string':
        if (typeof localValue === 'string' && localValue.length > 100) {
          return (
            <TextInput
              ref={textInputRef}
              style={[styles.textInput, styles.textArea]}
              value={localValue || ''}
              onChangeText={setLocalValue}
              onBlur={handleUpdate}
              editable={!readonly}
              placeholder={placeholder}
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
            />
          );
        }
        return (
          <TextInput
            ref={textInputRef}
            style={styles.textInput}
            value={localValue || ''}
            onChangeText={setLocalValue}
            onBlur={handleUpdate}
            editable={!readonly}
            placeholder={placeholder}
            placeholderTextColor="#999"
            secureTextEntry={setting.is_encrypted && !showValue}
          />
        );

      case 'integer':
      case 'float':
        return (
          <TextInput
            style={styles.textInput}
            value={localValue?.toString() || ''}
            onChangeText={(text) => {
              const value = setting.type === 'float' ? parseFloat(text) : parseInt(text);
              setLocalValue(isNaN(value) ? '' : value);
            }}
            onBlur={handleUpdate}
            editable={!readonly}
            placeholder={placeholder}
            placeholderTextColor="#999"
            keyboardType="numeric"
          />
        );

      case 'boolean':
        return (
          <View style={styles.switchContainer}>
            <Switch
              value={!!localValue}
              onValueChange={(value) => {
                setLocalValue(value);
                onUpdate?.(setting, value);
              }}
              disabled={readonly}
              trackColor={{ false: '#e1e1e1', true: '#007AFF' }}
              thumbColor={Platform.OS === 'android' ? '#fff' : undefined}
            />
            <Text style={styles.switchLabel}>{localValue ? 'On' : 'Off'}</Text>
          </View>
        );

      case 'array':
        return (
          <View style={styles.arrayContainer}>
            {arrayValue.map((item, index) => (
              <View key={index} style={styles.arrayItem}>
                <TextInput
                  style={[styles.textInput, styles.arrayInput]}
                  value={item}
                  onChangeText={(value) => updateArrayItem(index, value)}
                  onBlur={handleArrayUpdate}
                  editable={!readonly}
                  placeholder={`Item ${index + 1}`}
                  placeholderTextColor="#999"
                />
                {!readonly && (
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeArrayItem(index)}
                  >
                    <Icon name="remove-circle-outline" size={20} color="#FF3B30" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
            {!readonly && (
              <TouchableOpacity style={styles.addButton} onPress={addArrayItem}>
                <Icon name="add" size={16} color="#007AFF" />
                <Text style={styles.addButtonText}>Add Item</Text>
              </TouchableOpacity>
            )}
          </View>
        );

      case 'json':
        return (
          <View>
            <TextInput
              style={[styles.textInput, styles.textArea, styles.jsonInput]}
              value={jsonValue}
              onChangeText={setJsonValue}
              onBlur={handleJsonUpdate}
              editable={!readonly}
              placeholder="Enter valid JSON"
              placeholderTextColor="#999"
              multiline
              numberOfLines={6}
            />
            {jsonError && (
              <View style={styles.errorContainer}>
                <Icon name="error-outline" size={16} color="#FF3B30" />
                <Text style={styles.errorText}>{jsonError}</Text>
              </View>
            )}
          </View>
        );

      case 'file':
        return (
          <View>
            <View style={styles.fileInputContainer}>
              <TextInput
                style={[styles.textInput, styles.fileInput]}
                value={localValue || ''}
                onChangeText={setLocalValue}
                onBlur={handleUpdate}
                editable={!readonly}
                placeholder={placeholder}
                placeholderTextColor="#999"
              />
              {!readonly && (
                <TouchableOpacity style={styles.browseButton}>
                  <Icon name="folder-open" size={16} color="#007AFF" />
                  <Text style={styles.browseButtonText}>Browse</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        );

      case 'encrypted':
        return (
          <TextInput
            style={styles.textInput}
            value={localValue || ''}
            onChangeText={setLocalValue}
            onBlur={handleUpdate}
            editable={!readonly}
            placeholder={placeholder}
            placeholderTextColor="#999"
            secureTextEntry={!showValue}
          />
        );

      default:
        return (
          <TextInput
            style={styles.textInput}
            value={localValue || ''}
            onChangeText={setLocalValue}
            onBlur={handleUpdate}
            editable={!readonly}
            placeholder={placeholder}
            placeholderTextColor="#999"
          />
        );
    }
  };

  return (
    <View style={[styles.container, hasError && styles.errorContainer, style]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.labelContainer}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>{setting.key}</Text>
            {isRequired && <Text style={styles.required}> *</Text>}
          </View>
          {setting.description && (
            <Text style={styles.description}>{setting.description}</Text>
          )}
        </View>
        
        {!readonly && (
          <View style={styles.actions}>
            {hasDefaultValue && (
              <TouchableOpacity style={styles.actionButton} onPress={handleReset}>
                <Icon name="refresh" size={20} color="#666" />
              </TouchableOpacity>
            )}
            {setting.is_encrypted && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setShowValue(!showValue)}
              >
                <Icon
                  name={showValue ? 'visibility-off' : 'visibility'}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Field */}
      <View style={styles.fieldContainer}>
        {renderField()}
      </View>

      {/* Error Message */}
      {errorMessage && (
        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={16} color="#FF3B30" />
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}

      {/* Metadata */}
      {setting.metadata && Object.keys(setting.metadata).length > 0 && (
        <TouchableOpacity style={styles.metadataContainer}>
          <Text style={styles.metadataLabel}>Additional Information</Text>
          <Text style={styles.metadataText}>
            {JSON.stringify(setting.metadata, null, 2)}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  errorContainer: {
    borderColor: '#FF3B30',
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  labelContainer: {
    flex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  required: {
    color: '#FF3B30',
    fontWeight: 'bold',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
  },
  fieldContainer: {
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e1e1e1',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#000',
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  jsonInput: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 14,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  arrayContainer: {
    gap: 8,
  },
  arrayItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  arrayInput: {
    flex: 1,
  },
  removeButton: {
    padding: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 6,
    borderStyle: 'dashed',
    alignSelf: 'flex-start',
  },
  addButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  fileInputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  fileInput: {
    flex: 1,
  },
  browseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
  },
  browseButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    flex: 1,
  },
  metadataContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e1e1e1',
  },
  metadataLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  metadataText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#666',
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 4,
  },
});
