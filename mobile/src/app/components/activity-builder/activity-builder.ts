import { Component, signal, computed, inject, ViewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivityService, Activity } from '../../services/activity.service';
import { NotificationService } from '../../services/notification.service';
import { ActivityBlock } from '../../editor-plugins/activity-block';

interface BlockContent {
  id: string;
  type: 'text' | 'audio' | 'image' | 'video' | 'link';
  content?: string;
  url?: string;
}

interface ContainerNode {
  id: string;
  type: 'container';
  display: string;
  contents: BlockContent[];
}

@Component({
  selector: 'app-activity-builder',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './activity-builder.html',
  styleUrls: ['./activity-builder.css']
})
export class ActivityBuilder {
  private activityService = inject(ActivityService);
  private notificationService = inject(NotificationService);

  @ViewChild('standardFormContainer', { static: false }) standardFormContainer!: ElementRef;

  // View State
  isFormVisible = signal(false);
  isSaving = signal(false);
  isPreviewMode = signal(false);

  // Data State
  savedActivities = signal<Activity[]>([]);

  // Current Activity State
  activityId = signal<number | null>(null);
  activityTitle = signal<string>('');
  activityType = signal<string>('mcq');

  // Custom Builder State
  nodes = signal<ContainerNode[]>([]);
  selectedContainerId = signal<string | null>(null);

  // Standard Engine State
  engineData: any = {};
  activityBlockInstance: any = null;
  
  mockApi = { 
    styles: { block: '', inlineToolButton: '', input: 'form-control', settingsButton: '' },
    blocks: { getCurrentBlockIndex: () => Math.floor(Math.random() * 1000) }
  };

  constructor() {
    effect(() => {
      const type = this.activityType();
      if (this.isFormVisible() && type !== 'custom') {
        setTimeout(() => this.renderEngineForm(), 0);
      }
    });
  }

  ngOnInit() {
    this.loadActivities();
  }

  loadActivities() {
    this.activityService.getActivities().subscribe({
      next: (activities) => this.savedActivities.set(activities),
      error: (err) => console.error('Failed to load activities', err)
    });
  }

  showCreateForm() {
    this.activityId.set(null);
    this.activityTitle.set('');
    this.activityType.set('mcq');
    this.nodes.set([]);
    this.selectedContainerId.set(null);
    this.engineData = { type: 'mcq' };
    this.activityBlockInstance = null;
    this.isFormVisible.set(true);
  }

  editActivity(activity: Activity) {
    this.activityId.set(activity.id || null);
    this.activityTitle.set(activity.title);
    
    const type = activity.type;
    
    if (type === 'custom') {
      if (activity.data_json && activity.data_json.nodes) {
        this.nodes.set(activity.data_json.nodes);
      } else {
        this.nodes.set([]);
      }
      this.activityType.set('custom');
    } else {
      this.engineData = JSON.parse(JSON.stringify(activity.data_json || {}));
      this.engineData.type = type;
      this.activityType.set(type);
    }
    
    this.isFormVisible.set(true);
  }

  cancelForm() {
    this.isFormVisible.set(false);
  }

  deleteActivity(id: number) {
    if (confirm('Are you sure you want to delete this activity?')) {
      this.activityService.deleteActivity(id).subscribe({
        next: () => {
          this.notificationService.show('success', 'Activity deleted');
          this.loadActivities();
        },
        error: () => this.notificationService.show('error', 'Failed to delete activity')
      });
    }
  }

  renderEngineForm() {
    if (!this.standardFormContainer) return;
    const container = this.standardFormContainer.nativeElement;
    container.innerHTML = '';
    
    const type = this.activityType();
    
    if (this.engineData.type !== type) {
      this.engineData = { type };
    }

    this.activityBlockInstance = new ActivityBlock({
      data: this.engineData,
      api: this.mockApi,
      readOnly: false
    });

    const element = this.activityBlockInstance.render();
    container.appendChild(element);
  }

  saveActivity() {
    if (!this.activityTitle().trim()) {
      this.notificationService.show('error', 'Please enter a title for this activity');
      return;
    }

    let type = this.activityType();
    let data_json: any = {};

    if (type === 'custom') {
      if (this.nodes().length === 0) {
        this.notificationService.show('error', 'Please add at least one container to the custom activity');
        return;
      }
      data_json = { nodes: this.nodes() };
    } else {
      if (this.activityBlockInstance) {
        data_json = this.activityBlockInstance.save();
        type = data_json.type; 
        this.activityType.set(type); 
      } else {
        data_json = this.engineData;
      }
    }

    this.isSaving.set(true);

    const payload = {
      title: this.activityTitle(),
      type: type,
      data_json: data_json
    };

    if (this.activityId()) {
      this.activityService.updateActivity(this.activityId()!, payload).subscribe({
        next: (res) => {
          this.isSaving.set(false);
          this.notificationService.show('success', 'Activity updated successfully!');
          this.loadActivities();
          this.isFormVisible.set(false);
        },
        error: (err) => {
          this.isSaving.set(false);
          this.notificationService.show('error', 'Failed to update activity');
        }
      });
    } else {
      this.activityService.createActivity(payload).subscribe({
        next: (res) => {
          this.isSaving.set(false);
          this.notificationService.show('success', 'Activity saved successfully!');
          this.loadActivities();
          this.isFormVisible.set(false);
        },
        error: (err) => {
          this.isSaving.set(false);
          this.notificationService.show('error', 'Failed to save activity');
        }
      });
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 9);
  }

  addContainer() {
    const newContainer: ContainerNode = {
      id: 'container_' + this.generateId(),
      type: 'container',
      display: 'block',
      contents: []
    };
    this.nodes.update(current => [...current, newContainer]);
    this.selectedContainerId.set(newContainer.id);
  }

  addBlock(type: 'text' | 'audio' | 'image' | 'video' | 'link') {
    const activeId = this.selectedContainerId();
    if (!activeId) {
      alert('Please select or create a container first!');
      return;
    }

    const newBlock: BlockContent = {
      id: 'block_' + this.generateId(),
      type: type,
      content: type === 'text' ? 'Enter text here...' : undefined,
      url: type !== 'text' ? 'assets/placeholder' : undefined
    };

    this.nodes.update(current => {
      return current.map(container => {
        if (container.id === activeId) {
          return { ...container, contents: [...container.contents, newBlock] };
        }
        return container;
      });
    });
  }

  selectContainer(id: string) {
    this.selectedContainerId.set(id);
  }

  removeContainer(id: string, event: Event) {
    event.stopPropagation();
    this.nodes.update(current => current.filter(c => c.id !== id));
    if (this.selectedContainerId() === id) {
      this.selectedContainerId.set(null);
    }
  }

  removeBlock(containerId: string, blockId: string, event: Event) {
    event.stopPropagation();
    this.nodes.update(current => {
      return current.map(container => {
        if (container.id === containerId) {
          return { ...container, contents: container.contents.filter(b => b.id !== blockId) };
        }
        return container;
      });
    });
  }

  togglePreview() {
    this.isPreviewMode.set(!this.isPreviewMode());
    if (this.isPreviewMode()) {
      this.selectedContainerId.set(null);
    }
  }
}
