<?php

return [
    'driver' => env('MEDIA_DRIVER', 'cloudinary'),
    'cloudinary_url' => env('CLOUDINARY_URL'),
    'folder' => trim((string) env('CLOUDINARY_FOLDER', 'beauty-commerce/local'), '/'),
    'image_max_kilobytes' => (int) env('PRODUCT_IMAGE_MAX_KILOBYTES', 10240),
];
