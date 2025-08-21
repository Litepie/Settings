<?php

namespace Litepie\Settings\Types;

class EncryptedType
{
    public static function cast($value)
    {
        // The value should already be decrypted in the model accessor
        return $value;
    }

    public static function serialize($value)
    {
        // The value should be encrypted in the model mutator
        return $value;
    }

    public static function validate($value, $rules = [])
    {
        return true; // Any value can be encrypted
    }
}
