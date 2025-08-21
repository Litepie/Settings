<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateSettingsGroupsTable extends Migration
{
    public function up()
    {
        Schema::create(config('settings.database.table_prefix') . 'settings_groups', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('icon')->nullable();
            $table->integer('order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->index(['key', 'is_active']);
        });
    }

    public function down()
    {
        Schema::dropIfExists(config('settings.database.table_prefix') . 'settings_groups');
    }
}
