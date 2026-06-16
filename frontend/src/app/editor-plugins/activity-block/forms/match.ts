export function renderMatchForm(
  parent: HTMLDivElement,
  data: any,
  renderExplanationInput: (parent: HTMLDivElement, data: any) => void
): void {
  // 1. Config Section (Theme, Mode, Audio)
  const configGroup = document.createElement('div');
  configGroup.classList.add('activity-form-group');
  configGroup.style.display = 'grid';
  configGroup.style.gridTemplateColumns = 'repeat(auto-fit, minmax(180px, 1fr))';
  configGroup.style.gap = '1rem';
  configGroup.style.marginBottom = '1.5rem';
  configGroup.style.background = '#f1f5f9';
  configGroup.style.padding = '1.25rem';
  configGroup.style.borderRadius = '0.75rem';
  configGroup.style.border = '1px solid #e2e8f0';

  configGroup.innerHTML = `
    <div style="display: flex; flex-direction: column; justify-content: center;">
      <label class="activity-editor-label" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; margin-bottom: 0;">
        <input type="checkbox" class="match-cloud-theme" ${data.theme === 'cloud' ? 'checked' : ''} style="width: 1.15rem; height: 1.15rem;">
        Cloud Layout
      </label>
    </div>
    <div style="display: flex; flex-direction: column; justify-content: center;">
      <label class="activity-editor-label" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; margin-bottom: 0;">
        <input type="checkbox" class="match-drag-drop" ${data.allowDragDrop ? 'checked' : ''} style="width: 1.15rem; height: 1.15rem;">
        Drag & Drop
      </label>
    </div>
    <div style="display: flex; flex-direction: column; justify-content: center;">
      <label class="activity-editor-label" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; margin-bottom: 0;">
        <input type="checkbox" class="match-click-match" ${data.allowClickMatch ? 'checked' : ''} style="width: 1.15rem; height: 1.15rem;">
        Click to Match
      </label>
    </div>
    <div style="display: flex; flex-direction: column; justify-content: center;">
      <label class="activity-editor-label" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; margin-bottom: 0;">
        <input type="checkbox" class="match-enable-audio" ${data.enableAudio ? 'checked' : ''} style="width: 1.15rem; height: 1.15rem;">
        Audio
      </label>
    </div>
  `;

  // Bind configuration events
  const cloudThemeCheckbox = configGroup.querySelector('.match-cloud-theme') as HTMLInputElement;
  const dragDropCheckbox = configGroup.querySelector('.match-drag-drop') as HTMLInputElement;
  const clickMatchCheckbox = configGroup.querySelector('.match-click-match') as HTMLInputElement;
  const audioCheckbox = configGroup.querySelector('.match-enable-audio') as HTMLInputElement;

  cloudThemeCheckbox.addEventListener('change', (e: any) => { data.theme = e.target.checked ? 'cloud' : 'standard'; });
  dragDropCheckbox.addEventListener('change', (e: any) => { data.allowDragDrop = e.target.checked; });
  clickMatchCheckbox.addEventListener('change', (e: any) => { data.allowClickMatch = e.target.checked; });
  audioCheckbox.addEventListener('change', (e: any) => { data.enableAudio = e.target.checked; });

  parent.appendChild(configGroup);

  // 2. Pairs Table/Container
  const pairsGroup = document.createElement('div');
  pairsGroup.classList.add('activity-form-group');

  const label = document.createElement('label');
  label.classList.add('activity-editor-label');
  label.textContent = 'Match Pairs (Left Word -> Right Word/Image)';
  pairsGroup.appendChild(label);

  const rowsContainer = document.createElement('div');
  rowsContainer.classList.add('match-rows-container');

  const renderPairRows = () => {
    rowsContainer.innerHTML = '';
    data.pairs.forEach((pair: any, idx: number) => {
      const row = document.createElement('div');
      row.style.background = '#f8fafc';
      row.style.border = '1px solid #e2e8f0';
      row.style.borderRadius = '0.5rem';
      row.style.padding = '1rem';
      row.style.marginBottom = '0.75rem';

      row.innerHTML = `
        <div style="display: flex; gap: 0.75rem; margin-bottom: 0.5rem; align-items: center;">
          <input type="text" class="activity-input-text pair-left" placeholder="Left Word (Text)" value="${pair.left || ''}" style="flex: 1; margin-bottom: 0;">
          <span style="color: #94a3b8; font-weight: bold;">➔</span>
          <input type="text" class="activity-input-text pair-right" placeholder="Right Word (Text)" value="${pair.right || ''}" style="flex: 1; margin-bottom: 0;">
          <button type="button" class="activity-btn activity-btn-danger pair-del" style="flex-shrink: 0; padding: 0.5rem 0.75rem; margin-bottom: 0;">&times;</button>
        </div>
        <div style="margin-top: 0.5rem; display: flex; flex-direction: column; gap: 0.5rem;">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <input type="text" class="activity-input-text pair-right-image" placeholder="Right Image URL (E.g. https://example.com/img.jpg)" value="${pair.rightImage || ''}" style="flex: 1; font-size: 0.85rem; margin-bottom: 0;">
            <span style="color: #64748b; font-size: 0.8rem; font-weight: bold;">OR</span>
            <label class="activity-btn activity-btn-primary" style="margin-bottom: 0; padding: 0.45rem 0.75rem; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 0.35rem; flex-shrink: 0;">
              📷 Upload File
              <input type="file" class="pair-image-upload" accept="image/*" style="display: none;">
            </label>
          </div>
          <!-- Preview Container -->
          <div class="image-preview-container" style="display: ${pair.rightImage ? 'flex' : 'none'}; align-items: center; gap: 0.75rem; background: #ffffff; padding: 0.5rem; border-radius: 0.375rem; border: 1px dashed #cbd5e1;">
            <img src="${pair.rightImage || ''}" style="max-height: 45px; max-width: 80px; border-radius: 0.25rem; object-fit: contain;" class="preview-img">
            <span class="preview-filename text-muted" style="font-size: 0.75rem; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">Selected Image</span>
            <button type="button" class="activity-btn activity-btn-danger clear-img-btn" style="padding: 0.2rem 0.5rem; font-size: 0.75rem; margin-bottom: 0;">Remove</button>
          </div>
        </div>
      `;

      // Bind pair inputs events
      const leftVal = row.querySelector('.pair-left') as HTMLInputElement;
      const rightVal = row.querySelector('.pair-right') as HTMLInputElement;
      const rightImgVal = row.querySelector('.pair-right-image') as HTMLInputElement;
      const fileInput = row.querySelector('.pair-image-upload') as HTMLInputElement;
      const previewContainer = row.querySelector('.image-preview-container') as HTMLDivElement;
      const previewImg = row.querySelector('.preview-img') as HTMLImageElement;
      const clearImgBtn = row.querySelector('.clear-img-btn') as HTMLButtonElement;
      const delBtn = row.querySelector('.pair-del') as HTMLButtonElement;

      leftVal.addEventListener('input', (e: any) => { pair.left = e.target.value; });
      rightVal.addEventListener('input', (e: any) => { pair.right = e.target.value; });

      rightImgVal.addEventListener('input', (e: any) => {
        pair.rightImage = e.target.value;
        if (pair.rightImage) {
          previewImg.src = pair.rightImage;
          previewContainer.style.display = 'flex';
        } else {
          previewContainer.style.display = 'none';
        }
      });

      fileInput.addEventListener('change', (e: any) => {
        const file = e.target.files?.[0];
        if (!file) return;

        rightImgVal.placeholder = "Uploading image...";
        rightImgVal.disabled = true;

        const formData = new FormData();
        formData.append('file', file);

        fetch('http://127.0.0.1:8000/api/contents/upload', {
          method: 'POST',
          body: formData
        })
          .then(res => res.json())
          .then(uploadResult => {
            rightImgVal.disabled = false;
            rightImgVal.placeholder = "Right Image URL (E.g. https://example.com/img.jpg)";

            if (uploadResult && uploadResult.url) {
              pair.rightImage = uploadResult.url;
              rightImgVal.value = uploadResult.url;
              previewImg.src = uploadResult.url;
              previewContainer.style.display = 'flex';
            } else {
              alert("Upload failed. Invalid response from server.");
            }
          })
          .catch(err => {
            rightImgVal.disabled = false;
            rightImgVal.placeholder = "Right Image URL (E.g. https://example.com/img.jpg)";
            console.error("Upload error:", err);
            alert("Upload failed. Could not reach server.");
          });
      });

      clearImgBtn.addEventListener('click', () => {
        pair.rightImage = '';
        rightImgVal.value = '';
        previewContainer.style.display = 'none';
      });

      delBtn.addEventListener('click', () => {
        if (data.pairs.length > 1) {
          data.pairs.splice(idx, 1);
          renderPairRows();
        }
      });

      rowsContainer.appendChild(row);
    });
  };

  renderPairRows();
  pairsGroup.appendChild(rowsContainer);

  // Add pair button
  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.classList.add('activity-btn', 'activity-btn-primary', 'mt-1');
  addBtn.innerHTML = `+ Add Pair`;
  addBtn.addEventListener('click', () => {
    data.pairs.push({ left: '', right: '', rightImage: '' });
    renderPairRows();
  });
  pairsGroup.appendChild(addBtn);

  parent.appendChild(pairsGroup);

  renderExplanationInput(parent, data);
}
