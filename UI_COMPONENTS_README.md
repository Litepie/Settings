# Settings UI Components

This package provides comprehensive UI components for managing settings across multiple frontend frameworks. The components are designed to work seamlessly with the Laravel Settings package backend.

## Available Frameworks

- **Vue.js 3** (Composition API)
- **React 18** (Hooks)
- **Flutter** (Material Design)
- **React Native** (Cross-platform mobile)

## Features

- 🎨 **Multiple Data Types**: Support for string, integer, float, boolean, array, JSON, file, and encrypted types
- 🔍 **Search & Filter**: Real-time search and group-based filtering
- 📱 **Responsive Design**: Mobile-first approach with responsive layouts
- 🔐 **Security**: Support for encrypted settings with visibility toggle
- 📊 **Validation**: Client-side validation with custom rules
- 🔄 **State Management**: Optimized state management with caching
- 📤 **Import/Export**: Support for settings import/export functionality
- 🎯 **Type Safety**: TypeScript support for Vue and React components
- ♿ **Accessibility**: WCAG compliant components with proper ARIA labels
- 🎨 **Customizable**: Easily customizable themes and styling

## Installation & Setup

### Vue.js 3

```bash
# Install dependencies
npm install vue@^3.3.0 axios@^1.5.0

# Copy components to your project
cp -r resources/web/vue/* src/components/settings/
```

**Usage:**
```vue
<template>
  <SettingsManager />
</template>

<script setup>
import SettingsManager from '@/components/settings/SettingsManager.vue'
</script>
```

### React 18

```bash
# Install dependencies
npm install react@^18.2.0 react-dom@^18.2.0 axios@^1.5.0

# Copy components to your project
cp -r resources/web/react/* src/components/settings/
```

**Usage:**
```jsx
import React from 'react';
import SettingsManager from './components/settings/SettingsManager';

function App() {
  return <SettingsManager />;
}

export default App;
```

### Flutter

```yaml
# Add to pubspec.yaml
dependencies:
  flutter:
    sdk: flutter
  http: ^1.1.0
  file_picker: ^5.5.0

# Copy components to your project
cp -r resources/mobile/flutter/* lib/settings/
```

**Usage:**
```dart
import 'package:flutter/material.dart';
import 'settings/settings_manager.dart';

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: SettingsManager(),
    );
  }
}
```

### React Native

```bash
# Install dependencies
npm install react-native@^0.72.0 react-native-vector-icons@^10.0.0

# For iOS, run pod install
cd ios && pod install

# Copy components to your project
cp -r resources/mobile/react-native/* src/components/settings/
```

**Usage:**
```jsx
import React from 'react';
import SettingsManager from './components/settings/SettingsManager';

const App = () => {
  return <SettingsManager />;
};

export default App;
```

## API Configuration

All components expect your Laravel Settings API to be available at `/api/settings`. Update the API base URL in each framework's configuration:

### Vue.js
Update `useSettings.js`:
```javascript
const API_BASE_URL = 'https://your-api-domain.com/api';
```

### React
Update `useSettings.js`:
```javascript
const API_BASE_URL = 'https://your-api-domain.com/api';
```

### Flutter
Update `settings_manager.dart`:
```dart
static const String baseUrl = 'https://your-api-domain.com/api';
```

### React Native
Update `useSettings.js`:
```javascript
const API_BASE_URL = 'https://your-api-domain.com/api';
```

## Component Architecture

### Core Components

1. **SettingsManager**: Main container component
   - Handles overall state management
   - Provides search and filtering
   - Manages group tabs
   - Handles bulk operations

2. **SettingItem**: Individual setting component
   - Renders appropriate input type
   - Handles validation
   - Manages local state
   - Provides inline actions

3. **useSettings Hook/Composable**: State management
   - API integration
   - Caching logic
   - Error handling
   - Reactive updates

### Supported Setting Types

| Type | Description | Input Component |
|------|-------------|----------------|
| `string` | Text input | TextInput/TextField |
| `integer` | Numeric input (whole numbers) | NumberInput |
| `float` | Numeric input (decimals) | NumberInput |
| `boolean` | True/false toggle | Switch/Checkbox |
| `array` | List of string values | Dynamic list input |
| `json` | JSON object/array | Code editor |
| `file` | File path/upload | File picker |
| `encrypted` | Encrypted string | Password input |

### Validation Rules

The components support Laravel validation rules:

- `required`: Field must have a value
- `email`: Must be valid email format
- `min:X`: Minimum length/value
- `max:X`: Maximum length/value
- `numeric`: Must be numeric
- `boolean`: Must be true/false
- Custom regex patterns

## Customization

### Styling

Each framework includes customizable styling:

**Vue.js**: Modify CSS classes in components
**React**: Update styled-components or CSS modules
**Flutter**: Customize Material Design theme
**React Native**: Update StyleSheet objects

### API Endpoints

The components expect these Laravel API endpoints:

```
GET    /api/settings              # List all settings
PUT    /api/settings/{key}        # Update setting
POST   /api/settings/{key}/reset  # Reset to default
PUT    /api/settings/bulk         # Bulk update
GET    /api/settings/groups       # Get groups
POST   /api/settings/import       # Import settings
GET    /api/settings/export       # Export settings
GET    /api/settings/{key}/history # Setting history
POST   /api/settings/cache/clear  # Clear cache
```

### Props/Parameters

#### SettingsManager

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `readonly` | Boolean | `false` | Make all settings read-only |
| `groups` | Array | `[]` | Filter to specific groups |
| `searchable` | Boolean | `true` | Enable search functionality |
| `exportable` | Boolean | `true` | Enable export functionality |
| `importable` | Boolean | `true` | Enable import functionality |

#### SettingItem

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `setting` | Object | Required | Setting data object |
| `readonly` | Boolean | `false` | Make setting read-only |
| `onUpdate` | Function | `null` | Update callback |
| `onReset` | Function | `null` | Reset callback |

## Error Handling

All components include comprehensive error handling:

- **Network errors**: API connection issues
- **Validation errors**: Client-side and server-side validation
- **Type errors**: Invalid data type conversions
- **Permission errors**: Unauthorized access attempts

Error messages are displayed inline with appropriate styling and icons.

## Performance Optimization

- **Lazy Loading**: Components load data on demand
- **Debouncing**: Search and input changes are debounced
- **Caching**: Settings data is cached locally
- **Virtual Scrolling**: Large setting lists use virtual scrolling
- **Memoization**: Components are memoized to prevent unnecessary re-renders

## Security Considerations

- **Encrypted Settings**: Special handling for encrypted values
- **Input Sanitization**: All inputs are sanitized
- **CSRF Protection**: API calls include CSRF tokens
- **XSS Prevention**: Output is properly escaped
- **File Upload Security**: File uploads are validated

## Browser/Platform Support

### Web (Vue.js/React)
- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

### Mobile (Flutter)
- iOS 11.0+
- Android API 21+

### Mobile (React Native)
- iOS 11.0+
- Android API 21+

## Development

### Building for Production

**Vue.js:**
```bash
npm run build
```

**React:**
```bash
npm run build
```

**Flutter:**
```bash
flutter build apk --release
flutter build ios --release
```

**React Native:**
```bash
npx react-native run-android --variant=release
npx react-native run-ios --configuration=Release
```

### Testing

Each framework includes example test files:

- Vue: Vitest configuration
- React: Jest configuration  
- Flutter: Widget tests
- React Native: Jest configuration

## Troubleshooting

### Common Issues

1. **API Connection Issues**
   - Verify API URL configuration
   - Check CORS settings
   - Validate authentication headers

2. **Styling Issues**
   - Ensure CSS/theme files are imported
   - Check for conflicting styles
   - Verify responsive breakpoints

3. **Type Validation Errors**
   - Validate setting type definitions
   - Check validation rule format
   - Ensure proper data casting

4. **Performance Issues**
   - Enable data caching
   - Implement virtual scrolling for large lists
   - Optimize image/file uploads

### Debug Mode

Enable debug mode in each framework:

```javascript
// Vue.js/React
const DEBUG_MODE = process.env.NODE_ENV === 'development';

// Flutter
const bool kDebugMode = !kReleaseMode;

// React Native
const DEBUG_MODE = __DEV__;
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This component library is open-sourced software licensed under the [MIT license](LICENSE).

## Support

For support and questions:

- Create an issue on GitHub
- Check the documentation
- Review example implementations
- Join the community discussions

---

*Generated for Laravel Settings Package v12.x*
