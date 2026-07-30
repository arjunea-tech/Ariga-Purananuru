export function renderYappuSeerBasketForm(data: any): HTMLElement {
  const container = document.createElement('div');
  container.className = 'activity-form-container';

  container.innerHTML = `
    <div class="mb-3">
      <h5 class="fw-bold text-dark"><i class="bi bi-basket2-fill me-2" style="color: #D97706;"></i>சீர் கூடை (Seer Sorting Basket)</h5>
      <p class="text-muted small">மாணவர்கள் மேலிருந்து விழும் சீர்களை சரியான கூடைகளில் (மாச்சீர், விளச்சீர், காய்ச்சீர், கனிச்சீர்) பொறுக்குவதற்கான விளையாட்டு.</p>
    </div>

    <div class="mb-3">
      <label class="form-label fw-bold small text-secondary">Level (நிலை)</label>
      <select class="form-select border-2 bg-light shadow-none" id="levelSelect">
        <option value="0" ${data.level === 0 ? 'selected' : ''}>அனைத்துச் சீர்கள் (All Seers)</option>
        <option value="2" ${data.level === 2 ? 'selected' : ''}>ஈரசைச் சீர்கள் மட்டும் (2-Asai Only)</option>
        <option value="3" ${data.level === 3 ? 'selected' : ''}>மூவசைச் சீர்கள் மட்டும் (3-Asai Only)</option>
      </select>
      <div class="form-text">எந்த வகையான சீர்கள் விளையாட்டில் வர வேண்டும் என்பதைத் தேர்ந்தெடுக்கவும்.</div>
    </div>
  `;

  // Bind change events to dynamically update data object
  const levelSelect = container.querySelector('#levelSelect') as HTMLSelectElement;
  levelSelect.addEventListener('change', () => {
    data.level = parseInt(levelSelect.value, 10);
  });

  return container;
}
