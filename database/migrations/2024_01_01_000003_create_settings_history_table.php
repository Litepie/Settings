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
        Schema::create(config('settings.database.table_prefix') . 'history', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('setting_id')->constrained(config('settings.database.table_prefix') . 'settings')->onDelete('cascade');
            $table->longText('old_value')->nullable();
            $table->longText('new_value')->nullable();
            // Changed by (polymorphic) - explicitly defined to avoid naming conflicts
            $table->unsignedBigInteger('changed_by_id')->nullable();
            $table->string('changed_by_type')->nullable();
            
            $table->string('ip_address')->nullable();
            $table->text('user_agent')->nullable();
            $table->string('change_reason')->nullable();
            $table->timestamps();

            // Explicit indexes with globally unique names
            $table->index(['setting_id', 'created_at'], 'settings_history_setting_created_idx');
            $table->index(['changed_by_type', 'changed_by_id'], 'settings_history_changed_by_morph_idx');
            $table->index('ip_address', 'settings_history_ip_address_idx');
            $table->index('change_reason', 'settings_history_change_reason_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists(config('settings.database.table_prefix') . 'history');
    }
};
