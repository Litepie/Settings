<?php

namespace Litepie\Settings\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Litepie\Settings\Models\Setting;

class SettingUpdated
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $setting;
    public $oldValue;
    public $newValue;

    public function __construct(Setting $setting, $oldValue, $newValue)
    {
        $this->setting = $setting;
        $this->oldValue = $oldValue;
        $this->newValue = $newValue;
    }
}
