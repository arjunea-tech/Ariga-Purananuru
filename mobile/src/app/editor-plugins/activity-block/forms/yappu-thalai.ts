export function renderYappuThalaiForm(
  parent: HTMLDivElement,
  data: any,
  renderExplanationInput: (parent: HTMLDivElement, data: any) => void
): void {
  if (!data.question) {
    data.question = "கொடுக்கப்பட்டுள்ள சீர்களுக்கு இடையே அமையும் தளைக் கண்டறிக:";
  }

  const qGroup = document.createElement('div');
  qGroup.classList.add('activity-form-group');
  qGroup.innerHTML = `
    <label class="activity-editor-label">Activity Question (கேள்வி)</label>
    <input type="text" class="activity-input-text thalai-question" value="${data.question}" placeholder="E.g., சீர்களுக்கு இடையே அமையும் தளைக் கண்டறிக:">
  `;
  parent.appendChild(qGroup);

  const qInput = qGroup.querySelector('.thalai-question') as HTMLInputElement;
  qInput.addEventListener('input', (e: any) => {
    data.question = e.target.value;
  });

  renderExplanationInput(parent, data);
}
