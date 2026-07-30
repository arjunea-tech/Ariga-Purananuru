export function renderAlahiduTrueFalseForm(
  parent: HTMLDivElement,
  data: any,
  renderExplanationInput: (parent: HTMLDivElement, data: any) => void
): void {
  if (!data.question) {
    data.question = "சரியா தவறா என கூறுக:";
  }
  if (!data.statement) {
    data.statement = "";
  }
  if (data.isTrue === undefined) {
    data.isTrue = true;
  }

  const container = document.createElement('div');
  container.innerHTML = `
    <div class="activity-form-group">
      <label class="activity-editor-label">Question (கேள்வி)</label>
      <input type="text" class="activity-input-text tf-question" value="${data.question}" placeholder="E.g., சரியா தவறா என கூறுக:">
    </div>
    
    <div class="activity-form-group">
      <label class="activity-editor-label">Statement (வாக்கியம்)</label>
      <input type="text" class="activity-input-text tf-statement" value="${data.statement}" placeholder="E.g., வெண்பாவின் ஈற்றுச்சீர் நாள், மலர், காசு, பிறப்பு...">
    </div>
    
    <div class="activity-form-group">
      <label class="activity-editor-label">Is it True? (இது சரியான வாக்கியமா?)</label>
      <select class="activity-select tf-istrue">
        <option value="true" ${data.isTrue ? 'selected' : ''}>சரி (True)</option>
        <option value="false" ${!data.isTrue ? 'selected' : ''}>தவறு (False)</option>
      </select>
    </div>
  `;

  parent.appendChild(container);

  container.querySelector('.tf-question')?.addEventListener('input', (e: any) => {
    data.question = e.target.value;
  });

  container.querySelector('.tf-statement')?.addEventListener('input', (e: any) => {
    data.statement = e.target.value;
  });

  container.querySelector('.tf-istrue')?.addEventListener('change', (e: any) => {
    data.isTrue = e.target.value === 'true';
  });

  renderExplanationInput(parent, data);
}
