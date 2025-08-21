<?php

namespace Litepie\Settings\Repositories;

use Illuminate\Support\Collection;
use Litepie\Settings\Models\Setting;
use Litepie\Settings\Models\SettingHistory;

class SettingRepository
{
    public function findByKey(string $key, $owner = null): ?Setting
    {
        return Setting::where('key', $key)
            ->forOwner($owner)
            ->first();
    }

    public function getAllForOwner($owner = null): Collection
    {
        return Setting::forOwner($owner)
            ->with(['group'])
            ->orderBy('order')
            ->get();
    }

    public function getByGroup(string $groupKey, $owner = null): Collection
    {
        return Setting::forOwner($owner)
            ->byGroup($groupKey)
            ->with(['group'])
            ->orderBy('order')
            ->get();
    }

    public function create(array $data): Setting
    {
        return Setting::create($data);
    }

    public function update(Setting $setting, array $data): bool
    {
        return $setting->update($data);
    }

    public function delete(Setting $setting): bool
    {
        return $setting->delete();
    }

    public function export($owner = null, array $groups = []): array
    {
        $query = Setting::forOwner($owner)->with(['group']);

        if (!empty($groups)) {
            $query->whereHas('group', function ($q) use ($groups) {
                $q->whereIn('key', $groups);
            });
        }

        $settings = $query->get();

        return $settings->map(function ($setting) {
            return [
                'key' => $setting->key,
                'value' => $setting->formatted_value,
                'type' => $setting->type,
                'group' => $setting->group->key ?? 'general',
                'description' => $setting->description,
                'is_public' => $setting->is_public,
            ];
        })->toArray();
    }

    public function import(array $settings, $owner = null, bool $overwrite = false): bool
    {
        $success = true;

        foreach ($settings as $settingData) {
            $existing = $this->findByKey($settingData['key'], $owner);

            if ($existing && !$overwrite) {
                continue;
            }

            if ($existing) {
                $success = $this->update($existing, $settingData) && $success;
            } else {
                $data = $settingData;
                $data['owner_type'] = $owner ? get_class($owner) : null;
                $data['owner_id'] = $owner ? $owner->id : null;
                
                $success = (bool) $this->create($data) && $success;
            }
        }

        return $success;
    }

    public function recordHistory(Setting $setting, $oldValue, $newValue): void
    {
        SettingHistory::create([
            'setting_id' => $setting->id,
            'old_value' => $oldValue,
            'new_value' => $newValue,
            'changed_by_type' => auth()->user() ? get_class(auth()->user()) : null,
            'changed_by_id' => auth()->id(),
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }
}
