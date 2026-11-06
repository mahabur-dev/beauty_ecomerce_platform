<?php

namespace App\Http\Requests\Concerns;

use Illuminate\Support\Str;

trait NormalizesSlug
{
    protected function normalizeSlugFromName(): void
    {
        if ($this->filled('slug')) {
            $this->merge(['slug' => Str::slug($this->string('slug')->toString())]);

            return;
        }

        if ($this->filled('name')) {
            $this->merge(['slug' => Str::slug($this->string('name')->toString())]);
        }
    }
}
