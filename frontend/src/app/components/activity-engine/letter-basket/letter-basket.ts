import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface BasketItem {
  id: string;
  text: string;
  category: string; // 'குறில்', 'நெடில்', 'மெய்', 'ஒற்று'
  error?: boolean;
}

export interface LetterBasketData {
  id?: number;
  question: string;
  items: Array<{ text: string; category: string }>;
  explanation?: string;
}

const BOTH_BASKET_LETTERS = [
  'க்', 'ங்', 'ச்', 'ஞ்', 'ட்', 'ண்', 
  'த்', 'ந்', 'ப்', 'ம்', 'ய்', 'ர்', 
  'ல்', 'வ்', 'ழ்', 'ள்', 'ற்', 'ன்'
];

const DYNAMIC_KURIL = [
  'அ', 'இ', 'உ', 'எ', 'ஒ', 
  'க', 'கி', 'கு', 'கெ', 'கொ', 
  'ச', 'சி', 'சு', 'செ', 'சொ', 
  'த', 'தி', 'து', 'தெ', 'தொ', 
  'ப', 'பி', 'பு', 'பெ', 'பொ', 
  'ம', 'மி', 'மு', 'மெ', 'மொ',
  'ய', 'யி', 'யு', 'யெ', 'யொ',
  'ர', 'ரி', 'ரு', 'ரெ', 'ரொ',
  'ல', 'லி', 'லு', 'லெ', 'லொ',
  'வ', 'வி', 'வு', 'வெ', 'வொ',
  'ழ', 'ழி', 'ழு', 'ழெ', 'ழொ'
];

const DYNAMIC_NEDIL = [
  'ஆ', 'ஈ', 'ஊ', 'ஏ', 'ஐ', 'ஓ', 'ஔ', 
  'கா', 'கீ', 'கூ', 'கே', 'கை', 'கோ', 'கௌ', 
  'சா', 'சீ', 'சூ', 'சே', 'சை', 'சோ', 'சௌ', 
  'தா', 'தீ', 'தூ', 'தே', 'தை', 'தோ', 'தௌ', 
  'பா', 'பீ', 'பூ', 'பே', 'பை', 'போ', 'பௌ', 
  'மா', 'மீ', 'மூ', 'மே', 'மை', 'மோ', 'மௌ',
  'யா', 'யீ', 'யூ', 'யே', 'யை', 'யோ', 'யௌ',
  'ரா', 'ரீ', 'ரூ', 'ரே', 'ரை', 'ரோ', 'ரௌ',
  'லா', 'லீ', 'லூ', 'லே', 'லை', 'லோ', 'லௌ',
  'வா', 'வீ', 'வூ', 'வே', 'வை', 'வோ', 'வௌ',
  'ழா', 'ழீ', 'ழூ', 'ழே', 'ழை', 'ழோ', 'ழௌ'
];

const DYNAMIC_MEI = [
  'க்', 'ங்', 'ச்', 'ஞ்', 'ட்', 'ண்', 
  'த்', 'ந்', 'ப்', 'ம்', 'ய்', 'ர்', 
  'ல்', 'வ்', 'ழ்', 'ள்', 'ற்', 'ன்'
];

const DYNAMIC_OTTRU = [
  'ஃ', 'க்', 'ங்', 'ச்', 'ஞ்', 'ட்', 'ண்', 
  'த்', 'ந்', 'ப்', 'ம்', 'ய்', 'ர்', 
  'ல்', 'வ்', 'ழ்', 'ள்', 'ற்', 'ன்'
];

@Component({
  selector: 'app-activity-letter-basket',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './letter-basket.html',
  styleUrls: ['./letter-basket.css']
})
export class LetterBasketComponent implements OnChanges {
  @Input() activity: LetterBasketData | null = null;
  @Input() showFeedback: boolean = true;

  @Output() answered = new EventEmitter<{ isCorrect: boolean }>();

  categories = ['குறில்', 'நெடில்', 'மெய்', 'ஒற்று'];
  cloudLetters = signal<BasketItem[]>([]);
  placedLetters = signal<{ [key: string]: BasketItem[] }>({
    'குறில்': [],
    'நெடில்': [],
    'மெய்': [],
    'ஒற்று': []
  });

  selectedLetter = signal<BasketItem | null>(null);
  isComplete = signal<boolean>(false);
  shakeId = signal<string | null>(null);
  placedIntimation = signal<string | null>(null);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['activity']) {
      this.reset();
    }
  }

  reset(): void {
    if (!this.activity) return;

    let items: BasketItem[] = [];

    const allItemsEmpty = !this.activity.items || 
                          this.activity.items.length === 0 || 
                          this.activity.items.every(item => !item.text || item.text.trim() === '');

    if (!allItemsEmpty) {
      items = this.activity.items.map((item, idx) => ({
        id: `item-${idx}`,
        text: item.text,
        category: item.category
      }));
    } else {
      items = this.generateDynamicItems();
    }

    this.cloudLetters.set(this.shuffleArray(items));

    this.placedLetters.set({
      'குறில்': [],
      'நெடில்': [],
      'மெய்': [],
      'ஒற்று': []
    });

    this.selectedLetter.set(null);
    this.isComplete.set(false);
    this.shakeId.set(null);
    this.placedIntimation.set(null);
  }

  private generateDynamicItems(): BasketItem[] {
    const kurilSelected = this.shuffleArray([...DYNAMIC_KURIL]).slice(0, 4);
    const nedilSelected = this.shuffleArray([...DYNAMIC_NEDIL]).slice(0, 4);
    const meiSelected = this.shuffleArray([...DYNAMIC_MEI]).slice(0, 4);
    const ottruSelected = this.shuffleArray([...DYNAMIC_OTTRU]).slice(0, 3);

    const items: BasketItem[] = [];
    let idx = 0;

    kurilSelected.forEach(text => items.push({ id: `item-${idx++}`, text, category: 'குறில்' }));
    nedilSelected.forEach(text => items.push({ id: `item-${idx++}`, text, category: 'நெடில்' }));
    meiSelected.forEach(text => items.push({ id: `item-${idx++}`, text, category: 'மெய்' }));
    ottruSelected.forEach(text => items.push({ id: `item-${idx++}`, text, category: 'ஒற்று' }));

    return items;
  }

  private shuffleArray<T>(array: T[]): T[] {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  selectLetter(item: BasketItem): void {
    if (this.isComplete()) return;
    this.selectedLetter.set(item);
  }

  selectBasket(category: string): void {
    const item = this.selectedLetter();
    if (!item || this.isComplete()) return;

    this.placeItem(item, category);
  }

  onDragStart(event: DragEvent, item: BasketItem): void {
    if (this.isComplete()) {
      event.preventDefault();
      return;
    }
    // Use both 'text' and 'text/plain' to ensure maximum cross-browser/device compatibility
    event.dataTransfer?.setData('text', item.id);
    event.dataTransfer?.setData('text/plain', item.id);
    this.selectedLetter.set(item);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onDrop(event: DragEvent, category: string): void {
    event.preventDefault();
    const itemId = event.dataTransfer?.getData('text') || event.dataTransfer?.getData('text/plain');
    if (!itemId) return;

    const item = this.cloudLetters().find(l => l.id === itemId);
    if (item) {
      this.placeItem(item, category);
    }
  }

  placeItem(item: BasketItem, category: string): void {
    this.selectedLetter.set(null);

    const isBothBasketLetter = item.text && BOTH_BASKET_LETTERS.includes(item.text);
    const isCorrect = item.category === category || 
      (isBothBasketLetter && (category === 'மெய்' || category === 'ஒற்று'));

    if (isCorrect) {
      this.cloudLetters.update(letters => letters.filter(l => l.id !== item.id));
      this.placedLetters.update(placed => {
        const copy = { ...placed };
        copy[category] = [...copy[category], item];
        return copy;
      });

      if (isBothBasketLetter) {
        this.placedIntimation.set(`நன்று! "${item.text}" என்பது மெய் மற்றும் ஒற்று ஆகிய இரண்டு கூடைகளுக்கும் பொருந்தும்.`);
        setTimeout(() => {
          if (this.placedIntimation()?.includes(item.text)) {
            this.placedIntimation.set(null);
          }
        }, 5000);
      } else {
        this.placedIntimation.set(null);
      }

      if (this.cloudLetters().length === 0) {
        this.isComplete.set(true);
        this.answered.emit({ isCorrect: true });
      }
    } else {
      this.shakeId.set(item.id);
      setTimeout(() => {
        if (this.shakeId() === item.id) {
          this.shakeId.set(null);
        }
      }, 800);
    }
  }
}
