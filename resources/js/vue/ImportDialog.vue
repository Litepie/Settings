<template>
  <div class="import-dialog-overlay" @click="$emit('close')">
    <div class="import-dialog" @click.stop>
      <div class="dialog-header">
        <h3>Import Settings</h3>
        <button @click="$emit('close')" class="close-btn">
          <i class="icon-x"></i>
        </button>
      </div>

      <div class="dialog-content">
        <div class="import-method">
          <label class="method-option">
            <input 
              v-model="importMethod" 
              type="radio" 
              value="file"
              @change="resetForm"
            />
            <span>Import from File</span>
          </label>
          <label class="method-option">
            <input 
              v-model="importMethod" 
              type="radio" 
              value="json"
              @change="resetForm"
            />
            <span>Paste JSON</span>
          </label>
        </div>

        <!-- File Upload Method -->
        <div v-if="importMethod === 'file'" class="file-import">
          <div class="file-drop-zone" 
               :class="{ 'drag-over': dragOver, 'has-file': selectedFile }"
               @dragover.prevent="dragOver = true"
               @dragleave="dragOver = false"
               @drop.prevent="handleFileDrop">
            <input 
              ref="fileInput"
              type="file" 
              accept=".json"
              @change="handleFileSelect"
              style="display: none"
            />
            
            <div v-if="!selectedFile" class="drop-content">
              <i class="icon-upload-cloud"></i>
              <p>Drop your JSON file here or <button @click="$refs.fileInput.click()" class="link-btn">browse</button></p>
              <small>Accepts .json files only</small>
            </div>
            
            <div v-else class="file-selected">
              <i class="icon-file"></i>
              <div class="file-info">
                <span class="file-name">{{ selectedFile.name }}</span>
                <span class="file-size">{{ formatFileSize(selectedFile.size) }}</span>
              </div>
              <button @click="removeFile" class="remove-file-btn">
                <i class="icon-x"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- JSON Paste Method -->
        <div v-else class="json-import">
          <textarea 
            v-model="jsonText"
            placeholder="Paste your settings JSON here..."
            class="json-textarea"
            rows="10"
          ></textarea>
          <div v-if="jsonError" class="json-error">
            <i class="icon-alert-circle"></i>
            {{ jsonError }}
          </div>
        </div>

        <!-- Preview -->
        <div v-if="previewData" class="import-preview">
          <h4>Import Preview ({{ previewData.length }} settings)</h4>
          <div class="preview-list">
            <div 
              v-for="setting in previewData.slice(0, 5)" 
              :key="setting.key"
              class="preview-item"
            >
              <span class="setting-key">{{ setting.key }}</span>
              <span class="setting-type">{{ setting.type }}</span>
              <span class="setting-value">{{ formatPreviewValue(setting.value) }}</span>
            </div>
            <div v-if="previewData.length > 5" class="preview-more">
              ... and {{ previewData.length - 5 }} more settings
            </div>
          </div>
        </div>

        <!-- Import Options -->
        <div v-if="previewData" class="import-options">
          <label class="checkbox-option">
            <input v-model="overwriteExisting" type="checkbox" />
            <span>Overwrite existing settings</span>
          </label>
          <label class="checkbox-option">
            <input v-model="validateOnly" type="checkbox" />
            <span>Validate only (don't import)</span>
          </label>
        </div>
      </div>

      <div class="dialog-footer">
        <button @click="$emit('close')" class="btn btn-outline">
          Cancel
        </button>
        <button 
          @click="processImport"
          :disabled="!canImport || importing"
          class="btn btn-primary"
        >
          <i v-if="importing" class="icon-loader spinning"></i>
          {{ validateOnly ? 'Validate' : 'Import' }} Settings
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ImportDialog',
  emits: ['close', 'import'],
  data() {
    return {
      importMethod: 'file',
      selectedFile: null,
      jsonText: '',
      jsonError: '',
      previewData: null,
      overwriteExisting: false,
      validateOnly: false,
      importing: false,
      dragOver: false
    }
  },
  computed: {
    canImport() {
      return this.previewData && this.previewData.length > 0 && !this.jsonError
    }
  },
  watch: {
    jsonText: {
      handler: 'validateJson',
      immediate: true
    }
  },
  methods: {
    resetForm() {
      this.selectedFile = null
      this.jsonText = ''
      this.jsonError = ''
      this.previewData = null
      this.overwriteExisting = false
      this.validateOnly = false
    },

    handleFileDrop(event) {
      this.dragOver = false
      const files = event.dataTransfer.files
      if (files.length > 0 && files[0].type === 'application/json') {
        this.handleFile(files[0])
      }
    },

    handleFileSelect(event) {
      const file = event.target.files[0]
      if (file) {
        this.handleFile(file)
      }
    },

    async handleFile(file) {
      this.selectedFile = file
      
      try {
        const text = await this.readFileAsText(file)
        this.jsonText = text
        await this.validateJson()
      } catch (error) {
        this.jsonError = 'Failed to read file'
        this.previewData = null
      }
    },

    readFileAsText(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsText(file)
      })
    },

    removeFile() {
      this.selectedFile = null
      this.jsonText = ''
      this.previewData = null
      if (this.$refs.fileInput) {
        this.$refs.fileInput.value = ''
      }
    },

    validateJson() {
      this.jsonError = ''
      this.previewData = null

      if (!this.jsonText.trim()) return

      try {
        const parsed = JSON.parse(this.jsonText)
        
        // Validate structure
        if (!Array.isArray(parsed)) {
          this.jsonError = 'JSON must be an array of settings'
          return
        }

        // Validate each setting
        for (let i = 0; i < parsed.length; i++) {
          const setting = parsed[i]
          
          if (!setting.key || typeof setting.key !== 'string') {
            this.jsonError = `Setting at index ${i} is missing a valid key`
            return
          }
          
          if (setting.value === undefined) {
            this.jsonError = `Setting "${setting.key}" is missing a value`
            return
          }
          
          // Validate type if specified
          if (setting.type) {
            const validTypes = ['string', 'integer', 'float', 'boolean', 'array', 'json', 'file', 'encrypted']
            if (!validTypes.includes(setting.type)) {
              this.jsonError = `Setting "${setting.key}" has invalid type: ${setting.type}`
              return
            }
          }
        }

        this.previewData = parsed
      } catch (error) {
        this.jsonError = 'Invalid JSON format'
      }
    },

    async processImport() {
      if (!this.canImport) return

      this.importing = true
      
      try {
        if (this.validateOnly) {
          // Just show validation success
          this.$emit('close')
          // You could emit a validation success event here
          return
        }

        await this.$emit('import', this.previewData, this.overwriteExisting)
      } catch (error) {
        console.error('Import failed:', error)
      } finally {
        this.importing = false
      }
    },

    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    },

    formatPreviewValue(value) {
      if (value === null || value === undefined) return 'null'
      if (typeof value === 'string') {
        return value.length > 30 ? value.substring(0, 30) + '...' : value
      }
      if (typeof value === 'object') {
        return Array.isArray(value) ? `Array(${value.length})` : 'Object'
      }
      return String(value)
    }
  }
}
</script>

<style scoped>
.import-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.import-dialog {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e2e8f0;
}

.dialog-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a202c;
}

.close-btn {
  padding: 4px;
  border: none;
  background: none;
  color: #718096;
  cursor: pointer;
  border-radius: 4px;
}

.close-btn:hover {
  background: #f7fafc;
  color: #4a5568;
}

.dialog-content {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.import-method {
  display: flex;
  gap: 20px;
  margin-bottom: 24px;
}

.method-option {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: 500;
}

.method-option input[type="radio"] {
  margin: 0;
}

.file-import {
  margin-bottom: 24px;
}

.file-drop-zone {
  border: 2px dashed #e2e8f0;
  border-radius: 8px;
  padding: 40px 20px;
  text-align: center;
  transition: all 0.2s;
  cursor: pointer;
}

.file-drop-zone.drag-over {
  border-color: #3182ce;
  background: #ebf8ff;
}

.file-drop-zone.has-file {
  border-color: #38a169;
  background: #f0fff4;
}

.drop-content {
  color: #718096;
}

.drop-content i {
  font-size: 48px;
  margin-bottom: 16px;
  display: block;
  color: #a0aec0;
}

.drop-content p {
  margin: 0 0 8px 0;
  font-size: 16px;
}

.link-btn {
  background: none;
  border: none;
  color: #3182ce;
  cursor: pointer;
  text-decoration: underline;
}

.file-selected {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #38a169;
}

.file-selected i {
  font-size: 24px;
}

.file-info {
  flex: 1;
  text-align: left;
}

.file-name {
  display: block;
  font-weight: 500;
}

.file-size {
  display: block;
  font-size: 14px;
  color: #718096;
}

.remove-file-btn {
  padding: 4px;
  border: none;
  background: #fed7e2;
  color: #c53030;
  border-radius: 4px;
  cursor: pointer;
}

.json-import {
  margin-bottom: 24px;
}

.json-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  resize: vertical;
}

.json-textarea:focus {
  outline: none;
  border-color: #3182ce;
  box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
}

.json-error {
  color: #e53e3e;
  font-size: 14px;
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.import-preview {
  margin-bottom: 24px;
  padding: 16px;
  background: #f7fafc;
  border-radius: 6px;
}

.import-preview h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #4a5568;
}

.preview-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preview-item {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 12px;
  padding: 8px 12px;
  background: white;
  border-radius: 4px;
  font-size: 14px;
}

.setting-key {
  font-weight: 500;
  color: #2d3748;
}

.setting-type {
  padding: 2px 8px;
  background: #edf2f7;
  color: #4a5568;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.setting-value {
  color: #718096;
  font-family: monospace;
}

.preview-more {
  padding: 8px 12px;
  text-align: center;
  color: #718096;
  font-style: italic;
}

.import-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.checkbox-option {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.checkbox-option input[type="checkbox"] {
  margin: 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #e2e8f0;
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

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .import-dialog {
    width: 95%;
    margin: 20px;
  }

  .dialog-content {
    padding: 16px;
  }

  .import-method {
    flex-direction: column;
    gap: 12px;
  }

  .preview-item {
    grid-template-columns: 1fr;
    gap: 4px;
  }

  .setting-type,
  .setting-value {
    justify-self: start;
  }
}
</style>
