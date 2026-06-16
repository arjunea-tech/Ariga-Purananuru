import { Component, OnInit, inject, signal, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { TenantService, TenantData } from '../../services/tenant';
import {
  McvInputField,
  McvPhoneField,
  McvEmailField,
  McvTextArea,
  McvToggleField
} from 'mcv-ui-toolkit';

@Component({
  selector: 'app-tenant',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    McvInputField,
    McvPhoneField,
    McvEmailField,
    McvTextArea,
    McvToggleField,
    TranslateModule
  ],
  templateUrl: './tenant.html',
  styleUrls: ['./tenant.css'],
})
export class Tenant implements OnInit {
  private fb = inject(FormBuilder);
  private tenantService = inject(TenantService);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('phoneField') phoneField?: ElementRef;

  tenantForm: FormGroup;
  tenants = signal<TenantData[]>([]);
  isEditMode = signal(false);
  isFormVisible = signal(false); // Default to table view
  currentTenantId = signal<number | null>(null);
  feedbackMessage = signal<{ type: 'success' | 'error', text: string } | null>(null);

  constructor() {
    this.tenantForm = this.fb.group({
      tenant_code: ['', Validators.required],
      tenant_name: ['', Validators.required],
      contact_person: [''],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      address: [''],
      is_active: [true],
    });
  }

  ngOnInit(): void {
    this.loadTenants();
  }

  loadTenants(): void {
    this.tenantService.getAll().subscribe({
      next: (data) => this.tenants.set(data),
      error: (err) => this.showFeedback('error', 'Failed to load tenants'),
    });
  }

  showCreateForm(): void {
    this.resetForm();
    this.isFormVisible.set(true);
  }

  generateCode(): void {
    const tenantsList = this.tenants();
    let nextCode = 'TC001';
    if (tenantsList.length > 0) {
      const codes = tenantsList
        .map(t => t.tenant_code)
        .filter(code => code && /^TC\d{3}$/.test(code))
        .map(code => parseInt(code.slice(2), 10));
      const max = codes.length ? Math.max(...codes) : 0;
      nextCode = 'TC' + ('' + (max + 1)).padStart(3, '0');
    }
    this.tenantForm.patchValue({ tenant_code: nextCode });
  }

  onSubmit(): void {
    if (this.tenantForm.invalid) {
      this.tenantForm.markAllAsTouched();
      this.showFeedback('error', 'Please fill all required fields correctly.');
      return;
    }

    // Get the actual phone value from the McvPhoneField component
    let phoneValue: any = null;

    // Method 1: Use ViewChild reference to phoneField
    // if (this.phoneField && this.phoneField.nativeElement) {
    //   const inputs = this.phoneField.nativeElement.querySelectorAll('input');
    //   if (inputs.length > 0) {
    //     phoneValue = inputs[inputs.length - 1].value?.trim() || null;
    //   }
    // }

    // Method 2: Direct input with formControlName
    // if (!phoneValue) {
    //   let phoneInput = document.querySelector('[formControlName="phone"]') as HTMLInputElement;
    //   phoneValue = phoneInput?.value?.trim() || null;
    // }

    // Method 3: Look for input inside mcv-phone-field
    if (!phoneValue) {
      const phoneField = document.querySelector('mcv-phone-field');
      if (phoneField) {
        const inputs = phoneField.querySelectorAll('input');
        if (inputs.length > 0) {
          phoneValue = (inputs[inputs.length - 1] as HTMLInputElement).value?.trim() || null;
        }
      }
    }


    let tenantData: TenantData = this.tenantForm.value;


    // Override phone value with actual input value
    if (phoneValue) {
      tenantData.phone = phoneValue;
    }

    if (this.isEditMode()) {
      const id = this.currentTenantId();
      if (id) {
        this.tenantService.update(id, tenantData).subscribe({
          next: () => {
            this.showFeedback('success', 'Tenant updated successfully');
            this.isFormVisible.set(false);
            this.loadTenants();
          },
          error: (err) => this.showFeedback('error', err.error?.message || 'Failed to update tenant'),
        });
      }
    } else {
      this.tenantService.create(tenantData).subscribe({
        next: () => {
          this.showFeedback('success', 'Tenant created successfully');
          this.isFormVisible.set(false);
          this.loadTenants();
        },
        error: (err) => this.showFeedback('error', err.error?.message || 'Failed to create tenant'),
      });
    }
  }

  editTenant(tenant: TenantData): void {
    this.isEditMode.set(true);
    this.currentTenantId.set(tenant.id!);

    // Set all values including phone
    this.tenantForm.patchValue({
      tenant_code: tenant.tenant_code,
      tenant_name: tenant.tenant_name,
      contact_person: tenant.contact_person,
      email: tenant.email,
      phone: tenant.phone,
      address: tenant.address,
      is_active: tenant.is_active,
    });

    // Update validity for all controls
    setTimeout(() => {
      Object.keys(this.tenantForm.controls).forEach(key => {
        const control = this.tenantForm.get(key);
        control?.updateValueAndValidity({ emitEvent: false });
      });

      // Mark form clean after all values are properly set
      this.tenantForm.markAsPristine();
      this.tenantForm.markAsUntouched();

      this.cdr.detectChanges();
    }, 100);

    this.isFormVisible.set(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  deleteTenant(id: number): void {
    if (confirm('Are you sure you want to delete this tenant?')) {
      this.tenantService.delete(id).subscribe({
        next: () => {
          this.showFeedback('success', 'Tenant deleted successfully');
          this.loadTenants();
        },
        error: (err) => this.showFeedback('error', 'Failed to delete tenant'),
      });
    }
  }

  resetForm(): void {
    this.tenantForm.reset({ is_active: true });
    this.tenantForm.markAsPristine();
    this.tenantForm.markAsUntouched();
    this.isEditMode.set(false);
    this.currentTenantId.set(null);
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
