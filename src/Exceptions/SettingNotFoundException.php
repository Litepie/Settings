<?php

namespace Litepie\Settings\Exceptions;

use Exception;

class SettingNotFoundException extends Exception
{
    public function __construct($key, $owner = null)
    {
        $ownerInfo = $owner ? ' for owner ' . get_class($owner) . ':' . $owner->id : '';
        parent::__construct("Setting '{$key}'{$ownerInfo} not found.");
    }
}
