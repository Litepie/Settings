<?php

namespace Litepie\Settings\Types;

class StringType
{
    public static function cast($value)
    {
        return (string) $value;
    }

    public static function serialize($value)
    {
        return (string) $value;
    }

    public static function validate($value, $rules = [])
    {
        // Implement validation logic
        return true;
    }
}
