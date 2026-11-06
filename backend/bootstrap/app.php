<?php

use App\Http\Middleware\AssignRequestId;
use App\Http\Responses\ProblemDetailsResponseFactory;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->statefulApi();
        $middleware->append(AssignRequestId::class);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        $exceptions->render(function (ValidationException $exception, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }

            return app(ProblemDetailsResponseFactory::class)->make(
                request: $request,
                status: Response::HTTP_UNPROCESSABLE_ENTITY,
                title: 'Validation failed',
                detail: 'One or more fields contain invalid data.',
                extensions: ['errors' => $exception->errors()],
            );
        });

        $exceptions->render(function (AuthenticationException $exception, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }

            return app(ProblemDetailsResponseFactory::class)->make(
                request: $request,
                status: Response::HTTP_UNAUTHORIZED,
                title: 'Unauthenticated',
                detail: 'Authentication is required to access this resource.',
            );
        });

        $exceptions->render(function (AuthorizationException $exception, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }

            return app(ProblemDetailsResponseFactory::class)->make(
                request: $request,
                status: Response::HTTP_FORBIDDEN,
                title: 'Forbidden',
                detail: 'You are not authorized to perform this action.',
            );
        });

        $exceptions->render(function (HttpExceptionInterface $exception, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }

            $status = $exception->getStatusCode();
            $title = Response::$statusTexts[$status] ?? 'Request failed';
            $detail = $exception->getMessage() !== ''
                ? $exception->getMessage()
                : $title;

            return app(ProblemDetailsResponseFactory::class)->make(
                request: $request,
                status: $status,
                title: $title,
                detail: $detail,
            );
        });
    })->create();
