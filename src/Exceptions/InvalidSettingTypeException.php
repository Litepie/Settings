<?php

namespace Litepie\Settings\Exceptions;

use Exception;

class InvalidSettingTypeException extends Exception
{
    public function __construct($type)
    {
        parent::__construct("Invalid setting type: '{$type}'.");
    }
}
