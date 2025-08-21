<?php

namespace Litepie\Settings\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSettingRequest extends FormRequest
{
    public function authorize()
    {
        return true; // Implement your authorization logic
    }

    public function rules()
    {
        return [
            'key' => 'required|string|max:255',
            'value' => 'required',
            'type' => 'sometimes|string|in:string,integer,float,boolean,array,json,file,encrypted',
            'group_id' => 'sometimes|exists:' . config('settings.database.table_prefix') . 'groups,id',
            'description' => 'sometimes|string|max:500',
            'is_public' => 'sometimes|boolean',
            'owner_type' => 'sometimes|string',
            'owner_id' => 'sometimes|integer',
        ];
    }
}
