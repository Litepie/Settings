<?php

namespace Litepie\Settings\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Illuminate\Database\Eloquent\Model;
use Litepie\Settings\Services\SettingsService;
use Litepie\Settings\Http\Requests\StoreSettingRequest;
use Litepie\Settings\Http\Requests\UpdateSettingRequest;
use Litepie\Settings\Http\Resources\SettingResource;

class SettingController extends Controller
{
    public function __construct(
        protected SettingsService $settingsService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $owner = $this->resolveOwner($request);
        $group = $request->get('group');

        $settings = $group 
            ? $this->settingsService->getByGroup($group, $owner)
            : $this->settingsService->all($owner);

        return response()->json([
            'data' => SettingResource::collection($settings),
            'meta' => [
                'total' => $settings->count(),
            ],
        ]);
    }

    public function show(Request $request, string $key): JsonResponse
    {
        $owner = $this->resolveOwner($request);
        $value = $this->settingsService->get($key, null, $owner);

        if ($value === null && !$this->settingsService->has($key, $owner)) {
            return response()->json(['error' => 'Setting not found'], 404);
        }

        return response()->json([
            'key' => $key,
            'value' => $value,
        ]);
    }

    public function store(StoreSettingRequest $request): JsonResponse
    {
        $owner = $this->resolveOwner($request);
        
        $success = $this->settingsService->set(
            $request->get('key'),
            $request->get('value'),
            $owner,
            $request->only(['type', 'group_id', 'description', 'is_public'])
        );

        return response()->json([
            'success' => $success,
            'message' => $success ? 'Setting created successfully' : 'Failed to create setting',
        ], $success ? 201 : 400);
    }

    public function update(UpdateSettingRequest $request, string $key): JsonResponse
    {
        $owner = $this->resolveOwner($request);
        
        $success = $this->settingsService->set(
            $key,
            $request->get('value'),
            $owner,
            $request->only(['type', 'group_id', 'description', 'is_public'])
        );

        return response()->json([
            'success' => $success,
            'message' => $success ? 'Setting updated successfully' : 'Failed to update setting',
        ]);
    }

    public function destroy(Request $request, string $key): JsonResponse
    {
        $owner = $this->resolveOwner($request);
        $success = $this->settingsService->forget($key, $owner);

        return response()->json([
            'success' => $success,
            'message' => $success ? 'Setting deleted successfully' : 'Failed to delete setting',
        ]);
    }

    public function bulk(Request $request): JsonResponse
    {
        $owner = $this->resolveOwner($request);
        $settings = $request->get('settings', []);

        $success = $this->settingsService->setMultiple($settings, $owner);

        return response()->json([
            'success' => $success,
            'message' => $success ? 'Settings updated successfully' : 'Failed to update some settings',
        ]);
    }

    protected function resolveOwner(Request $request): ?Model
    {
        $ownerType = $request->get('owner_type');
        $ownerId = $request->get('owner_id');

        if ($ownerType && $ownerId && class_exists($ownerType)) {
            return $ownerType::find($ownerId);
        }

        return null;
    }
}
