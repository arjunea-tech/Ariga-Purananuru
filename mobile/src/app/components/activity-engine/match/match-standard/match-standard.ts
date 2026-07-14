import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ShuffledItem {
  id: string;
  text: string;
  originalIndex: number;
  rightImage?: string;
}

export interface MatchedPair {
  leftId: string;
  rightId: string;
  colorIndex: number;
}

@Component({
  selector: 'app-match-standard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './match-standard.html',
  styleUrls: ['./match-standard.css']
})
export class MatchStandardComponent {
  @Input() leftItems: ShuffledItem[] = [];
  @Input() rightItems: ShuffledItem[] = [];
  @Input() selectedLeftId: string | null = null;
  @Input() selectedRightId: string | null = null;
  @Input() shakeLeftId: string | null = null;
  @Input() shakeRightId: string | null = null;
  @Input() allowDragDrop: boolean = true;
  @Input() enableAudio: boolean = false;
  @Input() matchedPairs: MatchedPair[] = [];

  @Output() leftSelected = new EventEmitter<ShuffledItem>();
  @Output() rightSelected = new EventEmitter<ShuffledItem>();
  @Output() dragStarted = new EventEmitter<{ event: DragEvent; item: ShuffledItem }>();
  @Output() dropped = new EventEmitter<{ event: DragEvent; item: ShuffledItem }>();
  @Output() speakRequested = new EventEmitter<string>();

  isItemMatched(itemId: string): boolean {
    return this.matchedPairs.some(p => p.leftId === itemId || p.rightId === itemId);
  }

  getMatchedColorClass(itemId: string): string {
    const pair = this.matchedPairs.find(p => p.leftId === itemId || p.rightId === itemId);
    if (!pair) return '';
    return `color-pair-${pair.colorIndex}`;
  }

  onDragStart(event: DragEvent, item: ShuffledItem): void {
    this.dragStarted.emit({ event, item });
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onDrop(event: DragEvent, item: ShuffledItem): void {
    this.dropped.emit({ event, item });
  }

  selectLeft(item: ShuffledItem): void {
    this.leftSelected.emit(item);
  }

  selectRight(item: ShuffledItem): void {
    this.rightSelected.emit(item);
  }

  speak(text: string): void {
    this.speakRequested.emit(text);
  }
}
