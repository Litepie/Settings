import React, { useState, useEffect, useRef, useMemo } from 'react';
import './SettingItem.css';

export const SettingItem = ({ setting, readonly = false, onUpdate, onReset }) => {
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
  const [filePreview, setFilePreview] = useState(null);
  const [fileName, setFileName] = useState('');
  
  const fileInputRef = useRef(null);

  const fieldId = `setting-${setting.key.replace(/[^a-zA-Z0-9]/g, '-')}`;
  const hasError = !!errorMessage || !!jsonError;
  const hasDefaultValue = setting.default_value !== null && setting.default_value !== undefined;
  
  const placeholder = useMemo(() => {
    if (hasDefaultValue) {
      return `Default: ${setting.default_value}`;
    }
    return `Enter ${setting.type} value...`;
  }, [setting.default_value, setting.type, hasDefaultValue]);

  const inputType = useMemo(() => {
    if (setting.type === 'encrypted' && !showValue) {
      return 'password';
    }
    return 'text';
  }, [setting.type, showValue]);

  const isLongText = useMemo(() => {
    return typeof localValue === 'string' && localValue.length > 100;
  }, [localValue]);

  const isImageFile = useMemo(() => {
    if (!localValue) return false;
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    const extension = localValue.split('.').pop()?.toLowerCase();
    return imageExtensions.includes(extension);
  }, [localValue]);

  useEffect(() => {
    setLocalValue(setting.value);
    if (setting.type === 'array') {
      setArrayValue(Array.isArray(setting.value) ? [...setting.value] : []);
    }
    if (setting.type === 'json') {
      setJsonValue(JSON.stringify(setting.value, null, 2));
    }
  }, [setting.value, setting.type]);

  useEffect(() => {
    initializeFilePreview();
  }, [setting.type, localValue]);

  const validateValue = (value = localValue) => {
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
    setErrorMessage('');
    
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

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setFileName(file.name);
    
    try {
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setFilePreview(e.target.result);
        };
        reader.readAsDataURL(file);
      }
      
      // Set the file path (this would be the uploaded file path in reality)
      const newValue = `/uploads/${file.name}`;
      setLocalValue(newValue);
      
      if (validateValue(newValue)) {
        onUpdate?.(setting, newValue);
      }
    } catch (error) {
      setErrorMessage('Failed to upload file');
    }
  };

  const initializeFilePreview = () => {
    if (setting.type === 'file' && localValue && isImageFile) {
      setFilePreview(localValue);
      setFileName(localValue.split('/').pop());
    }
  };

  const renderField = () => {
    switch (setting.type) {
      case 'string':
        if (isLongText) {
          return (
            <textarea
              id={fieldId}
              value={localValue || ''}
              onChange={(e) => setLocalValue(e.target.value)}
              onBlur={handleUpdate}
              readOnly={readonly}
              placeholder={placeholder}
              className="form-textarea"
              rows={4}
            />
          );
        }
        return (
          <input
            id={fieldId}
            value={localValue || ''}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={handleUpdate}
            onKeyDown={(e) => e.key === 'Enter' && handleUpdate()}
            type={inputType}
            readOnly={readonly}
            placeholder={placeholder}
            className="form-input"
          />
        );

      case 'integer':
      case 'float':
        return (
          <input
            id={fieldId}
            value={localValue || ''}
            onChange={(e) => setLocalValue(setting.type === 'float' ? parseFloat(e.target.value) : parseInt(e.target.value))}
            onBlur={handleUpdate}
            onKeyDown={(e) => e.key === 'Enter' && handleUpdate()}
            type="number"
            step={setting.type === 'float' ? '0.01' : '1'}
            readOnly={readonly}
            placeholder={placeholder}
            className="form-input"
          />
        );

      case 'boolean':
        return (
          <div className="toggle-switch">
            <input
              id={fieldId}
              checked={!!localValue}
              onChange={(e) => {
                setLocalValue(e.target.checked);
                onUpdate?.(setting, e.target.checked);
              }}
              type="checkbox"
              disabled={readonly}
              className="toggle-input"
            />
            <label htmlFor={fieldId} className="toggle-label">
              <span className="toggle-slider"></span>
              <span className="toggle-text">{localValue ? 'On' : 'Off'}</span>
            </label>
          </div>
        );

      case 'array':
        return (
          <div className="array-field">
            {arrayValue.map((item, index) => (
              <div key={index} className="array-item">
                <input
                  value={item}
                  onChange={(e) => updateArrayItem(index, e.target.value)}
                  onBlur={handleArrayUpdate}
                  type="text"
                  readOnly={readonly}
                  className="form-input array-input"
                />
                {!readonly && (
                  <button
                    onClick={() => removeArrayItem(index)}
                    className="remove-btn"
                    type="button"
                  >
                    <i className="icon-x"></i>
                  </button>
                )}
              </div>
            ))}
            {!readonly && (
              <button
                onClick={addArrayItem}
                className="add-btn"
                type="button"
              >
                <i className="icon-plus"></i> Add Item
              </button>
            )}
          </div>
        );

      case 'json':
        return (
          <div className="json-field">
            <textarea
              id={fieldId}
              value={jsonValue}
              onChange={(e) => setJsonValue(e.target.value)}
              onBlur={handleJsonUpdate}
              readOnly={readonly}
              placeholder="Enter valid JSON"
              className="form-textarea json-textarea"
              rows={6}
            />
            {jsonError && (
              <div className="json-error">
                <i className="icon-alert-circle"></i>
                {jsonError}
              </div>
            )}
          </div>
        );

      case 'file':
        return (
          <div className="file-field">
            <div className="file-input-wrapper">
              <input
                id={fieldId}
                value={localValue || ''}
                onChange={(e) => setLocalValue(e.target.value)}
                onBlur={handleUpdate}
                type="text"
                readOnly={readonly}
                placeholder={placeholder}
                className="form-input file-path-input"
              />
              {!readonly && (
                <button
                  onClick={triggerFileUpload}
                  className="file-browse-btn"
                  type="button"
                >
                  <i className="icon-folder"></i> Browse
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
            {filePreview && (
              <div className="file-preview">
                {isImageFile ? (
                  <img src={filePreview} alt="Preview" className="image-preview" />
                ) : (
                  <div className="file-info">
                    <i className="icon-file"></i>
                    <span>{fileName}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 'encrypted':
        return (
          <input
            id={fieldId}
            value={localValue || ''}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={handleUpdate}
            onKeyDown={(e) => e.key === 'Enter' && handleUpdate()}
            type={showValue ? 'text' : 'password'}
            readOnly={readonly}
            placeholder={placeholder}
            className="form-input encrypted-input"
          />
        );

      default:
        return (
          <input
            id={fieldId}
            value={localValue || ''}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={handleUpdate}
            onKeyDown={(e) => e.key === 'Enter' && handleUpdate()}
            type="text"
            readOnly={readonly}
            placeholder={placeholder}
            className="form-input"
          />
        );
    }
  };

  return (
    <div className={`setting-item ${readonly ? 'readonly' : ''} ${hasError ? 'has-error' : ''}`}>
      <div className="setting-header">
        <div className="setting-info">
          <label htmlFor={fieldId} className="setting-label">
            {setting.key}
            {setting.validation_rules?.includes('required') && (
              <span className="required">*</span>
            )}
          </label>
          {setting.description && (
            <p className="setting-description">{setting.description}</p>
          )}
        </div>
        
        {!readonly && (
          <div className="setting-actions">
            {hasDefaultValue && (
              <button
                onClick={() => onReset?.(setting)}
                className="action-btn reset-btn"
                title="Reset to default"
              >
                <i className="icon-refresh"></i>
              </button>
            )}
            {setting.is_encrypted && (
              <button
                onClick={() => setShowValue(!showValue)}
                className="action-btn toggle-btn"
                title={showValue ? 'Hide value' : 'Show value'}
              >
                <i className={showValue ? 'icon-eye-off' : 'icon-eye'}></i>
              </button>
            )}
          </div>
        )}
      </div>

      <div className="setting-field">
        {renderField()}
      </div>

      {errorMessage && (
        <div className="error-message">
          <i className="icon-alert-circle"></i>
          {errorMessage}
        </div>
      )}

      {setting.metadata && Object.keys(setting.metadata).length > 0 && (
        <div className="setting-metadata">
          <details>
            <summary>Additional Information</summary>
            <pre>{JSON.stringify(setting.metadata, null, 2)}</pre>
          </details>
        </div>
      )}
    </div>
  );
};
