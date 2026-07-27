<?php

namespace App\Http\Controllers;

use App\Models\PracticeWord;
use Illuminate\Http\Request;

class PracticeWordController extends Controller
{
    public function index()
    {
        $words = PracticeWord::pluck('word');
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

        return response()->json($practiceWord, 201);
    }
}
