<?php

namespace App\Domain\Identity\Enums;

enum RoleCode: string
{
    case Customer = 'customer';
    case SuperAdmin = 'super_admin';
    case CatalogManager = 'catalog_manager';

    public function isAdministrative(): bool
    {
        return $this !== self::Customer;
    }
}
