<?php

namespace Litepie\Settings\Console\Commands;

use Illuminate\Console\Command;

class InstallCommand extends Command
{
    protected $signature = 'settings:install {--force : Force the operation to run when in production}';
    
    protected $description = 'Install the Litepie Settings package';

    public function handle()
    {
        $this->info('Installing Litepie Settings...');

        $this->call('vendor:publish', [
            '--provider' => 'Litepie\Settings\Providers\SettingsServiceProvider',
            '--tag' => 'settings-config'
        ]);

        $this->call('migrate');

        $this->call('settings:seed');

        $this->info('Litepie Settings installed successfully!');
    }
}
