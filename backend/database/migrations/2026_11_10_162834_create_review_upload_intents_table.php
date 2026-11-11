<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('review_upload_intents', function (Blueprint $table) {
            $table->id();
            $table->uuid('token')->unique();
            $table->foreignId('review_id')->constrained('product_reviews')->restrictOnDelete();
            $table->foreignId('user_id')->constrained()->restrictOnDelete();
            $table->string('provider', 30)->default('cloudinary');
            $table->string('provider_asset_key', 500)->unique();
            $table->string('kind', 16);
            $table->string('status', 20)->default('pending');
            $table->timestamp('expires_at', 6);
            $table->timestamp('finalized_at', 6)->nullable();
            $table->timestamps();

            $table->index(['review_id', 'status', 'expires_at']);
            $table->index(['user_id', 'status', 'expires_at']);
        });

        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE review_upload_intents ADD CONSTRAINT review_upload_intents_kind_check CHECK (kind IN ('image', 'video'))");
            DB::statement("ALTER TABLE review_upload_intents ADD CONSTRAINT review_upload_intents_status_check CHECK (status IN ('pending', 'finalized', 'expired', 'cancelled'))");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('review_upload_intents');
    }
};
