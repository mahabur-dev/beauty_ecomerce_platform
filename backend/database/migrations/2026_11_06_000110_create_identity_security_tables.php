<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_mfa_settings', function (Blueprint $table): void {
            $table->foreignId('user_id')->primary()->constrained()->cascadeOnDelete();
            $table->text('secret');
            $table->timestamp('confirmed_at', 6)->nullable();
            $table->timestamp('last_used_at', 6)->nullable();
            $table->timestamp('recovery_codes_generated_at', 6)->nullable();
            $table->timestamps(6);
        });

        Schema::create('mfa_recovery_codes', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->char('code_hash', 64);
            $table->timestamp('used_at', 6)->nullable();
            $table->timestamp('created_at', 6)->useCurrent();
            $table->unique(['user_id', 'code_hash']);
            $table->index(['user_id', 'used_at']);
        });

        Schema::create('admin_invitations', function (Blueprint $table): void {
            $table->id();
            $table->string('email', 255);
            $table->foreignId('role_id')->constrained()->restrictOnDelete();
            $table->foreignId('vendor_id')->nullable()->constrained()->restrictOnDelete();
            $table->foreignId('invited_by_user_id')->constrained('users')->restrictOnDelete();
            $table->char('token_hash', 64)->unique();
            $table->timestamp('expires_at', 6);
            $table->timestamp('accepted_at', 6)->nullable();
            $table->timestamp('revoked_at', 6)->nullable();
            $table->timestamps(6);

            $table->index(['email', 'accepted_at', 'revoked_at']);
            $table->index('expires_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admin_invitations');
        Schema::dropIfExists('mfa_recovery_codes');
        Schema::dropIfExists('user_mfa_settings');
    }
};
