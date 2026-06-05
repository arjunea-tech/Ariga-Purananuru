<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Content extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'title',
        'sort_order',
        'is_active',
        'text_content',
        'external_url',
    ];

    protected $casts = [
        'is_active'    => 'boolean',
        'sort_order'   => 'integer',
        'external_url' => 'array',
    ];

    protected $appends = ['urls'];

    public function getUrlsAttribute(): array { return $this->external_url ?? []; }

    public function chapters(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(Chapter::class, 'content_chapters');
    }

    public function attachments(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(ContentAttachment::class)->where('is_deleted', false);
    }

    public function chunks(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(ContentChunk::class);
    }
}