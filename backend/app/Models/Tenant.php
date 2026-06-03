<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Tenant extends Model
{
    protected $fillable = [
        'tenant_code',
        'tenant_name',
        'contact_person',
        'email',
        'phone',
        'address',
        'is_active',
        'logo_path',
        'primary_color',
        'secondary_color',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function properties(): HasMany
    {
        return $this->hasMany(Property::class);
    }
}
