export function renderSpeakingForm(
  parent: HTMLDivElement,
  data: any,
  renderExplanationInput: (parent: HTMLDivElement, data: any) => void
): void {
  const qGroup = document.createElement('div');
  qGroup.classList.add('activity-form-group');
  qGroup.innerHTML = `
    <label class="activity-editor-label">Question Instructions</label>
    <input type="text" class="activity-input-text speaking-question" value="${data.question || 'Listen and repeat the sentence:'}" placeholder="Instructions for student">
  `;
  parent.appendChild(qGroup);

  const qInput = qGroup.querySelector('.speaking-question') as HTMLInputElement;
  qInput.addEventListener('input', (e: any) => { data.question = e.target.value; });

  const txtGroup = document.createElement('div');
  txtGroup.classList.add('activity-form-group');
  txtGroup.innerHTML = `
    <label class="activity-editor-label">Sentence / Target Text to Speak</label>
    <input type="text" class="activity-input-text speaking-target" value="${data.targetText || ''}" placeholder="E.g. She sells seashells by the seashore.">
  `;
  parent.appendChild(txtGroup);

  const targetInput = txtGroup.querySelector('.speaking-target') as HTMLInputElement;
  targetInput.addEventListener('input', (e: any) => {
    data.targetText = e.target.value;
    data.text = e.target.value;
  });

  const imgGroup = document.createElement('div');
  imgGroup.classList.add('activity-form-group');
  imgGroup.innerHTML = `
    <label class="activity-editor-label">Image URL / Picture Description (Optional)</label>
    <input type="text" class="activity-input-text speaking-image" value="${data.imageUrl || ''}" placeholder="E.g. https://example.com/images/landscape.jpg">
  `;
  parent.appendChild(imgGroup);

  const imgInput = imgGroup.querySelector('.speaking-image') as HTMLInputElement;
  imgInput.addEventListener('input', (e: any) => { data.imageUrl = e.target.value; });

  renderExplanationInput(parent, data);
}
