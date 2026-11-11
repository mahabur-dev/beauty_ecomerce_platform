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
        Schema::create('review_media', function (Blueprint $table) {
            $table->id();
            $table->foreignId('review_id')->constrained('product_reviews')->restrictOnDelete();
            $table->string('kind', 16);
            $table->string('provider', 30)->default('cloudinary');
            $table->string('storage_path', 500)->unique();
            $table->string('asset_id', 255)->unique();
            $table->string('resource_type', 20);
            $table->string('delivery_type', 30)->default('authenticated');
            $table->string('format', 20);
            $table->string('mime_type', 100);
            $table->unsignedBigInteger('bytes');
            $table->unsignedInteger('width')->nullable();
            $table->unsignedInteger('height')->nullable();
            $table->decimal('duration_seconds', 8, 3)->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->string('status', 20)->default('ready');
            $table->unsignedTinyInteger('video_slot')->nullable();
            $table->timestamps();
            $table->softDeletes('deleted_at', 6);

            $table->index(['review_id', 'status', 'sort_order']);
            $table->unique(['review_id', 'video_slot'], 'review_media_one_active_video');
        });

        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE review_media ADD CONSTRAINT review_media_kind_check CHECK (kind IN ('image', 'video'))");
            DB::statement("ALTER TABLE review_media ADD CONSTRAINT review_media_status_check CHECK (status IN ('ready', 'rejected'))");
            DB::statement('ALTER TABLE review_media ADD CONSTRAINT review_media_video_slot_check CHECK (video_slot IS NULL OR video_slot = 1)');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('review_media');
    }
};
