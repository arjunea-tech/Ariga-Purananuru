import { Component, OnInit, inject, signal, HostListener, computed } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';
import { ChapterService, ChapterData } from '../../services/chapter';
import { LevelService, LevelData } from '../../services/level';
import { LevelChapterService } from '../../services/level-chapter';
import { NotificationService } from '../../services/notification.service';
import EditorJS from '@editorjs/editorjs';
import { CustomList as List } from '../../editor-plugins/custom-list';
import Table from '@editorjs/table';

import {
  McvInputField,
  McvToggleField
} from 'mcv-ui-toolkit';

@Component({
  selector: 'app-chapter',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    McvInputField,
    McvToggleField,
    TranslateModule
],
  templateUrl: './chapter.html',
  styleUrls: ['./chapter.css'],
})
export class Chapter implements OnInit {
  private fb = inject(FormBuilder);
  private chapterService = inject(ChapterService);
  private levelService = inject(LevelService);
  private levelChapterService = inject(LevelChapterService);
  private notificationService = inject(NotificationService);

  chapterForm: FormGroup;
  chapters = signal<ChapterData[]>([]);
  allLevels = signal<LevelData[]>([]);
  selectedLevelIds = signal<number[]>([]);
  isLevelDropdownOpen = signal(false);

  isEditMode = signal(false);
  isFormVisible = signal(false);
  currentChapterId = signal<number | null>(null);
  levelSearchQuery = signal('');

  private descriptionEditor: EditorJS | null = null;

  filteredLevels = computed(() => {
    const query = this.levelSearchQuery().toLowerCase().trim();
    if (!query) return this.allLevels();
    return this.allLevels().filter(l => 
      l.name.toLowerCase().includes(query) || 
      l.code.toLowerCase().includes(query)
    );
  });

  allLevelsSelected = computed(() => {
    const levels = this.allLevels();
    return levels.length > 0 && this.selectedLevelIds().length === levels.length;
  });

  @HostListener('document:click')
  onDocumentClick() {
    this.isLevelDropdownOpen.set(false);
  }

  constructor() {
    this.chapterForm = this.fb.group({
      name: ['', Validators.required],
      code: ['', Validators.required],
      description: [''],
      sort_order: [0],
      is_active: [true],
    });
  }

  ngOnInit(): void {
    this.loadChapters();
    this.loadLevels();
  }

  loadChapters(): void {
    this.chapterService.getAll().subscribe({
      next: (data) => this.chapters.set(data),
      error: () => this.showFeedback('error', 'Failed to load chapters'),
    });
  }

  loadLevels(): void {
    this.levelService.getAll().subscribe({
      next: (data) => this.allLevels.set(data),
      error: () => this.showFeedback('error', 'Failed to load levels'),
    });
  }

  initializeEditorJS(initialData?: any): void {
    if (this.descriptionEditor) {
      this.descriptionEditor.destroy();
      this.descriptionEditor = null;
    }

    setTimeout(() => {
      this.descriptionEditor = new EditorJS({
        holder: 'chapter-description-editor',
        data: initialData || {},
        tools: {
          list: {
            class: List as any,
            inlineToolbar: true,
            config: {
              defaultStyle: 'unordered'
            }
          },
          table: {
            class: Table as any,
            inlineToolbar: true
          }
        },
        placeholder: 'Enter chapter description...'
      });
    }, 100);
  }

  showCreateForm(): void {
    this.resetForm();
    this.isFormVisible.set(true);
    this.initializeEditorJS({});
  }

  generateCode(): void {
    const chaptersList = this.chapters();
    let nextCode = 'CH001';
    if (chaptersList.length > 0) {
      const codes = chaptersList
        .map(c => c.code)
        .filter(code => code && /^CH\d{3}$/.test(code))
        .map(code => parseInt(code.slice(2), 10));
      const max = codes.length ? Math.max(...codes) : 0;
      nextCode = 'CH' + ('' + (max + 1)).padStart(3, '0');
    }
    this.chapterForm.patchValue({ code: nextCode });
  }

  onSubmit(): void {
    if (this.chapterForm.invalid) {
      this.chapterForm.markAllAsTouched();
      this.showFeedback('error', 'Please fill all required fields correctly.');
      return;
    }

    const submitPayload = () => {
      const chapterData: ChapterData = this.chapterForm.value;
      const levelIds = this.selectedLevelIds();

      if (this.isEditMode()) {
        const id = this.currentChapterId();
        if (id) {
          this.chapterService.update(id, chapterData).subscribe({
            next: () => {
              this.syncLevelMappings(id, levelIds);
              this.showFeedback('success', 'Chapter updated successfully');
              this.isFormVisible.set(false);
              this.loadChapters();
              this.resetForm();
            },
            error: (err) => this.showFeedback('error', err.error?.message || 'Failed to update chapter'),
          });
        }
      } else {
        this.chapterService.create(chapterData).subscribe({
          next: (newChapter) => {
            if (newChapter.id) {
              this.syncLevelMappings(newChapter.id, levelIds);
            }
            this.showFeedback('success', 'Chapter created successfully');
            this.isFormVisible.set(false);
            this.loadChapters();
            this.resetForm();
          },
          error: (err) => this.showFeedback('error', err.error?.message || 'Failed to create chapter'),
        });
      }
    };

    if (this.descriptionEditor) {
      this.descriptionEditor.save().then((outputData) => {
        this.chapterForm.patchValue({ description: JSON.stringify(outputData) });
        submitPayload();
      }).catch((error) => {
        console.error('Saving failed: ', error);
        this.showFeedback('error', 'Failed to save description editor content.');
      });
    } else {
      submitPayload();
    }
  }

  syncLevelMappings(chapterId: number, levelIds: number[]): void {
    this.levelChapterService.syncLevels(chapterId, levelIds).subscribe({
      error: () => this.showFeedback('error', 'Failed to sync level mappings'),
    });
  }

  editChapter(chapter: ChapterData): void {
    this.isEditMode.set(true);
    this.currentChapterId.set(chapter.id!);
    this.chapterForm.patchValue({
      name: chapter.name,
      code: chapter.code,
      description: chapter.description,
      sort_order: chapter.sort_order,
      is_active: chapter.is_active,
    });

    let parsedJson: any = {};
    try {
      if (chapter.description && chapter.description.trim().startsWith('{')) {
        parsedJson = JSON.parse(chapter.description);
      } else if (chapter.description) {
        parsedJson = {
          blocks: [{
            type: 'paragraph',
            data: { text: chapter.description }
          }]
        };
      }
    } catch(e) {}

    this.initializeEditorJS(parsedJson);

    // Load mapped levels
    this.levelChapterService.getMappedLevels(chapter.id!).subscribe({
      next: (levels) => {
        this.selectedLevelIds.set(levels.map(l => l.id!));
      }
    });

    this.isFormVisible.set(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  deleteChapter(id: number): void {
    if (confirm('Are you sure you want to delete this chapter?')) {
      this.chapterService.delete(id).subscribe({
        next: () => {
          this.showFeedback('error', 'Chapter deleted successfully');
          this.loadChapters();
        },
        error: () => this.showFeedback('error', 'Failed to delete chapter'),
      });
    }
  }

  resetForm(): void {
    if (this.descriptionEditor) {
      this.descriptionEditor.destroy();
      this.descriptionEditor = null;
    }
    this.chapterForm.reset({ is_active: true, sort_order: 0 });
    this.selectedLevelIds.set([]);
    this.isEditMode.set(false);
    this.currentChapterId.set(null);
  }

  cancelForm(): void {
    this.resetForm();
    this.isFormVisible.set(false);
  }

  toggleLevelDropdown(event: Event): void {
    event.stopPropagation();
    this.isLevelDropdownOpen.update(v => !v);
  }

  isLevelSelected(id: number): boolean {
    return this.selectedLevelIds().includes(id);
  }

  toggleLevelSelection(id: number): void {
    this.selectedLevelIds.update(ids => {
      if (ids.includes(id)) {
        return ids.filter(i => i !== id);
      } else {
        return [...ids, id];
      }
    });
  }

  getSelectedLevelsLabel(): string {
    const count = this.selectedLevelIds().length;
    if (count === 0) return 'Select Levels';
    if (count === 1) {
      const level = this.getLevelById(this.selectedLevelIds()[0]);
      return level ? level.name : '1 level selected';
    }
    return `${count} levels selected`;
  }

  getLevelById(id: number): LevelData | undefined {
    return this.allLevels().find(l => l.id === id);
  }

  onLevelSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.levelSearchQuery.set(target.value);
  }

  toggleAllLevels(): void {
    if (this.allLevelsSelected()) {
      this.selectedLevelIds.set([]);
    } else {
      this.selectedLevelIds.set(this.allLevels().map(l => l.id!));
    }
  }

  private showFeedback(type: 'success' | 'error', text: string): void {
    this.notificationService.show(type, text);
  }
}
