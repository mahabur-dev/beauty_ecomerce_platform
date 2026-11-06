<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attributes', function (Blueprint $table): void {
            $table->id();
            $table->string('code', 80)->unique();
            $table->string('name', 100);
            $table->timestamps(6);
        });

        Schema::create('attribute_values', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('attribute_id')->constrained()->restrictOnDelete();
            $table->string('value', 120);
            $table->string('code', 100);
            $table->timestamps(6);
            $table->unique(['attribute_id', 'code']);
        });

        Schema::create('variant_attribute_values', function (Blueprint $table): void {
            $table->foreignId('variant_id')->constrained('product_variants')->cascadeOnDelete();
            $table->foreignId('attribute_value_id')->constrained()->restrictOnDelete();
            $table->primary(['variant_id', 'attribute_value_id']);
            $table->index(['attribute_value_id', 'variant_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('variant_attribute_values');
        Schema::dropIfExists('attribute_values');
        Schema::dropIfExists('attributes');
    }
};
