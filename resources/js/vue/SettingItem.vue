<template>
  <div class="setting-item" :class="{ readonly, 'has-error': hasError }">
    <div class="setting-header">
      <div class="setting-info">
        <label :for="fieldId" class="setting-label">
          {{ setting.key }}
          <span v-if="setting.validation_rules && setting.validation_rules.includes('required')" class="required">*</span>
        </label>
        <p v-if="setting.description" class="setting-description">
          {{ setting.description }}
        </p>
      </div>
      
      <div class="setting-actions" v-if="!readonly">
        <button
          v-if="hasDefaultValue"
          @click="$emit('reset', setting)"
          class="action-btn reset-btn"
          title="Reset to default"
        >
          <i class="icon-refresh"></i>
        </button>
        <button
          v-if="setting.is_encrypted"
          @click="showValue = !showValue"
          class="action-btn toggle-btn"
          :title="showValue ? 'Hide value' : 'Show value'"
        >
          <i :class="showValue ? 'icon-eye-off' : 'icon-eye'"></i>
        </button>
      </div>
    </div>

    <div class="setting-field">
      <!-- String Type -->
      <input
        v-if="setting.type === 'string' && !isLongText"
        :id="fieldId"
        v-model="localValue"
        :type="inputType"
        :readonly="readonly"
        :placeholder="placeholder"
        class="form-input"
        @blur="handleUpdate"
        @keydown.enter="handleUpdate"
      />

      <!-- Long Text / Textarea -->
      <textarea
        v-else-if="setting.type === 'string' && isLongText"
        :id="fieldId"
        v-model="localValue"
        :readonly="readonly"
        :placeholder="placeholder"
        class="form-textarea"
        rows="4"
        @blur="handleUpdate"
      ></textarea>

      <!-- Number Types -->
      <input
        v-else-if="['integer', 'float'].includes(setting.type)"
        :id="fieldId"
        v-model.number="localValue"
        type="number"
        :step="setting.type === 'float' ? '0.01' : '1'"
        :readonly="readonly"
        :placeholder="placeholder"
        class="form-input"
        @blur="handleUpdate"
        @keydown.enter="handleUpdate"
      />

      <!-- Boolean Type -->
      <div v-else-if="setting.type === 'boolean'" class="toggle-switch">
        <input
          :id="fieldId"
          v-model="localValue"
          type="checkbox"
          :disabled="readonly"
          class="toggle-input"
          @change="handleUpdate"
        />
        <label :for="fieldId" class="toggle-label">
          <span class="toggle-slider"></span>
          <span class="toggle-text">{{ localValue ? 'On' : 'Off' }}</span>
        </label>
      </div>

      <!-- Array Type -->
      <div v-else-if="setting.type === 'array'" class="array-field">
        <div v-for="(item, index) in arrayValue" :key="index" class="array-item">
          <input
            v-model="arrayValue[index]"
            type="text"
            :readonly="readonly"
            class="form-input array-input"
            @blur="handleArrayUpdate"
          />
          <button
            v-if="!readonly"
            @click="removeArrayItem(index)"
            class="remove-btn"
            type="button"
          >
            <i class="icon-x"></i>
          </button>
        </div>
        <button
          v-if="!readonly"
          @click="addArrayItem"
          class="add-btn"
          type="button"
        >
          <i class="icon-plus"></i> Add Item
        </button>
      </div>

      <!-- JSON Type -->
      <div v-else-if="setting.type === 'json'" class="json-field">
        <textarea
          :id="fieldId"
          v-model="jsonValue"
          :readonly="readonly"
          placeholder="Enter valid JSON"
          class="form-textarea json-textarea"
          rows="6"
          @blur="handleJsonUpdate"
        ></textarea>
        <div v-if="jsonError" class="json-error">
          <i class="icon-alert-circle"></i>
          {{ jsonError }}
        </div>
      </div>

      <!-- File Type -->
      <div v-else-if="setting.type === 'file'" class="file-field">
        <div class="file-input-wrapper">
          <input
            :id="fieldId"
            v-model="localValue"
            type="text"
            :readonly="readonly"
            :placeholder="placeholder"
            class="form-input file-path-input"
            @blur="handleUpdate"
          />
          <button
            v-if="!readonly"
            @click="triggerFileUpload"
            class="file-browse-btn"
            type="button"
          >
            <i class="icon-folder"></i> Browse
          </button>
        </div>
        <input
          ref="fileInput"
          type="file"
          style="display: none"
          @change="handleFileUpload"
        />
        <div v-if="filePreview" class="file-preview">
          <img v-if="isImageFile" :src="filePreview" alt="Preview" class="image-preview" />
          <div v-else class="file-info">
            <i class="icon-file"></i>
            <span>{{ fileName }}</span>
          </div>
        </div>
      </div>

      <!-- Encrypted Type (same as string but masked) -->
      <input
        v-else-if="setting.type === 'encrypted'"
        :id="fieldId"
        v-model="localValue"
        :type="showValue ? 'text' : 'password'"
        :readonly="readonly"
        :placeholder="placeholder"
        class="form-input encrypted-input"
        @blur="handleUpdate"
        @keydown.enter="handleUpdate"
      />

      <!-- Default fallback -->
      <input
        v-else
        :id="fieldId"
        v-model="localValue"
        type="text"
        :readonly="readonly"
        :placeholder="placeholder"
        class="form-input"
        @blur="handleUpdate"
        @keydown.enter="handleUpdate"
      />
    </div>

    <!-- Error message -->
    <div v-if="errorMessage" class="error-message">
      <i class="icon-alert-circle"></i>
      {{ errorMessage }}
    </div>

    <!-- Metadata display -->
    <div v-if="setting.metadata && Object.keys(setting.metadata).length > 0" class="setting-metadata">
      <details>
        <summary>Additional Information</summary>
        <pre>{{ JSON.stringify(setting.metadata, null, 2) }}</pre>
      </details>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SettingItem',
  props: {
    setting: {
      type: Object,
      required: true
    },
    readonly: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update', 'reset'],
  data() {
    return {
      localValue: this.setting.value,
      showValue: false,
      errorMessage: '',
      jsonError: '',
      arrayValue: Array.isArray(this.setting.value) ? [...this.setting.value] : [],
      jsonValue: this.setting.type === 'json' ? JSON.stringify(this.setting.value, null, 2) : '',
      filePreview: null,
      fileName: ''
    }
  },
  computed: {
    fieldId() {
      return `setting-${this.setting.key.replace(/[^a-zA-Z0-9]/g, '-')}`
    },
    hasError() {
      return !!this.errorMessage || !!this.jsonError
    },
    hasDefaultValue() {
      return this.setting.default_value !== null && this.setting.default_value !== undefined
    },
    placeholder() {
      if (this.setting.default_value !== null && this.setting.default_value !== undefined) {
        return `Default: ${this.setting.default_value}`
      }
      return `Enter ${this.setting.type} value...`
    },
    inputType() {
      if (this.setting.type === 'encrypted' && !this.showValue) {
        return 'password'
      }
      return 'text'
    },
    isLongText() {
      return typeof this.localValue === 'string' && this.localValue.length > 100
    },
    isImageFile() {
      if (!this.localValue) return false
      const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']
      const extension = this.localValue.split('.').pop()?.toLowerCase()
      return imageExtensions.includes(extension)
    }
  },
  watch: {
    'setting.value': {
      handler(newValue) {
        this.localValue = newValue
        if (this.setting.type === 'array') {
          this.arrayValue = Array.isArray(newValue) ? [...newValue] : []
        }
        if (this.setting.type === 'json') {
          this.jsonValue = JSON.stringify(newValue, null, 2)
        }
      },
      immediate: true
    }
  },
  mounted() {
    this.initializeFilePreview()
  },
  methods: {
    handleUpdate() {
      this.errorMessage = ''
      
      if (this.validateValue()) {
        this.$emit('update', this.setting, this.localValue)
      }
    },

    handleArrayUpdate() {
      this.errorMessage = ''
      this.$emit('update', this.setting, this.arrayValue.filter(item => item.trim() !== ''))
    },

    handleJsonUpdate() {
      this.jsonError = ''
      
      try {
        const parsed = JSON.parse(this.jsonValue)
        this.$emit('update', this.setting, parsed)
      } catch (error) {
        this.jsonError = 'Invalid JSON format'
      }
    },

    validateValue() {
      if (!this.setting.validation_rules) return true

      const rules = Array.isArray(this.setting.validation_rules) 
        ? this.setting.validation_rules 
        : []

      for (const rule of rules) {
        if (rule === 'required' && (!this.localValue || this.localValue === '')) {
          this.errorMessage = 'This field is required'
          return false
        }
        
        if (rule === 'email' && this.localValue) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(this.localValue)) {
            this.errorMessage = 'Please enter a valid email address'
            return false
          }
        }
        
        if (rule.startsWith('min:')) {
          const min = parseInt(rule.split(':')[1])
          if (this.setting.type === 'string' && this.localValue.length < min) {
            this.errorMessage = `Minimum length is ${min} characters`
            return false
          }
          if (['integer', 'float'].includes(this.setting.type) && this.localValue < min) {
            this.errorMessage = `Minimum value is ${min}`
            return false
          }
        }
        
        if (rule.startsWith('max:')) {
          const max = parseInt(rule.split(':')[1])
          if (this.setting.type === 'string' && this.localValue.length > max) {
            this.errorMessage = `Maximum length is ${max} characters`
            return false
          }
          if (['integer', 'float'].includes(this.setting.type) && this.localValue > max) {
            this.errorMessage = `Maximum value is ${max}`
            return false
          }
        }
      }

      return true
    },

    addArrayItem() {
      this.arrayValue.push('')
    },

    removeArrayItem(index) {
      this.arrayValue.splice(index, 1)
      this.handleArrayUpdate()
    },

    triggerFileUpload() {
      this.$refs.fileInput.click()
    },

    async handleFileUpload(event) {
      const file = event.target.files[0]
      if (!file) return

      this.fileName = file.name
      
      try {
        // Here you would typically upload the file to your server
        // For now, we'll just create a local preview
        if (file.type.startsWith('image/')) {
          const reader = new FileReader()
          reader.onload = (e) => {
            this.filePreview = e.target.result
          }
          reader.readAsDataURL(file)
        }
        
        // Set the file path (this would be the uploaded file path in reality)
        this.localValue = `/uploads/${file.name}`
        this.handleUpdate()
      } catch (error) {
        this.errorMessage = 'Failed to upload file'
      }
    },

    initializeFilePreview() {
      if (this.setting.type === 'file' && this.localValue && this.isImageFile) {
        this.filePreview = this.localValue
        this.fileName = this.localValue.split('/').pop()
      }
    }
  }
}
</script>

<style scoped>
.setting-item {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 20px;
  transition: all 0.2s;
}

.setting-item:hover {
  border-color: #cbd5e0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.setting-item.readonly {
  background: #f7fafc;
}

.setting-item.has-error {
  border-color: #e53e3e;
}

.setting-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.setting-info {
  flex: 1;
}

.setting-label {
  display: block;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 4px;
  cursor: pointer;
}

.required {
  color: #e53e3e;
  margin-left: 2px;
}

.setting-description {
  color: #718096;
  font-size: 14px;
  margin: 0;
  line-height: 1.4;
}

.setting-actions {
  display: flex;
  gap: 4px;
}

.action-btn {
  padding: 6px;
  border: none;
  background: #f7fafc;
  color: #4a5568;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #edf2f7;
  color: #2d3748;
}

.reset-btn:hover {
  background: #fed7e2;
  color: #c53030;
}

.setting-field {
  margin-bottom: 8px;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.2s;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #3182ce;
  box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
}

.form-input:readonly,
.form-textarea:readonly {
  background: #f7fafc;
  cursor: not-allowed;
}

.toggle-switch {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toggle-input {
  display: none;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.toggle-slider {
  width: 44px;
  height: 24px;
  background: #e2e8f0;
  border-radius: 12px;
  position: relative;
  transition: all 0.2s;
}

.toggle-slider::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transition: all 0.2s;
}

.toggle-input:checked + .toggle-label .toggle-slider {
  background: #3182ce;
}

.toggle-input:checked + .toggle-label .toggle-slider::after {
  transform: translateX(20px);
}

.toggle-text {
  font-weight: 500;
  color: #4a5568;
}

.array-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.array-item {
  display: flex;
  gap: 8px;
  align-items: center;
}

.array-input {
  flex: 1;
}

.remove-btn,
.add-btn {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  background: white;
  color: #4a5568;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 4px;
}

.remove-btn:hover {
  background: #fed7e2;
  border-color: #feb2b2;
  color: #c53030;
}

.add-btn:hover {
  background: #c6f6d5;
  border-color: #9ae6b4;
  color: #276749;
}

.json-field {
  position: relative;
}

.json-textarea {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
}

.json-error {
  color: #e53e3e;
  font-size: 14px;
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.file-field {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.file-input-wrapper {
  display: flex;
  gap: 8px;
}

.file-path-input {
  flex: 1;
}

.file-browse-btn {
  padding: 10px 16px;
  border: 1px solid #e2e8f0;
  background: white;
  color: #4a5568;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.file-browse-btn:hover {
  background: #f7fafc;
  border-color: #cbd5e0;
}

.file-preview {
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 12px;
  background: #f7fafc;
}

.image-preview {
  max-width: 200px;
  max-height: 150px;
  border-radius: 4px;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #4a5568;
}

.error-message {
  color: #e53e3e;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
}

.setting-metadata {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
}

.setting-metadata details {
  cursor: pointer;
}

.setting-metadata summary {
  color: #718096;
  font-size: 14px;
  font-weight: 500;
}

.setting-metadata pre {
  background: #f7fafc;
  padding: 12px;
  border-radius: 4px;
  font-size: 12px;
  margin-top: 8px;
  overflow-x: auto;
}

@media (max-width: 768px) {
  .setting-header {
    flex-direction: column;
    gap: 8px;
  }

  .setting-actions {
    align-self: flex-end;
  }

  .file-input-wrapper {
    flex-direction: column;
  }

  .array-item {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
