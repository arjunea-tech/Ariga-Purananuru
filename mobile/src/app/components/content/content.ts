import { Component, OnInit, inject, signal, HostListener, computed, Pipe, PipeTransform } from '@angular/core';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';

import { TranslateModule } from '@ngx-translate/core';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Pipe({
  name: 'safeHtml',
  standalone: true
})
export class SafeHtmlPipe implements PipeTransform {
  private sanitizer = inject(DomSanitizer);
  transform(value: any) {
    return this.sanitizer.bypassSecurityTrustHtml(value);
  }
}


import { ContentService, ContentData, Attachment } from '../../services/content';
import { ChapterService, ChapterData } from '../../services/chapter';
import EditorJS from '@editorjs/editorjs';
import ImageTool from '@editorjs/image';
import { ActivityBlock } from '../../editor-plugins/activity-block';
import { environment } from '../../../environments/environment';
import { CustomList as List } from '../../editor-plugins/custom-list';
import Table from '@editorjs/table';
import { ActivityRenderer } from '../activity-engine/activity-renderer/activity-renderer';
import { NotificationService } from '../../services/notification.service';

import {
  McvInputField,
  McvToggleField
} from 'mcv-ui-toolkit';

@Component({
  selector: 'app-content',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    McvInputField,
    McvToggleField,
    TranslateModule,
    SafeHtmlPipe,
    ActivityRenderer
],
  templateUrl: './content.html',
  styleUrls: ['./content.css'],
})
export class Content implements OnInit {
  private fb = inject(FormBuilder);
  private contentService = inject(ContentService);
  private chapterService = inject(ChapterService);
  private notificationService = inject(NotificationService);

  contentForm: FormGroup;
  contents = signal<ContentData[]>([]);
  chapters = signal<ChapterData[]>([]);

  isEditMode = signal(false);
  isFormVisible = signal(false);
  currentContentId = signal<number | null>(null);
  previewContent = signal<ContentData | null>(null);

  private editorjsInstance: EditorJS | null = null;



  chapterSearchQuery = signal('');
  isChapterDropdownOpen = signal(false);
  selectedChapterIds = signal<number[]>([]);

  filteredChapters = computed(() => {
    const query = this.chapterSearchQuery().toLowerCase().trim();
    if (!query) return this.chapters();
    return this.chapters().filter(c =>
      c.name.toLowerCase().includes(query) ||
      c.code.toLowerCase().includes(query)
    );
  });

  allChaptersSelected = computed(() => {
    const chapters = this.chapters();
    return chapters.length > 0 && this.selectedChapterIds().length === chapters.length;
  });

  @HostListener('document:click')
  onDocumentClick() {
    this.isChapterDropdownOpen.set(false);
  }

  // File states
  attachmentsToSave = signal<Attachment[]>([]);
  isUploading = signal(false);

  constructor() {
    this.contentForm = this.fb.group({
      name: ['', Validators.required],
      title: [''],
      sort_order: [0],
      is_active: [true],
      text_content: [''],
      urls: this.fb.array([this.fb.control('')])
    });
  }

  get urlControls() {
    return (this.contentForm.get('urls') as FormArray).controls;
  }

  addUrlField() {
    (this.contentForm.get('urls') as FormArray).push(this.fb.control(''));
  }

  removeUrlField(index: number) {
    const urls = this.contentForm.get('urls') as FormArray;
    if (urls.length > 1) {
      urls.removeAt(index);
    } else {
      urls.at(0).setValue('');
    }
  }

  ngOnInit(): void {
    this.loadContents();
    this.loadChapters();
  }

  loadContents(): void {
    this.contentService.getAll().subscribe({
      next: (data) => this.contents.set(data),
      error: () => this.showFeedback('error', 'Failed to load contents'),
    });
  }

  loadChapters(): void {
    this.chapterService.getAll().subscribe({
      next: (data) => this.chapters.set(data),
      error: () => this.showFeedback('error', 'Failed to load chapters'),
    });
  }



  initializeEditorJS(initialData?: any): void {
    if (this.editorjsInstance) {
      this.editorjsInstance.destroy();
      this.editorjsInstance = null;
    }

    setTimeout(() => {
      this.editorjsInstance = new EditorJS({
        holder: 'editorjs',
        data: initialData || {},
        tools: {
          activity: {
            class: ActivityBlock,
            inlineToolbar: true
          },
          image: {
            class: ImageTool,
            config: {
              endpoints: {
                byFile: environment.apiUrl + '/contents/upload',
              }
            }
          },
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
        placeholder: 'Start writing your lesson content... Press Tab or type "/" for interactive activities!'
      });
    }, 100);
  }

  showCreateForm(): void {
    this.resetForm();
    this.isFormVisible.set(true);
    this.initializeEditorJS({});
  }

  onMultipleFileChange(event: any): void {
    const files = event.target.files as FileList;
    if (files && files.length > 0) {
      this.isUploading.set(true);
      const validFiles: File[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 1048576) {
          this.showFeedback('error', `File ${file.name} is larger than 1 MB and cannot be uploaded.`);
        } else {
          validFiles.push(file);
        }
      }

      if (validFiles.length === 0) {
        this.isUploading.set(false);
        event.target.value = '';
        return;
      }

      const uploadObservables = validFiles.map(file => 
        this.contentService.uploadFile(file).pipe(
          catchError(err => {
            console.error('Upload failed for', file.name, err);
            this.showFeedback('error', `Failed to upload ${file.name}`);
            return of(null);
          })
        )
      );

      forkJoin(uploadObservables).subscribe(results => {
        const successfulUploads = results.filter(res => res !== null) as Attachment[];
        if (successfulUploads.length > 0) {
          this.attachmentsToSave.update(curr => [...curr, ...successfulUploads]);
          this.showFeedback('success', 'Files uploaded successfully. You can now set alias names.');
        }
        this.isUploading.set(false);
      });
    }
    event.target.value = '';
  }

  removeAttachment(index: number): void {
    this.attachmentsToSave.update(curr => {
      const updated = [...curr];
      updated.splice(index, 1);
      return updated;
    });
  }

  viewFile(url: string): void {
    window.open(url, '_blank');
  }

  onSubmit(): void {
    if (this.contentForm.invalid) {
      this.contentForm.markAllAsTouched();
      this.showFeedback('error', 'Please fill all required fields correctly.');
      return;
    }

    if (this.editorjsInstance) {
      this.editorjsInstance.save().then((outputData) => {
        const jsonStr = JSON.stringify(outputData);
        this.contentForm.patchValue({ text_content: jsonStr });
        this.submitPayload();
      }).catch((error) => {
        console.error('Saving failed: ', error);
        this.showFeedback('error', 'Failed to save block editor content.');
      });
    } else {
      this.submitPayload();
    }
  }

  submitPayload(): void {
    const contentData = {
      ...this.contentForm.value,
      attachments: this.attachmentsToSave(),
      chapter_ids: this.selectedChapterIds()
    };

    if (this.isEditMode()) {
      const id = this.currentContentId();
      if (id) {
        this.contentService.update(id, contentData).subscribe({
          next: () => {
            this.showFeedback('success', 'Content updated successfully');
            this.isFormVisible.set(false);
            this.loadContents();
            this.resetForm();
          },
          error: (err) => this.showFeedback('error', err.error?.message || 'Failed to update content'),
        });
      }
    } else {
      this.contentService.create(contentData).subscribe({
        next: () => {
          this.showFeedback('success', 'Content created successfully');
          this.isFormVisible.set(false);
          this.loadContents();
          this.resetForm();
        },
        error: (err) => this.showFeedback('error', err.error?.message || 'Failed to create content'),
      });
    }
  }



  editContent(content: ContentData): void {
    this.isEditMode.set(true);
    this.currentContentId.set(content.id!);
    this.contentForm.patchValue({
      name: content.name,
      title: content.title,
      sort_order: content.sort_order,
      is_active: content.is_active,
      text_content: content.text_content,
    });

    // Detect if content is EditorJS block JSON
    let parsedJson: any = {};
    try {
      if (content.text_content && content.text_content.trim().startsWith('{')) {
        parsedJson = JSON.parse(content.text_content);
      }
    } catch(e) {}

    this.initializeEditorJS(parsedJson);
    
    // Patch URLs
    const urlArray = this.contentForm.get('urls') as FormArray;
    urlArray.clear();
    const urls = content.urls || (content.external_url ? (Array.isArray(content.external_url) ? content.external_url : [content.external_url]) : ['']);
    urls.forEach((url: string) => urlArray.push(this.fb.control(url)));

    // Load existing attachments
    if (content.attachments) {
      this.attachmentsToSave.set([...content.attachments]);
    } else {
      this.attachmentsToSave.set([]);
    }

    this.selectedChapterIds.set((content as any).chapters ? (content as any).chapters.map((c: any) => c.id) : []);
    this.isFormVisible.set(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  deleteContent(id: number): void {
    if (confirm('Are you sure you want to delete this content?')) {
      this.contentService.delete(id).subscribe({
        next: () => {
          this.showFeedback('success', 'Content deleted successfully');
          this.loadContents();
        },
        error: () => this.showFeedback('error', 'Failed to delete content'),
      });
    }
  }

  resetForm(): void {
    if (this.editorjsInstance) {
      this.editorjsInstance.destroy();
      this.editorjsInstance = null;
    }

    this.contentForm.reset({ is_active: true, sort_order: 0 });
    const urlArray = this.contentForm.get('urls') as FormArray;
    urlArray.clear();
    urlArray.push(this.fb.control(''));
    
    this.selectedChapterIds.set([]);
    this.attachmentsToSave.set([]);
    
    this.isEditMode.set(false);
    this.currentContentId.set(null);
  }

  isPreviewJsonContent(text?: string): boolean {
    if (!text) return false;
    const trimmed = text.trim();
    return trimmed.startsWith('{') && trimmed.endsWith('}');
  }

  getParsedPreviewBlocks(text?: string): any[] {
    if (!text) return [];
    try {
      const data = JSON.parse(text);
      return data.blocks || [];
    } catch (e) {
      return [];
    }
  }

  showPreview(content: ContentData): void {
    this.previewContent.set(content);
  }

  closePreview(): void {
    this.previewContent.set(null);
  }


  cancelForm(): void {
    this.resetForm();
    this.isFormVisible.set(false);
  }

  toggleChapterDropdown(event: Event): void {
    event.stopPropagation();
    this.isChapterDropdownOpen.update(v => !v);
  }

  onChapterSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.chapterSearchQuery.set(target.value);
  }

  toggleChapterSelection(id: number): void {
    this.selectedChapterIds.update(ids => {
      if (ids.includes(id)) {
        return ids.filter(i => i !== id);
      } else {
        return [...ids, id];
      }
    });
  }

  toggleAllChapters(): void {
    if (this.allChaptersSelected()) {
      this.selectedChapterIds.set([]);
    } else {
      this.selectedChapterIds.set(this.chapters().map(c => c.id!));
    }
  }

  isChapterSelected(id: number): boolean {
    return this.selectedChapterIds().includes(id);
  }

  getSelectedChaptersLabel(): string {
    const count = this.selectedChapterIds().length;
    if (count === 0) return 'Select Chapters';
    if (count === 1) {
      const chapter = this.getChapterById(this.selectedChapterIds()[0]);
      return chapter ? chapter.name : '1 chapter selected';
    }
    return `${count} chapters selected`;
  }

  getChapterById(id: number): ChapterData | undefined {
    return this.chapters().find(c => c.id === id);
  }

  private showFeedback(type: 'success' | 'error', text: string): void {
    this.notificationService.show(type, text);
  }
}
