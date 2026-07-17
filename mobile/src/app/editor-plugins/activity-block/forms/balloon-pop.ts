export function renderBalloonPopForm(
  parent: HTMLDivElement,
  data: any,
  renderExplanationInput: (parent: HTMLDivElement, data: any) => void
): void {
  // Initialize defaults
  if (data.level === undefined) data.level = 1;
  if (data.target === undefined) data.target = 'ner';
  if (data.timer === undefined) data.timer = 30;
  if (!Array.isArray(data.nerWords)) data.nerWords = [];
  if (!Array.isArray(data.niraiWords)) data.niraiWords = [];

  // 1. Question input
  const qGroup = document.createElement('div');
  qGroup.classList.add('activity-form-group');
  qGroup.innerHTML = `
    <label class="activity-editor-label">Question Text</label>
    <input type="text" class="activity-input-text bp-question" value="${data.question || ''}" placeholder="E.g., நேர் அசைகளை மட்டும் தட்டுக!">
  `;
  parent.appendChild(qGroup);

  const qInput = qGroup.querySelector('.bp-question') as HTMLInputElement;
  qInput.addEventListener('input', (e: any) => {
    data.question = e.target.value;
  });

  // 2. Target Asai (Ner vs Nirai)
  const targetGroup = document.createElement('div');
  targetGroup.classList.add('activity-form-group');
  targetGroup.innerHTML = `
    <label class="activity-editor-label">Target Asai (இலக்கு அசை)</label>
    <select class="activity-editor-select bp-target" style="width: 100%; border: 2.5px solid #cbd5e1; border-radius: 0.75rem; padding: 0.75rem; background: white;">
      <option value="ner" ${data.target === 'ner' ? 'selected' : ''}>நேர் அசை (Ner)</option>
      <option value="nirai" ${data.target === 'nirai' ? 'selected' : ''}>நிரை அசை (Nirai)</option>
    </select>
  `;
  parent.appendChild(targetGroup);

  const targetSelect = targetGroup.querySelector('.bp-target') as HTMLSelectElement;
  targetSelect.addEventListener('change', (e: any) => {
    data.target = e.target.value;
  });

  // 3. Difficulty Level (1, 2, 3)
  const levelGroup = document.createElement('div');
  levelGroup.classList.add('activity-form-group');
  levelGroup.innerHTML = `
    <label class="activity-editor-label">Difficulty Level (நிலை)</label>
    <select class="activity-editor-select bp-level" style="width: 100%; border: 2.5px solid #cbd5e1; border-radius: 0.75rem; padding: 0.75rem; background: white;">
      <option value="1" ${data.level === 1 ? 'selected' : ''}>Level 1: Single அசை words (e.g. பூ, நாள்)</option>
      <option value="2" ${data.level === 2 ? 'selected' : ''}>Level 2: 2-அசை syllables (e.g. Thema, Pulima)</option>
      <option value="3" ${data.level === 3 ? 'selected' : ''}>Level 3: 3-அசை syllables (e.g. Kachcheer)</option>
    </select>
  `;
  parent.appendChild(levelGroup);

  const levelSelect = levelGroup.querySelector('.bp-level') as HTMLSelectElement;
  levelSelect.addEventListener('change', (e: any) => {
    data.level = parseInt(e.target.value);
  });

  // 4. Timer (seconds)
  const timerGroup = document.createElement('div');
  timerGroup.classList.add('activity-form-group');
  timerGroup.innerHTML = `
    <label class="activity-editor-label">Time Limit (வினாடிகள்)</label>
    <input type="number" class="activity-input-text bp-timer" value="${data.timer}" min="10" max="180">
  `;
  parent.appendChild(timerGroup);

  const timerInput = timerGroup.querySelector('.bp-timer') as HTMLInputElement;
  timerInput.addEventListener('input', (e: any) => {
    data.timer = parseInt(e.target.value) || 30;
  });

  // 5. Custom Ner Words (optional — overrides built-in pool)
  const nerGroup = document.createElement('div');
  nerGroup.classList.add('activity-form-group');
  nerGroup.innerHTML = `
    <label class="activity-editor-label">
      நேர் அசை சொற்கள் (Custom Ner Words)
      <span style="font-size:0.78rem; color:#64748b; font-weight:400;"> — comma separated. Leave empty to use built-in pool.</span>
    </label>
    <textarea class="activity-input-text bp-ner-words" rows="3"
      placeholder="e.g. பூ, நாள், கால், தேன், வான்"
      style="width:100%; resize:vertical; font-size:1rem;">${(data.nerWords || []).join(', ')}</textarea>
  `;
  parent.appendChild(nerGroup);

  const nerTextarea = nerGroup.querySelector('.bp-ner-words') as HTMLTextAreaElement;
  nerTextarea.addEventListener('input', (e: any) => {
    data.nerWords = e.target.value
      .split(',')
      .map((w: string) => w.trim())
      .filter((w: string) => w.length > 0);
  });

  // 6. Custom Nirai Words (optional — overrides built-in pool)
  const niraiGroup = document.createElement('div');
  niraiGroup.classList.add('activity-form-group');
  niraiGroup.innerHTML = `
    <label class="activity-editor-label">
      நிரை அசை சொற்கள் (Custom Nirai Words)
      <span style="font-size:0.78rem; color:#64748b; font-weight:400;"> — comma separated. Leave empty to use built-in pool.</span>
    </label>
    <textarea class="activity-input-text bp-nirai-words" rows="3"
      placeholder="e.g. மகிழ், பசு, மழை, குடை, நிலா"
      style="width:100%; resize:vertical; font-size:1rem;">${(data.niraiWords || []).join(', ')}</textarea>
  `;
  parent.appendChild(niraiGroup);

  const niraiTextarea = niraiGroup.querySelector('.bp-nirai-words') as HTMLTextAreaElement;
  niraiTextarea.addEventListener('input', (e: any) => {
    data.niraiWords = e.target.value
      .split(',')
      .map((w: string) => w.trim())
      .filter((w: string) => w.length > 0);
  });

  // 7. Explanation
  renderExplanationInput(parent, data);
}
