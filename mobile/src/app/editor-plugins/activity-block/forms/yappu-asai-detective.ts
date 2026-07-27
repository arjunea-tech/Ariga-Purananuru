export function renderYappuAsaiDetectiveForm(
  parent: HTMLDivElement,
  data: any,
  renderExplanationInput: (parent: HTMLDivElement, data: any) => void
): void {
  if (!data.question) {
    data.question = "பிழையற்ற சரியான அசை பிரிப்பைக் கண்டறிக (Identify the correct Asai split):";
  }

  // 1. Question Input
  const qGroup = document.createElement('div');
  qGroup.classList.add('activity-form-group');
  qGroup.innerHTML = `
    <label class="activity-editor-label">Question Text (கேள்வி)</label>
    <input type="text" class="activity-input-text detective-question" value="${data.question}" placeholder="E.g., பிழையற்ற சரியான அசை பிரிப்பைக் கண்டறிக:">
  `;
  parent.appendChild(qGroup);

  const qInput = qGroup.querySelector('.detective-question') as HTMLInputElement;
  qInput.addEventListener('input', (e: any) => {
    data.question = e.target.value;
  });

  // 2. Info alert about Detective Challenges
  const infoGroup = document.createElement('div');
  infoGroup.classList.add('activity-form-group');
  infoGroup.innerHTML = `
    <div style="background: #fff7ed; border-left: 4px solid #ea580c; padding: 12px 16px; border-radius: 8px; font-size: 0.9rem; color: #9a3412;">
      <strong>🕵️‍♂️ அசை பிழை திருத்துதல் (Detective Mode):</strong><br>
      இந்த விளையாட்டில் தமிழ்NLP சிஸ்டம் தானாகவே தவறாகப் பிரிக்கப்பட்ட சவால்களையும் (Distractor Options) மற்றும் சரியான யாப்பிலக்கண விதிகளையும் மாணவர்களுக்கு வழங்கும்!
    </div>
  `;
  parent.appendChild(infoGroup);

  // 3. Explanation Input
  renderExplanationInput(parent, data);
}
