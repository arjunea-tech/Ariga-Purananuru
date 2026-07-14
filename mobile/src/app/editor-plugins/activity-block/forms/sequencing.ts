export function renderSequencingForm(
  parent: HTMLDivElement,
  data: any,
  renderExplanationInput: (parent: HTMLDivElement, data: any) => void
): void {
  const qGroup = document.createElement('div');
  qGroup.classList.add('activity-form-group');
  qGroup.innerHTML = `
    <label class="activity-editor-label">Question Instructions</label>
    <input type="text" class="activity-input-text seq-question" value="${data.question || 'Arrange the events in correct chronological order:'}" placeholder="Instructions for student">
  `;
  parent.appendChild(qGroup);

  const qInput = qGroup.querySelector('.seq-question') as HTMLInputElement;
  qInput.addEventListener('input', (e: any) => { data.question = e.target.value; });

  const eventsGroup = document.createElement('div');
  eventsGroup.classList.add('activity-form-group');

  const label = document.createElement('label');
  label.classList.add('activity-editor-label');
  label.textContent = 'Events in Correct Chronological Order';
  eventsGroup.appendChild(label);

  const rowsContainer = document.createElement('div');
  rowsContainer.classList.add('seq-rows-container');

  const renderSeqRows = () => {
    rowsContainer.innerHTML = '';
    data.events.forEach((evt: string, idx: number) => {
      const row = document.createElement('div');
      row.classList.add('activity-row');
      row.innerHTML = `
        <span style="font-weight: bold; color: #475569; width: 25px;">${idx + 1}.</span>
        <input type="text" class="activity-input-text seq-text" value="${evt || ''}" placeholder="Event summary..." style="flex: 1; margin-bottom: 0;">
        <button type="button" class="activity-btn activity-btn-danger seq-del" style="margin-bottom: 0;">&times; Remove</button>
      `;

      const txtInput = row.querySelector('.seq-text') as HTMLInputElement;
      const delBtn = row.querySelector('.seq-del') as HTMLButtonElement;

      txtInput.addEventListener('input', (e: any) => { data.events[idx] = e.target.value; });
      delBtn.addEventListener('click', () => {
        if (data.events.length > 1) {
          data.events.splice(idx, 1);
          renderSeqRows();
        }
      });

      rowsContainer.appendChild(row);
    });
  };

  renderSeqRows();
  eventsGroup.appendChild(rowsContainer);

  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.classList.add('activity-btn', 'activity-btn-primary', 'mt-1');
  addBtn.innerHTML = `+ Add Event`;
  addBtn.addEventListener('click', () => {
    data.events.push('');
    renderSeqRows();
  });
  eventsGroup.appendChild(addBtn);

  parent.appendChild(eventsGroup);
  renderExplanationInput(parent, data);
}
