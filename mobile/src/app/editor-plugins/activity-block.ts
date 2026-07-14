/**
 * EditorJS Activity Block Builder Plugin
 * 
 * Provides interactive form builders directly inside the lesson editor to configure low-stakes practices.
 */
import { CrosswordGenerator } from '../services/crossword-generator.service';
import { ACTIVITY_BLOCK_STYLES } from './activity-block/styles';

// Import modular sub-forms
import { renderMCQForm } from './activity-block/forms/mcq';
import { renderBlanksForm } from './activity-block/forms/fill-blanks';
import { renderFlashcardForm } from './activity-block/forms/flashcard';
import { renderMatchForm } from './activity-block/forms/match';
import { renderCrosswordForm } from './activity-block/forms/crossword';
import { renderWordArrangeForm } from './activity-block/forms/word-arrange';
import { renderSpeakingForm } from './activity-block/forms/speaking';
import { renderRolePlayForm } from './activity-block/forms/role-play';
import { renderSequencingForm } from './activity-block/forms/sequencing';
import { renderPartsOfSpeechForm } from './activity-block/forms/parts-of-speech';
import { renderMindMapForm } from './activity-block/forms/mind-map';
import { renderWritingForm } from './activity-block/forms/writing';

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
    // Add CSS styles inline to keep it self-contained
    const styleId = 'editorjs-activity-block-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = ACTIVITY_BLOCK_STYLES;
      document.head.appendChild(style);
    }

    const wrapper = document.createElement('div');
    wrapper.classList.add('editorjs-activity-block');

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
        renderMCQForm(formContainer, tempData, this.api, this.renderExplanationInput);
      } else if (type === 'fill_blanks') {
        renderBlanksForm(formContainer, tempData, this.renderExplanationInput);
      } else if (type === 'flashcard') {
        renderFlashcardForm(formContainer, tempData);
      } else if (type === 'match') {
        renderMatchForm(formContainer, tempData, this.renderExplanationInput);
      } else if (type === 'crossword') {
        renderCrosswordForm(formContainer, tempData, this.renderExplanationInput);
      } else if (type === 'word_arrange') {
        renderWordArrangeForm(formContainer, tempData, this.renderExplanationInput);
      } else if (type === 'speaking') {
        renderSpeakingForm(formContainer, tempData, this.renderExplanationInput);
      } else if (type === 'role_play') {
        renderRolePlayForm(formContainer, tempData, this.renderExplanationInput);
      } else if (type === 'sequencing') {
        renderSequencingForm(formContainer, tempData, this.renderExplanationInput);
      } else if (type === 'parts_of_speech') {
        renderPartsOfSpeechForm(formContainer, tempData, this.renderExplanationInput);
      } else if (type === 'mind_map') {
        renderMindMapForm(formContainer, tempData, this.renderExplanationInput);
      } else if (type === 'writing') {
        renderWritingForm(formContainer, tempData, this.renderExplanationInput);
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