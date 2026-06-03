<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Check if superadmin already exists
        if (!User::where('username', 'superadmin')->exists()) {
            User::create([
                'name' => 'Global Administrator',
                'username' => 'superadmin',
                'email' => 'admin@ariga.local',
                'password' => Hash::make('admin123'),
                'role' => 'super_admin',
                'tenant_id' => null,
            ]);
        }

        // Seed a default Tenant if none exists
        $tenant = \App\Models\Tenant::where('tenant_code', 'SCH-001')->first();
        if (!$tenant) {
            $tenant = \App\Models\Tenant::create([
                'tenant_code' => 'SCH-001',
                'tenant_name' => 'Ariga Public School',
                'contact_person' => 'Principal Office',
                'email' => 'contact@ariga.school',
                'is_active' => true,
                'primary_color' => '#7c3aed',
                'secondary_color' => '#db2777',
            ]);
        }

        // Seed Tenant Admin
        if (!User::where('username', 'schooladmin')->exists()) {
            User::create([
                'name' => 'School Admin',
                'username' => 'schooladmin',
                'email' => 'admin@ariga.school',
                'password' => Hash::make('admin123'),
                'role' => 'tenant_admin',
                'tenant_id' => $tenant->id,
            ]);
        }

        // Seed Property Manager (School Coordinator)
        if (!User::where('username', 'coordinator')->exists()) {
            User::create([
                'name' => 'School Coordinator',
                'username' => 'coordinator',
                'email' => 'manager@ariga.school',
                'password' => Hash::make('admin123'),
                'role' => 'property_manager',
                'tenant_id' => $tenant->id,
            ]);
        }

        // Seed Student
        if (!User::where('username', 'karthik_std')->exists()) {
            User::create([
                'name' => 'Karthik Student',
                'username' => 'karthik_std',
                'email' => null, // student uses zero-email
                'password' => Hash::make('student123'),
                'role' => 'student',
                'tenant_id' => $tenant->id,
            ]);
        }

        // Seed Course and associated Level, Chapter, Content, Assessments
        // Clean old data to prevent duplicates
        \DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        \DB::table('courses')->truncate();
        \DB::table('levels')->truncate();
        \DB::table('chapters')->truncate();
        \DB::table('contents')->truncate();
        \DB::table('assessments')->truncate();
        \DB::table('assessment_questions')->truncate();
        \DB::table('question_options')->truncate();
        \DB::table('course_package_levels')->truncate();
        \DB::table('level_chapter')->truncate();
        \DB::table('content_chapters')->truncate();
        \DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // Create Course
        $course = \App\Models\Course::create([
            'id' => 1,
            'name' => 'புறநானூறு (Purananuru)',
            'description' => 'புறநானூறு நூல் உரை - எட்டுத்தொகை சங்க இலக்கியம்',
            'is_active' => true,
        ]);

        // Create Level
        $level = \App\Models\Level::create([
            'id' => 1,
            'name' => 'அறிமுகம் & பாடல்கள் (Introduction & Poems)',
            'code' => 'CRS-LVL-001',
            'description' => 'புறநானூறு அறிமுகம் மற்றும் புகழ்பெற்ற யாதும் ஊரே பாடலின் விளக்கம்.',
            'estimated_hours' => 5.0,
            'sort_order' => 1,
            'is_active' => true,
        ]);

        // Map Level to Course and Package
        \DB::table('course_package_levels')->insert([
            'course_id' => $course->id,
            'package_id' => 1, // Default Package
            'level_id' => $level->id,
            'is_mandatory' => true,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Create Chapters
        $chapter1 = \App\Models\Chapter::create([
            'id' => 1,
            'name' => 'இயல் 1: புறநானூறு அறிமுகம் (Chapter 1: Intro)',
            'code' => 'CRS-CHP-001',
            'description' => 'புறநானூறு பற்றிய பொதுவான தகவல்கள் மற்றும் சங்க கால வரலாறு.',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $chapter2 = \App\Models\Chapter::create([
            'id' => 2,
            'name' => 'இயல் 2: யாதும் ஊரே யாவரும் கேளிர் (Chapter 2: Yadhum Oore)',
            'code' => 'CRS-CHP-002',
            'description' => 'கணியன் பூங்குன்றனார் பாடிய புகழ்பெற்ற புறநானூற்றுப் பாடல்.',
            'sort_order' => 2,
            'is_active' => true,
        ]);

        // Map Chapters to Level
        \DB::table('level_chapter')->insert([
            [
                'level_id' => $level->id,
                'chapter_id' => $chapter1->id,
                'sort_order' => 1,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'level_id' => $level->id,
                'chapter_id' => $chapter2->id,
                'sort_order' => 2,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        ]);

        // Create Contents (Topics) for Chapter 1
        $content1 = \App\Models\Content::create([
            'id' => 1,
            'name' => 'புறநானூறு நூல் குறிப்பு',
            'title' => 'புறநானூறு நூல் குறிப்பு (Introduction to Purananuru)',
            'text_content' => '<h3>புறநானூறு நூல் குறிப்பு</h3><p>புறநானூறு என்பது எட்டுத்தொகை நூல்களுள் ஒன்றாகும். இது புறப்பொருள் சார்பான நானүүறு பாடல்களைக் கொண்ட தொகுப்பாகும். சங்க காலத்தில் வாழ்ந்த பல்வேறு புலவர்களால் பாடப்பட்ட பாடல்களின் தொகுப்பாக விளங்கும் இந்நூல், அக்காலத் தமிழ் மக்களின் சமூக, பொருளாதார, அரசியல் மற்றும் வீர வாழ்க்கையைத் தத்ரூபமாகப் படம் பிடித்துக் காட்டுகிறது.</p><h4>முக்கிய சிறப்புகள்:</h4><ul><li><strong>நூல் வகை:</strong> சங்க இலக்கியம் (எட்டுத்தொகை)</li><li><strong>பாடல்கள்:</strong> 400 அகவற்பாக்கள்</li><li><strong>பொருள்:</strong> புறப்பொருள் (வீரம், கொடை, கல்வி, ஒழுக்கம், ஆட்சி முறை)</li></ul>',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $content2 = \App\Models\Content::create([
            'id' => 2,
            'name' => 'எட்டுத்தொகை நூல்கள்',
            'title' => 'எட்டுத்தொகை நூல்கள் யாவை? (The Eight Anthologies)',
            'text_content' => '<h3>எட்டுத்தொகை நூல்கள் யாவை?</h3><p>சங்க இலக்கியத் தொகுப்பில் உள்ள எட்டுத்தொகை நூல்கள் பின்வருமாறு:</p><ol><li>நற்றிணை</li><li>குறுந்தொகை</li><li>ஐங்குறுநூறு</li><li>பதிற்றுப்பத்து</li><li>பரிபாடல்</li><li>கலித்தொகை</li><li>அகநானூறு</li><li>புறநானூறு</li></ol>',
            'sort_order' => 2,
            'is_active' => true,
        ]);

        // Map Chapter 1 Contents
        \DB::table('content_chapters')->insert([
            ['content_id' => $content1->id, 'chapter_id' => $chapter1->id, 'created_at' => now(), 'updated_at' => now()],
            ['content_id' => $content2->id, 'chapter_id' => $chapter1->id, 'created_at' => now(), 'updated_at' => now()]
        ]);

        // Create Contents (Topics) for Chapter 2
        $content3 = \App\Models\Content::create([
            'id' => 3,
            'name' => 'கணியன் பூங்குன்றனார் குறிப்பு',
            'title' => 'புலவர் கணியன் பூங்குன்றனார் (Poet Kaniyan Poongundranar)',
            'text_content' => '<h3>புலவர் கணியன் பூங்குன்றனார்</h3><p>கணியன் பூங்குன்றனார் சங்க காலத்துத் தமிழ் புலவர்களில் ஒருவராவார். இவர் சிவகங்கை மாவட்டத்திலுள்ள மகிபாலன்பட்டி (பூங்குன்றம்) என்னும் ஊரில் பிறந்தவர். கணித அறிவில் சிறந்தவர் என்பதால் \'கணியன்\' என்ற அடைமொழியோடு அழைக்கப்படுகிறார். இவரது உலகளாவிய தத்துவப் பார்வை மற்றும் மனித நேயம் இன்றைய ஐக்கிய நாடுகள் சபையின் பொது அவையிலும் போற்றப்படுகிறது.</p>',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $content4 = \App\Models\Content::create([
            'id' => 4,
            'name' => 'யாதும் ஊரே பாடல் வரிகள்',
            'title' => 'யாதும் ஊரே பாடல் வரிகள் & விளக்கம் (Yadhum Oore Meaning)',
            'text_content' => '<h3>யாதும் ஊரே யாவரும் கேளிர்</h3><p>புறநானூற்றின் 192-வது பாடலான இப்பாடல், உலகப் பொதுமைக்கும் மனித நேயத்திற்கும் மிகச்சிறந்த எடுத்துக்காட்டாகும்.</p><blockquote style="border-left: 4px solid #7c3aed; padding-left: 15px; margin-left: 0; font-style: italic; color: #555; background: #f9f9f9; padding: 10px 15px; border-radius: 4px;">"யாதும் ஊரே யாவரும் கேளிர்;<br>தீதும் நன்றும் பிறர்தர வாரா;<br>நோதலும் தணிதலும் அவற்றோ ரன்ன;<br>சாதலும் புதுவது அன்றே;<br>வாழ்தல் இனிது என மகிழ்ந்தன்றும் இலமே..."</blockquote><p><strong>பாடல் விளக்கம்:</strong> உலகிலுள்ள எல்லா ஊர்களும் எமது ஊரே, அங்க வாழும் மக்கள் அனைவரும் எமது உறவினர்களே. நன்மையும் தீமையும் பிறரால் நமக்கு வருவதில்லை, அவை நமது செயல்களாலேயே வருகின்றன. துன்பமும் இன்பமும் இயற்கையானவையே...</p>',
            'sort_order' => 2,
            'is_active' => true,
        ]);

        // Map Chapter 2 Contents
        \DB::table('content_chapters')->insert([
            ['content_id' => $content3->id, 'chapter_id' => $chapter2->id, 'created_at' => now(), 'updated_at' => now()],
            ['content_id' => $content4->id, 'chapter_id' => $chapter2->id, 'created_at' => now(), 'updated_at' => now()]
        ]);

        // Create Assessment for Chapter 2
        $assessment = \App\Models\Assessment::create([
            'id' => 1,
            'level_id' => $level->id,
            'chapter_id' => $chapter2->id,
            'title' => 'யாதும் ஊரே கேளீர் தேர்வு (Yadhum Oore Assessment)',
            'description' => 'கணியன் பூங்குன்றனாரின் புறநானூறு பாடல் பற்றிய உங்கள் அறிவை சோதிக்கவும்.',
            'pass_percentage' => 75.0,
            'total_marks' => 30,
            'passing_marks' => 22,
            'duration_minutes' => 10,
            'is_mandatory' => true,
            'allow_restart' => true,
            'review_mode' => 'instant',
            'activity_type' => 'quiz',
            'prelude_content' => '<p>இந்த தேர்வில் மொத்தம் 3 கேள்விகள் உள்ளன. அனைத்து கேள்விகளுக்கும் பதிலளிக்கவும்.</p>',
            'is_active' => true,
        ]);

        // Questions for Assessment
        $q1 = \App\Models\AssessmentQuestion::create([
            'id' => 1,
            'assessment_id' => $assessment->id,
            'question_text' => '"யாதும் ஊரே யாவரும் கேளிர்" என்ற பாடலைப் பாடியவர் யார்?',
            'question_type' => 'multiple_choice',
            'sort_order' => 1,
        ]);

        \App\Models\QuestionOption::insert([
            ['question_id' => $q1->id, 'option_text' => 'கபிலர்', 'is_correct' => false, 'sort_order' => 1],
            ['question_id' => $q1->id, 'option_text' => 'பரணர்', 'is_correct' => false, 'sort_order' => 2],
            ['question_id' => $q1->id, 'option_text' => 'கணியன் பூங்குன்றனார்', 'is_correct' => true, 'sort_order' => 3],
            ['question_id' => $q1->id, 'option_text' => 'ஔவையார்', 'is_correct' => false, 'sort_order' => 4],
        ]);

        $q2 = \App\Models\AssessmentQuestion::create([
            'id' => 2,
            'assessment_id' => $assessment->id,
            'question_text' => 'கணியன் பூங்குன்றனார் பிறந்த ஊர் எது?',
            'question_type' => 'multiple_choice',
            'sort_order' => 2,
        ]);

        \App\Models\QuestionOption::insert([
            ['question_id' => $q2->id, 'option_text' => 'மதுரை', 'is_correct' => false, 'sort_order' => 1],
            ['question_id' => $q2->id, 'option_text' => 'பூங்குன்றம் (மகிபாலன்பட்டி)', 'is_correct' => true, 'sort_order' => 2],
            ['question_id' => $q2->id, 'option_text' => 'பூம்புகார்', 'is_correct' => false, 'sort_order' => 3],
            ['question_id' => $q2->id, 'option_text' => 'உறையூர்', 'is_correct' => false, 'sort_order' => 4],
        ]);

        $q3 = \App\Models\AssessmentQuestion::create([
            'id' => 3,
            'assessment_id' => $assessment->id,
            'question_text' => 'புறநானூறு எந்த சங்க இலக்கியத் தொகுப்பைச் சேர்ந்தது?',
            'question_type' => 'multiple_choice',
            'sort_order' => 3,
        ]);

        \App\Models\QuestionOption::insert([
            ['question_id' => $q3->id, 'option_text' => 'பத்துப்பாட்டு', 'is_correct' => false, 'sort_order' => 1],
            ['question_id' => $q3->id, 'option_text' => 'எட்டுத்தொகை', 'is_correct' => true, 'sort_order' => 2],
            ['question_id' => $q3->id, 'option_text' => 'பதினெண்கீழ்க்கணக்கு', 'is_correct' => false, 'sort_order' => 3],
            ['question_id' => $q3->id, 'option_text' => 'இரட்டைக் காப்பியங்கள்', 'is_correct' => false, 'sort_order' => 4],
        ]);
    }
}
