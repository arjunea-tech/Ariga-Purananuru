<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContentAttachment extends Model
{
    protected $fillable = [
        'content_id',
        'unique_id',
        'original_name',
        'alias_name',
        'file_size',
        'file_extension',
        'uploaded_by',
        'is_deleted',
        'deleted_by'
    ];

    protected $appends = ['url'];

    public function getUrlAttribute()
    {
        if (!$this->unique_id) return null;
        
        // If unique_id is already a full Cloudinary URL, return it directly
        if (str_starts_with($this->unique_id, 'http')) {
            return $this->unique_id;
        }
        
        $extension = strtolower($this->file_extension);
        $folder = match(true) {
            in_array($extension, ['jpg','jpeg','png','gif','webp','svg']) => 'images',
            in_array($extension, ['mp4','mov','avi','mkv','webm'])        => 'videos',
            $extension === 'pdf'                                          => 'pdfs',
            in_array($extension, ['doc','docx'])                          => 'docs',
            in_array($extension, ['xls','xlsx'])                          => 'xlsx',
            in_array($extension, ['ppt','pptx'])                          => 'ppts',
            default                                                       => 'files',
        };

        return \Illuminate\Support\Facades\Storage::disk('public')->url("contents/{$folder}/{$this->unique_id}");
    }

    public function content()
    {
        return $this->belongsTo(Content::class);
    }
}
