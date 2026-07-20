export function renderYappuSeerForm(
  parent: HTMLDivElement,
  data: any,
  renderExplanationInput: (parent: HTMLDivElement, data: any) => void
): void {
  // Initialize defaults
  if (!data.question) {
    data.question = "சரியான சீரைக் கண்டறிக (Identify the correct Seer):";
  }
  if (data.level === undefined) {
    data.level = 2; // 2: ஈரசைச் சீர், 3: மூவசைச் சீர், 0: அனைத்தும்
  }

  // 1. Question text field
  const qGroup = document.createElement('div');
  qGroup.classList.add('activity-form-group');
  qGroup.innerHTML = `
    <label class="activity-editor-label">Question Text</label>
    <input type="text" class="activity-input-text seer-question" value="${data.question}" placeholder="E.g., சரியான சீரைக் கண்டறிக:">
  `;
  parent.appendChild(qGroup);

  const qInput = qGroup.querySelector('.seer-question') as HTMLInputElement;
  qInput.addEventListener('input', (e: any) => { 
    data.question = e.target.value; 
  });

  // 2. Level select dropdown
  const lvlGroup = document.createElement('div');
  lvlGroup.classList.add('activity-form-group');
  lvlGroup.innerHTML = `
    <label class="activity-editor-label">Default Play Level (விளையாட்டு நிலை)</label>
    <select class="activity-editor-select seer-level">
      <option value="2" ${Number(data.level) === 2 ? 'selected' : ''}>ஈரசைச் சீர் (தேமா, புளிமா, கூவிளம், கருவிளம்)</option>
      <option value="3" ${Number(data.level) === 3 ? 'selected' : ''}>மூவசைச் சீர் (காய் & கனி வகைகள்)</option>
      <option value="0" ${Number(data.level) === 0 ? 'selected' : ''}>அனைத்துச் சீர்கள் (All 12 Seers)</option>
    </select>
  `;
  parent.appendChild(lvlGroup);

  const lvlSelect = lvlGroup.querySelector('.seer-level') as HTMLSelectElement;
  lvlSelect.addEventListener('change', (e: any) => {
    data.level = Number(e.target.value);
  });

  // 3. Explanation Input
  renderExplanationInput(parent, data);
}
