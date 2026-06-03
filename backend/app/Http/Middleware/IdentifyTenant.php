<?php

namespace App\Http\Middleware;

use Closure;
use App\Models\Tenant;
use Illuminate\Http\Request;

class IdentifyTenant
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next)
    {
        $tenantCode = $request->header('X-Tenant-Code');

        if ($tenantCode) {
            $tenant = Tenant::where('tenant_code', $tenantCode)
                            ->where('is_active', true)
                            ->first();

            if (!$tenant) {
                return response()->json(['error' => 'Invalid or inactive tenant.'], 403);
            }

            // Bind the active tenant into Laravel's service container
            app()->instance('active_tenant', $tenant);
        }

        return $next($request);
    }
}
