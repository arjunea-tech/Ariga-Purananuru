export function renderYappuKuralPuzzleForm(
  parent: HTMLDivElement,
  data: any,
  renderExplanationInput: (parent: HTMLDivElement, data: any) => void
): void {
  if (!data.question) {
    data.question = "கலைந்துள்ள சீர்களைச் சரியாக அமைத்து திருக்குறளைச் சீரமைக்குக:";
  }

  const qGroup = document.createElement('div');
  qGroup.classList.add('activity-form-group');
  qGroup.innerHTML = `
    <label class="activity-editor-label">Activity Question (கேள்வி)</label>
    <input type="text" class="activity-input-text puzzle-question" value="${data.question}" placeholder="E.g., திருக்குறளைச் சீரமைக்குக:">
  `;
  parent.appendChild(qGroup);

  const qInput = qGroup.querySelector('.puzzle-question') as HTMLInputElement;
  qInput.addEventListener('input', (e: any) => {
    data.question = e.target.value;
  });

  renderExplanationInput(parent, data);
}
