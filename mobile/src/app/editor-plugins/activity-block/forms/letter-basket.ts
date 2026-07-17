const DYNAMIC_KURIL = ['அ', 'இ', 'உ', 'எ', 'ஒ', 'க', 'கி', 'கு', 'கெ', 'கொ', 'ச', 'சி', 'சு', 'செ', 'சொ', 'த', 'தி', 'து', 'தெ', 'தொ', 'ப', 'பி', 'பு', 'பெ', 'பொ', 'ம', 'மி', 'மு', 'மெ', 'மொ', 'ய', 'யி', 'யு', 'யெ', 'யொ', 'ர', 'ரி', 'ரு', 'ரெ', 'ரொ', 'ல', 'லி', 'லு', 'லெ', 'லொ', 'வ', 'வி', 'வு', 'வெ', 'வொ', 'ழ', 'ழி', 'ழு', 'ழெ', 'ழொ'];
const DYNAMIC_NEDIL = ['ஆ', 'ஈ', 'ஊ', 'ஏ', 'ஐ', 'ஓ', 'ஔ', 'கா', 'கீ', 'கூ', 'கே', 'கை', 'கோ', 'கௌ', 'சா', 'சீ', 'சூ', 'சே', 'சை', 'சோ', 'சௌ', 'தா', 'தீ', 'தூ', 'தே', 'தை', 'தோ', 'தௌ', 'பா', 'பீ', 'பூ', 'பே', 'பை', 'போ', 'பௌ', 'மா', 'மீ', 'மூ', 'மே', 'மை', 'மோ', 'மௌ', 'யா', 'யீ', 'யூ', 'யே', 'யை', 'யோ', 'யௌ', 'ரா', 'ரீ', 'ரூ', 'ரே', 'ரை', 'ரோ', 'ரௌ', 'லா', 'லீ', 'லூ', 'லே', 'லை', 'லோ', 'லௌ', 'வா', 'வீ', 'வூ', 'வே', 'வை', 'வோ', 'வௌ', 'ழா', 'ழீ', 'ழூ', 'ழே', 'ழை', 'ழோ', 'ழௌ'];
const DYNAMIC_MEI = ['க்', 'ங்', 'ச்', 'ஞ்', 'ட்', 'ண்', 'த்', 'ந்', 'ப்', 'ம்', 'ய்', 'ர்', 'ல்', 'வ்', 'ழ்', 'ள்', 'ற்', 'ன்'];
const DYNAMIC_OTTRU = ['ஃ', 'க்', 'ங்', 'ச்', 'ஞ்', 'ட்', 'ண்', 'த்', 'ந்', 'ப்', 'ம்', 'ய்', 'ர்', 'ல்', 'வ்', 'ழ்', 'ள்', 'ற்', 'ன்'];

function shuffleArray(array: any[]) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function generateRandomLetters(count: number): Array<{ text: string, category: string }> {
  let kCount = Math.floor(count / 3);
  let nCount = Math.floor(count / 3);
  let moCount = count - (kCount + nCount);

  const kurilSel = shuffleArray(DYNAMIC_KURIL).slice(0, kCount);
  const nedilSel = shuffleArray(DYNAMIC_NEDIL).slice(0, nCount);
  
  const combinedMeiOttru = [...new Set([...DYNAMIC_MEI, ...DYNAMIC_OTTRU])];
  const meiOttruSel = shuffleArray(combinedMeiOttru).slice(0, moCount);

  const items: any[] = [];
  kurilSel.forEach(text => items.push({ text, category: 'குறில்' }));
  nedilSel.forEach(text => items.push({ text, category: 'நெடில்' }));
  meiOttruSel.forEach(text => items.push({ text, category: 'மெய் / ஒற்று' }));

  return shuffleArray(items);
}

export function renderLetterBasketForm(
  parent: HTMLDivElement,
  data: any,
  renderExplanationInput: (parent: HTMLDivElement, data: any) => void
): void {
  // Initialize defaults
  if (!data.letterCount) {
    data.letterCount = data.items?.length || 10;
  }
  if (!data.items || data.items.length === 0) {
    data.items = generateRandomLetters(data.letterCount);
  }

  // 1. Question input
  const qGroup = document.createElement('div');
  qGroup.classList.add('activity-form-group');
  qGroup.innerHTML = `
    <label class="activity-editor-label">Question Text</label>
    <input type="text" class="activity-input-text basket-question" value="${data.question || ''}" placeholder="E.g., எழுத்துக்களை சரியான கூடைகளில் இடுக">
  `;
  parent.appendChild(qGroup);

  const qInput = qGroup.querySelector('.basket-question') as HTMLInputElement;
  qInput.addEventListener('input', (e: any) => { 
    data.question = e.target.value; 
  });

  // 2. Select number of letters layout options
  const selectGroup = document.createElement('div');
  selectGroup.classList.add('activity-form-group');
  selectGroup.innerHTML = `
    <label class="activity-editor-label">Select Number of Letters to Generate (எழுத்துக்களின் எண்ணிக்கை)</label>
    <div style="display: flex; gap: 1rem; margin-bottom: 1rem;">
      <div class="letter-count-box" data-count="10" style="flex: 1; border: 2.5px solid #cbd5e1; border-radius: 0.75rem; padding: 1rem; text-align: center; cursor: pointer; transition: all 0.2s; font-weight: bold; background: white; color: #334155;">
        10 Letters
      </div>
      <div class="letter-count-box" data-count="20" style="flex: 1; border: 2.5px solid #cbd5e1; border-radius: 0.75rem; padding: 1rem; text-align: center; cursor: pointer; transition: all 0.2s; font-weight: bold; background: white; color: #334155;">
        20 Letters
      </div>
      <div class="letter-count-box" data-count="30" style="flex: 1; border: 2.5px solid #cbd5e1; border-radius: 0.75rem; padding: 1rem; text-align: center; cursor: pointer; transition: all 0.2s; font-weight: bold; background: white; color: #334155;">
        30 Letters
      </div>
    </div>
  `;
  parent.appendChild(selectGroup);

  // 3. Letters preview container
  const previewGroup = document.createElement('div');
  previewGroup.classList.add('activity-form-group');
  previewGroup.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
      <label class="activity-editor-label" style="margin: 0;">Generated Letters Preview</label>
      <button type="button" class="activity-btn activity-btn-primary basket-regenerate-btn" style="font-size: 0.75rem; padding: 0.25rem 0.75rem;">Regenerate</button>
    </div>
    <div class="basket-preview-container" style="display: flex; flex-wrap: wrap; gap: 0.5rem; border: 1.5px dashed #cbd5e1; border-radius: 0.75rem; padding: 1rem; min-height: 80px; background: #f8fafc;">
    </div>
  `;
  parent.appendChild(previewGroup);

  const previewContainer = previewGroup.querySelector('.basket-preview-container') as HTMLDivElement;
  const regenerateBtn = previewGroup.querySelector('.basket-regenerate-btn') as HTMLButtonElement;

  const updatePreview = () => {
    previewContainer.innerHTML = '';
    
    // Update count boxes active states
    const countBoxes = selectGroup.querySelectorAll('.letter-count-box');
    countBoxes.forEach((box: any) => {
      const count = parseInt(box.getAttribute('data-count') || '10');
      if (count === data.letterCount) {
        box.style.borderColor = '#3b82f6';
        box.style.background = '#eff6ff';
        box.style.color = '#1d4ed8';
        box.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.15)';
      } else {
        box.style.borderColor = '#cbd5e1';
        box.style.background = 'white';
        box.style.color = '#334155';
        box.style.boxShadow = 'none';
      }
    });

    // Render badges
    data.items.forEach((item: any) => {
      const badge = document.createElement('div');
      badge.style.background = '#ffffff';
      badge.style.border = '1px solid #cbd5e1';
      badge.style.borderRadius = '0.5rem';
      badge.style.padding = '0.35rem 0.6rem';
      badge.style.fontSize = '0.85rem';
      badge.style.fontWeight = '600';
      badge.style.display = 'inline-flex';
      badge.style.alignItems = 'center';
      badge.style.gap = '0.25rem';
      
      const badgeText = document.createElement('span');
      badgeText.textContent = item.text || '?';
      badgeText.style.fontSize = '1rem';
      badgeText.style.fontWeight = 'bold';
      badgeText.style.color = '#0f172a';

      let categoryText = item.category;
      if (categoryText === 'மெய்' || categoryText === 'ஒற்று') {
        categoryText = 'மெய் / ஒற்று';
      }

      const badgeCategory = document.createElement('span');
      badgeCategory.textContent = `(${categoryText})`;
      badgeCategory.style.fontSize = '0.7rem';
      badgeCategory.style.color = '#64748b';

      badge.appendChild(badgeText);
      badge.appendChild(badgeCategory);
      previewContainer.appendChild(badge);
    });
  };

  // Add click listener to count boxes
  const countBoxes = selectGroup.querySelectorAll('.letter-count-box');
  countBoxes.forEach((box: any) => {
    box.addEventListener('click', () => {
      const count = parseInt(box.getAttribute('data-count') || '10');
      data.letterCount = count;
      data.items = generateRandomLetters(count);
      updatePreview();
    });
  });

  // Regenerate button
  regenerateBtn.addEventListener('click', () => {
    data.items = generateRandomLetters(data.letterCount);
    updatePreview();
  });

  updatePreview();

  // 4. Explanation
  renderExplanationInput(parent, data);
}
