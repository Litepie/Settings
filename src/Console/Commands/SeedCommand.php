<?php

namespace Litepie\Settings\Console\Commands;

use Illuminate\Console\Command;
use Litepie\Settings\Models\SettingGroup;

class SeedCommand extends Command
{
    protected $signature = 'settings:seed';
    
    protected $description = 'Seed default setting groups and templates';

    public function handle()
    {
        $this->info('Seeding default settings...');

        $this->seedGroups();
        $this->seedDefaultSettings();

        $this->info('Settings seeded successfully!');
    }

    protected function seedGroups()
    {
        $groups = config('settings.default_groups', []);

        foreach ($groups as $key => $name) {
            SettingGroup::updateOrCreate(
                ['key' => $key],
                [
                    'name' => $name,
                    'description' => "Default {$name} group",
                    'order' => array_search($key, array_keys($groups)),
                ]
            );
        }
    }

    protected function seedDefaultSettings()
    {
        $settingsService = app('settings');

        // Default global settings
        $defaultSettings = [
            'app_name' => config('app.name', 'Laravel'),
            'app_timezone' => config('app.timezone', 'UTC'),
            'date_format' => 'Y-m-d',
            'time_format' => 'H:i:s',
            'currency' => 'USD',
            'items_per_page' => 25,
            'maintenance_mode' => false,
        ];

        foreach ($defaultSettings as $key => $value) {
            if (!$settingsService->has($key)) {
                $settingsService->set($key, $value);
            }
        }
    }
}
