<?php

namespace Litepie\Settings\Types;

class IntegerType
{
    public static function cast($value)
    {
        return (int) $value;
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
