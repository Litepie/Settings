<?php

namespace Litepie\Settings\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Contracts\Foundation\Application;
use Litepie\Settings\Services\SettingsService;
use Litepie\Settings\Repositories\SettingRepository;
use Litepie\Settings\Console\Commands\InstallCommand;
use Litepie\Settings\Console\Commands\SeedCommand;
use Litepie\Settings\Console\Commands\ExportCommand;
use Litepie\Settings\Console\Commands\ImportCommand;
use Litepie\Settings\Console\Commands\CacheClearCommand;

class SettingsServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->mergeConfigFrom(__DIR__ . '/../../config/settings.php', 'settings');

        $this->app->singleton('settings', function (Application $app): SettingsService {
            return new SettingsService(
                new SettingRepository(),
                $app['cache'],
                $app['events']
            );
        });

        $this->app->bind(SettingRepository::class, function (Application $app): SettingRepository {
            return new SettingRepository();
        });
    }

    public function boot(): void
    {
        $this->loadMigrationsFrom(__DIR__ . '/../../database/migrations');
        $this->loadRoutesFrom(__DIR__ . '/../../routes/api.php');

        if ($this->app->runningInConsole()) {
            $this->publishes([
                __DIR__ . '/../../config/settings.php' => config_path('settings.php'),
            ], 'settings-config');

            $this->publishes([
                __DIR__ . '/../../resources/js' => resource_path('js/vendor/settings'),
            ], 'settings-assets');

            $this->publishes([
                __DIR__ . '/../../resources/mobile' => resource_path('mobile/vendor/settings'),
            ], 'settings-mobile');

            $this->commands([
                InstallCommand::class,
                SeedCommand::class,
                ExportCommand::class,
                ImportCommand::class,
                CacheClearCommand::class,
            ]);
        }
    }
}
