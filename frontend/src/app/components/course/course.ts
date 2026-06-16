import { Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { CourseService, CourseData } from '../../services/course';
import {
  McvInputField,
  McvTextArea,
  McvToggleField
} from 'mcv-ui-toolkit';

@Component({
  selector: 'app-course',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    McvInputField,
    McvTextArea,
    McvToggleField,
    TranslateModule,
    RouterModule
  ],
  templateUrl: './course.html',
  styleUrls: ['./course.css'],
})
export class Course implements OnInit {
  private fb = inject(FormBuilder);
  private courseService = inject(CourseService);

  courseForm: FormGroup;
  courses = signal<CourseData[]>([]);
  isEditMode = signal(false);
  isFormVisible = signal(false);
  currentCourseId = signal<number | null>(null);
  feedbackMessage = signal<{ type: 'success' | 'error', text: string } | null>(null);

  constructor() {
    this.courseForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      is_active: [true],
    });
  }

  ngOnInit(): void {
    this.loadCourses();
  }

  loadCourses(): void {
    this.courseService.getAll().subscribe({
      next: (data) => this.courses.set(data),
      error: () => this.showFeedback('error', 'Failed to load courses'),
    });
  }

  showCreateForm(): void {
    this.resetForm();
    this.isFormVisible.set(true);
  }

  onSubmit(): void {
    if (this.courseForm.invalid) {
      this.courseForm.markAllAsTouched();
      this.showFeedback('error', 'Please fill all required fields correctly.');
      return;
    }

    const courseData: CourseData = this.courseForm.value;

    if (this.isEditMode()) {
      const id = this.currentCourseId();
      if (id) {
        this.courseService.update(id, courseData).subscribe({
          next: () => {
            this.showFeedback('success', 'Course updated successfully');
            this.isFormVisible.set(false);
            this.loadCourses();
          },
          error: (err) => this.showFeedback('error', err.error?.message || 'Failed to update course'),
        });
      }
    } else {
      this.courseService.create(courseData).subscribe({
        next: () => {
          this.showFeedback('success', 'Course created successfully');
          this.isFormVisible.set(false);
          this.loadCourses();
        },
        error: (err) => this.showFeedback('error', err.error?.message || 'Failed to create course'),
      });
    }
  }

  editCourse(course: CourseData): void {
    this.isEditMode.set(true);
    this.currentCourseId.set(course.id!);
    this.courseForm.patchValue({
      name: course.name,
      description: course.description,
      is_active: course.is_active,
    });
    this.isFormVisible.set(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  deleteCourse(id: number): void {
    if (confirm('Are you sure you want to delete this course?')) {
      this.courseService.delete(id).subscribe({
        next: () => {
          this.showFeedback('success', 'Course deleted successfully');
          this.loadCourses();
        },
        error: () => this.showFeedback('error', 'Failed to delete course'),
      });
    }
  }

  resetForm(): void {
    this.courseForm.reset({ is_active: true });
    this.isEditMode.set(false);
    this.currentCourseId.set(null);
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
