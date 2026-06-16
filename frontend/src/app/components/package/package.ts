import { Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { PackageService, PackageData } from '../../services/package';
import {
  McvInputField,
  McvTextArea,
  McvToggleField
} from 'mcv-ui-toolkit';

@Component({
  selector: 'app-package',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    McvInputField,
    McvTextArea,
    McvToggleField,
    TranslateModule
  ],
  templateUrl: './package.html',
  styleUrls: ['./package.css'],
})
export class Package implements OnInit {
  private fb = inject(FormBuilder);
  private packageService = inject(PackageService);

  packageForm: FormGroup;
  packages = signal<PackageData[]>([]);
  isEditMode = signal(false);
  isFormVisible = signal(false); // Default to table view
  currentPackageId = signal<number | null>(null);
  feedbackMessage = signal<{ type: 'success' | 'error', text: string } | null>(null);

  constructor() {
    this.packageForm = this.fb.group({
      name: ['', Validators.required],
      code: ['', Validators.required],
      description: [''],
      is_active: [true],
    });
  }

  ngOnInit(): void {
    this.loadPackages();
  }

  loadPackages(): void {
    this.packageService.getAll().subscribe({
      next: (data) => this.packages.set(data),
      error: (err) => this.showFeedback('error', 'Failed to load packages'),
    });
  }

  showCreateForm(): void {
    this.resetForm();
    this.isFormVisible.set(true);
  }

  generateCode(): void {
    const packagesList = this.packages();
    let nextCode = 'PK001';
    if (packagesList.length > 0) {
      const codes = packagesList
        .map(p => p.code)
        .filter(code => code && /^PK\d{3}$/.test(code))
        .map(code => parseInt(code.slice(2), 10));
      const max = codes.length ? Math.max(...codes) : 0;
      nextCode = 'PK' + ('' + (max + 1)).padStart(3, '0');
    }
    this.packageForm.patchValue({ code: nextCode });
  }

  onSubmit(): void {
    if (this.packageForm.invalid) {
      this.packageForm.markAllAsTouched();
      this.showFeedback('error', 'Please fill all required fields correctly.');
      return;
    }

    const packageData: PackageData = this.packageForm.value;

    if (this.isEditMode()) {
      const id = this.currentPackageId();
      if (id) {
        this.packageService.update(id, packageData).subscribe({
          next: () => {
            this.showFeedback('success', 'Package updated successfully');
            this.isFormVisible.set(false);
            this.loadPackages();
          },
          error: (err) => this.showFeedback('error', err.error?.message || 'Failed to update package'),
        });
      }
    } else {
      this.packageService.create(packageData).subscribe({
        next: () => {
          this.showFeedback('success', 'Package created successfully');
          this.isFormVisible.set(false);
          this.loadPackages();
        },
        error: (err) => this.showFeedback('error', err.error?.message || 'Failed to create package'),
      });
    }
  }

  editPackage(pkg: PackageData): void {
    this.isEditMode.set(true);
    this.currentPackageId.set(pkg.id!);
    this.packageForm.patchValue({
      name: pkg.name,
      code: pkg.code,
      description: pkg.description,
      is_active: pkg.is_active,
    });
    this.isFormVisible.set(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  deletePackage(id: number): void {
    if (confirm('Are you sure you want to delete this package?')) {
      this.packageService.delete(id).subscribe({
        next: () => {
          this.showFeedback('success', 'Package deleted successfully');
          this.loadPackages();
        },
        error: (err) => this.showFeedback('error', 'Failed to delete package'),
      });
    }
  }

  resetForm(): void {
    this.packageForm.reset({ is_active: true });
    this.isEditMode.set(false);
    this.currentPackageId.set(null);
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
