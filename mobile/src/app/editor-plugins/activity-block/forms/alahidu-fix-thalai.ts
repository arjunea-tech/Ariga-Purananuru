export function renderAlahiduFixThalaiForm(
  parent: HTMLDivElement,
  data: any,
  renderExplanationInput: (parent: HTMLDivElement, data: any) => void
): void {
  if (!data.question) {
    data.question = "தளை தட்டாமல் சீரமைக்க:";
  }
  if (!data.firstWord) {
    data.firstWord = "";
  }
  if (!data.lastWord) {
    data.lastWord = "";
  }
  if (!data.options || data.options.length === 0) {
    data.options = [
      { word: "", isCorrect: true, explanation: "" },
      { word: "", isCorrect: false, explanation: "" }
    ];
  }

  const container = document.createElement('div');
  container.innerHTML = `
    <div class="activity-form-group">
      <label class="activity-editor-label">Question (கேள்வி)</label>
      <input type="text" class="activity-input-text thalai-q" value="${data.question}">
    </div>
    <div class="activity-form-group" style="display:flex; gap: 10px;">
      <div style="flex:1">
        <label class="activity-editor-label">First Word (முதல் சீர்)</label>
        <input type="text" class="activity-input-text first-word" value="${data.firstWord}" placeholder="E.g., கற்றதனால்">
      </div>
      <div style="flex:1">
        <label class="activity-editor-label">Last Word (மூன்றாம் சீர்)</label>
        <input type="text" class="activity-input-text last-word" value="${data.lastWord}" placeholder="E.g., பயனென்கொல்">
      </div>
    </div>
    <hr/>
    <label class="activity-editor-label">Options for Middle Word (நடுவில் வர வேண்டிய சீருக்கான விருப்பங்கள்)</label>
    <div class="options-container"></div>
    <button class="activity-btn add-option-btn">+ Add Option</button>
  `;

  parent.appendChild(container);

  container.querySelector('.thalai-q')?.addEventListener('input', (e: any) => { data.question = e.target.value; });
  container.querySelector('.first-word')?.addEventListener('input', (e: any) => { data.firstWord = e.target.value; });
  container.querySelector('.last-word')?.addEventListener('input', (e: any) => { data.lastWord = e.target.value; });

  const optionsContainer = container.querySelector('.options-container') as HTMLElement;
  const addBtn = container.querySelector('.add-option-btn') as HTMLButtonElement;

  const renderOptions = () => {
    optionsContainer.innerHTML = '';
    data.options.forEach((opt: any, index: number) => {
      const optDiv = document.createElement('div');
      optDiv.style.border = '1px solid #ccc';
      optDiv.style.padding = '10px';
      optDiv.style.marginBottom = '10px';
      optDiv.style.borderRadius = '5px';
      optDiv.innerHTML = `
        <div style="display:flex; gap:10px; margin-bottom:5px;">
          <input type="text" class="activity-input-text opt-word" value="${opt.word}" placeholder="Word (சீர்)" style="flex:1">
          <label style="display:flex; align-items:center; gap:5px;">
            <input type="radio" name="isCorrectThalai" ${opt.isCorrect ? 'checked' : ''} value="${index}"> Correct
          </label>
          <button class="activity-btn remove-opt-btn" style="background:#dc3545;">X</button>
        </div>
        <input type="text" class="activity-input-text opt-exp" value="${opt.explanation || ''}" placeholder="Explanation (விளக்கம் - ஏன் தவறு/சரி)">
      `;
      
      optDiv.querySelector('.opt-word')?.addEventListener('input', (e: any) => { opt.word = e.target.value; });
      optDiv.querySelector('.opt-exp')?.addEventListener('input', (e: any) => { opt.explanation = e.target.value; });
      optDiv.querySelector('input[type="radio"]')?.addEventListener('change', () => {
        data.options.forEach((o: any, i: number) => o.isCorrect = (i === index));
      });
      optDiv.querySelector('.remove-opt-btn')?.addEventListener('click', () => {
        data.options.splice(index, 1);
        renderOptions();
      });

      optionsContainer.appendChild(optDiv);
    });
  };

  addBtn.addEventListener('click', (e) => {
    e.preventDefault();
    data.options.push({ word: "", isCorrect: false, explanation: "" });
    renderOptions();
  });

  renderOptions();
  renderExplanationInput(parent, data);
}
