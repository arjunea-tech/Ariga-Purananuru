<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Chapter;
use App\Models\Content;

class AlahiduthalActivitySeeder extends Seeder
{
    public function run(): void
    {
        // ==========================================
        // SEED ALAHIDUTHAL (அலகிடுதல் பாடம் & பயிற்சிகள்)
        // ==========================================

        // 1. Seed Chapter 1 Reading Content (அலகிடும் முறை)
        $c1 = Chapter::where('name', 'LIKE', '%அலகிடும் முறை%')->first();
        if ($c1) {
            $c1Blocks = [
                ['type' => 'paragraph', 'data' => ['text' => '<h2 class="text-primary text-center mb-4">அலகிடும் முறை - படிநிலைகள்</h2><ol class="fs-5 text-dark mt-3 lh-lg"><li><strong>அடியிலுள்ள சொற்களைக் கண்டறிதல்</strong> – கொடுக்கப்பட்ட செய்யுளில் இடம்பெறும் ஒவ்வொரு அடியிலும் உள்ள சொற்களை வாசித்துக் கண்டறியவும்.</li><li><strong>எழுத்துக்களைக் குறில் / நெடில் / ஒற்று என அடையாளம் காணல்</strong> – ஒவ்வொரு சொல்லிலும் இடம்பெறும் எழுத்துக்களைக் குறிலா நெடிலா, ஒற்று வருகிறதா எனப் பார்க்கவும். (<a href="javascript:void(0)" class="topic-link text-decoration-none fw-bold text-primary" data-topic="eluthu">எழுத்து பற்றி அறிய</a>)</li><li><strong>அசை பிரித்தல்</strong> – ஒவ்வோர் எழுத்துத் தொகுதியையும் அசையாகப் பிரிக்கவும். அசைகளை நேர் அல்லது நிரை என்று குறிப்பிடவும். (<a href="javascript:void(0)" class="topic-link text-decoration-none fw-bold text-primary" data-topic="asai">அசை பற்றி அறிய</a>)</li><li><strong>சீர்ப் பெயரிடுதல்</strong> – சொல்லில் இடம்பெறும் அசைகளின் அடிப்படையில் சீர்களைக் குறிப்பிடவும். (<a href="javascript:void(0)" class="topic-link text-decoration-none fw-bold text-primary" data-topic="seer">சீர் பற்றி அறிய</a>)</li><li><strong>அடி முழுவதையும் சீர்களாகப் பிரித்து, மொத்த அடியின் யாப்பு வகையை (வெண்பா/ஆசிரியப்பா/கலிப்பா/வஞ்சிப்பா) உறுதி செய்தல்</strong> – சீர்களைப் பிரித்த பின்னர் தளை குறிப்பிடவும். (<a href="javascript:void(0)" class="topic-link text-decoration-none fw-bold text-primary" data-topic="thalai">தளை பற்றி அறிய</a>)</li></ol>']],
                ['type' => 'practice', 'data' => ['topic' => 'alahidu', 'word' => 'அகழ்வாரைத்']]
            ];

            $c1Content = Content::updateOrCreate(
                ['title' => 'அலகிடும் முறை பாடம்'],
                [
                    'name' => 'அலகிடும் முறை பாடம்',
                    'text_content' => json_encode(['blocks' => $c1Blocks], JSON_UNESCAPED_UNICODE),
                    'is_active' => true,
                ]
            );

            DB::table('content_chapters')->updateOrInsert(
                ['chapter_id' => $c1->id, 'content_id' => $c1Content->id]
            );
        }

        // 2. Seed Alahiduthal Interactive Activities
        $alahiduthalChapter = $c1 ?? Chapter::where('name', 'LIKE', '%அலகிடும்%')->first();

        if ($alahiduthalChapter) {
            $alahiduActivities = [
                'alahidu_fill_table' => [
                    'title' => 'அலகிடும் அட்டவணையை நிரப்புக',
                    'type' => 'alahidu_fill_table',
                    'question' => 'கீழ்க்காணும் அலகிடும் அட்டவணையைச் சரியாக நிரப்புக:',
                    'rows' => [
                        [
                            'word' => ['value' => 'அகழ்வாரைத்', 'isMissing' => false],
                            'asai' => ['value' => 'நிரை / நேர் / நேர்', 'isMissing' => true],
                            'seer' => ['value' => 'புளிமாங்காய்', 'isMissing' => false]
                        ],
                        [
                            'word' => ['value' => 'தாங்கும்', 'isMissing' => false],
                            'asai' => ['value' => 'நேர் / நேர்', 'isMissing' => false],
                            'seer' => ['value' => 'தேமா', 'isMissing' => true]
                        ]
                    ]
                ],
                'alahidu_spot_error' => [
                    'title' => 'பிிழையைக் கண்டுபிடி',
                    'type' => 'alahidu_spot_error',
                    'question' => 'கீழ்க்காணும் அலகிடுதலில் உள்ள பிழையான சீர் / அசையைக் கண்டறிக:',
                    'items' => [
                        [
                            'id' => 1,
                            'word' => 'செல்வம்',
                            'asai' => 'நிரை / நேர்',
                            'seer' => 'புளிமா',
                            'isCorrect' => false,
                            'explanation' => 'செல் / வம் -> நேர் / நேர் (தேமா) என்பதே சரி. நிரை/நேர் என்பது தவறானது.'
                        ],
                        [
                            'id' => 2,
                            'word' => 'தாமரை',
                            'asai' => 'நேர் / நிரை',
                            'seer' => 'கூவிளம்',
                            'isCorrect' => true,
                            'explanation' => 'தா / மரை -> நேர் / நிரை (கூவிளம்) என்பது சரியான அலகிடுதல்.'
                        ]
                    ]
                ]
            ];

            Content::where('name', 'LIKE', '%அலகிடும் அட்டவணை%')
                ->orWhere('name', 'LIKE', '%பிழையைக் கண்டுபிடி%')
                ->get()
                ->each(function($oc) {
                    DB::table('content_chapters')->where('content_id', $oc->id)->delete();
                    $oc->delete();
                });

            foreach ($alahiduActivities as $key => $actData) {
                $block = [
                    'type' => 'activity',
                    'data' => $actData
                ];

                $content = Content::create([
                    'name'         => $actData['title'],
                    'title'        => $actData['title'],
                    'text_content' => json_encode(['blocks' => [$block]], JSON_UNESCAPED_UNICODE),
                    'is_active'    => true,
                ]);

                DB::table('content_chapters')->insert([
                    'chapter_id' => $alahiduthalChapter->id,
                    'content_id' => $content->id,
                ]);
            }
        }
    }
}
