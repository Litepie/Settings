<?php

namespace Litepie\Settings\Traits;

use Illuminate\Database\Eloquent\Relations\MorphMany;
use Litepie\Settings\Models\Setting;

trait HasSettings
{
    public function settings(): MorphMany
    {
        return $this->morphMany(Setting::class, 'owner');
    }

    public function getSetting(string $key, $default = null)
    {
        return app('settings')->get($key, $default, $this);
    }

    public function setSetting(string $key, $value, array $options = []): bool
    {
        return app('settings')->set($key, $value, $this, $options);
    }

    public function hasSetting(string $key): bool
    {
        return app('settings')->has($key, $this);
    }

    public function forgetSetting(string $key): bool
    {
        return app('settings')->forget($key, $this);
    }

    public function getAllSettings()
    {
        return app('settings')->all($this);
    }

    public function getSettingsByGroup(string $groupKey)
    {
        return app('settings')->getByGroup($groupKey, $this);
    }

    public function setMultipleSettings(array $settings): bool
    {
        return app('settings')->setMultiple($settings, $this);
    }
}
