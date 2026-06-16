import { CrosswordGenerator } from '../../../services/crossword-generator.service';

export function renderCrosswordForm(
  parent: HTMLDivElement,
  data: any,
  renderExplanationInput: (parent: HTMLDivElement, data: any) => void
): void {
  // 1. Instructions and Info
  const infoGroup = document.createElement('div');
  infoGroup.style.marginBottom = '1.5rem';
  infoGroup.innerHTML = `
    <div style="background: rgba(59, 130, 246, 0.1); border-left: 4px solid #3b82f6; padding: 1rem; border-radius: 0.5rem; color: #1e3a8a;">
      <strong>Auto-Generated Crossword:</strong> Add your words and clues below. We will automatically calculate the best intersections and grid size.
    </div>
  `;
  parent.appendChild(infoGroup);

  // 2. Words list
  const wordsGroup = document.createElement('div');
  wordsGroup.classList.add('activity-form-group');

  const wordsLabel = document.createElement('label');
  wordsLabel.classList.add('activity-editor-label');
  wordsLabel.textContent = 'Crossword Words & Clues';
  wordsGroup.appendChild(wordsLabel);

  const rowsContainer = document.createElement('div');
  rowsContainer.classList.add('crossword-rows-container');

  const renderWordRows = () => {
    rowsContainer.innerHTML = '';
    data.words.forEach((w: any, idx: number) => {
      const row = document.createElement('div');
      row.style.background = '#f8fafc';
      row.style.border = '1px solid #e2e8f0';
      row.style.borderRadius = '0.5rem';
      row.style.padding = '1rem';
      row.style.marginBottom = '1rem';

      row.innerHTML = `
        <div style="display: flex; gap: 0.75rem; margin-bottom: 0.5rem;">
          <input type="text" class="activity-input-text cw-word" placeholder="Word (e.g. HELLO)" value="${w.word || ''}" style="flex: 1; text-transform: uppercase;">
          <button type="button" class="activity-btn activity-btn-danger cw-del" style="flex-shrink: 0;">&times; Remove</button>
        </div>
        <input type="text" class="activity-input-text cw-clue" placeholder="Clue (e.g. A common greeting)" value="${w.clue || ''}" style="width: 100%;">
      `;

      // Bind events
      const wordInput = row.querySelector('.cw-word') as HTMLInputElement;
      const clueInput = row.querySelector('.cw-clue') as HTMLInputElement;
      const delBtn = row.querySelector('.cw-del') as HTMLButtonElement;

      wordInput.addEventListener('input', (e: any) => { w.word = e.target.value.toUpperCase(); });
      clueInput.addEventListener('input', (e: any) => { w.clue = e.target.value; });

      delBtn.addEventListener('click', () => {
        if (data.words.length > 1) {
          data.words.splice(idx, 1);
          renderWordRows();
        }
      });

      rowsContainer.appendChild(row);
    });
  };

  renderWordRows();
  wordsGroup.appendChild(rowsContainer);

  // Add row button
  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.classList.add('activity-btn', 'activity-btn-primary', 'mt-2');
  addBtn.innerHTML = `+ Add Word`;
  addBtn.addEventListener('click', () => {
    data.words.push({ word: '', clue: '' }); // Simplified payload for auto-gen
    renderWordRows();
  });
  wordsGroup.appendChild(addBtn);
  parent.appendChild(wordsGroup);

  // 3. Auto Generate Action Button
  const genGroup = document.createElement('div');
  genGroup.style.marginTop = '2rem';
  genGroup.style.paddingTop = '1rem';
  genGroup.style.borderTop = '1px solid #e2e8f0';

  const genBtn = document.createElement('button');
  genBtn.type = 'button';
  genBtn.classList.add('activity-btn');
  genBtn.style.background = '#10b981';
  genBtn.style.color = 'white';
  genBtn.innerHTML = `Generate`;

  const statusText = document.createElement('div');
  statusText.style.marginTop = '0.75rem';
  statusText.style.fontSize = '0.85rem';
  statusText.style.color = '#64748b';

  genBtn.addEventListener('click', () => {
    try {
      const result = CrosswordGenerator.generate(data.words);
      data.gridSize = result.gridSize;

      // We overwrite data.words with the fully calculated placed words array
      // It now contains row, col, and direction natively.
      // But we must preserve unplaced words in the UI so the admin can fix them.
      data.words = [...result.words, ...result.unplaced];

      let msg = 'Success! Generated ' + result.gridSize + 'x' + result.gridSize + ' grid fitting ' + result.words.length + ' words.';
      if (result.unplaced.length > 0) {
        msg += ' <strong style="color:#ef4444;">Could not fit ' + result.unplaced.length + ' words (No intersections).</strong>';
      }
      statusText.innerHTML = msg;

      // We re-render the rows so the UI persists their existence (or we could visualize the preview here)
      renderWordRows();
    } catch (err) {
      statusText.innerHTML = '<span style="color:#ef4444;">Generation error occurred. Please ensure words have valid characters.</span>';
    }
  });

  genGroup.appendChild(genBtn);
  genGroup.appendChild(statusText);
  parent.appendChild(genGroup);

  renderExplanationInput(parent, data);
}
