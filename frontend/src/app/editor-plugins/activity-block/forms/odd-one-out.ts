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
}
