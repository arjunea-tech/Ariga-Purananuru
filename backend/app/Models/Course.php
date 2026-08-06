<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Course extends Model
{
    protected $fillable = [
        'name',
        'description',
        'is_active',
        'price',
        'original_price',
        'cover_image',
        'tags',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'tags' => 'array',
    ];

    /**
     * Auto-generate course code before creating.
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($course) {
            if (empty($course->code)) {
                $last = static::orderBy('id', 'desc')->first();
                $nextId = $last ? $last->id + 1 : 1;
                $course->code = 'CRS-' . str_pad($nextId, 5, '0', STR_PAD_LEFT);
            }
        });
    }

    public function levels(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(Level::class, 'course_package_levels')
            ->withPivot(['package_id', 'is_mandatory', 'is_active'])
            ->withTimestamps();
    }
}
