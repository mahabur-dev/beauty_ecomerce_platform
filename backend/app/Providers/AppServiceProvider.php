<?php

namespace App\Providers;

use App\Domain\Identity\Contracts\TotpAuthenticator;
use App\Domain\Identity\Services\OtpPhpTotpAuthenticator;
use App\Domain\Media\Contracts\MediaStorage;
use App\Domain\Review\Contracts\ReviewMediaStorage;
use App\Domain\Review\Models\ProductReview;
use App\Infrastructure\Media\CloudinaryMediaStorage;
use App\Infrastructure\Media\CloudinaryReviewMediaStorage;
use App\Policies\ProductReviewPolicy;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(TotpAuthenticator::class, OtpPhpTotpAuthenticator::class);
        $this->app->bind(MediaStorage::class, CloudinaryMediaStorage::class);
        $this->app->bind(ReviewMediaStorage::class, CloudinaryReviewMediaStorage::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Factory::guessFactoryNamesUsing(static function (string $modelName): string {
            $factoryClass = 'Database\\Factories\\'.class_basename($modelName).'Factory';

            /** @var class-string<Factory<Model>> $factoryClass */
            return $factoryClass;
        });

        Model::shouldBeStrict(! $this->app->isProduction());

        Gate::policy(ProductReview::class, ProductReviewPolicy::class);

        Password::defaults(fn () => Password::min(12)->letters()->mixedCase()->numbers()->symbols());

        RateLimiter::for('authentication', function (Request $request) {
            $email = mb_strtolower((string) $request->input('email'));

            return Limit::perMinute(5)
                ->by(hash('sha256', $email.'|'.$request->ip()));
        });

        RateLimiter::for('admin-mfa', fn (Request $request) => Limit::perMinute(10)->by(hash('sha256',
            (string) $request->session()->get((string) config('identity.pending_admin_session_key')).'|'.$request->ip(),
        ))
        );

        RateLimiter::for('identity-public', fn (Request $request) => Limit::perMinute(20)->by((string) $request->ip())
        );

        RateLimiter::for('identity-write', fn (Request $request) => Limit::perMinute(20)
            ->by((string) ($request->user()?->getAuthIdentifier() ?? $request->ip()))
        );

        RateLimiter::for('catalog-read', fn (Request $request) => Limit::perMinute(
            (int) config('catalog.rate_limits.read_per_minute'),
        )->by('catalog-read|'.($request->user()?->getAuthIdentifier() ?? $request->ip()))
        );

        RateLimiter::for('catalog-write', fn (Request $request) => Limit::perMinute(
            (int) config('catalog.rate_limits.write_per_minute'),
        )->by('catalog-write|'.($request->user()?->getAuthIdentifier() ?? $request->ip()))
        );

        RateLimiter::for('review-read', fn (Request $request) => Limit::perMinute(
            (int) config('reviews.rate_limits.read_per_minute', 120),
        )->by('review-read|'.($request->user()?->getAuthIdentifier() ?? $request->ip()))
        );

        RateLimiter::for('review-write', fn (Request $request) => Limit::perMinute(
            (int) config('reviews.rate_limits.write_per_minute', 20),
        )->by('review-write|'.($request->user()?->getAuthIdentifier() ?? $request->ip()))
        );

        RateLimiter::for('review-media', fn (Request $request) => Limit::perMinute(
            (int) config('reviews.rate_limits.media_per_minute', 10),
        )->by('review-media|'.($request->user()?->getAuthIdentifier() ?? $request->ip()))
        );
    }
}
