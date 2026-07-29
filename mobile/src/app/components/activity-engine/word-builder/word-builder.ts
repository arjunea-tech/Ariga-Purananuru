import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TamilNLPService } from '../../../services/tamil-nlp.service';

export interface WordBuilderData {
  type: string;
  question?: string;
  text: string;
  explanation?: string;
}

export interface PoolLetter {
  id: string;
  text: string;
  isUsed: boolean;
  isDistractor: boolean;
}

export interface ChallengeRow {
  targetWord: string;
  formula: string[]; // e.g. ['நேர்', 'நேர்']
  boxes: Array<{
    expectedType: string;
    letters: string[];
  }>;
  isCorrect: boolean;
  message: string;
  isError: boolean;
  matchedWord?: string;
}

const TAMIL_CONFUSABLES: { [key: string]: string[] } = {
  'ல': ['ள', 'ழ'], 'ள': ['ல', 'ழ'], 'ழ': ['ல', 'ள'],
  'லி': ['ளி', 'ழி'], 'ளி': ['லி', 'ழி'], 'ழி': ['லி', 'ளி'],
  'லீ': ['ளீ', 'ழீ'], 'ளீ': ['லீ', 'ழீ'], 'ழீ': ['லீ', 'ளீ'],
  'லு': ['ளு', 'ழு'], 'ளு': ['லு', 'ழு'], 'ழு': ['லு', 'ளு'],
  'லூ': ['ளூ', 'ழூ'], 'ளூ': ['லூ', 'ழூ'], 'ழூ': ['லூ', 'ளூ'],
  'லெ': ['ளெ', 'ழெ'], 'ளெ': ['லெ', 'ழெ'], 'ழெ': ['லெ', 'ளெ'],
  'லே': ['ளே', 'ழே'], 'ளே': ['லே', 'ழே'], 'ழே': ['லே', 'ளே'],
  'லை': ['ளை', 'ழை'], 'ளை': ['லை', 'ழை'], 'ழை': ['லை', 'ளை'],
  'லொ': ['ளொ', 'ழொ'], 'ளொ': ['லொ', 'ழொ'], 'ழொ': ['லொ', 'ளொ'],
  'லோ': ['ளோ', 'ழோ'], 'ளோ': ['லோ', 'ழோ'], 'ழோ': ['லோ', 'ளோ'],
  'ல்': ['ள்', 'ழ்'], 'ள்': ['ல்', 'ழ்'], 'ழ்': ['ல்', 'ள்'],
  'ர': ['ற'], 'ற': ['ர'],
  'ரி': ['றி'], 'றி': ['ரி'],
  'ரீ': ['றீ'], 'றீ': ['ரீ'],
  'ரு': ['று'], 'று': ['ரு'],
  'ரூ': ['றூ'], 'றூ': ['ரூ'],
  'ரெ': ['றெ'], 'றெ': ['ரெ'],
  'ரே': ['றே'], 'றே': ['ரே'],
  'ரை': ['றை'], 'றை': ['ரை'],
  'ரொ': ['றொ'], 'றொ': ['ரொ'],
  'ரோ': ['றோ'], 'றோ': ['ரோ'],
  'ர்': ['ற்'], 'ற்': ['ர்'],
  'ந': ['ண', 'ன'], 'ண': ['ந', 'ன'], 'ன': ['ந', 'ண'],
  'நா': ['ணா', 'னா'], 'ணா': ['நா', 'னா'], 'னா': ['நா', 'ணா'],
  'நி': ['ணி', 'னி'], 'ணி': ['நி', 'னி'], 'னி': ['நி', 'ணி'],
  'நீ': ['ணீ', 'னீ'], 'ணீ': ['நீ', 'னீ'], 'னீ': ['நீ', 'ணீ'],
  'நு': ['ணு', 'னு'], 'ணு': ['நு', 'னு'], 'னு': ['நு', 'ணு'],
  'நூ': ['ணூ', 'னூ'], 'ணூ': ['நூ', 'னூ'], 'னூ': ['நூ', 'ணூ'],
  'நெ': ['ணெ', 'னெ'], 'ணெ': ['நெ', 'னெ'], 'னெ': ['நெ', 'ணெ'],
  'நே': ['ணே', 'னே'], 'ணே': ['நே', 'னே'], 'னே': ['நே', 'ணே'],
  'நை': ['ணை', 'னை'], 'ணை': ['நை', 'னை'], 'னை': ['நை', 'ணை'],
  'நொ': ['ணொ', 'னொ'], 'ணொ': ['நொ', 'னொ'], 'னொ': ['நொ', 'ணொ'],
  'நோ': ['ணோ', 'னோ'], 'ணோ': ['நோ', 'னோ'], 'னோ': ['நோ', 'ணோ'],
  'ந்': ['ண்', 'ன்'], 'ண்': ['ந்', 'ன்'], 'ன்': ['ந்', 'ண்']
};

@Component({
  selector: 'app-activity-word-builder',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './word-builder.html',
  styleUrls: ['./word-builder.css']
})
export class WordBuilderComponent implements OnInit, OnChanges {
  private tamilNLPService = inject(TamilNLPService);

  @Input() activity: WordBuilderData | null = null;
  @Input() showFeedback: boolean = true;
  @Output() answered = new EventEmitter<any>();

  challengeRows = signal<ChallengeRow[]>([]);
  letterPool = signal<PoolLetter[]>([]);
  selectedLetter = signal<PoolLetter | null>(null);
  selectedTarget = signal<{ rowIdx: number; boxIdx: number } | null>(null);
  
  hasSubmitted = signal<boolean>(false);
  isAllCorrect = signal<boolean>(false);
  targetWords: string[] = [];

  ngOnInit(): void {
    this.initGame();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['activity']) {
      this.initGame();
    }
  }

  initGame(): void {
    if (!this.activity) return;

    const rawText = this.activity.text || '';
    const words = rawText.split(',').map(w => w.trim()).filter(Boolean);
    this.targetWords = words;

    const rows: ChallengeRow[] = [];
    const poolLetters: PoolLetter[] = [];
    let letterCounter = 0;

    words.forEach(word => {
      // Analyze word syllables (asai)
      const asais = this.tamilNLPService.identifyAsai(word);
      const formula = asais.map(a => a.type);
      
      rows.push({
        targetWord: word,
        formula,
        boxes: formula.map(type => ({
          expectedType: type,
          letters: []
        })),
        isCorrect: false,
        message: '',
        isError: false
      });

      // Split the word into syllables (Asai text blocks) instead of individual letters
      asais.forEach(asai => {
        const syllableText = asai.text;
        poolLetters.push({
          id: `correct-${letterCounter++}`,
          text: syllableText,
          isUsed: false,
          isDistractor: false
        });

        // Add confusable distractor for this syllable block if any letter in it can be substituted
        const sylLetters = this.tamilNLPService.splitTamilLetters(syllableText);
        let hasDistractor = false;
        let distText = '';

        for (let i = 0; i < sylLetters.length; i++) {
          const char = sylLetters[i];
          if (TAMIL_CONFUSABLES[char]) {
            const distractors = TAMIL_CONFUSABLES[char];
            const dist = distractors[Math.floor(Math.random() * distractors.length)];
            const modifiedLetters = [...sylLetters];
            modifiedLetters[i] = dist;
            distText = modifiedLetters.join('');
            hasDistractor = true;
            break;
          }
        }

        if (hasDistractor && distText !== syllableText) {
          poolLetters.push({
            id: `distractor-${letterCounter++}`,
            text: distText,
            isUsed: false,
            isDistractor: true
          });
        }
      });
    });

    // Expand pool to at least 7-8 options if needed for challenging student choices
    const EXTRA_DISTRACTOR_POOL = [
      'தா', 'பூ', 'தீ', 'கூ', 'தே', 'மா', 'யா', 'வா', 'நாள்', 'கால்', 'தேர்', 'வேர்',
      'கல்', 'மண்', 'பல்', 'வில்', 'சொல்', 'புல்', 'கண்', 'பண்', 'மகிழ்', 'பசு', 'பலா',
      'மழை', 'குடை', 'நிலா', 'மனை', 'தமிழ்', 'சிலை', 'நடை', 'கிளி', 'குரல்', 'மலர்',
      'கடல்', 'நகர்', 'கமல்', 'மனம்', 'தலை', 'கிளை', 'மலை', 'கனி', 'நதி', 'வழி', 'மொழி'
    ];

    let extraIndex = 0;
    while (poolLetters.length < 7 && extraIndex < EXTRA_DISTRACTOR_POOL.length) {
      const candidate = EXTRA_DISTRACTOR_POOL[extraIndex++];
      if (!poolLetters.some(p => p.text === candidate)) {
        poolLetters.push({
          id: `extra-distractor-${letterCounter++}`,
          text: candidate,
          isUsed: false,
          isDistractor: true
        });
      }
    }

    // Shuffle the letter pool
    for (let i = poolLetters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [poolLetters[i], poolLetters[j]] = [poolLetters[j], poolLetters[i]];
    }

    this.challengeRows.set(rows);
    this.letterPool.set(poolLetters);
    this.selectedLetter.set(null);
    this.selectedTarget.set(null);
    this.hasSubmitted.set(false);
    this.isAllCorrect.set(false);
  }

  // HTML5 Drag and Drop Handlers
  dragStart(event: DragEvent, letter: PoolLetter): void {
    if (letter.isUsed || this.isAllCorrect()) return;
    event.dataTransfer?.setData('text/plain', letter.id);
  }

  allowDrop(event: DragEvent): void {
    event.preventDefault();
  }

  drop(event: DragEvent, rowIdx: number, boxIdx: number): void {
    event.preventDefault();
    const letterId = event.dataTransfer?.getData('text/plain');
    if (letterId) {
      this.placeLetter(letterId, rowIdx, boxIdx);
    }
  }

  // Click-to-place Handlers
  selectPoolLetter(letter: PoolLetter): void {
    if (letter.isUsed || this.isAllCorrect()) return;
    
    if (this.selectedLetter()?.id === letter.id) {
      this.selectedLetter.set(null);
    } else {
      this.selectedLetter.set(letter);
    }
  }

  selectBox(rowIdx: number, boxIdx: number): void {
    const row = this.challengeRows()[rowIdx];
    if (row.isCorrect || this.isAllCorrect()) return;

    const currentSelected = this.selectedLetter();
    if (currentSelected) {
      this.placeLetter(currentSelected.id, rowIdx, boxIdx);
      this.selectedLetter.set(null);
    }
  }

  placeLetter(letterId: string, rowIdx: number, boxIdx: number): void {
    const pool = this.letterPool();
    const letterObj = pool.find(l => l.id === letterId);
    
    if (!letterObj || letterObj.isUsed) return;

    // If box already has a syllable, return it to pool first
    const box = this.challengeRows()[rowIdx].boxes[boxIdx];
    if (box.letters.length > 0) {
      const existing = box.letters[0];
      this.letterPool.update(p => {
        const idx = p.findIndex(l => l.text === existing && l.isUsed);
        if (idx !== -1) {
          const newPool = [...p];
          newPool[idx] = { ...newPool[idx], isUsed: false };
          return newPool;
        }
        return p;
      });
    }

    // Update challenge row boxes
    this.challengeRows.update(rows => {
      const newRows = [...rows];
      const targetRow = newRows[rowIdx];
      
      // Replace with new syllable
      targetRow.boxes[boxIdx].letters = [letterObj.text];
      
      // Clear error state on new placement
      targetRow.message = '';
      targetRow.isError = false;

      return newRows;
    });

    // Mark letter as used in pool
    this.letterPool.update(p => 
      p.map(l => l.id === letterId ? { ...l, isUsed: true } : l)
    );

    // Auto check if all boxes in the row are filled
    const row = this.challengeRows()[rowIdx];
    const allFilled = row.boxes.every(box => box.letters.length > 0);
    if (allFilled) {
      this.validateRow(rowIdx);
    }
  }

  removeLetterFromBox(rowIdx: number, boxIdx: number, letterIdx: number): void {
    const row = this.challengeRows()[rowIdx];
    if (row.isCorrect || this.isAllCorrect()) return;

    const letterToRemove = row.boxes[boxIdx].letters[letterIdx];

    this.challengeRows.update(rows => {
      const newRows = [...rows];
      newRows[rowIdx].boxes[boxIdx].letters.splice(letterIdx, 1);
      newRows[rowIdx].message = '';
      newRows[rowIdx].isError = false;
      return newRows;
    });

    this.letterPool.update(pool => {
      const idx = pool.findIndex(l => l.text === letterToRemove && l.isUsed);
      if (idx !== -1) {
        const newPool = [...pool];
        newPool[idx] = { ...newPool[idx], isUsed: false };
        return newPool;
      }
      return pool;
    });
  }

  clearRow(rowIdx: number): void {
    const row = this.challengeRows()[rowIdx];
    if (row.isCorrect || this.isAllCorrect()) return;

    const lettersToReturn: string[] = [];
    row.boxes.forEach(box => {
      lettersToReturn.push(...box.letters);
      box.letters = [];
    });

    this.challengeRows.update(rows => {
      const newRows = [...rows];
      newRows[rowIdx].message = '';
      newRows[rowIdx].isError = false;
      return newRows;
    });

    this.letterPool.update(pool => {
      const newPool = [...pool];
      lettersToReturn.forEach(char => {
        const idx = newPool.findIndex(l => l.text === char && l.isUsed);
        if (idx !== -1) {
          newPool[idx] = { ...newPool[idx], isUsed: false };
        }
      });
      return newPool;
    });
  }

  validateRow(rowIdx: number): void {
    const row = this.challengeRows()[rowIdx];
    
    // Combine syllables in each box
    const userSyllables = row.boxes.map(box => box.letters.join(''));
    const userWord = userSyllables.join('');

    // Candidate words are all target words that match this row's formula length
    const candidateWords = this.targetWords.filter(word => {
      const asais = this.tamilNLPService.identifyAsai(word);
      return asais.length === row.boxes.length;
    });

    // Which of these candidate words are already matched in other rows?
    const alreadyMatchedWords = this.challengeRows()
      .filter((r, idx) => r.isCorrect && idx !== rowIdx)
      .map(r => r.matchedWord)
      .filter(Boolean) as string[];

    // 1. Exact Match Check against unmatched candidate words
    const exactMatchWord = candidateWords.find(word => {
      if (word !== userWord) return false;
      // Check if boundaries are correct
      const targetAsais = this.tamilNLPService.identifyAsai(word);
      const targetSyllables = targetAsais.map(a => a.text);
      return userSyllables.every((syl, i) => syl === targetSyllables[i]);
    });

    if (exactMatchWord) {
      if (alreadyMatchedWords.includes(exactMatchWord)) {
        this.challengeRows.update(rows => {
          const newRows = [...rows];
          newRows[rowIdx].isCorrect = false;
          newRows[rowIdx].isError = true;
          newRows[rowIdx].message = `'${exactMatchWord}' என்ற சொல் ஏற்கனவே மற்றொரு சவாலில் பயன்படுத்தப்பட்டுள்ளது!`;
          return newRows;
        });
        return;
      }

      this.challengeRows.update(rows => {
        const newRows = [...rows];
        newRows[rowIdx].isCorrect = true;
        newRows[rowIdx].isError = false;
        newRows[rowIdx].matchedWord = exactMatchWord;
        newRows[rowIdx].message = 'சரியான விடை! 🎉';
        return newRows;
      });
      this.checkAllCompleted();
      return;
    }

    // 2. Boundary Error Check
    const wrongBoundaryWord = candidateWords.find(word => word === userWord);
    if (wrongBoundaryWord) {
      const targetAsais = this.tamilNLPService.identifyAsai(wrongBoundaryWord);
      const correctFormulasText = targetAsais.map(a => `'${a.text}' (${a.type})`).join(' + ');
      this.challengeRows.update(rows => {
        const newRows = [...rows];
        newRows[rowIdx].isCorrect = false;
        newRows[rowIdx].isError = true;
        newRows[rowIdx].message = `அசைப் பிரிப்புத் தவறு! '${wrongBoundaryWord}' என்ற சொல்லை ${correctFormulasText} என பிரிக்க வேண்டும்.`;
        return newRows;
      });
      return;
    }

    // 3. Spelling Error Check (Mayangoli variations)
    for (const targetWord of candidateWords) {
      if (alreadyMatchedWords.includes(targetWord)) continue;

      const targetLetters = this.tamilNLPService.splitTamilLetters(targetWord);
      const userLetters = this.tamilNLPService.splitTamilLetters(userWord);

      if (targetLetters.length === userLetters.length) {
        let isSpellingError = false;
        let explanation = '';

        for (let i = 0; i < targetLetters.length; i++) {
          const tLetter = targetLetters[i];
          const uLetter = userLetters[i];

          if (tLetter !== uLetter) {
            if (TAMIL_CONFUSABLES[tLetter] && TAMIL_CONFUSABLES[tLetter].includes(uLetter)) {
              isSpellingError = true;
              explanation = `எழுத்துப்பிழை! '${targetWord}' என்ற சொல்லிற்கு '${tLetter}' தான் வரவேண்டும், '${uLetter}' அல்ல.`;
              break;
            }
          }
        }

        if (isSpellingError) {
          this.challengeRows.update(rows => {
            const newRows = [...rows];
            newRows[rowIdx].isCorrect = false;
            newRows[rowIdx].isError = true;
            newRows[rowIdx].message = explanation;
            return newRows;
          });
          return;
        }
      }
    }

    // 4. Fallback General Incorrect Message using targetWord of current row
    this.challengeRows.update(rows => {
      const newRows = [...rows];
      newRows[rowIdx].isCorrect = false;
      newRows[rowIdx].isError = true;
      newRows[rowIdx].message = `தவறு! இது சரியான வார்த்தை அல்ல. '${row.targetWord}' போன்ற சொல்லை உருவாக்க முயற்சி செய்யுங்கள்.`;
      return newRows;
    });
  }

  checkAllCompleted(): void {
    const allCorrect = this.challengeRows().every(row => row.isCorrect);
    if (allCorrect) {
      this.isAllCorrect.set(true);
      this.hasSubmitted.set(true);
      // Emit the final answer
      this.answered.emit({
        isCorrect: true,
        answer: this.challengeRows().map(row => row.matchedWord || row.targetWord).join(', ')
      });
    }
  }

  resetPuzzle(): void {
    this.initGame();
  }
}
