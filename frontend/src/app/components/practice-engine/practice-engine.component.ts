import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TamilNLPService, SeiyulAnalysis } from '../../services/tamil-nlp.service';

@Component({
  selector: 'app-practice-engine',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './practice-engine.component.html',
  styleUrls: ['./practice-engine.component.css']
})
export class PracticeEngineComponent implements OnInit {
  @Input() practiceType: string = 'alahidu'; 
  @Input() practiceContent: string = ''; 
  
  @Output() practiceCompleted = new EventEmitter<void>();

  tabs = [
    { id: 'eluthu', label: 'எழுத்து (Letters)' },
    { id: 'asai', label: 'அசை (Syllables)' },
    { id: 'seer', label: 'சீர் (Metrical Foot)' },
    { id: 'thalai', label: 'தளை (Linkage)' },
    { id: 'alahidu', label: 'அலகிடுதல் (Full Analysis)' },
  ];

  activeTab: string = 'alahidu';
  userInput: string = 'அகழ்வாரைத் தாங்கும் நிலம்போலத் தம்மை\nஇகழ்வார்ப் பொறுத்தல் தலை';
  
  analysisResult: SeiyulAnalysis | null = null;
  
  // Game Mode variables (for when used inside a course player)
  isGameMode: boolean = false;
  step: 'split' | 'classify' | 'classify_eluthu' | 'classify_asai' | 'classify_seer' | 'sandbox' | 'result' = 'split';
  userSplitInput: string = '';
  feedbackMessage: string | null = null;
  feedbackType: 'success' | 'error' = 'success';
  syllables: string[] = [];
  userClassifications: { [index: number]: string } = {};
  validationResults: any[] = [];
  allCorrect: boolean = false;

  eluthuLetters: string[] = [];
  eluthuClassifications: { [index: number]: string } = {};

  // --- SEER TOY GAME DATA ---
  seerOptions: { pattern: string, name: string }[] = [
    { pattern: 'நேர் நேர்', name: 'தேமா' },
    { pattern: 'நிரை நேர்', name: 'புளிமா' },
    { pattern: 'நிரை நிரை', name: 'கருவிளம்' },
    { pattern: 'நேர் நிரை', name: 'கூவிளம்' }
  ];
  currentSeerQuestion: { pattern: string, name: string } = { pattern: '', name: '' };

  // All basic Tamil letters for random selection
  uyirKuril = ['அ', 'இ', 'உ', 'எ', 'ஒ'];
  uyirNedil = ['ஆ', 'ஈ', 'ஊ', 'ஏ', 'ஐ', 'ஓ', 'ஔ'];
  mei = ['க்', 'ங்', 'ச்', 'ஞ்', 'ட்', 'ண்', 'த்', 'ந்', 'ப்', 'ம்', 'ய்', 'ர்', 'ல்', 'வ்', 'ழ்', 'ள்', 'ற்', 'ன்'];
  uyirmeiBase = ['க', 'ங', 'ச', 'ஞ', 'ட', 'ண', 'த', 'ந', 'ப', 'ம', 'ய', 'ர', 'ல', 'வ', 'ழ', 'ள', 'ற', 'ன'];
  kurilModifiers = ['', 'ி', 'ு', 'ெ', 'ொ'];
  nedilModifiers = ['ா', 'ீ', 'ூ', 'ே', 'ை', 'ோ', 'ௌ'];

  // Asai specific practice words (Pre-verified single asai words)
  nerAsaiWords = ['கல்', 'கால்', 'மா', 'பொன்', 'பூ', 'தீ', 'மெய்', 'நெய்', 'கை', 'கண்', 'நாள்'];
  niraiAsaiWords = ['பல', 'பலா', 'நிலம்', 'கனா', 'விழா', 'மலர்', 'குயில்', 'தமிழ்', 'உயிர்', 'புலி'];

  constructor(private tamilNLP: TamilNLPService) {}

  getRandomTamilLetter(): string {
    const types = ['uyir_kuril', 'uyir_nedil', 'mei', 'uyirmei_kuril', 'uyirmei_nedil'];
    const selectedType = types[Math.floor(Math.random() * types.length)];

    if (selectedType === 'uyir_kuril') return this.uyirKuril[Math.floor(Math.random() * this.uyirKuril.length)];
    if (selectedType === 'uyir_nedil') return this.uyirNedil[Math.floor(Math.random() * this.uyirNedil.length)];
    if (selectedType === 'mei') return this.mei[Math.floor(Math.random() * this.mei.length)];
    
    const base = this.uyirmeiBase[Math.floor(Math.random() * this.uyirmeiBase.length)];
    if (selectedType === 'uyirmei_kuril') {
      const mod = this.kurilModifiers[Math.floor(Math.random() * this.kurilModifiers.length)];
      return base + mod;
    } else {
      const mod = this.nedilModifiers[Math.floor(Math.random() * this.nedilModifiers.length)];
      return base + mod;
    }
  }

  getRandomAsaiWord(): string {
    const allWords = [...this.nerAsaiWords, ...this.niraiAsaiWords];
    return allWords[Math.floor(Math.random() * allWords.length)];
  }

  getRandomSeerPattern() {
    const randomOption = this.seerOptions[Math.floor(Math.random() * this.seerOptions.length)];
    this.currentSeerQuestion = randomOption;
    this.validationResults = [];
    this.allCorrect = false;
    this.feedbackMessage = null;
  }

  selectSeerAnswer(selectedSeerName: string) {
    const isCorrect = selectedSeerName === this.currentSeerQuestion.name;
    
    this.validationResults = [{
      syllable: this.currentSeerQuestion.pattern,
      userClassification: selectedSeerName,
      correctClassification: this.currentSeerQuestion.name,
      isCorrect: isCorrect
    }];

    this.allCorrect = isCorrect;
    
    if (isCorrect) {
      this.step = 'result';
    } else {
      this.feedbackMessage = 'தவறு! மீண்டும் முயற்சிக்கவும்.';
    }
  }

  ngOnInit() {
    if (this.practiceContent) {
      this.isGameMode = true;
      this.activeTab = this.practiceType;
      this.userInput = this.practiceContent;
      
      if (this.practiceType === 'eluthu') {
         this.step = 'classify_eluthu';
         // Instead of splitting the target word, we just pick ONE random letter!
         this.userInput = this.getRandomTamilLetter();
         this.eluthuLetters = [this.userInput]; 
      }
      else if (this.practiceType === 'asai') {
         this.step = 'classify_asai';
         this.userInput = this.getRandomAsaiWord();
      }
      else {
         this.step = 'sandbox';
         // Don't auto-analyze. Wait for the user to click the button.
         this.analysisResult = null;
      }
    } else {
      // Standalone Dashboard mode
      this.analyzeText();
    }
  }

  selectTab(tabId: string) {
    this.activeTab = tabId;
  }

  analyzeText() {
    if (!this.userInput.trim()) {
      this.analysisResult = null;
      return;
    }
    this.analysisResult = this.tamilNLP.analyzeSeiyulLine(this.userInput);
  }

  // ---- Game Mode Methods (from previous step) ---- //

  checkSyllableSplit() {
    if (!this.userSplitInput) {
      this.showFeedback('Please enter your split using forward slash (/).', 'error');
      return;
    }

    const userSplits = this.userSplitInput.split('/').map(s => s.trim()).filter(s => s.length > 0);
    const originalWord = userSplits.join('');
    
    if (originalWord !== this.userInput && originalWord !== this.userInput.replace(/\s+/g, '')) {
       this.showFeedback(`Ensure you are splitting the word: ${this.userInput}`, 'error');
    }

    const systemSplits = this.tamilNLP.splitTamilWordIntoSyllables(originalWord);
    
    if (JSON.stringify(userSplits) === JSON.stringify(systemSplits)) {
      this.showFeedback('Awesome! You split the word perfectly.', 'success');
      this.syllables = userSplits;
      
      setTimeout(() => {
        this.step = 'classify';
        this.feedbackMessage = null;
      }, 1500);
    } else {
      this.showFeedback('Not quite right. Look closely at the Mathirai rules!', 'error');
    }
  }

  submitClassification() {
    let allClassified = true;
    for (let i = 0; i < this.syllables.length; i++) {
      if (!this.userClassifications[i]) {
        allClassified = false;
        break;
      }
    }

    if (!allClassified) {
      this.showFeedback('Please classify all syllables!', 'error');
      return;
    }

    this.validationResults = [];
    this.allCorrect = true;

    for (let i = 0; i < this.syllables.length; i++) {
      const syllable = this.syllables[i];
      const userClass = this.userClassifications[i]; 
      
      const correctClassTamil = this.tamilNLP.classifySyllable(syllable);
      const correctClassEng = correctClassTamil === 'நேர்' ? 'ner' : 'nirai';

      const isCorrect = userClass === correctClassEng;
      if (!isCorrect) this.allCorrect = false;

      this.validationResults.push({
        syllable,
        userClassification: userClass,
        correctClassification: correctClassTamil,
        isCorrect
      });
    }

    this.step = 'result';
  }

  selectEluthuAnswer(type: string) {
    this.eluthuClassifications[0] = type;
    this.submitEluthuClassification();
  }

  selectAsaiAnswer(type: string) {
    const analysis = this.tamilNLP.identifyAsai(this.userInput);
    const correctAsaiType = analysis.length > 0 ? analysis[0].type : 'நேர்'; // Fallback
    const isCorrect = (type === correctAsaiType);

    this.allCorrect = isCorrect;
    this.validationResults = [{
      syllable: this.userInput,
      userClassification: type,
      correctClassification: correctAsaiType,
      isCorrect: isCorrect
    }];
    
    this.step = 'result';
  }

  submitEluthuClassification() {
    let allClassified = true;
    for (let i = 0; i < this.eluthuLetters.length; i++) {
      if (!this.eluthuClassifications[i]) {
        allClassified = false;
        break;
      }
    }

    if (!allClassified) {
      this.showFeedback('Please classify all letters!', 'error');
      return;
    }

    this.validationResults = [];
    this.allCorrect = true;

    for (let i = 0; i < this.eluthuLetters.length; i++) {
      const letter = this.eluthuLetters[i];
      const userClass = this.eluthuClassifications[i]; 
      
      const mathirai = this.tamilNLP.getMathirai(letter);
      let correctClassEng = 'mei';
      let correctClassTamil = 'மெய் / ஆய்தம்';
      if (mathirai === 1) { correctClassEng = 'kuril'; correctClassTamil = 'குறில்'; }
      if (mathirai === 2) { correctClassEng = 'nedil'; correctClassTamil = 'நெடில்'; }

      const isCorrect = userClass === correctClassEng;
      if (!isCorrect) this.allCorrect = false;

      this.validationResults.push({
        syllable: letter, 
        userClassification: userClass === 'kuril' ? 'குறில்' : (userClass === 'nedil' ? 'நெடில்' : 'மெய் / ஆய்தம்'),
        correctClassification: correctClassTamil,
        isCorrect
      });
    }

    this.step = 'result';
  }

  retry() {
    if (this.practiceType === 'eluthu') {
       this.step = 'classify_eluthu';
       this.userInput = this.getRandomTamilLetter();
       this.eluthuLetters = [this.userInput];
       this.eluthuClassifications = {};
    } else if (this.practiceType === 'asai') {
       this.step = 'classify_asai';
       this.userInput = this.getRandomAsaiWord();
    } else {
       this.step = 'sandbox';
       this.userInput = '';
       this.analysisResult = null;
    }
    this.feedbackMessage = null;
  }

  continueToActivity() {
    this.practiceCompleted.emit();
  }

  private showFeedback(message: string, type: 'success' | 'error') {
    this.feedbackMessage = message;
    this.feedbackType = type;
    setTimeout(() => {
      this.feedbackMessage = null;
    }, 4000);
  }
}
