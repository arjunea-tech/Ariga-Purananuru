<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Announcement extends Model
{
    protected $fillable = [
        'tenant_id',
        'title',
        'message',
        'target_roles',
        'created_by'
    ];

    protected $casts = [
        'target_roles' => 'array',
    ];
}
