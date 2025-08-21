<?php

return [
    // Cache configuration
    'cache' => [
        'enabled' => true,
        'store' => env('SETTINGS_CACHE_STORE', 'default'),
        'prefix' => 'settings',
        'ttl' => 3600, // 1 hour
    ],

    // Database configuration
    'database' => [
        'table_prefix' => 'settings_',
        'connection' => env('SETTINGS_DB_CONNECTION', 'default'),
    ],

    // Security settings
    'encryption' => [
        'enabled' => true,
        'key' => env('SETTINGS_ENCRYPTION_KEY', env('APP_KEY')),
    ],

    // Setting types
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

    // Default groups
    'default_groups' => [
        'general' => 'General Settings',
        'appearance' => 'Appearance',
        'notifications' => 'Notifications',
        'security' => 'Security',
        'api' => 'API Configuration',
        'email' => 'Email Settings',
        'social' => 'Social Media',
    ],

    // Permissions
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
        'rate_limit' => '60:1', // 60 requests per minute
    ],

    // File upload settings
    'files' => [
        'disk' => 'public',
        'path' => 'settings',
        'max_size' => 2048, // 2MB
        'allowed_types' => ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx'],
    ],

    // Audit settings
    'audit' => [
        'enabled' => true,
        'keep_history_days' => 365,
    ],

    // Webhook settings
    'webhooks' => [
        'enabled' => false,
        'endpoints' => [],
    ],
];
