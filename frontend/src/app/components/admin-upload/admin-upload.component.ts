import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AiAdminService } from '../../services/ai-admin.service';

@Component({
  selector: 'app-admin-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-upload.component.html'
})
export class AdminUploadComponent {
  selectedFile: File | null = null;
  fileContent: string = '';
  loading = false;
  message = '';
  isError = false;
  uploadMode: 'poem' | 'qa' = 'poem';

  constructor(private api: AiAdminService, private cdr: ChangeDetectorRef) { }

  setMode(mode: 'poem' | 'qa') {
    this.uploadMode = mode;
    this.selectedFile = null;
    this.fileContent = '';
    this.message = '';
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
    if (this.selectedFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.fileContent = e.target?.result as string;
      };
      reader.readAsText(this.selectedFile);
    }
  }

  uploadData() {
    if (!this.fileContent) return;

    this.loading = true;
    this.message = '';

    try {
      const jsonData = JSON.parse(this.fileContent);

      const apiCall = this.uploadMode === 'poem'
        ? this.api.uploadDataset(jsonData)
        : this.api.uploadQaDataset(jsonData);

      apiCall.subscribe({
        next: (res) => {
          console.log('Upload success response:', res);
          this.message = res?.message || 'Data uploaded successfully!';
          this.isError = false;
          this.loading = false;
          this.selectedFile = null;
          this.fileContent = '';
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Upload error:', err);
          this.message = err?.error?.message || 'Failed to upload data. Check console for details.';
          this.isError = true;
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
    } catch (e) {
      this.message = 'Invalid JSON file.';
      this.isError = true;
      this.loading = false;
    }
  }
}
