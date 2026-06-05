<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContentChunk extends Model
{
    protected $fillable = [
        'content_id',
        'chunk_index',
        'chunk_text',
        'embedding',
    ];

    protected $casts = [
        'embedding' => 'array',
    ];

    public function content()
    {
        return $this->belongsTo(Content::class);
    }
}
