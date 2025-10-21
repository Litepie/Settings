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
        Schema::create(config('settings.database.table_prefix') . 'settings', function (Blueprint $table): void {
            $table->id();
            $table->string('key');
            $table->longText('value')->nullable();
            $table->string('type')->default('string');
            $table->foreignId('group_id')->nullable()->constrained(config('settings.database.table_prefix') . 'settings_groups')->onDelete('set null');
            
            // Owner (polymorphic) - explicitly defined to avoid naming conflicts
            $table->unsignedBigInteger('owner_id')->nullable();
            $table->string('owner_type')->nullable();
            
            $table->boolean('is_encrypted')->default(false);
            $table->boolean('is_public')->default(true);
            $table->text('description')->nullable();
            $table->json('validation_rules')->nullable();
            $table->longText('default_value')->nullable();
            $table->integer('order')->default(0);
            $table->json('depends_on')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            // Explicit indexes with globally unique names
            $table->unique(['key', 'owner_type', 'owner_id'], 'settings_key_owner_unique_idx');
            $table->index(['owner_type', 'owner_id'], 'settings_owner_morph_idx');
            $table->index(['key', 'type'], 'settings_key_type_idx');
            $table->index('is_public', 'settings_is_public_idx');
            $table->index('key', 'settings_key_idx');
            $table->index('type', 'settings_type_idx');
            $table->index('is_encrypted', 'settings_is_encrypted_idx');
            $table->index('order', 'settings_order_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists(config('settings.database.table_prefix') . 'settings');
    }
};
