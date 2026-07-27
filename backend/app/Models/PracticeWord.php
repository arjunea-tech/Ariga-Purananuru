<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PracticeWord extends Model
{
    use HasFactory;

    protected $table = 'practice_words';

    protected $fillable = [
        'word',
    ];
}
