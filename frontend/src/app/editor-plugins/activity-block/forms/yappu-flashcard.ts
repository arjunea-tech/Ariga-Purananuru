function splitTamilLetters(str: string): string[] {
  const letters: string[] = [];
  let i = 0;
  while (i < str.length) {
    if (i + 1 < str.length) {
      if (['்', 'ா', 'ி', 'ீ', 'ு', 'ூ', 'ெ', 'ே', 'ை', 'ொ', 'ோ', 'ௌ'].includes(str[i + 1])) {
        letters.push(str.substring(i, i + 2));
        i += 2;
        continue;
      }
    }
    letters.push(str[i]);
    i += 1;
  }
  return letters;
}

function getMathirai(letter: string): number {
  const MEI_LETTERS = ['க்', 'ங்', 'ச்', 'ஞ்', 'ட்', 'ண்', 'த்', 'ந்', 'ப்', 'ம்', 'ய்', 'ர்', 'ல்', 'வ்', 'ழ்', 'ள்', 'ற்', 'ன்'];
  const NEDIL_LETTERS = ['ஆ', 'ஈ', 'ஊ', 'ஏ', 'ஐ', 'ஓ', 'ஔ'];
  const NEDIL_COMBINATIONS = ['ா', 'ீ', 'ூ', 'ே', 'ை', 'ோ', 'ௌ'];

  if (letter === 'ஃ') return 0; // ஆய்தம்
  if (MEI_LETTERS.includes(letter) || letter.includes('்')) {
    return 0;
  } else if (NEDIL_LETTERS.includes(letter)) {
    return 2;
  } else {
    for (const combo of NEDIL_COMBINATIONS) {
      if (letter.includes(combo)) {
        return 2;
      }
    }
    return 1;
  }
}

function identifyAsai(word: string): Array<{ text: string, type: string }> {
  const letters = splitTamilLetters(word);
  const mathirai = letters.map(l => getMathirai(l));
  const asai_groups: Array<{ text: string, type: string }> = [];
  let i = 0;

  while (i < letters.length) {
    const curr = mathirai[i];

    if (curr === 2) {
      if (i + 2 < letters.length && mathirai[i + 1] === 0 && mathirai[i + 2] === 0) {
        asai_groups.push({ text: letters.slice(i, i + 3).join(''), type: 'நேர்' });
        i += 3;
      } else if (i + 1 < letters.length && mathirai[i + 1] === 0) {
        asai_groups.push({ text: letters.slice(i, i + 2).join(''), type: 'நேர்' });
        i += 2;
      } else {
        asai_groups.push({ text: letters[i], type: 'நேர்' });
        i += 1;
      }
    } else if (curr === 1) {
      if (i + 3 < letters.length && [1, 2].includes(mathirai[i + 1]) && mathirai[i + 2] === 0 && mathirai[i + 3] === 0) {
        asai_groups.push({ text: letters.slice(i, i + 4).join(''), type: 'நிரை' });
        i += 4;
        continue;
      }
      if (i + 2 < letters.length && [1, 2].includes(mathirai[i + 1]) && mathirai[i + 2] === 0) {
        asai_groups.push({ text: letters.slice(i, i + 3).join(''), type: 'நிரை' });
        i += 3;
        continue;
      }
      if (i + 1 < letters.length && [1, 2].includes(mathirai[i + 1])) {
        asai_groups.push({ text: letters.slice(i, i + 2).join(''), type: 'நிரை' });
        i += 2;
        continue;
      }
      if (i + 2 < letters.length && mathirai[i + 1] === 0 && mathirai[i + 2] === 0) {
        asai_groups.push({ text: letters.slice(i, i + 3).join(''), type: 'நேர்' });
        i += 3;
      } else if (i + 1 < letters.length && mathirai[i + 1] === 0) {
        asai_groups.push({ text: letters.slice(i, i + 2).join(''), type: 'நேர்' });
        i += 2;
      } else {
        asai_groups.push({ text: letters[i], type: 'நேர்' });
        i += 1;
      }
    } else if (curr === 0) {
      if (i + 1 < letters.length) {
        asai_groups.push({ text: letters.slice(i, i + 2).join(''), type: 'நேர்' });
        i += 2;
      } else {
        asai_groups.push({ text: letters[i], type: 'நேர்' });
        i += 1;
      }
    }
  }
  return asai_groups;
}

export function renderYappuFlashcardForm(
  parent: HTMLDivElement,
  data: any,
  renderExplanationInput: (parent: HTMLDivElement, data: any) => void
): void {
  // Initialize defaults
  if (!data.question) {
    data.question = "30 வினாடிகளில் சரியான அசை வாய்பாட்டைத் தேர்ந்தெடுக்கவும்:";
  }
  if (!data.syllableCount) {
    data.syllableCount = 2;
  }
  if (!data.text) {
    data.text = "கல்வி, வாழ்க, தமிழ், அம்மா";
  }

  // 1. Question text field
  const qGroup = document.createElement('div');
  qGroup.classList.add('activity-form-group');
  qGroup.innerHTML = `
    <label class="activity-editor-label">Question Text</label>
    <input type="text" class="activity-input-text flashcard-question" value="${data.question}" placeholder="E.g., 30 வினாடிகளில் சரியான அசை வாய்பாட்டைத் தேர்ந்தெடுக்கவும்:">
  `;
  parent.appendChild(qGroup);

  const qInput = qGroup.querySelector('.flashcard-question') as HTMLInputElement;
  qInput.addEventListener('input', (e: any) => { 
    data.question = e.target.value; 
  });

  // 2. Syllable Count select dropdown
  const sylGroup = document.createElement('div');
  sylGroup.classList.add('activity-form-group');
  sylGroup.innerHTML = `
    <label class="activity-editor-label">Syllables per Word (வார்த்தை ஒன்றிற்கு அசை எண்ணிக்கை)</label>
    <select class="activity-editor-select flashcard-syllables">
      <option value="1" ${Number(data.syllableCount) === 1 ? 'selected' : ''}>1 Box (1 அசை - e.g. கல், பூ)</option>
      <option value="2" ${Number(data.syllableCount) === 2 ? 'selected' : ''}>2 Boxes (2 அசை - e.g. கல்வி, வாழ்க)</option>
      <option value="3" ${Number(data.syllableCount) === 3 ? 'selected' : ''}>3 Boxes (3 அசை - e.g. கருவிளம், புளிமாங்காய்)</option>
    </select>
  `;
  parent.appendChild(sylGroup);

  const sylSelect = sylGroup.querySelector('.flashcard-syllables') as HTMLSelectElement;

  // 3. Words list field
  const txtGroup = document.createElement('div');
  txtGroup.classList.add('activity-form-group');
  txtGroup.innerHTML = `
    <label class="activity-editor-label">Target Words (Comma-separated / கமாவால் பிரிக்கப்பட்ட வார்த்தைகள்)</label>
    <input type="text" class="activity-input-text flashcard-text" value="${data.text}" placeholder="E.g., கல்வி, வாழ்க, தமிழ், அம்மா">
    <small class="activity-helper-text">
      Enter words matching the selected syllable count. These will be shown sequentially during the 30-second race.
    </small>
  `;
  parent.appendChild(txtGroup);

  // 4. Syllable preview container
  const previewGroup = document.createElement('div');
  previewGroup.classList.add('activity-form-group');
  previewGroup.innerHTML = `
    <label class="activity-editor-label">Validation Preview (அசை வாய்பாடு சரிபார்ப்பு)</label>
    <div class="flashcard-preview-container" style="display: flex; flex-direction: column; gap: 0.75rem; border: 1.5px dashed #cbd5e1; border-radius: 0.75rem; padding: 1rem; background: #f8fafc; min-height: 60px;">
    </div>
  `;
  parent.appendChild(previewGroup);

  const previewContainer = previewGroup.querySelector('.flashcard-preview-container') as HTMLDivElement;
  const txtInput = txtGroup.querySelector('.flashcard-text') as HTMLInputElement;

  const updatePreview = () => {
    previewContainer.innerHTML = '';
    const words = txtInput.value.split(',').map(w => w.trim()).filter(Boolean);
    const expectedSylCount = Number(sylSelect.value);
    
    if (words.length === 0) {
      previewContainer.innerHTML = '<span style="color: #64748b; font-style: italic;">No words entered yet.</span>';
      return;
    }

    words.forEach(word => {
      const asais = identifyAsai(word);
      const formula = asais.map(a => a.type).join(' + ');
      const syllables = asais.map(a => `${a.text} (${a.type})`).join(', ');
      const isValidCount = asais.length === expectedSylCount;

      const row = document.createElement('div');
      row.style.background = '#ffffff';
      row.style.border = `1px solid ${isValidCount ? '#cbd5e1' : '#fca5a5'}`;
      row.style.background = isValidCount ? '#ffffff' : '#fef2f2';
      row.style.borderRadius = '0.5rem';
      row.style.padding = '0.5rem 0.75rem';
      row.style.display = 'flex';
      row.style.flexDirection = 'column';
      row.style.gap = '0.25rem';

      row.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <strong style="color: ${isValidCount ? '#0f172a' : '#991b1b'}; font-size: 1.05rem;">${word}</strong>
          <span style="background: ${isValidCount ? '#eff6ff' : '#fee2e2'}; color: ${isValidCount ? '#1d4ed8' : '#991b1b'}; font-size: 0.75rem; font-weight: bold; padding: 0.25rem 0.5rem; border-radius: 9999px;">
            ${formula || 'Unknown'} (${asais.length} Asai)
          </span>
        </div>
        <div style="font-size: 0.8rem; color: #64748b;">
          ${isValidCount 
            ? `Syllables: ${syllables || 'None'}` 
            : `<span style="color: #dc2626; font-weight: bold;">Warning: Expected ${expectedSylCount} Asai, but word has ${asais.length} Asai!</span>`}
        </div>
      `;
      previewContainer.appendChild(row);
    });
  };

  sylSelect.addEventListener('change', (e: any) => {
    data.syllableCount = Number(e.target.value);
    // Provide smart defaults for words if empty or placeholder
    if (data.syllableCount === 1 && data.text === "கல்வி, வாழ்க, தமிழ், அம்மா") {
      data.text = "கல், கா, நாள், பூ";
      txtInput.value = data.text;
    } else if (data.syllableCount === 2 && data.text === "கல், கா, நாள், பூ") {
      data.text = "கல்வி, வாழ்க, தமிழ், அம்மா";
      txtInput.value = data.text;
    } else if (data.syllableCount === 3 && (data.text === "கல், கா, நாள், பூ" || data.text === "கல்வி, வாழ்க, தமிழ், அம்மா")) {
      data.text = "கருவிளம், புளிமாங்காய், கணினிகள்";
      txtInput.value = data.text;
    }
    updatePreview();
  });

  txtInput.addEventListener('input', (e: any) => { 
    data.text = e.target.value; 
    updatePreview();
  });

  updatePreview();

  // 5. Explanation Input
  renderExplanationInput(parent, data);
}
