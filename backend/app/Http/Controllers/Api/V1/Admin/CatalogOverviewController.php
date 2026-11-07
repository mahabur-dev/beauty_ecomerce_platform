<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Domain\Catalog\Queries\AdminCatalogOverview;
use App\Domain\Identity\Models\User;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\BrandResource;
use App\Http\Resources\Api\V1\CategoryResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class CatalogOverviewController extends Controller
{
    public function summary(Request $request, AdminCatalogOverview $overview): JsonResponse
    {
        /** @var User $actor */
        $actor = $request->user();

        return response()->json(['data' => $overview->summary($actor)]);
    }

    public function options(Request $request, AdminCatalogOverview $overview): JsonResponse
    {
        $options = $overview->options();

        return response()->json(['data' => [
            'categories' => CategoryResource::collection($options['categories'])->resolve($request),
            'subcategories' => CategoryResource::collection($options['subcategories'])->resolve($request),
            'brands' => BrandResource::collection($options['brands'])->resolve($request),
        ]]);
    }
}
