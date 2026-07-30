export function renderAlahiduFillTableForm(
  parent: HTMLDivElement,
  data: any,
  renderExplanationInput: (parent: HTMLDivElement, data: any) => void
): void {
  if (!data.question) {
    data.question = "அலகிடும் அட்டவணையை நிரப்புக:";
  }
  if (!data.rows || !Array.isArray(data.rows)) {
    data.rows = [
      {
        word: { value: "", isMissing: false },
        asai: { value: "", isMissing: false },
        seer: { value: "", isMissing: false }
      }
    ];
  }
  if (!data.options || !Array.isArray(data.options)) {
    data.options = [""];
  }

  const container = document.createElement('div');
  container.innerHTML = `
    <div class="activity-form-group">
      <label class="activity-editor-label">Question (கேள்வி)</label>
      <input type="text" class="activity-input-text fill-table-q" value="${data.question}">
    </div>
    
    <label class="activity-editor-label">Table Rows (அட்டவணை)</label>
    <p style="font-size: 12px; color: #666; margin-bottom: 10px;">Check the box if the cell should be blank (missing) for the student.</p>
    <div class="table-container"></div>
    <button class="activity-btn add-row-btn">+ Add Row</button>
    
    <hr style="margin: 20px 0;"/>
    
    <label class="activity-editor-label">Options Pool (விருப்பங்கள்)</label>
    <p style="font-size: 12px; color: #666; margin-bottom: 10px;">Ensure you include all correct answers and some distractors.</p>
    <div class="options-container"></div>
    <button class="activity-btn add-option-btn">+ Add Option</button>
  `;

  parent.appendChild(container);

  container.querySelector('.fill-table-q')?.addEventListener('input', (e: any) => { data.question = e.target.value; });

  const tableContainer = container.querySelector('.table-container') as HTMLElement;
  const addRowBtn = container.querySelector('.add-row-btn') as HTMLButtonElement;

  const renderTable = () => {
    tableContainer.innerHTML = '';
    data.rows.forEach((row: any, index: number) => {
      const rowDiv = document.createElement('div');
      rowDiv.style.border = '1px solid #ccc';
      rowDiv.style.padding = '10px';
      rowDiv.style.marginBottom = '10px';
      rowDiv.style.borderRadius = '5px';
      
      rowDiv.innerHTML = `
        <div style="display:flex; justify-content:flex-end; margin-bottom:5px;">
           <button class="activity-btn remove-row-btn" style="background:#dc3545; padding: 2px 10px; font-size:12px;">X</button>
        </div>
        <div style="display:flex; gap:10px; align-items: flex-start;">
          <div style="flex:1;">
            <input type="text" class="activity-input-text r-word" value="${row.word.value}" placeholder="சீர் (Word)">
            <label style="font-size:12px;"><input type="checkbox" class="c-word" ${row.word.isMissing ? 'checked' : ''}> Is Blank?</label>
          </div>
          <div style="flex:1;">
            <input type="text" class="activity-input-text r-asai" value="${row.asai.value}" placeholder="அசை">
            <label style="font-size:12px;"><input type="checkbox" class="c-asai" ${row.asai.isMissing ? 'checked' : ''}> Is Blank?</label>
          </div>
          <div style="flex:1;">
            <input type="text" class="activity-input-text r-seer" value="${row.seer.value}" placeholder="வாய்ப்பாடு">
            <label style="font-size:12px;"><input type="checkbox" class="c-seer" ${row.seer.isMissing ? 'checked' : ''}> Is Blank?</label>
          </div>
        </div>
      `;

      rowDiv.querySelector('.r-word')?.addEventListener('input', (e: any) => { row.word.value = e.target.value; });
      rowDiv.querySelector('.c-word')?.addEventListener('change', (e: any) => { row.word.isMissing = e.target.checked; });

      rowDiv.querySelector('.r-asai')?.addEventListener('input', (e: any) => { row.asai.value = e.target.value; });
      rowDiv.querySelector('.c-asai')?.addEventListener('change', (e: any) => { row.asai.isMissing = e.target.checked; });

      rowDiv.querySelector('.r-seer')?.addEventListener('input', (e: any) => { row.seer.value = e.target.value; });
      rowDiv.querySelector('.c-seer')?.addEventListener('change', (e: any) => { row.seer.isMissing = e.target.checked; });

      rowDiv.querySelector('.remove-row-btn')?.addEventListener('click', () => {
        data.rows.splice(index, 1);
        renderTable();
      });

      tableContainer.appendChild(rowDiv);
    });
  };

  addRowBtn.addEventListener('click', (e) => {
    e.preventDefault();
    data.rows.push({
      word: { value: "", isMissing: false },
      asai: { value: "", isMissing: false },
      seer: { value: "", isMissing: false }
    });
    renderTable();
  });

  const optionsContainer = container.querySelector('.options-container') as HTMLElement;
  const addOptBtn = container.querySelector('.add-option-btn') as HTMLButtonElement;

  const renderOptions = () => {
    optionsContainer.innerHTML = '';
    data.options.forEach((opt: string, index: number) => {
      const optDiv = document.createElement('div');
      optDiv.style.display = 'flex';
      optDiv.style.gap = '10px';
      optDiv.style.marginBottom = '5px';
      optDiv.innerHTML = `
        <input type="text" class="activity-input-text opt-val" value="${opt}" placeholder="Option" style="flex:1">
        <button class="activity-btn remove-opt-btn" style="background:#dc3545;">X</button>
      `;

      optDiv.querySelector('.opt-val')?.addEventListener('input', (e: any) => { data.options[index] = e.target.value; });
      optDiv.querySelector('.remove-opt-btn')?.addEventListener('click', () => {
        data.options.splice(index, 1);
        renderOptions();
      });

      optionsContainer.appendChild(optDiv);
    });
  };

  addOptBtn.addEventListener('click', (e) => {
    e.preventDefault();
    data.options.push("");
    renderOptions();
  });

  renderTable();
  renderOptions();
  renderExplanationInput(parent, data);
}
