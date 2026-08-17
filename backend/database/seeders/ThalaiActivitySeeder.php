<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Chapter;
use App\Models\Content;

class ThalaiActivitySeeder extends Seeder
{
    public function run(): void
    {
        // ==========================================
        // SEED THALAI (தளை பாடங்கள் & பயிற்சிகள்)
        // ==========================================

        // 1. Seed Chapter 1 Reading Content (தளை அறிமுகம் & விதிகள்)
        $c1 = Chapter::where('name', 'LIKE', '%தளை அறிமுகம் & விதிகள்%')->first();
        if ($c1) {
            $c1Blocks = [
                ['type' => 'paragraph', 'data' => ['text' => '<h2 class="text-primary text-center mb-4">தளை அறிமுகம் & விதிகள்</h2><p class="fs-5">செய்யுளில் நின்ற சீரின் ஈற்றசையும் வரும் சீரின் முதலசையும் ஒன்றியும் ஒன்றாமலும் தளைகள் பிறக்கும். நின்ற சீரின் இறுதி அசையையும் வரும் சீரின் முதல் அசையையும் பிணைப்பது <strong>தளை</strong> எனப்படும்.</p><h4 class="text-success mt-4">தளை காண்பதற்கான விதிகள்:</h4><ul class="fs-5"><li>தளை இடுவதற்கு முன் செய்யுளில் அனைத்து அசைகளும் சீர்களும் குறிக்கப்பட வேண்டும்.</li><li>முதற்சீரினை (நின்ற சீர்) அடுத்த சீரின் (வரும் சீர்) முதல் அசையுடன் சேர்த்துத் தளை கண்டறிய வேண்டும்.</li></ul>']],
                ['type' => 'practice', 'data' => ['topic' => 'thalai', 'word' => 'தளை']]
            ];

            $c1Content = Content::updateOrCreate(
                ['title' => 'தளை அறிமுகம் & விதிகள் பாடம்'],
                [
                    'name' => 'தளை அறிமுகம் & விதிகள் பாடம்',
                    'text_content' => json_encode(['blocks' => $c1Blocks], JSON_UNESCAPED_UNICODE),
                    'is_active' => true,
                ]
            );

            DB::table('content_chapters')->updateOrInsert(
                ['chapter_id' => $c1->id, 'content_id' => $c1Content->id]
            );
        }

        // 2. Seed Chapter 2 Reading Content (தளையின் வாய்பாடுகள்)
        $c2 = Chapter::where('name', 'LIKE', '%தளையின் வாய்பாடுகள்%')->first();
        if ($c2) {
            $c2Blocks = [
                ['type' => 'paragraph', 'data' => ['text' => '<h2 class="text-primary text-center mb-4">தளையின் வாய்பாடுகள்</h2><p class="fs-5">தளைகள் மொத்தம் <strong>7</strong> வகைப்படும். அவை ஒன்றிய தளைகள் (4) மற்றும் ஒன்றாத தளைகள் (3) எனப் பிரிக்கப்படுகின்றன.</p><h4 class="text-success mt-4">ஒன்றிய தளைகள் (4):</h4><div class="table-responsive mb-4"><table class="table table-bordered table-striped text-center align-middle" style="font-size: 0.95rem;"><thead class="bg-light fw-bold text-dark"><tr><th>எண்</th><th>விதி (நின்ற சீரின் ஈறு + வரும் சீரின் முதல்)</th><th>தளையின் பெயர்</th></tr></thead><tbody><tr><td>1</td><td class="fw-bold">மா முன் நேர்</td><td>நேரொன்று ஆசிரியத்தளை</td></tr><tr><td>2</td><td class="fw-bold">விளம் முன் நிரை</td><td>நிரையொன்று ஆசிரியத்தளை</td></tr><tr><td>3</td><td class="fw-bold">காய் முன் நேர்</td><td>வெண்சீர் வெண்டளை</td></tr><tr><td>4</td><td class="fw-bold">கனி முன் நிரை</td><td>ஒன்றிய வஞ்சித்தளை</td></tr></tbody></table></div><h4 class="text-danger mt-4">ஒன்றாத தளைகள் (3):</h4><div class="table-responsive"><table class="table table-bordered table-striped text-center align-middle" style="font-size: 0.95rem;"><thead class="bg-light fw-bold text-dark"><tr><th>எண்</th><th>விதி (நின்ற சீரின் ஈறு + வரும் சீரின் முதல்)</th><th>தளையின் பெயர்</th></tr></thead><tbody><tr><td>1</td><td class="fw-bold">மா முன் நிரை <br> விளம் முன் நேர்</td><td>இயற்சீர் வெண்டளை</td></tr><tr><td>2</td><td class="fw-bold">காய் முன் நிரை</td><td>கலித்தளை</td></tr><tr><td>3</td><td class="fw-bold">கனி முன் நேர்</td><td>ஒன்றாத வஞ்சித்தளை</td></tr></tbody></table></div>']],
                ['type' => 'practice', 'data' => ['topic' => 'thalai', 'word' => 'இயற்சீர் வெண்டளை']]
            ];

            $c2Content = Content::updateOrCreate(
                ['title' => 'தளையின் வாய்பாடுகள் பாடம்'],
                [
                    'name' => 'தளையின் வாய்பாடுகள் பாடம்',
                    'text_content' => json_encode(['blocks' => $c2Blocks], JSON_UNESCAPED_UNICODE),
                    'is_active' => true,
                ]
            );

            DB::table('content_chapters')->updateOrInsert(
                ['chapter_id' => $c2->id, 'content_id' => $c2Content->id]
            );
        }

        // 3. Seed Chapter 3 Reading Content (சான்றுடன் தளை கண்டறிதல்)
        $c3 = Chapter::where('name', 'LIKE', '%சான்றுடன் தளை கண்டறிதல்%')->first();
        if ($c3) {
            $c3Blocks = [
                ['type' => 'paragraph', 'data' => ['text' => '<h2 class="text-primary text-center mb-4">சான்றுடன் தளை கண்டறிதல்</h2><p class="fs-5 text-center fw-bold">"எனைத்தாணும் நல்லவை கேட்க அனைத்தாணும் ஆன்ற பெருமை தரும்"</p><div class="table-responsive"><table class="table table-bordered text-center align-middle" style="font-size: 0.85rem;"><thead class="bg-dark text-white fw-bold"><tr><th>சீர் எண்</th><th>சொல்</th><th>அசைப் பிரிப்பு</th><th>வாய்பாடு</th><th>தளை விதி & தளைப் பெயர் (இணைப்புச் சீர்கள்)</th></tr></thead><tbody><tr><td>1</td><td class="fw-bold">எனைத்தாணும்</td><td>எனைத் / தா / னும் <br> (நிரை / நேர் / நேர்)</td><td>புளிமாங்காய்</td><td rowspan="2" class="text-start bg-light align-middle"><strong>(1 & 2): காய் முன் நேர்</strong><br>➔ வெண்சீர் வெண்டளை</td></tr><tr><td>2</td><td class="fw-bold">நல்லவை</td><td>நல் / லவை <br> (நேர் / நிரை)</td><td>கூவிளம்</td></tr><tr><td>3</td><td class="fw-bold">கேட்க</td><td>கேட் / க <br> (நேர் / நேர்)</td><td>தேமா</td><td class="text-start bg-light"><strong>(2 & 3): விளம் முன் நேர்</strong><br>➔ இயற்சீர் வெண்டளை</td></tr><tr><td>4</td><td class="fw-bold">அனைத்தாணும்</td><td>அனைத் / தா / னும் <br> (நிரை / நேர் / நேர்)</td><td>புளிமாங்காய்</td><td class="text-start bg-light"><strong>(3 & 4): மா முன் நிரை</strong><br>➔ இயற்சீர் வெண்டளை</td></tr><tr><td>5</td><td class="fw-bold">ஆன்ற</td><td>ஆன் / ற <br> (நேர் / நேர்)</td><td>தேமா</td><td class="text-start bg-light"><strong>(4 & 5): காய் முன் நேர்</strong><br>➔ வெண்சீர் வெண்டளை</td></tr><tr><td>6</td><td class="fw-bold">பெருமை</td><td>பெரு / மை <br> (நிரை / நேர்)</td><td>புளிமா</td><td class="text-start bg-light"><strong>(5 & 6): மா முன் நிரை</strong><br>➔ இயற்சீர் வெண்டளை</td></tr><tr><td>7</td><td class="fw-bold">தரும்</td><td>தரும் <br> (நிரை)</td><td>மலர்</td><td class="text-start bg-light"><strong>(6 & 7): மா முன் நிரை</strong><br>➔ இயற்சீர் வெண்டளை</td></tr></tbody></table></div>']],
                ['type' => 'practice', 'data' => ['topic' => 'thalai', 'word' => 'ஆன்ற பெருமை']]
            ];

            $c3Content = Content::updateOrCreate(
                ['title' => 'சான்றுடன் தளை கண்டறிதல் பாடம்'],
                [
                    'name' => 'சான்றுடன் தளை கண்டறிதல் பாடம்',
                    'text_content' => json_encode(['blocks' => $c3Blocks], JSON_UNESCAPED_UNICODE),
                    'is_active' => true,
                ]
            );

            DB::table('content_chapters')->updateOrInsert(
                ['chapter_id' => $c3->id, 'content_id' => $c3Content->id]
            );
        }

        // 4. Seed Thalai MCQ Exercises
        $thalaiChapter = $c3 ?? Chapter::where('name', 'LIKE', '%தளை%')->first();
        if ($thalaiChapter) {
            $thalaiMcqQuestions = [
                ["q" => "செய்யுளில் நின்ற சீரின் ஈற்றசையையும் வரும் சீரின் முதலசையையும் பிணைப்பது எவ்வாறு அழைக்கப்படும்?", "opts" => ["தளை", "சீர்", "அடி", "தொடை"], "ans" => "தளை", "exp" => "நின்ற சீரின் ஈற்றசையும் வரும் சீரின் முதலசையும் பொருந்துவது தளை ஆகும்."],
                ["q" => "தளை மொத்தம் எத்தனை வகைப்படும்?", "opts" => ["ஏழு", "நான்கு", "ஐந்து", "ஆறு"], "ans" => "ஏழு", "exp" => "தளையின் வாய்பாடுகள் மொத்தம் 7 ஆகும்."],
                ["q" => "தளை காண்பதற்கான முதன்மை விதி எது?", "opts" => ["முதற்சீரினை அடுத்த சீரின் முதல் அசையுடன் சேர்த்தல்", "அடி முழுவதையும் கூட்டுதல்", "கடைசிச் சீரை மட்டும் அலகிடுதல்", "ஒற்றெழுத்தை மட்டும் எண்ணுதல்"], "ans" => "முதற்சீரினை அடுத்த சீரின் முதல் அசையுடன் சேர்த்தல்", "exp" => "முதற்சீரினை அடுத்த சீரின் முதல் அசையுடன் சேர்த்துத் தளை கண்டறிய வேண்டும்."],
                ["q" => "மாச்சீர் முன் நேர் அசை வருவது எவ்வகைத் தளை?", "opts" => ["நேரொன்று ஆசிரியத்தளை", "நிரையொன்று ஆசிரியத்தளை", "இயற்சீர் வெண்டளை", "வெண்சீர் வெண்டளை"], "ans" => "நேரொன்று ஆசிரியத்தளை", "exp" => "மா முன் நேர் = நேரொன்று ஆசிரியத்தளை."],
                ["q" => "விளச்சீர் முன் நிரை அசை வருவது எவ்வகைத் தளை?", "opts" => ["நிரையொன்று ஆசிரியத்தளை", "நேரொன்று ஆசிரியத்தளை", "இயற்சீர் வெண்டளை", "கலித்தளை"], "ans" => "நிரையொன்று ஆசிரியத்தளை", "exp" => "விளம் முன் நிரை = நிரையொன்று ஆசிரியத்தளை."],
                ["q" => "காய்ச்சீர் முன் நேர் அசை வருவது எவ்வகைத் தளை?", "opts" => ["வெண்சீர் வெண்டளை", "கலித்தளை", "இயற்சீர் வெண்டளை", "ஒன்றிய வஞ்சித்தளை"], "ans" => "வெண்சீர் வெண்டளை", "exp" => "காய் முன் நேர் = வெண்சீர் வெண்டளை."],
                ["q" => "கனிச்சீர் முன் நிரை அசை வருவது எவ்வகைத் தளை?", "opts" => ["ஒன்றிய வஞ்சித்தளை", "ஒன்றாத வஞ்சித்தளை", "கலித்தளை", "வெண்சீர் வெண்டளை"], "ans" => "ஒன்றிய வஞ்சித்தளை", "exp" => "கனி முன் நிரை = ஒன்றிய வஞ்சித்தளை."],
                ["q" => "மா முன் நிரையும் விளம் முன் நேரும் வருவது எவ்வகைத் தளை?", "opts" => ["இயற்சீர் வெண்டளை", "வெண்சீர் வெண்டளை", "கலித்தளை", "ஆசிரியத்தளை"], "ans" => "இயற்சீர் வெண்டளை", "exp" => "மா முன் நிரை / விளம் முன் நேர் = இயற்சீர் வெண்டளை."],
                ["q" => "காய்ச்சீர் முன் நிரை அசை வருவது எவ்வகைத் தளை?", "opts" => ["கலித்தளை", "வெண்சீர் வெண்டளை", "இயற்சீர் வெண்டளை", "ஒன்றாத வஞ்சித்தளை"], "ans" => "கலித்தளை", "exp" => "காய் முன் நிரை = கலித்தளை."],
                ["q" => "கனிச்சீர் முன் நேர் அசை வருவது எவ்வகைத் தளை?", "opts" => ["ஒன்றாத வஞ்சித்தளை", "ஒன்றிய வஞ்சித்தளை", "கலித்தளை", "ஆசிரியத்தளை"], "ans" => "ஒன்றாத வஞ்சித்தளை", "exp" => "கனி முன் நேர் = ஒன்றாத வஞ்சித்தளை."]
            ];

            $thalaiContentBlocks = [];
            $thalaiContentBlocks[] = [
                'type' => 'paragraph',
                'data' => [
                    'text' => '<h2 class="text-primary text-center mb-4">தளை – பயிற்சி வினாக்கள்</h2><p class="fs-5 text-center">ஏழு வகைத் தளைகள் மற்றும் அவற்றின் விதிகளின் அடிப்படையிலான பயிற்சி வினாக்கள்.</p>'
                ]
            ];

            foreach ($thalaiMcqQuestions as $idx => $qData) {
                $options = [];
                foreach ($qData['opts'] as $optIdx => $optText) {
                    $options[] = [
                        'id'        => $optIdx + 1,
                        'text'      => $optText,
                        'isCorrect' => ($optText === $qData['ans'])
                    ];
                }

                $thalaiContentBlocks[] = [
                    'type' => 'activity',
                    'data' => [
                        'type'        => 'mcq',
                        'title'       => 'தளை வினா #' . ($idx + 1),
                        'question'    => $qData['q'],
                        'options'     => $options,
                        'explanation' => $qData['exp']
                    ]
                ];
            }

            Content::where('title', 'LIKE', '%தளைப் பயிற்சி - 50%')
                ->get()
                ->each(function($oc) {
                    DB::table('content_chapters')->where('content_id', $oc->id)->delete();
                    $oc->delete();
                });

            $content = Content::create([
                'name'         => 'தளைப் பயிற்சி - 50',
                'title'        => 'தளைப் பயிற்சி - 50',
                'text_content' => json_encode(['blocks' => $thalaiContentBlocks], JSON_UNESCAPED_UNICODE),
                'is_active'    => true,
            ]);

            DB::table('content_chapters')->insert([
                'chapter_id' => $thalaiChapter->id,
                'content_id' => $content->id,
            ]);
        }
    }
}
