export function renderYappuAsaiSliceForm(
  parent: HTMLDivElement,
  data: any,
  renderExplanationInput: (parent: HTMLDivElement, data: any) => void
): void {
  if (!data.question) {
    data.question = "சொல்லைச் சரியான அசைகளாகப் பிரிக்கவும் (Slice the word into Asai):";
  }
  if (!data.words || !Array.isArray(data.words)) {
    data.words = ['அகரம்', 'தாமரை', 'கண்ணன்', 'அறத்துப்பால்', 'கம்பராமாயணம்', 'உலகம்', 'திருக்குறள்', 'கல்வி'];
  }

  // 1. Question Input
  const qGroup = document.createElement('div');
  qGroup.classList.add('activity-form-group');
  qGroup.innerHTML = `
    <label class="activity-editor-label">Question Text (கேள்வி)</label>
    <input type="text" class="activity-input-text slice-question" value="${data.question}" placeholder="E.g., சொல்லைச் சரியான அசைகளாகப் பிரிக்கவும்:">
  `;
  parent.appendChild(qGroup);

  const qInput = qGroup.querySelector('.slice-question') as HTMLInputElement;
  qInput.addEventListener('input', (e: any) => {
    data.question = e.target.value;
  });

  // 2. Custom Words Input (comma-separated)
  const wordsGroup = document.createElement('div');
  wordsGroup.classList.add('activity-form-group');
  wordsGroup.innerHTML = `
    <label class="activity-editor-label">Practice Words List (சொற்களின் பட்டியல் - கமா பயன்படுத்தி பிரிக்கவும்)</label>
    <textarea class="activity-input-text slice-words" rows="3" placeholder="எ.கா: அகரம், தாமரை, கம்பராமாயணம், அறத்துப்பால்">${(data.words || []).join(', ')}</textarea>
    <small style="color: #64748b; margin-top: 4px; display: block;">பயிற்சி செய்ய வேண்டிய தமிழ் சொற்களைக் கமா (,) மூலம் பிரித்து உள்ளிடவும்.</small>
  `;
  parent.appendChild(wordsGroup);

  const wordsInput = wordsGroup.querySelector('.slice-words') as HTMLTextAreaElement;
  wordsInput.addEventListener('input', (e: any) => {
    const raw = e.target.value || '';
    data.words = raw.split(',').map((w: string) => w.trim()).filter(Boolean);
  });

  // 3. Explanation Input
  renderExplanationInput(parent, data);
}
