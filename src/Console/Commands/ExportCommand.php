<?php

namespace Litepie\Settings\Console\Commands;

use Illuminate\Console\Command;
use Litepie\Settings\Services\SettingsService;

class ExportCommand extends Command
{
    protected $signature = 'settings:export {--file=settings.json} {--owner-type=} {--owner-id=} {--groups=*}';
    
    protected $description = 'Export settings to a file';

    public function handle(SettingsService $settingsService)
    {
        $ownerType = $this->option('owner-type');
        $ownerId = $this->option('owner-id');
        $groups = $this->option('groups');
        $file = $this->option('file');

        $owner = null;
        if ($ownerType && $ownerId && class_exists($ownerType)) {
            $owner = $ownerType::find($ownerId);
        }

        $settings = $settingsService->export($owner, $groups);

        $json = json_encode($settings, JSON_PRETTY_PRINT);
        file_put_contents($file, $json);

        $this->info("Settings exported to {$file}");
        $this->info("Total settings exported: " . count($settings));
    }
}
