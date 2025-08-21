<?php

namespace Litepie\Settings\Types;

class FileType
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
        // For file types, we'd typically validate file paths or URLs
        return is_string($value);
    }
}
