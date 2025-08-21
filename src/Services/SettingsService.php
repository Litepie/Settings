<?php

namespace Litepie\Settings\Services;

use Illuminate\Support\Collection;
use Illuminate\Contracts\Cache\Repository as CacheRepository;
use Illuminate\Contracts\Events\Dispatcher;
use Litepie\Settings\Repositories\SettingRepository;
use Litepie\Settings\Events\SettingUpdated;
use Litepie\Settings\Events\SettingCreated;
use Litepie\Settings\Events\SettingDeleted;
use Litepie\Settings\Exceptions\SettingNotFoundException;
use Litepie\Settings\Exceptions\InvalidSettingTypeException;

class SettingsService
{
    protected $repository;
    protected $cache;
    protected $events;
    protected $cacheEnabled;

    public function __construct(
        SettingRepository $repository,
        CacheRepository $cache,
        Dispatcher $events
    ) {
        $this->repository = $repository;
        $this->cache = $cache;
        $this->events = $events;
        $this->cacheEnabled = config('settings.cache.enabled', true);
    }

    public function get(string $key, $default = null, $owner = null)
    {
        $cacheKey = $this->getCacheKey($key, $owner);

        if ($this->cacheEnabled && $this->cache->has($cacheKey)) {
            return $this->cache->get($cacheKey);
        }

        $setting = $this->repository->findByKey($key, $owner);
        
        if (!$setting) {
            return $default;
        }

        $value = $setting->formatted_value;

        if ($this->cacheEnabled) {
            $this->cache->put($cacheKey, $value, config('settings.cache.ttl'));
        }

        return $value;
    }

    public function set(string $key, $value, $owner = null, array $options = []): bool
    {
        $setting = $this->repository->findByKey($key, $owner);

        if ($setting) {
            $oldValue = $setting->value;
            $updated = $this->repository->update($setting, [
                'value' => $value,
                ...$options
            ]);

            if ($updated) {
                $this->clearCache($key, $owner);
                $this->events->dispatch(new SettingUpdated($setting, $oldValue, $value));
                $this->recordHistory($setting, $oldValue, $value);
            }

            return $updated;
        }

        $created = $this->repository->create([
            'key' => $key,
            'value' => $value,
            'owner_type' => $owner ? get_class($owner) : null,
            'owner_id' => $owner ? $owner->id : null,
            ...$options
        ]);

        if ($created) {
            $this->clearCache($key, $owner);
            $this->events->dispatch(new SettingCreated($created));
        }

        return (bool) $created;
    }

    public function has(string $key, $owner = null): bool
    {
        return $this->repository->findByKey($key, $owner) !== null;
    }

    public function forget(string $key, $owner = null): bool
    {
        $setting = $this->repository->findByKey($key, $owner);

        if (!$setting) {
            return false;
        }

        $deleted = $this->repository->delete($setting);

        if ($deleted) {
            $this->clearCache($key, $owner);
            $this->events->dispatch(new SettingDeleted($setting));
        }

        return $deleted;
    }

    public function all($owner = null): Collection
    {
        return $this->repository->getAllForOwner($owner);
    }

    public function getByGroup(string $groupKey, $owner = null): Collection
    {
        return $this->repository->getByGroup($groupKey, $owner);
    }

    public function setMultiple(array $settings, $owner = null): bool
    {
        $success = true;

        foreach ($settings as $key => $value) {
            if (!$this->set($key, $value, $owner)) {
                $success = false;
            }
        }

        return $success;
    }

    public function getMultiple(array $keys, $owner = null): array
    {
        $result = [];

        foreach ($keys as $key => $default) {
            if (is_numeric($key)) {
                $result[$default] = $this->get($default, null, $owner);
            } else {
                $result[$key] = $this->get($key, $default, $owner);
            }
        }

        return $result;
    }

    public function clearCache($key = null, $owner = null): void
    {
        if ($key) {
            $cacheKey = $this->getCacheKey($key, $owner);
            $this->cache->forget($cacheKey);
        } else {
            $this->cache->flush();
        }
    }

    public function export($owner = null, array $groups = []): array
    {
        return $this->repository->export($owner, $groups);
    }

    public function import(array $settings, $owner = null, bool $overwrite = false): bool
    {
        return $this->repository->import($settings, $owner, $overwrite);
    }

    protected function getCacheKey(string $key, $owner = null): string
    {
        $prefix = config('settings.cache.prefix', 'settings');
        $ownerKey = $owner ? get_class($owner) . ':' . $owner->id : 'global';
        
        return "{$prefix}:{$ownerKey}:{$key}";
    }

    protected function recordHistory($setting, $oldValue, $newValue): void
    {
        if (config('settings.audit.enabled', true)) {
            $this->repository->recordHistory($setting, $oldValue, $newValue);
        }
    }
}
