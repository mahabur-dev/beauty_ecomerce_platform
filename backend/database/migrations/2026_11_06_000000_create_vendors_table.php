<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vendors', function (Blueprint $table): void {
            $table->id();
            $table->string('name', 160);
            $table->string('slug', 180)->unique();
            $table->string('status', 20)->default('active');
            $table->timestamps(6);
            $table->softDeletes('deleted_at', 6);
        });

        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE vendors ADD CONSTRAINT vendors_status_check CHECK (status IN ('active', 'inactive'))");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('vendors');
    }
};
