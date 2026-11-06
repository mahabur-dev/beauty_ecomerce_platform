<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_variants', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->string('sku', 80)->unique();
            $table->string('barcode', 100)->nullable()->unique();
            $table->string('title', 160);
            $table->decimal('price', 12, 2);
            $table->decimal('compare_at_price', 12, 2)->nullable();
            $table->decimal('cost_price', 12, 2)->nullable();
            $table->boolean('is_default')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps(6);

            $table->index(['product_id', 'is_active']);
        });

        if (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE product_variants ADD CONSTRAINT product_variants_price_check CHECK (price >= 0)');
            DB::statement('ALTER TABLE product_variants ADD CONSTRAINT product_variants_compare_price_check CHECK (compare_at_price IS NULL OR compare_at_price >= price)');
            DB::statement('ALTER TABLE product_variants ADD CONSTRAINT product_variants_cost_price_check CHECK (cost_price IS NULL OR cost_price >= 0)');
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('product_variants');
    }
};
