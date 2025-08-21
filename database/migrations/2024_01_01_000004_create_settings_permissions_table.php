<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateSettingsPermissionsTable extends Migration
{
    public function up()
    {
        Schema::create(config('settings.database.table_prefix') . 'permissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('setting_id')->constrained(config('settings.database.table_prefix') . 'settings')->onDelete('cascade');
            $table->nullableMorphs('grantee');
            $table->string('permission'); // 'view', 'edit', 'delete'
            $table->nullableMorphs('granted_by');
            $table->timestamps();

            $table->unique(['setting_id', 'grantee_type', 'grantee_id', 'permission'], 'settings_permissions_unique');
            $table->index(['grantee_type', 'grantee_id']);
        });
    }

    public function down()
    {
        Schema::dropIfExists(config('settings.database.table_prefix') . 'permissions');
    }
}
