<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('categories', function (Blueprint $table): void {
            $table->string('image_storage_disk', 30)->nullable()->after('sort_order');
            $table->string('image_storage_path', 500)->nullable()->unique()->after('image_storage_disk');
            $table->string('image_asset_id', 255)->nullable()->unique()->after('image_storage_path');
            $table->string('image_resource_type', 20)->nullable()->after('image_asset_id');
            $table->string('image_delivery_type', 30)->nullable()->after('image_resource_type');
            $table->string('image_url', 1000)->nullable()->after('image_delivery_type');
            $table->string('image_format', 20)->nullable()->after('image_url');
            $table->unsignedBigInteger('image_bytes')->nullable()->after('image_format');
            $table->unsignedInteger('image_width')->nullable()->after('image_bytes');
            $table->unsignedInteger('image_height')->nullable()->after('image_width');
        });
    }

    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table): void {
            $table->dropUnique(['image_storage_path']);
            $table->dropUnique(['image_asset_id']);
            $table->dropColumn([
                'image_storage_disk',
                'image_storage_path',
                'image_asset_id',
                'image_resource_type',
                'image_delivery_type',
                'image_url',
                'image_format',
                'image_bytes',
                'image_width',
                'image_height',
            ]);
        });
    }
};
