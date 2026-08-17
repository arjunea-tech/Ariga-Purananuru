<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Chapter;
use App\Models\Content;

class AsaiActivitySeeder extends Seeder
{
    public function run(): void
    {
        // ==========================================
        // SEED ASAI (அசை பாடங்கள் & பயிற்சிகள்)
        // ==========================================

        // 1. Seed Chapter 1 Reading Content (அசை மற்றும் நேரசை)
        $c1 = Chapter::where('name', 'LIKE', '%அசை மற்றும் நேரசை%')->first();
        if ($c1) {
            $c1Blocks = [
                ['type' => 'paragraph', 'data' => ['text' => '<h2 class="text-primary text-center mb-4">அசை</h2><p>எழுத்துக்களால் ஆனது அசை. அசை நேரசை, நிரையசை என்று இருவகைப்படும்.</p><h4>நேரசை அமைப்பு</h4><p>ஓர் எழுத்து எண்ணிக்கையில் வரும் (நேர் – நேர் என்ற சொல்லிலும் நே என்று ஓர் எழுத்து இடம்பெறுகிறது. ஒற்றிற்கு மதிப்பில்லை என்பதை நினைவில் கொள்க].</p><ul><li>தனிக்குறில் (எ.கா: ப]</li><li>தனிக்குறில் + ஒற்று (எ.கா: பல்]</li><li>தனிநெடில் (எ.கா: பா]</li><li>தனிநெடில் + ஒற்று (எ.கா: பால்]</li></ul><p>நேர் என்ற சொல்லைப் போல ப, பல், பா, பால் என்பன ஓர் எழுத்து உடைய அசைகள் என்பதை அறிக. ஒற்றிற்கு மதிப்பில்லை.</p>']],
                ['type' => 'practice', 'data' => ['topic' => 'asai', 'word' => 'பல்']]
            ];

            $c1Content = Content::updateOrCreate(
                ['title' => 'அசை மற்றும் நேரசை பாடம்'],
                [
                    'name' => 'அசை மற்றும் நேரசை பாடம்',
                    'text_content' => json_encode(['blocks' => $c1Blocks], JSON_UNESCAPED_UNICODE),
                    'is_active' => true,
                ]
            );

            DB::table('content_chapters')->updateOrInsert(
                ['chapter_id' => $c1->id, 'content_id' => $c1Content->id]
            );
        }

        // 2. Seed Chapter 2 Reading Content (நிரையசை)
        $c2 = Chapter::where('name', 'LIKE', '%நிரையசை%')->first();
        if ($c2) {
            $c2Blocks = [
                ['type' => 'paragraph', 'data' => ['text' => '<h2 class="text-primary text-center mb-4">நிரையசை</h2><p>இரண்டு எழுத்துக்கள் எண்ணிக்கையில் வரும் (நிரை – நிரை என்ற சொல்லிலும் நி, ரை என்று இரண்டு எழுத்துக்கள் இடம்பெறுகின்றன. ஒற்றிற்கு மதிப்பில்லை என்பதை நினைவில் கொள்க].</p><h4>நிரையசை அமைப்பு</h4><ul><li>இருகுறில் இணை (எ.கா: அணி]</li><li>இருகுறில் இணை + ஒற்று (எ.கா: அணில்]</li><li>குறில் நெடில் இணை (எ.கா: விழா]</li><li>குறில் நெடில் இணை + ஒற்று (எ.கா: விழார்]</li></ul><p>நிரை என்ற சொல்லைப் போல அணி, அணில், விழா, விழார் என்பன இரண்டு எழுத்து உடைய அசைகள் என்பதை அறிக. ஒற்றிற்கு மதிப்பில்லை.</p>']],
                ['type' => 'practice', 'data' => ['topic' => 'asai', 'word' => 'அணில்']]
            ];

            $c2Content = Content::updateOrCreate(
                ['title' => 'நிரையசை பாடம்'],
                [
                    'name' => 'நிரையசை பாடம்',
                    'text_content' => json_encode(['blocks' => $c2Blocks], JSON_UNESCAPED_UNICODE),
                    'is_active' => true,
                ]
            );

            DB::table('content_chapters')->updateOrInsert(
                ['chapter_id' => $c2->id, 'content_id' => $c2Content->id]
            );
        }

        // 3. Seed Chapter 3 Reading Content (அசை பிரித்தல் பயிற்சி)
        $c3 = Chapter::where('name', 'LIKE', '%அசை பிரித்தல் பயிற்சி%')->first();
        if ($c3) {
            $c3Blocks = [
                ['type' => 'paragraph', 'data' => ['text' => '<h2 class="text-primary text-center mb-4">அசை பிரித்தல்</h2><p>ஒரு சொல்லில் உள்ள எழுத்துகளை நேரசை, நிரையசை விதிகளின்படி சரியாகப் பிரிப்பதே அசை பிரித்தல் ஆகும். இது சீர் அமைவதற்கும் தளை தட்டுவதற்கும் அடிப்படையாகும்.</p>']],
                ['type' => 'practice', 'data' => ['topic' => 'asai', 'word' => 'அகழ்வாரைத்']]
            ];

            $c3Content = Content::updateOrCreate(
                ['title' => 'அசை பிரித்தல் பயிற்சி பாடம்'],
                [
                    'name' => 'அசை பிரித்தல் பயிற்சி பாடம்',
                    'text_content' => json_encode(['blocks' => $c3Blocks], JSON_UNESCAPED_UNICODE),
                    'is_active' => true,
                ]
            );

            DB::table('content_chapters')->updateOrInsert(
                ['chapter_id' => $c3->id, 'content_id' => $c3Content->id]
            );
        }

        // 4. Seed Asai MCQ & Games Activities
        $asaiChapter = $c3 ?? Chapter::where('name', 'LIKE', '%அசை%')->first();
        if ($asaiChapter) {
            $asaiMcqQuestions = [
                ["q" => "எழுத்துகளால் ஆக்கப்படுவது எது?", "opts" => ["அசை", "சீர்", "தளை", "அடி"], "ans" => "அசை", "exp" => "எழுத்துகள் சேர்ந்து அமைவது அசை எனப்படும்."],
                ["q" => "யாப்பிலக்கணத்தில் அசை எத்தனை வகைப்படும்?", "opts" => ["2", "3", "4", "5"], "ans" => "2", "exp" => "அசை - நேர் அசை, நிரை அசை என இரு வகைப்படும்."],
                ["q" => "அசையின் இரு முதன்மை வகைகள் யாவை?", "opts" => ["நேர் அசை, நிரை அசை", "குறில், நெடில்", "முதல், சார்பு", "வல்லினம், மெல்லினம்"], "ans" => "நேர் அசை, நிரை அசை", "exp" => "அசை நேர் அசை மற்றும் நிரை அசை என இருவகைப்படும்."],
                ["q" => "ஓர் எழுத்து தனியாகவோ ஒற்றுடன் பெற்றோ வருவது எவ்வகை அசை?", "opts" => ["நேர் அசை", "நிரை அசை", "நேர்பு", "நிரைபு"], "ans" => "நேர் அசை", "exp" => "தனிக்குறில் அல்லது தனிநெடில் தனியாகவோ ஒற்றுடனோ வருவது நேர் அசை."],
                ["q" => "இரண்டு எழுத்துகள் இணைந்து தனியாகவோ ஒற்றுடன் பெற்றோ வருவது எவ்வகை அசை?", "opts" => ["நிரை அசை", "நேர் அசை", "நேர்பு", "நிரைபு"], "ans" => "நிரை அசை", "exp" => "இருக்குறில் அல்லது குறில்நெடில் இணைந்து தனியாகவோ ஒற்றுடனோ வருவது நிரை அசை."],
                ["q" => "அசை பிரிக்கும்போது எந்த எழுத்துக்கு அசை மதிப்பு இல்லை?", "opts" => ["மெய் எழுத்து (ஒற்று)", "நெடில் எழுத்து", "குறில் எழுத்து", "உயிர்மெய் எழுத்து"], "ans" => "மெய் எழுத்து (ஒற்று)", "exp" => "அசை பிரிக்க கணக்கிடும்போது புள்ளி வைத்த மெய் எழுத்துகளை (ஒற்று) தனியாக எண்ணக் கூடாது."],
                ["q" => "நேரசைக்குரிய விதிகளில் சரியானதைத் தேர்ந்தெடு.", "opts" => ["தனிக்குறில், தனிநெடில்", "இரு குறிலிணை", "குறில் நெடிலிணை", "இவை அனைத்தும்"], "ans" => "தனிக்குறில், தனிநெடில்", "exp" => "தனிக்குறில், தனிநெடில் ஆகியவை தனியாகவோ ஒற்றுடனோ வருவது நேர் அசை ஆகும்."],
                ["q" => "நிரையசைக்குரிய விதிகளில் சரியானதைத் தேர்ந்தெடு.", "opts" => ["இரு குறிலிணை, குறில் நெடிலிணை", "தனிக்குறில், தனிநெடில்", "தனிநெடில் ஒற்று", "தனிக்குறில் ஒற்று"], "ans" => "இரு குறிலிணை, குறில் நெடிலிணை", "exp" => "இரு குறில்கள் அல்லது குறிலும் நெடிலும் இணைந்து வருவது நிரை அசை ஆகும்."],
                ["q" => "'க' என்பது எவ்வகை அசை?", "opts" => ["நேர் அசை", "நிரை அசை", "நேர்பு", "நிரைபு"], "ans" => "நேர் அசை", "exp" => "'க' என்பது தனிக்குறில் என்பதால் நேர் அசை ஆகும்."],
                ["q" => "'கல்' என்பது எவ்வகை அசை?", "opts" => ["நேர் அசை", "நிரை அசை", "நேர்பு", "நிரைபு"], "ans" => "நேர் அசை", "exp" => "'க' (குறில்) + 'ல்' (ஒற்று) இணைந்து வந்ததால் நேர் அசை ஆகும்."]
            ];

            $asaiContentBlocks = [];
            $asaiContentBlocks[] = [
                'type' => 'paragraph',
                'data' => [
                    'text' => '<h2 class="text-primary text-center mb-4">அசை – பயிற்சி வினாக்கள்</h2><p class="fs-5 text-center">நேரசை, நிரையசை விதிகள் மற்றும் அசை பிரித்தல் பாடங்களின் அடிப்படையிலான பயிற்சி வினாக்கள்.</p>'
                ]
            ];

            foreach ($asaiMcqQuestions as $idx => $qData) {
                $options = [];
                foreach ($qData['opts'] as $optIdx => $optText) {
                    $options[] = [
                        'id'        => $optIdx + 1,
                        'text'      => $optText,
                        'isCorrect' => ($optText === $qData['ans'])
                    ];
                }

                $asaiContentBlocks[] = [
                    'type' => 'activity',
                    'data' => [
                        'type'        => 'mcq',
                        'title'       => 'அசை வினா #' . ($idx + 1),
                        'question'    => $qData['q'],
                        'options'     => $options,
                        'explanation' => $qData['exp']
                    ]
                ];
            }

            Content::where('title', 'LIKE', '%அசைப் பயிற்சி - 50%')
                ->get()
                ->each(function($oc) {
                    DB::table('content_chapters')->where('content_id', $oc->id)->delete();
                    $oc->delete();
                });

            $contentMcqOnly = Content::create([
                'name'         => 'அசைப் பயிற்சி - 50',
                'title'        => 'அசைப் பயிற்சி - 50',
                'text_content' => json_encode(['blocks' => $asaiContentBlocks], JSON_UNESCAPED_UNICODE),
                'is_active'    => true,
            ]);

            DB::table('content_chapters')->insert([
                'chapter_id' => $asaiChapter->id,
                'content_id' => $contentMcqOnly->id,
            ]);

            // Asai Slice Game
            Content::where('title', 'LIKE', '%அசை வெட்டுப் பயிற்சி - 50%')
                ->get()
                ->each(function($oc) {
                    DB::table('content_chapters')->where('content_id', $oc->id)->delete();
                    $oc->delete();
                });

            $sliceWordsList = ['தாமரை', 'கல்வி', 'அகரம்', 'கண்ணன்', 'அம்மா', 'அப்பா', 'தம்பி', 'செல்வம்', 'பள்ளி', 'நாடு'];
            $sliceBlocks = [];
            foreach ($sliceWordsList as $swIdx => $swWord) {
                $sliceBlocks[] = [
                    'type' => 'activity',
                    'data' => [
                        'type'     => 'yappu_asai_slice',
                        'title'    => 'அசை வெட்டு #' . ($swIdx + 1),
                        'question' => 'வார்த்தையை சரியான அசைகளாகப் பிரிக்கவும்:',
                        'words'    => [$swWord],
                    ]
                ];
            }

            $contentSlice = Content::create([
                'name'         => 'அசை வெட்டுப் பயிற்சி - 50',
                'title'        => 'அசை வெட்டுப் பயிற்சி - 50',
                'text_content' => json_encode(['blocks' => $sliceBlocks], JSON_UNESCAPED_UNICODE),
                'is_active'    => true,
            ]);

            DB::table('content_chapters')->insert([
                'chapter_id' => $asaiChapter->id,
                'content_id' => $contentSlice->id,
            ]);
        }
    }
}
