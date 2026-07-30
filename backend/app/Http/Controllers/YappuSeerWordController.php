<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\YappuSeerWord;

class YappuSeerWordController extends Controller
{
    public function index()
    {
        $words = YappuSeerWord::all();
        
        // Group by seer_name for easy frontend consumption
        $grouped = $words->groupBy('seer_name')->map(function ($items) {
            return $items->map(function ($item) {
                return [
                    'word' => $item->word,
                    'hint' => $item->hint
                ];
            });
        });

        return response()->json($grouped);
    }
}
