<?php

namespace Litepie\Settings\Types;

class BooleanType
{
    public static function cast($value)
    {
        return filter_var($value, FILTER_VALIDATE_BOOLEAN);
    }

    public static function serialize($value)
    {
        return $value ? '1' : '0';
    }

    public static function validate($value, $rules = [])
    {
        return in_array($value, [true, false, 1, 0, '1', '0', 'true', 'false'], true);
    }
}
