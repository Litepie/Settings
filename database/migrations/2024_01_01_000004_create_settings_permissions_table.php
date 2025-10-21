<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create(config('settings.database.table_prefix') . 'permissions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('setting_id')->constrained(config('settings.database.table_prefix') . 'settings')->onDelete('cascade');
            
            // Grantee (polymorphic) - explicitly defined to avoid naming conflicts
            $table->unsignedBigInteger('grantee_id')->nullable();
            $table->string('grantee_type')->nullable();
            
            $table->string('permission'); // 'view', 'edit', 'delete'
            
            // Granted by (polymorphic) - explicitly defined to avoid naming conflicts
            $table->unsignedBigInteger('granted_by_id')->nullable();
            $table->string('granted_by_type')->nullable();
            
            $table->timestamps();

            // Explicit indexes with globally unique names
            $table->unique(['setting_id', 'grantee_type', 'grantee_id', 'permission'], 'settings_permissions_unique_idx');
            $table->index(['grantee_type', 'grantee_id'], 'settings_permissions_grantee_morph_idx');
            $table->index(['granted_by_type', 'granted_by_id'], 'settings_permissions_granted_by_morph_idx');
            $table->index('permission', 'settings_permissions_permission_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists(config('settings.database.table_prefix') . 'permissions');
    }
};
