<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Chapter;
use App\Models\Content;

class SeerActivitySeeder extends Seeder
{
    public function run(): void
    {
        // ==========================================
        // SEED SEER (சீர் பாடங்கள் & பயிற்சிகள்)
        // ==========================================

        // 1. Seed Chapter 1 Reading Content (சீர் மற்றும் ஓரசைச் சீர்கள்)
        $c1 = Chapter::where('name', 'LIKE', '%சீர் மற்றும் ஓரசைச் சீர்கள்%')->first();
        if ($c1) {
            $c1Blocks = [
                ['type' => 'paragraph', 'data' => ['text' => '<h2 class="text-primary text-center mb-4">சீர் அறிமுகம் & ஓரசைச் சீர்கள்</h2><p class="fs-5"><strong>சீர்:</strong> ஒன்று அல்லது ஒன்றிற்கு மேற்பட்ட அசைகளின் சேர்க்கை சீர் எனப்படும்.</p><p class="fs-5">சீர் நான்கு வகைப்படும்:</p><ol class="fs-5 text-dark mt-2"><li>ஓரசைச் சீர்கள்</li><li>ஈரசைச் சீர்கள்</li><li>மூவசைச் சீர்கள்</li><li>நாலசைச் சீர்கள்</li></ol><hr class="my-4"><h3 class="text-success mb-3">ஓரசைச் சீர்கள்</h3><div class="table-responsive"><table class="table table-bordered table-striped text-center align-middle" style="font-size: 0.95rem;"><thead class="bg-light fw-bold text-dark"><tr><th>அசை</th><th>வாய்பாடு</th><th>சான்று</th><th>சான்று பெயர் பெறுவதன் காரணம் அறிதல்</th></tr></thead><tbody><tr><td class="fw-bold">நேர்</td><td>நாள்</td><td>தேன்</td><td class="text-start">தே – ஓரெழுத்து. எனவே நாள் என்னும் ஓரெழுத்து உடைய வாய்பாடு.</td></tr><tr><td class="fw-bold">நிரை</td><td>மலர்</td><td>பதம்</td><td class="text-start">ப, த – இரண்டு எழுத்துக்கள். எனவே இரண்டு எழுத்துக்களை உடைய மலர் என்னும் வாய்பாடு.</td></tr><tr><td class="fw-bold">நேர்பு</td><td>காசு</td><td>பாடு</td><td class="text-start">பா என்னும் ஓரெழுத்து டு என்னும் குற்றியலுகரம் பெற்றுள்ளது. எனவே கா என்னும் ஓரெழுத்துடன் சு என்னும் குற்றியலுகரம் இணைந்த காசு என்னும் வாய்பாடு.</td></tr><tr><td class="fw-bold">நிரைபு</td><td>பிறப்பு</td><td>விரும்பு</td><td class="text-start">வி, ரு என்னும் இரண்டு எழுத்துக்கள் பு என்னும் குற்றியலுகரம் பெற்று முடிகின்றன. எனவே பிற என்னும் ஈரெழுத்துக்களுடன் பு என்னும் குற்றியலுகரம் இணைந்த பிறப்பு என்னும் வாய்பாடு.</td></tr></tbody></table></div>']],
                ['type' => 'practice', 'data' => ['topic' => 'seer', 'word' => 'தேன்']]
            ];

            $c1Content = Content::updateOrCreate(
                ['title' => 'சீர் மற்றும் ஓரசைச் சீர்கள் பாடம்'],
                [
                    'name' => 'சீர் மற்றும் ஓரசைச் சீர்கள் பாடம்',
                    'text_content' => json_encode(['blocks' => $c1Blocks], JSON_UNESCAPED_UNICODE),
                    'is_active' => true,
                ]
            );

            DB::table('content_chapters')->updateOrInsert(
                ['chapter_id' => $c1->id, 'content_id' => $c1Content->id]
            );
        }

        // 2. Seed Chapter 2 Reading Content (ஈரசைச் சீர்கள்)
        $c2 = Chapter::where('name', 'LIKE', '%ஈரசைச் சீர்கள்%')->first();
        if ($c2) {
            $c2Blocks = [
                ['type' => 'paragraph', 'data' => ['text' => '<h2 class="text-primary text-center mb-4">ஈரசைச் சீர்கள்</h2><div class="table-responsive"><table class="table table-bordered table-striped text-center align-middle" style="font-size: 0.95rem;"><thead class="bg-light fw-bold text-dark"><tr><th>அசை</th><th>வாய்பாடு</th><th>பொதுப்பெயர்</th><th>சான்று</th><th>சான்று பெயர் பெறுவதன் காரணம் அறிதல்</th></tr></thead><tbody><tr><td class="fw-bold">நேர் நேர்</td><td>தேமா</td><td rowspan="2" class="align-middle fw-bold text-success">மாச்சீர்</td><td>தண்ணீர்</td><td class="text-start">தண் என்னும் நேரசையும் ணீர் என்னும் நேரசையும் வந்துள்ளன. எனவே தே என்னும் நேரசையும் மா என்னும் நேரசையும் வரும் தேமா என்னும் வாய்பாடு பொருத்தம்.</td></tr><tr><td class="fw-bold">நிரை நேர்</td><td>புளிமா</td><td>வருமா</td><td class="text-start">வரு என்னும் நிரையசையும் மா என்னும் நேரசையும் வந்துள்ளன. எனவே புளி என்னும் நிரையசையும் மா என்னும் நேரசையும் வரும் புளிமா என்னும் வாய்பாடு பொருத்தம்.</td></tr><tr><td class="fw-bold">நிரை நிரை</td><td>கருவிளம்</td><td rowspan="2" class="align-middle fw-bold text-primary">விளச்சீர்</td><td>வருபுனல்</td><td class="text-start">வரு என்னும் நிரையசையும் புனல் என்னும் நிரையசையும் வந்துள்ளன. எனவே கரு என்னும் நிரையசையும் விளம் என்னும் நிரையசையும் வரும் கருவிளம் என்னும் வாய்பாடு பொருத்தம்.</td></tr><tr><td class="fw-bold">நேர் நிரை</td><td>கூவிளம்</td><td>தாவின</td><td class="text-start">தா என்னும் நேரசையும் வின என்னும் நிரையசையும் வந்துள்ளன. எனவே கூ என்னும் நேரசையும் விளம் என்னும் நிரையசையும் வரும் கூவிளம் என்னும் வாய்பாடு பொருத்தம்.</td></tr></tbody></table></div>']],
                ['type' => 'practice', 'data' => ['topic' => 'seer', 'word' => 'தண்ணீர்']]
            ];

            $c2Content = Content::updateOrCreate(
                ['title' => 'ஈரசைச் சீர்கள் பாடம்'],
                [
                    'name' => 'ஈரசைச் சீர்கள் பாடம்',
                    'text_content' => json_encode(['blocks' => $c2Blocks], JSON_UNESCAPED_UNICODE),
                    'is_active' => true,
                ]
            );

            DB::table('content_chapters')->updateOrInsert(
                ['chapter_id' => $c2->id, 'content_id' => $c2Content->id]
            );
        }

        // 3. Seed Chapter 3 Reading Content (மூவசைச் சீர்கள்)
        $c3 = Chapter::where('name', 'LIKE', '%மூவசைச் சீர்கள்%')->first();
        if ($c3) {
            $c3Blocks = [
                ['type' => 'paragraph', 'data' => ['text' => '<h2 class="text-primary text-center mb-4">மூவசைச் சீர்கள்</h2><p class="fs-5">மூவசைச் சீர்கள் இரண்டு வகைப்படும்: <strong>காய்ச்சீர்</strong> மற்றும் <strong>கனிச்சீர்</strong>.</p><div class="row"><div class="col-md-6"><div class="card mb-4 border-success"><div class="card-header bg-success text-white fw-bold text-center">காய்ச்சீர் (காய் என்பது நேர்)</div><div class="card-body"><table class="table table-sm table-bordered text-center align-middle"><thead class="bg-light"><tr><th>அசை</th><th>வாய்பாடு</th></tr></thead><tbody><tr><td>நேர் நேர் நேர்</td><td>தேமாங்காய்</td></tr><tr><td>நிரை நேர் நேர்</td><td>புளிமாங்காய்</td></tr><tr><td>நிரை நிரை நேர்</td><td>கருவிளங்காய்</td></tr><tr><td>நேர் நிரை நேர்</td><td>கூவிளங்காய்</td></tr></tbody></table></div></div></div><div class="col-md-6"><div class="card mb-4 border-danger"><div class="card-header bg-danger text-white fw-bold text-center">கனிச்சீர் (கனி என்பது நிரை)</div><div class="card-body"><table class="table table-sm table-bordered text-center align-middle"><thead class="bg-light"><tr><th>அசை</th><th>வாய்பாடு</th></tr></thead><tbody><tr><td>நேர் நேர் நிரை</td><td>தேமாங்கனி</td></tr><tr><td>நிரை நேர் நிரை</td><td>புளிமாங்கனி</td></tr><tr><td>நிரை நிரை நிரை</td><td>கருவிளங்கனி</td></tr><tr><td>நேர் நிரை நிரை</td><td>கூவிளங்கனி</td></tr></tbody></table></div></div></div></div>']],
                ['type' => 'practice', 'data' => ['topic' => 'seer', 'word' => 'தேமாங்காய்']]
            ];

            $c3Content = Content::updateOrCreate(
                ['title' => 'மூவசைச் சீர்கள் பாடம்'],
                [
                    'name' => 'மூவசைச் சீர்கள் பாடம்',
                    'text_content' => json_encode(['blocks' => $c3Blocks], JSON_UNESCAPED_UNICODE),
                    'is_active' => true,
                ]
            );

            DB::table('content_chapters')->updateOrInsert(
                ['chapter_id' => $c3->id, 'content_id' => $c3Content->id]
            );
        }

        // 4. Seed Chapter 4 Reading Content (நாலசைச் சீர்கள்)
        $c4 = Chapter::where('name', 'LIKE', '%நாலசைச் சீர்கள்%')->first();
        if ($c4) {
            $c4Blocks = [
                ['type' => 'paragraph', 'data' => ['text' => '<h2 class="text-primary text-center mb-4">நாலசைச் சீர்கள்</h2><p class="fs-6">நாலசைச் சீர்கள், ஈரசைச் சீர்களோடு இரண்டு அசைகள் இணைவதால் உருவாகின்றன. இவை <strong>பூச்சீர்</strong> மற்றும் <strong>நிழல்சீர்</strong> என்று வகைப்படுத்தப்படுகின்றன.</p><h4 class="text-success mt-4">1. பூச்சீர் (பூ என்பது நேர்)</h4><div class="alert alert-info border-start border-4 border-info py-2 px-3 mb-3"><p class="mb-1 fw-bold">காய்ச்சீர் + நேர் = தண்பூ</p><p class="mb-0 small text-dark">தண் என்பதும் பூ என்பதும் நேர் அசைகள். ஈரசைச் சீர்களோடு இரு நேரசைகள் இணைவதால் தண்பூ எனப் பெயர் பெறுகின்றன.</p></div><table class="table table-bordered text-center align-middle mb-4" style="font-size: 0.9rem;"><thead class="bg-light"><tr><th>அசை</th><th>வாய்பாடு</th></tr></thead><tbody><tr><td>நேர் நேர் நேர் நேர்</td><td>தேமாந்தண்பூ</td></tr><tr><td>நிரை நேர் நேர் நேர்</td><td>புளிமாந்தண்பூ</td></tr><tr><td>நிரை நிரை நேர் நேர்</td><td>கருவிளந்தண்பூ</td></tr><tr><td>நேர் நிரை நேர் நேர்</td><td>கூவிளந்தண்பூ</td></tr></tbody></table><div class="alert alert-info border-start border-4 border-info py-2 px-3 mb-3"><p class="mb-1 fw-bold">கனிச்சீர் + நேர் = நறும்பூ</p><p class="mb-0 small text-dark">நறும் என்பது நிரை அசை, பூ என்பது நேர் அசை. ஈரசைச் சீர்களோடு ஒரு நிரையசையும் ஒரு நேரசையும் இணைவதால் நறும்பூ எனப் பெயர் பெறுகின்றன.</p></div><table class="table table-bordered text-center align-middle mb-4" style="font-size: 0.9rem;"><thead class="bg-light"><tr><th>அசை</th><th>வாய்பாடு</th></tr></thead><tbody><tr><td>நேர் நேர் நிரை நேர்</td><td>தேமாநறும்பூ</td></tr><tr><td>நிரை நேர் நிரை நேர்</td><td>புளிமாநறும்பூ</td></tr><tr><td>நிரை நிரை நிரை நேர்</td><td>கருவிளநறும்பூ</td></tr><tr><td>நேர் நிரை நிரை நேர்</td><td>கூவிளநறும்பூ</td></tr></tbody></table><hr class="my-4"><h4 class="text-primary">2. நிழல் சீர்கள் (நிழல் என்பது நிரை)</h4><div class="alert alert-warning border-start border-4 border-warning py-2 px-3 mb-3"><p class="mb-1 fw-bold">காய்ச்சீர் + நிரை = தண்ணிழல்</p><p class="mb-0 small text-dark">தண் என்பது நேர் அசை, நிழல் என்பது நிரை அசை. ஈரசைச் சீர்களோடு ஒரு நேரசையும் ஒரு நிரையசையும் இணைவதால் தண்ணிழல் எனப் பெயர் பெறுகின்றன.</p></div><table class="table table-bordered text-center align-middle mb-4" style="font-size: 0.9rem;"><thead class="bg-light"><tr><th>அசை</th><th>வாய்பாடு</th></tr></thead><tbody><tr><td>நேர் நேர் நேர் நிரை</td><td>தேமாந்தண்ணிழல்</td></tr><tr><td>நிரை நேர் நேர் நிரை</td><td>புளிமாந்தண்ணிழல்</td></tr><tr><td>நிரை நிரை நேர் நிரை</td><td>கருவிளந்தண்ணிழல்</td></tr><tr><td>நேர் நிரை நேர் நிரை</td><td>கூவிளந்தண்ணிழல்</td></tr></tbody></table><div class="alert alert-warning border-start border-4 border-warning py-2 px-3 mb-3"><p class="mb-1 fw-bold">கனிச்சீர் + நிரை = நறுநிழல்</p><p class="mb-0 small text-dark">நறும் என்பதும் நிழல் என்பதும் நிரையசைகள். ஈரசைச் சீர்களோடு இரண்டு நிரையசைகள் இணைவதால் நறுநிழல் எனப் பெயர் பெறுகின்றன.</p></div><table class="table table-bordered text-center align-middle mb-4" style="font-size: 0.9rem;"><thead class="bg-light"><tr><th>அசை</th><th>வாய்பாடு</th></tr></thead><tbody><tr><td>நேர் நேர் நிரை நிரை</td><td>தேமாநறுநிழல்</td></tr><tr><td>நிரை நேர் நிரை நிரை</td><td>புளிமாநறுநிழல்</td></tr><tr><td>நிரை நிரை நிரை நிரை</td><td>கருவிளநறுநிழல்</td></tr><tr><td>நேர் நிரை நிரை நிரை</td><td>கூவிளநறுநிழல்</td></tr></tbody></table>']],
                ['type' => 'practice', 'data' => ['topic' => 'seer', 'word' => 'தேமாந்தண்பூ']]
            ];

            $c4Content = Content::updateOrCreate(
                ['title' => 'நாலசைச் சீர்கள் பாடம்'],
                [
                    'name' => 'நாலசைச் சீர்கள் பாடம்',
                    'text_content' => json_encode(['blocks' => $c4Blocks], JSON_UNESCAPED_UNICODE),
                    'is_active' => true,
                ]
            );

            DB::table('content_chapters')->updateOrInsert(
                ['chapter_id' => $c4->id, 'content_id' => $c4Content->id]
            );
        }

        // 5. Seed Seer MCQ Exercises
        $seerChapter = $c3 ?? Chapter::where('name', 'LIKE', '%சீர்%')->first();
        if ($seerChapter) {
            $seerMcqQuestions = [
                ["q" => "ஒன்று அல்லது அதற்கு மேற்பட்ட அசைகளின் சேர்க்கை எவ்வாறு அழைக்கப்படும்?", "opts" => ["சீர்", "தளை", "அடி", "தொடை"], "ans" => "சீர்", "exp" => "அசைகள் ஒன்றுடன் ஒன்று சேர்ந்து அமைவது சீர் எனப்படும்."],
                ["q" => "சீர் மொத்தம் எத்தனை வகைப்படும்?", "opts" => ["நான்கு", "இரண்டு", "மூன்று", "ஐந்து"], "ans" => "நான்கு", "exp" => "ஓரசைச் சீர், ஈரசைச் சீர், மூவசைச் சீர், நாலசைச் சீர் என 4 வகைப்படும்."],
                ["q" => "ஓரசைச் சீர் எங்கே பயின்று வரும்?", "opts" => ["வெண்பாவின் ஈற்றுச் சீரில் (இறுதியில்)", "பாடலின் முதலடிச் சீரில்", "எல்லா இடங்களிலும்", "செய்யுளின் நடுவில்"], "ans" => "வெண்பாவின் ஈற்றுச் சீரில் (இறுதியில்)", "exp" => "ஓரசைச் சீர்கள் வெண்பாவின் இறுதிச் சீராக மட்டுமே வரும்."],
                ["q" => "ஓரசைச் சீருக்குரிய வாய்பாடுகள் எவை?", "opts" => ["நாள், மலர், காசு, பிறப்பு", "தேமா, புளிமா, கருவிளம், கூவிளம்", "தேமாங்காய், புளிமாங்காய்", "தேமாந்தண்பூ"], "ans" => "நாள், மலர், காசு, பிறப்பு", "exp" => "நாள், மலர், காசு, பிறப்பு என்பன ஓரசைச் சீருக்குரிய வாய்பாடுகள்."],
                ["q" => "நேரசை தனித்து வரும் ஓரசைச் சீரின் வாய்பாடு என்ன?", "opts" => ["நாள்", "மலர்", "காசு", "பிறப்பு"], "ans" => "நாள்", "exp" => "நேரசை நாள் என்னும் வாய்பாடு பெறும்."],
                ["q" => "நிரையசை தனித்து வரும் ஓரசைச் சீரின் வாய்பாடு என்ன?", "opts" => ["மலர்", "நாள்", "காசு", "பிறப்பு"], "ans" => "மலர்", "exp" => "நிரையசை மலர் என்னும் வாய்பாடு பெறும்."],
                ["q" => "ஈரசைச் சீர்கள் மொத்தம் எத்தனை?", "opts" => ["நான்கு", "இரண்டு", "மூன்று", "எட்டு"], "ans" => "நான்கு", "exp" => "தேமா, புளிமா, கருவிளம், கூவிளம் என ஈரசைச் சீர்கள் 4 ஆகும்."],
                ["q" => "'நேர் நேர்' என்ற அசைச் சேர்க்கையின் வாய்பாடு என்ன?", "opts" => ["தேமா", "புளிமா", "கருவிளம்", "கூவிளம்"], "ans" => "தேமா", "exp" => "நேர் நேர் = தேமா."],
                ["q" => "'நிரை நேர்' என்ற அசைச் சேர்க்கையின் வாய்பாடு என்ன?", "opts" => ["புளிமா", "தேமா", "கருவிளம்", "கூவிளம்"], "ans" => "புளிமா", "exp" => "நிரை நேர் = புளிமா."],
                ["q" => "மாச்சீர்கள் எவை?", "opts" => ["தேமா, புளிமா", "கருவிளம், கூவிளம்", "தேமாங்காய், புளிமாங்காய்", "தேமாங்கனி, புளிமாங்கனி"], "ans" => "தேமா, புளிமா", "exp" => "தேமா, புளிமா ஆகியவை மாச்சீர்கள் எனப்படும்."]
            ];

            $seerContentBlocks = [];
            $seerContentBlocks[] = [
                'type' => 'paragraph',
                'data' => [
                    'text' => '<h2 class="text-primary text-center mb-4">சீர் – பயிற்சி வினாக்கள்</h2><p class="fs-5 text-center">ஓரசை, ஈரசை, மூவசை மற்றும் நாலசைச் சீர்களின் அடிப்படையிலான பயிற்சி வினாக்கள்.</p>'
                ]
            ];

            foreach ($seerMcqQuestions as $idx => $qData) {
                $options = [];
                foreach ($qData['opts'] as $optIdx => $optText) {
                    $options[] = [
                        'id'        => $optIdx + 1,
                        'text'      => $optText,
                        'isCorrect' => ($optText === $qData['ans'])
                    ];
                }

                $seerContentBlocks[] = [
                    'type' => 'activity',
                    'data' => [
                        'type'        => 'mcq',
                        'title'       => 'சீர் வினா #' . ($idx + 1),
                        'question'    => $qData['q'],
                        'options'     => $options,
                        'explanation' => $qData['exp']
                    ]
                ];
            }

            Content::where('title', 'LIKE', '%சீர்ப் பயிற்சி - 50%')
                ->get()
                ->each(function($oc) {
                    DB::table('content_chapters')->where('content_id', $oc->id)->delete();
                    $oc->delete();
                });

            $content = Content::create([
                'name'         => 'சீர்ப் பயிற்சி - 50',
                'title'        => 'சீர்ப் பயிற்சி - 50',
                'text_content' => json_encode(['blocks' => $seerContentBlocks], JSON_UNESCAPED_UNICODE),
                'is_active'    => true,
            ]);

            DB::table('content_chapters')->insert([
                'chapter_id' => $seerChapter->id,
                'content_id' => $content->id,
            ]);
        }
    }
}
