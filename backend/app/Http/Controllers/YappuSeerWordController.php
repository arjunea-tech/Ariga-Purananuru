<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use App\Models\YappuSeerWord;

class YappuSeerWordController extends Controller
{
    public function index()
    {
        // Cache the grouped result for 24 hours (86400 seconds)
        // This prevents the expensive DB query and collection grouping from running on every request
        $grouped = Cache::remember('yappu_seer_words_grouped', 86400, function () {
            // Use DB::table instead of Eloquent models to save massive amount of memory
            $words = DB::table('yappu_seer_words')
                ->select('word', 'hint', 'seer_name')
                ->get();
            
            // Group by seer_name for easy frontend consumption
            return $words->groupBy('seer_name')->map(function ($items) {
                return $items->map(function ($item) {
                    return [
                        'word' => $item->word,
                        'hint' => $item->hint
                    ];
                });
            });
        });

        return response()->json($grouped);
    }
}
