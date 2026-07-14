import { Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { AssessmentService, AssessmentData } from '../../services/assessment';
import { LevelService, LevelData } from '../../services/level';
import { ChapterService, ChapterData } from '../../services/chapter';
import { NotificationService } from '../../services/notification.service';
import EditorJS from '@editorjs/editorjs';
import { CustomList as List } from '../../editor-plugins/custom-list';
import Table from '@editorjs/table';

import {
  McvInputField,
  McvToggleField
} from 'mcv-ui-toolkit';

@Component({
  selector: 'app-assessment',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    McvInputField,
    McvToggleField,
    TranslateModule
  ],
  templateUrl: './assessment.html',
  styleUrls: ['./assessment.css'],
})
export class Assessment implements OnInit {
  private fb = inject(FormBuilder);
  private assessmentService = inject(AssessmentService);
  private levelService = inject(LevelService);
  private chapterService = inject(ChapterService);
  private notificationService = inject(NotificationService);

  assessmentForm: FormGroup;
  assessments = signal<AssessmentData[]>([]);
  levels = signal<LevelData[]>([]);
  chapters = signal<ChapterData[]>([]);

  isEditMode = signal(false);
  isFormVisible = signal(false);
  currentAssessmentId = signal<number | null>(null);

  private preludeEditor: EditorJS | null = null;
  private questionEditors = new Map<string, EditorJS>();

  constructor() {
    this.assessmentForm = this.fb.group({
      level_id: [null],
      chapter_id: [null],
      title: ['', Validators.required],
      description: [''],
      pass_percentage: [70, [Validators.required, Validators.min(0), Validators.max(100)]],
      is_mandatory: [true],
      duration_minutes: [null],
      allow_restart: [true],
      review_mode: ['after_completion', Validators.required],
      activity_type: ['plain', Validators.required],
      prelude_content: [''],
      is_active: [true],
      questions: this.fb.array([])
    });
  }

  get questions() {
    return this.assessmentForm.get('questions') as FormArray;
  }

  ngOnInit(): void {
    this.loadAssessments();
    this.loadLevels();
    this.loadChapters();
  }

  loadAssessments(): void {
    this.assessmentService.getAll().subscribe({
      next: (data) => this.assessments.set(data),
      error: () => this.showFeedback('error', 'Failed to load assessments'),
    });
  }

  loadLevels(): void {
    this.levelService.getAll().subscribe({
      next: (data) => this.levels.set(data),
      error: () => this.showFeedback('error', 'Failed to load levels'),
    });
  }

  loadChapters(): void {
    this.chapterService.getAll().subscribe({
      next: (data) => this.chapters.set(data),
      error: () => this.showFeedback('error', 'Failed to load chapters'),
    });
  }

  private generateEditorId(): string {
    return 'q_editor_' + Math.random().toString(36).substring(2, 9);
  }

  initializePreludeEditor(initialData?: any): void {
    if (this.preludeEditor) {
      this.preludeEditor.destroy();
      this.preludeEditor = null;
    }
    setTimeout(() => {
      this.preludeEditor = new EditorJS({
        holder: 'prelude-editor',
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
        placeholder: 'Enter prelude content...'
      });
    }, 100);
  }

  initializeQuestionEditor(editorId: string, initialData?: any): void {
    if (this.questionEditors.has(editorId)) {
      const existing = this.questionEditors.get(editorId);
      if (existing) {
        try { existing.destroy(); } catch (e) {}
      }
      this.questionEditors.delete(editorId);
    }
    setTimeout(() => {
      const editor = new EditorJS({
        holder: editorId,
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
        placeholder: 'Enter question text...'
      });
      this.questionEditors.set(editorId, editor);
    }, 100);
  }

  addQuestion() {
    const editorId = this.generateEditorId();
    const questionForm = this.fb.group({
      _editorId: [editorId],
      question_text: ['', Validators.required],
      sort_order: [this.questions.length],
      question_type: ['multiple_choice', Validators.required],
      media_url: [''],
      additional_data: [null],
      options: this.fb.array([
        this.createOption(true),
        this.createOption(false)
      ])
    });

    questionForm.get('question_type')?.valueChanges.subscribe(type => {
      const options = questionForm.get('options') as FormArray;
      if (type && ['fill_in_the_blank', 'audio_type_text'].includes(type) && options.length === 0) {
        options.push(this.createOption(true));
      }
    });

    this.questions.push(questionForm);
    this.initializeQuestionEditor(editorId, {});
  }

  createOption(isCorrect: boolean = false) {
    return this.fb.group({
      option_text: ['', Validators.required],
      is_correct: [isCorrect],
      sort_order: [0]
    });
  }

  getOptions(questionIndex: number) {
    return this.questions.at(questionIndex).get('options') as FormArray;
  }

  addOption(questionIndex: number) {
    this.getOptions(questionIndex).push(this.createOption(false));
  }

  removeOption(questionIndex: number, optionIndex: number) {
    this.getOptions(questionIndex).removeAt(optionIndex);
  }

  removeQuestion(index: number) {
    const questionGroup = this.questions.at(index);
    const editorId = questionGroup.get('_editorId')?.value;
    if (editorId && this.questionEditors.has(editorId)) {
      const editor = this.questionEditors.get(editorId);
      if (editor) {
        try { editor.destroy(); } catch (e) {}
      }
      this.questionEditors.delete(editorId);
    }
    this.questions.removeAt(index);
  }

  setCorrectOption(questionIndex: number, optionIndex: number) {
    const options = this.getOptions(questionIndex);
    options.controls.forEach((control, i) => {
      control.get('is_correct')?.setValue(i === optionIndex);
    });
  }

  showCreateForm(): void {
    this.resetForm();
    this.isFormVisible.set(true);
    this.initializePreludeEditor({});
    this.addQuestion();
  }

  onSubmit(): void {
    const savePromises: Promise<any>[] = [];

    if (this.preludeEditor) {
      const preludePromise = this.preludeEditor.save().then(data => {
        this.assessmentForm.patchValue({ prelude_content: JSON.stringify(data) });
      });
      savePromises.push(preludePromise);
    }

    this.questions.controls.forEach((control) => {
      const editorId = control.get('_editorId')?.value;
      if (editorId && this.questionEditors.has(editorId)) {
        const editor = this.questionEditors.get(editorId);
        if (editor) {
          const qPromise = editor.save().then(data => {
            const hasContent = data.blocks && data.blocks.length > 0;
            control.get('question_text')?.setValue(hasContent ? JSON.stringify(data) : '');
          });
          savePromises.push(qPromise);
        }
      }
    });

    Promise.all(savePromises).then(() => {
      if (this.assessmentForm.invalid) {
        this.assessmentForm.markAllAsTouched();
        this.showFeedback('error', 'Please fill all required fields correctly.');
        return;
      }

      const assessmentData = JSON.parse(JSON.stringify(this.assessmentForm.value));
      if (assessmentData.questions) {
        assessmentData.questions.forEach((q: any) => {
          delete q._editorId;
        });
      }

      if (this.isEditMode()) {
        const id = this.currentAssessmentId();
        if (id) {
          this.assessmentService.update(id, assessmentData).subscribe({
            next: () => {
              this.showFeedback('success', 'Assessment updated successfully');
              this.isFormVisible.set(false);
              this.loadAssessments();
              this.resetForm();
            },
            error: (err) => this.showFeedback('error', err.error?.message || 'Failed to update assessment'),
          });
        }
      } else {
        this.assessmentService.create(assessmentData).subscribe({
          next: () => {
            this.showFeedback('success', 'Assessment created successfully');
            this.isFormVisible.set(false);
            this.loadAssessments();
            this.resetForm();
          },
          error: (err) => this.showFeedback('error', err.error?.message || 'Failed to create assessment'),
        });
      }
    }).catch(error => {
      console.error('Saving editors failed: ', error);
      this.showFeedback('error', 'Failed to save rich text content.');
    });
  }

  editAssessment(assessment: AssessmentData): void {
    this.resetForm();

    this.isEditMode.set(true);
    this.currentAssessmentId.set(assessment.id!);

    this.assessmentForm.patchValue({
      level_id: assessment.level_id,
      chapter_id: assessment.chapter_id,
      title: assessment.title,
      description: assessment.description,
      pass_percentage: assessment.pass_percentage,
      is_mandatory: assessment.is_mandatory,
      duration_minutes: assessment.duration_minutes,
      allow_restart: assessment.allow_restart,
      review_mode: assessment.review_mode,
      activity_type: assessment.activity_type,
      prelude_content: assessment.prelude_content,
      is_active: assessment.is_active,
    });

    let parsedPrelude: any = {};
    try {
      if (assessment.prelude_content && assessment.prelude_content.trim().startsWith('{')) {
        parsedPrelude = JSON.parse(assessment.prelude_content);
      } else if (assessment.prelude_content) {
        parsedPrelude = {
          blocks: [{
            type: 'paragraph',
            data: { text: assessment.prelude_content }
          }]
        };
      }
    } catch(e) {}

    this.initializePreludeEditor(parsedPrelude);

    if (assessment.questions) {
      assessment.questions.forEach(q => {
        const editorId = this.generateEditorId();
        const qGroup = this.fb.group({
          id: [q.id],
          _editorId: [editorId],
          question_text: [q.question_text, Validators.required],
          sort_order: [q.sort_order],
          question_type: [q.question_type || 'multiple_choice', Validators.required],
          media_url: [q.media_url || ''],
          additional_data: [q.additional_data || null],
          options: this.fb.array([])
        });

        const oArray = qGroup.get('options') as FormArray;
        if (q.options) {
          q.options.forEach(o => {
            oArray.push(this.fb.group({
              id: [o.id],
              option_text: [o.option_text, Validators.required],
              is_correct: [o.is_correct],
              sort_order: [o.sort_order]
            }));
          });
        }

        this.questions.push(qGroup);

        let parsedQuestion: any = {};
        try {
          if (q.question_text && q.question_text.trim().startsWith('{')) {
            parsedQuestion = JSON.parse(q.question_text);
          } else if (q.question_text) {
            parsedQuestion = {
              blocks: [{
                type: 'paragraph',
                data: { text: q.question_text }
              }]
            };
          }
        } catch(e) {}

        this.initializeQuestionEditor(editorId, parsedQuestion);
      });
    }

    this.isFormVisible.set(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  deleteAssessment(id: number): void {
    if (confirm('Are you sure you want to delete this assessment?')) {
      this.assessmentService.delete(id).subscribe({
        next: () => {
          this.showFeedback('error', 'Assessment deleted successfully');
          this.loadAssessments();
        },
        error: () => this.showFeedback('error', 'Failed to delete assessment'),
      });
    }
  }

  resetForm(): void {
    if (this.preludeEditor) {
      try { this.preludeEditor.destroy(); } catch(e) {}
      this.preludeEditor = null;
    }
    this.questionEditors.forEach((editor) => {
      try { editor.destroy(); } catch(e) {}
    });
    this.questionEditors.clear();

    this.assessmentForm.reset({
      is_active: true,
      pass_percentage: 70,
      is_mandatory: true,
      allow_restart: true,
      review_mode: 'after_completion',
      activity_type: 'plain'
    });
    while (this.questions.length !== 0) {
      this.questions.removeAt(0);
    }
    this.isEditMode.set(false);
    this.currentAssessmentId.set(null);
  }

  cancelForm(): void {
    this.resetForm();
    this.isFormVisible.set(false);
  }

  private showFeedback(type: 'success' | 'error', text: string): void {
    this.notificationService.show(type, text);
  }
}
