<?php

namespace App\Http\Requests\Concerns;

trait NormalizesBooleanQuery
{
    protected function normalizeBooleanField(string $field): void
    {
        if (! $this->has($field) || is_bool($this->input($field))) {
            return;
        }

        $value = $this->input($field);
        if (is_string($value)) {
            $parsed = filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            if ($parsed !== null) {
                $this->merge([$field => $parsed]);
            }
        }
    }
}
