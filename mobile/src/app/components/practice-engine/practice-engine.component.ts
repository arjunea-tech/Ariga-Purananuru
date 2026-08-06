import { Component, EventEmitter, Input, Output, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { TamilNLPService, SeiyulAnalysis } from '../../services/tamil-nlp.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-practice-engine',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
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
  @Input() isGameMode: boolean = false;
  @Input() isEmbeddedInLesson: boolean = false;
  isFullscreen: boolean = false;
  step: 'dashboard_menu' | 'dashboard_input' | 'select_mode' | 'input_word' | 'split_word' | 'analyze_word' | 'auto_explain' | 'sandbox' | 'result' | 'identify_seer' | 'identify_thalai' = 'select_mode';

  // Interactive flow variables
  playMode: 'explain' | 'practice' = 'explain';
  interactiveWord: string = '';
  interactiveAnalysis: SeiyulAnalysis | null = null;
  interactiveSplitInput: string = '';
  interactiveParts: string[] = [];
  interactiveCurrentPartIndex: number = 0;
  interactiveValidationResults: { part: string, type: string, isCorrect: boolean, userGuess?: string, explanation?: string }[] = [];

  feedbackMessage: string | null = null;
  feedbackType: 'success' | 'error' = 'success';
  allCorrect: boolean = false;

  interactiveCurrentWordIndex: number = 0;
  interactiveSeerValidationResults: { word: string, expectedSeer: string, userGuess?: string, isCorrect: boolean }[] = [];

  interactiveCurrentThalaiIndex: number = 0;
  interactiveThalaiValidationResults: { firstWord: string, secondWord: string, expectedThalai: string, userGuess?: string, isCorrect: boolean }[] = [];

  hasCheckedInteractiveAsai: boolean = false;
  interactiveAsaiGuesses: string[][] = [];
  interactiveAsaiResults: (boolean | null)[][] = [];

  hasCheckedInteractiveSeer = false;
  interactiveSeerGuesses: string[] = []; // [wordIndex]
  interactiveSeerResults: (boolean | null)[] = [];
  interactiveSeerOptions: string[][] = []; // Dynamic options for Seer choices

  sandboxTitle: string = 'வார்த்தையை உள்ளிடுக';
  sandboxDesc: string = 'கீழே வார்த்தையை தட்டச்சு செய்து, பிரித்து காண்க பட்டனை அழுத்துக!';
  sandboxPlaceholder: string = 'உதாரணம்: சீவகசிந்தாமணி';

  // All basic Tamil letters for random selection
  uyirKuril = ['அ', 'இ', 'உ', 'எ', 'ஒ'];
  uyirNedil = ['ஆ', 'ஈ', 'ஊ', 'ஏ', 'ஐ', 'ஓ', 'ஔ'];
  mei = ['க்', 'ங்', 'ச்', 'ஞ்', 'ட்', 'ண்', 'த்', 'ந்', 'ப்', 'ம்', 'ய்', 'ர்', 'ல்', 'வ்', 'ழ்', 'ள்', 'ற்', 'ன்'];
  uyirmeiBase = ['க', 'ங', 'ச', 'ஞ', 'ட', 'ண', 'த', 'ந', 'ப', 'ம', 'ய', 'ர', 'ல', 'வ', 'ழ', 'ள', 'ற', 'ன'];
  kurilModifiers = ['', 'ி', 'ு', 'ெ', 'ொ'];
  nedilModifiers = ['ா', 'ீ', 'ூ', 'ே', 'ை', 'ோ', 'ௌ'];

  // Dynamic practice words (populated from Database API)
  nerAsaiWords: string[] = [];
  niraiAsaiWords: string[] = [];

  selectedWordForPractice: string = '';
  practiceWordPool: string[] = [];
  introQuestions: any[] = [];
  introQuizAnswers: (number | null)[] = [];
  yaappuLimbs: any[] = [];

  constructor(
    private tamilNLP: TamilNLPService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private http: HttpClient
  ) { }

  loadYaappuIntroFromDatabase(chapterId: number | string = 1) {
    this.http.get<any>(`${environment.apiUrl}/chapters/${chapterId}`).subscribe({
      next: (res) => {
        if (res && res.contents && Array.isArray(res.contents)) {
          const dbQuestions: any[] = [];
          const dbLimbs: any[] = [];

          res.contents.forEach((c: any) => {
            if (c.text_content) {
              try {
                const parsed = JSON.parse(c.text_content);
                if (parsed.blocks) {
                  parsed.blocks.forEach((b: any) => {
                    if (b.type === 'activity' && b.data) {
                      if (b.data.type === 'mcq' && b.data.question) {
                        dbQuestions.push({
                          question: b.data.question,
                          options: b.data.options || [b.data.correctAnswer || 'சரி'],
                          correct: b.data.correctIndex || 0,
                          explanation: b.data.explanation || ''
                        });
                      } else if (b.data.limbTitle) {
                        dbLimbs.push({
                          id: dbLimbs.length + 1,
                          title: b.data.limbTitle,
                          sub: b.data.limbSub || '',
                          desc: b.data.limbDesc || '',
                          examples: b.data.examples || [],
                          icon: b.data.icon || 'bi-book',
                          color: b.data.color || '#8B5CF6',
                          bg: b.data.bg || '#F3E8FF'
                        });
                      }
                    }
                  });
                }
              } catch (e) { }
            }
          });

          if (dbQuestions.length > 0) {
            let prepared = this.shuffleArray(dbQuestions);
            if (prepared.length > 10) prepared = prepared.slice(0, 10);
            this.introQuestions = prepared;
            this.introQuizAnswers = new Array(prepared.length).fill(null);
          }
          if (dbLimbs.length > 0) {
            this.yaappuLimbs = dbLimbs;
          }
        }
      },
      error: () => { }
    });
  }

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

  loadPracticeWordsFromDatabase() {
    this.http.get<any>(`${environment.apiUrl}/practice-words`).subscribe({
      next: (res) => {
        let wordsList: string[] = [];
        if (Array.isArray(res)) {
          wordsList = res;
        } else if (res && Array.isArray(res.data)) {
          wordsList = res.data;
        } else if (res && typeof res === 'object') {
          wordsList = Object.values(res).filter((v: any) => typeof v === 'string');
        }

        if (wordsList.length > 0) {
          this.practiceWordPool = wordsList;

          // Categorize single-asai DB words dynamically using TamilNLP
          const ner: string[] = [];
          const nirai: string[] = [];

          wordsList.forEach(word => {
            const groups = this.tamilNLP.identifyAsai(word);
            if (groups.length === 1) {
              if (groups[0].type === 'நேர்') ner.push(word);
              else if (groups[0].type === 'நிரை') nirai.push(word);
            }
          });

          if (ner.length > 0) this.nerAsaiWords = ner;
          if (nirai.length > 0) this.niraiAsaiWords = nirai;
        }
      },
      error: (err) => {
        console.warn('Could not fetch practice words from API, using fallback data:', err);
      }
    });
  }

  getRandomAsaiWord(): string {
    const allWords = [...this.nerAsaiWords, ...this.niraiAsaiWords];
    if (allWords.length > 0) {
      return allWords[Math.floor(Math.random() * allWords.length)];
    }
    return this.getRandomPracticeWord();
  }

  getRandomPracticeWord(): string {
    const pool = this.practiceWordPool;
    if (pool.length > 0) {
      return pool[Math.floor(Math.random() * pool.length)];
    }
    return '';
  }

  fetchRandomWordFromDB() {
    this.http.get<any>(`${environment.apiUrl}/practice-words/random`).subscribe({
      next: (res) => {
        if (res && res.word) {
          this.interactiveWord = res.word;
          this.selectedWordForPractice = res.word;
        } else {
          this.interactiveWord = this.getRandomPracticeWord();
          this.selectedWordForPractice = this.interactiveWord;
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.interactiveWord = this.getRandomPracticeWord();
        this.selectedWordForPractice = this.interactiveWord;
        this.cdr.detectChanges();
      }
    });
  }

  refreshRandomWord() {
    this.feedbackMessage = null;
    this.fetchRandomWordFromDB();
  }

  confirmSelectedWord() {
    if (!this.interactiveWord.trim()) {
      this.showFeedback('தயவுசெய்து ஒரு வார்த்தையை உள்ளிடுக.', 'error');
      return;
    }
    this.selectedWordForPractice = this.interactiveWord.trim();
    this.interactiveWord = this.selectedWordForPractice;
    this.step = 'split_word';
    this.feedbackMessage = null;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { step: 'split_word' },
      queryParamsHandling: 'merge'
    });
  }

  ngOnInit() {
    this.loadPracticeWordsFromDatabase();

    this.route.queryParams.subscribe(params => {
      const mode = params['mode'];
      const mod = params['module'];
      const modName = params['moduleName'] || '';
      const stepParam = params['step'];

      if (mod && mod !== 'all') {
        let detectedMod = mod;
        if (modName) {
          if (modName.includes('அறிமுகம்') || modName.includes('யாப்பு - அறிமுகம்') || modName.includes('எழுத்து')) detectedMod = 'ezhuthu';
          else if (modName.includes('அசை')) detectedMod = 'asai';
          else if (modName.includes('சீர்')) detectedMod = 'seer';
          else if (modName.includes('தளை')) detectedMod = 'thalai';
          else if (modName.includes('அலகிடு')) detectedMod = 'alagidhal';
        } else if (mod === '1' || mod === 'level_1' || mod === 'ezhuthu') {
          detectedMod = 'ezhuthu';
        }

        if (detectedMod === 'ezhuthu') this.activeTab = 'eluthu';
        else if (detectedMod === 'asai') this.activeTab = 'asai';
        else if (detectedMod === 'seer') this.activeTab = 'seer';
        else if (detectedMod === 'thalai') this.activeTab = 'thalai';
        else if (detectedMod === 'alagidhal') this.activeTab = 'alahidu';
        else this.activeTab = 'empty';
        this.practiceType = this.activeTab;
      } else {
        // When All Modules is selected, pick activeTab dynamically based on game type
        if (mode === 'memory' || mode === 'audio' || mode === 'build') {
          this.activeTab = 'eluthu';
        } else if (mode === 'match' || mode === 'drag_drop') {
          this.activeTab = 'asai';
        } else if (mode === 'mistake' || mode === 'speed') {
          this.activeTab = 'seer';
        } else {
          this.activeTab = 'empty';
        }
        this.practiceType = this.activeTab;
      }

      if (mode) {
        this.isGameMode = true;
        this.playMode = 'practice';
        this.step = stepParam || 'input_word';
      } else if (mod) {
        this.isGameMode = true;
        this.step = stepParam || 'select_mode';
      }

      // Automatically fetch dynamic word from Database if step is input_word or word is unassigned
      if (this.step === 'input_word' || !this.interactiveWord) {
        if (this.playMode === 'practice') {
          if (this.practiceType === 'eluthu') {
            this.interactiveWord = this.getRandomTamilLetter();
          } else {
            this.fetchRandomWordFromDB();
          }
        }
      }
    });

    if (this.practiceContent) {
      this.isGameMode = true;
      this.activeTab = this.practiceType;

      // Sandbox fallback for thalai/alahidu (which don't have interactive toy modes yet)
      if (this.practiceType === 'thalai') {
        this.step = 'sandbox';
        this.analysisResult = null;

        if (this.practiceType === 'thalai') {
          this.sandboxTitle = 'தளை பயிற்சி';
          this.sandboxDesc = 'கீழே ஒரு பாடலின் வரியை உள்ளிட்டு, தளைகளை அறியலாம்.';
          this.sandboxPlaceholder = 'உதாரணம்: அகர முதல எழுத்தெல்லாம்';
          this.userInput = this.practiceContent || '';
        }

        if (this.userInput) {
          this.analyzeText();
        }
      } else {
        // Eluthu, Asai, Seer, Alahidu will use the new Interactive Flow
        this.step = 'select_mode';
      }
    } else if (!this.isGameMode) {
      // Standalone Dashboard mode
      this.step = 'dashboard_menu';
      // Reset input as they start from menu
      this.userInput = '';
      this.analysisResult = null;
    }
  }

  // --- INTERACTIVE FLOW METHODS --- //

  goBackToGames() {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (this.step === 'input_word' || this.step === 'split_word' || this.step === 'analyze_word' || this.step === 'identify_seer' || this.step === 'identify_thalai' || this.step === 'result') {
      this.goBackToInput();
    } else {
      this.router.navigate(['/tabs/games'], { queryParams: { view: 'categories' } });
    }
  }

  getModuleTitle(): string {
    if (this.practiceType === 'eluthu') return '1. எழுத்து இலக்கணம்';
    if (this.practiceType === 'asai') return '2. அசை இலக்கணம்';
    if (this.practiceType === 'seer') return '3. சீர் இலக்கணம்';
    if (this.practiceType === 'thalai') return '4. தளை இலக்கணம்';
    if (this.practiceType === 'alahidu' || this.practiceType === 'alagidhal') return '5. முழுமையான அலகிடுதல்';
    return 'இலக்கணப் பயிற்சி';
  }

  selectPlayMode(mode: 'explain' | 'practice') {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    this.playMode = mode;
    this.feedbackMessage = null;

    if (mode === 'practice') {
      this.refreshRandomWord();
    } else {
      this.interactiveWord = '';
      this.selectedWordForPractice = '';
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { step: 'input_word' },
      queryParamsHandling: 'merge'
    });
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        this.isFullscreen = true;
      }).catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          this.isFullscreen = false;
        });
      }
    }
  }

  goBackToInput() {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    let nextStep = 'dashboard_input';
    if (this.isGameMode) {
      nextStep = 'select_mode';
    }

    this.interactiveWord = '';
    this.selectedWordForPractice = '';
    this.interactiveAnalysis = null;
    this.interactiveParts = [];
    this.interactiveValidationResults = [];
    this.interactiveCurrentPartIndex = 0;
    this.hasCheckedInteractiveAsai = false;
    this.interactiveCurrentWordIndex = 0;
    this.interactiveSeerValidationResults = [];
    this.hasCheckedInteractiveSeer = false;
    this.interactiveSeerGuesses = [];
    this.interactiveSeerResults = [];
    this.interactiveSeerOptions = [];
    this.interactiveCurrentThalaiIndex = 0;
    this.interactiveThalaiValidationResults = [];
    this.feedbackMessage = null;

    this.step = nextStep as any;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { step: nextStep },
      queryParamsHandling: 'merge'
    });
  }

  submitUserWord() {
    if (!this.interactiveWord.trim()) {
      this.showFeedback('தயவுசெய்து ஒரு வார்த்தையை உள்ளிடவும்.', 'error');
      return;
    }

    if (this.practiceType === 'eluthu') {
      this.interactiveWord = this.interactiveWord.replace(/\//g, '').trim();
      this.startAnalysis();
      return;
    }

    if (this.playMode === 'explain') {
      this.interactiveWord = this.interactiveWord.replace(/\//g, '').trim();
      this.interactiveAnalysis = this.tamilNLP.analyzeSeiyulLine(this.interactiveWord);
      this.step = 'auto_explain';
    } else {
      // PRACTICE MODE (User inputs split directly)
      const userSplitAttempt = this.interactiveWord.trim();
      const baseWord = userSplitAttempt.replace(/\//g, '').trim();

      this.interactiveAnalysis = this.tamilNLP.analyzeSeiyulLine(baseWord);
      if (!this.interactiveAnalysis || !this.interactiveAnalysis.word_analysis.length) return;

      const correctSplitRaw = this.interactiveAnalysis.word_analysis.map(w => w.asai_text).join(' / ');

      const normalizedUser = userSplitAttempt.replace(/\s+/g, '/').replace(/\/+/g, '/');
      const normalizedCorrect = correctSplitRaw.replace(/\s+/g, '/').replace(/\/+/g, '/');

      if (normalizedUser === normalizedCorrect) {
        this.feedbackMessage = null;
        if (this.practiceType === 'seer') {
          // Move to Seer identification
          this.hasCheckedInteractiveSeer = false;
          this.interactiveSeerGuesses = new Array(this.interactiveAnalysis.word_analysis.length).fill('');
          this.interactiveSeerResults = new Array(this.interactiveAnalysis.word_analysis.length).fill(null);
          this.interactiveSeerOptions = this.interactiveAnalysis.word_analysis.map(w => this.generateSeerOptions(w.seer_pattern, w.asai_groups.length));
          this.step = 'identify_seer';
        } else {
          // Asai Mode -> Move to Asai identification
          this.interactiveParts = normalizedCorrect.split('/');
          this.interactiveCurrentPartIndex = 0;
          this.interactiveValidationResults = [];
          this.hasCheckedInteractiveAsai = false;

          // Initialize the 2D arrays for per-word Asai guessing
          this.interactiveAsaiGuesses = [];
          this.interactiveAsaiResults = [];
          this.interactiveAnalysis.word_analysis.forEach(wordObj => {
            this.interactiveAsaiGuesses.push(new Array(wordObj.asai_groups.length).fill(''));
            this.interactiveAsaiResults.push(new Array(wordObj.asai_groups.length).fill(null));
          });

          // Initialize 1D arrays for per-word Seer guessing
          this.hasCheckedInteractiveSeer = false;
          this.interactiveSeerGuesses = new Array(this.interactiveAnalysis.word_analysis.length).fill('');
          this.interactiveSeerResults = new Array(this.interactiveAnalysis.word_analysis.length).fill(null);
          this.interactiveSeerOptions = this.interactiveAnalysis.word_analysis.map(w => this.generateSeerOptions(w.seer_pattern, w.asai_groups.length));

          this.step = 'analyze_word';
        }
      } else {
        // Wrong split
        const cleanCorrectSplit = correctSplitRaw.replace(/\/+/g, '/');
        const explanationParts = this.interactiveAnalysis.word_analysis.map(w => {
           return w.asai_groups.map(a => `${a.text} (${this.getAsaiExplanation(a.text)})`).join(' / ');
        }).join(' / ');
        this.showFeedback(`தவறான பிரிப்பு! சரியான விடை: ${cleanCorrectSplit}. (விதி: ${explanationParts})`, 'error');
      }
    }
  }

  getAsaiExplanation(asaiText: string): string {
    const letters = this.tamilNLP.splitTamilLetters(asaiText);
    const mathirais = letters.map(l => this.tamilNLP.getMathirai(l));

    // Check for trailing Mei letters that might have been grouped
    // Ner Asai
    if (mathirais.length >= 1 && mathirais[0] === 1) {
      if (mathirais.length === 1) return 'தனிக்குறில்';
      if (mathirais.every((m, i) => i === 0 ? m === 1 : m === 0)) return 'தனிக்குறில் ஒற்று';
    }
    if (mathirais.length >= 1 && mathirais[0] === 2) {
      if (mathirais.length === 1) return 'தனிநெடில்';
      if (mathirais.every((m, i) => i === 0 ? m === 2 : m === 0)) return 'தனிநெடில் ஒற்று';
    }

    // Nirai Asai
    if (mathirais.length >= 2 && mathirais[0] === 1 && mathirais[1] === 1) {
      if (mathirais.length === 2) return 'இருகுறில்';
      if (mathirais.every((m, i) => i < 2 ? m === 1 : m === 0)) return 'இருகுறில் ஒற்று';
    }
    if (mathirais.length >= 2 && mathirais[0] === 1 && mathirais[1] === 2) {
      if (mathirais.length === 2) return 'குறில் நெடில்';
      if (mathirais.every((m, i) => i === 0 ? m === 1 : (i === 1 ? m === 2 : m === 0))) return 'குறில் நெடில் ஒற்று';
    }

    return 'விளக்கம் இல்லை';
  }



  getAllCorrectAsaiGroups() {
    if (!this.interactiveAnalysis) return [];
    return this.interactiveAnalysis.word_analysis.flatMap(w => w.asai_groups);
  }

  selectInteractiveAsaiByWord(wordIndex: number, asaiIndex: number, guess: string) {
    this.interactiveAsaiGuesses[wordIndex][asaiIndex] = guess;
  }

  checkAllAsais() {
    if (!this.interactiveAnalysis) return;
    let allValid = true;
    let anyEmpty = false;

    this.interactiveAnalysis.word_analysis.forEach((wordObj, wIndex) => {
      wordObj.asai_groups.forEach((asai, aIndex) => {
        const guess = this.interactiveAsaiGuesses[wIndex][aIndex];
        if (!guess) {
          anyEmpty = true;
          this.interactiveAsaiResults[wIndex][aIndex] = null;
        } else {
          const isCorrect = asai.type.includes(guess);
          this.interactiveAsaiResults[wIndex][aIndex] = isCorrect;
          if (!isCorrect) allValid = false;
        }
      });
    });

    if (anyEmpty) {
      this.showFeedback('தயவுசெய்து அனைத்து அசைகளுக்கும் விடையளிக்கவும்!', 'error');
      return;
    }

    this.hasCheckedInteractiveAsai = true;
    this.allCorrect = allValid;

    if (allValid) {
      this.feedbackMessage = null;
      if (this.practiceType === 'alahidu' || this.practiceType === 'seer') {
        this.showFeedback(this.practiceType === 'alahidu' ? 'அசை சரியாக பிரிக்கப்பட்டுள்ளது! அடுத்து சீர் கண்டுபிடிப்போம்.' : 'அசை சரி! இப்போது இது என்ன சீர் என்று கண்டுபிடி.', 'success');
        setTimeout(() => {
          this.feedbackMessage = null;
          this.step = 'identify_seer';
          this.interactiveCurrentWordIndex = 0;
          this.interactiveSeerValidationResults = [];
          this.interactiveSeerOptions = this.interactiveAnalysis!.word_analysis.map(w => this.generateSeerOptions(w.seer_pattern, w.asai_groups.length));
          this.cdr.detectChanges();
        }, 1000);
      } else {
        this.showFeedback('வாழ்த்துகள்! நீங்கள் மிகச் சரியாகச் செய்துவிட்டீர்கள்! 🌟', 'success');
        setTimeout(() => {
          this.step = 'result';
          this.practiceCompleted.emit();
          this.cdr.detectChanges();
        }, 1200);
      }
    } else {
      this.showFeedback('சில தவறுகள் உள்ளன. மீண்டும் முயற்சிக்கவும்!', 'error');
    }
  }

  getSeerExplanation(wordObj: any): string {
    if (!wordObj || !wordObj.asai_groups) return '';
    const parts = wordObj.asai_groups.map((a: any) => a.type.replace('அசை', '')).join(' + ');
    return `${parts} = ${wordObj.seer_pattern}`;
  }

  retryInteractiveAsai() {
    this.hasCheckedInteractiveAsai = false;
    this.feedbackMessage = null;
    this.allCorrect = false;
    // reset incorrect ones maybe? Or let them just fix it
  }

  // --- ALAHIDU INTERACTIVE METHODS ---

  generateSeerOptions(correctSeer: string, asaiCount: number): string[] {
    let options: string[] = [];
    if (asaiCount === 1) {
      options = ['நாள்', 'மலர்', 'காசு', 'பிறப்பு'];
    } else if (asaiCount === 2) {
      options = ['தேமா', 'புளிமா', 'கருவிளம்', 'கூவிளம்'];
    } else if (asaiCount === 3) {
      if (correctSeer.includes('கனி')) {
        options = ['தேமாங்கனி', 'புளிமாங்கனி', 'கருவிளங்கனி', 'கூவிளங்கனி'];
      } else {
        options = ['தேமாங்காய்', 'புளிமாங்காய்', 'கருவிளங்காய்', 'கூவிளங்காய்'];
      }
    } else if (asaiCount === 4) {
      if (correctSeer.includes('தண்பூ')) {
        options = ['தேமாந்தண்பூ', 'புளிமாந்தண்பூ', 'கருவிளந்தண்பூ', 'கூவிளந்தண்பூ'];
      } else if (correctSeer.includes('தண்ணிழல்')) {
        options = ['தேமாந்தண்ணிழல்', 'புளிமாந்தண்ணிழல்', 'கருவிளந்தண்ணிழல்', 'கூவிளந்தண்ணிழல்'];
      } else if (correctSeer.includes('நறும்பூ')) {
        options = ['தேமாநறும்பூ', 'புளிமாநறும்பூ', 'கருவிளநறும்பூ', 'கூவிளநறும்பூ'];
      } else {
        options = ['தேமாநறுநிழல்', 'புளிமாநறுநிழல்', 'கருவிளநறுநிழல்', 'கூவிளநறுநிழல்'];
      }
    }

    // Fallback if empty or unknown (just in case)
    if (options.length === 0) options = [correctSeer];

    // Shuffle options using Fisher-Yates
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }
    return options;
  }

  selectInteractiveSeerByWord(wordIndex: number, seerGuess: string) {
    this.interactiveSeerGuesses[wordIndex] = seerGuess;
  }

  checkAllSeers() {
    if (!this.interactiveAnalysis) return;
    let allValid = true;
    let anyEmpty = false;

    this.interactiveAnalysis.word_analysis.forEach((wordObj, wIndex) => {
      const guess = this.interactiveSeerGuesses[wIndex];
      if (!guess) {
        anyEmpty = true;
        this.interactiveSeerResults[wIndex] = null;
      } else {
        const isCorrect = guess === wordObj.seer_pattern;
        this.interactiveSeerResults[wIndex] = isCorrect;
        if (!isCorrect) allValid = false;
      }
    });

    if (anyEmpty) {
      this.showFeedback('தயவுசெய்து அனைத்து வார்த்தைகளுக்கும் சீர் கண்டுபிடிக்கவும்!', 'error');
      return;
    }

    this.hasCheckedInteractiveSeer = true;
    this.allCorrect = allValid;

    if (allValid) {
      if (this.interactiveAnalysis.thalai_analysis.length > 0) {
        this.showFeedback('அற்புதம்! சீர்கள் சரியாக உள்ளன. அடுத்து தளை கண்டுபிடிப்போம்.', 'success');
        setTimeout(() => {
          this.step = 'identify_thalai';
          this.interactiveCurrentThalaiIndex = 0;
          this.interactiveThalaiValidationResults = [];
          this.cdr.detectChanges();
        }, 1000);
      } else {
        this.showFeedback('வாழ்த்துகள்! நீங்கள் மிகச் சரியாகச் செய்துவிட்டீர்கள்! 🌟', 'success');
        setTimeout(() => {
          this.step = 'result';
          this.practiceCompleted.emit();
          this.cdr.detectChanges();
        }, 1200);
      }
    } else {
      this.showFeedback('சில தவறுகள் உள்ளன. மீண்டும் முயற்சிக்கவும்!', 'error');
    }
  }

  retryInteractiveSeer() {
    this.hasCheckedInteractiveSeer = false;
    this.feedbackMessage = null;
    this.allCorrect = false;
  }

  selectInteractiveThalai(thalaiGuess: string) {
    if (!this.interactiveAnalysis) return;
    const thalais = this.interactiveAnalysis.thalai_analysis;
    if (this.interactiveCurrentThalaiIndex >= thalais.length) return;

    const currentThalai = thalais[this.interactiveCurrentThalaiIndex];
    const isCorrect = currentThalai.thalai_type === thalaiGuess;

    this.interactiveThalaiValidationResults.push({
      firstWord: currentThalai.first_word,
      secondWord: currentThalai.second_word,
      expectedThalai: currentThalai.thalai_type,
      userGuess: thalaiGuess,
      isCorrect: isCorrect
    });

    if (isCorrect) {
      this.showFeedback('சரியான தளை!', 'success');
    } else {
      this.showFeedback(`தவறான விடை! சரியான தளை: ${currentThalai.thalai_type}. (விதி: ${currentThalai.first_seer_type} முன் ${currentThalai.second_word_first_asai} வந்தால் ${currentThalai.thalai_type} வரும்.)`, 'error');
    }

    this.interactiveCurrentThalaiIndex++;

    if (this.interactiveCurrentThalaiIndex >= thalais.length) {
      const allThalaiCorrect = this.interactiveThalaiValidationResults.every(r => r.isCorrect);
      this.allCorrect = allThalaiCorrect;
      if (allThalaiCorrect) {
        this.showFeedback('வாழ்த்துகள்! நீங்கள் மிகச் சரியாகச் செய்துவிட்டீர்கள்! 🌟', 'success');
        // Module completion is tracked server-side only — no localStorage caching

        setTimeout(() => {
          this.step = 'result';
          this.practiceCompleted.emit();
          this.cdr.detectChanges();
        }, 1200);
      } else {
        this.showFeedback('சில தவறுகள் உள்ளன. மீண்டும் தளைகளை முயற்சிக்கவும்.', 'error');
      }
    }
  }

  retryInteractiveThalai() {
    this.interactiveCurrentThalaiIndex = 0;
    this.interactiveThalaiValidationResults = [];
    this.feedbackMessage = null;
    this.allCorrect = false;
  }

  interactiveCharAnalysis: { char: string, type: string, mathirai: number }[] = [];

  startAnalysis() {
    this.step = 'analyze_word';
    this.interactiveAnalysis = this.tamilNLP.analyzeSeiyulLine(this.interactiveWord);

    if (this.practiceType === 'eluthu') {
      this.allCorrect = true;
      // Compute character breakdown for Eluthu
      const letters = this.tamilNLP.splitTamilLetters(this.interactiveWord.replace(/\s+/g, ''));
      this.interactiveCharAnalysis = letters.map(l => {
        const m = this.tamilNLP.getMathirai(l);
        let t: string;
        let displayM: number;
        if (l === 'ஃ') {
          t = 'ஆய்தம்';
          displayM = 0.5;
        } else if (m === 1) {
          t = 'குறில்';
          displayM = 1;
        } else if (m === 2) {
          t = 'நெடில்';
          displayM = 2;
        } else {
          // மெய் letters (க், ச், etc.) → 0 mathirai → shown as 1/2
          t = 'மெய்';
          displayM = 0.5;
        }
        return { char: l, type: t, mathirai: displayM };
      });
    }
  }

  selectPracticeArea(areaId: string) {
    this.activeTab = areaId;
    this.step = 'dashboard_input';
    this.userInput = ''; // clear input for fresh start, or we could keep it. Let's clear for clean UX.
    this.analysisResult = null;

    if (!this.isGameMode) {
      // Just check game mode without forcing fullscreen
    }
  }

  goBackToDashboardMenu() {
    this.step = 'dashboard_menu';
    this.analysisResult = null;
  }

  selectTab(tabId: string) {
    this.activeTab = tabId;
  }

  startPracticeFromDashboard() {
    if (!this.userInput.trim()) {
      this.showFeedback('தயவுசெய்து ஒரு வார்த்தையை உள்ளிடவும்.', 'error');
      return;
    }

    // Convert active dashboard tab to practice type
    this.practiceType = this.activeTab;
    this.interactiveWord = this.userInput;
    this.playMode = 'practice';

    this.submitUserWord();
  }

  analyzeText() {
    if (!this.userInput.trim()) {
      this.analysisResult = null;
      return;
    }
    this.analysisResult = this.tamilNLP.analyzeSeiyulLine(this.userInput);
  }



  continueToActivity() {
    this.practiceCompleted.emit();
  }

  private showFeedback(message: string, type: 'success' | 'error') {
    this.feedbackMessage = message;
    this.feedbackType = type;
    setTimeout(() => {
      this.feedbackMessage = null;
    }, type === 'error' ? 6000 : 4000);
  }

  private shuffleArray<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}