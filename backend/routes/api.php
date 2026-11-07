<?php

use App\Http\Controllers\Api\V1\Admin\AdminAuthController;
use App\Http\Controllers\Api\V1\Admin\AdminUserController;
use App\Http\Controllers\Api\V1\Admin\AttributeController;
use App\Http\Controllers\Api\V1\Admin\BrandController;
use App\Http\Controllers\Api\V1\Admin\CatalogOverviewController;
use App\Http\Controllers\Api\V1\Admin\CategoryController;
use App\Http\Controllers\Api\V1\Admin\InvitationController;
use App\Http\Controllers\Api\V1\Admin\ProductController;
use App\Http\Controllers\Api\V1\Admin\ProductImageController;
use App\Http\Controllers\Api\V1\Admin\ProductVariantController;
use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\Auth\EmailVerificationController;
use App\Http\Controllers\Api\V1\Auth\PasswordController;
use App\Http\Controllers\Api\V1\Catalog\GroupedCatalogController;
use App\Http\Controllers\Api\V1\Catalog\PublicCatalogMetadataController;
use App\Http\Controllers\Api\V1\Catalog\PublicCategoryController;
use App\Http\Controllers\Api\V1\Catalog\PublicProductController;
use App\Http\Controllers\Api\V1\HealthController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::get('/health', HealthController::class)
        ->name('api.v1.health');

    Route::get('/categories', [PublicCategoryController::class, 'index']);
    Route::get('/categories/{slug}', [PublicCategoryController::class, 'show']);
    Route::get('/categories/{slug}/subcategories', [PublicCategoryController::class, 'subcategories']);
    Route::get('/subcategories/{slug}', [PublicCategoryController::class, 'showSubcategory']);
    Route::get('/brands', [PublicCatalogMetadataController::class, 'brands']);
    Route::get('/brands/{slug}', [PublicCatalogMetadataController::class, 'brand']);
    Route::get('/products', [PublicProductController::class, 'index']);
    Route::get('/products/{slug}', [PublicProductController::class, 'show']);
    Route::get('/catalog/grouped', GroupedCatalogController::class);
    Route::get('/catalog/facets', [PublicCatalogMetadataController::class, 'facets']);

    Route::prefix('auth')->group(function (): void {
        Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:authentication');
        Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:authentication');
        Route::post('/forgot-password', [PasswordController::class, 'forgot'])->middleware('throttle:authentication');
        Route::post('/reset-password', [PasswordController::class, 'reset'])->middleware('throttle:authentication');

        Route::middleware('auth:sanctum')->group(function (): void {
            Route::get('/me', [AuthController::class, 'me']);
            Route::post('/logout', [AuthController::class, 'logout']);
            Route::post('/email/verification-notification', [EmailVerificationController::class, 'resend'])
                ->middleware('throttle:6,1');
            Route::get('/email/verify/{id}/{hash}', [EmailVerificationController::class, 'verify'])
                ->middleware(['signed', 'throttle:6,1'])
                ->name('verification.verify');
        });
    });

    Route::prefix('admin')->group(function (): void {
        Route::post('/invitations/accept', [InvitationController::class, 'accept'])
            ->middleware('throttle:identity-public');
        Route::post('/auth/login', [AdminAuthController::class, 'login'])
            ->middleware('throttle:authentication');

        Route::middleware(['admin.pending', 'throttle:admin-mfa'])->prefix('auth/mfa')->group(function (): void {
            Route::get('/setup', [AdminAuthController::class, 'setup']);
            Route::post('/confirm', [AdminAuthController::class, 'confirm']);
            Route::post('/challenge', [AdminAuthController::class, 'challenge']);
        });

        Route::middleware(['auth:sanctum', 'verified', 'admin', 'admin.mfa'])->group(function (): void {
            Route::get('/me', [AdminAuthController::class, 'me']);
            Route::post('/auth/logout', [AdminAuthController::class, 'logout']);
            Route::post('/auth/mfa/recovery-codes', [AdminUserController::class, 'regenerateRecoveryCodes'])
                ->middleware('throttle:identity-write');

            Route::middleware('throttle:catalog-read')->group(function (): void {
                Route::get('/categories', [CategoryController::class, 'indexRoots']);
                Route::get('/categories/{category}', [CategoryController::class, 'showRoot']);
                Route::get('/subcategories', [CategoryController::class, 'indexChildren']);
                Route::get('/subcategories/{subcategory}', [CategoryController::class, 'showChild']);
                Route::get('/brands', [BrandController::class, 'index']);
                Route::get('/brands/{brand}', [BrandController::class, 'show']);
                Route::get('/attributes', [AttributeController::class, 'index']);
                Route::get('/attributes/{attribute}', [AttributeController::class, 'show']);
                Route::get('/products', [ProductController::class, 'index']);
                Route::get('/products/{product}', [ProductController::class, 'show']);

                Route::get('/catalog/summary', [CatalogOverviewController::class, 'summary']);
                Route::get('/catalog/options', [CatalogOverviewController::class, 'options']);
            });

            Route::middleware('throttle:catalog-write')->group(function (): void {
                Route::post('/categories', [CategoryController::class, 'storeRoot']);
                Route::post('/categories/{category}/restore', [CategoryController::class, 'restoreRoot']);
                Route::patch('/categories/{category}', [CategoryController::class, 'updateRoot']);
                Route::delete('/categories/{category}', [CategoryController::class, 'destroyRoot']);

                Route::post('/subcategories', [CategoryController::class, 'storeChild']);
                Route::post('/subcategories/{subcategory}/restore', [CategoryController::class, 'restoreChild']);
                Route::patch('/subcategories/{subcategory}', [CategoryController::class, 'updateChild']);
                Route::delete('/subcategories/{subcategory}', [CategoryController::class, 'destroyChild']);

                Route::post('/products', [ProductController::class, 'store']);
                Route::post('/products/{product}/restore', [ProductController::class, 'restore']);
                Route::patch('/products/{product}', [ProductController::class, 'update']);
                Route::delete('/products/{product}', [ProductController::class, 'destroy']);

                Route::post('/products/{product}/variants', [ProductVariantController::class, 'store']);
                Route::patch('/products/{product}/variants/{variant}', [ProductVariantController::class, 'update']);
                Route::delete('/products/{product}/variants/{variant}', [ProductVariantController::class, 'destroy']);

                Route::post('/products/{product}/images', [ProductImageController::class, 'store']);
                Route::patch('/products/{product}/images/{image}', [ProductImageController::class, 'update']);
                Route::delete('/products/{product}/images/{image}', [ProductImageController::class, 'destroy']);
            });

            Route::middleware(['role:super_admin', 'throttle:identity-write'])->group(function (): void {
                Route::post('/invitations', [InvitationController::class, 'store']);
                Route::put('/users/{user}/administrative-role', [AdminUserController::class, 'setRole']);
                Route::delete('/users/{user}/mfa', [AdminUserController::class, 'resetMfa']);

                Route::get('/check', [CheckController::class, 'check']);
            });

            Route::middleware(['role:super_admin', 'throttle:catalog-write'])->group(function (): void {
                Route::post('/brands', [BrandController::class, 'store']);
                Route::post('/brands/{brand}/restore', [BrandController::class, 'restore']);
                Route::patch('/brands/{brand}', [BrandController::class, 'update']);
                Route::delete('/brands/{brand}', [BrandController::class, 'destroy']);

                Route::post('/attributes', [AttributeController::class, 'store']);
                Route::patch('/attributes/{attribute}', [AttributeController::class, 'update']);
                Route::delete('/attributes/{attribute}', [AttributeController::class, 'destroy']);
                Route::post('/attributes/{attribute}/values', [AttributeController::class, 'storeValue']);
                Route::patch('/attributes/{attribute}/values/{value}', [AttributeController::class, 'updateValue']);
                Route::delete('/attributes/{attribute}/values/{value}', [AttributeController::class, 'destroyValue']);
            });
        });
    });
});
