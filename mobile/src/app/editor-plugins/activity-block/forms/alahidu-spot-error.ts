export function renderAlahiduSpotErrorForm(
  parent: HTMLDivElement,
  data: any,
  renderExplanationInput: (parent: HTMLDivElement, data: any) => void
): void {
  if (!data.question) {
    data.question = "கீழ்க்காணும் அலகிடும் அட்டவணையில் எங்கு பிழை உள்ளது எனக் கண்டுபிடி:";
  }
  if (!data.tableData || !Array.isArray(data.tableData)) {
    data.tableData = [
      { word: "", asai: "", seer: "" }
    ];
  }
  if (data.errorRowIndex === undefined) {
    data.errorRowIndex = 0;
  }

  const container = document.createElement('div');
  container.innerHTML = `
    <div class="activity-form-group">
      <label class="activity-editor-label">Question (கேள்வி)</label>
      <input type="text" class="activity-input-text spot-error-q" value="${data.question}">
    </div>
    <label class="activity-editor-label">Table Rows (அட்டவணை)</label>
    <div class="table-container"></div>
    <button class="activity-btn add-row-btn">+ Add Row</button>
  `;

  parent.appendChild(container);

  container.querySelector('.spot-error-q')?.addEventListener('input', (e: any) => { data.question = e.target.value; });

  const tableContainer = container.querySelector('.table-container') as HTMLElement;
  const addBtn = container.querySelector('.add-row-btn') as HTMLButtonElement;

  const renderTable = () => {
    tableContainer.innerHTML = '';
    data.tableData.forEach((row: any, index: number) => {
      const rowDiv = document.createElement('div');
      rowDiv.style.border = '1px solid #ccc';
      rowDiv.style.padding = '10px';
      rowDiv.style.marginBottom = '10px';
      rowDiv.style.borderRadius = '5px';
      rowDiv.innerHTML = `
        <div style="display:flex; gap:10px; margin-bottom:5px;">
          <input type="text" class="activity-input-text r-word" value="${row.word}" placeholder="சீர் (Word)" style="flex:1">
          <input type="text" class="activity-input-text r-asai" value="${row.asai}" placeholder="அசை" style="flex:1">
          <input type="text" class="activity-input-text r-seer" value="${row.seer}" placeholder="வாய்ப்பாடு" style="flex:1">
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <label style="display:flex; align-items:center; gap:5px; color: #dc3545; font-weight:bold;">
            <input type="radio" name="isErrorRow" ${data.errorRowIndex === index ? 'checked' : ''} value="${index}"> Has Error? (இதுதான் தவறான வரியா?)
          </label>
          <button class="activity-btn remove-row-btn" style="background:#dc3545; padding: 2px 10px;">X Remove</button>
        </div>
      `;

      rowDiv.querySelector('.r-word')?.addEventListener('input', (e: any) => { row.word = e.target.value; });
      rowDiv.querySelector('.r-asai')?.addEventListener('input', (e: any) => { row.asai = e.target.value; });
      rowDiv.querySelector('.r-seer')?.addEventListener('input', (e: any) => { row.seer = e.target.value; });
      
      rowDiv.querySelector('input[type="radio"]')?.addEventListener('change', () => {
        data.errorRowIndex = index;
      });

      rowDiv.querySelector('.remove-row-btn')?.addEventListener('click', () => {
        data.tableData.splice(index, 1);
        if (data.errorRowIndex === index) data.errorRowIndex = 0;
        else if (data.errorRowIndex > index) data.errorRowIndex--;
        renderTable();
      });

      tableContainer.appendChild(rowDiv);
    });
  };

  addBtn.addEventListener('click', (e) => {
    e.preventDefault();
    data.tableData.push({ word: "", asai: "", seer: "" });
    renderTable();
  });

  renderTable();
  renderExplanationInput(parent, data);
}
