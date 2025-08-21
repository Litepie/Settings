# Litepie Settings Package

A comprehensive, enterprise-grade multi-level settings management package for Laravel applications. This package provides a robust and flexible solution for managing application, user, company, and global settings with advanced features like encryption, caching, audit trails, and permissions.

## ✅ Laravel 12 Ready

This package is fully compatible with **Laravel 12** and includes:
- **PHP 8.2+ Support** with modern type declarations
- **Updated Dependencies** for Laravel 12 compatibility
- **Enhanced Type Safety** with proper return types and parameter hints
- **Modern Laravel Features** including constructor property promotion

## Requirements

- **PHP**: ^8.2
- **Laravel**: ^10.0|^11.0|^12.0
- **spatie/laravel-permission**: ^6.0

## ✨ Features

### Core Features
- **🏗️ Multi-level Settings Hierarchy**: Global, company, team, role, and user-specific settings with inheritance
- **🔧 8 Built-in Data Types**: String, integer, float, boolean, array, JSON, encrypted, and file types
- **⚡ Performance Optimized**: Built-in Redis/Memcached caching with configurable TTL
- **🔐 Security First**: Encrypted settings support with Laravel's encryption
- **👥 Multi-tenant Ready**: Polymorphic owner relationships for any model
- **📊 Audit Trail**: Complete history tracking of all setting changes
- **🎯 Grouped Settings**: Organize settings into logical groups (appearance, notifications, etc.)
- **🔒 Permission System**: Granular access control for setting management

### Advanced Features
- **📤 Import/Export**: JSON backup and restore with selective group support
- **🌐 RESTful API**: Complete REST API with authentication and rate limiting
- **📱 Frontend Ready**: API resources and validation for frontend integration
- **🎭 Dependency System**: Settings that depend on other settings
- **🔍 Validation**: Custom validation rules per setting
- **📄 Templates**: Pre-defined setting templates for quick setup
- **🔄 Real-time Events**: Laravel events for setting CRUD operations
- **🏷️ Metadata Support**: Additional data storage for settings
- **🌍 Public/Private**: Control visibility of settings

## 📦 Installation

### Step 1: Install via Composer

```bash
composer require litepie/settings
```

### Step 2: Install and Setup

```bash
# Install the package (publishes config, runs migrations, seeds default groups)
php artisan settings:install

# Or run steps manually:
php artisan vendor:publish --provider="Litepie\Settings\Providers\SettingsServiceProvider"
php artisan migrate
php artisan settings:seed
```

### Step 3: Configure (Optional)

The package works out of the box, but you can customize behavior by publishing the config:

```bash
php artisan vendor:publish --provider="Litepie\Settings\Providers\SettingsServiceProvider" --tag="settings-config"
```

## 🎨 Frontend UI Components

Ready-to-use UI components for managing settings in your frontend applications:

📋 **[UI Components Documentation](UI_COMPONENTS_README.md)** - Complete frontend implementation guide

Available for multiple frameworks:
- **Vue.js 3** (Composition API) - Modern reactive components
- **React 18** (Hooks) - Latest React patterns with custom hooks
- **Flutter** (Material Design) - Native mobile apps with Material Design
- **React Native** (Cross-platform) - Mobile apps for iOS and Android

Features include real-time search, group filtering, validation, import/export, and responsive design across all platforms.

## 🚀 Quick Start

### Using the Facade

```php
use Litepie\Settings\Facades\Settings;

// Set a global setting
Settings::set('app_name', 'My Application');

// Get a setting with default value
$appName = Settings::get('app_name', 'Default App');

// Set user-specific setting
Settings::set('theme', 'dark', $user);

// Get user setting with fallback to global
$theme = Settings::get('theme', 'light', $user);

// Check if setting exists
if (Settings::has('maintenance_mode')) {
    // Setting exists
}

// Delete a setting
Settings::forget('old_setting');
```

### Using the Helper Function

```php
// Get setting with default
$value = settings('app_name', 'Default App');

// Get setting for specific owner
$userTheme = settings('theme', 'light', $user);

// Get the settings service instance
$settingsService = settings();

// Set setting using service
settings()->set('new_setting', 'value');
```

### Using the HasSettings Trait

Add the `HasSettings` trait to any Eloquent model:

```php
use Litepie\Settings\Traits\HasSettings;

class User extends Model
{
    use HasSettings;
}

class Company extends Model
{
    use HasSettings;
}

// Now you can use these methods:
$user->setSetting('preference', 'value');
$preference = $user->getSetting('preference', 'default');
$user->forgetSetting('old_preference');

// Get all settings for the user
$allSettings = $user->getAllSettings();

// Get settings by group
$notifications = $user->getSettingsByGroup('notifications');

// Set multiple settings at once
$user->setMultipleSettings([
    'theme' => 'dark',
    'language' => 'en',
    'timezone' => 'UTC'
]);
```

## 🔧 Advanced Usage

### Setting Types and Validation

The package supports 8 built-in data types with automatic casting:

```php
// String (default)
Settings::set('app_name', 'My App');

// Integer
Settings::set('max_users', 100, null, ['type' => 'integer']);

// Float/Decimal
Settings::set('tax_rate', 7.25, null, ['type' => 'float']);

// Boolean
Settings::set('maintenance_mode', false, null, ['type' => 'boolean']);

// Array
Settings::set('allowed_domains', ['example.com', 'test.com'], null, ['type' => 'array']);

// JSON (for complex objects)
Settings::set('api_config', ['key' => 'value', 'timeout' => 30], null, ['type' => 'json']);

// Encrypted (automatically encrypted/decrypted)
Settings::set('api_secret', 'secret-key', null, ['type' => 'encrypted']);

// File paths
Settings::set('logo_path', '/uploads/logo.png', null, ['type' => 'file']);
```

### Groups and Organization

Organize settings into logical groups for better management:

```php
// Set setting with group and metadata
Settings::set('logo', 'logo.png', $company, [
    'group_id' => 1, // appearance group
    'description' => 'Company logo displayed in header',
    'type' => 'file',
    'is_public' => true,
    'validation_rules' => ['required', 'string'],
    'default_value' => 'default-logo.png',
    'order' => 1,
    'metadata' => ['max_size' => '2MB', 'formats' => ['jpg', 'png']]
]);

// Get settings by group
$appearanceSettings = Settings::getByGroup('appearance', $company);

// Get all available groups
$groups = app(\Litepie\Settings\Models\SettingGroup::class)->active()->get();
```

### Bulk Operations

Efficiently handle multiple settings:

```php
// Set multiple settings at once
Settings::setMultiple([
    'site_name' => 'My Website',
    'site_description' => 'A great website',
    'contact_email' => 'contact@example.com',
    'max_upload_size' => 10485760, // 10MB
], $user);

// Get multiple settings with defaults
$settings = Settings::getMultiple([
    'site_name' => 'Default Site',
    'contact_email' => 'admin@example.com',
    'theme' => 'light'
], $user);

// Get all settings for an owner
$allUserSettings = Settings::all($user);
$allGlobalSettings = Settings::all(); // null = global
```

### Setting Dependencies

Create settings that depend on other settings:

```php
Settings::set('email_notifications', true, $user, [
    'type' => 'boolean',
    'depends_on' => ['notifications_enabled' => true]
]);

// This setting will only be available if notifications_enabled is true
```

### Caching Control

The package automatically caches settings, but you can control caching behavior:

```php
// Clear specific setting cache
Settings::clearCache('app_name', $user);

// Clear all cache
Settings::clearCache();

// Temporarily disable caching
config(['settings.cache.enabled' => false]);
Settings::set('temp_setting', 'value');
config(['settings.cache.enabled' => true]);
```

## 🌐 RESTful API

The package provides a complete REST API for managing settings:

### API Endpoints

```
GET    /api/settings                    # List all settings
GET    /api/settings?group=appearance   # Filter by group
GET    /api/settings?owner_type=App\Models\User&owner_id=1  # Filter by owner
POST   /api/settings                    # Create new setting
GET    /api/settings/{key}              # Get specific setting
PUT    /api/settings/{key}              # Update setting
DELETE /api/settings/{key}              # Delete setting
POST   /api/settings/bulk               # Bulk update settings
```

### API Usage Examples

```bash
# Get all settings
curl -H "Authorization: Bearer {token}" \
     http://your-app.com/api/settings

# Get specific setting
curl -H "Authorization: Bearer {token}" \
     http://your-app.com/api/settings/app_name

# Create setting
curl -X POST \
     -H "Authorization: Bearer {token}" \
     -H "Content-Type: application/json" \
     -d '{"key":"new_setting","value":"new_value","type":"string"}' \
     http://your-app.com/api/settings

# Update setting
curl -X PUT \
     -H "Authorization: Bearer {token}" \
     -H "Content-Type: application/json" \
     -d '{"value":"updated_value"}' \
     http://your-app.com/api/settings/app_name

# Bulk update
curl -X POST \
     -H "Authorization: Bearer {token}" \
     -H "Content-Type: application/json" \
     -d '{"settings":{"setting1":"value1","setting2":"value2"}}' \
     http://your-app.com/api/settings/bulk
```

### API Configuration

Customize API behavior in config:

```php
'api' => [
    'prefix' => 'api/settings',
    'middleware' => ['auth:sanctum', 'throttle:60,1'],
    'rate_limit' => '60:1',
],
```

## ⚡ Artisan Commands

The package includes powerful CLI commands for managing settings:

### Installation and Setup

```bash
# Complete package installation (recommended)
php artisan settings:install

# Seed default setting groups
php artisan settings:seed
```

### Import/Export Operations

```bash
# Export all settings to JSON
php artisan settings:export --file=backup.json

# Export specific owner's settings
php artisan settings:export --file=user-settings.json \
    --owner-type="App\Models\User" --owner-id=1

# Export specific groups only
php artisan settings:export --file=appearance.json \
    --groups=appearance --groups=notifications

# Import settings from file
php artisan settings:import backup.json

# Import with overwrite existing settings
php artisan settings:import backup.json --overwrite

# Import for specific owner
php artisan settings:import user-settings.json \
    --owner-type="App\Models\User" --owner-id=1
```

### Cache Management

```bash
# Clear settings cache
php artisan settings:cache:clear

# You can also use Laravel's cache commands
php artisan cache:forget settings:*
```

### Command Options

| Command | Option | Description |
|---------|--------|-------------|
| `export` | `--file` | Output file path (default: settings.json) |
| `export` | `--owner-type` | Class name of owner model |
| `export` | `--owner-id` | ID of owner instance |
| `export` | `--groups` | Array of group keys to export |
| `import` | `--overwrite` | Overwrite existing settings |
| `import` | `--owner-type` | Import for specific owner type |
| `import` | `--owner-id` | Import for specific owner ID |

## ⚙️ Configuration

### Complete Configuration Reference

Publish the config file for full customization:

```bash
php artisan vendor:publish --provider="Litepie\Settings\Providers\SettingsServiceProvider" --tag="settings-config"
```

### Key Configuration Options

```php
<?php
return [
    // Caching configuration
    'cache' => [
        'enabled' => true,
        'store' => env('SETTINGS_CACHE_STORE', 'default'),
        'prefix' => 'settings',
        'ttl' => 3600, // Cache time-to-live in seconds
    ],

    // Database settings
    'database' => [
        'table_prefix' => 'settings_',
        'connection' => env('SETTINGS_DB_CONNECTION', 'default'),
    ],

    // Security and encryption
    'encryption' => [
        'enabled' => true,
        'key' => env('SETTINGS_ENCRYPTION_KEY', env('APP_KEY')),
    ],

    // Data type mappings
    'types' => [
        'string' => \Litepie\Settings\Types\StringType::class,
        'integer' => \Litepie\Settings\Types\IntegerType::class,
        'float' => \Litepie\Settings\Types\FloatType::class,
        'boolean' => \Litepie\Settings\Types\BooleanType::class,
        'array' => \Litepie\Settings\Types\ArrayType::class,
        'json' => \Litepie\Settings\Types\JsonType::class,
        'file' => \Litepie\Settings\Types\FileType::class,
        'encrypted' => \Litepie\Settings\Types\EncryptedType::class,
    ],

    // Default setting groups
    'default_groups' => [
        'general' => 'General Settings',
        'appearance' => 'Appearance',
        'notifications' => 'Notifications',
        'security' => 'Security',
        'api' => 'API Configuration',
        'email' => 'Email Settings',
        'social' => 'Social Media',
    ],

    // Permission system
    'permissions' => [
        'view_settings' => 'View Settings',
        'edit_settings' => 'Edit Settings',
        'delete_settings' => 'Delete Settings',
        'manage_global_settings' => 'Manage Global Settings',
        'manage_company_settings' => 'Manage Company Settings',
        'export_settings' => 'Export Settings',
        'import_settings' => 'Import Settings',
    ],

    // API configuration
    'api' => [
        'prefix' => 'api/settings',
        'middleware' => ['auth:sanctum'],
        'rate_limit' => '60:1',
    ],

    // File upload settings
    'files' => [
        'disk' => 'public',
        'path' => 'settings',
        'max_size' => 2048, // KB
        'allowed_types' => ['jpg', 'jpeg', 'png', 'gif', 'pdf'],
    ],

    // Audit trail
    'audit' => [
        'enabled' => true,
        'keep_history_days' => 365,
    ],

    // Webhooks (optional)
    'webhooks' => [
        'enabled' => false,
        'endpoints' => [
            // 'setting.updated' => 'https://your-app.com/webhooks/settings'
        ],
    ],
];
```

### Environment Variables

```env
# Cache settings
SETTINGS_CACHE_STORE=redis
SETTINGS_CACHE_TTL=3600

# Database
SETTINGS_DB_CONNECTION=mysql
SETTINGS_TABLE_PREFIX=settings_

# Security
SETTINGS_ENCRYPTION_KEY=your-encryption-key

# API
SETTINGS_API_PREFIX=api/v1/settings
SETTINGS_API_RATE_LIMIT=100:1
```

## 📊 Events and Audit Trail

### Available Events

The package dispatches events for all setting operations:

```php
use Litepie\Settings\Events\SettingCreated;
use Litepie\Settings\Events\SettingUpdated;
use Litepie\Settings\Events\SettingDeleted;

// Listen for setting events in EventServiceProvider
protected $listen = [
    SettingCreated::class => [
        YourSettingCreatedListener::class,
    ],
    SettingUpdated::class => [
        YourSettingUpdatedListener::class,
    ],
    SettingDeleted::class => [
        YourSettingDeletedListener::class,
    ],
];
```

### Event Usage Examples

```php
// Listen for setting updates
Event::listen(SettingUpdated::class, function ($event) {
    $setting = $event->setting;
    $oldValue = $event->oldValue;
    $newValue = $event->newValue;
    
    // Log the change
    Log::info("Setting {$setting->key} changed from {$oldValue} to {$newValue}");
    
    // Send notification
    if ($setting->key === 'maintenance_mode') {
        // Notify administrators
    }
});

// Listen for setting creation
Event::listen(SettingCreated::class, function ($event) {
    $setting = $event->setting;
    
    // Initialize related data
    if ($setting->key === 'new_company') {
        // Setup default company settings
    }
});
```

### Audit Trail and History

The package automatically tracks all changes when audit is enabled:

```php
// Get setting history
$setting = Settings::findByKey('app_name');
$history = $setting->history()->orderBy('created_at', 'desc')->get();

foreach ($history as $change) {
    echo "Changed from '{$change->old_value}' to '{$change->new_value}' ";
    echo "by {$change->changedBy->name} ";
    echo "on {$change->created_at->format('Y-m-d H:i:s')}";
}

// Get recent changes
$recentChanges = app(\Litepie\Settings\Models\SettingHistory::class)
    ->with(['setting', 'changedBy'])
    ->latest()
    ->limit(10)
    ->get();
```

### Audit Configuration

```php
'audit' => [
    'enabled' => true,
    'keep_history_days' => 365, // Keep history for 1 year
],
```

## 🔐 Security and Permissions

### Encrypted Settings

Sensitive data is automatically encrypted/decrypted:

```php
// Set encrypted setting
Settings::set('api_secret', 'secret-value', null, ['type' => 'encrypted']);

// Value is automatically encrypted in database
// and decrypted when retrieved
$secret = Settings::get('api_secret'); // Returns 'secret-value'
```

### Permission System

The package includes a comprehensive permission system:

```php
// Check permissions before setting operations
if (auth()->user()->can('manage_global_settings')) {
    Settings::set('global_setting', 'value');
}

// Available permissions
$permissions = [
    'view_settings',
    'edit_settings', 
    'delete_settings',
    'manage_global_settings',
    'manage_company_settings',
    'export_settings',
    'import_settings'
];
```

### Public vs Private Settings

Control setting visibility:

```php
// Public setting (can be accessed via API without authentication)
Settings::set('app_version', '1.0.0', null, [
    'is_public' => true,
    'description' => 'Current application version'
]);

// Private setting (requires authentication)
Settings::set('admin_email', 'admin@example.com', null, [
    'is_public' => false
]);

// Get only public settings
$publicSettings = Setting::public()->get();
```

### Data Validation

Add validation rules to ensure data integrity:

```php
Settings::set('max_file_size', 10240, null, [
    'type' => 'integer',
    'validation_rules' => ['integer', 'min:1024', 'max:104857600'], // 1KB to 100MB
    'description' => 'Maximum file upload size in bytes'
]);

Settings::set('contact_email', 'admin@example.com', null, [
    'validation_rules' => ['email', 'required'],
    'description' => 'Primary contact email address'
]);
```

## 💡 Real-World Examples

### Multi-tenant Application

```php
// Company-specific settings
class Company extends Model 
{
    use HasSettings;
}

$company = Company::find(1);

// Set company branding
$company->setMultipleSettings([
    'company_name' => 'Acme Corp',
    'logo_url' => '/storage/logos/acme.png',
    'primary_color' => '#007bff',
    'secondary_color' => '#6c757d',
    'timezone' => 'America/New_York',
    'date_format' => 'Y-m-d',
    'currency' => 'USD'
]);

// User inherits company settings but can override
$user = User::find(1);
$user->setSetting('timezone', 'America/Los_Angeles'); // Override company timezone
$user->setSetting('theme', 'dark'); // Personal preference

// Getting settings with fallback hierarchy
$timezone = $user->getSetting('timezone'); // Returns 'America/Los_Angeles'
$currency = $user->getSetting('currency'); // Falls back to company setting 'USD'
```

### E-commerce Configuration

```php
// Store settings with groups
$store = Store::find(1);

// Payment settings
$store->setMultipleSettings([
    'stripe_public_key' => 'pk_test_...',
    'stripe_secret_key' => 'sk_test_...',
    'paypal_client_id' => 'your_paypal_client_id',
    'payment_methods' => ['stripe', 'paypal', 'bank_transfer']
], ['group_id' => 'payment']);

// Shipping settings  
$store->setMultipleSettings([
    'free_shipping_threshold' => 50.00,
    'shipping_zones' => ['domestic', 'international'],
    'default_shipping_method' => 'standard'
], ['group_id' => 'shipping']);

// Tax settings
$store->setMultipleSettings([
    'tax_enabled' => true,
    'tax_rate' => 8.25,
    'tax_inclusive' => false
], ['group_id' => 'tax']);
```

### SaaS Application Settings

```php
// Global application settings
Settings::setMultiple([
    'app_name' => 'SaaS Platform',
    'app_version' => '2.1.0',
    'maintenance_mode' => false,
    'max_users_per_account' => 100,
    'feature_flags' => [
        'new_dashboard' => true,
        'advanced_analytics' => false,
        'api_v2' => true
    ]
]);

// Account-specific limits
$account = Account::find(1);
$account->setMultipleSettings([
    'plan_type' => 'premium',
    'max_projects' => 50,
    'api_rate_limit' => 1000,
    'storage_limit' => 107374182400, // 100GB in bytes
    'custom_domain_enabled' => true
]);

// Check feature availability
if ($account->getSetting('custom_domain_enabled', false)) {
    // Allow custom domain setup
}
```

## 🏗️ Architecture and Best Practices

### Setting Hierarchy

The package follows a clear hierarchy for setting resolution:

1. **User-specific settings** (highest priority)
2. **Role-specific settings**
3. **Team/Group settings**
4. **Company/Organization settings**
5. **Global settings** (lowest priority)

```php
// Example hierarchy
$globalTheme = Settings::get('theme'); // 'light' (global default)
$companyTheme = Settings::get('theme', null, $company); // 'corporate' (company override)
$userTheme = Settings::get('theme', null, $user); // 'dark' (user preference)

// The user gets 'dark', company users without preference get 'corporate'
```

### Performance Optimization

```php
// Use bulk operations for better performance
Settings::setMultiple([
    'setting1' => 'value1',
    'setting2' => 'value2',
    'setting3' => 'value3'
], $user);

// Instead of:
Settings::set('setting1', 'value1', $user);
Settings::set('setting2', 'value2', $user);
Settings::set('setting3', 'value3', $user);

// Preload settings to avoid N+1 queries
$users = User::with('settings')->get();
foreach ($users as $user) {
    $theme = $user->getSetting('theme'); // No additional query
}
```

### Naming Conventions

```php
// Use dot notation for nested settings
Settings::set('email.smtp.host', 'smtp.gmail.com');
Settings::set('email.smtp.port', 587);
Settings::set('email.smtp.encryption', 'tls');

// Use descriptive names
Settings::set('max_upload_file_size', 10485760); // Good
Settings::set('max_size', 10485760); // Too vague

// Group related settings
Settings::set('notification.email.enabled', true);
Settings::set('notification.sms.enabled', false);
Settings::set('notification.push.enabled', true);
```

### Error Handling

```php
use Litepie\Settings\Exceptions\SettingNotFoundException;
use Litepie\Settings\Exceptions\InvalidSettingTypeException;

try {
    Settings::set('invalid_type_setting', 'value', null, ['type' => 'unknown']);
} catch (InvalidSettingTypeException $e) {
    // Handle invalid type
    Log::error('Invalid setting type: ' . $e->getMessage());
}

// Safe getting with defaults
$criticalSetting = Settings::get('critical_setting', 'safe_default');

// Check existence before operations
if (Settings::has('feature_flag')) {
    $enabled = Settings::get('feature_flag');
}
```

## 🔧 Custom Setting Types

### Creating Custom Types

You can create custom setting types for specialized data:

```php
<?php

namespace App\Settings\Types;

class ColorType
{
    public static function cast($value)
    {
        // Ensure value is a valid hex color
        if (!preg_match('/^#[a-f0-9]{6}$/i', $value)) {
            return '#000000'; // Default to black
        }
        return $value;
    }

    public static function serialize($value)
    {
        return self::cast($value);
    }

    public static function validate($value, $rules = [])
    {
        return preg_match('/^#[a-f0-9]{6}$/i', $value);
    }
}
```

Register the custom type in config:

```php
'types' => [
    // ... existing types
    'color' => \App\Settings\Types\ColorType::class,
],
```

Use the custom type:

```php
Settings::set('brand_color', '#007bff', null, ['type' => 'color']);
$color = Settings::get('brand_color'); // Always returns valid hex color
```

## 🚨 Troubleshooting

### Common Issues

#### Cache Not Clearing
```php
// Clear all settings cache
Settings::clearCache();

// Or use artisan command
php artisan settings:cache:clear

// Check cache configuration
php artisan config:cache
```

#### Settings Not Persisting
```php
// Check database connection
php artisan migrate:status

// Verify table exists
Schema::hasTable('settings_settings');

// Check for validation errors
try {
    Settings::set('test', 'value');
} catch (\Exception $e) {
    Log::error('Setting error: ' . $e->getMessage());
}
```

#### Performance Issues
```php
// Enable query logging to identify N+1 queries
DB::enableQueryLog();
$settings = Settings::all($user);
$queries = DB::getQueryLog();

// Check cache hit ratio
$cacheKey = 'settings:global:app_name';
$hit = Cache::has($cacheKey);
```

#### Permission Denied
```php
// Check user permissions
if (!auth()->user()->can('edit_settings')) {
    abort(403, 'Permission denied');
}

// Verify middleware configuration
'middleware' => ['auth:sanctum', 'can:manage_settings'],
```

### Debug Mode

Enable debug logging in config:

```php
'debug' => env('SETTINGS_DEBUG', false),
```

This will log all setting operations for troubleshooting.

## 📚 API Reference

### Settings Service Methods

| Method | Parameters | Return | Description |
|--------|------------|--------|-------------|
| `get()` | `$key, $default, $owner` | `mixed` | Get setting value |
| `set()` | `$key, $value, $owner, $options` | `bool` | Set setting value |
| `has()` | `$key, $owner` | `bool` | Check if setting exists |
| `forget()` | `$key, $owner` | `bool` | Delete setting |
| `all()` | `$owner` | `Collection` | Get all settings |
| `getByGroup()` | `$groupKey, $owner` | `Collection` | Get settings by group |
| `setMultiple()` | `$settings, $owner` | `bool` | Set multiple settings |
| `getMultiple()` | `$keys, $owner` | `array` | Get multiple settings |
| `export()` | `$owner, $groups` | `array` | Export settings |
| `import()` | `$settings, $owner, $overwrite` | `bool` | Import settings |
| `clearCache()` | `$key, $owner` | `void` | Clear cache |

### HasSettings Trait Methods

| Method | Parameters | Return | Description |
|--------|------------|--------|-------------|
| `getSetting()` | `$key, $default` | `mixed` | Get setting for model |
| `setSetting()` | `$key, $value, $options` | `bool` | Set setting for model |
| `hasSetting()` | `$key` | `bool` | Check if model has setting |
| `forgetSetting()` | `$key` | `bool` | Delete model setting |
| `getAllSettings()` | - | `Collection` | Get all model settings |
| `getSettingsByGroup()` | `$groupKey` | `Collection` | Get model settings by group |
| `setMultipleSettings()` | `$settings` | `bool` | Set multiple model settings |

## 🧪 Testing

### Unit Testing

The package includes comprehensive tests. Run them with:

```bash
composer test

# Or with coverage
composer test-coverage

# Run specific test suites
./vendor/bin/phpunit tests/Unit/SettingsServiceTest.php
./vendor/bin/phpunit tests/Feature/SettingsApiTest.php
```

### Testing in Your Application

```php
<?php

namespace Tests\Feature;

use Tests\TestCase;
use Litepie\Settings\Facades\Settings;
use Illuminate\Foundation\Testing\RefreshDatabase;

class SettingsTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_set_and_get_setting()
    {
        Settings::set('test_setting', 'test_value');
        
        $this->assertEquals('test_value', Settings::get('test_setting'));
    }

    public function test_user_settings_override_global()
    {
        $user = User::factory()->create();
        
        Settings::set('theme', 'light'); // Global
        Settings::set('theme', 'dark', $user); // User-specific
        
        $this->assertEquals('light', Settings::get('theme'));
        $this->assertEquals('dark', Settings::get('theme', null, $user));
    }

    public function test_settings_are_cached()
    {
        Settings::set('cached_setting', 'value');
        
        // First call hits database
        $value1 = Settings::get('cached_setting');
        
        // Second call hits cache
        $value2 = Settings::get('cached_setting');
        
        $this->assertEquals($value1, $value2);
    }
}
```

### Mock Settings in Tests

```php
// Mock the settings service
$mock = Mockery::mock(SettingsService::class);
$mock->shouldReceive('get')
     ->with('test_setting')
     ->andReturn('mocked_value');

$this->app->instance('settings', $mock);

// Use settings normally in your test
$value = Settings::get('test_setting'); // Returns 'mocked_value'
```

## 🔄 Migration Guide

### From Other Setting Packages

#### From spatie/laravel-settings

```php
// Old way (spatie)
use Spatie\LaravelSettings\Settings as SpatieSettings;

class GeneralSettings extends SpatieSettings
{
    public string $site_name;
    public bool $site_active;
    
    public static function group(): string
    {
        return 'general';
    }
}

// New way (Litepie)
Settings::setMultiple([
    'site_name' => 'My Site',
    'site_active' => true
], null, ['group_id' => 'general']);
```

#### From anlutro/l4-settings

```php
// Old way (anlutro)
use anlutro\LaravelSettings\Facade as SettingsFacade;

SettingsFacade::set('key', 'value');
$value = SettingsFacade::get('key');

// New way (Litepie) - mostly compatible
use Litepie\Settings\Facades\Settings;

Settings::set('key', 'value');
$value = Settings::get('key');
```

### Database Migration

If migrating from another settings package:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

class MigrateFromOldSettingsPackage extends Migration
{
    public function up()
    {
        // Example: Migrate from simple key-value table
        $oldSettings = DB::table('old_settings')->get();
        
        foreach ($oldSettings as $setting) {
            DB::table('settings_settings')->insert([
                'key' => $setting->key,
                'value' => $setting->value,
                'type' => 'string', // Assume string type
                'owner_type' => null,
                'owner_id' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
```

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Development Setup

```bash
# Clone the repository
git clone https://github.com/LavaLite/Settings.git
cd settings

# Install dependencies
composer install

# Run tests
composer test

# Check code style
composer cs-check

# Fix code style
composer cs-fix
```

### Guidelines

1. **Write Tests**: All new features must include tests
2. **Follow PSR Standards**: Use PSR-12 code style
3. **Document Changes**: Update README and docblocks
4. **BC Compatibility**: Don't break existing APIs without major version bump

### Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Update documentation
7. Commit your changes (`git commit -m 'Add amazing feature'`)
8. Push to the branch (`git push origin feature/amazing-feature`)
9. Open a Pull Request


See [CHANGELOG.md](CHANGELOG.md) for complete history.

## 📄 License

The MIT License (MIT). Please see [License File](LICENSE.md) for more information.

## 🙏 Credits

- **[Renfos Technologies](https://renfos.com)** - Package development and maintenance
- **[Laravel Framework](https://laravel.com)** - The amazing framework this package is built for
- **All Contributors** - Thank you for your contributions and feedback

## 📞 Support

- **Documentation**: [https://docs.lavalite.org/settings](https://docs.lavalite.org/settings)
- **Issues**: [GitHub Issues](https://github.com/LavaLite/settings/issues)
- **Discussions**: [GitHub Discussions](https://github.com/LavaLite/settings/discussions)
- **Email**: [support@lavalite.org](mailto:support@lavalite.org)

## 🌟 Show Your Support

If this package helped you, please consider:

- ⭐ Starring the repository
- 🐛 Reporting bugs
- 💡 Requesting features
- 📝 Contributing code
- 📢 Sharing with others

---

<p align="center">
Made with ❤️ by <a href="https://renfos.com">Renfos Technologies</a>
</p>
