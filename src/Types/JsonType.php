<?php

namespace Litepie\Settings\Types;

class JsonType
{
    public static function cast($value)
    {
        if (is_string($value)) {
            return json_decode($value, true) ?: [];
        }
        
        return $value;
    }

    public static function serialize($value)
    {
        return json_encode($value);
    }

    public static function validate($value, $rules = [])
    {
        if (is_string($value)) {
            json_decode($value);
            return json_last_error() === JSON_ERROR_NONE;
        }
        
        return true;
    }
}
