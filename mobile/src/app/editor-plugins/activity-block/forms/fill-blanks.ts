export function renderBlanksForm(
  parent: HTMLDivElement,
  data: any,
  renderExplanationInput: (parent: HTMLDivElement, data: any) => void
): void {
  const group = document.createElement('div');
  group.classList.add('activity-form-group');
  group.innerHTML = `
    <label class="activity-editor-label">Text Sentence (With Bracketed Blanks)</label>
    <textarea class="activity-textarea fill-blanks-text" rows="3" placeholder="E.g., The [cat] is sleeping on the [mat].">${data.text || ''}</textarea>
    <small class="activity-helper-text">
      Use brackets <strong>[correctAnswer]</strong> or inline options <strong>[correct|incorrect]</strong> (E.g. The [dog|cat] barked).
    </small>
  `;
  parent.appendChild(group);

  const txtTextarea = group.querySelector('.fill-blanks-text') as HTMLTextAreaElement;
  txtTextarea.addEventListener('input', (e: any) => { data.text = e.target.value; });

  // Image URL input
  const imgGroup = document.createElement('div');
  imgGroup.classList.add('activity-form-group');
  imgGroup.innerHTML = `
    <label class="activity-editor-label">Question Image URL (Optional)</label>
    <input type="text" class="activity-input-text fill-blanks-image" value="${data.imageUrl || ''}" placeholder="E.g., https://example.com/images/fox.jpg">
  `;
  parent.appendChild(imgGroup);

  const imgInput = imgGroup.querySelector('.fill-blanks-image') as HTMLInputElement;
  imgInput.addEventListener('input', (e: any) => {
    data.imageUrl = e.target.value;
    if (!data.additional_data) data.additional_data = {};
    data.additional_data.imageUrl = e.target.value;
  });

  // Audio URL input
  const audioGroup = document.createElement('div');
  audioGroup.classList.add('activity-form-group');
  audioGroup.innerHTML = `
    <label class="activity-editor-label">Question Audio URL (Optional)</label>
    <input type="text" class="activity-input-text fill-blanks-audio" value="${data.audioUrl || ''}" placeholder="E.g., https://example.com/audio/sentence.mp3">
  `;
  parent.appendChild(audioGroup);

  const audioInput = audioGroup.querySelector('.fill-blanks-audio') as HTMLInputElement;
  audioInput.addEventListener('input', (e: any) => { data.audioUrl = e.target.value; });

  renderExplanationInput(parent, data);
}
