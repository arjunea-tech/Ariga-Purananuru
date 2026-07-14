export function renderWordHuntForm(
  parent: HTMLDivElement,
  data: any,
  renderExplanationInput: (parent: HTMLDivElement, data: any) => void
): void {
  // Initialize default properties
  if (!data.gridSize) {
    data.gridSize = 2; // Default to 2x2 = 4 boxes
  }
  const totalBoxes = () => data.gridSize * data.gridSize;

  if (!data.boxes || data.boxes.length !== totalBoxes()) {
    const existing = data.boxes || [];
    data.boxes = [];
    for (let i = 0; i < totalBoxes(); i++) {
      data.boxes.push({
        text: existing[i]?.text || '',
        isCorrect: !!existing[i]?.isCorrect
      });
    }
  }

  // 1. Question input
  const qGroup = document.createElement('div');
  qGroup.classList.add('activity-form-group');
  qGroup.innerHTML = `
    <label class="activity-editor-label">Question Text</label>
    <input type="text" class="activity-input-text hunt-question" value="${data.question || ''}" placeholder="E.g., 'எழுது' என்ற சொல்லிலுள்ள குறில் எழுத்துக்களைக் கண்டறிக (Find the Kuril letters in 'Eludhu')">
  `;
  parent.appendChild(qGroup);

  const qInput = qGroup.querySelector('.hunt-question') as HTMLInputElement;
  qInput.addEventListener('input', (e: any) => { data.question = e.target.value; });

  // 2. Grid Size selector
  const sizeGroup = document.createElement('div');
  sizeGroup.classList.add('activity-form-group');
  sizeGroup.innerHTML = `
    <label class="activity-editor-label">Grid Layout Size</label>
    <select class="activity-editor-select hunt-grid-size">
      <option value="2" ${data.gridSize === 2 ? 'selected' : ''}>2 x 2 (4 Boxes)</option>
      <option value="3" ${data.gridSize === 3 ? 'selected' : ''}>3 x 3 (9 Boxes)</option>
      <option value="4" ${data.gridSize === 4 ? 'selected' : ''}>4 x 4 (16 Boxes)</option>
      <option value="5" ${data.gridSize === 5 ? 'selected' : ''}>5 x 5 (25 Boxes)</option>
    </select>
  `;
  parent.appendChild(sizeGroup);

  // 3. Grid cell configuration area
  const cellsGroup = document.createElement('div');
  cellsGroup.classList.add('activity-form-group');
  
  const cellsLabel = document.createElement('label');
  cellsLabel.classList.add('activity-editor-label');
  cellsLabel.textContent = 'Configure Grid Cells (Enter letters & check correct answers to hunt)';
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

    const count = totalBoxes();
    if (data.boxes.length !== count) {
      const existing = data.boxes;
      data.boxes = [];
      for (let i = 0; i < count; i++) {
        data.boxes.push({
          text: existing[i]?.text || '',
          isCorrect: !!existing[i]?.isCorrect
        });
      }
    }

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
      label.textContent = `Cell ${idx + 1}`;

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

  renderGridCells();

  const sizeSelect = sizeGroup.querySelector('.hunt-grid-size') as HTMLSelectElement;
  sizeSelect.addEventListener('change', (e: any) => {
    data.gridSize = parseInt(e.target.value);
    renderGridCells();
  });

  // 4. Explanation
  renderExplanationInput(parent, data);
}
