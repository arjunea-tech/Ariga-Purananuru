const UYIR_KURIL = ['அ', 'இ', 'உ', 'எ', 'ஒ'];
const UYIR_NEDIL = ['ஆ', 'ஈ', 'ஊ', 'ஏ', 'ஐ', 'ஓ', 'ஔ'];
const MEI_LETTERS = ['க்', 'ங்', 'ச்', 'ஞ்', 'ட்', 'ண்', 'த்', 'ந்', 'ப்', 'ம்', 'ய்', 'ர்', 'ல்', 'வ்', 'ழ்', 'ள்', 'ற்', 'ன்'];
const OTTRU_LETTERS = [...MEI_LETTERS, 'ஃ'];

const CONSONANTS = ['க', 'ங', 'ச', 'ஞ', 'ட', 'ண', 'த', 'ந', 'ப', 'ம', 'ய', 'ர', 'ல', 'வ', 'ழ', 'ள', 'ற', 'ன'];

const UYIRMEI_KURIL_I = ['கி', 'ஙி', 'சி', 'ஞி', 'டி', 'ணி', 'தி', 'நி', 'பி', 'மி', 'யி', 'ரி', 'லி', 'வி', 'ழி', 'ளி', 'றி', 'னி'];
const UYIRMEI_KURIL_U = ['கு', 'ஙு', 'சு', 'ஞு', 'டு', 'ணு', 'து', 'நு', 'பு', 'மு', 'யு', 'ரு', 'லு', 'வு', 'ழு', 'ளு', 'று', 'னு'];
const UYIRMEI_KURIL_E = ['கெ', 'ஙெ', 'செ', 'ஞெ', 'டெ', 'ணெ', 'தெ', 'நெ', 'பெ', 'மெ', 'யெ', 'ரெ', 'லெ', 'வெ', 'ழெ', 'ளெ', 'றெ', 'னெ'];
const UYIRMEI_KURIL_O = ['கொ', 'ஙொ', 'சொ', 'ஞொ', 'டொ', 'ணொ', 'தொ', 'நொ', 'பொ', 'மொ', 'யொ', 'ரொ', 'லொ', 'வொ', 'ழொ', 'ளொ', 'றொ', 'னொ'];

const KURIL_LETTERS = [
  ...UYIR_KURIL,
  ...CONSONANTS,
  ...UYIRMEI_KURIL_I,
  ...UYIRMEI_KURIL_U,
  ...UYIRMEI_KURIL_E,
  ...UYIRMEI_KURIL_O
];

const UYIRMEI_NEDIL_A = ['கா', 'ஙா', 'சா', 'ஞா', 'டா', 'ணா', 'தா', 'நா', 'பா', 'மா', 'யா', 'ரா', 'லா', 'வா', 'ழா', 'ளா', 'றா', 'னா'];
const UYIRMEI_NEDIL_I = ['கீ', 'ஙீ', 'சீ', 'ஞீ', 'டீ', 'ணீ', 'தீ', 'நீ', 'பீ', 'மீ', 'யீ', 'ரீ', 'லீ', 'வீ', 'ழீ', 'ளீ', 'றீ', 'னீ'];
const UYIRMEI_NEDIL_U = ['கூ', 'ஙூ', 'சூ', 'ஞூ', 'டூ', 'ணூ', 'தூ', 'நூ', 'பூ', 'மூ', 'யூ', 'ரூ', 'லூ', 'வூ', 'ழூ', 'ளூ', 'றூ', 'னூ'];
const UYIRMEI_NEDIL_E = ['கே', 'ஙே', 'சே', 'ஞே', 'டே', 'ணே', 'தே', 'நே', 'பே', 'மே', 'யே', 'ரே', 'லே', 'வே', 'ழே', 'ளே', 'றே', 'னே'];
const UYIRMEI_NEDIL_AI = ['கை', 'ஙை', 'சை', 'ஞை', 'டை', 'ணை', 'தை', 'நை', 'பை', 'மை', 'யை', 'ரை', 'லை', 'வை', 'ழை', 'ளை', 'றை', 'னை'];
const UYIRMEI_NEDIL_O = ['கோ', 'ஙோ', 'சோ', 'ஞோ', 'டோ', 'ணோ', 'தோ', 'நோ', 'போ', 'மோ', 'யோ', 'ரோ', 'லோ', 'வோ', 'ழோ', 'ளோ', 'றோ', 'னோ'];
const UYIRMEI_NEDIL_AU = ['கௌ', 'ஙௌ', 'சௌ', 'ஞௌ', 'டௌ', 'ணௌ', 'தௌ', 'நௌ', 'பௌ', 'மௌ', 'யௌ', 'ரௌ', 'லௌ', 'வௌ', 'ழௌ', 'ளௌ', 'றௌ', 'னௌ'];

const NEDIL_LETTERS = [
  ...UYIR_NEDIL,
  ...UYIRMEI_NEDIL_A,
  ...UYIRMEI_NEDIL_I,
  ...UYIRMEI_NEDIL_U,
  ...UYIRMEI_NEDIL_E,
  ...UYIRMEI_NEDIL_AI,
  ...UYIRMEI_NEDIL_O,
  ...UYIRMEI_NEDIL_AU
];

function generateTamilOddOneOut(type: string): { question: string, options: any[], explanation: string } {
  const choices = ['kuril_nedil', 'mei_non_mei', 'otru_non_otru'];
  const selectedType = type === 'random' ? choices[Math.floor(Math.random() * choices.length)] : type;

  let question = '';
  let options: any[] = [];
  let explanation = '';

  const shuffle = (arr: any[]) => [...arr].sort(() => 0.5 - Math.random());

  if (selectedType === 'kuril_nedil') {
    const isKurilQuestion = Math.random() < 0.5;
    if (isKurilQuestion) {
      // Find the Kuril letter among Nedil letters (3 Nedil, 1 Kuril)
      const correctLetter = shuffle(KURIL_LETTERS)[0];
      const incorrectLetters = shuffle(NEDIL_LETTERS).slice(0, 3);
      question = 'கீழ்க்கண்டவற்றுள் குறில் எழுத்து எது?';
      options = [
        { text: correctLetter, isCorrect: true },
        { text: incorrectLetters[0], isCorrect: false },
        { text: incorrectLetters[1], isCorrect: false },
        { text: incorrectLetters[2], isCorrect: false }
      ];
      explanation = `குறில் எழுத்து குறுகிய ஓசையுடையது. இங்கு "${correctLetter}" என்பது குறில் எழுத்து, மற்றவை நெடில் எழுத்துக்கள்.`;
    } else {
      // Find the Nedil letter among Kuril letters (3 Kuril, 1 Nedil)
      const correctLetter = shuffle(NEDIL_LETTERS)[0];
      const incorrectLetters = shuffle(KURIL_LETTERS).slice(0, 3);
      question = 'கீழ்க்கண்டவற்றுள் நெடில் எழுத்து எது?';
      options = [
        { text: correctLetter, isCorrect: true },
        { text: incorrectLetters[0], isCorrect: false },
        { text: incorrectLetters[1], isCorrect: false },
        { text: incorrectLetters[2], isCorrect: false }
      ];
      explanation = `நெடில் எழுத்து நீண்ட ஓசையுடையது. இங்கு "${correctLetter}" என்பது நெடில் எழுத்து, மற்றவை குறில் எழுத்துக்கள்.`;
    }
  } else if (selectedType === 'mei_non_mei') {
    const isMeiQuestion = Math.random() < 0.5;
    if (isMeiQuestion) {
      // Find the Mei letter among non-Mei (Kuril/Nedil) letters (3 non-Mei, 1 Mei)
      const correctLetter = shuffle(MEI_LETTERS)[0];
      const allNonMei = [...KURIL_LETTERS, ...NEDIL_LETTERS];
      const incorrectLetters = shuffle(allNonMei).slice(0, 3);
      question = 'கீழ்க்கண்டவற்றுள் மெய் எழுத்து எது?';
      options = [
        { text: correctLetter, isCorrect: true },
        { text: incorrectLetters[0], isCorrect: false },
        { text: incorrectLetters[1], isCorrect: false },
        { text: incorrectLetters[2], isCorrect: false }
      ];
      explanation = `மெய் எழுத்து புள்ளி வைத்த எழுத்து ஆகும். இங்கு "${correctLetter}" என்பது மெய் எழுத்து, மற்றவை உயிர்/உயிர்மெய் எழுத்துக்கள்.`;
    } else {
      // Find the non-Mei letter among Mei letters (3 Mei, 1 non-Mei)
      const allNonMei = [...KURIL_LETTERS, ...NEDIL_LETTERS];
      const correctLetter = shuffle(allNonMei)[0];
      const incorrectLetters = shuffle(MEI_LETTERS).slice(0, 3);
      question = 'கீழ்க்கண்டவற்றுள் மெய் எழுத்து அல்லாதது எது?';
      options = [
        { text: correctLetter, isCorrect: true },
        { text: incorrectLetters[0], isCorrect: false },
        { text: incorrectLetters[1], isCorrect: false },
        { text: incorrectLetters[2], isCorrect: false }
      ];
      explanation = `இங்கு "${correctLetter}" என்பது உயிர்/உயிர்மெய் எழுத்து (மெய் அல்லாதது), மற்றவை மெய் எழுத்துக்கள்.`;
    }
  } else {
    // otru_non_otru
    const isOtruQuestion = Math.random() < 0.5;
    if (isOtruQuestion) {
      // Find the Otru letter (3 non-Otru, 1 Otru)
      const correctLetter = shuffle(OTTRU_LETTERS)[0];
      const allNonOtru = [...KURIL_LETTERS, ...NEDIL_LETTERS];
      const incorrectLetters = shuffle(allNonOtru).slice(0, 3);
      question = 'கீழ்க்கண்டவற்றுள் ஒற்று எழுத்து எது?';
      options = [
        { text: correctLetter, isCorrect: true },
        { text: incorrectLetters[0], isCorrect: false },
        { text: incorrectLetters[1], isCorrect: false },
        { text: incorrectLetters[2], isCorrect: false }
      ];
      explanation = `ஒற்று எழுத்து என்பது மெய் எழுத்து அல்லது ஆயுத எழுத்து ஆகும். இங்கு "${correctLetter}" என்பது ஒற்று எழுத்து, மற்றவை உயிர்/உயிர்மெய் எழுத்துக்கள்.`;
    } else {
      // Find the non-Otru letter (3 Otru, 1 non-Otru)
      const allNonOtru = [...KURIL_LETTERS, ...NEDIL_LETTERS];
      const correctLetter = shuffle(allNonOtru)[0];
      const incorrectLetters = shuffle(OTTRU_LETTERS).slice(0, 3);
      question = 'கீழ்க்கண்டவற்றுள் ஒற்று அல்லாத எழுத்து எது?';
      options = [
        { text: correctLetter, isCorrect: true },
        { text: incorrectLetters[0], isCorrect: false },
        { text: incorrectLetters[1], isCorrect: false },
        { text: incorrectLetters[2], isCorrect: false }
      ];
      explanation = `இங்கு "${correctLetter}" என்பது உயிர்/உயிர்மெய் எழுத்து (ஒற்று அல்லாதது), மற்றவை ஒற்று எழுத்துக்கள்.`;
    }
  }

  // Shuffle options so the correct answer position is randomized
  options = shuffle(options);

  return { question, options, explanation };
}

export function renderOddOneOutForm(
  parent: HTMLDivElement,
  data: any,
  api: any,
  renderExplanationInput: (parent: HTMLDivElement, data: any) => void
): void {
  // Initialize with exactly 4 options if not already set or if different count
  if (!data.options || data.options.length !== 4) {
    data.options = [
      { text: '', isCorrect: true },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false }
    ];
  }

  // 0. Auto-generator section (rendered at the top)
  const genSection = document.createElement('div');
  genSection.classList.add('activity-form-group');
  genSection.style.border = '1px dashed #6366f1';
  genSection.style.borderRadius = '0.5rem';
  genSection.style.padding = '0.75rem';
  genSection.style.marginBottom = '1.25rem';
  genSection.style.background = '#f5f3ff';

  genSection.innerHTML = `
    <label class="activity-editor-label" style="color: #4f46e5; font-weight: bold; margin-bottom: 0.5rem; display: block;">
      தமிழ் எழுத்துக்கள் தானியங்கி உருவாக்கம் (Tamil Letters Auto-Generator)
    </label>
    <div style="display: flex; gap: 0.5rem; align-items: center;">
      <select class="activity-editor-select gen-type-select" style="flex-grow: 1; padding: 0.4rem; border: 1px solid #cbd5e1; border-radius: 0.375rem;">
        <option value="random">Random (ரேண்டம்)</option>
        <option value="kuril_nedil">Kuril vs Nedil (குறில் / நெடில்)</option>
        <option value="mei_non_mei">Mei vs Non-Mei (மெய் / மெய் அல்லாதது)</option>
        <option value="otru_non_otru">Otru vs Non-Otru (ஒற்று / ஒற்று அல்லாதது)</option>
      </select>
      <button type="button" class="activity-btn activity-btn-primary gen-btn" style="background: linear-gradient(135deg, #6366f1, #4f46e5); color: white; padding: 0.4rem 1rem; font-size: 0.85rem; border: none; border-radius: 0.375rem; cursor: pointer; font-weight: 600;">
        Generate
      </button>
    </div>
  `;
  parent.appendChild(genSection);

  // 1. Question input
  const qGroup = document.createElement('div');
  qGroup.classList.add('activity-form-group');
  qGroup.innerHTML = `
    <label class="activity-editor-label">Question / Instruction Text</label>
    <input type="text" class="activity-input-text odd-question" value="${data.question || ''}" placeholder="E.g., வேறுபட்ட சொல்லைத் தேர்ந்தெடு (Find the odd word)">
  `;
  parent.appendChild(qGroup);

  const qInput = qGroup.querySelector('.odd-question') as HTMLInputElement;
  qInput.addEventListener('input', (e: any) => { data.question = e.target.value; });

  // 1b. Audio URL input (Optional)
  const audioGroup = document.createElement('div');
  audioGroup.classList.add('activity-form-group');
  audioGroup.innerHTML = `
    <label class="activity-editor-label">Audio URL (Optional)</label>
    <input type="text" class="activity-input-text odd-audio" value="${data.audioUrl || ''}" placeholder="E.g., https://example.com/audio/pronounce.mp3">
  `;
  parent.appendChild(audioGroup);

  const audioInput = audioGroup.querySelector('.odd-audio') as HTMLInputElement;
  audioInput.addEventListener('input', (e: any) => { data.audioUrl = e.target.value; });

  // 2. Options list
  const optionsGroup = document.createElement('div');
  optionsGroup.classList.add('activity-form-group');

  const optionsLabel = document.createElement('label');
  optionsLabel.classList.add('activity-editor-label');
  optionsLabel.textContent = '4 Options (Select the radio next to the Odd One Out)';
  optionsGroup.appendChild(optionsLabel);

  const rowsContainer = document.createElement('div');
  rowsContainer.classList.add('odd-rows-container');

  const renderOptionRows = () => {
    rowsContainer.innerHTML = '';
    data.options.forEach((opt: any, idx: number) => {
      const row = document.createElement('div');
      row.classList.add('activity-row');
      row.style.marginBottom = '0.5rem';

      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = `odd-correct-${api.blocks.getCurrentBlockIndex()}`;
      radio.classList.add('activity-radio');
      radio.checked = !!opt.isCorrect;
      radio.addEventListener('change', () => {
        data.options.forEach((o: any, i: number) => o.isCorrect = i === idx);
      });

      const input = document.createElement('input');
      input.type = 'text';
      input.classList.add('activity-input-text');
      input.style.flexGrow = '1';
      input.value = opt.text || '';
      input.placeholder = `Option ${idx + 1}`;
      input.addEventListener('input', (e: any) => {
        opt.text = e.target.value;
      });

      row.appendChild(radio);
      row.appendChild(input);
      rowsContainer.appendChild(row);
    });
  };

  renderOptionRows();
  optionsGroup.appendChild(rowsContainer);
  parent.appendChild(optionsGroup);

  // 3. Explanation
  renderExplanationInput(parent, data);

  // Wire up the Auto-generate button click event
  const genBtn = genSection.querySelector('.gen-btn') as HTMLButtonElement;
  const genSelect = genSection.querySelector('.gen-type-select') as HTMLSelectElement;

  genBtn.addEventListener('click', () => {
    const mode = genSelect.value;
    const generated = generateTamilOddOneOut(mode);

    data.question = generated.question;
    data.options = generated.options;
    data.explanation = generated.explanation;

    // Update the inputs in the UI
    qInput.value = data.question;
    
    const explanationTextarea = parent.querySelector('.activity-explanation') as HTMLTextAreaElement;
    if (explanationTextarea) {
      explanationTextarea.value = data.explanation;
    }

    // Redraw the options
    renderOptionRows();
  });
}
