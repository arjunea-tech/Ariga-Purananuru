/**
 * EditorJS Activity Block Builder Plugin
 * 
 * Provides interactive form builders directly inside the lesson editor to configure low-stakes practices.
 */
import { CrosswordGenerator } from '../services/crossword-generator.service';

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
      gridSize: data?.gridSize || 10,
      words: data?.words || [
        { word: '', clue: '', row: 1, col: 1, direction: 'across' }
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
      <option value="crossword" ${this.data.type === 'crossword' ? 'selected' : ''}>Dynamic Crossword Puzzle</option>
      <option value="word_arrange" ${this.data.type === 'word_arrange' ? 'selected' : ''}>Word Arrangement</option>
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
    } else if (this.data.type === 'crossword') {
      this.renderCrosswordForm(formContainer);
    } else if (this.data.type === 'word_arrange') {
      this.renderWordArrangeForm(formContainer);
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

  private renderCrosswordForm(parent: HTMLDivElement): void {
    // 1. Instructions and Info
    const infoGroup = document.createElement('div');
    infoGroup.style.marginBottom = '1.5rem';
    infoGroup.innerHTML = `
      <div style="background: rgba(59, 130, 246, 0.1); border-left: 4px solid #3b82f6; padding: 1rem; border-radius: 0.5rem; color: #1e3a8a;">
        <strong>Auto-Generated Crossword:</strong> Add your words and clues below. We will automatically calculate the best intersections and grid size.
      </div>
    `;
    parent.appendChild(infoGroup);

    // 2. Words list
    const wordsGroup = document.createElement('div');
    wordsGroup.classList.add('activity-form-group');

    const wordsLabel = document.createElement('label');
    wordsLabel.classList.add('activity-editor-label');
    wordsLabel.textContent = 'Crossword Words & Clues';
    wordsGroup.appendChild(wordsLabel);

    const rowsContainer = document.createElement('div');
    rowsContainer.classList.add('crossword-rows-container');

    const renderWordRows = () => {
      rowsContainer.innerHTML = '';
      this.data.words.forEach((w: any, idx: number) => {
        const row = document.createElement('div');
        row.style.background = '#f8fafc';
        row.style.border = '1px solid #e2e8f0';
        row.style.borderRadius = '0.5rem';
        row.style.padding = '1rem';
        row.style.marginBottom = '1rem';

        row.innerHTML = `
          <div style="display: flex; gap: 0.75rem; margin-bottom: 0.5rem;">
            <input type="text" class="activity-input-text cw-word" placeholder="Word (e.g. HELLO)" value="${w.word || ''}" style="flex: 1; text-transform: uppercase;">
            <button type="button" class="activity-btn activity-btn-danger cw-del" style="flex-shrink: 0;">&times; Remove</button>
          </div>
          <input type="text" class="activity-input-text cw-clue" placeholder="Clue (e.g. A common greeting)" value="${w.clue || ''}" style="width: 100%;">
        `;

        // Bind events
        const wordInput = row.querySelector('.cw-word') as HTMLInputElement;
        const clueInput = row.querySelector('.cw-clue') as HTMLInputElement;
        const delBtn = row.querySelector('.cw-del') as HTMLButtonElement;

        wordInput.addEventListener('input', (e: any) => { w.word = e.target.value.toUpperCase(); });
        clueInput.addEventListener('input', (e: any) => { w.clue = e.target.value; });

        delBtn.addEventListener('click', () => {
          if (this.data.words.length > 1) {
            this.data.words.splice(idx, 1);
            renderWordRows();
          }
        });

        rowsContainer.appendChild(row);
      });
    };

    renderWordRows();
    wordsGroup.appendChild(rowsContainer);

    // Add row button
    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.classList.add('activity-btn', 'activity-btn-primary', 'mt-2');
    addBtn.innerHTML = `+ Add Word`;
    addBtn.addEventListener('click', () => {
      this.data.words.push({ word: '', clue: '' }); // Simplified payload for auto-gen
      renderWordRows();
    });
    wordsGroup.appendChild(addBtn);
    parent.appendChild(wordsGroup);

    // 3. Auto Generate Action Button
    const genGroup = document.createElement('div');
    genGroup.style.marginTop = '2rem';
    genGroup.style.paddingTop = '1rem';
    genGroup.style.borderTop = '1px solid #e2e8f0';

    const genBtn = document.createElement('button');
    genBtn.type = 'button';
    genBtn.classList.add('activity-btn');
    genBtn.style.background = '#10b981';
    genBtn.style.color = 'white';
    genBtn.innerHTML = `Generate`;

    const statusText = document.createElement('div');
    statusText.style.marginTop = '0.75rem';
    statusText.style.fontSize = '0.85rem';
    statusText.style.color = '#64748b';

    genBtn.addEventListener('click', () => {
      try {
        const result = CrosswordGenerator.generate(this.data.words);
        this.data.gridSize = result.gridSize;

        // We overwrite this.data.words with the fully calculated placed words array
        // It now contains row, col, and direction natively.
        // But we must preserve unplaced words in the UI so the admin can fix them.
        this.data.words = [...result.words, ...result.unplaced];

        let msg = 'Success! Generated ' + result.gridSize + 'x' + result.gridSize + ' grid fitting ' + result.words.length + ' words.';
        if (result.unplaced.length > 0) {
          msg += ' <strong style="color:#ef4444;">Could not fit ' + result.unplaced.length + ' words (No intersections).</strong>';
        }
        statusText.innerHTML = msg;

        // We re-render the rows so the UI persists their existence (or we could visualize the preview here)
        renderWordRows();
      } catch (err) {
        statusText.innerHTML = '<span style="color:#ef4444;">Generation error occurred. Please ensure words have valid characters.</span>';
      }
    });

    genGroup.appendChild(genBtn);
    genGroup.appendChild(statusText);
    parent.appendChild(genGroup);

    this.renderExplanationInput(parent);
  }

  private renderWordArrangeForm(parent: HTMLDivElement): void {
    const qGroup = document.createElement('div');
    qGroup.classList.add('activity-form-group');
    qGroup.innerHTML = `
      <label class="activity-editor-label">Question Text</label>
      <input type="text" class="activity-input-text word-arrange-question" value="${this.data.question || 'Arrange the words to form a correct sentence:'}" placeholder="E.g., Arrange the words to form a correct sentence:">
    `;
    parent.appendChild(qGroup);

    const txtGroup = document.createElement('div');
    txtGroup.classList.add('activity-form-group');
    txtGroup.innerHTML = `
      <label class="activity-editor-label">Correct Sentence (Words separated by space or '/')</label>
      <input type="text" class="activity-input-text word-arrange-text" value="${this.data.text || ''}" placeholder="E.g., he is playing OR he/is/playing">
      <small class="activity-helper-text">
        Enter the words in correct order. You can separate them by spaces or slashes.
      </small>
    `;
    parent.appendChild(txtGroup);

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
    } else if (type === 'word_arrange') {
      const qInput = blockContent.querySelector('.word-arrange-question') as HTMLInputElement;
      const txtInput = blockContent.querySelector('.word-arrange-text') as HTMLInputElement;
      savedData.question = qInput ? qInput.value : '';
      savedData.text = txtInput ? txtInput.value : '';
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
    } else if (type === 'crossword') {
      // The generation logic modifies this.data directly and sets row/col/direction.
      // We only save words that were successfully placed by the algorithm (they have row & col).
      // If the admin clicks save without generating, we automatically run generation here as a fallback.
      let finalWords = this.data.words;
      let finalSize = this.data.gridSize;

      // Check if they forgot to generate
      const needsGeneration = finalWords.some((w: any) => !w.row || !w.direction);
      if (needsGeneration) {
        const result = CrosswordGenerator.generate(finalWords);
        finalWords = result.words;
        finalSize = result.gridSize;
      }

      // Filter out any unplaced words
      const successfullyPlaced = finalWords.filter((w: any) => w.row && w.col && w.direction);

      savedData.gridSize = finalSize || 10;
      savedData.words = successfullyPlaced.map((w: any) => ({
        word: w.word,
        clue: w.clue,
        row: w.row,
        col: w.col,
        direction: w.direction
      }));
    }

    return savedData;
  }
}
