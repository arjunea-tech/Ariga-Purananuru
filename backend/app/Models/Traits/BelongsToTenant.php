<?php

namespace App\Models\Traits;

use App\Models\Tenant;
use Illuminate\Database\Eloquent\Builder;

trait BelongsToTenant
{
    /**
     * Boot the trait to attach scoping and creating hooks.
     */
    protected static function bootBelongsToTenant(): void
    {
        // Automatically inject tenant_id when creating new records
        static::creating(function ($model) {
            if (app()->bound('active_tenant')) {
                $model->tenant_id = app('active_tenant')->id;
            }
        });

        // Automatically filter queries by the active tenant
        static::addGlobalScope('tenant_scope', function (Builder $builder) {
            if (app()->bound('active_tenant')) {
                // If a super admin is logged in, bypass the scoping so they can see all records globally
                if (auth()->check() && auth()->user()->role === 'super_admin') {
                    return;
                }
                
                $builder->where('tenant_id', app('active_tenant')->id);
            }
        });
    }

    /**
     * Relationship with Tenant.
     */
    public function tenant(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
