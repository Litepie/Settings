<?php

if (!function_exists('settings')) {
    function settings($key = null, $default = null, $owner = null)
    {
        $settingsService = app('settings');

        if ($key === null) {
            return $settingsService;
        }

        return $settingsService->get($key, $default, $owner);
    }
}
