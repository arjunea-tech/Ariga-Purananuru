import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TaggingPart {
  word: string;
  tag: string; // Correct tag, e.g. "Noun", "Verb", etc.
}

export interface PartsOfSpeechData {
  id?: number;
  question?: string;
  text: string; // e.g. "The dog is chasing a mouse"
  parts: TaggingPart[];
  explanation?: string;
}

interface WordChip {
  index: number;
  text: string;
  cleanText: string;
  correctTag: string; // "" if this word doesn't need to be tagged
  selectedTag: string;
}

@Component({
  selector: 'app-activity-parts-of-speech',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './parts-of-speech.html',
  styleUrls: ['./parts-of-speech.css']
})
export class PartsOfSpeechComponent implements OnInit, OnChanges {
  @Input() activity: PartsOfSpeechData | null = null;
  @Input() showFeedback: boolean = true;

  @Output() answered = new EventEmitter<{ isCorrect: boolean; tags: any }>();

  wordChips = signal<WordChip[]>([]);
  selectedWordIndex = signal<number | null>(null);
  hasSubmitted = signal<boolean>(false);
  isCorrect = signal<boolean>(false);

  availableTags = [
    'Noun', 'Pronoun', 'Verb', 'Be verb', 'Main verb', 'Gerund',
    'Adjective', 'Adverb', 'Preposition', 'Conjunction', 'Interjection', 'Article'
  ];

  ngOnInit(): void {
    this.initTagger();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['activity']) {
      this.initTagger();
    }
  }

  initTagger(): void {
    if (!this.activity || !this.activity.text) return;

    const words = this.activity.text.split(/\s+/).filter(Boolean);
    const parts = this.activity.parts || [];

    const chips = words.map((w, idx) => {
      // Find if this word has an expected tag. Match case-insensitively, removing punctuation
      const cleanW = w.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g,"");
      const matchedPart = parts.find(p => p.word.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g,"") === cleanW);
      
      return {
        index: idx,
        text: w,
        cleanText: cleanW,
        correctTag: matchedPart ? matchedPart.tag : '',
        selectedTag: ''
      };
    });

    this.wordChips.set(chips);
    this.selectedWordIndex.set(null);
    this.hasSubmitted.set(false);
    this.isCorrect.set(false);
  }

  selectWord(idx: number): void {
    if (this.hasSubmitted()) return;
    
    // Only allow selecting words that have a correct tag assigned in the data model
    const chip = this.wordChips()[idx];
    if (!chip.correctTag) return;

    this.selectedWordIndex.set(idx);
  }

  assignTag(tag: string): void {
    const idx = this.selectedWordIndex();
    if (idx === null || this.hasSubmitted()) return;

    this.wordChips.update(chips => 
      chips.map(c => c.index === idx ? { ...c, selectedTag: tag } : c)
    );
    this.selectedWordIndex.set(null); // Deselect
  }

  isAnyTagged(): boolean {
    return this.wordChips().some(c => c.selectedTag !== '');
  }

  checkAnswers(): void {
    if (this.hasSubmitted()) return;

    const chips = this.wordChips();
    // Verify if all words requiring tags are tagged correctly
    const correct = chips.every(c => {
      if (!c.correctTag) return true;
      return c.selectedTag.toLowerCase() === c.correctTag.toLowerCase();
    });

    this.isCorrect.set(correct);
    this.hasSubmitted.set(true);
    this.selectedWordIndex.set(null);

    const submissionTags = chips
      .filter(c => c.correctTag !== '')
      .map(c => ({ word: c.text, tag: c.selectedTag }));

    this.answered.emit({
      isCorrect: correct,
      tags: submissionTags
    });
  }

  reset(): void {
    this.initTagger();
  }
}
