<?php

namespace Litepie\Settings\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;
use Litepie\Settings\Traits\HasSettingTypes;
use Litepie\Settings\Traits\CachesSettings;

class Setting extends Model
{
    use HasSettingTypes, CachesSettings;

    protected $fillable = [
        'key',
        'value',
        'type',
        'group_id',
        'is_encrypted',
        'is_public',
        'description',
        'validation_rules',
        'default_value',
        'order',
        'depends_on',
        'metadata',
    ];

    protected $casts = [
        'is_encrypted' => 'boolean',
        'is_public' => 'boolean',
        'validation_rules' => 'array',
        'metadata' => 'array',
        'depends_on' => 'array',
    ];

    protected $appends = ['formatted_value'];

    public function getTable(): string
    {
        return config('settings.database.table_prefix') . 'settings';
    }

    public function owner(): MorphTo
    {
        return $this->morphTo();
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(SettingGroup::class, 'group_id');
    }

    public function history(): HasMany
    {
        return $this->hasMany(SettingHistory::class);
    }

    public function permissions(): HasMany
    {
        return $this->hasMany(SettingPermission::class);
    }

    public function getFormattedValueAttribute(): mixed
    {
        return $this->castValue($this->value, $this->type);
    }

    public function setValueAttribute(mixed $value): void
    {
        if ($this->is_encrypted) {
            $this->attributes['value'] = encrypt($value);
        } else {
            $this->attributes['value'] = $this->serializeValue($value, $this->type);
        }
    }

    public function getValueAttribute(?string $value): mixed
    {
        if ($this->is_encrypted && $value) {
            try {
                return decrypt($value);
            } catch (\Exception $e) {
                return null;
            }
        }

        return $this->castValue($value, $this->type);
    }

    public function scopeForOwner(Builder $query, ?Model $owner): Builder
    {
        if ($owner) {
            return $query->where('owner_type', get_class($owner))
                        ->where('owner_id', $owner->id);
        }
        
        return $query->whereNull('owner_type')->whereNull('owner_id');
    }

    public function scopePublic(Builder $query): Builder
    {
        return $query->where('is_public', true);
    }

    public function scopeByGroup(Builder $query, string $groupKey): Builder
    {
        return $query->whereHas('group', function (Builder $q) use ($groupKey) {
            $q->where('key', $groupKey);
        });
    }

    public function scopeByKey(Builder $query, string $key): Builder
    {
        return $query->where('key', $key);
    }
}
