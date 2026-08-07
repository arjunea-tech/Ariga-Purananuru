import { Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { CourseService, CourseData } from '../../services/course';
import { NotificationService } from '../../services/notification.service';
import { environment } from '../../../environments/environment';
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
  private notificationService = inject(NotificationService);

  courseForm: FormGroup;
  courses = signal<CourseData[]>([]);
  isEditMode = signal(false);
  isFormVisible = signal(false);
  currentCourseId = signal<number | null>(null);
  localPreviewUrl = signal<string | null>(null);
  selectedFileName = signal<string>('');

  constructor() {
    this.courseForm = this.fb.group({
      name: ['', Validators.required],
      price: [500, [Validators.required, Validators.min(0)]],
      original_price: [null, [Validators.min(0)]],
      tags: [''],
      cover_image: [null],
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

    const formValue = this.courseForm.value;
    const courseData: CourseData = {
      ...formValue,
      tags: formValue.tags ? formValue.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t) : []
    };

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
    this.localPreviewUrl.set(null); // Reset local preview
    this.selectedFileName.set('');  // Reset selected filename
    this.courseForm.patchValue({
      name: course.name,
      price: course.price ?? 500,
      original_price: course.original_price,
      tags: course.tags ? course.tags.join(', ') : '',
      cover_image: course.cover_image,
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
          this.showFeedback('error', 'Course deleted successfully');
          this.loadCourses();
        },
        error: () => this.showFeedback('error', 'Failed to delete course'),
      });
    }
  }

  resetForm(): void {
    this.courseForm.reset({ is_active: true, price: 500, tags: '' });
    this.isEditMode.set(false);
    this.currentCourseId.set(null);
    this.localPreviewUrl.set(null); // Reset local preview
    this.selectedFileName.set('');  // Reset selected filename
  }

  cancelForm(): void {
    this.resetForm();
    this.isFormVisible.set(false);
  }

  private showFeedback(type: 'success' | 'error', message: string): void {
    this.notificationService.show(type, message);
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // 2MB size check (2 * 1024 * 1024 bytes)
      const maxLimit = 2 * 1024 * 1024;
      if (file.size > maxLimit) {
        const selectedSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        this.showFeedback('error', `Selected file size (${selectedSizeMB} MB) exceeds the 2 MB limit.`);
        event.target.value = ''; // clear selection
        this.selectedFileName.set('');
        return;
      }

      this.selectedFileName.set(file.name);

      // Read local preview instantly
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.localPreviewUrl.set(e.target.result);
      };
      reader.readAsDataURL(file);

      this.courseService.uploadCover(file).subscribe({
        next: (res) => {
          this.courseForm.patchValue({ cover_image: res.url });
          this.showFeedback('success', 'Image uploaded successfully');
        },
        error: (err) => {
          this.showFeedback('error', 'Image upload failed');
          console.error(err);
        }
      });
    }
  }

  getCoverImageUrl(path: string | null | undefined): string | null {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    const baseUrl = environment.baseUrl || 'http://127.0.0.1:8000';
    return `${baseUrl}/${path.startsWith('/') ? path.substring(1) : path}`;
  }

  getFileName(url: string | null | undefined): string {
    if (!url) return '';
    const parts = url.split('/');
    return parts[parts.length - 1];
  }
}
