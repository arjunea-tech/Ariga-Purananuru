<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Course;
use App\Models\Level;
use App\Models\Chapter;
use App\Models\Content;
use App\Models\Activity;
use Illuminate\Support\Facades\DB;

class TamilYappuSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $course = Course::where('name', 'LIKE', '%அழகுத் தமிழ் யாப்பு%')->first();
        
        if (!$course) {
            $course = Course::create([
                'name' => 'அழகுத் தமிழ் யாப்பு (யாப்பிலக்கணம்)',
                'description' => 'தமிழ் செய்யுள் இயற்றுவதற்கான யாப்பிலக்கணப் பாடநெறி',
                'is_active' => true,
            ]);
        }

        $package = \App\Models\Package::firstOrCreate(
            ['code' => 'PKG-001'],
            [
                'name' => 'Standard Package',
                'description' => 'Default Tamil Learning Package',
                'is_active' => true,
            ]
        );

        $this->deleteCourseContents($course);
        $uniqueSuffix = time();

        $levelsData = [
            0 => [
                'title' => 'யாப்பு - அறிமுகம்',
                'topic' => 'yappu_intro',
                'chapters' => [
                    0 => [
                        'title' => 'அறிமுகம்',
                        'reading_pages' => [
                            '<h2 class="text-primary text-center mb-4">யாப்பு - அறிமுகம்</h2><p>யாப்பிலக்கணம் என்பது தமிழின் செய்யுள் (மரபுக்கவிதை) எழுதுவதற்கான இலக்கணத்தை விளக்குகிறது. இதை அறிந்து கொள்வதால், செய்யுள் எழுதுவதற்கான அடிப்படை விதிகளைப் புரிந்து கொள்ள முடியும்.</p>',
                            '<h2 class="text-primary text-center mb-4">யாப்பின் உறுப்புகள்</h2><p>யாப்பின் உறுப்புகள் ஆறு வகைப்படும். அவை பின்வருமாறு:</p><ol class="fs-5 text-dark mt-3"><li><strong> எழுத்து</strong></li><li><strong> அசை</strong></li><li><strong> சீர்</strong></li><li><strong> தளை</strong></li><li><strong> அடி</strong></li><li><strong> தொடை</strong></li></ol>'
                        ]
                    ]
                ]
            ],
            1 => [
                'title' => 'எழுத்து',
                'topic' => 'eluthu',
                'chapters' => [
                    0 => ['title' => 'அடிப்படை எழுத்துக்கள்'],
                    1 => ['title' => 'சிறப்பு எழுத்துக்கள்']
                ]
            ],
            2 => [
                'title' => 'அசை',
                'topic' => 'asai',
                'chapters' => [
                    0 => ['title' => 'அசை மற்றும் நேரசை'],
                    1 => ['title' => 'நிரையசை'],
                    2 => ['title' => 'அசை பிரித்தல் பயிற்சி']
                ]
            ],
            3 => [
                'title' => 'சீர்',
                'topic' => 'seer',
                'chapters' => [
                    0 => ['title' => 'சீர் மற்றும் ஓரசைச் சீர்கள்'],
                    1 => ['title' => 'ஈரசைச் சீர்கள்'],
                    2 => ['title' => 'மூவசைச் சீர்கள்'],
                    3 => ['title' => 'நாலசைச் சீர்கள்']
                ]
            ],
            4 => [
                'title' => 'தளை',
                'topic' => 'thalai',
                'chapters' => [
                    0 => ['title' => 'தளை அறிமுகம் & விதிகள்'],
                    1 => ['title' => 'தளையின் வாய்பாடுகள்'],
                    2 => ['title' => 'சான்றுடன் தளை கண்டறிதல்']
                ]
            ],
            5 => [
                'title' => 'அலகிடுதல்',
                'topic' => 'alahidu',
                'chapters' => [
                    0 => ['title' => 'அலகிடும் முறை']
                ]
            ]
        ];

        foreach ($levelsData as $lIndex => $levelData) {
            $level = Level::create([
                'name' => $levelData['title'],
                'code' => 'YAP-L' . ($lIndex + 1) . '-' . $uniqueSuffix,
                'description' => 'Mastering ' . $levelData['title'],
                'sort_order' => $lIndex + 1,
                'is_active' => true,
            ]);

            DB::table('course_package_levels')->insert([
                'course_id' => $course->id,
                'package_id' => $package->id, 
                'level_id' => $level->id,
                'is_active' => true,
            ]);

            foreach ($levelData['chapters'] as $cIndex => $chapterData) {
                $chapter = Chapter::create([
                    'name' => 'அத்தியாயம் ' . ($cIndex + 1) . ': ' . $chapterData['title'],
                    'code' => $level->code . '-C' . ($cIndex + 1),
                    'description' => $chapterData['title'] . ' பற்றி அறிவோம்',
                    'sort_order' => $cIndex + 1,
                    'is_active' => true,
                ]);

                DB::table('level_chapter')->insert([
                    'level_id' => $level->id,
                    'chapter_id' => $chapter->id,
                    'is_active' => true,
                ]);

                $contentBlocks = [];

                if (isset($chapterData['reading_pages'])) {
                    foreach ($chapterData['reading_pages'] as $pageHtml) {
                        $contentBlocks[] = [
                            'type' => 'paragraph',
                            'data' => [
                                'text' => $pageHtml
                            ]
                        ];
                    }
                }

                if (!empty($contentBlocks)) {
                    $content = Content::create([
                        'name' => $chapterData['title'] . ' பாடம்',
                        'title' => $chapterData['title'] . ' பாடம்',
                        'text_content' => json_encode(['blocks' => $contentBlocks], JSON_UNESCAPED_UNICODE),
                        'is_active' => true,
                    ]);

                    DB::table('content_chapters')->insert([
                        'chapter_id' => $chapter->id,
                        'content_id' => $content->id,
                    ]);
                }
            }
        }
    }

    private function deleteCourseContents($course) {
        $levels = $course->levels;
        foreach ($levels as $level) {
            $chapters = $level->chapters;
            foreach ($chapters as $chapter) {
                $contents = $chapter->contents;
                foreach ($contents as $content) {
                    $content->delete();
                }
                $chapter->delete();
            }
            DB::table('course_package_levels')->where('level_id', $level->id)->delete();
            $level->delete();
        }
    }
}
