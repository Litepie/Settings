<?php

namespace Litepie\Settings\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class SettingHistory extends Model
{
    protected $fillable = [
        'setting_id',
        'old_value',
        'new_value',
        'changed_by_type',
        'changed_by_id',
        'ip_address',
        'user_agent',
        'change_reason',
    ];

    public function getTable()
    {
        return config('settings.database.table_prefix') . 'history';
    }

    public function setting(): BelongsTo
    {
        return $this->belongsTo(Setting::class);
    }

    public function changedBy(): MorphTo
    {
        return $this->morphTo();
    }
}
