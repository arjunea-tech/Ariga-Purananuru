export function renderMindMapForm(
  parent: HTMLDivElement,
  data: any,
  renderExplanationInput: (parent: HTMLDivElement, data: any) => void
): void {
  const qGroup = document.createElement('div');
  qGroup.classList.add('activity-form-group');
  qGroup.innerHTML = `
    <label class="activity-editor-label">Question Instructions</label>
    <input type="text" class="activity-input-text mm-question" value="${data.question || 'Complete the mind map by filling in the details:'}" placeholder="Instructions for student">
  `;
  parent.appendChild(qGroup);

  const qInput = qGroup.querySelector('.mm-question') as HTMLInputElement;
  qInput.addEventListener('input', (e: any) => { data.question = e.target.value; });

  const nodesGroup = document.createElement('div');
  nodesGroup.classList.add('activity-form-group');

  const label = document.createElement('label');
  label.classList.add('activity-editor-label');
  label.textContent = 'Mind Map Structure Nodes';
  nodesGroup.appendChild(label);

  const rowsContainer = document.createElement('div');
  rowsContainer.classList.add('mm-rows-container');

  const renderMMRows = () => {
    rowsContainer.innerHTML = '';
    data.nodes.forEach((n: any, idx: number) => {
      const row = document.createElement('div');
      row.style.background = '#f8fafc';
      row.style.border = '1px solid #e2e8f0';
      row.style.borderRadius = '0.5rem';
      row.style.padding = '0.75rem';
      row.style.marginBottom = '0.5rem';

      row.innerHTML = `
        <div style="display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.5rem;">
          <input type="text" class="activity-input-text mm-node-id" placeholder="Node ID" value="${n.id || ''}" style="width: 80px; margin-bottom: 0;" disabled>
          <input type="text" class="activity-input-text mm-node-parent" placeholder="Parent ID" value="${n.parentId || ''}" style="width: 80px; margin-bottom: 0;">
          <input type="text" class="activity-input-text mm-node-label" placeholder="Pre-filled Label" value="${n.label || ''}" style="flex: 1; margin-bottom: 0;">
          <label style="display: flex; align-items: center; gap: 0.25rem; font-size: 0.8rem; font-weight: bold; margin-bottom: 0; white-space: nowrap;">
            <input type="checkbox" class="mm-node-placeholder" ${n.isPlaceholder ? 'checked' : ''}>
            Blank Node
          </label>
          <button type="button" class="activity-btn activity-btn-danger mm-del" style="padding: 0.45rem 0.6rem; margin-bottom: 0;">&times;</button>
        </div>
        <div class="mm-correct-val-container" style="display: ${n.isPlaceholder ? 'block' : 'none'};">
          <input type="text" class="activity-input-text mm-node-correct" placeholder="Expected Correct Answer" value="${n.correctValue || ''}" style="margin-bottom: 0;">
        </div>
      `;

      const parentInput = row.querySelector('.mm-node-parent') as HTMLInputElement;
      const labelInput = row.querySelector('.mm-node-label') as HTMLInputElement;
      const placeCheckbox = row.querySelector('.mm-node-placeholder') as HTMLInputElement;
      const correctInput = row.querySelector('.mm-node-correct') as HTMLInputElement;
      const correctContainer = row.querySelector('.mm-correct-val-container') as HTMLDivElement;
      const delBtn = row.querySelector('.mm-del') as HTMLButtonElement;

      parentInput.addEventListener('input', (e: any) => { n.parentId = e.target.value; });
      labelInput.addEventListener('input', (e: any) => { n.label = e.target.value; });
      placeCheckbox.addEventListener('change', (e: any) => {
        n.isPlaceholder = e.target.checked;
        correctContainer.style.display = n.isPlaceholder ? 'block' : 'none';
      });
      correctInput.addEventListener('input', (e: any) => { n.correctValue = e.target.value; });
      delBtn.addEventListener('click', () => {
        if (data.nodes.length > 1) {
          data.nodes.splice(idx, 1);
          renderMMRows();
        }
      });

      rowsContainer.appendChild(row);
    });
  };

  renderMMRows();
  nodesGroup.appendChild(rowsContainer);

  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.classList.add('activity-btn', 'activity-btn-primary', 'mt-1');
  addBtn.innerHTML = `+ Add Node`;
  addBtn.addEventListener('click', () => {
    const newId = `node_${Date.now().toString().slice(-4)}`;
    data.nodes.push({ id: newId, parentId: 'root', label: '', isPlaceholder: true, correctValue: '' });
    renderMMRows();
  });
  nodesGroup.appendChild(addBtn);

  parent.appendChild(nodesGroup);
  renderExplanationInput(parent, data);
}
