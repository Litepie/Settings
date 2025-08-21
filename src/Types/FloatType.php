<?php

namespace Litepie\Settings\Types;

class FloatType
{
    public static function cast($value)
    {
        return (float) $value;
    }

    public static function serialize($value)
    {
        return (string) $value;
    }

    public static function validate($value, $rules = [])
    {
        return is_numeric($value);
    }
}
