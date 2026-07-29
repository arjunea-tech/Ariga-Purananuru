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

        // 1. Create the Activity Record
        $activity = Activity::updateOrCreate(
            ['title' => 'யாப்பு சீர் விளையாட்டு'],
            [
                'type' => 'yappu_seer',
                'data_json' => $payload
            ]
        );

        // 2. Create the Editor.js Content Block referencing the Activity
        $editorContent = [
            'time' => time() * 1000,
            'blocks' => [
                [
                    'id' => uniqid(),
                    'type' => 'activity',
                    'data' => [
                        'type' => 'activity_reference',
                        'activityReferenceId' => $activity->id
                    ]
                ]
            ],
            'version' => '2.28.2'
        ];

        // 3. Create the Content Record
        Content::updateOrCreate(
            ['name' => 'Yappu Seer Master Data'],
            [
                'text_content' => json_encode($editorContent, JSON_UNESCAPED_UNICODE),
                'is_active' => true,
                'sort_order' => 0
            ]
        );
        
        $this->command->info('Yappu Seer dynamic content seeded successfully as Activity and Content!');
    }
}
