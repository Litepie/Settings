<?php

namespace Litepie\Settings\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class SettingResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'key' => $this->key,
            'value' => $this->formatted_value,
            'type' => $this->type,
            'group' => $this->whenLoaded('group', function () {
                return [
                    'id' => $this->group->id,
                    'key' => $this->group->key,
                    'name' => $this->group->name,
                ];
            }),
            'is_encrypted' => $this->is_encrypted,
            'is_public' => $this->is_public,
            'description' => $this->description,
            'default_value' => $this->default_value,
            'order' => $this->order,
            'metadata' => $this->metadata,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
