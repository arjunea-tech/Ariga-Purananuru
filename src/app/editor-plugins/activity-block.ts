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
    let type = data?.type || 'mcq';
    if (type === 'cloud_match') {
      type = 'match';
    }

    this.data = {
      type,
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
        { left: '', right: '', rightImage: '' }
      ],
      gridSize: data?.gridSize || 10,
      words: data?.words || [
        { word: '', clue: '', row: 1, col: 1, direction: 'across' }
      ],
      theme: data?.theme || (data?.isCloud ? 'cloud' : 'standard'),
      allowDragDrop: !!(data?.allowDragDrop ?? (data?.matchMode !== 'click_match')),
      allowClickMatch: !!(data?.allowClickMatch ?? (data?.matchMode !== 'drag_drop')),
      enableAudio: !!(data?.enableAudio ?? false),
      explanation: data?.explanation || '',

      // New properties for LSRW activity types
      imageUrl: data?.imageUrl || data?.media_url || '',
      targetText: data?.targetText || '',
      dialogue: data?.dialogue || [
        { role: 'system', name: 'Interviewer', text: '' },
        { role: 'student', name: 'Student', text: '' }
      ],
      events: data?.events || ['', '', ''],
      parts: data?.parts || [
        { word: '', tag: 'Noun' }
      ],
      nodes: data?.nodes || [
        { id: 'root', label: 'Main Idea', isPlaceholder: false, parentId: '' },
        { id: 'branch1', label: '', isPlaceholder: true, parentId: 'root' },
        { id: 'leaf1', label: '', isPlaceholder: true, parentId: 'branch1' }
      ],
      starterText: data?.starterText || '',
      modelAnswer: data?.modelAnswer || '',
      minWords: data?.minWords || 1,
      maxWords: data?.maxWords || 1000
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
        .activity-preview-card {
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          border-radius: 0.75rem;
          padding: 1.25rem;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03);
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .activity-preview-card:hover {
          border-color: #cbd5e1;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
        }
        .activity-preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }
        .activity-preview-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: #f1f5f9;
          padding: 0.35rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.85rem;
          font-weight: 600;
          color: #334155;
        }
        .badge-icon i {
          color: #3b82f6;
          font-size: 0.95rem;
          display: inline-flex;
        }
        .activity-preview-edit-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 50%;
          width: 2.2rem;
          height: 2.2rem;
          font-size: 0.95rem;
          cursor: pointer;
          transition: background-color 0.15s, transform 0.15s;
        }
        .activity-preview-edit-btn:hover {
          background: #2563eb;
          transform: scale(1.05);
        }
        .activity-preview-body {
          color: #475569;
        }
        .activity-preview-title {
          font-size: 0.8rem;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin: 0 0 0.25rem 0;
        }
        .activity-preview-desc {
          font-size: 0.95rem;
          font-weight: 500;
          color: #0f172a;
          margin: 0 0 0.5rem 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .activity-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 99999;
          animation: fadeIn 0.2s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .activity-modal-content {
          background: white;
          border-radius: 1rem;
          width: 90%;
          max-width: 650px;
          max-height: 85vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          animation: slideUp 0.2s ease-out;
          border: 1px solid rgba(255, 255, 255, 0.2);
          overflow: hidden;
        }
        @keyframes slideUp {
          from { transform: translateY(15px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .activity-modal-header {
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #f8fafc;
        }
        .activity-modal-body {
          padding: 1.5rem;
          overflow-y: auto;
          flex-grow: 1;
        }
        .activity-modal-footer {
          padding: 1rem 1.5rem;
          border-top: 1px solid #e2e8f0;
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          background: #f8fafc;
        }
      `;
      document.head.appendChild(style);
    }

    this.container = wrapper as HTMLDivElement;
    this.updatePreview();

    return wrapper;
  }

  private getPreviewDetails() {
    const type = this.data.type;
    let typeLabel = 'Activity';
    let icon = 'bi-controller';
    let details = '';

    switch (type) {
      case 'mcq':
        typeLabel = 'Multiple Choice';
        icon = 'bi-record-circle';
        details = `Question: "${this.data.question || '(No Question)'}" | Options: ${this.data.options?.length || 0}`;
        break;
      case 'fill_blanks':
        typeLabel = 'Fill in the Blanks';
        icon = 'bi-input-cursor-text';
        details = `Text: "${this.data.text || '(No Text)'}"`;
        break;
      case 'flashcard':
        typeLabel = '3D Flashcard';
        icon = 'bi-square-half';
        details = `Front: "${this.data.front || ''}" | Back: "${this.data.back || ''}"`;
        break;
      case 'match':
        typeLabel = 'Match It';
        icon = 'bi-puzzle';
        details = `Pairs: ${this.data.pairs?.length || 0} | Theme: ${this.data.theme || 'standard'}`;
        break;
      case 'crossword':
        typeLabel = 'Crossword Puzzle';
        icon = 'bi-grid-3x3';
        details = `Words: ${this.data.words?.length || 0} | Grid: ${this.data.gridSize}x${this.data.gridSize}`;
        break;
      case 'word_arrange':
        typeLabel = 'Word Arrangement';
        icon = 'bi-sort-alpha-down';
        details = `Sentence: "${this.data.text || ''}"`;
        break;
      case 'speaking':
        typeLabel = 'Speaking Practice';
        icon = 'bi-mic';
        details = `Target: "${this.data.targetText || ''}"`;
        break;
      case 'role_play':
        typeLabel = 'Role Play Conversation';
        icon = 'bi-chat-quote';
        details = `Dialogue: ${this.data.dialogue?.length || 0} lines`;
        break;
      case 'sequencing':
        typeLabel = 'Sequencing (Ordering)';
        icon = 'bi-list-ol';
        details = `Events: ${this.data.events?.length || 0}`;
        break;
      case 'parts_of_speech':
        typeLabel = 'Parts of Speech Tagger';
        icon = 'bi-tags';
        details = `Sentence: "${this.data.text || ''}" | Tagged: ${this.data.parts?.length || 0}`;
        break;
      case 'mind_map':
        typeLabel = 'Mind Mapping Diagram';
        icon = 'bi-diagram-3';
        details = `Nodes: ${this.data.nodes?.length || 0}`;
        break;
      case 'writing':
        typeLabel = 'Writing Practice';
        icon = 'bi-pencil-square';
        details = `Prompt: "${this.data.text || ''}"`;
        break;
    }
    return { typeLabel, icon, details };
  }

  private updatePreview(): void {
    if (!this.container) return;
    this.container.innerHTML = '';

    const { typeLabel, icon, details } = this.getPreviewDetails();

    const previewCard = document.createElement('div');
    previewCard.classList.add('activity-preview-card');
    previewCard.innerHTML = `
      <div class="activity-preview-header">
        <div class="activity-preview-badge">
          <span class="badge-icon"><i class="bi ${icon}"></i></span>
          <span class="badge-text">${typeLabel}</span>
        </div>
        <button class="activity-preview-edit-btn" type="button" title="Edit Activity">
          <i class="bi bi-pencil-square"></i>
        </button>
      </div>
      <div class="activity-preview-body">
        <h4 class="activity-preview-title">Configuration Summary</h4>
        <div class="activity-preview-desc" title="${details.replace(/"/g, '&quot;')}">${details}</div>
      </div>
    `;

    const editBtn = previewCard.querySelector('.activity-preview-edit-btn') as HTMLButtonElement;
    editBtn.addEventListener('click', () => {
      this.openModal();
    });

    this.container.appendChild(previewCard);
  }

  private openModal(): void {
    const tempData = JSON.parse(JSON.stringify(this.data));

    const modalOverlay = document.createElement('div');
    modalOverlay.classList.add('activity-modal-overlay');

    modalOverlay.innerHTML = `
      <div class="activity-modal-content">
        <div class="activity-modal-header">
          <h3 style="margin: 0; font-size: 1.2rem; font-weight: 700; color: #0f172a;">Configure Activity</h3>
          <button class="activity-modal-close-x" style="background: none; border: none; font-size: 1.5rem; color: #64748b; cursor: pointer; padding: 0.25rem;">&times;</button>
        </div>
        <div class="activity-modal-body">
          <label class="activity-editor-label">Practice Activity Type</label>
          <select class="activity-editor-select modal-activity-select">
            <option value="mcq" ${tempData.type === 'mcq' ? 'selected' : ''}>Multiple Choice Question (MCQ)</option>
            <option value="fill_blanks" ${tempData.type === 'fill_blanks' ? 'selected' : ''}>Fill in the Blanks</option>
            <option value="flashcard" ${tempData.type === 'flashcard' ? 'selected' : ''}>3D Vocabulary Flashcard</option>
            <option value="match" ${tempData.type === 'match' ? 'selected' : ''}>Match It</option>
            <option value="crossword" ${tempData.type === 'crossword' ? 'selected' : ''}>Dynamic Crossword Puzzle</option>
            <option value="word_arrange" ${tempData.type === 'word_arrange' ? 'selected' : ''}>Word Arrangement</option>
            <option value="speaking" ${tempData.type === 'speaking' ? 'selected' : ''}>Speaking (Voice Record)</option>
            <option value="role_play" ${tempData.type === 'role_play' ? 'selected' : ''}>Role Play Conversation Dialogue</option>
            <option value="sequencing" ${tempData.type === 'sequencing' ? 'selected' : ''}>Sequencing (Event Ordering)</option>
            <option value="parts_of_speech" ${tempData.type === 'parts_of_speech' ? 'selected' : ''}>Parts of Speech Tagger</option>
            <option value="mind_map" ${tempData.type === 'mind_map' ? 'selected' : ''}>Mind Mapping Diagram</option>
            <option value="writing" ${tempData.type === 'writing' ? 'selected' : ''}>Paragraph / Story Writing</option>
          </select>
          <div class="modal-form-container"></div>
        </div>
        <div class="activity-modal-footer">
          <button class="activity-btn activity-modal-cancel" style="background: #e2e8f0; color: #334155;">Cancel</button>
          <button class="activity-btn activity-btn-primary activity-modal-save">Save Changes</button>
        </div>
      </div>
    `;

    document.body.appendChild(modalOverlay);

    const closeX = modalOverlay.querySelector('.activity-modal-close-x') as HTMLButtonElement;
    const cancelBtn = modalOverlay.querySelector('.activity-modal-cancel') as HTMLButtonElement;
    const saveBtn = modalOverlay.querySelector('.activity-modal-save') as HTMLButtonElement;
    const typeSelect = modalOverlay.querySelector('.modal-activity-select') as HTMLSelectElement;
    const formContainer = modalOverlay.querySelector('.modal-form-container') as HTMLDivElement;

    const renderForm = () => {
      formContainer.innerHTML = '';
      const type = tempData.type;
      if (type === 'mcq') {
        this.renderMCQForm(formContainer, tempData);
      } else if (type === 'fill_blanks') {
        this.renderBlanksForm(formContainer, tempData);
      } else if (type === 'flashcard') {
        this.renderFlashcardForm(formContainer, tempData);
      } else if (type === 'match') {
        this.renderMatchForm(formContainer, tempData);
      } else if (type === 'crossword') {
        this.renderCrosswordForm(formContainer, tempData);
      } else if (type === 'word_arrange') {
        this.renderWordArrangeForm(formContainer, tempData);
      } else if (type === 'speaking') {
        this.renderSpeakingForm(formContainer, tempData);
      } else if (type === 'role_play') {
        this.renderRolePlayForm(formContainer, tempData);
      } else if (type === 'sequencing') {
        this.renderSequencingForm(formContainer, tempData);
      } else if (type === 'parts_of_speech') {
        this.renderPartsOfSpeechForm(formContainer, tempData);
      } else if (type === 'mind_map') {
        this.renderMindMapForm(formContainer, tempData);
      } else if (type === 'writing') {
        this.renderWritingForm(formContainer, tempData);
      }
    };

    renderForm();

    typeSelect.addEventListener('change', (e: any) => {
      tempData.type = e.target.value;
      if (tempData.type === 'mcq' && !tempData.options) {
        tempData.options = [{ text: '', isCorrect: true }, { text: '', isCorrect: false }];
      }
      if (tempData.type === 'match' && !tempData.pairs) {
        tempData.pairs = [{ left: '', right: '', rightImage: '' }];
      }
      if (tempData.type === 'crossword' && !tempData.words) {
        tempData.words = [{ word: '', clue: '', row: 1, col: 1, direction: 'across' }];
      }
      if (tempData.type === 'role_play' && !tempData.dialogue) {
        tempData.dialogue = [{ role: 'system', name: 'Interviewer', text: '' }, { role: 'student', name: 'Student', text: '' }];
      }
      if (tempData.type === 'sequencing' && !tempData.events) {
        tempData.events = ['', '', ''];
      }
      if (tempData.type === 'parts_of_speech' && !tempData.parts) {
        tempData.parts = [{ word: '', tag: 'Noun' }];
      }
      if (tempData.type === 'mind_map' && !tempData.nodes) {
        tempData.nodes = [
          { id: 'root', label: 'Main Idea', isPlaceholder: false, parentId: '' },
          { id: 'branch1', label: '', isPlaceholder: true, parentId: 'root' },
          { id: 'leaf1', label: '', isPlaceholder: true, parentId: 'branch1' }
        ];
      }
      renderForm();
    });

    const closeModal = () => {
      document.body.removeChild(modalOverlay);
    };

    closeX.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);

    saveBtn.addEventListener('click', () => {
      if (tempData.type === 'crossword') {
        const needsGeneration = tempData.words.some((w: any) => !w.row || !w.direction);
        if (needsGeneration) {
          try {
            const result = CrosswordGenerator.generate(tempData.words);
            tempData.gridSize = result.gridSize;
            tempData.words = [...result.words, ...result.unplaced];
          } catch (err) {
            console.error("Autogen fail on save", err);
          }
        }
      }

      this.data = tempData;
      this.updatePreview();
      closeModal();
    });
  }

  private renderMCQForm(parent: HTMLDivElement, data: any): void {
    // 1. Question input
    const qGroup = document.createElement('div');
    qGroup.classList.add('activity-form-group');
    qGroup.innerHTML = `
      <label class="activity-editor-label">Question Text</label>
      <input type="text" class="activity-input-text mcq-question" value="${data.question || ''}" placeholder="E.g., What is the translation of 'Welcome'?">
    `;
    parent.appendChild(qGroup);

    const qInput = qGroup.querySelector('.mcq-question') as HTMLInputElement;
    qInput.addEventListener('input', (e: any) => { data.question = e.target.value; });

    // 1b. Audio URL input
    const audioGroup = document.createElement('div');
    audioGroup.classList.add('activity-form-group');
    audioGroup.innerHTML = `
      <label class="activity-editor-label">Pronunciation Audio URL (Optional)</label>
      <input type="text" class="activity-input-text mcq-audio" value="${data.audioUrl || ''}" placeholder="E.g., https://example.com/audio/pronounce.mp3">
    `;
    parent.appendChild(audioGroup);

    const audioInput = audioGroup.querySelector('.mcq-audio') as HTMLInputElement;
    audioInput.addEventListener('input', (e: any) => { data.audioUrl = e.target.value; });

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
      data.options.forEach((opt: any, idx: number) => {
        const row = document.createElement('div');
        row.classList.add('activity-row');

        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = `mcq-correct-${this.api.blocks.getCurrentBlockIndex()}`;
        radio.classList.add('activity-radio');
        radio.checked = !!opt.isCorrect;
        radio.addEventListener('change', () => {
          data.options.forEach((o: any, i: number) => o.isCorrect = i === idx);
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
          if (data.options.length > 1) {
            data.options.splice(idx, 1);
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
      data.options.push({ text: '', isCorrect: false });
      renderOptionRows();
    });
    optionsGroup.appendChild(addBtn);

    parent.appendChild(optionsGroup);

    // 3. Explanation
    this.renderExplanationInput(parent, data);
  }

  private renderBlanksForm(parent: HTMLDivElement, data: any): void {
    const group = document.createElement('div');
    group.classList.add('activity-form-group');
    group.innerHTML = `
      <label class="activity-editor-label">Text Sentence (With Bracketed Blanks)</label>
      <textarea class="activity-textarea fill-blanks-text" rows="3" placeholder="E.g., The [cat] is sleeping on the [mat].">${data.text || ''}</textarea>
      <small class="activity-helper-text">
        Use brackets <strong>[correctAnswer]</strong> or inline options <strong>[correct|incorrect]</strong> (E.g. The [dog|cat] barked).
      </small>
    `;
    parent.appendChild(group);

    const txtTextarea = group.querySelector('.fill-blanks-text') as HTMLTextAreaElement;
    txtTextarea.addEventListener('input', (e: any) => { data.text = e.target.value; });

    // Image URL input
    const imgGroup = document.createElement('div');
    imgGroup.classList.add('activity-form-group');
    imgGroup.innerHTML = `
      <label class="activity-editor-label">Question Image URL (Optional)</label>
      <input type="text" class="activity-input-text fill-blanks-image" value="${data.imageUrl || ''}" placeholder="E.g., https://example.com/images/fox.jpg">
    `;
    parent.appendChild(imgGroup);

    const imgInput = imgGroup.querySelector('.fill-blanks-image') as HTMLInputElement;
    imgInput.addEventListener('input', (e: any) => {
      data.imageUrl = e.target.value;
      if (!data.additional_data) data.additional_data = {};
      data.additional_data.imageUrl = e.target.value;
    });

    // Audio URL input
    const audioGroup = document.createElement('div');
    audioGroup.classList.add('activity-form-group');
    audioGroup.innerHTML = `
      <label class="activity-editor-label">Question Audio URL (Optional)</label>
      <input type="text" class="activity-input-text fill-blanks-audio" value="${data.audioUrl || ''}" placeholder="E.g., https://example.com/audio/sentence.mp3">
    `;
    parent.appendChild(audioGroup);

    const audioInput = audioGroup.querySelector('.fill-blanks-audio') as HTMLInputElement;
    audioInput.addEventListener('input', (e: any) => { data.audioUrl = e.target.value; });

    this.renderExplanationInput(parent, data);
  }

  private renderFlashcardForm(parent: HTMLDivElement, data: any): void {
    const groupFront = document.createElement('div');
    groupFront.classList.add('activity-form-group');
    groupFront.innerHTML = `
      <label class="activity-editor-label">Front Word (Foreign Term)</label>
      <input type="text" class="activity-input-text flashcard-front" value="${data.front || ''}" placeholder="E.g., வணக்கம்">
    `;
    parent.appendChild(groupFront);

    const frontInput = groupFront.querySelector('.flashcard-front') as HTMLInputElement;
    frontInput.addEventListener('input', (e: any) => { data.front = e.target.value; });

    const groupBack = document.createElement('div');
    groupBack.classList.add('activity-form-group');
    groupBack.innerHTML = `
      <label class="activity-editor-label">Back Word (Native Translation)</label>
      <input type="text" class="activity-input-text flashcard-back" value="${data.back || ''}" placeholder="E.g., Hello / Welcome">
    `;
    parent.appendChild(groupBack);

    const backInput = groupBack.querySelector('.flashcard-back') as HTMLInputElement;
    backInput.addEventListener('input', (e: any) => { data.back = e.target.value; });

    const groupAudio = document.createElement('div');
    groupAudio.classList.add('activity-form-group');
    groupAudio.innerHTML = `
      <label class="activity-editor-label">Pronunciation Audio URL (Optional)</label>
      <input type="text" class="activity-input-text flashcard-audio" value="${data.audioUrl || ''}" placeholder="E.g., https://example.com/audio/hello.mp3">
      <small class="activity-helper-text">If left empty, browser native SpeechSynthesis will vocalize front word.</small>
    `;
    parent.appendChild(groupAudio);

    const audioInput = groupAudio.querySelector('.flashcard-audio') as HTMLInputElement;
    audioInput.addEventListener('input', (e: any) => { data.audioUrl = e.target.value; });
  }

  private renderMatchForm(parent: HTMLDivElement, data: any): void {
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

    this.renderExplanationInput(parent, data);
  }

  private renderCrosswordForm(parent: HTMLDivElement, data: any): void {
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
      data.words.forEach((w: any, idx: number) => {
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
          if (data.words.length > 1) {
            data.words.splice(idx, 1);
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
      data.words.push({ word: '', clue: '' }); // Simplified payload for auto-gen
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
        const result = CrosswordGenerator.generate(data.words);
        data.gridSize = result.gridSize;

        // We overwrite data.words with the fully calculated placed words array
        // It now contains row, col, and direction natively.
        // But we must preserve unplaced words in the UI so the admin can fix them.
        data.words = [...result.words, ...result.unplaced];

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

    this.renderExplanationInput(parent, data);
  }

  private renderWordArrangeForm(parent: HTMLDivElement, data: any): void {
    const qGroup = document.createElement('div');
    qGroup.classList.add('activity-form-group');
    qGroup.innerHTML = `
      <label class="activity-editor-label">Question Text</label>
      <input type="text" class="activity-input-text word-arrange-question" value="${data.question || 'Arrange the words to form a correct sentence:'}" placeholder="E.g., Arrange the words to form a correct sentence:">
    `;
    parent.appendChild(qGroup);

    const qInput = qGroup.querySelector('.word-arrange-question') as HTMLInputElement;
    qInput.addEventListener('input', (e: any) => { data.question = e.target.value; });

    const txtGroup = document.createElement('div');
    txtGroup.classList.add('activity-form-group');
    txtGroup.innerHTML = `
      <label class="activity-editor-label">Correct Sentence (Words separated by space or '/')</label>
      <input type="text" class="activity-input-text word-arrange-text" value="${data.text || ''}" placeholder="E.g., he is playing OR he/is/playing">
      <small class="activity-helper-text">
        Enter the words in correct order. You can separate them by spaces or slashes.
      </small>
    `;
    parent.appendChild(txtGroup);

    const txtInput = txtGroup.querySelector('.word-arrange-text') as HTMLInputElement;
    txtInput.addEventListener('input', (e: any) => { data.text = e.target.value; });

    this.renderExplanationInput(parent, data);
  }

  private renderExplanationInput(parent: HTMLDivElement, data: any): void {
    const group = document.createElement('div');
    group.classList.add('activity-form-group');
    group.innerHTML = `
      <label class="activity-editor-label">Incorrect Explanation Feedback</label>
      <textarea class="activity-textarea activity-explanation" rows="2" placeholder="Explain the rationale behind the correct choice...">${data.explanation || ''}</textarea>
    `;
    parent.appendChild(group);

    const explanationTextarea = group.querySelector('.activity-explanation') as HTMLTextAreaElement;
    explanationTextarea.addEventListener('input', (e: any) => { data.explanation = e.target.value; });
  }

  private renderSpeakingForm(parent: HTMLDivElement, data: any): void {
    const qGroup = document.createElement('div');
    qGroup.classList.add('activity-form-group');
    qGroup.innerHTML = `
      <label class="activity-editor-label">Question Instructions</label>
      <input type="text" class="activity-input-text speaking-question" value="${data.question || 'Listen and repeat the sentence:'}" placeholder="Instructions for student">
    `;
    parent.appendChild(qGroup);

    const qInput = qGroup.querySelector('.speaking-question') as HTMLInputElement;
    qInput.addEventListener('input', (e: any) => { data.question = e.target.value; });

    const txtGroup = document.createElement('div');
    txtGroup.classList.add('activity-form-group');
    txtGroup.innerHTML = `
      <label class="activity-editor-label">Sentence / Target Text to Speak</label>
      <input type="text" class="activity-input-text speaking-target" value="${data.targetText || ''}" placeholder="E.g. She sells seashells by the seashore.">
    `;
    parent.appendChild(txtGroup);

    const targetInput = txtGroup.querySelector('.speaking-target') as HTMLInputElement;
    targetInput.addEventListener('input', (e: any) => {
      data.targetText = e.target.value;
      data.text = e.target.value;
    });

    const imgGroup = document.createElement('div');
    imgGroup.classList.add('activity-form-group');
    imgGroup.innerHTML = `
      <label class="activity-editor-label">Image URL / Picture Description (Optional)</label>
      <input type="text" class="activity-input-text speaking-image" value="${data.imageUrl || ''}" placeholder="E.g. https://example.com/images/landscape.jpg">
    `;
    parent.appendChild(imgGroup);

    const imgInput = imgGroup.querySelector('.speaking-image') as HTMLInputElement;
    imgInput.addEventListener('input', (e: any) => { data.imageUrl = e.target.value; });

    this.renderExplanationInput(parent, data);
  }

  private renderRolePlayForm(parent: HTMLDivElement, data: any): void {
    const qGroup = document.createElement('div');
    qGroup.classList.add('activity-form-group');
    qGroup.innerHTML = `
      <label class="activity-editor-label">Question Instructions</label>
      <input type="text" class="activity-input-text rp-question" value="${data.question || 'Complete the following role play conversation:'}" placeholder="Instructions for student">
    `;
    parent.appendChild(qGroup);

    const qInput = qGroup.querySelector('.rp-question') as HTMLInputElement;
    qInput.addEventListener('input', (e: any) => { data.question = e.target.value; });

    const dialogueGroup = document.createElement('div');
    dialogueGroup.classList.add('activity-form-group');

    const label = document.createElement('label');
    label.classList.add('activity-editor-label');
    label.textContent = 'Dialogue Lines';
    dialogueGroup.appendChild(label);

    const rowsContainer = document.createElement('div');
    rowsContainer.classList.add('rp-rows-container');

    const renderRPRows = () => {
      rowsContainer.innerHTML = '';
      data.dialogue.forEach((line: any, idx: number) => {
        const row = document.createElement('div');
        row.style.background = '#f8fafc';
        row.style.border = '1px solid #e2e8f0';
        row.style.borderRadius = '0.5rem';
        row.style.padding = '0.75rem';
        row.style.marginBottom = '0.5rem';

        row.innerHTML = `
          <div style="display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.5rem;">
            <select class="activity-editor-select rp-role" style="width: 110px; margin-bottom: 0; padding: 0.4rem;">
              <option value="system" ${line.role === 'system' ? 'selected' : ''}>Interviewer</option>
              <option value="student" ${line.role === 'student' ? 'selected' : ''}>Student</option>
            </select>
            <input type="text" class="activity-input-text rp-name" placeholder="Name" value="${line.name || ''}" style="width: 100px; margin-bottom: 0;">
            <input type="text" class="activity-input-text rp-text" placeholder="Line content / Target text to say" value="${line.text || ''}" style="flex: 1; margin-bottom: 0;">
            <button type="button" class="activity-btn activity-btn-danger rp-del" style="padding: 0.4rem 0.6rem; margin-bottom: 0;">&times;</button>
          </div>
        `;

        const roleSelect = row.querySelector('.rp-role') as HTMLSelectElement;
        const nameInput = row.querySelector('.rp-name') as HTMLInputElement;
        const textInput = row.querySelector('.rp-text') as HTMLInputElement;
        const delBtn = row.querySelector('.rp-del') as HTMLButtonElement;

        roleSelect.addEventListener('change', (e: any) => { line.role = e.target.value; });
        nameInput.addEventListener('input', (e: any) => { line.name = e.target.value; });
        textInput.addEventListener('input', (e: any) => { line.text = e.target.value; });
        delBtn.addEventListener('click', () => {
          if (data.dialogue.length > 1) {
            data.dialogue.splice(idx, 1);
            renderRPRows();
          }
        });

        rowsContainer.appendChild(row);
      });
    };

    renderRPRows();
    dialogueGroup.appendChild(rowsContainer);

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.classList.add('activity-btn', 'activity-btn-primary', 'mt-1');
    addBtn.innerHTML = `+ Add Line`;
    addBtn.addEventListener('click', () => {
      const lastLine = data.dialogue[data.dialogue.length - 1];
      const nextRole = lastLine?.role === 'system' ? 'student' : 'system';
      const nextName = nextRole === 'system' ? 'Interviewer' : 'Student';
      data.dialogue.push({ role: nextRole, name: nextName, text: '' });
      renderRPRows();
    });
    dialogueGroup.appendChild(addBtn);

    parent.appendChild(dialogueGroup);
    this.renderExplanationInput(parent, data);
  }

  private renderSequencingForm(parent: HTMLDivElement, data: any): void {
    const qGroup = document.createElement('div');
    qGroup.classList.add('activity-form-group');
    qGroup.innerHTML = `
      <label class="activity-editor-label">Question Instructions</label>
      <input type="text" class="activity-input-text seq-question" value="${data.question || 'Arrange the events in correct chronological order:'}" placeholder="Instructions for student">
    `;
    parent.appendChild(qGroup);

    const qInput = qGroup.querySelector('.seq-question') as HTMLInputElement;
    qInput.addEventListener('input', (e: any) => { data.question = e.target.value; });

    const eventsGroup = document.createElement('div');
    eventsGroup.classList.add('activity-form-group');

    const label = document.createElement('label');
    label.classList.add('activity-editor-label');
    label.textContent = 'Events in Correct Chronological Order';
    eventsGroup.appendChild(label);

    const rowsContainer = document.createElement('div');
    rowsContainer.classList.add('seq-rows-container');

    const renderSeqRows = () => {
      rowsContainer.innerHTML = '';
      data.events.forEach((evt: string, idx: number) => {
        const row = document.createElement('div');
        row.classList.add('activity-row');
        row.innerHTML = `
          <span style="font-weight: bold; color: #475569; width: 25px;">${idx + 1}.</span>
          <input type="text" class="activity-input-text seq-text" value="${evt || ''}" placeholder="Event summary..." style="flex: 1; margin-bottom: 0;">
          <button type="button" class="activity-btn activity-btn-danger seq-del" style="margin-bottom: 0;">&times; Remove</button>
        `;

        const txtInput = row.querySelector('.seq-text') as HTMLInputElement;
        const delBtn = row.querySelector('.seq-del') as HTMLButtonElement;

        txtInput.addEventListener('input', (e: any) => { data.events[idx] = e.target.value; });
        delBtn.addEventListener('click', () => {
          if (data.events.length > 1) {
            data.events.splice(idx, 1);
            renderSeqRows();
          }
        });

        rowsContainer.appendChild(row);
      });
    };

    renderSeqRows();
    eventsGroup.appendChild(rowsContainer);

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.classList.add('activity-btn', 'activity-btn-primary', 'mt-1');
    addBtn.innerHTML = `+ Add Event`;
    addBtn.addEventListener('click', () => {
      data.events.push('');
      renderSeqRows();
    });
    eventsGroup.appendChild(addBtn);

    parent.appendChild(eventsGroup);
    this.renderExplanationInput(parent, data);
  }

  private renderPartsOfSpeechForm(parent: HTMLDivElement, data: any): void {
    const qGroup = document.createElement('div');
    qGroup.classList.add('activity-form-group');
    qGroup.innerHTML = `
      <label class="activity-editor-label">Question Instructions</label>
      <input type="text" class="activity-input-text pos-question" value="${data.question || 'Identify the parts of speech for the highlighted words:'}" placeholder="Instructions for student">
    `;
    parent.appendChild(qGroup);

    const qInput = qGroup.querySelector('.pos-question') as HTMLInputElement;
    qInput.addEventListener('input', (e: any) => { data.question = e.target.value; });

    const sentenceGroup = document.createElement('div');
    sentenceGroup.classList.add('activity-form-group');
    sentenceGroup.innerHTML = `
      <label class="activity-editor-label">Full Sentence</label>
      <input type="text" class="activity-input-text pos-text" value="${data.text || ''}" placeholder="E.g. The dog ran very fast.">
    `;
    parent.appendChild(sentenceGroup);

    const txtInput = sentenceGroup.querySelector('.pos-text') as HTMLInputElement;
    txtInput.addEventListener('input', (e: any) => { data.text = e.target.value; });

    const partsGroup = document.createElement('div');
    partsGroup.classList.add('activity-form-group');

    const label = document.createElement('label');
    label.classList.add('activity-editor-label');
    label.textContent = 'Word Tags Mapping';
    partsGroup.appendChild(label);

    const rowsContainer = document.createElement('div');
    rowsContainer.classList.add('pos-rows-container');

    const renderPOSRows = () => {
      rowsContainer.innerHTML = '';
      data.parts.forEach((p: any, idx: number) => {
        const row = document.createElement('div');
        row.classList.add('activity-row');
        row.innerHTML = `
          <input type="text" class="activity-input-text pos-word" placeholder="Word (e.g. dog)" value="${p.word || ''}" style="flex: 1; margin-bottom: 0;">
          <select class="activity-editor-select pos-tag" style="flex: 1; margin-bottom: 0; padding: 0.5rem;">
            <option value="Noun" ${p.tag === 'Noun' ? 'selected' : ''}>Noun</option>
            <option value="Pronoun" ${p.tag === 'Pronoun' ? 'selected' : ''}>Pronoun</option>
            <option value="Verb" ${p.tag === 'Verb' ? 'selected' : ''}>Verb</option>
            <option value="Be verb" ${p.tag === 'Be verb' ? 'selected' : ''}>Be verb</option>
            <option value="Main verb" ${p.tag === 'Main verb' ? 'selected' : ''}>Main verb</option>
            <option value="Adjective" ${p.tag === 'Adjective' ? 'selected' : ''}>Adjective</option>
            <option value="Adverb" ${p.tag === 'Adverb' ? 'selected' : ''}>Adverb</option>
            <option value="Preposition" ${p.tag === 'Preposition' ? 'selected' : ''}>Preposition</option>
            <option value="Conjunction" ${p.tag === 'Conjunction' ? 'selected' : ''}>Conjunction</option>
            <option value="Article" ${p.tag === 'Article' ? 'selected' : ''}>Article</option>
          </select>
          <button type="button" class="activity-btn activity-btn-danger pos-del" style="margin-bottom: 0;">&times;</button>
        `;

        const wordInput = row.querySelector('.pos-word') as HTMLInputElement;
        const tagSelect = row.querySelector('.pos-tag') as HTMLSelectElement;
        const delBtn = row.querySelector('.pos-del') as HTMLButtonElement;

        wordInput.addEventListener('input', (e: any) => { p.word = e.target.value; });
        tagSelect.addEventListener('change', (e: any) => { p.tag = e.target.value; });
        delBtn.addEventListener('click', () => {
          if (data.parts.length > 1) {
            data.parts.splice(idx, 1);
            renderPOSRows();
          }
        });

        rowsContainer.appendChild(row);
      });
    };

    renderPOSRows();
    partsGroup.appendChild(rowsContainer);

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.classList.add('activity-btn', 'activity-btn-primary', 'mt-1');
    addBtn.innerHTML = `+ Add Tag`;
    addBtn.addEventListener('click', () => {
      data.parts.push({ word: '', tag: 'Noun' });
      renderPOSRows();
    });
    partsGroup.appendChild(addBtn);

    parent.appendChild(partsGroup);
    this.renderExplanationInput(parent, data);
  }

  private renderMindMapForm(parent: HTMLDivElement, data: any): void {
    const qGroup = document.createElement('div');
    qGroup.classList.add('activity-form-group');
    qGroup.innerHTML = `
      <label class="activity-editor-label">Question Instructions</label>
      <input type="text" class="activity-input-text mm-question" value="${data.question || 'Complete the mind map by filling in the details:'}" placeholder="Instructions for student">
    `;
    parent.appendChild(qGroup);

    const qInput = qGroup.querySelector('.mm-question') as HTMLInputElement;
    qInput.addEventListener('input', (e: any) => { data.question = e.target.value; });

    const nodesGroup = document.createElement('div');
    nodesGroup.classList.add('activity-form-group');

    const label = document.createElement('label');
    label.classList.add('activity-editor-label');
    label.textContent = 'Mind Map Structure Nodes';
    nodesGroup.appendChild(label);

    const rowsContainer = document.createElement('div');
    rowsContainer.classList.add('mm-rows-container');

    const renderMMRows = () => {
      rowsContainer.innerHTML = '';
      data.nodes.forEach((n: any, idx: number) => {
        const row = document.createElement('div');
        row.style.background = '#f8fafc';
        row.style.border = '1px solid #e2e8f0';
        row.style.borderRadius = '0.5rem';
        row.style.padding = '0.75rem';
        row.style.marginBottom = '0.5rem';

        row.innerHTML = `
          <div style="display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.5rem;">
            <input type="text" class="activity-input-text mm-node-id" placeholder="Node ID" value="${n.id || ''}" style="width: 80px; margin-bottom: 0;" disabled>
            <input type="text" class="activity-input-text mm-node-parent" placeholder="Parent ID" value="${n.parentId || ''}" style="width: 80px; margin-bottom: 0;">
            <input type="text" class="activity-input-text mm-node-label" placeholder="Pre-filled Label" value="${n.label || ''}" style="flex: 1; margin-bottom: 0;">
            <label style="display: flex; align-items: center; gap: 0.25rem; font-size: 0.8rem; font-weight: bold; margin-bottom: 0; white-space: nowrap;">
              <input type="checkbox" class="mm-node-placeholder" ${n.isPlaceholder ? 'checked' : ''}>
              Blank Node
            </label>
            <button type="button" class="activity-btn activity-btn-danger mm-del" style="padding: 0.45rem 0.6rem; margin-bottom: 0;">&times;</button>
          </div>
          <div class="mm-correct-val-container" style="display: ${n.isPlaceholder ? 'block' : 'none'};">
            <input type="text" class="activity-input-text mm-node-correct" placeholder="Expected Correct Answer" value="${n.correctValue || ''}" style="margin-bottom: 0;">
          </div>
        `;

        const parentInput = row.querySelector('.mm-node-parent') as HTMLInputElement;
        const labelInput = row.querySelector('.mm-node-label') as HTMLInputElement;
        const placeCheckbox = row.querySelector('.mm-node-placeholder') as HTMLInputElement;
        const correctInput = row.querySelector('.mm-node-correct') as HTMLInputElement;
        const correctContainer = row.querySelector('.mm-correct-val-container') as HTMLDivElement;
        const delBtn = row.querySelector('.mm-del') as HTMLButtonElement;

        parentInput.addEventListener('input', (e: any) => { n.parentId = e.target.value; });
        labelInput.addEventListener('input', (e: any) => { n.label = e.target.value; });
        placeCheckbox.addEventListener('change', (e: any) => {
          n.isPlaceholder = e.target.checked;
          correctContainer.style.display = n.isPlaceholder ? 'block' : 'none';
        });
        correctInput.addEventListener('input', (e: any) => { n.correctValue = e.target.value; });
        delBtn.addEventListener('click', () => {
          if (data.nodes.length > 1) {
            data.nodes.splice(idx, 1);
            renderMMRows();
          }
        });

        rowsContainer.appendChild(row);
      });
    };

    renderMMRows();
    nodesGroup.appendChild(rowsContainer);

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.classList.add('activity-btn', 'activity-btn-primary', 'mt-1');
    addBtn.innerHTML = `+ Add Node`;
    addBtn.addEventListener('click', () => {
      const newId = `node_${Date.now().toString().slice(-4)}`;
      data.nodes.push({ id: newId, parentId: 'root', label: '', isPlaceholder: true, correctValue: '' });
      renderMMRows();
    });
    nodesGroup.appendChild(addBtn);

    parent.appendChild(nodesGroup);
    this.renderExplanationInput(parent, data);
  }

  private renderWritingForm(parent: HTMLDivElement, data: any): void {
    const qGroup = document.createElement('div');
    qGroup.classList.add('activity-form-group');
    qGroup.innerHTML = `
      <label class="activity-editor-label">Question Instructions</label>
      <input type="text" class="activity-input-text writing-question" value="${data.question || 'Write a short story about the following prompt:'}" placeholder="Instructions for student">
    `;
    parent.appendChild(qGroup);

    const qInput = qGroup.querySelector('.writing-question') as HTMLInputElement;
    qInput.addEventListener('input', (e: any) => { data.question = e.target.value; });

    const promptGroup = document.createElement('div');
    promptGroup.classList.add('activity-form-group');
    promptGroup.innerHTML = `
      <label class="activity-editor-label">Writing Prompt / Passage / Hints (Separate hints by newlines)</label>
      <textarea class="activity-textarea writing-text" rows="3" placeholder="Hints or details to display...">${data.text || ''}</textarea>
    `;
    parent.appendChild(promptGroup);

    const promptTextarea = promptGroup.querySelector('.writing-text') as HTMLTextAreaElement;
    promptTextarea.addEventListener('input', (e: any) => { data.text = e.target.value; });

    const starterGroup = document.createElement('div');
    starterGroup.classList.add('activity-form-group');
    starterGroup.innerHTML = `
      <label class="activity-editor-label">Starter Sentence (Optional)</label>
      <input type="text" class="activity-input-text writing-starter" value="${data.starterText || ''}" placeholder="E.g. Once upon a time...">
    `;
    parent.appendChild(starterGroup);

    const starterInput = starterGroup.querySelector('.writing-starter') as HTMLInputElement;
    starterInput.addEventListener('input', (e: any) => { data.starterText = e.target.value; });

    const limitGroup = document.createElement('div');
    limitGroup.classList.add('activity-form-group');
    limitGroup.style.display = 'flex';
    limitGroup.style.gap = '1rem';
    limitGroup.innerHTML = `
      <div style="flex: 1;">
        <label class="activity-editor-label">Min Word Limit</label>
        <input type="number" class="activity-input-text writing-min-words" value="${data.minWords || 1}">
      </div>
      <div style="flex: 1;">
        <label class="activity-editor-label">Max Word Limit</label>
        <input type="number" class="activity-input-text writing-max-words" value="${data.maxWords || 1000}">
      </div>
    `;
    parent.appendChild(limitGroup);

    const minInput = limitGroup.querySelector('.writing-min-words') as HTMLInputElement;
    const maxInput = limitGroup.querySelector('.writing-max-words') as HTMLInputElement;
    minInput.addEventListener('input', (e: any) => { data.minWords = parseInt(e.target.value) || 1; });
    maxInput.addEventListener('input', (e: any) => { data.maxWords = parseInt(e.target.value) || 1000; });

    const modelGroup = document.createElement('div');
    modelGroup.classList.add('activity-form-group');
    modelGroup.innerHTML = `
      <label class="activity-editor-label">Model Reference Answer / Example Response</label>
      <textarea class="activity-textarea writing-model" rows="3" placeholder="Display this response after the student submits...">${data.modelAnswer || ''}</textarea>
    `;
    parent.appendChild(modelGroup);

    const modelTextarea = modelGroup.querySelector('.writing-model') as HTMLTextAreaElement;
    modelTextarea.addEventListener('input', (e: any) => { data.modelAnswer = e.target.value; });

    this.renderExplanationInput(parent, data);
  }

  save(blockContent: HTMLElement): any {
    const type = this.data.type;
    const savedData: any = {
      type,
      explanation: this.data.explanation || ''
    };

    if (type === 'mcq') {
      savedData.question = this.data.question || '';
      savedData.audioUrl = this.data.audioUrl || '';
      savedData.options = (this.data.options || []).map((opt: any) => ({
        text: opt.text || '',
        isCorrect: !!opt.isCorrect
      }));
    } else if (type === 'fill_blanks') {
      savedData.text = this.data.text || '';
      savedData.imageUrl = this.data.imageUrl || '';
      savedData.audioUrl = this.data.audioUrl || '';
      savedData.additional_data = {
        imageUrl: this.data.imageUrl || ''
      };
    } else if (type === 'word_arrange') {
      savedData.question = this.data.question || '';
      savedData.text = this.data.text || '';
    } else if (type === 'flashcard') {
      savedData.front = this.data.front || '';
      savedData.back = this.data.back || '';
      savedData.audioUrl = this.data.audioUrl || '';
      // Exclude explanation for flashcard
      delete savedData.explanation;
    } else if (type === 'match') {
      savedData.theme = this.data.theme || 'standard';
      savedData.allowDragDrop = !!this.data.allowDragDrop;
      savedData.allowClickMatch = !!this.data.allowClickMatch;
      savedData.enableAudio = !!this.data.enableAudio;
      savedData.pairs = (this.data.pairs || []).map((p: any) => ({
        left: p.left || '',
        right: p.right || '',
        rightImage: p.rightImage || ''
      }));
    } else if (type === 'crossword') {
      let finalWords = this.data.words || [];
      let finalSize = this.data.gridSize;

      // Check if they forgot to generate
      const needsGeneration = finalWords.some((w: any) => !w.row || !w.direction);
      if (needsGeneration) {
        try {
          const result = CrosswordGenerator.generate(finalWords);
          finalWords = result.words;
          finalSize = result.gridSize;
        } catch (e) { }
      }

      // Filter out any unplaced words
      const successfullyPlaced = finalWords.filter((w: any) => w.row && w.col && w.direction);

      savedData.gridSize = finalSize || 10;
      savedData.words = successfullyPlaced.map((w: any) => ({
        word: w.word || '',
        clue: w.clue || '',
        row: w.row,
        col: w.col,
        direction: w.direction
      }));
    } else if (type === 'speaking') {
      savedData.question = this.data.question || '';
      savedData.text = this.data.text || this.data.targetText || '';
      savedData.media_url = this.data.imageUrl || '';
    } else if (type === 'role_play') {
      savedData.question = this.data.question || '';
      savedData.dialogue = (this.data.dialogue || []).map((line: any) => ({
        role: line.role || 'system',
        name: line.name || '',
        text: line.text || ''
      }));
    } else if (type === 'sequencing') {
      savedData.question = this.data.question || '';
      savedData.events = (this.data.events || []).filter((e: string) => e.trim().length > 0);
    } else if (type === 'parts_of_speech') {
      savedData.question = this.data.question || '';
      savedData.text = this.data.text || '';
      savedData.parts = (this.data.parts || []).map((p: any) => ({
        word: p.word || '',
        tag: p.tag || 'Noun'
      }));
    } else if (type === 'mind_map') {
      savedData.question = this.data.question || '';
      savedData.nodes = (this.data.nodes || []).map((n: any) => ({
        id: n.id || '',
        parentId: n.parentId || '',
        label: n.label || '',
        isPlaceholder: !!n.isPlaceholder,
        correctValue: n.correctValue || ''
      }));
    } else if (type === 'writing') {
      savedData.question = this.data.question || '';
      savedData.text = this.data.text || '';
      savedData.starterText = this.data.starterText || '';
      savedData.minWords = parseInt(this.data.minWords) || 1;
      savedData.maxWords = parseInt(this.data.maxWords) || 1000;
      savedData.modelAnswer = this.data.modelAnswer || '';
    }

    return savedData;
  }
}