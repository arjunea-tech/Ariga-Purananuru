/**
 * EditorJS Activity Block Builder Plugin
 * 
 * Provides interactive form builders directly inside the lesson editor to configure low-stakes practices.
 */
export class ActivityBlock {
  private data: any;
  private api: any;
  private readOnly: boolean;
  private container: HTMLDivElement | null = null;

  static get toolbox() {
    return {
      title: 'Interactive Activity',
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="9" x2="15" y2="15"></line><line x1="15" y1="9" x2="9" y2="15"></line></svg>`
    };
  }

  constructor({ data, api, readOnly }: any) {
    this.data = {
      type: data?.type || 'mcq',
      question: data?.question || '',
      options: data?.options || [
        { text: '', isCorrect: true },
        { text: '', isCorrect: false }
      ],
      text: data?.text || '',
      front: data?.front || '',
      back: data?.back || '',
      audioUrl: data?.audioUrl || '',
      pairs: data?.pairs || [
        { left: '', right: '' }
      ],
      explanation: data?.explanation || ''
    };
    this.api = api;
    this.readOnly = readOnly;
  }

  render(): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.classList.add('editorjs-activity-block');
    
    // Add CSS styles inline to keep it self-contained
    const styleId = 'editorjs-activity-block-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .editorjs-activity-block {
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          border-radius: 1rem;
          padding: 1.5rem;
          margin: 1rem 0;
          font-family: 'Inter', system-ui, sans-serif;
          box-shadow: 0 4px 12px rgba(0,0,0,0.02);
        }
        .activity-editor-label {
          font-weight: 700;
          font-size: 0.85rem;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          display: block;
          margin-bottom: 0.5rem;
        }
        .activity-editor-select {
          width: 100%;
          padding: 0.65rem;
          border-radius: 0.5rem;
          border: 1.5px solid #cbd5e1;
          background: white;
          color: #0f172a;
          font-weight: 600;
          outline: none;
          margin-bottom: 1.25rem;
        }
        .activity-form-group {
          margin-bottom: 1.25rem;
        }
        .activity-input-text, .activity-textarea {
          width: 100%;
          padding: 0.65rem 0.85rem;
          border-radius: 0.5rem;
          border: 1.5px solid #cbd5e1;
          color: #1e293b;
          font-weight: 500;
          outline: none;
          transition: all 0.2s ease;
        }
        .activity-input-text:focus, .activity-textarea:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
        }
        .activity-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
        }
        .activity-btn {
          border: none;
          border-radius: 0.5rem;
          padding: 0.5rem 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
        }
        .activity-btn-primary {
          background: #3b82f6;
          color: white;
        }
        .activity-btn-primary:hover {
          background: #2563eb;
        }
        .activity-btn-danger {
          background: #fee2e2;
          color: #ef4444;
        }
        .activity-btn-danger:hover {
          background: #ef4444;
          color: white;
        }
        .activity-helper-text {
          font-size: 0.75rem;
          color: #64748b;
          margin-top: 0.25rem;
          display: block;
        }
        .activity-radio {
          width: 1.15rem;
          height: 1.15rem;
          accent-color: #3b82f6;
          cursor: pointer;
        }
      `;
      document.head.appendChild(style);
    }

    this.container = wrapper as HTMLDivElement;
    this.buildUI();

    return wrapper;
  }

  private buildUI(): void {
    if (!this.container) return;

    this.container.innerHTML = '';

    // Label & Select Drodown
    const label = document.createElement('label');
    label.classList.add('activity-editor-label');
    label.textContent = 'Practice Activity Type';
    this.container.appendChild(label);

    const select = document.createElement('select');
    select.classList.add('activity-editor-select');
    select.innerHTML = `
      <option value="mcq" ${this.data.type === 'mcq' ? 'selected' : ''}>Multiple Choice Question (MCQ)</option>
      <option value="fill_blanks" ${this.data.type === 'fill_blanks' ? 'selected' : ''}>Fill in the Blanks</option>
      <option value="flashcard" ${this.data.type === 'flashcard' ? 'selected' : ''}>3D Vocabulary Flashcard</option>
      <option value="match" ${this.data.type === 'match' ? 'selected' : ''}>Match the Following Pairs</option>
    `;

    select.addEventListener('change', (e: any) => {
      // Save current states as much as possible then switch type
      this.data.type = e.target.value;
      this.buildUI();
    });

    this.container.appendChild(select);

    // Form Container
    const formContainer = document.createElement('div');
    formContainer.classList.add('activity-form-container');

    // Dynamic Render depending on Selected Type
    if (this.data.type === 'mcq') {
      this.renderMCQForm(formContainer);
    } else if (this.data.type === 'fill_blanks') {
      this.renderBlanksForm(formContainer);
    } else if (this.data.type === 'flashcard') {
      this.renderFlashcardForm(formContainer);
    } else if (this.data.type === 'match') {
      this.renderMatchForm(formContainer);
    }

    this.container.appendChild(formContainer);
  }

  private renderMCQForm(parent: HTMLDivElement): void {
    // 1. Question input
    const qGroup = document.createElement('div');
    qGroup.classList.add('activity-form-group');
    qGroup.innerHTML = `
      <label class="activity-editor-label">Question Text</label>
      <input type="text" class="activity-input-text mcq-question" value="${this.data.question || ''}" placeholder="E.g., What is the translation of 'Welcome'?">
    `;
    parent.appendChild(qGroup);

    // 2. Options list
    const optionsGroup = document.createElement('div');
    optionsGroup.classList.add('activity-form-group');
    
    const optionsLabel = document.createElement('label');
    optionsLabel.classList.add('activity-editor-label');
    optionsLabel.textContent = 'Answer Options (Select correct answer radio)';
    optionsGroup.appendChild(optionsLabel);

    const rowsContainer = document.createElement('div');
    rowsContainer.classList.add('mcq-rows-container');

    const renderOptionRows = () => {
      rowsContainer.innerHTML = '';
      this.data.options.forEach((opt: any, idx: number) => {
        const row = document.createElement('div');
        row.classList.add('activity-row');

        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = `mcq-correct-${this.api.blocks.getCurrentBlockIndex()}`;
        radio.classList.add('activity-radio');
        radio.checked = !!opt.isCorrect;
        radio.addEventListener('change', () => {
          this.data.options.forEach((o: any, i: number) => o.isCorrect = i === idx);
        });

        const input = document.createElement('input');
        input.type = 'text';
        input.classList.add('activity-input-text');
        input.style.flexGrow = '1';
        input.value = opt.text || '';
        input.placeholder = `Option ${idx + 1}`;
        input.addEventListener('input', (e: any) => {
          opt.text = e.target.value;
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.classList.add('activity-btn', 'activity-btn-danger');
        deleteBtn.innerHTML = `&times; Delete`;
        deleteBtn.addEventListener('click', () => {
          if (this.data.options.length > 1) {
            this.data.options.splice(idx, 1);
            renderOptionRows();
          }
        });

        row.appendChild(radio);
        row.appendChild(input);
        row.appendChild(deleteBtn);
        rowsContainer.appendChild(row);
      });
    };

    renderOptionRows();
    optionsGroup.appendChild(rowsContainer);

    // Add option button
    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.classList.add('activity-btn', 'activity-btn-primary', 'mt-2');
    addBtn.innerHTML = `+ Add Option`;
    addBtn.addEventListener('click', () => {
      this.data.options.push({ text: '', isCorrect: false });
      renderOptionRows();
    });
    optionsGroup.appendChild(addBtn);

    parent.appendChild(optionsGroup);

    // 3. Explanation
    this.renderExplanationInput(parent);
  }

  private renderBlanksForm(parent: HTMLDivElement): void {
    const group = document.createElement('div');
    group.classList.add('activity-form-group');
    group.innerHTML = `
      <label class="activity-editor-label">Text Sentence (With Bracketed Blanks)</label>
      <textarea class="activity-textarea fill-blanks-text" rows="3" placeholder="E.g., The [cat] is sleeping on the [mat].">${this.data.text || ''}</textarea>
      <small class="activity-helper-text">
        Use brackets <strong>[correctAnswer]</strong> around target words (E.g. The [dog] barked).
      </small>
    `;
    parent.appendChild(group);

    this.renderExplanationInput(parent);
  }

  private renderFlashcardForm(parent: HTMLDivElement): void {
    const groupFront = document.createElement('div');
    groupFront.classList.add('activity-form-group');
    groupFront.innerHTML = `
      <label class="activity-editor-label">Front Word (Foreign Term)</label>
      <input type="text" class="activity-input-text flashcard-front" value="${this.data.front || ''}" placeholder="E.g., வணக்கம்">
    `;
    parent.appendChild(groupFront);

    const groupBack = document.createElement('div');
    groupBack.classList.add('activity-form-group');
    groupBack.innerHTML = `
      <label class="activity-editor-label">Back Word (Native Translation)</label>
      <input type="text" class="activity-input-text flashcard-back" value="${this.data.back || ''}" placeholder="E.g., Hello / Welcome">
    `;
    parent.appendChild(groupBack);

    const groupAudio = document.createElement('div');
    groupAudio.classList.add('activity-form-group');
    groupAudio.innerHTML = `
      <label class="activity-editor-label">Pronunciation Audio URL (Optional)</label>
      <input type="text" class="activity-input-text flashcard-audio" value="${this.data.audioUrl || ''}" placeholder="E.g., https://example.com/audio/hello.mp3">
      <small class="activity-helper-text">If left empty, browser native SpeechSynthesis will vocalize front word.</small>
    `;
    parent.appendChild(groupAudio);
  }

  private renderMatchForm(parent: HTMLDivElement): void {
    const pairsGroup = document.createElement('div');
    pairsGroup.classList.add('activity-form-group');
    
    const label = document.createElement('label');
    label.classList.add('activity-editor-label');
    label.textContent = 'Word Matches Pairs (Left & Right Column Pairing)';
    pairsGroup.appendChild(label);

    const rowsContainer = document.createElement('div');
    rowsContainer.classList.add('match-rows-container');

    const renderPairRows = () => {
      rowsContainer.innerHTML = '';
      this.data.pairs.forEach((pair: any, idx: number) => {
        const row = document.createElement('div');
        row.classList.add('activity-row');

        const leftInput = document.createElement('input');
        leftInput.type = 'text';
        leftInput.classList.add('activity-input-text');
        leftInput.style.flex = '1';
        leftInput.value = pair.left || '';
        leftInput.placeholder = `Left word ${idx + 1} (English)`;
        leftInput.addEventListener('input', (e: any) => {
          pair.left = e.target.value;
        });

        const rightInput = document.createElement('input');
        rightInput.type = 'text';
        rightInput.classList.add('activity-input-text');
        rightInput.style.flex = '1';
        rightInput.value = pair.right || '';
        rightInput.placeholder = `Right word ${idx + 1} (Tamil)`;
        rightInput.addEventListener('input', (e: any) => {
          pair.right = e.target.value;
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.classList.add('activity-btn', 'activity-btn-danger');
        deleteBtn.innerHTML = `&times; Delete`;
        deleteBtn.addEventListener('click', () => {
          if (this.data.pairs.length > 1) {
            this.data.pairs.splice(idx, 1);
            renderPairRows();
          }
        });

        row.appendChild(leftInput);
        row.appendChild(rightInput);
        row.appendChild(deleteBtn);
        rowsContainer.appendChild(row);
      });
    };

    renderPairRows();
    pairsGroup.appendChild(rowsContainer);

    // Add row button
    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.classList.add('activity-btn', 'activity-btn-primary', 'mt-2');
    addBtn.innerHTML = `+ Add Pair`;
    addBtn.addEventListener('click', () => {
      this.data.pairs.push({ left: '', right: '' });
      renderPairRows();
    });
    pairsGroup.appendChild(addBtn);

    parent.appendChild(pairsGroup);

    this.renderExplanationInput(parent);
  }

  private renderExplanationInput(parent: HTMLDivElement): void {
    const group = document.createElement('div');
    group.classList.add('activity-form-group');
    group.innerHTML = `
      <label class="activity-editor-label">Incorrect Explanation Feedback</label>
      <textarea class="activity-textarea activity-explanation" rows="2" placeholder="Explain the rationale behind the correct choice...">${this.data.explanation || ''}</textarea>
    `;
    parent.appendChild(group);
  }

  save(blockContent: HTMLElement): any {
    const type = this.data.type;
    const explanationTextarea = blockContent.querySelector('.activity-explanation') as HTMLTextAreaElement;
    const explanation = explanationTextarea ? explanationTextarea.value : (this.data.explanation || '');

    const savedData: any = {
      type,
      explanation
    };

    if (type === 'mcq') {
      const qInput = blockContent.querySelector('.mcq-question') as HTMLInputElement;
      savedData.question = qInput ? qInput.value : '';
      savedData.options = this.data.options.map((opt: any) => ({
        text: opt.text,
        isCorrect: !!opt.isCorrect
      }));
    } else if (type === 'fill_blanks') {
      const txtTextarea = blockContent.querySelector('.fill-blanks-text') as HTMLTextAreaElement;
      savedData.text = txtTextarea ? txtTextarea.value : '';
    } else if (type === 'flashcard') {
      const frontInput = blockContent.querySelector('.flashcard-front') as HTMLInputElement;
      const backInput = blockContent.querySelector('.flashcard-back') as HTMLInputElement;
      const audioInput = blockContent.querySelector('.flashcard-audio') as HTMLInputElement;
      
      savedData.front = frontInput ? frontInput.value : '';
      savedData.back = backInput ? backInput.value : '';
      savedData.audioUrl = audioInput ? audioInput.value : '';
      // Exclude explanation for flashcard
      delete savedData.explanation;
    } else if (type === 'match') {
      savedData.pairs = this.data.pairs.map((p: any) => ({
        left: p.left,
        right: p.right
      }));
    }

    return savedData;
  }
}
