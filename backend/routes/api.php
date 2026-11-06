<?php

use App\Http\Controllers\Api\V1\Admin\AdminAuthController;
use App\Http\Controllers\Api\V1\Admin\AdminUserController;
use App\Http\Controllers\Api\V1\Admin\InvitationController;
use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\Auth\EmailVerificationController;
use App\Http\Controllers\Api\V1\Auth\PasswordController;
use App\Http\Controllers\Api\V1\HealthController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::get('/health', HealthController::class)
        ->name('api.v1.health');

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

            Route::middleware(['role:super_admin', 'throttle:identity-write'])->group(function (): void {
                Route::post('/invitations', [InvitationController::class, 'store']);
                Route::put('/users/{user}/administrative-role', [AdminUserController::class, 'setRole']);
                Route::delete('/users/{user}/mfa', [AdminUserController::class, 'resetMfa']);
            });
        });
    });
});
