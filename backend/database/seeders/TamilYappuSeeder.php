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
  0 => 
  [
    'title' => 'யாப்பு - அறிமுகம்',
    'topic' => 'yappu_intro',
    'chapters' => 
    [
      0 => 
      [
        'title' => 'அறிமுகம்',
        'reading_pages' => [
          '<h2 class="text-primary text-center mb-4">யாப்பு - அறிமுகம்</h2><p>யாப்பிலக்கணம் என்பது தமிழின் செய்யுள் (மரபுக்கவிதை) எழுதுவதற்கான இலக்கணத்தை விளக்குகிறது. இதை அறிந்து கொள்வதால், செய்யுள் எழுதுவதற்கான அடிப்படை விதிகளைப் புரிந்து கொள்ள முடியும்.</p>',
          '<h2 class="text-primary text-center mb-4">யாப்பின் உறுப்புகள்</h2><p>யாப்பின் உறுப்புகள் ஆறு வகைப்படும். அவை பின்வருமாறு:</p><ol class="fs-5 text-dark mt-3"><li><strong> எழுத்து</strong></li><li><strong> அசை</strong></li><li><strong> சீர்</strong></li><li><strong> தளை</strong></li><li><strong> அடி</strong></li><li><strong> தொடை</strong></li></ol>'
        ]
      ]
    ]
  ],
  1 => 
  [
    'title' => 'எழுத்து',
    'topic' => 'eluthu',
    'chapters' => 
    [
      0 => 
      [
        'title' => 'அடிப்படை எழுத்துக்கள்',
        'reading_pages' => [
          '<h2 class="text-primary text-center mb-4">எழுத்து</h2>
<p class="fs-5">அசைக்கு அடிப்படை உறுப்பாக எழுத்து அமைகிறது.</p>
<div class="alert alert-warning border-start border-4 border-warning my-3 p-3 text-start">
  <p class="mb-0 fw-bold">“எழுதப்படுதலின் எழுத்தே” என்று இலக்கண விளக்கம் எழுத்தினைக் குறிப்பிடுகிறது.</p>
</div>
<p class="fs-5 text-dark">ஒலியினை வடிவமாக்கிக் காட்ட உதவுவதே <strong>எழுத்து</strong> ஆகும்.</p>',
          '<h2 class="text-primary text-center mb-4">மாத்திரை</h2>
<p class="fs-5">ஒலியின் அளவினைத் தமிழ் மொழியில் <strong>மாத்திரை</strong> என்று குறிப்பிடுவர்.</p>
<div class="alert alert-info border-start border-4 border-info my-3 p-3 text-start">
  <p class="mb-0 fw-bold">மாத்திரை என்பது மனிதன் இயல்பாகக் கண்ணிமைக்கும் நொடி அல்லது கை நொடிக்கும் நொடி ஆகும்.</p>
</div>
<p class="fs-5 text-dark">ஒரு முறை கண்ணிமைக்கும் நேரம் அல்லது ஒரு முறை கை நொடிக்கும் நேரம் ஒரு மாத்திரை எனப்படும்.</p>',
          '<h2 class="text-primary text-center mb-4">எழுத்துக்களின் வகைகள்</h2>
<p class="fs-5">எழுத்துக்களின் வகைகளை மூன்றாகப் பிரித்து அறிந்து கொள்வது அசை பிரிக்க அடிப்படையான தகுதி ஆகும்.</p>
<div class="row justify-content-center mt-3">
  <div class="col-12">
    <div class="list-group">
      <div class="list-group-item list-group-item-action d-flex align-items-center gap-3 p-3">
        <span class="badge bg-primary fs-6 rounded-circle px-2 py-1">1</span>
        <div><strong class="fs-5">குறில்</strong> (குறுகிய ஒலி - 1 மாத்திரை)</div>
      </div>
      <div class="list-group-item list-group-item-action d-flex align-items-center gap-3 p-3">
        <span class="badge bg-success fs-6 rounded-circle px-2 py-1">2</span>
        <div><strong class="fs-5">நெடில்</strong> (நீண்ட ஒலி - 2 மாத்திரை)</div>
      </div>
      <div class="list-group-item list-group-item-action d-flex align-items-center gap-3 p-3">
        <span class="badge bg-warning text-dark fs-6 rounded-circle px-2 py-1">3</span>
        <div><strong class="fs-5">மெய் / ஒற்று</strong> (புள்ளி எழுத்து - ½ மாத்திரை)</div>
      </div>
    </div>
  </div>
</div>',
          '<h2 class="text-primary text-center mb-4">1. குறில் (பகுதி 1)</h2>
<p class="fs-6">ஒரு மாத்திரை அளவுடைய எழுத்துக்கள் குறில் எழுத்துக்கள் ஆகும். அ இ உ எ ஒ ஆகிய ஐந்து உயிர் எழுத்துக்களும் உயிர்க்குறில் ஆகும்.</p>
<p class="fw-bold text-success text-center">உயிர்க் குறில் – அ இ உ எ ஒ</p>
<h5 class="mt-3 mb-2 text-primary text-center">உயிர்மெய் குறில் (க் - ப்)</h5>
<div class="table-responsive">
  <table class="table table-bordered table-striped text-center align-middle" style="font-size: 0.8rem;">
    <thead class="bg-light">
      <tr><th></th><th>அ</th><th>இ</th><th>உ</th><th>எ</th><th>ஒ</th></tr>
    </thead>
    <tbody>
      <tr><th>க்</th><td>க</td><td>கி</td><td>கு</td><td>கெ</td><td>கொ</td></tr>
      <tr><th>ங்</th><td>ங</td><td>ஙி</td><td>ஙு</td><td>ஙெ</td><td>ஙொ</td></tr>
      <tr><th>ச்</th><td>ச</td><td>சி</td><td>சு</td><td>செ</td><td>சொ</td></tr>
      <tr><th>ஞ்</th><td>ஞ</td><td>ஞி</td><td>ஞு</td><td>ஞெ</td><td>ஞொ</td></tr>
      <tr><th>ட்</th><td>ட</td><td>டி</td><td>டு</td><td>டெ</td><td>டொ</td></tr>
      <tr><th>ண்</th><td>ண</td><td>ணி</td><td>ணு</td><td>ணெ</td><td>ணொ</td></tr>
      <tr><th>த்</th><td>த</td><td>தி</td><td>து</td><td>தெ</td><td>தொ</td></tr>
      <tr><th>ந்</th><td>ந</td><td>நி</td><td>நு</td><td>நெ</td><td>நொ</td></tr>
      <tr><th>ப்</th><td>ப</td><td>பி</td><td>பு</td><td>பெ</td><td>பொ</td></tr>
    </tbody>
  </table>
</div>',
          '<h2 class="text-primary text-center mb-4">1. குறில் (பகுதி 2)</h2>
<p class="fs-6">மெய் எழுத்துக்கள் உயிர் எழுத்துக்களுடன் கூடி உயிர்மெய்க்குறில் எழுத்துக்கள் உருவாகும்.</p>
<h5 class="mt-3 mb-2 text-primary text-center">உயிர்மெய் குறில் (ம் - ன்)</h5>
<div class="table-responsive">
  <table class="table table-bordered table-striped text-center align-middle" style="font-size: 0.8rem;">
    <thead class="bg-light">
      <tr><th></th><th>அ</th><th>இ</th><th>உ</th><th>எ</th><th>ஒ</th></tr>
    </thead>
    <tbody>
      <tr><th>ம்</th><td>ம</td><td>மி</td><td>மு</td><td>மெ</td><td>மொ</td></tr>
      <tr><th>ய்</th><td>ய</td><td>யி</td><td>யு</td><td>யெ</td><td>யொ</td></tr>
      <tr><th>ர்</th><td>ர</td><td>ரி</td><td>ரு</td><td>ரெ</td><td>ரொ</td></tr>
      <tr><th>ல்</th><td>ல</td><td>லி</td><td>லு</td><td>லெ</td><td>லொ</td></tr>
      <tr><th>வ்</th><td>வ</td><td>வி</td><td>வு</td><td>வெ</td><td>வொ</td></tr>
      <tr><th>ழ்</th><td>ழ</td><td>ழி</td><td>ழு</td><td>ழெ</td><td>ழொ</td></tr>
      <tr><th>ள்</th><td>ள</td><td>ளி</td><td>ளு</td><td>ளெ</td><td>ளொ</td></tr>
      <tr><th>ற்</th><td>ற</td><td>றி</td><td>று</td><td>றெ</td><td>றொ</td></tr>
      <tr><th>ன்</th><td>ன</td><td>னி</td><td>னு</td><td>னெ</td><td>னொ</td></tr>
    </tbody>
  </table>
</div>',
          '<h2 class="text-primary text-center mb-4">2. நெடில் (பகுதி 1)</h2>
<p class="fs-6">இரண்டு மாத்திரை அளவுடைய எழுத்துக்கள் நெடில் எழுத்துக்கள் ஆகும். ஆ ஈ ஊ ஏ ஐ ஓ ஔ ஆகிய ஏழு உயிர் எழுத்துக்களும் உயிர்நெடில் ஆகும்.</p>
<p class="fw-bold text-danger text-center">உயிர் நெடில் - ஆ ஈ ஊ ஏ ஐ ஓ ஔ</p>
<h5 class="mt-3 mb-2 text-primary text-center">உயிர்மெய் நெடில் (க் - ப்)</h5>
<div class="table-responsive">
  <table class="table table-bordered table-striped text-center align-middle" style="font-size: 0.75rem;">
    <thead class="bg-light">
      <tr><th></th><th>ஆ</th><th>ஈ</th><th>ஊ</th><th>ஏ</th><th>ஐ</th><th>ஓ</th><th>ஔ</th></tr>
    </thead>
    <tbody>
      <tr><th>க்</th><td>கா</td><td>கீ</td><td>கூ</td><td>கே</td><td>கை</td><td>கோ</td><td>கௌ</td></tr>
      <tr><th>ங்</th><td>ஙா</td><td>ஙீ</td><td>ஙூ</td><td>ஙே</td><td>ஙை</td><td>ஙோ</td><td>ஙௌ</td></tr>
      <tr><th>ச்</th><td>சா</td><td>சீ</td><td>சூ</td><td>சே</td><td>சை</td><td>சோ</td><td>சௌ</td></tr>
      <tr><th>ஞ்</th><td>ஞா</td><td>ஞீ</td><td>ஞூ</td><td>ஞே</td><td>ஞை</td><td>ஞோ</td><td>ஞௌ</td></tr>
      <tr><th>ட்</th><td>டா</td><td>டீ</td><td>டூ</td><td>டே</td><td>டை</td><td>டோ</td><td>டௌ</td></tr>
      <tr><th>ண்</th><td>ணா</td><td>ணீ</td><td>ணூ</td><td>ணே</td><td>ணை</td><td>ணோ</td><td>ணௌ</td></tr>
      <tr><th>த்</th><td>தா</td><td>தீ</td><td>தூ</td><td>தே</td><td>தை</td><td>தோ</td><td>தௌ</td></tr>
      <tr><th>ந்</th><td>நா</td><td>நீ</td><td>நூ</td><td>நே</td><td>நை</td><td>நோ</td><td>நௌ</td></tr>
      <tr><th>ப்</th><td>பா</td><td>பீ</td><td>பூ</td><td>பே</td><td>பை</td><td>போ</td><td>பௌ</td></tr>
    </tbody>
  </table>
</div>',
          '<h2 class="text-primary text-center mb-4">2. நெடில் (பகுதி 2)</h2>
<p class="fs-6">மெய் எழுத்துக்கள் உயிர்நெடில் எழுத்துக்களுடன் கூடி உயிர்மெய்நெடில் எழுத்துக்கள் உருவாகும்.</p>
<h5 class="mt-3 mb-2 text-primary text-center">உயிர்மெய் நெடில் (ம் - ன்)</h5>
<div class="table-responsive">
  <table class="table table-bordered table-striped text-center align-middle" style="font-size: 0.75rem;">
    <thead class="bg-light">
      <tr><th></th><th>ஆ</th><th>ஈ</th><th>ஊ</th><th>ஏ</th><th>ஐ</th><th>ஓ</th><th>ஔ</th></tr>
    </thead>
    <tbody>
      <tr><th>ம்</th><td>மா</td><td>மீ</td><td>மூ</td><td>மே</td><td>மை</td><td>மோ</td><td>மௌ</td></tr>
      <tr><th>ய்</th><td>யா</td><td>யீ</td><td>யூ</td><td>யே</td><td>யை</td><td>யோ</td><td>யௌ</td></tr>
      <tr><th>ர்</th><td>ரா</td><td>ரீ</td><td>ரூ</td><td>ரே</td><td>ரை</td><td>ரோ</td><td>ரௌ</td></tr>
      <tr><th>ல்</th><td>லா</td><td>லீ</td><td>லூ</td><td>லே</td><td>லை</td><td>லோ</td><td>லௌ</td></tr>
      <tr><th>வ்</th><td>வா</td><td>வீ</td><td>வூ</td><td>வே</td><td>வை</td><td>வோ</td><td>வௌ</td></tr>
      <tr><th>ழ்</th><td>ழா</td><td>ழீ</td><td>ழூ</td><td>ழே</td><td>ழை</td><td>ழோ</td><td>ழௌ</td></tr>
      <tr><th>ள்</th><td>ளா</td><td>ளீ</td><td>ளூ</td><td>ளே</td><td>ளை</td><td>ளோ</td><td>ளௌ</td></tr>
      <tr><th>ற்</th><td>றா</td><td>றீ</td><td>றூ</td><td>றே</td><td>றை</td><td>றோ</td><td>றௌ</td></tr>
      <tr><th>ன்</th><td>னா</td><td>னீ</td><td>னூ</td><td>னே</td><td>னை</td><td>னோ</td><td>னௌ</td></tr>
    </tbody>
  </table>
</div>',
          '<h2 class="text-primary text-center mb-4">3. மெய்</h2>
<p>க் ங் ச் ஞ் ட் ண் த் ந் ப் ம் ய் ர் ல் வ் ழ் ள் ற் ன் ஆகிய 18 மெய் எழுத்துக்களும் அரை மாத்திரை பெற்று ஒலிக்கும்.</p>'
        ],
        'practice_word' => 'கல்வி',
      ],
      1 => 
      [
        'title' => 'சிறப்பு எழுத்துக்கள்',
        'reading_pages' => [
          '<h2 class="text-primary text-center mb-4">சிறப்பு எழுத்துக்கள்</h2>
<p>குறில், நெடில், ஒற்று ஆகிய மூன்றையும் அறிந்த பின்னர், சில சிறப்பு எழுத்துக்களையும் அறிந்து கொள்வது நலம். அவை தளை தட்டும் இடங்களில் (பாவகைக்கு ஏற்றவாறு சீர் அமையாத இடங்களில்) புலவர்களால் மாத்திரையைக் கூட்டியோ குறைத்தோ பயன்படுத்தப்படும்.</p>
<p>அவற்றைப் பற்றிக் காண்போம்.</p>',
          '<h2 class="text-primary text-center mb-4">1. குற்றியலுகரம்</h2>
<p>உகரம் தனியாக ஒலிக்கப்படும் போதும் தனிக்குறிலின் அடுத்து ஒலிக்கப்படும் போதும் 1 மாத்திரை பெறும். அவ்வாறு இல்லாமல் கு சு டு து பு று ஆகிய ஆறு எழுத்துக்களும் கீழ் வருவது போன்ற இடங்களில் அரை மாத்திரை அளவு பெற்று குற்றியலுகரமாக ஒலிக்கும்.</p>
<div class="table-responsive">
  <table class="table table-bordered table-striped text-center align-middle" style="font-size: 0.9rem;">
    <thead class="bg-light">
      <tr><th>எண்</th><th>குற்றியலுகரம் வரும் இடங்கள்</th><th>சான்று</th></tr>
    </thead>
    <tbody>
      <tr><td>1</td><td>நெடில்</td><td>பாகு, காசு, கூறு</td></tr>
      <tr><td>2</td><td>நெடில் + ஒற்று</td><td>பாக்கு, கூற்று, வாத்து</td></tr>
      <tr><td>3</td><td>குறிலிணை</td><td>இறகு, முரசு, மரபு</td></tr>
      <tr><td>4</td><td>குறிலிணை + ஒற்று</td><td>அரங்கு, மருந்து, சுழற்று</td></tr>
      <tr><td>5</td><td>குறில்நெடில்</td><td>அசோகு, இயைபு, கெடாது</td></tr>
      <tr><td>6</td><td>குறில்நெடில் + ஒற்று</td><td>அமைச்சு, நகைப்பு, நிலைத்து</td></tr>
      <tr><td>7</td><td>குறில் + ஒற்று</td><td>செக்கு, தச்சு, பத்து</td></tr>
    </tbody>
  </table>
</div>',
          '<h2 class="text-primary text-center mb-4">2. குற்றியலிகரம்</h2>
<p>குற்றியலுகரம் நிலைமொழியில் நிற்க வருமொழியில் யகரம் வந்தால் அது இகரமாகத் திரியும். அவ்வாறு திரியும் இகரம் குற்றியலிகரமாகி அரை மாத்திரை அளவு பெறும்.</p>
<p class="border-start border-4 border-success ps-3 my-3 fw-bold text-secondary">சான்று: காசு + யாது – காசியாது</p>
<p>(இங்கு சு என்ற குற்றியலுகரம் யா வருமொழியில் வந்ததால் சி என்று குற்றியலிகரம் ஆகியது. இந்த சி அரை மாத்திரை அளவு பெறும்.)</p>',
          '<h2 class="text-primary text-center mb-4">3. ஐகாரக் குறுக்கம்</h2>
<p>ஐகாரம் தன்னைக் குறிக்கும் போதும் அளபெடுத்து வரும் போதும் இரண்டு மாத்திரை அளவு பெறும். அவ்வாறு இல்லாமல் ஒரு சொல்லின் முதலிலோ இடையிலோ கடைசியிலோ வரும் போது குறுகி ஒலிக்கும். இது ஐகாரக் குறுக்கம் எனப்படும்.</p>
<div class="table-responsive">
  <table class="table table-bordered table-striped text-center align-middle" style="font-size: 0.9rem;">
    <thead class="bg-light">
      <tr><th>எண்</th><th>வருமிடம்</th><th>மாத்திரை அளவு</th><th>சான்று</th></tr>
    </thead>
    <tbody>
      <tr><td>1</td><td>மொழி முதல்</td><td>ஒன்றரை</td><td>ஐப்பசி, வைகாசி</td></tr>
      <tr><td>2</td><td>மொழி இடை</td><td>ஒன்று</td><td>இடையன்</td></tr>
      <tr><td>3</td><td>மொழி கடை</td><td>ஒன்று</td><td>வாழை</td></tr>
    </tbody>
  </table>
</div>',
          '<h2 class="text-primary text-center mb-4">4. அளபெடை</h2>
<p>அளபெடை – உயிரளபெடை, ஒற்றளபெடை என்று இரண்டு வகைப்படும்.</p>
<h4 class="text-success mt-3">உயிரளபெடை</h4>
<p>உயிர் எழுத்துக்களில் உள்ள ஏழு நெட்டெழுத்துக்களும் அளபெடுக்கும். அதாவது இரண்டு மாத்திரை அளவில் இருந்து கூடி மூன்று மாத்திரை அளவாக ஒலிக்கும். அவ்வாறு அளபெடுத்ததைக் காட்ட அடையாளமாக அந்தந்த நெட்டெழுத்துக்களின் இனமாகிய குறில் எழுத்துக்கள் அருகில் நிற்கும்.</p>
<p>உயிரளபெடை தனிநிலை, சொல்லின் முதல், இடை, கடை என நான்கு இடங்களில் அளபெடுக்கும்.</p>
<ul>
  <li><strong>தனிநிலை அளபெடை</strong> – ஆஅ, ஈஇ, ஊஉ, ஏஎ, ஐஇ, ஓஒ, ஔஉ</li>
  <li><strong>முதல்நிலை அளபெடை</strong> – ஆஅரிடம், ஈஇரிலை, ஊஉரிடம்</li>
  <li><strong>இடைநிலை அளபெடை</strong> – படாஅகை, பரீஇயம், வளைஇயம்</li>
  <li><strong>கடைநிலை அளபெடை</strong> – கடாஅ, குரீஇ, கடைஇ</li>
</ul>',
          '<h2 class="text-primary text-center mb-4">4. அளபெடை (தொடர்ச்சி)</h2>
<h4 class="text-success">ஒற்றளபெடை</h4>
<p>ங் ஞ் ண் ந் ம் ன் வ் ய் ல் ள் என்னும் பத்து மெய் எழுத்துக்களும் குறிலின் கீழும் குறிலிணையின் கீழும் அளபெடுத்து வரும். ஒற்றுக்கள் (மெய்யெழுத்துக்கள்) தமக்கு உரிய அரை மாத்திரை அளவில் இருந்து கூடி 1 மாத்திரை அளவாக இந்த இடங்களில் ஒலிக்கும்.</p>
<p class="fw-bold">சான்று:</p>
<ul>
  <li>ங் – மங்ங்கலம், அரங்ங்கம்</li>
  <li>ஞ் – மஞ்ஞ்சு, முரஞ்ஞ்சு</li>
</ul>
<p class="mt-4 text-muted border-top pt-3">இவ்வாறு சிறப்பாகச் சுட்டப்பட்ட எழுத்துக்கள் தேவையான சீரினை அமைக்க இயலாத போது உதவுவனவாக உள்ளன.</p>'
        ],
        'practice_word' => 'யாதும் ஊரே யாவரும் கேளிர்',
        'is_assessment' => true,
      ],
    ],
  ],
  2 => 
  [
    'title' => 'அசை',
    'topic' => 'asai',
    'chapters' => 
    [
      0 => 
      [
        'title' => 'அசை மற்றும் நேரசை',
        'reading_html' => '<h2 class="text-primary text-center mb-4">அசை</h2><p>எழுத்துக்களால் ஆனது அசை. அசை நேரசை, நிரையசை என்று இருவகைப்படும்.</p><h4>நேரசை அமைப்பு</h4><p>ஓர் எழுத்து எண்ணிக்கையில் வரும் (நேர் – நேர் என்ற சொல்லிலும் நே என்று ஓர் எழுத்து இடம்பெறுகிறது. ஒற்றிற்கு மதிப்பில்லை என்பதை நினைவில் கொள்க].</p><ul><li>தனிக்குறில் (எ.கா: ப]</li><li>தனிக்குறில் + ஒற்று (எ.கா: பல்]</li><li>தனிநெடில் (எ.கா: பா]</li><li>தனிநெடில் + ஒற்று (எ.கா: பால்]</li></ul><p>நேர் என்ற சொல்லைப் போல ப, பல், பா, பால் என்பன ஓர் எழுத்து உடைய அசைகள் என்பதை அறிக. ஒற்றிற்கு மதிப்பில்லை.</p>',
        'practice_word' => 'பல்',
      ],
      1 => 
      [
        'title' => 'நிரையசை',
        'reading_html' => '<h2 class="text-primary text-center mb-4">நிரையசை</h2><p>இரண்டு எழுத்துக்கள் எண்ணிக்கையில் வரும் (நிரை – நிரை என்ற சொல்லிலும் நி, ரை என்று இரண்டு எழுத்துக்கள் இடம்பெறுகின்றன. ஒற்றிற்கு மதிப்பில்லை என்பதை நினைவில் கொள்க].</p><h4>நிரையசை அமைப்பு</h4><ul><li>இருகுறில் இணை (எ.கா: அணி]</li><li>இருகுறில் இணை + ஒற்று (எ.கா: அணில்]</li><li>குறில் நெடில் இணை (எ.கா: விழா]</li><li>குறில் நெடில் இணை + ஒற்று (எ.கா: விழார்]</li></ul><p>நிரை என்ற சொல்லைப் போல அணி, அணில், விழா, விழார் என்பன இரண்டு எழுத்து உடைய அசைகள் என்பதை அறிக. ஒற்றிற்கு மதிப்பில்லை.</p>',
        'practice_word' => 'அணில்',
      ],
      2 => 
      [
        'title' => 'அசை பிரித்தல் பயிற்சி',
        'reading_html' => '<h2 class="text-primary text-center mb-4">அசை பிரித்தல்</h2><p>ஒரு சொல்லில் உள்ள எழுத்துகளை நேரசை, நிரையசை விதிகளின்படி சரியாகப் பிரிப்பதே அசை பிரித்தல் ஆகும். இது சீர் அமைவதற்கும் தளை தட்டுவதற்கும் அடிப்படையாகும்.</p>',
        'practice_word' => 'அகழ்வாரைத்',
        'is_assessment' => true,
      ],
    ],
  ],
  3 => 
  [
    'title' => 'சீர்',
    'topic' => 'seer',
    'chapters' => 
    [
      0 => 
      [
        'title' => 'சீர் மற்றும் ஓரசைச் சீர்கள்',
        'reading_html' => '<h2 class="text-primary text-center mb-4">சீர் அறிமுகம் & ஓரசைச் சீர்கள்</h2>
<p class="fs-5"><strong>சீர்:</strong> ஒன்று அல்லது ஒன்றிற்கு மேற்பட்ட அசைகளின் சேர்க்கை சீர் எனப்படும்.</p>
<p class="fs-5">சீர் நான்கு வகைப்படும்:</p>
<ol class="fs-5 text-dark mt-2">
  <li>ஓரசைச் சீர்கள்</li>
  <li>ஈரசைச் சீர்கள்</li>
  <li>மூவசைச் சீர்கள்</li>
  <li>நாலசைச் சீர்கள்</li>
</ol>
<hr class="my-4">
<h3 class="text-success mb-3">ஓரசைச் சீர்கள்</h3>
<div class="table-responsive">
  <table class="table table-bordered table-striped text-center align-middle" style="font-size: 0.95rem;">
    <thead class="bg-light fw-bold text-dark">
      <tr>
        <th>அசை</th>
        <th>வாய்பாடு</th>
        <th>சான்று</th>
        <th>சான்று பெயர் பெறுவதன் காரணம் அறிதல்</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="fw-bold">நேர்</td>
        <td>நாள்</td>
        <td>தேன்</td>
        <td class="text-start">தே – ஓரெழுத்து. எனவே நாள் என்னும் ஓரெழுத்து உடைய வாய்பாடு.</td>
      </tr>
      <tr>
        <td class="fw-bold">நிரை</td>
        <td>மலர்</td>
        <td>பதம்</td>
        <td class="text-start">ப, த – இரண்டு எழுத்துக்கள். எனவே இரண்டு எழுத்துக்களை உடைய மலர் என்னும் வாய்பாடு.</td>
      </tr>
      <tr>
        <td class="fw-bold">நேர்பு</td>
        <td>காசு</td>
        <td>பாடு</td>
        <td class="text-start">பா என்னும் ஓரெழுத்து டு என்னும் குற்றியலுகரம் பெற்றுள்ளது. எனவே கா என்னும் ஓரெழுத்துடன் சு என்னும் குற்றியலுகரம் இணைந்த காசு என்னும் வாய்பாடு.</td>
      </tr>
      <tr>
        <td class="fw-bold">நிரைபு</td>
        <td>பிறப்பு</td>
        <td>விரும்பு</td>
        <td class="text-start">வி, ரு என்னும் இரண்டு எழுத்துக்கள் பு என்னும் குற்றியலுகரம் பெற்று முடிகின்றன. எனவே பிற என்னும் ஈரெழுத்துக்களுடன் பு என்னும் குற்றியலுகரம் இணைந்த பிறப்பு என்னும் வாய்பாடு.</td>
      </tr>
    </tbody>
  </table>
</div>',
        'practice_word' => 'தேன்',
      ],
      1 => 
      [
        'title' => 'ஈரசைச் சீர்கள்',
        'reading_html' => '<h2 class="text-primary text-center mb-4">ஈரசைச் சீர்கள்</h2>
<div class="table-responsive">
  <table class="table table-bordered table-striped text-center align-middle" style="font-size: 0.95rem;">
    <thead class="bg-light fw-bold text-dark">
      <tr>
        <th>அசை</th>
        <th>வாய்பாடு</th>
        <th>பொதுப்பெயர்</th>
        <th>சான்று</th>
        <th>சான்று பெயர் பெறுவதன் காரணம் அறிதல்</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="fw-bold">நேர் நேர்</td>
        <td>தேமா</td>
        <td rowspan="2" class="align-middle fw-bold text-success">மாச்சீர்</td>
        <td>தண்ணீர்</td>
        <td class="text-start">தண் என்னும் நேரசையும் ணீர் என்னும் நேரசையும் வந்துள்ளன. எனவே தே என்னும் நேரசையும் மா என்னும் நேரசையும் வரும் தேமா என்னும் வாய்பாடு பொருத்தம்.</td>
      </tr>
      <tr>
        <td class="fw-bold">நிரை நேர்</td>
        <td>புளிமா</td>
        <td>வருமா</td>
        <td class="text-start">வரு என்னும் நிரையசையும் மா என்னும் நேரசையும் வந்துள்ளன. எனவே புளி என்னும் நிரையசையும் மா என்னும் நேரசையும் வரும் புளிமா என்னும் வாய்பாடு பொருத்தம்.</td>
      </tr>
      <tr>
        <td class="fw-bold">நிரை நிரை</td>
        <td>கருவிளம்</td>
        <td rowspan="2" class="align-middle fw-bold text-primary">விளச்சீர்</td>
        <td>வருபுனல்</td>
        <td class="text-start">வரு என்னும் நிரையசையும் புனல் என்னும் நிரையசையும் வந்துள்ளன. எனவே கரு என்னும் நிரையசையும் விளம் என்னும் நிரையசையும் வரும் கருவிளம் என்னும் வாய்பாடு பொருத்தம்.</td>
      </tr>
      <tr>
        <td class="fw-bold">நேர் நிரை</td>
        <td>கூவிளம்</td>
        <td>தாவின</td>
        <td class="text-start">தா என்னும் நேரசையும் வின என்னும் நிரையசையும் வந்துள்ளன. எனவே கூ என்னும் நேரசையும் விளம் என்னும் நிரையசையும் வரும் கூவிளம் என்னும் வாய்பாடு பொருத்தம்.</td>
      </tr>
    </tbody>
  </table>
</div>',
        'practice_word' => 'தண்ணீர்',
      ],
      2 => 
      [
        'title' => 'மூவசைச் சீர்கள்',
        'reading_html' => '<h2 class="text-primary text-center mb-4">மூவசைச் சீர்கள்</h2>
<p class="fs-5">மூவசைச் சீர்கள் இரண்டு வகைப்படும்: <strong>காய்ச்சீர்</strong> மற்றும் <strong>கனிச்சீர்</strong>.</p>
<div class="row">
  <div class="col-md-6">
    <div class="card mb-4 border-success">
      <div class="card-header bg-success text-white fw-bold text-center">காய்ச்சீர் (காய் என்பது நேர்)</div>
      <div class="card-body">
        <table class="table table-sm table-bordered text-center align-middle">
          <thead class="bg-light">
            <tr><th>அசை</th><th>வாய்பாடு</th></tr>
          </thead>
          <tbody>
            <tr><td>நேர் நேர் நேர்</td><td>தேமாங்காய்</td></tr>
            <tr><td>நிரை நேர் நேர்</td><td>புளிமாங்காய்</td></tr>
            <tr><td>நிரை நிரை நேர்</td><td>கருவிளங்காய்</td></tr>
            <tr><td>நேர் நிரை நேர்</td><td>கூவிளங்காய்</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
  <div class="col-md-6">
    <div class="card mb-4 border-danger">
      <div class="card-header bg-danger text-white fw-bold text-center">கனிச்சீர் (கனி என்பது நிரை)</div>
      <div class="card-body">
        <table class="table table-sm table-bordered text-center align-middle">
          <thead class="bg-light">
            <tr><th>அசை</th><th>வாய்பாடு</th></tr>
          </thead>
          <tbody>
            <tr><td>நேர் நேர் நிரை</td><td>தேமாங்கனி</td></tr>
            <tr><td>நிரை நேர் நிரை</td><td>புளிமாங்கனி</td></tr>
            <tr><td>நிரை நிரை நிரை</td><td>கருவிளங்கனி</td></tr>
            <tr><td>நேர் நிரை நிரை</td><td>கூவிளங்கனி</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>',
        'practice_word' => 'தேமாங்காய்',
      ],
      3 => 
      [
        'title' => 'நாலசைச் சீர்கள்',
        'reading_html' => '<h2 class="text-primary text-center mb-4">நாலசைச் சீர்கள்</h2>
<p class="fs-6">நாலசைச் சீர்கள், ஈரசைச் சீர்களோடு இரண்டு அசைகள் இணைவதால் உருவாகின்றன. இவை <strong>பூச்சீர்</strong> மற்றும் <strong>நிழல்சீர்</strong> என்று வகைப்படுத்தப்படுகின்றன.</p>

<h4 class="text-success mt-4">1. பூச்சீர் (பூ என்பது நேர்)</h4>
<div class="alert alert-info border-start border-4 border-info py-2 px-3 mb-3">
  <p class="mb-1 fw-bold">காய்ச்சீர் + நேர் = தண்பூ</p>
  <p class="mb-0 small text-dark">தண் என்பதும் பூ என்பதும் நேர் அசைகள். ஈரசைச் சீர்களோடு இரு நேரசைகள் இணைவதால் தண்பூ எனப் பெயர் பெறுகின்றன.</p>
</div>
<table class="table table-bordered text-center align-middle mb-4" style="font-size: 0.9rem;">
  <thead class="bg-light">
    <tr><th>அசை</th><th>வாய்பாடு</th></tr>
  </thead>
  <tbody>
    <tr><td>நேர் நேர் நேர் நேர்</td><td>தேமாந்தண்பூ</td></tr>
    <tr><td>நிரை நேர் நேர் நேர்</td><td>புளிமாந்தண்பூ</td></tr>
    <tr><td>நிரை நிரை நேர் நேர்</td><td>கருவிளந்தண்பூ</td></tr>
    <tr><td>நேர் நிரை நேர் நேர்</td><td>கூவிளந்தண்பூ</td></tr>
  </tbody>
</table>

<div class="alert alert-info border-start border-4 border-info py-2 px-3 mb-3">
  <p class="mb-1 fw-bold">கனிச்சீர் + நேர் = நறும்பூ</p>
  <p class="mb-0 small text-dark">நறும் என்பது நிரை அசை, பூ என்பது நேர் அசை. ஈரசைச் சீர்களோடு ஒரு நிரையசையும் ஒரு நேரசையும் இணைவதால் நறும்பூ எனப் பெயர் பெறுகின்றன.</p>
</div>
<table class="table table-bordered text-center align-middle mb-4" style="font-size: 0.9rem;">
  <thead class="bg-light">
    <tr><th>அசை</th><th>வாய்பாடு</th></tr>
  </thead>
  <tbody>
    <tr><td>நேர் நேர் நிரை நேர்</td><td>தேமாநறும்பூ</td></tr>
    <tr><td>நிரை நேர் நிரை நேர்</td><td>புளிமாநறும்பூ</td></tr>
    <tr><td>நிரை நிரை நிரை நேர்</td><td>கருவிளநறும்பூ</td></tr>
    <tr><td>நேர் நிரை நிரை நேர்</td><td>கூவிளநறும்பூ</td></tr>
  </tbody>
</table>

<hr class="my-4">

<h4 class="text-primary">2. நிழல் சீர்கள் (நிழல் என்பது நிரை)</h4>
<div class="alert alert-warning border-start border-4 border-warning py-2 px-3 mb-3">
  <p class="mb-1 fw-bold">காய்ச்சீர் + நிரை = தண்ணிழல்</p>
  <p class="mb-0 small text-dark">தண் என்பது நே|ர் அசை, நிழல் என்பது நிரை அசை. ஈரசைச் சீர்களோடு ஒரு நேரசையும் ஒரு நிரையசையும் இணைவதால் தண்ணிழல் எனப் பெயர் பெறுகின்றன.</p>
</div>
<table class="table table-bordered text-center align-middle mb-4" style="font-size: 0.9rem;">
  <thead class="bg-light">
    <tr><th>அசை</th><th>வாய்பாடு</th></tr>
  </thead>
  <tbody>
    <tr><td>நேர் நேர் நேர் நிரை</td><td>தேமாந்தண்ணிழல்</td></tr>
    <tr><td>நிரை நேர் நேர் நிரை</td><td>புளிமாந்தண்ணிழல்</td></tr>
    <tr><td>நிரை நிரை நேர் நிரை</td><td>கருவிளந்தண்ணிழல்</td></tr>
    <tr><td>நேர் நிரை நேர் நிரை</td><td>கூவிளந்தண்ணிழல்</td></tr>
  </tbody>
</table>

<div class="alert alert-warning border-start border-4 border-warning py-2 px-3 mb-3">
  <p class="mb-1 fw-bold">கனிச்சீர் + நிரை = நறுநிழல்</p>
  <p class="mb-0 small text-dark">நறும் என்பதும் நிழல் என்பதும் நிரையசைகள். ஈரசைச் சீர்களோடு இரண்டு நிரையசைகள் இணைவதால் நறுநிழல் எனப் பெயர் பெறுகின்றன.</p>
</div>
<table class="table table-bordered text-center align-middle mb-4" style="font-size: 0.9rem;">
  <thead class="bg-light">
    <tr><th>அசை</th><th>வாய்பாடு</th></tr>
  </thead>
  <tbody>
    <tr><td>நேர் நேர் நிரை நிரை</td><td>தேமாநறுநிழல்</td></tr>
    <tr><td>நிரை நேர் நிரை நிரை</td><td>புளிமாநறுநிழல்</td></tr>
    <tr><td>நிரை நிரை நிரை நிரை</td><td>கருவிளநறுநிழல்</td></tr>
    <tr><td>நேர் நிரை நிரை நிரை</td><td>கூவிளநறுநிழல்</td></tr>
  </tbody>
</table>',
        'practice_word' => 'தேமாந்தண்பூ',
        'is_assessment' => true,
      ],
    ],
  ],
  4 => 
  [
    'title' => 'தளை',
    'topic' => 'thalai',
    'chapters' => 
    [
      0 => 
      [
        'title' => 'தளை அறிமுகம் & விதிகள்',
        'reading_html' => '<h2 class="text-primary text-center mb-4">தளை அறிமுகம் & விதிகள்</h2>
<p class="fs-5">செய்யுளில் நின்ற சீரின் ஈற்றசையும் வரும் சீரின் முதலசையும் ஒன்றியும் ஒன்றாமலும் தளைகள் பிறக்கும். நின்ற சீரின் இறுதி அசையையும் வரும் சீரின் முதல் அசையையும் பிணைப்பது <strong>தளை</strong> எனப்படும்.</p>

<h4 class="text-success mt-4">தளை காண்பதற்கான விதிகள்:</h4>
<ul class="fs-5">
  <li>தளை இடுவதற்கு முன் செய்யுளில் அனைத்து அசைகளும் சீர்களும் குறிக்கப்பட வேண்டும்.</li>
  <li>முதற்சீரினை (நின்ற சீர்) அடுத்த சீரின் (வரும் சீர்) முதல் அசையுடன் சேர்த்துத் தளை கண்டறிய வேண்டும்.</li>
</ul>',
        'practice_word' => 'தளை',
      ],
      1 => 
      [
        'title' => 'தளையின் வாய்பாடுகள்',
        'reading_html' => '<h2 class="text-primary text-center mb-4">தளையின் வாய்பாடுகள்</h2>
<p class="fs-5">தளைகள் மொத்தம் <strong>7</strong> வகைப்படும். அவை ஒன்றிய தளைகள் (4) மற்றும் ஒன்றாத தளைகள் (3) எனப் பிரிக்கப்படுகின்றன.</p>

<h4 class="text-success mt-4">ஒன்றிய தளைகள் (4):</h4>
<div class="table-responsive mb-4">
  <table class="table table-bordered table-striped text-center align-middle" style="font-size: 0.95rem;">
    <thead class="bg-light fw-bold text-dark">
      <tr>
        <th>எண்</th>
        <th>விதி (நின்ற சீரின் ஈறு + வரும் சீரின் முதல்)</th>
        <th>தளையின் பெயர்</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>1</td>
        <td class="fw-bold">மா முன் நேர்</td>
        <td>நேரொன்று ஆசிரியத்தளை</td>
      </tr>
      <tr>
        <td>2</td>
        <td class="fw-bold">விளம் முன் நிரை</td>
        <td>நிரையொன்று ஆசிரியத்தளை</td>
      </tr>
      <tr>
        <td>3</td>
        <td class="fw-bold">காய் முன் நேர்</td>
        <td>வெண்சீர் வெண்டளை</td>
      </tr>
      <tr>
        <td>4</td>
        <td class="fw-bold">கனி முன் நிரை</td>
        <td>ஒன்றிய வஞ்சித்தளை</td>
      </tr>
    </tbody>
  </table>
</div>

<h4 class="text-danger mt-4">ஒன்றாத தளைகள் (3):</h4>
<div class="table-responsive">
  <table class="table table-bordered table-striped text-center align-middle" style="font-size: 0.95rem;">
    <thead class="bg-light fw-bold text-dark">
      <tr>
        <th>எண்</th>
        <th>விதி (நின்ற சீரின் ஈறு + வரும் சீரின் முதல்)</th>
        <th>தளையின் பெயர்</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>1</td>
        <td class="fw-bold">மா முன் நிரை <br> விளம் முன் நேர்</td>
        <td>இயற்சீர் வெண்டளை</td>
      </tr>
      <tr>
        <td>2</td>
        <td class="fw-bold">காய் முன் நிரை</td>
        <td>கலித்தளை</td>
      </tr>
      <tr>
        <td>3</td>
        <td class="fw-bold">கனி முன் நேர்</td>
        <td>ஒன்றாத வஞ்சித்தளை</td>
      </tr>
    </tbody>
  </table>
</div>',
        'practice_word' => 'இயற்சீர் வெண்டளை',
      ],
      2 => 
      [
        'title' => 'சான்றுடன் தளை கண்டறிதல்',
        'reading_html' => '<h2 class="text-primary text-center mb-4">சான்றுடன் தளை கண்டறிதல்</h2>
<p class="fs-5 text-center fw-bold">"எனைத்தாணும் நல்லவை கேட்க அனைத்தாணும் ஆன்ற பெருமை தரும்"</p>

<div class="table-responsive">
  <table class="table table-bordered text-center align-middle" style="font-size: 0.85rem;">
    <thead class="bg-dark text-white fw-bold">
      <tr>
        <th>சீர் எண்</th>
        <th>சொல்</th>
        <th>அசைப் பிரிப்பு</th>
        <th>வாய்பாடு</th>
        <th>தளை விதி & தளைப் பெயர் (இணைப்புச் சீர்கள்)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>1</td>
        <td class="fw-bold">எனைத்தாணும்</td>
        <td>எனைத் / தா / னும் <br> (நிரை / நேர் / நேர்)</td>
        <td>புளிமாங்காய்</td>
        <td rowspan="2" class="text-start bg-light align-middle"><strong>(1 & 2): காய் முன் நேர்</strong><br>➔ வெண்சீர் வெண்டளை</td>
      </tr>
      <tr>
        <td>2</td>
        <td class="fw-bold">நல்லவை</td>
        <td>நல் / லவை <br> (நேர் / நிரை)</td>
        <td>கூவிளம்</td>
      </tr>
      <tr>
        <td>3</td>
        <td class="fw-bold">கேட்க</td>
        <td>கேட் / க <br> (நேர் / நேர்)</td>
        <td>தேமா</td>
        <td class="text-start bg-light"><strong>(2 & 3): விளம் முன் நேர்</strong><br>➔ இயற்சீர் வெண்டளை</td>
      </tr>
      <tr>
        <td>4</td>
        <td class="fw-bold">அனைத்தாணும்</td>
        <td>அனைத் / தா / னும் <br> (நிரை / நேர் / நேர்)</td>
        <td>புளிமாங்காய்</td>
        <td class="text-start bg-light"><strong>(3 & 4): மா முன் நிரை</strong><br>➔ இயற்சீர் வெண்டளை</td>
      </tr>
      <tr>
        <td>5</td>
        <td class="fw-bold">ஆன்ற</td>
        <td>ஆன் / ற <br> (நேர் / நேர்)</td>
        <td>தேமா</td>
        <td class="text-start bg-light"><strong>(4 & 5): காய் முன் நேர்</strong><br>➔ வெண்சீர் வெண்டளை</td>
      </tr>
      <tr>
        <td>6</td>
        <td class="fw-bold">பெருமை</td>
        <td>பெரு / மை <br> (நிரை / நேர்)</td>
        <td>புளிமா</td>
        <td class="text-start bg-light"><strong>(5 & 6): மா முன் நிரை</strong><br>➔ இயற்சீர் வெண்டளை</td>
      </tr>
      <tr>
        <td>7</td>
        <td class="fw-bold">தரும்</td>
        <td>தரும் <br> (நிரை)</td>
        <td>மலர்</td>
        <td class="text-start bg-light"><strong>(6 & 7): மா முன் நிரை</strong><br>➔ இயற்சீர் வெண்டளை</td>
      </tr>
    </tbody>
  </table>
</div>',
        'practice_word' => 'ஆன்ற பெருமை',
        'is_assessment' => true,
      ],
    ],
  ],
  5 => 
  [
    'title' => 'அலகிடுதல்',
    'topic' => 'alahidu',
    'chapters' => 
    [
      0 => 
      [
        'title' => 'அலகிடும் முறை',
        'reading_html' => '<h2 class="text-primary text-center mb-4">அலகிடுதல்</h2><p>ஒரு செய்யுளின் எழுத்து, அசை, சீர், தளை ஆகியவற்றை முறையாகப் பிரித்து அறிவதே அலகிடுதல் எனப்படும். இது யாப்பிலக்கணத்தின் முழுமையானப் பயிற்சியாகும்.</p><h4>அலகிடும் முறை:</h4><ul><li>முதலில் சொற்களை அசைகளாகப் பிரிக்க வேண்டும்.</li><li>அசைகளின் அடிப்படையில் சீர்களின் வகையைக் கண்டறிய வேண்டும்.</li></ul>',
        'practice_word' => 'அகழ்வாரைத்',
      ],
      1 => 
      [
        'title' => 'சீர் மற்றும் தளை பார்த்தல்',
        'reading_html' => '<h2 class="text-primary text-center mb-4">சீர் மற்றும் தளை பார்த்தல்</h2><p>அசைகளைப் பிரித்த பின், நின்ற சீரின் ஈற்றசையும், வருஞ்சீரின் முதலசையும் கொண்டு தளையைத் தீர்மானிக்க வேண்டும். இது பாடலின் ஓசையை உறுதி செய்யும்.</p>',
        'practice_word' => 'அகழ்வாரைத் தாங்கும்',
      ],
      2 => 
      [
        'title' => 'முழுமையான அலகிடுதல் பயிற்சி',
        'reading_html' => '<h2 class="text-primary text-center mb-4">முழுமையான அலகிடுதல்</h2><p>திருக்குறள் போன்ற வெண்பாக்கள் வெண்டளை (இயற்சீர் வெண்டளை, வெண்சீர் வெண்டளை] மட்டுமே பெற்று வரும். ஈற்றுச்சீர் நாள், மலர், காசு, பிறப்பு என்னும் ஓரசைச்சீர்களில் முடிவடையும்.</p>',
        'practice_word' => 'அகழ்வாரைத் தாங்கும் நிலம்போலத் தம்மை இகழ்வார்ப் பொறுத்தல் தலை',
        'is_assessment' => true,
      ],
    ],
  ],
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

                $isAssessment = isset($chapterData['is_assessment']) && $chapterData['is_assessment'];
                $actType = $isAssessment ? 'தேர்வு' : 'பயிற்சி';
                $actKey = $isAssessment ? 'assessment' : 'activity';

                $contentBlocks = [];

                if (isset($chapterData['reading_html'])) {
                    $contentBlocks[] = [
                        'type' => 'paragraph',
                        'data' => [
                            'text' => $chapterData['reading_html']
                        ]
                    ];
                } elseif (isset($chapterData['reading_pages'])) {
                    foreach ($chapterData['reading_pages'] as $pageHtml) {
                        $contentBlocks[] = [
                            'type' => 'paragraph',
                            'data' => [
                                'text' => $pageHtml
                            ]
                        ];
                    }
                }

                if (isset($chapterData['practice_word'])) {
                    $contentBlocks[] = [
                        'type' => 'practice',
                        'data' => [
                            'topic' => $levelData['topic'],
                            'word' => $chapterData['practice_word']
                        ]
                    ];
                }

                $activitiesData = $chapterData['activities'] ?? [];
                
                foreach ($activitiesData as $actIdx => $act) {
                    $type = $act['type'] ?? 'mcq';
                    $dataJson = [];
                    if ($type === 'mcq') {
                        $dataJson = [
                            'question' => $act['q'],
                            'options' => $formatOptions($act['opts'], $act['ans'])
                        ];
                    } else if ($type === 'odd_one_out') {
                        $dataJson = [
                            'question' => $act['q'],
                            'options' => $act['opts']
                        ];
                    } else if ($type === 'word_hunt') {
                        $dataJson = [
                            'question' => $act['q'],
                            'gridSize' => $act['gridSize'] ?? 2,
                            'boxes' => $act['boxes']
                        ];
                    } else if ($type === 'letter_basket') {
                        $dataJson = [
                            'question' => $act['q'],
                            'items' => $act['items']
                        ];
                    }

                    $activity = Activity::create([
                        'title' => $chapterData['title'] . ' ' . $actType . ' ' . ($actIdx + 1),
                        'type' => $type,
                        'data_json' => $dataJson,
                    ]);

                    $contentBlocks[] = [
                        'type' => $actKey,
                        'data' => array_merge([
                            'id' => $activity->id,
                            'type' => $type,
                        ], $activity->data_json)
                    ];
                }

                $content = Content::create([
                    'name' => $chapterData['title'] . ' பாடம்',
                    'title' => $chapterData['title'] . ' பாடம்',
                    'text_content' => json_encode(['blocks' => $contentBlocks]),
                    'is_active' => true,
                ]);

                DB::table('content_chapters')->insert([
                    'chapter_id' => $chapter->id,
                    'content_id' => $content->id,
                ]);
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
