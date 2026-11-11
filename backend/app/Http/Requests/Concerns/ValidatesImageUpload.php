<?php

namespace App\Http\Requests\Concerns;

trait ValidatesImageUpload
{
    /**
     * Build shared validation rules for Cloudinary image uploads.
     *
     * @return list<string>
     */
    protected function imageUploadRules(bool $required = true): array
    {
        $maxKilobytes = (int) config('media.image_max_kilobytes', 10240);

        return [
            $required ? 'required' : 'nullable',
            'file',
            'image',
            'mimes:jpg,jpeg,png,webp,avif',
            'max:'.$maxKilobytes,
        ];
    }
}
