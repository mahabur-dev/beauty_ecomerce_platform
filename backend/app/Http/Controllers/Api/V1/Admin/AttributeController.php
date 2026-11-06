<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Domain\Catalog\Actions\ManageAttributes;
use App\Domain\Catalog\Models\Attribute;
use App\Domain\Catalog\Models\AttributeValue;
use App\Domain\Identity\Models\User;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\Catalog\IndexCatalogEntitiesRequest;
use App\Http\Requests\Api\V1\Admin\Catalog\StoreAttributeRequest;
use App\Http\Requests\Api\V1\Admin\Catalog\StoreAttributeValueRequest;
use App\Http\Requests\Api\V1\Admin\Catalog\UpdateAttributeRequest;
use App\Http\Requests\Api\V1\Admin\Catalog\UpdateAttributeValueRequest;
use App\Http\Resources\Api\V1\AttributeResource;
use App\Http\Resources\Api\V1\AttributeValueResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

final class AttributeController extends Controller
{
    public function index(IndexCatalogEntitiesRequest $request): AnonymousResourceCollection
    {
        $query = Attribute::query()->with('values');
        if ($request->filled('search')) {
            $search = $request->string('search')->toString();
            $query->where(fn ($builder) => $builder
                ->where('name', 'like', "%{$search}%")
                ->orWhere('code', 'like', "%{$search}%"));
        }

        return AttributeResource::collection(
            $query->orderBy('name')->paginate($request->integer('per_page', 100)),
        );
    }

    public function store(StoreAttributeRequest $request, ManageAttributes $manager): JsonResponse
    {
        /** @var User $actor */
        $actor = $request->user();
        /** @var array{code: string, name: string} $data */
        $data = $request->validated();

        return (new AttributeResource($manager->create($actor, $data, $request->ip())->load('values')))
            ->response()->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(Attribute $attribute): AttributeResource
    {
        return new AttributeResource($attribute->load('values'));
    }

    public function update(UpdateAttributeRequest $request, Attribute $attribute, ManageAttributes $manager): AttributeResource
    {
        /** @var User $actor */
        $actor = $request->user();
        /** @var array{code?: string, name?: string} $data */
        $data = $request->validated();

        return new AttributeResource($manager->update($actor, $attribute, $data, $request->ip())->load('values'));
    }

    public function destroy(IndexCatalogEntitiesRequest $request, Attribute $attribute, ManageAttributes $manager): Response
    {
        /** @var User $actor */
        $actor = $request->user();
        $manager->delete($actor, $attribute, $request->ip());

        return response()->noContent();
    }

    public function storeValue(
        StoreAttributeValueRequest $request,
        Attribute $attribute,
        ManageAttributes $manager,
    ): JsonResponse {
        /** @var User $actor */
        $actor = $request->user();
        /** @var array{code: string, value: string} $data */
        $data = $request->validated();

        return (new AttributeValueResource($manager->createValue($actor, $attribute, $data, $request->ip())))
            ->response()->setStatusCode(Response::HTTP_CREATED);
    }

    public function updateValue(
        UpdateAttributeValueRequest $request,
        Attribute $attribute,
        AttributeValue $value,
        ManageAttributes $manager,
    ): AttributeValueResource {
        /** @var User $actor */
        $actor = $request->user();
        /** @var array{code?: string, value?: string} $data */
        $data = $request->validated();

        return new AttributeValueResource($manager->updateValue($actor, $attribute, $value, $data, $request->ip()));
    }

    public function destroyValue(
        IndexCatalogEntitiesRequest $request,
        Attribute $attribute,
        AttributeValue $value,
        ManageAttributes $manager,
    ): Response {
        /** @var User $actor */
        $actor = $request->user();
        $manager->deleteValue($actor, $attribute, $value, $request->ip());

        return response()->noContent();
    }
}
