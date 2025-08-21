<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateSettingsTemplatesTable extends Migration
{
    public function up()
    {
        Schema::create(config('settings.database.table_prefix') . 'templates', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('category')->default('general');
            $table->json('settings_data');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['category', 'is_active']);
        });
    }

    public function down()
    {
        Schema::dropIfExists(config('settings.database.table_prefix') . 'templates');
    }
}
