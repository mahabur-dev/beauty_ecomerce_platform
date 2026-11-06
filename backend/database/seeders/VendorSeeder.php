<?php

namespace Database\Seeders;

use App\Domain\Shared\Enums\RecordStatus;
use App\Domain\Vendor\Models\Vendor;
use Illuminate\Database\Seeder;

final class VendorSeeder extends Seeder
{
    public function run(): void
    {
        Vendor::query()->updateOrCreate(
            ['slug' => 'platform-store'],
            ['name' => 'Platform Store', 'status' => RecordStatus::Active],
        );
    }
}
