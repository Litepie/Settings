<?php

namespace Litepie\Settings\Console\Commands;

use Illuminate\Console\Command;
use Litepie\Settings\Services\SettingsService;

class CacheClearCommand extends Command
{
    protected $signature = 'settings:cache:clear';
    
    protected $description = 'Clear settings cache';

    public function handle(SettingsService $settingsService)
    {
        $settingsService->clearCache();
        $this->info('Settings cache cleared successfully!');
    }
}
