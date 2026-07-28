export function renderYappuAsaiDetectiveForm(
  parent: HTMLDivElement,
  data: any,
  renderExplanationInput: (parent: HTMLDivElement, data: any) => void
): void {
  if (!data.question) {
    data.question = "கொடுக்கப்பட்ட வார்த்தையை சரியான அசைகளாகப் பிரி:";
  }
  if (!data.challenges || !Array.isArray(data.challenges)) {
    data.challenges = [];
  }

  // 1. Question Input
  const qGroup = document.createElement('div');
  qGroup.classList.add('activity-form-group');
  qGroup.innerHTML = `
    <label class="activity-editor-label">Question Text (கேள்வி)</label>
    <input type="text" class="activity-input-text detective-question" value="${data.question}" placeholder="E.g., வார்த்தையை சரியான அசைகளாகப் பிரி:">
  `;
  parent.appendChild(qGroup);

  const qInput = qGroup.querySelector('.detective-question') as HTMLInputElement;
  qInput.addEventListener('input', (e: any) => {
    data.question = e.target.value;
  });

  // 2. Challenges builder
  const challengeLabel = document.createElement('label');
  challengeLabel.className = 'activity-editor-label';
  challengeLabel.textContent = 'அசை பிரிப்பு சவால்கள் (Challenges)';
  challengeLabel.style.cssText = 'margin-top: 8px; display: block;';
  parent.appendChild(challengeLabel);

  const challengesContainer = document.createElement('div');
  challengesContainer.id = 'detective-challenges-container';
  challengesContainer.style.cssText = 'display: flex; flex-direction: column; gap: 14px;';
  parent.appendChild(challengesContainer);

  const rerenderAllChallenges = () => {
    challengesContainer.innerHTML = '';
    data.challenges.forEach((challenge: any, index: number) => {
      const card = document.createElement('div');
      card.style.cssText = 'background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 14px; position: relative;';
      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <strong style="color: #334155; font-size: 0.9rem;">சவால் #${index + 1}</strong>
          <button type="button" class="remove-challenge-btn" style="background: #fee2e2; color: #dc2626; border: none; border-radius: 6px; padding: 4px 10px; cursor: pointer; font-size: 0.8rem;">✕ அகற்று</button>
        </div>
        <div style="margin-bottom: 8px;">
          <label style="font-size: 0.8rem; color: #64748b; display: block; margin-bottom: 4px;">சொல் (Word)</label>
          <input type="text" class="activity-input-text challenge-word" value="${challenge.word || ''}" placeholder="e.g., தாமரை" style="width: 100%; box-sizing: border-box;">
        </div>
        <div style="margin-bottom: 8px;">
          <label style="font-size: 0.8rem; color: #16a34a; display: block; margin-bottom: 4px;">✓ சரியான அசை பிரிப்பு — கமா மூலம் பிரிக்கவும்</label>
          <input type="text" class="activity-input-text challenge-correct" value="${(challenge.correctSplits || []).join(', ')}" placeholder="e.g., தாம, ரை" style="width: 100%; box-sizing: border-box; border-color: #86efac;">
          <small style="color: #64748b; display: block; margin-top: 3px;">ஒவ்வொரு அசையை கமா (,) மூலம் பிரிக்கவும்</small>
        </div>
        <div style="margin-bottom: 8px;">
          <label style="font-size: 0.8rem; color: #dc2626; display: block; margin-bottom: 4px;">✗ தவறான விருப்பங்கள் — ஒவ்வொரு வரியில் ஒரு தவறான பிரிப்பு</label>
          <textarea class="activity-input-text challenge-wrong" rows="3" placeholder="e.g., தா, மர, ை&#10;தாமர, ை" style="width: 100%; box-sizing: border-box; border-color: #fca5a5; font-family: inherit;">${(challenge.wrongOptions || []).map((w: string[]) => w.join(', ')).join('\n')}</textarea>
          <small style="color: #64748b; display: block; margin-top: 3px;">ஒவ்வொரு வரிசையிலும் ஒரு தவறான பிரிப்பை கமா மூலம் எழுதவும்</small>
        </div>
        <div>
          <label style="font-size: 0.8rem; color: #64748b; display: block; margin-bottom: 4px;">விளக்கம் (Explanation)</label>
          <input type="text" class="activity-input-text challenge-explanation" value="${challenge.explanation || ''}" placeholder="e.g., தாம (நிரை) + ரை (நேர்) என்பதே சரியான பிரிப்பு" style="width: 100%; box-sizing: border-box;">
        </div>
      `;

      (card.querySelector('.remove-challenge-btn') as HTMLButtonElement)
        .addEventListener('click', () => {
          data.challenges.splice(index, 1);
          rerenderAllChallenges();
        });

      (card.querySelector('.challenge-word') as HTMLInputElement)
        .addEventListener('input', (e: any) => { data.challenges[index].word = e.target.value; });

      (card.querySelector('.challenge-correct') as HTMLInputElement)
        .addEventListener('input', (e: any) => {
          data.challenges[index].correctSplits = e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean);
        });

      (card.querySelector('.challenge-wrong') as HTMLTextAreaElement)
        .addEventListener('input', (e: any) => {
          const lines: string[] = e.target.value.split('\n').filter((l: string) => l.trim());
          data.challenges[index].wrongOptions = lines.map((line: string) =>
            line.split(',').map((s: string) => s.trim()).filter(Boolean)
          );
        });

      (card.querySelector('.challenge-explanation') as HTMLInputElement)
        .addEventListener('input', (e: any) => { data.challenges[index].explanation = e.target.value; });

      challengesContainer.appendChild(card);
    });
  };

  rerenderAllChallenges();

  // Add Challenge button
  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.textContent = '+ புதிய சவால் சேர்';
  addBtn.style.cssText = 'background: #dbeafe; color: #1d4ed8; border: 1.5px dashed #93c5fd; border-radius: 8px; padding: 8px 16px; cursor: pointer; font-size: 0.9rem; width: 100%; margin-top: 4px;';
  addBtn.addEventListener('click', () => {
    data.challenges.push({ word: '', correctSplits: [], wrongOptions: [], explanation: '' });
    rerenderAllChallenges();
  });
  parent.appendChild(addBtn);
}
