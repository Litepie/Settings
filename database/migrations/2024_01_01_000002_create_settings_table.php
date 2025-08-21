<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateSettingsTable extends Migration
{
    public function up()
    {
        Schema::create(config('settings.database.table_prefix') . 'settings', function (Blueprint $table) {
            $table->id();
            $table->string('key');
            $table->longText('value')->nullable();
            $table->string('type')->default('string');
            $table->foreignId('group_id')->nullable()->constrained(config('settings.database.table_prefix') . 'settings_groups')->onDelete('set null');
            $table->nullableMorphs('owner');
            $table->boolean('is_encrypted')->default(false);
            $table->boolean('is_public')->default(true);
            $table->text('description')->nullable();
            $table->json('validation_rules')->nullable();
            $table->longText('default_value')->nullable();
            $table->integer('order')->default(0);
            $table->json('depends_on')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->unique(['key', 'owner_type', 'owner_id']);
            $table->index(['owner_type', 'owner_id']);
            $table->index(['key', 'type']);
            $table->index(['is_public']);
        });
    }

    public function down()
    {
        Schema::dropIfExists(config('settings.database.table_prefix') . 'settings');
    }
}
