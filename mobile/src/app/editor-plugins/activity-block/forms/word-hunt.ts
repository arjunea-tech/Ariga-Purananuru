const KURIL_LETTERS = ['அ', 'இ', 'உ', 'எ', 'ஒ', 'க', 'கி', 'கு', 'கெ', 'கொ', 'ச', 'சி', 'சு', 'செ', 'சொ', 'த', 'தி', 'து', 'தெ', 'தொ', 'ப', 'பி', 'பு', 'பெ', 'பொ', 'ம', 'மி', 'மு', 'மெ', 'மொ', 'வ', 'வி', 'வு', 'வெ', 'வொ', 'ட', 'டி', 'டு', 'டெ', 'டொ', 'ந', 'நி', 'நு', 'நெ', 'நொ', 'ல', 'லி', 'லு', 'லெ', 'லொ', 'ர', 'ரி', 'ரு', 'ரெ', 'ரொ'];
const NEDIL_LETTERS = ['ஆ', 'ஈ', 'ஊ', 'ஏ', 'ஐ', 'ஓ', 'ஔ', 'கா', 'கீ', 'கூ', 'கே', 'கை', 'கோ', 'கௌ', 'சா', 'சீ', 'சூ', 'சே', 'சை', 'சோ', 'சௌ', 'தா', 'தீ', 'தூ', 'தே', 'தை', 'தோ', 'தௌ', 'பா', 'பீ', 'பூ', 'பே', 'பை', 'போ', 'பௌ', 'மா', 'மீ', 'மூ', 'மே', 'மை', 'மோ', 'மௌ', 'டா', 'டீ', 'டூ', 'டே', 'டை', 'டோ', 'டௌ', 'நா', 'நீ', 'நூ', 'நே', 'நை', 'நோ', 'நௌ', 'லா', 'லீ', 'லூ', 'லே', 'லை', 'லோ', 'லௌ', 'ரா', 'ரீ', 'ரூ', 'ரே', 'ரை', 'ரோ', 'ரௌ'];
const MEI_LETTERS = ['க்', 'ங்', 'ச்', 'ஞ்', 'ட்', 'ண்', 'த்', 'ந்', 'ப்', 'ம்', 'ய்', 'ர்', 'ல்', 'வ்', 'ழ்', 'ள்', 'ற்', 'ன்'];
const OTTRU_LETTERS = ['க்', 'ங்', 'ச்', 'ஞ்', 'ட்', 'ண்', 'த்', 'ந்', 'ப்', 'ம்', 'ய்', 'ர்', 'ல்', 'வ்', 'ழ்', 'ள்', 'ற்', 'ன்', 'ஃ'];

function splitTamilLetters(text: string): string[] {
  const letters: string[] = [];
  const tamilBase = /[\u0B85-\u0B94\u0B95-\u0BB9\u0B83]/;
  const tamilModifier = /[\u0BBE-\u0BCD\u0BD7]/;
  
  let i = 0;
  while (i < text.length) {
    let char = text[i];
    if (tamilBase.test(char)) {
      let letter = char;
      i++;
      while (i < text.length && tamilModifier.test(text[i])) {
        letter += text[i];
        i++;
      }
      letters.push(letter);
    } else {
      if (char.trim() !== '') {
        letters.push(char);
      }
      i++;
    }
  }
  return letters;
}

export function renderWordHuntForm(
  parent: HTMLDivElement,
  data: any,
  renderExplanationInput: (parent: HTMLDivElement, data: any) => void
): void {
  // Initialize default properties
  if (!data.targetWord) {
    data.targetWord = '';
  }
  if (!data.gridSize) {
    data.gridSize = data.boxes?.length || 2;
  }
  if (!data.boxes || data.boxes.length === 0) {
    data.boxes = [
      { text: '', isCorrect: false },
      { text: '', isCorrect: false }
    ];
    data.gridSize = 2;
  }

  // 1. Question input
  const qGroup = document.createElement('div');
  qGroup.classList.add('activity-form-group');
  qGroup.innerHTML = `
    <label class="activity-editor-label">Question Text</label>
    <input type="text" class="activity-input-text hunt-question" value="${data.question || ''}" placeholder="E.g., 'எழுது' என்ற சொல்லிலுள்ள குறில் எழுத்துக்களைக் கண்டறிக">
  `;
  parent.appendChild(qGroup);

  const qInput = qGroup.querySelector('.hunt-question') as HTMLInputElement;
  qInput.addEventListener('input', (e: any) => { 
    data.question = e.target.value; 
  });

  // 2. Target Word Input
  const wordGroup = document.createElement('div');
  wordGroup.classList.add('activity-form-group');
  wordGroup.innerHTML = `
    <label class="activity-editor-label">Target Word (சொல்)</label>
    <input type="text" class="activity-input-text hunt-target-word" value="${data.targetWord || ''}" placeholder="E.g., எழுது or கல்வி">
  `;
  parent.appendChild(wordGroup);

  const wordInput = wordGroup.querySelector('.hunt-target-word') as HTMLInputElement;

  // 3. Grid cell configuration area
  const cellsGroup = document.createElement('div');
  cellsGroup.classList.add('activity-form-group');
  
  const cellsLabel = document.createElement('label');
  cellsLabel.classList.add('activity-editor-label');
  cellsLabel.textContent = 'Word Letters (Boxes)';
  cellsGroup.appendChild(cellsLabel);

  const gridContainer = document.createElement('div');
  gridContainer.style.display = 'grid';
  gridContainer.style.gap = '0.5rem';
  gridContainer.style.marginTop = '0.5rem';
  cellsGroup.appendChild(gridContainer);
  parent.appendChild(cellsGroup);

  const renderGridCells = () => {
    gridContainer.innerHTML = '';
    gridContainer.style.gridTemplateColumns = `repeat(${data.gridSize}, 1fr)`;

    data.boxes.forEach((box: any, idx: number) => {
      const cellWrapper = document.createElement('div');
      cellWrapper.style.border = '1px solid #cbd5e1';
      cellWrapper.style.borderRadius = '0.5rem';
      cellWrapper.style.padding = '0.5rem';
      cellWrapper.style.background = '#f8fafc';
      cellWrapper.style.display = 'flex';
      cellWrapper.style.flexDirection = 'column';
      cellWrapper.style.alignItems = 'center';
      cellWrapper.style.gap = '0.25rem';

      const label = document.createElement('span');
      label.style.fontSize = '0.75rem';
      label.style.fontWeight = 'bold';
      label.style.color = '#64748b';
      label.textContent = `Box ${idx + 1}`;

      const textInput = document.createElement('input');
      textInput.type = 'text';
      textInput.classList.add('activity-input-text');
      textInput.style.width = '100%';
      textInput.style.textAlign = 'center';
      textInput.value = box.text || '';
      textInput.placeholder = 'Letter';
      textInput.addEventListener('input', (e: any) => {
        box.text = e.target.value;
      });

      const checkboxLabel = document.createElement('label');
      checkboxLabel.style.display = 'flex';
      checkboxLabel.style.alignItems = 'center';
      checkboxLabel.style.gap = '0.25rem';
      checkboxLabel.style.fontSize = '0.7rem';
      checkboxLabel.style.cursor = 'pointer';
      checkboxLabel.style.color = '#334155';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = !!box.isCorrect;
      checkbox.addEventListener('change', (e: any) => {
        box.isCorrect = e.target.checked;
      });

      checkboxLabel.appendChild(checkbox);
      checkboxLabel.appendChild(document.createTextNode('Correct'));

      cellWrapper.appendChild(label);
      cellWrapper.appendChild(textInput);
      cellWrapper.appendChild(checkboxLabel);
      gridContainer.appendChild(cellWrapper);
    });
  };

  const updateBoxesFromWord = () => {
    const word = data.targetWord || '';
    const letters = splitTamilLetters(word.trim());

    if (letters.length === 0) {
      data.gridSize = 2;
      data.boxes = [
        { text: '', isCorrect: false },
        { text: '', isCorrect: false }
      ];
    } else {
      data.gridSize = letters.length;

      // Determine target category from question
      const question = data.question || '';
      let targetCategory = 'குறில்';
      if (question.includes('நெடில்')) {
        targetCategory = 'நெடில்';
      } else if (question.includes('மெய்')) {
        targetCategory = 'மெய்';
      } else if (question.includes('ஒற்று')) {
        targetCategory = 'ஒற்று';
      }

      data.boxes = letters.map((text: string) => {
        let isCorrect = false;
        if (targetCategory === 'குறில்') {
          isCorrect = KURIL_LETTERS.includes(text);
        } else if (targetCategory === 'நெடில்') {
          isCorrect = NEDIL_LETTERS.includes(text);
        } else if (targetCategory === 'மெய்') {
          isCorrect = MEI_LETTERS.includes(text);
        } else if (targetCategory === 'ஒற்று') {
          isCorrect = OTTRU_LETTERS.includes(text);
        }
        return { text, isCorrect };
      });
    }

    renderGridCells();
  };

  wordInput.addEventListener('input', (e: any) => {
    data.targetWord = e.target.value;
    updateBoxesFromWord();
  });

  renderGridCells();

  // 4. Explanation
  renderExplanationInput(parent, data);
}
