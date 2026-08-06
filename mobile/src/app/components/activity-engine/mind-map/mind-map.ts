import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';

export interface MindMapNode {
  id: string;
  label: string; // Pre-filled title or input instruction
  isPlaceholder?: boolean; // If true, student must fill it in
  correctValue?: string; // Correct answer
  parentId?: string; // Links this node to its parent node
}

export interface MindMapData {
  id?: number;
  question?: string;
  nodes: MindMapNode[];
  explanation?: string;
}

interface WorkingNode {
  id: string;
  label: string;
  isPlaceholder: boolean;
  correctValue: string;
  parentId: string | null;
  userValue: string;
}

@Component({
  selector: 'app-activity-mind-map',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './mind-map.html',
  styleUrls: ['./mind-map.css']
})
export class MindMapComponent implements OnInit, OnChanges {
  @Input() activity: MindMapData | null = null;
  @Input() showFeedback: boolean = true;

  @Output() answered = new EventEmitter<{ isCorrect: boolean; answers: any }>();

  nodesList = signal<WorkingNode[]>([]);
  hasSubmitted = signal<boolean>(false);
  isCorrect = signal<boolean>(false);

  // Group nodes by hierarchy
  rootNodes = signal<WorkingNode[]>([]);
  branchNodes = signal<WorkingNode[]>([]);
  leafNodes = signal<WorkingNode[]>([]);

  ngOnInit(): void {
    this.initMap();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['activity']) {
      this.initMap();
    }
  }

  initMap(): void {
    if (!this.activity || !this.activity.nodes) return;

    const working = this.activity.nodes.map(n => ({
      id: n.id,
      label: n.label,
      isPlaceholder: !!n.isPlaceholder,
      correctValue: n.correctValue || '',
      parentId: n.parentId || null,
      userValue: ''
    }));

    this.nodesList.set(working);
    this.hasSubmitted.set(false);
    this.isCorrect.set(false);

    this.organizeHierarchy();
  }

  organizeHierarchy(): void {
    const list = this.nodesList();
    
    // Root nodes: no parent ID
    const roots = list.filter(n => !n.parentId);
    this.rootNodes.set(roots);

    // Branch nodes: parent is a root node
    const branches = list.filter(n => {
      if (!n.parentId) return false;
      return roots.some(r => r.id === n.parentId);
    });
    this.branchNodes.set(branches);

    // Leaf nodes: parent is a branch node
    const leaves = list.filter(n => {
      if (!n.parentId) return false;
      return branches.some(b => b.id === n.parentId);
    });
    this.leafNodes.set(leaves);
  }

  // Get child nodes for a given parent node
  getChildren(parentId: string, type: 'branch' | 'leaf'): WorkingNode[] {
    if (type === 'branch') {
      return this.branchNodes().filter(b => b.parentId === parentId);
    }
    return this.leafNodes().filter(l => l.parentId === parentId);
  }

  isAnyNodeAnswered(): boolean {
    return this.nodesList().some(n => n.isPlaceholder && n.userValue.trim().length > 0);
  }

  isNodeCorrect(nodeId: string): boolean {
    const node = this.nodesList().find(n => n.id === nodeId);
    if (!node) return false;
    if (!node.isPlaceholder) return true;
    return node.userValue.trim().toLowerCase() === node.correctValue.trim().toLowerCase();
  }

  checkAnswers(): void {
    if (this.hasSubmitted()) return;

    const list = this.nodesList();
    const correct = list.every(n => {
      if (!n.isPlaceholder) return true;
      return n.userValue.trim().toLowerCase() === n.correctValue.trim().toLowerCase();
    });

    this.isCorrect.set(correct);
    this.hasSubmitted.set(true);

    const submissionAnswers = list
      .filter(n => n.isPlaceholder)
      .map(n => ({ id: n.id, value: n.userValue }));

    this.answered.emit({
      isCorrect: correct,
      answers: submissionAnswers
    });
  }

  reset(): void {
    this.initMap();
  }
}
