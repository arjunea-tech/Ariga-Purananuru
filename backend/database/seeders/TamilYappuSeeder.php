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
        // 1. Find the user's existing Tamil course
        $course = Course::where('name', 'LIKE', '%அழகுத் தமிழ் யாப்பு%')->first();
        
        if (!$course) {
            echo "Course 'அழகுத் தமிழ் யாப்பு (யாப்பிலக்கணம்)' not found!\n";
            return;
        }

        // 2. Delete ALL existing levels, chapters, contents for this course to start fresh
        $this->deleteCourseContents($course);

        $uniqueSuffix = time();

        // 3. Define EXACTLY 3 Topics: Eluthu, Asai, Seer
        $topics = [
            [
                'name' => 'Eluthu',
                'title' => 'எழுத்து',
                'topic' => 'eluthu',
                'reading_html' => '<h2 class="text-primary text-center mb-4">எழுத்து இலக்கணம்</h2><p>யாப்பிலக்கணத்தில் எழுத்துகள் மிக முக்கியமானவை. இவை <strong>குறில், நெடில், மெய் (ஒற்று), ஆய்தம்</strong> என வகைப்படுத்தப்படுகின்றன.</p><ul><li><strong>குறில்:</strong> அ, இ, உ, எ, ஒ (1 மாத்திரை)</li><li><strong>நெடில்:</strong> ஆ, ஈ, ஊ, ஏ, ஐ, ஓ, ஔ (2 மாத்திரை)</li><li><strong>மெய் மற்றும் ஆய்தம்:</strong> க், ச், ட்... ஃ (1/2 மாத்திரை)</li></ul><p>அசையைப் பிரிக்கும் போது ஒற்றெழுத்துகள் (மெய், ஆய்தம்) கணக்கில் எடுத்துக்கொள்ளப்பட்டாலும், அவை மாத்திரைக்கு மட்டுமே உதவும். அசையின் தன்மையை குறில், நெடில் எழுத்துகளே தீர்மானிக்கின்றன.</p>',
                'activity_q' => 'நெடில் எழுத்துகளுக்கு எத்தனை மாத்திரை?',
                'activity_opts' => ['1 மாத்திரை', '2 மாத்திரை', '1/2 மாத்திரை', '3 மாத்திரை'],
                'activity_ans' => '2 மாத்திரை',
                'assessment_q' => 'கீழ்க்கண்டவற்றுள் எது மெய்யெழுத்து அல்ல?',
                'assessment_opts' => ['க்', 'ச்', 'அ', 'த்'],
                'assessment_ans' => 'அ',
                'practice_word' => 'கல்வி'
            ],
            [
                'name' => 'Asai',
                'title' => 'அசை',
                'topic' => 'asai',
                'reading_html' => '<h2 class="text-primary text-center mb-4">அசை இலக்கணம்</h2><p>எழுத்துகளால் ஆனது அசை எனப்படும். அசை இரண்டு வகைப்படும்: <strong>நேரசை, நிரையசை.</strong></p><h4>நேரசை:</h4><ul><li>தனிக்குறில் (எ.கா: க)</li><li>தனிக்குறில் ஒற்று (எ.கா: கல்)</li><li>தனிநெடில் (எ.கா: கா)</li><li>தனிநெடில் ஒற்று (எ.கா: கால்)</li></ul><h4>நிரையசை:</h4><ul><li>இணைக்குறில் (எ.கா: பல)</li><li>இணைக்குறில் ஒற்று (எ.கா: பலக்)</li><li>குறில் நெடில் (எ.கா: கனா)</li><li>குறில் நெடில் ஒற்று (எ.கா: கனாத்)</li></ul>',
                'activity_q' => 'தனிக்குறில் ஒற்று (எ.கா: கல்) - இது எந்த அசை?',
                'activity_opts' => ['நேரசை', 'நிரையசை', 'நேர்பு', 'நிரைபு'],
                'activity_ans' => 'நேரசை',
                'assessment_q' => 'இணைக்குறில் ஒற்று (எ.கா: பலக்) - இது என்ன அசை?',
                'assessment_opts' => ['நேரசை', 'நிரையசை', 'நேர்பு', 'நிரைபு'],
                'assessment_ans' => 'நிரையசை',
                'practice_word' => 'அகழ்வாரைத்'
            ],
            [
                'name' => 'Seer',
                'title' => 'சீர்',
                'topic' => 'seer',
                'reading_html' => '<h2 class="text-primary text-center mb-4">சீர் இலக்கணம்</h2><p>அசைகள் பல சேர்ந்து அமைவது சீர் ஆகும். இது நான்கு வகைப்படும்: ஓரசைச்சீர், ஈரசைச்சீர், மூவசைச்சீர், நாலசைச்சீர்.</p><h4>ஈரசைச்சீர் (ஆசிரியப்பா):</h4><ul><li>நேர் நேர் = தேமா</li><li>நிரை நேர் = புளிமா</li><li>நிரை நிரை = கருவிளம்</li><li>நேர் நிரை = கூவிளம்</li></ul><h4>மூவசைச்சீர் (வெண்பா):</h4><p>ஈரசைச்சீர்களுடன் முடிவில் <strong>நேர்</strong> சேர்ந்தால் அது "காய்" சீர் ஆகும். (எ.கா: தேமா + காய் = தேமாங்காய்).</p>',
                'activity_q' => '"நிரை நேர்" - இது எந்தச் சீரைக் குறிக்கும்?',
                'activity_opts' => ['புளிமா', 'தேமா', 'கருவிளம்', 'கூவிளம்'],
                'activity_ans' => 'புளிமா',
                'assessment_q' => '"நேர் நேர் நேர்" - இது என்ன சீர்?',
                'assessment_opts' => ['தேமாங்காய்', 'புளிமாங்காய்', 'தேமாங்கனி', 'கருவிளங்காய்'],
                'assessment_ans' => 'தேமாங்காய்',
                'practice_word' => 'தேமாங்காய்'
            ]
        ];

        foreach ($topics as $index => $topicData) {
            // Level
            $level = Level::create([
                'name' => $topicData['title'],
                'code' => 'YAP-L' . ($index + 1) . '-' . $uniqueSuffix,
                'description' => 'Mastering ' . $topicData['title'],
                'sort_order' => $index + 1,
                'is_active' => true,
            ]);

            DB::table('course_package_levels')->insert([
                'course_id' => $course->id,
                'package_id' => 1, 
                'level_id' => $level->id,
                'is_active' => true,
            ]);

            // Chapter
            $chapter = Chapter::create([
                'name' => 'அத்தியாயம் 1: ' . $topicData['title'],
                'code' => 'YAP-L' . ($index + 1) . '-C1-' . $uniqueSuffix,
                'description' => $topicData['title'] . ' பற்றி அறிவோம்',
                'sort_order' => 1,
                'is_active' => true,
            ]);

            DB::table('level_chapter')->insert([
                'level_id' => $level->id,
                'chapter_id' => $chapter->id,
                'is_active' => true,
            ]);

            // Helper to format options correctly for ActivityRenderer MCQData
            $formatOptions = function($optionsArr, $ans) {
                $opts = [];
                foreach ($optionsArr as $idx => $opt) {
                    $opts[] = [
                        'id' => $idx + 1,
                        'text' => $opt,
                        'isCorrect' => ($opt === $ans)
                    ];
                }
                return $opts;
            };

            // Create REAL Activity (Normal)
            $activity = Activity::create([
                'title' => $topicData['title'] . ' பயிற்சி',
                'type' => 'mcq',
                'data_json' => [
                    'question' => $topicData['activity_q'],
                    'options' => $formatOptions($topicData['activity_opts'], $topicData['activity_ans'])
                ],
            ]);

            // Create Assessment (Boss Challenge)
            $assessment = Activity::create([
                'title' => $topicData['title'] . ' தேர்வு',
                'type' => 'mcq',
                'data_json' => [
                    'question' => $topicData['assessment_q'],
                    'options' => $formatOptions($topicData['assessment_opts'], $topicData['assessment_ans'])
                ],
            ]);

            // Content JSON Block building (REMOVED PDF AS REQUESTED)
            $contentBlocks = [
                // 1. Reading Content (Dynamic HTML)
                [
                    'type' => 'paragraph',
                    'data' => [
                        'text' => $topicData['reading_html']
                    ]
                ],
                // 2. Practice Mode
                [
                    'type' => 'practice',
                    'data' => [
                        'topic' => $topicData['topic'],
                        'word' => $topicData['practice_word']
                    ]
                ],
                // 3. Activity
                [
                    'type' => 'activity',
                    'data' => array_merge([
                        'id' => $activity->id,
                        'type' => 'mcq',
                    ], $activity->data_json)
                ],
                // 4. Assessment
                [
                    'type' => 'assessment',
                    'data' => array_merge([
                        'id' => $assessment->id,
                        'type' => 'mcq',
                    ], $assessment->data_json)
                ]
            ];

            $content = Content::create([
                'name' => $topicData['title'] . ' பாடம்',
                'title' => $topicData['title'] . ' பாடம்',
                'text_content' => json_encode(['blocks' => $contentBlocks]),
                'is_active' => true,
            ]);

            DB::table('content_chapters')->insert([
                'chapter_id' => $chapter->id,
                'content_id' => $content->id,
            ]);
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
            // Optional: delete from pivot tables if cascading doesn't work automatically
            DB::table('course_package_levels')->where('level_id', $level->id)->delete();
            $level->delete();
        }
    }
}
