<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Content;
use App\Models\Activity;

class YappuSeerActivitySeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $payload = [
            'seers_2' => [
                [ 'name' => 'தேமா', 'pattern' => ['நேர்', 'நேர்'], 'mnemonic' => 'தே=நேர், மா=நேர்', 'fruit' => '🥭' ],
                [ 'name' => 'புளிமா', 'pattern' => ['நிரை', 'நேர்'], 'mnemonic' => 'புளி=நிரை, மா=நேர்', 'fruit' => '🍋' ],
                [ 'name' => 'கூவிளம்', 'pattern' => ['நேர்', 'நிரை'], 'mnemonic' => 'கூ=நேர், விளம்=நிரை', 'fruit' => '🍈' ],
                [ 'name' => 'கருவிளம்', 'pattern' => ['நிரை', 'நிரை'], 'mnemonic' => 'கரு=நிரை, விளம்=நிரை', 'fruit' => '🫐' ],
            ],
            'seers_3' => [
                [ 'name' => 'தேமாங்காய்', 'pattern' => ['நேர்', 'நேர்', 'நேர்'], 'mnemonic' => 'நேர் நேர் நேர்', 'fruit' => '🥭' ],
                [ 'name' => 'புளிமாங்காய்', 'pattern' => ['நிரை', 'நேர்', 'நேர்'], 'mnemonic' => 'நிரை நேர் நேர்', 'fruit' => '🍋' ],
                [ 'name' => 'கூவிளங்காய்', 'pattern' => ['நேர்', 'நிரை', 'நேர்'], 'mnemonic' => 'நேர் நிரை நேர்', 'fruit' => '🍈' ],
                [ 'name' => 'கருவிளங்காய்', 'pattern' => ['நிரை', 'நிரை', 'நேர்'], 'mnemonic' => 'நிரை நிரை நேர்', 'fruit' => '🫐' ],
                [ 'name' => 'தேமாங்கனி', 'pattern' => ['நேர்', 'நேர்', 'நிரை'], 'mnemonic' => 'நேர் நேர் நிரை', 'fruit' => '🥭' ],
                [ 'name' => 'புளிமாங்கனி', 'pattern' => ['நிரை', 'நேர்', 'நிரை'], 'mnemonic' => 'நிரை நேர் நிரை', 'fruit' => '🍋' ],
                [ 'name' => 'கூவிளங்கனி', 'pattern' => ['நேர்', 'நிரை', 'நிரை'], 'mnemonic' => 'நேர் நிரை நிரை', 'fruit' => '🍈' ],
                [ 'name' => 'கருவிளங்கனி', 'pattern' => ['நிரை', 'நிரை', 'நிரை'], 'mnemonic' => 'நிரை நிரை நிரை', 'fruit' => '🫐' ],
            ]
        ];

        // 1. Create the Match Activity
        $matchActivity = Activity::updateOrCreate(
            ['title' => 'சீர்ப் புதிர்'],
            [
                'type' => 'yappu_seer_match',
                'data_json' => $payload
            ]
        );

        // 2. Create the Build Activity
        $buildActivity = Activity::updateOrCreate(
            ['title' => 'அசைக்கல் கோபுரம்'],
            [
                'type' => 'yappu_seer_build',
                'data_json' => $payload
            ]
        );

        // 3. Create the Basket Activity
        $basketActivity = Activity::updateOrCreate(
            ['title' => 'சீர் கூடை'],
            [
                'type' => 'yappu_seer_basket',
                'data_json' => $payload
            ]
        );

        // 4. Find the 'சீர்' Chapter
        $chapter = \App\Models\Chapter::where('name', 'LIKE', '%சீர்%')->first();
        if (!$chapter) {
            $chapter = \App\Models\Chapter::first();
        }

        // 5. Create the Content Record for Match
        $matchContent = Content::updateOrCreate(
            ['name' => 'சீர்ப் புதிர்'],
            [
                'title' => 'சீர்ப் புதிர்',
                'text_content' => json_encode([
                    'time' => time() * 1000,
                    'blocks' => [
                        [
                            'id' => uniqid(),
                            'type' => 'activity',
                            'data' => [
                                'type' => 'activity_reference',
                                'activityReferenceId' => $matchActivity->id,
                                'level' => 0 // Level 0 means All Seers
                            ]
                        ]
                    ],
                    'version' => '2.28.2'
                ], JSON_UNESCAPED_UNICODE),
                'is_active' => true,
                'sort_order' => 10
            ]
        );

        // 6. Create the Content Record for Build
        $buildContent = Content::updateOrCreate(
            ['name' => 'அசைக்கல் கோபுரம்'],
            [
                'title' => 'அசைக்கல் கோபுரம்',
                'text_content' => json_encode([
                    'time' => time() * 1000,
                    'blocks' => [
                        [
                            'id' => uniqid(),
                            'type' => 'activity',
                            'data' => [
                                'type' => 'activity_reference',
                                'activityReferenceId' => $buildActivity->id,
                                'level' => 0 // Level 0 means All Seers
                            ]
                        ]
                    ],
                    'version' => '2.28.2'
                ], JSON_UNESCAPED_UNICODE),
                'is_active' => true,
                'sort_order' => 11
            ]
        );

        // 7. Create the Content Record for Basket
        $basketContent = Content::updateOrCreate(
            ['name' => 'சீர் கூடை'],
            [
                'title' => 'சீர் கூடை',
                'text_content' => json_encode([
                    'time' => time() * 1000,
                    'blocks' => [
                        [
                            'id' => uniqid(),
                            'type' => 'activity',
                            'data' => [
                                'type' => 'activity_reference',
                                'activityReferenceId' => $basketActivity->id,
                                'level' => 0 // Level 0 means All Seers
                            ]
                        ]
                    ],
                    'version' => '2.28.2'
                ], JSON_UNESCAPED_UNICODE),
                'is_active' => true,
                'sort_order' => 12
            ]
        );

        // 8. Link to Chapter
        if ($chapter) {
            \Illuminate\Support\Facades\DB::table('content_chapters')->updateOrInsert(
                ['content_id' => $matchContent->id, 'chapter_id' => $chapter->id]
            );
            \Illuminate\Support\Facades\DB::table('content_chapters')->updateOrInsert(
                ['content_id' => $buildContent->id, 'chapter_id' => $chapter->id]
            );
            \Illuminate\Support\Facades\DB::table('content_chapters')->updateOrInsert(
                ['content_id' => $basketContent->id, 'chapter_id' => $chapter->id]
            );
        }


        
        $this->command->info('Yappu Seer games seeded and mapped to chapter successfully!');
    }
}
