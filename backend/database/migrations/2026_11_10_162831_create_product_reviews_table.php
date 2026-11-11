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
        Schema::create('product_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->restrictOnDelete();
            $table->foreignId('user_id')->constrained()->restrictOnDelete();
            $table->foreignId('vendor_id')->constrained()->restrictOnDelete();
            $table->unsignedTinyInteger('rating');
            $table->string('title', 120)->nullable();
            $table->text('body')->nullable();
            $table->string('status', 24)->default('pending');
            $table->boolean('verified_purchase')->default(false);
            $table->timestamp('submitted_at', 6)->useCurrent();
            $table->timestamp('published_at', 6)->nullable();
            $table->foreignId('moderated_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('moderated_at', 6)->nullable();
            $table->string('moderation_reason', 500)->nullable();
            $table->unsignedInteger('lock_version')->default(1);
            $table->unsignedTinyInteger('active_slot')->nullable()->default(1);
            $table->timestamps();
            $table->softDeletes('deleted_at', 6);

            $table->unique(['product_id', 'user_id', 'active_slot'], 'reviews_one_active_per_customer_product');
            $table->index(['product_id', 'status', 'published_at']);
            $table->index(['user_id', 'status', 'updated_at']);
            $table->index(['vendor_id', 'status', 'created_at']);
        });

        if (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE product_reviews ADD CONSTRAINT product_reviews_rating_check CHECK (rating BETWEEN 1 AND 5)');
            DB::statement("ALTER TABLE product_reviews ADD CONSTRAINT product_reviews_status_check CHECK (status IN ('pending', 'approved', 'rejected', 'hidden'))");
            DB::statement('ALTER TABLE product_reviews ADD CONSTRAINT product_reviews_active_slot_check CHECK (active_slot IS NULL OR active_slot = 1)');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_reviews');
    }
};
