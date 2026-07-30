<?php

namespace App\Http\Controllers;

use App\Models\PracticeWord;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;

class PracticeWordController extends Controller
{
    public function index()
    {
        // Cache for 24 hours (86400 seconds)
        $words = Cache::remember('practice_words_list', 86400, function () {
            // Use DB::table instead of Eloquent to save memory when fetching all words
            return DB::table('practice_words')->pluck('word');
        });
        
        return response()->json($words);
    }

    public function getRandom()
    {
        $randomWord = PracticeWord::inRandomOrder()->first();
        return response()->json([
            'word' => $randomWord ? $randomWord->word : 'அகழ்வாரைத்'
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'word' => 'required|string|unique:practice_words,word',
        ]);

        $practiceWord = PracticeWord::create([
            'word' => trim($request->word),
        ]);

        // Clear the cache since a new word was added
        Cache::forget('practice_words_list');

        return response()->json($practiceWord, 201);
    }
}
