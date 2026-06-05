<?php

namespace App\Http\Controllers;

use App\Models\Content;
use App\Models\ContentChunk;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AITutorController extends Controller
{
    public function chat(Request $request)
    {
        $validated = $request->validate([
            'content_id' => 'required|exists:contents,id',
            'course_id'  => 'nullable|integer',
            'message'    => 'required|string|max:1000',
        ]);

        $apiKey = env('GEMINI_API_KEY');
        if (!$apiKey) {
            return response()->json(['error' => 'LLM API Key not configured.'], 500);
        }

        $userMessage = $validated['message'];
        $courseContext = '';
        $questionEmbedding = $this->getEmbedding($userMessage, $apiKey);

        if ($questionEmbedding) {
            $courseId = $validated['course_id'] ?? null;
            if ($courseId) {
                $contentIds = \Illuminate\Support\Facades\DB::table('contents')
                    ->join('content_chapters', 'contents.id', '=', 'content_chapters.content_id')
                    ->join('level_chapter', 'content_chapters.chapter_id', '=', 'level_chapter.chapter_id')
                    ->join('course_package_levels', 'level_chapter.level_id', '=', 'course_package_levels.level_id')
                    ->where('course_package_levels.course_id', $courseId)
                    ->pluck('contents.id')
                    ->unique()
                    ->toArray();

                $allChunks = ContentChunk::whereIn('content_id', $contentIds)->get();
            } else {
                $allChunks = ContentChunk::where('content_id', $validated['content_id'])->get();
            }

            $scoredChunks = [];
            foreach ($allChunks as $chunk) {
                if ($chunk->embedding && is_array($chunk->embedding)) {
                    $score = $this->cosineSimilarity($questionEmbedding, $chunk->embedding);
                    if ($score > 0.4) { // Only consider somewhat relevant chunks
                        $scoredChunks[] = [
                            'score' => $score,
                            'text' => $chunk->chunk_text
                        ];
                    }
                }
            }

            usort($scoredChunks, function($a, $b) {
                return $b['score'] <=> $a['score'];
            });

            $topChunks = array_slice($scoredChunks, 0, 5);
            $contextTexts = array_map(function($c) { return $c['text']; }, $topChunks);
            $courseContext = implode("\n\n---\n\n", $contextTexts);
        }

        if (empty(trim($courseContext))) {
            $content = Content::findOrFail($validated['content_id']);
            $courseContext = strip_tags($content->text_content ?? $content->name ?? 'No text content available.');
        }

        // Construct the prompt
        $systemPrompt = "You are an AI Tutor for a student learning a course. Your goal is to answer the student's question based strictly on the provided lesson context chunks below. Be encouraging, clear, and concise. Do not hallucinate information outside the provided context. If the question is completely unrelated to the context, politely guide the student back to the topic.\n\n--- CONTEXT CHUNKS ---\n" . $courseContext . "\n----------------------\n";

        // Call Gemini API
        try {
            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
            ])->withoutVerifying()->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" . $apiKey, [
                'contents' => [
                    [
                        'role' => 'user',
                        'parts' => [
                            ['text' => $systemPrompt . "\nStudent Question: " . $userMessage]
                        ]
                    ]
                ]
            ]);

            if ($response->successful()) {
                $data = $response->json();
                $reply = $data['candidates'][0]['content']['parts'][0]['text'] ?? "I'm sorry, I couldn't generate a response.";
                return response()->json(['reply' => $reply]);
            }

            Log::error('Gemini API Error: ' . $response->body());
            return response()->json(['error' => 'Failed to connect to AI Tutor.'], 500);

        } catch (\Exception $e) {
            Log::error('AI Tutor Exception: ' . $e->getMessage());
            return response()->json(['error' => 'An error occurred while talking to AI Tutor.'], 500);
        }
    }

    public function generateQuiz(Request $request)
    {
        $validated = $request->validate([
            'content_id' => 'required|exists:contents,id',
        ]);

        $content = Content::findOrFail($validated['content_id']);
        $courseContext = $content->text_content ?? $content->name ?? '';

        if (empty(strip_tags($courseContext))) {
            return response()->json(['error' => 'Not enough content to generate a quiz.'], 400);
        }

        $apiKey = env('GEMINI_API_KEY');
        if (!$apiKey) {
            return response()->json(['error' => 'LLM API Key not configured.'], 500);
        }

        $systemPrompt = "You are an expert AI instructional designer. Based ONLY on the lesson content provided below, generate a 3-question multiple-choice practice quiz.\n"
            . "You MUST return ONLY a valid JSON array. Do not include markdown formatting like ```json or any other text.\n"
            . "The JSON format must strictly be:\n"
            . "[\n"
            . "  {\n"
            . "    \"question\": \"Question text here\",\n"
            . "    \"options\": [\n"
            . "      {\"text\": \"Option A\", \"isCorrect\": true},\n"
            . "      {\"text\": \"Option B\", \"isCorrect\": false},\n"
            . "      {\"text\": \"Option C\", \"isCorrect\": false},\n"
            . "      {\"text\": \"Option D\", \"isCorrect\": false}\n"
            . "    ],\n"
            . "    \"explanation\": \"Brief explanation of the correct answer.\"\n"
            . "  }\n"
            . "]\n\n"
            . "--- LESSON CONTENT ---\n" . strip_tags($courseContext) . "\n----------------------\n";

        try {
            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
            ])->withoutVerifying()->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" . $apiKey, [
                'contents' => [
                    [
                        'role' => 'user',
                        'parts' => [
                            ['text' => $systemPrompt]
                        ]
                    ]
                ],
                'generationConfig' => [
                    'temperature' => 0.2, // Low temperature for more factual responses
                    'responseMimeType' => 'application/json', // Force JSON response if supported
                ]
            ]);

            if ($response->successful()) {
                $data = $response->json();
                $reply = $data['candidates'][0]['content']['parts'][0]['text'] ?? "[]";
                
                // Sometimes the API wraps the JSON in markdown even with responseMimeType
                $reply = preg_replace('/^```json\s*/', '', $reply);
                $reply = preg_replace('/```$/', '', $reply);
                $reply = trim($reply);

                $quizData = json_decode($reply, true);

                if (json_last_error() !== JSON_ERROR_NONE) {
                    Log::error('Failed to parse AI Quiz JSON: ' . $reply);
                    return response()->json(['error' => 'Failed to generate a valid quiz format.'], 500);
                }

                return response()->json(['quiz' => $quizData]);
            }

            Log::error('Gemini API Error (Quiz): ' . $response->body());
            return response()->json(['error' => 'Failed to connect to AI for quiz generation.'], 500);

        } catch (\Exception $e) {
            Log::error('AI Quiz Exception: ' . $e->getMessage());
            return response()->json(['error' => 'An error occurred while generating the quiz.'], 500);
        }
    }

    private function getEmbedding($text, $apiKey)
    {
        try {
            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
            ])->withoutVerifying()->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent?key=" . $apiKey, [
                'model' => 'models/gemini-embedding-2',
                'content' => [
                    'parts' => [
                        ['text' => $text]
                    ]
                ]
            ]);
            
            if ($response->successful()) {
                $data = $response->json();
                return $data['embedding']['values'] ?? null;
            }
        } catch (\Exception $e) {
            Log::error('Embedding Exception: ' . $e->getMessage());
        }
        return null;
    }

    private function cosineSimilarity(array $vec1, array $vec2)
    {
        $dotProduct = 0.0;
        $normA = 0.0;
        $normB = 0.0;
        
        $count = count($vec1);
        if ($count !== count($vec2)) return 0.0;
        
        for ($i = 0; $i < $count; $i++) {
            $dotProduct += $vec1[$i] * $vec2[$i];
            $normA += pow($vec1[$i], 2);
            $normB += pow($vec2[$i], 2);
        }
        
        if ($normA == 0 || $normB == 0) return 0.0;
        
        return $dotProduct / (sqrt($normA) * sqrt($normB));
    }
}
