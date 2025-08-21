<?php

namespace Litepie\Settings\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

class SettingGroup extends Model
{
    protected $fillable = [
        'key',
        'name',
        'description',
        'icon',
        'order',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function getTable(): string
    {
        return config('settings.database.table_prefix') . 'settings_groups';
    }

    public function settings(): HasMany
    {
        return $this->hasMany(Setting::class, 'group_id');
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }
}
