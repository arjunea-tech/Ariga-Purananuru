import { Component, Input, Output, EventEmitter, OnInit, signal, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface CrosswordWord {
  word: string;
  clue: string;
  row: number; // 1-indexed starting row
  col: number; // 1-indexed starting column
  direction: 'across' | 'down';
}

export interface CrosswordData {
  id?: number;
  gridSize?: number;
  words: CrosswordWord[];
  explanation?: string;
}

interface GridCell {
  row: number;
  col: number;
  isActive: boolean;
  correctLetter: string;
  userLetter: string;
  numberLabel: number | null;
  acrossClueIndex: number | null;
  downClueIndex: number | null;
  isValidated: boolean;
  isCorrect: boolean;
}

interface ClueDisplay {
  index: number;
  number: number;
  word: string;
  clue: string;
  row: number;
  col: number;
  direction: 'across' | 'down';
  cells: { row: number, col: number }[];
}

@Component({
  selector: 'app-activity-crossword',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './crossword.html',
  styleUrls: ['./crossword.css']
})
export class CrosswordComponent implements OnInit, OnChanges {
  @Input() activity: CrosswordData | null = null;
  @Input() showFeedback: boolean = true;

  @Output() answered = new EventEmitter<{ isCorrect: boolean }>();

  gridSize = signal<number>(10);
  grid = signal<GridCell[][]>([]);
  acrossClues = signal<ClueDisplay[]>([]);
  downClues = signal<ClueDisplay[]>([]);
  
  selectedClue = signal<ClueDisplay | null>(null);
  selectedCell = signal<GridCell | null>(null);
  
  hasSubmitted = signal<boolean>(false);
  isSolved = signal<boolean>(false);

  ngOnInit(): void {
    this.buildCrossword();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['activity']) {
      this.buildCrossword();
    }
  }

  buildCrossword(): void {
    if (!this.activity || !this.activity.words) return;

    const size = this.activity.gridSize || 10;
    this.gridSize.set(size);
    this.hasSubmitted.set(false);
    this.isSolved.set(false);
    this.selectedClue.set(null);
    this.selectedCell.set(null);

    // Initialize 2D grid
    const tempGrid: GridCell[][] = [];
    for (let r = 0; r < size; r++) {
      const rowArr: GridCell[] = [];
      for (let c = 0; c < size; c++) {
        rowArr.push({
          row: r + 1,
          col: c + 1,
          isActive: false,
          correctLetter: '',
          userLetter: '',
          numberLabel: null,
          acrossClueIndex: null,
          downClueIndex: null,
          isValidated: false,
          isCorrect: false
        });
      }
      tempGrid.push(rowArr);
    }

    const words = this.activity.words;
    
    // Sort words by coordinates so we assign number labels consistently (top-left first)
    const sortedWords = [...words].sort((a, b) => {
      if (a.row !== b.row) return a.row - b.row;
      return a.col - b.col;
    });

    // We assign sequence numbers based on starting grid intersections
    const startNumberMap = new Map<string, number>();
    let numSequence = 1;

    // First, map start cell coordinates to Clue Numbers
    sortedWords.forEach(w => {
      const coordKey = `${w.row}-${w.col}`;
      if (!startNumberMap.has(coordKey)) {
        startNumberMap.set(coordKey, numSequence++);
      }
    });

    const tempAcrossClues: ClueDisplay[] = [];
    const tempDownClues: ClueDisplay[] = [];

    // Lay words onto our grid
    words.forEach((w, index) => {
      const startNum = startNumberMap.get(`${w.row}-${w.col}`) || 0;
      const wordStr = w.word.toUpperCase().replace(/\s/g, '');
      const cellsList: { row: number, col: number }[] = [];

      for (let i = 0; i < wordStr.length; i++) {
        const rowIdx = w.direction === 'down' ? (w.row - 1 + i) : (w.row - 1);
        const colIdx = w.direction === 'across' ? (w.col - 1 + i) : (w.col - 1);

        // Protect grid boundary issues
        if (rowIdx >= 0 && rowIdx < size && colIdx >= 0 && colIdx < size) {
          const cell = tempGrid[rowIdx][colIdx];
          cell.isActive = true;
          cell.correctLetter = wordStr[i];
          
          if (i === 0) {
            cell.numberLabel = startNum;
          }

          if (w.direction === 'across') {
            cell.acrossClueIndex = index;
          } else {
            cell.downClueIndex = index;
          }

          cellsList.push({ row: rowIdx + 1, col: colIdx + 1 });
        }
      }

      const clueDisplay: ClueDisplay = {
        index,
        number: startNum,
        word: wordStr,
        clue: w.clue,
        row: w.row,
        col: w.col,
        direction: w.direction,
        cells: cellsList
      };

      if (w.direction === 'across') {
        tempAcrossClues.push(clueDisplay);
      } else {
        tempDownClues.push(clueDisplay);
      }
    });

    this.grid.set(tempGrid);
    // Sort displaying lists by Clue Number
    this.acrossClues.set(tempAcrossClues.sort((a, b) => a.number - b.number));
    this.downClues.set(tempDownClues.sort((a, b) => a.number - b.number));
  }

  // Interactive hooks
  onCellClick(cell: GridCell): void {
    this.selectedCell.set(cell);

    // Determine clue to select based on cell affiliations
    const hasAcross = cell.acrossClueIndex !== null;
    const hasDown = cell.downClueIndex !== null;
    
    let currentClue = this.selectedClue();

    if (hasAcross && hasDown) {
      // Toggle orientation if clicking the same cell
      if (currentClue && currentClue.direction === 'across') {
        this.selectedClue.set(this.getClueByIndex(cell.downClueIndex!, 'down'));
      } else {
        this.selectedClue.set(this.getClueByIndex(cell.acrossClueIndex!, 'across'));
      }
    } else if (hasAcross) {
      this.selectedClue.set(this.getClueByIndex(cell.acrossClueIndex!, 'across'));
    } else if (hasDown) {
      this.selectedClue.set(this.getClueByIndex(cell.downClueIndex!, 'down'));
    }
  }

  onCellInput(event: any, cell: GridCell, inputElem: HTMLInputElement): void {
    const val = event.target.value.toUpperCase();
    cell.userLetter = val;

    if (val) {
      // Input filled: advance focus
      this.advanceFocus(cell, 1);
    }
  }

  onCellKeydown(event: KeyboardEvent, cell: GridCell): void {
    if (event.key === 'Backspace') {
      if (!cell.userLetter) {
        // Empty cell: backspace travels back
        event.preventDefault();
        this.advanceFocus(cell, -1);
      } else {
        // Let standard backspace clear the input
        cell.userLetter = '';
      }
      this.hasSubmitted.set(false); // Reset check status when modifying
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.travelFocus(cell.row, cell.col + 1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.travelFocus(cell.row, cell.col - 1);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.travelFocus(cell.row + 1, cell.col);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.travelFocus(cell.row - 1, cell.col);
    }
  }

  selectClue(clue: ClueDisplay): void {
    this.selectedClue.set(clue);
    
    // Focus first cell of this clue
    if (clue.cells && clue.cells.length > 0) {
      const first = clue.cells[0];
      const cell = this.getCellAt(first.row, first.col);
      if (cell) {
        this.selectedCell.set(cell);
        this.focusInputElement(first.row, first.col);
      }
    }
  }

  // Clue solved validator (client helper check)
  isClueSolved(clue: ClueDisplay): boolean {
    return clue.cells.every(coord => {
      const cell = this.getCellAt(coord.row, coord.col);
      return cell && cell.userLetter.toUpperCase() === cell.correctLetter.toUpperCase();
    });
  }

  // Answer validation check trigger
  checkAnswers(): void {
    let allCorrect = true;
    const size = this.gridSize();
    const currentGrid = this.grid();

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const cell = currentGrid[r][c];
        if (cell.isActive) {
          cell.isValidated = true;
          const matches = cell.userLetter.trim().toUpperCase() === cell.correctLetter;
          cell.isCorrect = matches;
          if (!matches) {
            allCorrect = false;
          }
        }
      }
    }

    this.hasSubmitted.set(true);
    
    if (allCorrect) {
      this.isSolved.set(true);
      this.answered.emit({ isCorrect: true });
    }
  }

  resetPuzzle(): void {
    const size = this.gridSize();
    const currentGrid = this.grid();

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const cell = currentGrid[r][c];
        cell.userLetter = '';
        cell.isValidated = false;
        cell.isCorrect = false;
      }
    }

    this.hasSubmitted.set(false);
    this.isSolved.set(false);
    this.selectedClue.set(null);
    this.selectedCell.set(null);
  }

  // Highlight helper getters
  isCellHighlighted(cell: GridCell): boolean {
    const activeClue = this.selectedClue();
    if (!activeClue) return false;

    return activeClue.cells.some(c => c.row === cell.row && c.col === cell.col);
  }

  isCellFocused(cell: GridCell): boolean {
    const focused = this.selectedCell();
    return focused !== null && focused.row === cell.row && focused.col === cell.col;
  }

  // Direction-based auto-travel
  private advanceFocus(cell: GridCell, delta: number): void {
    const clue = this.selectedClue();
    if (!clue) return;

    const cellIdx = clue.cells.findIndex(c => c.row === cell.row && c.col === cell.col);
    if (cellIdx !== -1) {
      const nextIdx = cellIdx + delta;
      if (nextIdx >= 0 && nextIdx < clue.cells.length) {
        const nextCoord = clue.cells[nextIdx];
        const nextCell = this.getCellAt(nextCoord.row, nextCoord.col);
        if (nextCell) {
          this.selectedCell.set(nextCell);
          this.focusInputElement(nextCoord.row, nextCoord.col);
        }
      }
    }
  }

  private travelFocus(row: number, col: number): void {
    const cell = this.getCellAt(row, col);
    if (cell && cell.isActive) {
      this.selectedCell.set(cell);
      this.focusInputElement(row, col);
      
      // Update matching clue selection contextually if available
      if (this.selectedClue()?.direction === 'across' && cell.acrossClueIndex !== null) {
        this.selectedClue.set(this.getClueByIndex(cell.acrossClueIndex, 'across'));
      } else if (this.selectedClue()?.direction === 'down' && cell.downClueIndex !== null) {
        this.selectedClue.set(this.getClueByIndex(cell.downClueIndex, 'down'));
      }
    }
  }

  // Focus utility
  private focusInputElement(row: number, col: number): void {
    setTimeout(() => {
      const activeCell = document.querySelector(`.crossword-grid > div:nth-child(${((row - 1) * this.gridSize()) + col}) input`) as HTMLInputElement;
      if (activeCell) {
        activeCell.focus();
        activeCell.select();
      }
    }, 10);
  }

  // Getters
  private getCellAt(row: number, col: number): GridCell | null {
    const size = this.gridSize();
    if (row < 1 || row > size || col < 1 || col > size) return null;
    return this.grid()[row - 1][col - 1];
  }

  private getClueByIndex(idx: number, direction: 'across' | 'down'): ClueDisplay | null {
    const list = direction === 'across' ? this.acrossClues() : this.downClues();
    return list.find(c => c.index === idx) || null;
  }
}
