export function renderFlashcardForm(
  parent: HTMLDivElement,
  data: any
): void {
  const groupFront = document.createElement('div');
  groupFront.classList.add('activity-form-group');
  groupFront.innerHTML = `
    <label class="activity-editor-label">Front Word (Foreign Term)</label>
    <input type="text" class="activity-input-text flashcard-front" value="${data.front || ''}" placeholder="E.g., வணக்கம்">
  `;
  parent.appendChild(groupFront);

  const frontInput = groupFront.querySelector('.flashcard-front') as HTMLInputElement;
  frontInput.addEventListener('input', (e: any) => { data.front = e.target.value; });

  const groupBack = document.createElement('div');
  groupBack.classList.add('activity-form-group');
  groupBack.innerHTML = `
    <label class="activity-editor-label">Back Word (Native Translation)</label>
    <input type="text" class="activity-input-text flashcard-back" value="${data.back || ''}" placeholder="E.g., Hello / Welcome">
  `;
  parent.appendChild(groupBack);

  const backInput = groupBack.querySelector('.flashcard-back') as HTMLInputElement;
  backInput.addEventListener('input', (e: any) => { data.back = e.target.value; });

  const groupAudio = document.createElement('div');
  groupAudio.classList.add('activity-form-group');
  groupAudio.innerHTML = `
    <label class="activity-editor-label">Pronunciation Audio URL (Optional)</label>
    <input type="text" class="activity-input-text flashcard-audio" value="${data.audioUrl || ''}" placeholder="E.g., https://example.com/audio/hello.mp3">
    <small class="activity-helper-text">If left empty, browser native SpeechSynthesis will vocalize front word.</small>
  `;
  parent.appendChild(groupAudio);

  const audioInput = groupAudio.querySelector('.flashcard-audio') as HTMLInputElement;
  audioInput.addEventListener('input', (e: any) => { data.audioUrl = e.target.value; });
}
