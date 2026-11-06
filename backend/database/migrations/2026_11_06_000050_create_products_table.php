<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('vendor_id')->constrained()->restrictOnDelete();
            $table->foreignId('brand_id')->nullable()->constrained()->restrictOnDelete();
            $table->foreignId('primary_category_id')->constrained('categories')->restrictOnDelete();
            $table->string('name', 220);
            $table->string('slug', 240)->unique();
            $table->longText('description');
            $table->string('short_description', 500)->nullable();
            $table->string('status', 20)->default('draft');
            $table->string('meta_title', 255)->nullable();
            $table->string('meta_description', 320)->nullable();
            $table->timestamps(6);
            $table->softDeletes('deleted_at', 6);

            $table->index(['vendor_id', 'status', 'created_at']);
            $table->index(['primary_category_id', 'status', 'created_at']);
            $table->index('brand_id');
        });

        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE products ADD CONSTRAINT products_status_check CHECK (status IN ('draft', 'active', 'inactive'))");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
