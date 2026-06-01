export function renderWritingForm(
  parent: HTMLDivElement,
  data: any,
  renderExplanationInput: (parent: HTMLDivElement, data: any) => void
): void {
  const qGroup = document.createElement('div');
  qGroup.classList.add('activity-form-group');
  qGroup.innerHTML = `
    <label class="activity-editor-label">Question Instructions</label>
    <input type="text" class="activity-input-text writing-question" value="${data.question || 'Write a short story about the following prompt:'}" placeholder="Instructions for student">
  `;
  parent.appendChild(qGroup);

  const qInput = qGroup.querySelector('.writing-question') as HTMLInputElement;
  qInput.addEventListener('input', (e: any) => { data.question = e.target.value; });

  const promptGroup = document.createElement('div');
  promptGroup.classList.add('activity-form-group');
  promptGroup.innerHTML = `
    <label class="activity-editor-label">Writing Prompt / Passage / Hints (Separate hints by newlines)</label>
    <textarea class="activity-textarea writing-text" rows="3" placeholder="Hints or details to display...">${data.text || ''}</textarea>
  `;
  parent.appendChild(promptGroup);

  const promptTextarea = promptGroup.querySelector('.writing-text') as HTMLTextAreaElement;
  promptTextarea.addEventListener('input', (e: any) => { data.text = e.target.value; });

  const starterGroup = document.createElement('div');
  starterGroup.classList.add('activity-form-group');
  starterGroup.innerHTML = `
    <label class="activity-editor-label">Starter Sentence (Optional)</label>
    <input type="text" class="activity-input-text writing-starter" value="${data.starterText || ''}" placeholder="E.g. Once upon a time...">
  `;
  parent.appendChild(starterGroup);

  const starterInput = starterGroup.querySelector('.writing-starter') as HTMLInputElement;
  starterInput.addEventListener('input', (e: any) => { data.starterText = e.target.value; });

  const limitGroup = document.createElement('div');
  limitGroup.classList.add('activity-form-group');
  limitGroup.style.display = 'flex';
  limitGroup.style.gap = '1rem';
  limitGroup.innerHTML = `
    <div style="flex: 1;">
      <label class="activity-editor-label">Min Word Limit</label>
      <input type="number" class="activity-input-text writing-min-words" value="${data.minWords || 1}">
    </div>
    <div style="flex: 1;">
      <label class="activity-editor-label">Max Word Limit</label>
      <input type="number" class="activity-input-text writing-max-words" value="${data.maxWords || 1000}">
    </div>
  `;
  parent.appendChild(limitGroup);

  const minInput = limitGroup.querySelector('.writing-min-words') as HTMLInputElement;
  const maxInput = limitGroup.querySelector('.writing-max-words') as HTMLInputElement;
  minInput.addEventListener('input', (e: any) => { data.minWords = parseInt(e.target.value) || 1; });
  maxInput.addEventListener('input', (e: any) => { data.maxWords = parseInt(e.target.value) || 1000; });

  const modelGroup = document.createElement('div');
  modelGroup.classList.add('activity-form-group');
  modelGroup.innerHTML = `
    <label class="activity-editor-label">Model Reference Answer / Example Response</label>
    <textarea class="activity-textarea writing-model" rows="3" placeholder="Display this response after the student submits...">${data.modelAnswer || ''}</textarea>
  `;
  parent.appendChild(modelGroup);

  const modelTextarea = modelGroup.querySelector('.writing-model') as HTMLTextAreaElement;
  modelTextarea.addEventListener('input', (e: any) => { data.modelAnswer = e.target.value; });

  renderExplanationInput(parent, data);
}
