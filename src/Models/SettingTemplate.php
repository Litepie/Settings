<?php

namespace Litepie\Settings\Models;

use Illuminate\Database\Eloquent\Model;

class SettingTemplate extends Model
{
    protected $fillable = [
        'name',
        'description',
        'category',
        'settings_data',
        'is_active',
    ];

    protected $casts = [
        'settings_data' => 'array',
        'is_active' => 'boolean',
    ];

    public function getTable()
    {
        return config('settings.database.table_prefix') . 'templates';
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByCategory($query, $category)
    {
        return $query->where('category', $category);
    }
}
