<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateSettingsHistoryTable extends Migration
{
    public function up()
    {
        Schema::create(config('settings.database.table_prefix') . 'history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('setting_id')->constrained(config('settings.database.table_prefix') . 'settings')->onDelete('cascade');
            $table->longText('old_value')->nullable();
            $table->longText('new_value')->nullable();
            $table->nullableMorphs('changed_by');
            $table->string('ip_address')->nullable();
            $table->text('user_agent')->nullable();
            $table->string('change_reason')->nullable();
            $table->timestamps();

            $table->index(['setting_id', 'created_at']);
            $table->index(['changed_by_type', 'changed_by_id']);
        });
    }

    public function down()
    {
        Schema::dropIfExists(config('settings.database.table_prefix') . 'history');
    }
}
