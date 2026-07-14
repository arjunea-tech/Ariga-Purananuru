export function renderLetterBasketForm(
  parent: HTMLDivElement,
  data: any,
  renderExplanationInput: (parent: HTMLDivElement, data: any) => void
): void {
  // Initialize default items if not present
  if (!data.items) {
    data.items = [
      { text: 'அ', category: 'குறில்' },
      { text: 'ஆ', category: 'நெடில்' },
      { text: 'க்', category: 'மெய்' },
      { text: 'த்', category: 'ஒற்று' }
    ];
  }

  // 1. Question input
  const qGroup = document.createElement('div');
  qGroup.classList.add('activity-form-group');
  qGroup.innerHTML = `
    <label class="activity-editor-label">Question Text</label>
    <input type="text" class="activity-input-text basket-question" value="${data.question || ''}" placeholder="E.g., எழுத்துக்களை சரியான கூடைகளில் இடுக (Put the letters in correct baskets)">
  `;
  parent.appendChild(qGroup);

  const qInput = qGroup.querySelector('.basket-question') as HTMLInputElement;
  qInput.addEventListener('input', (e: any) => { data.question = e.target.value; });

  // 2. Letters config list
  const lettersGroup = document.createElement('div');
  lettersGroup.classList.add('activity-form-group');

  const lettersLabel = document.createElement('label');
  lettersLabel.classList.add('activity-editor-label');
  lettersLabel.textContent = 'Configure Cloud Letters & Target Baskets';
  lettersGroup.appendChild(lettersLabel);

  const rowsContainer = document.createElement('div');
  rowsContainer.classList.add('basket-rows-container');
  lettersGroup.appendChild(rowsContainer);

  const renderLetterRows = () => {
    rowsContainer.innerHTML = '';
    data.items.forEach((item: any, idx: number) => {
      const row = document.createElement('div');
      row.classList.add('activity-row');
      row.style.marginBottom = '0.5rem';
      row.style.display = 'flex';
      row.style.gap = '0.5rem';
      row.style.alignItems = 'center';

      const input = document.createElement('input');
      input.type = 'text';
      input.classList.add('activity-input-text');
      input.style.width = '100px';
      input.value = item.text || '';
      input.placeholder = `Letter`;
      input.addEventListener('input', (e: any) => {
        item.text = e.target.value;
      });

      const select = document.createElement('select');
      select.classList.add('activity-editor-select');
      select.style.flexGrow = '1';
      select.innerHTML = `
        <option value="குறில்" ${item.category === 'குறில்' ? 'selected' : ''}>குறில் (Kuril - Short Vowel/CV)</option>
        <option value="நெடில்" ${item.category === 'நெடில்' ? 'selected' : ''}>நெடில் (Nedil - Long Vowel/CV)</option>
        <option value="மெய்" ${item.category === 'மெய்' ? 'selected' : ''}>மெய் (Mei - Consonant)</option>
        <option value="ஒற்று" ${item.category === 'ஒற்று' ? 'selected' : ''}>ஒற்று (Ottru - Consonant Dot / Pulli)</option>
      `;
      select.addEventListener('change', (e: any) => {
        item.category = e.target.value;
      });

      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.classList.add('activity-btn', 'activity-btn-danger');
      deleteBtn.innerHTML = `&times;`;
      deleteBtn.title = 'Remove Letter';
      deleteBtn.addEventListener('click', () => {
        if (data.items.length > 1) {
          data.items.splice(idx, 1);
          renderLetterRows();
        }
      });

      row.appendChild(input);
      row.appendChild(select);
      row.appendChild(deleteBtn);
      rowsContainer.appendChild(row);
    });
  };

  renderLetterRows();

  // Add Letter button
  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.classList.add('activity-btn', 'activity-btn-primary', 'mt-2');
  addBtn.innerHTML = `+ Add Letter`;
  addBtn.addEventListener('click', () => {
    data.items.push({ text: '', category: 'குறில்' });
    renderLetterRows();
  });
  lettersGroup.appendChild(addBtn);

  parent.appendChild(lettersGroup);

  // 3. Explanation
  renderExplanationInput(parent, data);
}
