<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Chapter;
use App\Models\Content;

class EluthuActivitySeeder extends Seeder
{
    public function run(): void
    {
        // ==========================================
        // SEED ELUTHU (எழுத்துப் பயிற்சி & பாடங்கள்)
        // ==========================================

        // 1. Seed Chapter 1 Reading Content (அடிப்படை எழுத்துக்கள்)
        $c1 = Chapter::where('name', 'LIKE', '%அடிப்படை எழுத்துக்கள்%')->first();
        if ($c1) {
            $c1Blocks = [
                ['type' => 'paragraph', 'data' => ['text' => '<h2 class="text-primary text-center mb-4">எழுத்து</h2><p class="fs-5">அசைக்கு அடிப்படை உறுப்பாக எழுத்து அமைகிறது.</p><div class="alert alert-warning border-start border-4 border-warning my-3 p-3 text-start"><p class="mb-0 fw-bold">“எழுதப்படுதலின் எழுத்தே” என்று இலக்கண விளக்கம் எழுத்தினைக் குறிப்பிடுகிறது.</p></div><p class="fs-5 text-dark">ஒலியினை வடிவமாக்கிக் காட்ட உதவுவதே <strong>எழுத்து</strong> ஆகும்.</p>']],
                ['type' => 'paragraph', 'data' => ['text' => '<h2 class="text-primary text-center mb-4">மாத்திரை</h2><p class="fs-5">ஒலியின் அளவினைத் தமிழ் மொழியில் <strong>மாத்திரை</strong> என்று குறிப்பிடுவர்.</p><div class="alert alert-info border-start border-4 border-info my-3 p-3 text-start"><p class="mb-0 fw-bold">மாத்திரை என்பது மனிதன் இயல்பாகக் கண்ணிமைக்கும் நொடி அல்லது கை நொடிக்கும் நொடி ஆகும்.</p></div><p class="fs-5 text-dark">ஒரு முறை கண்ணிமைக்கும் நேரம் அல்லது ஒரு முறை கை நொடிக்கும் நேரம் ஒரு மாத்திரை எனப்படும்.</p>']],
                ['type' => 'paragraph', 'data' => ['text' => '<h2 class="text-primary text-center mb-4">எழுத்துக்களின் வகைகள்</h2><p class="fs-5">எழுத்துக்களின் வகைகளை மூன்றாகப் பிரித்து அறிந்து கொள்வது அசை பிரிக்க அடிப்படையான தகுதி ஆகும்.</p><div class="row justify-content-center mt-3"><div class="col-12"><div class="list-group"><div class="list-group-item list-group-item-action d-flex align-items-center gap-3 p-3"><span class="badge bg-primary fs-6 rounded-circle px-2 py-1">1</span><div><strong class="fs-5">குறில்</strong> (குறுகிய ஒலி - 1 மாத்திரை)</div></div><div class="list-group-item list-group-item-action d-flex align-items-center gap-3 p-3"><span class="badge bg-success fs-6 rounded-circle px-2 py-1">2</span><div><strong class="fs-5">நெடில்</strong> (நீண்ட ஒலி - 2 மாத்திரை)</div></div><div class="list-group-item list-group-item-action d-flex align-items-center gap-3 p-3"><span class="badge bg-warning text-dark fs-6 rounded-circle px-2 py-1">3</span><div><strong class="fs-5">மெய் / ஒற்று</strong> (புள்ளி எழுத்து - ½ மாத்திரை)</div></div></div></div></div>']],
                ['type' => 'paragraph', 'data' => ['text' => '<h2 class="text-primary text-center mb-4">1. குறில் (பகுதி 1)</h2><p class="fs-6">ஒரு மாத்திரை அளவுடைய எழுத்துக்கள் குறில் எழுத்துக்கள் ஆகும். அ இ உ எ ஒ ஆகிய ஐந்து உயிர் எழுத்துக்களும் உயிர்க்குறில் ஆகும்.</p><p class="fw-bold text-success text-center">உயிர்க் குறில் – அ இ உ எ ஒ</p><h5 class="mt-3 mb-2 text-primary text-center">உயிர்மெய் குறில் (க் - ப்)</h5><div class="table-responsive"><table class="table table-bordered table-striped text-center align-middle" style="font-size: 0.8rem;"><thead class="bg-light"><tr><th></th><th>அ</th><th>இ</th><th>உ</th><th>எ</th><th>ஒ</th></tr></thead><tbody><tr><th>க்</th><td>க</td><td>கி</td><td>கு</td><td>கெ</td><td>கொ</td></tr><tr><th>ங்</th><td>ங</td><td>ஙி</td><td>ஙு</td><td>ஙெ</td><td>ஙொ</td></tr><tr><th>ச்</th><td>ச</td><td>சி</td><td>சு</td><td>செ</td><td>சொ</td></tr><tr><th>ஞ்</th><td>ஞ</td><td>ஞி</td><td>ஞு</td><td>ஞெ</td><td>ஞொ</td></tr><tr><th>ட்</th><td>ட</td><td>டி</td><td>டு</td><td>டெ</td><td>டொ</td></tr><tr><th>ண்</th><td>ண</td><td>ணி</td><td>ணு</td><td>ணெ</td><td>ணொ</td></tr><tr><th>த்</th><td>த</td><td>தி</td><td>து</td><td>தெ</td><td>தொ</td></tr><tr><th>ந்</th><td>ந</td><td>நி</td><td>நு</td><td>நெ</td><td>நொ</td></tr><tr><th>ப்</th><td>ப</td><td>பி</td><td>பு</td><td>பெ</td><td>பொ</td></tr></tbody><tbody></table></div>']],
                ['type' => 'paragraph', 'data' => ['text' => '<h2 class="text-primary text-center mb-4">1. குறில் (பகுதி 2)</h2><p class="fs-6">மெய் எழுத்துக்கள் உயிர் எழுத்துக்களுடன் கூடி உயிர்மெய்க்குறில் எழுத்துக்கள் உருவாகும்.</p><h5 class="mt-3 mb-2 text-primary text-center">உயிர்மெய் குறில் (ம் - ன்)</h5><div class="table-responsive"><table class="table table-bordered table-striped text-center align-middle" style="font-size: 0.8rem;"><thead class="bg-light"><tr><th></th><th>அ</th><th>இ</th><th>உ</th><th>எ</th><th>ஒ</th></tr></thead><tbody><tr><th>ம்</th><td>ம</td><td>மி</td><td>மு</td><td>மெ</td><td>மொ</td></tr><tr><th>ய்</th><td>ய</td><td>யி</td><td>யு</td><td>யெ</td><td>யொ</td></tr><tr><th>ர்</th><td>ர</td><td>ரி</td><td>ரு</td><td>ரெ</td><td>ரொ</td></tr><tr><th>ல்</th><td>ல</td><td>லி</td><td>லு</td><td>லெ</td><td>லொ</td></tr><tr><th>வ்</th><td>வ</td><td>வி</td><td>வு</td><td>வெ</td><td>வொ</td></tr><tr><th>ழ்</th><td>ழ</td><td>ழி</td><td>ழு</td><td>ழெ</td><td>ழொ</td></tr><tr><th>ள்</th><td>ள</td><td>ளி</td><td>ளு</td><td>ளெ</td><td>ளொ</td></tr><tr><th>ற்</th><td>ற</td><td>றி</td><td>று</td><td>றெ</td><td>றொ</td></tr><tr><th>ன்</th><td>ன</td><td>னி</td><td>னு</td><td>னெ</td><td>னொ</td></tr></tbody></table></div>']],
                ['type' => 'paragraph', 'data' => ['text' => '<h2 class="text-primary text-center mb-4">2. நெடில் (பகுதி 1)</h2><p class="fs-6">இரண்டு மாத்திரை அளவுடைய எழுத்துக்கள் நெடில் எழுத்துக்கள் ஆகும். ஆ ஈ ஊ ஏ ஐ ஓ ஔ ஆகிய ஏழு உயிர் எழுத்துக்களும் உயிர்நெடில் ஆகும்.</p><p class="fw-bold text-danger text-center">உயிர் நெடில் - ஆ ஈ ஊ ஏ ஐ ஓ ஔ</p><h5 class="mt-3 mb-2 text-primary text-center">உயிர்மெய் நெடில் (க் - ப்)</h5><div class="table-responsive"><table class="table table-bordered table-striped text-center align-middle" style="font-size: 0.75rem;"><thead class="bg-light"><tr><th></th><th>ஆ</th><th>ஈ</th><th>ஊ</th><th>ஏ</th><th>ஐ</th><th>ஓ</th><th>ஔ</th></tr></thead><tbody><tr><th>க்</th><td>கா</td><td>கீ</td><td>கூ</td><td>கே</td><td>கை</td><td>கோ</td><td>கௌ</td></tr><tr><th>ங்</th><td>ஙா</td><td>ஙீ</td><td>ஙூ</td><td>ஙே</td><td>ஙை</td><td>ஙோ</td><td>ஙௌ</td></tr><tr><th>ச்</th><td>சா</td><td>சீ</td><td>சூ</td><td>சே</td><td>சை</td><td>சோ</td><td>சௌ</td></tr><tr><th>ஞ்</th><td>ஞா</td><td>ஞீ</td><td>ஞூ</td><td>ஞே</td><td>ஞை</td><td>ஞோ</td><td>ஞௌ</td></tr><tr><th>ட்</th><td>டா</td><td>டீ</td><td>டூ</td><td>டே</td><td>டை</td><td>டோ</td><td>டௌ</td></tr><tr><th>ண்</th><td>ணா</td><td>ணீ</td><td>ணூ</td><td>ணே</td><td>ணை</td><td>ணோ</td><td>ணௌ</td></tr><tr><th>த்</th><td>தா</td><td>தீ</td><td>தூ</td><td>தே</td><td>தை</td><td>தோ</td><td>தௌ</td></tr><tr><th>ந்</th><td>நா</td><td>நீ</td><td>நூ</td><td>நே</td><td>நை</td><td>நோ</td><td>நௌ</td></tr><tr><th>ப்</th><td>பா</td><td>பீ</td><td>பூ</td><td>பே</td><td>பை</td><td>போ</td><td>பௌ</td></tr></tbody><tbody></table></div>']],
                ['type' => 'paragraph', 'data' => ['text' => '<h2 class="text-primary text-center mb-4">2. நெடில் (பகுதி 2)</h2><p class="fs-6">மெய் எழுத்துக்கள் உயிர்நெடில் எழுத்துக்களுடன் கூடி உயிர்மெய்நெடில் எழுத்துக்கள் உருவாகும்.</p><h5 class="mt-3 mb-2 text-primary text-center">உயிர்மெய் நெடில் (ம் - ன்)</h5><div class="table-responsive"><table class="table table-bordered table-striped text-center align-middle" style="font-size: 0.75rem;"><thead class="bg-light"><tr><th></th><th>ஆ</th><th>ஈ</th><th>ஊ</th><th>ஏ</th><th>ஐ</th><th>ஓ</th><th>ஔ</th></tr></thead><tbody><tr><th>ம்</th><td>மா</td><td>மீ</td><td>மூ</td><td>மே</td><td>மை</td><td>மோ</td><td>மௌ</td></tr><tr><th>ய்</th><td>யா</td><td>யீ</td><td>யூ</td><td>யே</td><td>யை</td><td>யோ</td><td>யௌ</td></tr><tr><th>ர்</th><td>ரா</td><td>ரீ</td><td>ரூ</td><td>ரே</td><td>ரை</td><td>ரோ</td><td>ரௌ</td></tr><tr><th>ல்</th><td>லா</td><td>லீ</td><td>லூ</td><td>லே</td><td>லை</td><td>லோ</td><td>லௌ</td></tr><tr><th>வ்</th><td>வா</td><td>வீ</td><td>வூ</td><td>வே</td><td>வை</td><td>வோ</td><td>வௌ</td></tr><tr><th>ழ்</th><td>ழா</td><td>ழீ</td><td>ழூ</td><td>ழே</td><td>ழை</td><td>ழோ</td><td>ழௌ</td></tr><tr><th>ள்</th><td>ளா</td><td>ளீ</td><td>ளூ</td><td>ளே</td><td>ளை</td><td>ளோ</td><td>ளௌ</td></tr><tr><th>ற்</th><td>றா</td><td>றீ</td><td>றூ</td><td>றே</td><td>றை</td><td>றோ</td><td>றௌ</td></tr><tr><th>ன்</th><td>னா</td><td>னீ</td><td>னூ</td><td>னே</td><td>னை</td><td>னோ</td><td>னௌ</td></tr></tbody><tbody></table></div>']],
                ['type' => 'paragraph', 'data' => ['text' => '<h2 class="text-primary text-center mb-4">3. மெய்</h2><p>க் ங் ச் ஞ் ட் ண் த் ந் ப் ம் ய் ர் ல் வ் ழ் ள் ற் ன் ஆகிய 18 மெய் எழுத்துக்களும் அரை மாத்திரை பெற்று ஒலிக்கும்.</p>']],
                ['type' => 'practice', 'data' => ['topic' => 'eluthu', 'word' => 'கல்வி']]
            ];

            $c1Content = Content::updateOrCreate(
                ['title' => 'அடிப்படை எழுத்துக்கள் பாடம்'],
                [
                    'name' => 'அடிப்படை எழுத்துக்கள் பாடம்',
                    'text_content' => json_encode(['blocks' => $c1Blocks], JSON_UNESCAPED_UNICODE),
                    'is_active' => true,
                ]
            );

            DB::table('content_chapters')->updateOrInsert(
                ['chapter_id' => $c1->id, 'content_id' => $c1Content->id]
            );
        }

        // 2. Seed Chapter 2 Reading Content (சிறப்பு எழுத்துக்கள்)
        $c2 = Chapter::where('name', 'LIKE', '%சிறப்பு எழுத்துக்கள்%')->first();
        if ($c2) {
            $c2Blocks = [
                ['type' => 'paragraph', 'data' => ['text' => '<h2 class="text-primary text-center mb-4">சிறப்பு எழுத்துக்கள்</h2><p>குறில், நெடில், ஒற்று ஆகிய மூன்றையும் அறிந்த பின்னர், சில சிறப்பு எழுத்துக்களையும் அறிந்து கொள்வது நலம். அவை தளை தட்டும் இடங்களில் (பாவகைக்கு ஏற்றவாறு சீர் அமையாத இடங்களில்) புலவர்களால் மாத்திரையைக் கூட்டியோ குறைத்தோ பயன்படுத்தப்படும்.</p><p>அவற்றைப் பற்றிக் காண்போம்.</p>']],
                ['type' => 'paragraph', 'data' => ['text' => '<h2 class="text-primary text-center mb-4">1. குற்றியலுகரம்</h2><p>உகரம் தனியாக ஒலிக்கப்படும் போதும் தனிக்குறிலின் அடுத்து ஒலிக்கப்படும் போதும் 1 மாத்திரை பெறும். அவ்வாறு இல்லாமல் கு சு டு து பு று ஆகிய ஆறு எழுத்துக்களும் கீழ் வருவது போன்ற இடங்களில் அரை மாத்திரை அளவு பெற்று குற்றியலுகரமாக ஒலிக்கும்.</p><div class="table-responsive"><table class="table table-bordered table-striped text-center align-middle" style="font-size: 0.9rem;"><thead class="bg-light"><tr><th>எண்</th><th>குற்றியலுகரம் வரும் இடங்கள்</th><th>சான்று</th></tr></thead><tbody><tr><td>1</td><td>நெடில்</td><td>பாகு, காசு, கூறு</td></tr><tr><td>2</td><td>நெடில் + ஒற்று</td><td>பாக்கு, கூற்று, வாத்து</td></tr><tr><td>3</td><td>குறிலிணை</td><td>இறகு, முரசு, மரபு</td></tr><tr><td>4</td><td>குறிலிணை + ஒற்று</td><td>அரங்கு, மருந்து, சுழற்று</td></tr><tr><td>5</td><td>குறில்நெடில்</td><td>அசோகு, இயைபு, கெடாது</td></tr><tr><td>6</td><td>குறில்நெடில் + ஒற்று</td><td>அமைச்சு, நகைப்பு, நிலைத்து</td></tr><tr><td>7</td><td>குறில் + ஒற்று</td><td>செக்கு, தச்சு, பத்து</td></tr></tbody></table></div>']],
                ['type' => 'paragraph', 'data' => ['text' => '<h2 class="text-primary text-center mb-4">2. குற்றியலிகரம்</h2><p>குற்றியலுகரம் நிலைமொழியில் நிற்க வருமொழியில் யகரம் வந்தால் அது இகரமாகத் திரியும். அவ்வாறு திரியும் இகரம் குற்றியலிகரமாகி அரை மாத்திரை அளவு பெறும்.</p><p class="border-start border-4 border-success ps-3 my-3 fw-bold text-secondary">சான்று: காசு + யாது – காசியாது</p><p>(இங்கு சு என்ற குற்றியலுகரம் யா வருமொழியில் வந்ததால் சி என்று குற்றியலிகரமாகியதாகி ½ மாத்திரை பெறும்.)</p>']],
                ['type' => 'paragraph', 'data' => ['text' => '<h2 class="text-primary text-center mb-4">3. ஐகாரக் குறுக்கம்</h2><p>ஐகாரம் தன்னைக் குறிக்கும் போதும் அளபெடுத்து வரும் போதும் இரண்டு மாத்திரை அளவு பெறும். அவ்வாறு இல்லாமல் ஒரு சொல்லின் முதலிலோ இடையிலோ கடைசியிலோ வரும் போது குறுகி ஒலிக்கும். இது ஐகாரக் குறுக்கம் எனப்படும்.</p><div class="table-responsive"><table class="table table-bordered table-striped text-center align-middle" style="font-size: 0.9rem;"><thead class="bg-light"><tr><th>எண்</th><th>வருமிடம்</th><th>மாத்திரை அளவு</th><th>சான்று</th></tr></thead><tbody><tr><td>1</td><td>மொழி முதல்</td><td>ஒன்றரை</td><td>ஐப்பசி, வைகாசி</td></tr><tr><td>2</td><td>மொழி இடை</td><td>ஒன்று</td><td>இடையன்</td></tr><tr><td>3</td><td>மொழி கடை</td><td>ஒன்று</td><td>வாழை</td></tr></tbody></table></div>']],
                ['type' => 'paragraph', 'data' => ['text' => '<h2 class="text-primary text-center mb-4">4. அளபெடை</h2><p>அளபெடை – உயிரளபெடை, ஒற்றளபெடை என்று இரண்டு வகைப்படும்.</p><h4 class="text-success mt-3">உயிரளபெடை</h4><p>உயிர் எழுத்துக்களில் உள்ள ஏழு நெட்டெழுத்துக்களும் அளபெடுக்கும். அதாவது இரண்டு மாத்திரை அளவில் இருந்து கூடி மூன்று மாத்திரை அளவாக ஒலிக்கும். அவ்வாறு அளபெடுத்ததைக் காட்ட அடையாளமாக அந்தந்த நெட்டெழுத்துக்களின் இனமாகிய குறில் எழுத்துக்கள் அருகில் நிற்கும்.</p><p>உயிரளபெடை தனிநிலை, சொல்லின் முதல், இடை, கடை என நான்கு இடங்களில் அளபெடுக்கும்.</p><ul><li><strong>தனிநிலை அளபெடை</strong> – ஆஅ, ஈஇ, ஊஉ, ஏஎ, ஐஇ, ஓஒ, ஔஉ</li><li><strong>முதல்நிலை அளபெடை</strong> – ஆஅரிடம், ஈஇரிலை, ஊஉரிடம்</li><li><strong>இடைநிலை அளபெடை</strong> – படாஅகை, பரீஇயம், வளைஇயம்</li><li><strong>கடைநிலை அளபெடை</strong> – கடாஅ, குரீஇ, கடைஇ</li></ul>']],
                ['type' => 'paragraph', 'data' => ['text' => '<h2 class="text-primary text-center mb-4">4. அளபெடை (தொடர்ச்சி)</h2><h4 class="text-success">ஒற்றளபெடை</h4><p>ங் ஞ் ண் ந் ம் ன் வ் ய் ல் ள் என்னும் பத்து மெய் எழுத்துக்களும் குறிலின் கீழும் குறிலிணையின் கீழும் அளபெடுத்து வரும். ஒற்றுக்கள் (மெய்யெழுத்துக்கள்) தமக்கு உரிய அரை மாத்திரை அளவில் இருந்து கூடி 1 மாத்திரை அளவாக இந்த இடங்களில் ஒலிக்கும்.</p><p class="fw-bold">சான்று:</p><ul><li>ங் – மங்ங்கலம், அரங்ங்கம்</li><li>ஞ் – மஞ்ஞ்சு, முரஞ்ஞ்சு</li></ul><p class="mt-4 text-muted border-top pt-3">இவ்வாறு சிறப்பாகச் சுட்டப்பட்ட எழுத்துக்கள் தேவையான சீரினை அமைக்க இயலாத போது உதவுவனவாக உள்ளன.</p>']],
                ['type' => 'practice', 'data' => ['topic' => 'eluthu', 'word' => 'யாதும் ஊரே யாவரும் கேளிர்']]
            ];

            $c2Content = Content::updateOrCreate(
                ['title' => 'சிறப்பு எழுத்துக்கள் பாடம்'],
                [
                    'name' => 'சிறப்பு எழுத்துக்கள் பாடம்',
                    'text_content' => json_encode(['blocks' => $c2Blocks], JSON_UNESCAPED_UNICODE),
                    'is_active' => true,
                ]
            );

            DB::table('content_chapters')->updateOrInsert(
                ['chapter_id' => $c2->id, 'content_id' => $c2Content->id]
            );
        }

        // 3. Seed Eluthu MCQ & Detective Exercises
        $eluthuChapter = $c1 ?? Chapter::where('name', 'LIKE', '%எழுத்து%')->first();
        if ($eluthuChapter) {
            $mcqQuestions = [
                // === தமிழ் எழுத்துகள் அடிப்படை (1-10) ===
                ['q' => 'தமிழ் மொழியின் மொத்த எழுத்துகள் எத்தனை?', 'opts' => ['247', '216', '18', '12'], 'ans' => '247', 'exp' => 'தமிழ் எழுத்துகள் மொத்தம் 247: உயிர் 12, மெய் 18, உயிர்மெய் 216, ஆய்தம் 1.'],
                ['q' => 'தமிழ் மொழியில் உயிர் எழுத்துகள் மொத்தம் எத்தனை?', 'opts' => ['12', '18', '5', '7'], 'ans' => '12', 'exp' => 'அ முதல் ஔ வரையிலான 12 எழுத்துகளும் உயிர் எழுத்துகள் ஆகும்.'],
                ['q' => 'தமிழ் மொழியில் மெய் எழுத்துகள் மொத்தம் எத்தனை?', 'opts' => ['18', '12', '216', '1'], 'ans' => '18', 'exp' => 'க் முதல் ன் வரையிலான 18 புள்ளி வைத்த எழுத்துகளும் மெய் எழுத்துகள் ஆகும்.'],
                ['q' => 'உயிரும் மெய்யும் சேர்வதால் உருவாகும் எழுத்துகள் எவை?', 'opts' => ['உயிர்மெய் எழுத்துகள்', 'ஆய்த எழுத்து', 'சார்பெழுத்துகள்', 'மெய் எழுத்துகள்'], 'ans' => 'உயிர்மெய் எழுத்துகள்', 'exp' => '12 உயிர் எழுத்துகளும் 18 மெய் எழுத்துகளும் சேர்வதால் 216 உயிர்மெய் எழுத்துகள் உருவாகின்றன.'],
                ['q' => 'தமிழ் மொழியில் உயிர்மெய் எழுத்துகள் மொத்தம் எத்தனை?', 'opts' => ['216', '247', '18', '12'], 'ans' => '216', 'exp' => '12 × 18 = 216 உயிர்மெய் எழுத்துகள் உள்ளன.'],
                ['q' => 'ஆய்த எழுத்து எத்தனை உள்ளது?', 'opts' => ['1', '3', '12', '18'], 'ans' => '1', 'exp' => 'ஆய்த எழுத்து ஃ என்ற ஒன்று மட்டுமே உள்ளது.'],
                ['q' => 'அசைக்கு அடிப்படை உறுப்பாக அமைவது எது?', 'opts' => ['எழுத்து', 'சீர்', 'தளை', 'அடி'], 'ans' => 'எழுத்து', 'exp' => 'யாப்பிலக்கணத்தில் அசை அமைவதற்கு அடிப்படை உறுப்பாக எழுத்து அமைகிறது.'],
                ['q' => 'தமிழ் மொழியில் ஒலியின் கால அளவை எவ்வாறு குறிப்பிடுவர்?', 'opts' => ['மாத்திரை', 'சீர்', 'தளை', 'அடி'], 'ans' => 'மாத்திரை', 'exp' => 'எழுத்துகள் ஒலிக்கும் கால அளவே மாத்திரை எனப்படும்.'],
                ['q' => 'ஒரு மாத்திரை என்பது எதற்குச் சமமானது?', 'opts' => ['இயல்பாகக் கண்ணிமைக்கும் அல்லது கைநொடிக்கும் நேரம்', 'ஒரு வினாடி நேரம்', 'ஒரு மணி நேரம்', 'மூச்சு விடும் நேரம்'], 'ans' => 'இயல்பாகக் கண்ணிமைக்கும் அல்லது கைநொடிக்கும் நேரம்', 'exp' => 'இயல்பாகக் கண்ணிமைக்கும் நேரமும் கைநொடிக்கும் நேரமும் ஒரு மாத்திரை எனப்படும்.'],
                ['q' => 'எழுத்துகளை ஒலி அளவின் அடிப்படையில் எவ்வாறு பிரிக்கலாம்?', 'opts' => ['குறில், நெடில், மெய்', 'வல்லினம், மெல்லினம்', 'நேர், நிரை', 'முதல், சார்பு'], 'ans' => 'குறில், நெடில், மெய்', 'exp' => 'ஒலி அளவின் அடிப்படையில் குறில் (1), நெடில் (2), மெய் (½) எனப் பிரிக்கலாம்.'],

                // === குறில் & நெடில் எழுத்துகள் (11-20) ===
                ['q' => 'உயிர்க்குறில் எழுத்துகள் மொத்தம் எத்தனை?', 'opts' => ['5', '7', '12', '18'], 'ans' => '5', 'exp' => 'அ, இ, உ, எ, ஒ ஆகிய 5 எழுத்துகளும் உயிர்க்குறில் எழுத்துகள் ஆகும்.'],
                ['q' => 'கீழ்க்கண்டவற்றுள் உயிர்க்குறில் எழுத்துகள் எவை?', 'opts' => ['அ, இ, உ, எ, ஒ', 'ஆ, ஈ, ஊ, ஏ, ஓ', 'க, ச, ட, த, ப', 'க், ங், ச், ஞ், ட்'], 'ans' => 'அ, இ, உ, எ, ஒ', 'exp' => 'குறுகிய ஓசையுடைய அ, இ, உ, எ, ஒ ஆகியவை உயிர்க்குறில் ஆகும்.'],
                ['q' => 'குறில் எழுத்து ஒலிக்கும் மாத்திரை அளவு என்ன?', 'opts' => ['1 மாத்திரை', '2 மாத்திரை', '½ மாத்திரை', '3 மாத்திரை'], 'ans' => '1 மாத்திரை', 'exp' => 'குறுகி ஒலிக்கும் குறில் எழுத்துகள் 1 மாத்திரை அளவு பெறும்.'],
                ['q' => 'உயிர்நெடில் எழுத்துகள் மொத்தம் எத்தனை?', 'opts' => ['7', '5', '12', '18'], 'ans' => '7', 'exp' => 'ஆ, ஈ, ஊ, ஏ, ஐ, ஓ, ஔ ஆகிய 7 எழுத்துகளும் உயிர்நெடில் எழுத்துகள் ஆகும்.'],
                ['q' => 'நெடில் எழுத்து ஒலிக்கும் மாத்திரை அளவு என்ன?', 'opts' => ['2 மாத்திரை', '1 மாத்திரை', '½ மாத்திரை', '3 மாத்திரை'], 'ans' => '2 மாத்திரை', 'exp' => 'நீண்டு ஒலிக்கும் நெடில் எழுத்துகள் 2 மாத்திரை அளவு பெறும்.'],
                ['q' => 'உயிர்மெய்க்குறில் எழுத்துகள் மொத்தம் எத்தனை?', 'opts' => ['90', '126', '216', '18'], 'ans' => '90', 'exp' => '5 உயிர்க்குறில் × 18 மெய் = 90 உயிர்மெய்க்குறில் எழுத்துகள்.'],
                ['q' => 'உயிர்மெய்நெடில் எழுத்துகள் மொத்தம் எத்தனை?', 'opts' => ['126', '90', '216', '18'], 'ans' => '126', 'exp' => '7 உயிர்நெடில் × 18 மெய் = 126 உயிர்மெய்நெடில் எழுத்துகள்.'],
                ['q' => '"க" என்ற எழுத்தின் மாத்திரை அளவு என்ன?', 'opts' => ['1 மாத்திரை', '2 மாத்திரை', '½ மாத்திரை', '¼ மாத்திரை'], 'ans' => '1 மாத்திரை', 'exp' => 'க் + அ = க → அ குறில் என்பதால் 1 மாத்திரை.'],
                ['q' => '"கா" என்ற எழுத்தின் மாத்திரை அளவு என்ன?', 'opts' => ['2 மாத்திரை', '1 மாத்திரை', '½ மாத்திரை', '3 மாத்திரை'], 'ans' => '2 மாத்திரை', 'exp' => 'க் + ஆ = கா → ஆ நெடில் என்பதால் 2 மாத்திரை.'],
                ['q' => '"மை" என்ற எழுத்தின் மாத்திரை அளவு என்ன?', 'opts' => ['2 மாத்திரை', '1 மாத்திரை', '½ மாத்திரை', '¼ மாத்திரை'], 'ans' => '2 மாத்திரை', 'exp' => 'ம் + ஐ = மை → ஐ என்பது நெடில் → 2 மாத்திரை.'],

                // === மெய் & குற்றியலுகரம்/அளபெடை (21-30) ===
                ['q' => 'மெய்யெழுத்துகள் எத்தனை வகைகளாகப் பிரிக்கப்படுகின்றன?', 'opts' => ['3', '2', '4', '5'], 'ans' => '3', 'exp' => 'வல்லினம், மெல்லினம், இடையினம் என 3 வகைகளாகப் பிரிக்கப்படுகின்றன.'],
                ['q' => 'வல்லின மெய் எழுத்துகள் எவை?', 'opts' => ['க், ச், ட், த், ப், ற்', 'ங், ஞ், ண், ந், ம், ன்', 'ய், ர், ல், வ், ழ், ள்', 'அ, இ, உ, எ, ஒ'], 'ans' => 'க், ச், ட், த், ப், ற்', 'exp' => 'கசடதபர என்ற 6 மெய்களும் வல்லினம் ஆகும்.'],
                ['q' => 'மெல்லின மெய் எழுத்துகள் எவை?', 'opts' => ['ங், ஞ், ண், ந், ம், ன்', 'க், ச், ட், த், ப், ற்', 'ய், ர், ல், வ், ழ், ள்', 'ஆ, ஈ, ஊ, ஏ, ஓ'], 'ans' => 'ங், ஞ், ண், ந், ம், ன்', 'exp' => 'ஙஞணநமன என்ற 6 மெய்களும் மெல்லினம் ஆகும்.'],
                ['q' => 'இடையின மெய் எழுத்துகள் எவை?', 'opts' => ['ய், ர், ல், வ், ழ், ள்', 'க், ச், ட், த், ப், ற்', 'ங், ஞ், ண், ந், ம், ன்', 'அ, ஆ, இ, ஈ, உ'], 'ans' => 'ய், ர், ல், வ், ழ், ள்', 'exp' => 'யரலவழள என்ற 6 மெய்களும் இடையினம் ஆகும்.'],
                ['q' => 'மெய் எழுத்துக்கள் மொத்தம் எத்தனை?', 'opts' => ['18', '12', '5', '7'], 'ans' => '18', 'exp' => 'க் முதல் ன் வரையிலான 18 மெய் எழுத்துக்கள் உள்ளன.'],
                ['q' => '18 மெய் எழுத்துக்களும் எத்தனை மாத்திரை பெற்று ஒலிக்கும்?', 'opts' => ['அரை மாத்திரை', 'ஒரு மாத்திரை', 'இரண்டு மாத்திரை', 'மூன்று மாத்திரை'], 'ans' => 'அரை மாத்திரை', 'exp' => 'புள்ளி வைத்த மெய் எழுத்துகள் ½ மாத்திரை அளவு பெறும்.'],
                ['q' => 'குற்றியலுகர எழுத்துக்கள் எவை?', 'opts' => ['கு, சு, டு, து, பு, று', 'க, ச, ட, த, ப, ற', 'கி, சி, டி, தி, பி, றி', 'கா, சா, டா, தா'], 'ans' => 'கு, சு, டு, து, பு, று', 'exp' => 'கு சு டு து பு று ஆகிய 6 எழுத்துக்களும் குற்றியலுகரமாக ஒலிக்கும்.'],
                ['q' => 'குற்றியலுகரம் எத்தனை மாத்திரை அளவு பெறும்?', 'opts' => ['½ மாத்திரை', '1 மாத்திரை', '2 மாத்திரை', '¼ மாத்திரை'], 'ans' => '½ மாத்திரை', 'exp' => 'குற்றியலுகரம் ½ மாத்திரை பெற்று ஒலிக்கும்.'],
                ['q' => 'உயிரளபெடை என்றால் என்ன?', 'opts' => ['நெட்டெழுத்துக்கள் 2 மாத்திரையிலிருந்து 3 மாத்திரையாக நீண்டு ஒலிப்பது', 'குறில் 1 மாத்திரையிலிருந்து குறைவது', 'மெய் நீண்டு 1 மாத்திரை பெறுவது', 'ஐகாரம் குறுகுவது'], 'ans' => 'நெட்டெழுத்துக்கள் 2 மாத்திரையிலிருந்து 3 மாத்திரையாக நீண்டு ஒலிப்பது', 'exp' => 'உயிர் நெட்டெழுத்துக்கள் 2 மாத்திரையிலிருந்து 3 மாத்திரையாக ஒலிப்பதே உயிரளபெடை.'],
                ['q' => '"மங்ங்கலம்" என்பதில் ஒலிக்கும் "ங்ங்" என்ன ஒலி நிகழ்வு?', 'opts' => ['ஒற்றளபெடை', 'உயிரளபெடை', 'குற்றியலுகரம்', 'ஐகாரக்குறுக்கம்'], 'ans' => 'ஒற்றளபெடை', 'exp' => 'ங் மெய் நீண்டு ங்ங் என ஒலிப்பது ஒற்றளபெடை.']
            ];

            $activityContentBlocks = [];
            $activityContentBlocks[] = [
                'type' => 'paragraph',
                'data' => [
                    'text' => '<h2 class="text-primary text-center mb-4">எழுத்து – பயிற்சி வினாக்கள்</h2><p class="fs-5 text-center">நீங்கள் படித்த எழுத்து, மாத்திரை, குறில், நெடில், மெய், குற்றியலுகரம், அளபெடை பாடங்களின் அடிப்படையிலான பயிற்சி வினாக்கள்.</p>'
                ]
            ];

            foreach ($mcqQuestions as $idx => $qData) {
                $options = [];
                foreach ($qData['opts'] as $optIdx => $optText) {
                    $options[] = [
                        'id'        => $optIdx + 1,
                        'text'      => $optText,
                        'isCorrect' => ($optText === $qData['ans'])
                    ];
                }

                $activityContentBlocks[] = [
                    'type' => 'activity',
                    'data' => [
                        'type'        => 'mcq',
                        'title'       => 'எழுத்து வினா #' . ($idx + 1),
                        'question'    => $qData['q'],
                        'options'     => $options,
                        'explanation' => $qData['exp']
                    ]
                ];
            }

            Content::where('title', 'LIKE', '%எழுத்துப் பயிற்சி - 50%')
                ->get()
                ->each(function($oc) {
                    DB::table('content_chapters')->where('content_id', $oc->id)->delete();
                    $oc->delete();
                });

            $contentMcqOnly = Content::create([
                'name'         => 'எழுத்துப் பயிற்சி - 50',
                'title'        => 'எழுத்துப் பயிற்சி - 50',
                'text_content' => json_encode(['blocks' => $activityContentBlocks], JSON_UNESCAPED_UNICODE),
                'is_active'    => true,
            ]);

            DB::table('content_chapters')->insert([
                'chapter_id' => $eluthuChapter->id,
                'content_id' => $contentMcqOnly->id,
            ]);

            // Detective Activity
            Content::where('title', 'LIKE', '%எழுத்து பிழை திருத்துதல் - 50%')
                ->get()
                ->each(function($oc) {
                    DB::table('content_chapters')->where('content_id', $oc->id)->delete();
                    $oc->delete();
                });

            $eluthuDetectiveList = [
                ['word' => 'தாமரை',  'correct' => ['தா', 'ம', 'ரை'],   'wrongs' => [['தா', 'ம', 'ரை'], ['தா', 'ம', 'ரை'], ['த', 'ம', 'ரை']]],
                ['word' => 'கல்வி',   'correct' => ['க', 'ல்', 'வி'],   'wrongs' => [['க', 'ள்', 'வி'], ['க', 'ல்', 'வீ'], ['க', 'ல', 'வி']]],
                ['word' => 'அகரம்',  'correct' => ['அ', 'க', 'ர', 'ம்'], 'wrongs' => [['ஆ', 'க', 'ர', 'ம்'], ['அ', 'க', 'ற', 'ம்'], ['அ', 'க', 'ர', 'ன்']]],
                ['word' => 'கண்ணன்', 'correct' => ['க', 'ண்', 'ண', 'ன்'], 'wrongs' => [['க', 'ன்', 'ன', 'ன்'], ['க', 'ண்', 'ன', 'ன்'], ['க', 'ன்', 'ண', 'ன்']]],
                ['word' => 'அம்மா',  'correct' => ['அ', 'ம்', 'மா'],   'wrongs' => [['ஆ', 'ம்', 'மா'], ['அ', 'ம்', 'ம'], ['அ', 'ம', 'மா']]],
                ['word' => 'அப்பா',  'correct' => ['அ', 'ப்', 'பா'],   'wrongs' => [['ஆ', 'ப்', 'பா'], ['அ', 'ப்', 'ப'], ['அ', 'ப', 'பா']]],
                ['word' => 'தம்பி',  'correct' => ['த', 'ம்', 'பி'],   'wrongs' => [['தா', 'ம்', 'பி'], ['த', 'ம்', 'பீ'], ['த', 'ம', 'பி']]],
                ['word' => 'செல்வம்', 'correct' => ['செ', 'ல்', 'வ', 'ம்'], 'wrongs' => [['செ', 'ள்', 'வ', 'ம்'], ['சே', 'ல்', 'வ', 'ம்'], ['செ', 'ல்', 'வ', 'ன்']]],
                ['word' => 'பள்ளி',  'correct' => ['ப', 'ள்', 'ளி'],   'wrongs' => [['ப', 'ல்', 'லி'], ['ப', 'ழ்', 'ழி'], ['பா', 'ள்', 'ளி']]],
                ['word' => 'நாடு',   'correct' => ['நா', 'டு'],        'wrongs' => [['ந', 'டு'], ['நா', 'டூ'], ['னா', 'டு']]]
            ];

            $eluthuDetectiveBlocks = [];
            foreach ($eluthuDetectiveList as $edIdx => $edItem) {
                $eluthuDetectiveBlocks[] = [
                    'type' => 'activity',
                    'data' => [
                        'type'          => 'eluthu_detective',
                        'title'         => 'எழுத்து பிழை திருத்துதல் #' . ($edIdx + 1),
                        'word'          => $edItem['word'],
                        'correctSplits' => $edItem['correct'],
                        'wrongOptions'  => $edItem['wrongs'],
                        'explanation'   => "சொல்: {$edItem['word']} — சரியான எழுத்து உச்சரிப்பு மற்றும் மயங்கொலி விதிகளைப் பின்பற்றி அமைக்கப்பட்டுள்ளது."
                    ]
                ];
            }

            $contentEluthuDetective = Content::create([
                'name'         => 'எழுத்து பிழை திருத்துதல் - 50',
                'title'        => 'எழுத்து பிழை திருத்துதல் - 50',
                'text_content' => json_encode(['blocks' => $eluthuDetectiveBlocks], JSON_UNESCAPED_UNICODE),
                'is_active'    => true,
            ]);

            DB::table('content_chapters')->insert([
                'chapter_id' => $eluthuChapter->id,
                'content_id' => $contentEluthuDetective->id,
            ]);
        }
    }
}
