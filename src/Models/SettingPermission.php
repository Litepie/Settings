<?php

namespace Litepie\Settings\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class SettingPermission extends Model
{
    protected $fillable = [
        'setting_id',
        'grantee_type',
        'grantee_id',
        'permission',
        'granted_by_type',
        'granted_by_id',
    ];

    public function getTable()
    {
        return config('settings.database.table_prefix') . 'permissions';
    }

    public function setting(): BelongsTo
    {
        return $this->belongsTo(Setting::class);
    }

    public function grantee(): MorphTo
    {
        return $this->morphTo();
    }

    public function grantedBy(): MorphTo
    {
        return $this->morphTo();
    }
}
