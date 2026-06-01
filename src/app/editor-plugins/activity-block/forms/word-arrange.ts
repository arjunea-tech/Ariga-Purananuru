export function renderWordArrangeForm(
  parent: HTMLDivElement,
  data: any,
  renderExplanationInput: (parent: HTMLDivElement, data: any) => void
): void {
  const qGroup = document.createElement('div');
  qGroup.classList.add('activity-form-group');
  qGroup.innerHTML = `
    <label class="activity-editor-label">Question Text</label>
    <input type="text" class="activity-input-text word-arrange-question" value="${data.question || 'Arrange the words to form a correct sentence:'}" placeholder="E.g., Arrange the words to form a correct sentence:">
  `;
  parent.appendChild(qGroup);

  const qInput = qGroup.querySelector('.word-arrange-question') as HTMLInputElement;
  qInput.addEventListener('input', (e: any) => { data.question = e.target.value; });

  const txtGroup = document.createElement('div');
  txtGroup.classList.add('activity-form-group');
  txtGroup.innerHTML = `
    <label class="activity-editor-label">Correct Sentence (Words separated by space or '/')</label>
    <input type="text" class="activity-input-text word-arrange-text" value="${data.text || ''}" placeholder="E.g., he is playing OR he/is/playing">
    <small class="activity-helper-text">
      Enter the words in correct order. You can separate them by spaces or slashes.
    </small>
  `;
  parent.appendChild(txtGroup);

  const txtInput = txtGroup.querySelector('.word-arrange-text') as HTMLInputElement;
  txtInput.addEventListener('input', (e: any) => { data.text = e.target.value; });

  renderExplanationInput(parent, data);
}
