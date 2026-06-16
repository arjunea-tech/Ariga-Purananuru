import { Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { LearningModeService, LearningModeData } from '../../services/learning-mode';
import {
  McvInputField,
  McvTextArea,
  McvToggleField
} from 'mcv-ui-toolkit';

@Component({
  selector: 'app-learning-mode',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    McvInputField,
    McvTextArea,
    McvToggleField,
    TranslateModule
  ],
  templateUrl: './learning-mode.html',
  styleUrls: ['./learning-mode.css'],
})
export class LearningMode implements OnInit {
  private fb = inject(FormBuilder);
  private learningModeService = inject(LearningModeService);

  learningModeForm: FormGroup;
  learningModes = signal<LearningModeData[]>([]);
  isEditMode = signal(false);
  isFormVisible = signal(false);
  currentLearningModeId = signal<number | null>(null);
  feedbackMessage = signal<{ type: 'success' | 'error', text: string } | null>(null);

  constructor() {
    this.learningModeForm = this.fb.group({
      name: ['', Validators.required],
      code: ['', Validators.required],
      description: [''],
      is_active: [true],
    });

    // Auto-generate UPPERCASE_SNAKE_CASE from name
    this.learningModeForm.get('name')?.valueChanges.subscribe(value => {
      if (!this.isEditMode() && value) {
        const code = value.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
        this.learningModeForm.patchValue({ code }, { emitEvent: false });
      }
    });
  }

  ngOnInit(): void {
    this.loadLearningModes();
  }

  loadLearningModes(): void {
    this.learningModeService.getAll().subscribe({
      next: (data) => this.learningModes.set(data),
      error: (err) => this.showFeedback('error', 'Failed to load learning modes'),
    });
  }

  showCreateForm(): void {
    this.resetForm();
    this.isFormVisible.set(true);
  }

  onSubmit(): void {
    if (this.learningModeForm.invalid) {
      this.learningModeForm.markAllAsTouched();
      this.showFeedback('error', 'Please fill all required fields correctly.');
      return;
    }

    const modeData: LearningModeData = this.learningModeForm.value;

    if (this.isEditMode()) {
      const id = this.currentLearningModeId();
      if (id) {
        this.learningModeService.update(id, modeData).subscribe({
          next: () => {
            this.showFeedback('success', 'Learning mode updated successfully');
            this.isFormVisible.set(false);
            this.loadLearningModes();
          },
          error: (err) => this.showFeedback('error', err.error?.message || 'Failed to update learning mode'),
        });
      }
    } else {
      this.learningModeService.create(modeData).subscribe({
        next: () => {
          this.showFeedback('success', 'Learning mode created successfully');
          this.isFormVisible.set(false);
          this.loadLearningModes();
        },
        error: (err) => this.showFeedback('error', err.error?.message || 'Failed to create learning mode'),
      });
    }
  }

  editLearningMode(mode: LearningModeData): void {
    this.isEditMode.set(true);
    this.currentLearningModeId.set(mode.id!);
    this.learningModeForm.patchValue({
      name: mode.name,
      code: mode.code,
      description: mode.description,
      is_active: mode.is_active,
    });
    this.isFormVisible.set(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  deleteLearningMode(id: number): void {
    if (confirm('Are you sure you want to delete this learning mode?')) {
      this.learningModeService.delete(id).subscribe({
        next: () => {
          this.showFeedback('success', 'Learning mode deleted successfully');
          this.loadLearningModes();
        },
        error: (err) => this.showFeedback('error', 'Failed to delete learning mode'),
      });
    }
  }

  resetForm(): void {
    this.learningModeForm.reset({ is_active: true });
    this.isEditMode.set(false);
    this.currentLearningModeId.set(null);
  }

  cancelForm(): void {
    this.resetForm();
    this.isFormVisible.set(false);
  }

  private showFeedback(type: 'success' | 'error', text: string): void {
    this.feedbackMessage.set({ type, text });
    setTimeout(() => this.feedbackMessage.set(null), 5000);
  }
}
