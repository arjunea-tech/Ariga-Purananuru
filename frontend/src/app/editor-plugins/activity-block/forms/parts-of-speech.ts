export function renderPartsOfSpeechForm(
  parent: HTMLDivElement,
  data: any,
  renderExplanationInput: (parent: HTMLDivElement, data: any) => void
): void {
  const qGroup = document.createElement('div');
  qGroup.classList.add('activity-form-group');
  qGroup.innerHTML = `
    <label class="activity-editor-label">Question Instructions</label>
    <input type="text" class="activity-input-text pos-question" value="${data.question || 'Identify the parts of speech for the highlighted words:'}" placeholder="Instructions for student">
  `;
  parent.appendChild(qGroup);

  const qInput = qGroup.querySelector('.pos-question') as HTMLInputElement;
  qInput.addEventListener('input', (e: any) => { data.question = e.target.value; });

  const sentenceGroup = document.createElement('div');
  sentenceGroup.classList.add('activity-form-group');
  sentenceGroup.innerHTML = `
    <label class="activity-editor-label">Full Sentence</label>
    <input type="text" class="activity-input-text pos-text" value="${data.text || ''}" placeholder="E.g. The dog ran very fast.">
  `;
  parent.appendChild(sentenceGroup);

  const txtInput = sentenceGroup.querySelector('.pos-text') as HTMLInputElement;
  txtInput.addEventListener('input', (e: any) => { data.text = e.target.value; });

  const partsGroup = document.createElement('div');
  partsGroup.classList.add('activity-form-group');

  const label = document.createElement('label');
  label.classList.add('activity-editor-label');
  label.textContent = 'Word Tags Mapping';
  partsGroup.appendChild(label);

  const rowsContainer = document.createElement('div');
  rowsContainer.classList.add('pos-rows-container');

  const renderPOSRows = () => {
    rowsContainer.innerHTML = '';
    data.parts.forEach((p: any, idx: number) => {
      const row = document.createElement('div');
      row.classList.add('activity-row');
      row.innerHTML = `
        <input type="text" class="activity-input-text pos-word" placeholder="Word (e.g. dog)" value="${p.word || ''}" style="flex: 1; margin-bottom: 0;">
        <select class="activity-editor-select pos-tag" style="flex: 1; margin-bottom: 0; padding: 0.5rem;">
          <option value="Noun" ${p.tag === 'Noun' ? 'selected' : ''}>Noun</option>
          <option value="Pronoun" ${p.tag === 'Pronoun' ? 'selected' : ''}>Pronoun</option>
          <option value="Verb" ${p.tag === 'Verb' ? 'selected' : ''}>Verb</option>
          <option value="Be verb" ${p.tag === 'Be verb' ? 'selected' : ''}>Be verb</option>
          <option value="Main verb" ${p.tag === 'Main verb' ? 'selected' : ''}>Main verb</option>
          <option value="Adjective" ${p.tag === 'Adjective' ? 'selected' : ''}>Adjective</option>
          <option value="Adverb" ${p.tag === 'Adverb' ? 'selected' : ''}>Adverb</option>
          <option value="Preposition" ${p.tag === 'Preposition' ? 'selected' : ''}>Preposition</option>
          <option value="Conjunction" ${p.tag === 'Conjunction' ? 'selected' : ''}>Conjunction</option>
          <option value="Article" ${p.tag === 'Article' ? 'selected' : ''}>Article</option>
        </select>
        <button type="button" class="activity-btn activity-btn-danger pos-del" style="margin-bottom: 0;">&times;</button>
      `;

      const wordInput = row.querySelector('.pos-word') as HTMLInputElement;
      const tagSelect = row.querySelector('.pos-tag') as HTMLSelectElement;
      const delBtn = row.querySelector('.pos-del') as HTMLButtonElement;

      wordInput.addEventListener('input', (e: any) => { p.word = e.target.value; });
      tagSelect.addEventListener('change', (e: any) => { p.tag = e.target.value; });
      delBtn.addEventListener('click', () => {
        if (data.parts.length > 1) {
          data.parts.splice(idx, 1);
          renderPOSRows();
        }
      });

      rowsContainer.appendChild(row);
    });
  };

  renderPOSRows();
  partsGroup.appendChild(rowsContainer);

  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.classList.add('activity-btn', 'activity-btn-primary', 'mt-1');
  addBtn.innerHTML = `+ Add Tag`;
  addBtn.addEventListener('click', () => {
    data.parts.push({ word: '', tag: 'Noun' });
    renderPOSRows();
  });
  partsGroup.appendChild(addBtn);

  parent.appendChild(partsGroup);
  renderExplanationInput(parent, data);
}
