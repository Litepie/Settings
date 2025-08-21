<?php

namespace Litepie\Settings\Console\Commands;

use Illuminate\Console\Command;
use Litepie\Settings\Services\SettingsService;

class ImportCommand extends Command
{
    protected $signature = 'settings:import {file} {--owner-type=} {--owner-id=} {--overwrite}';
    
    protected $description = 'Import settings from a file';

    public function handle(SettingsService $settingsService)
    {
        $file = $this->argument('file');
        $ownerType = $this->option('owner-type');
        $ownerId = $this->option('owner-id');
        $overwrite = $this->option('overwrite');

        if (!file_exists($file)) {
            $this->error("File {$file} does not exist");
            return 1;
        }

        $owner = null;
        if ($ownerType && $ownerId && class_exists($ownerType)) {
            $owner = $ownerType::find($ownerId);
        }

        $settings = json_decode(file_get_contents($file), true);

        if (!$settings) {
            $this->error("Invalid JSON file");
            return 1;
        }

        $success = $settingsService->import($settings, $owner, $overwrite);

        if ($success) {
            $this->info("Settings imported successfully");
            $this->info("Total settings imported: " . count($settings));
        } else {
            $this->error("Failed to import some settings");
            return 1;
        }
    }
}
