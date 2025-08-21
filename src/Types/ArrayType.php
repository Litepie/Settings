<?php

namespace Litepie\Settings\Types;

class ArrayType
{
    public static function cast($value)
    {
        if (is_string($value)) {
            return json_decode($value, true) ?: [];
        }
        
        return is_array($value) ? $value : [];
    }

    public static function serialize($value)
    {
        return json_encode($value);
    }

    public static function validate($value, $rules = [])
    {
        return is_array($value) || (is_string($value) && json_decode($value) !== null);
    }
}
