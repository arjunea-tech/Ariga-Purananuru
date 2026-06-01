export function renderRolePlayForm(
  parent: HTMLDivElement,
  data: any,
  renderExplanationInput: (parent: HTMLDivElement, data: any) => void
): void {
  const qGroup = document.createElement('div');
  qGroup.classList.add('activity-form-group');
  qGroup.innerHTML = `
    <label class="activity-editor-label">Question Instructions</label>
    <input type="text" class="activity-input-text rp-question" value="${data.question || 'Complete the following role play conversation:'}" placeholder="Instructions for student">
  `;
  parent.appendChild(qGroup);

  const qInput = qGroup.querySelector('.rp-question') as HTMLInputElement;
  qInput.addEventListener('input', (e: any) => { data.question = e.target.value; });

  const dialogueGroup = document.createElement('div');
  dialogueGroup.classList.add('activity-form-group');

  const label = document.createElement('label');
  label.classList.add('activity-editor-label');
  label.textContent = 'Dialogue Lines';
  dialogueGroup.appendChild(label);

  const rowsContainer = document.createElement('div');
  rowsContainer.classList.add('rp-rows-container');

  const renderRPRows = () => {
    rowsContainer.innerHTML = '';
    data.dialogue.forEach((line: any, idx: number) => {
      const row = document.createElement('div');
      row.style.background = '#f8fafc';
      row.style.border = '1px solid #e2e8f0';
      row.style.borderRadius = '0.5rem';
      row.style.padding = '0.75rem';
      row.style.marginBottom = '0.5rem';

      row.innerHTML = `
        <div style="display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.5rem;">
          <select class="activity-editor-select rp-role" style="width: 110px; margin-bottom: 0; padding: 0.4rem;">
            <option value="system" ${line.role === 'system' ? 'selected' : ''}>Interviewer</option>
            <option value="student" ${line.role === 'student' ? 'selected' : ''}>Student</option>
          </select>
          <input type="text" class="activity-input-text rp-name" placeholder="Name" value="${line.name || ''}" style="width: 100px; margin-bottom: 0;">
          <input type="text" class="activity-input-text rp-text" placeholder="Line content / Target text to say" value="${line.text || ''}" style="flex: 1; margin-bottom: 0;">
          <button type="button" class="activity-btn activity-btn-danger rp-del" style="padding: 0.4rem 0.6rem; margin-bottom: 0;">&times;</button>
        </div>
      `;

      const roleSelect = row.querySelector('.rp-role') as HTMLSelectElement;
      const nameInput = row.querySelector('.rp-name') as HTMLInputElement;
      const textInput = row.querySelector('.rp-text') as HTMLInputElement;
      const delBtn = row.querySelector('.rp-del') as HTMLButtonElement;

      roleSelect.addEventListener('change', (e: any) => { line.role = e.target.value; });
      nameInput.addEventListener('input', (e: any) => { line.name = e.target.value; });
      textInput.addEventListener('input', (e: any) => { line.text = e.target.value; });
      delBtn.addEventListener('click', () => {
        if (data.dialogue.length > 1) {
          data.dialogue.splice(idx, 1);
          renderRPRows();
        }
      });

      rowsContainer.appendChild(row);
    });
  };

  renderRPRows();
  dialogueGroup.appendChild(rowsContainer);

  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.classList.add('activity-btn', 'activity-btn-primary', 'mt-1');
  addBtn.innerHTML = `+ Add Line`;
  addBtn.addEventListener('click', () => {
    const lastLine = data.dialogue[data.dialogue.length - 1];
    const nextRole = lastLine?.role === 'system' ? 'student' : 'system';
    const nextName = nextRole === 'system' ? 'Interviewer' : 'Student';
    data.dialogue.push({ role: nextRole, name: nextName, text: '' });
    renderRPRows();
  });
  dialogueGroup.appendChild(addBtn);

  parent.appendChild(dialogueGroup);
  renderExplanationInput(parent, data);
}
