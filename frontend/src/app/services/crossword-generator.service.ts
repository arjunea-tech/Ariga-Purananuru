export interface CrosswordInput {
  word: string;
  clue: string;
}

export interface PlacedWord extends CrosswordInput {
  row: number;
  col: number;
  direction: 'across' | 'down';
}

export interface CrosswordResult {
  gridSize: number;
  words: PlacedWord[];
  unplaced: CrosswordInput[];
}

interface InternalPlacement {
  word: string;
  clue: string;
  x: number; // column
  y: number; // row
  direction: 'across' | 'down';
}

export class CrosswordGenerator {
  
  static generate(inputs: CrosswordInput[]): CrosswordResult {
    if (!inputs || inputs.length === 0) {
      return { gridSize: 10, words: [], unplaced: [] };
    }

    // Clean inputs: uppercase, remove spaces/symbols
    const cleanInputs = inputs.map(i => ({
      word: i.word.toUpperCase().replace(/[^A-Z]/g, ''),
      clue: i.clue,
      originalWord: i.word
    })).filter(i => i.word.length > 0);

    // Sort descending by length
    cleanInputs.sort((a, b) => b.word.length - a.word.length);

    const placements: InternalPlacement[] = [];
    const unplaced: CrosswordInput[] = [];

    // The first word goes in the center (abstract 0,0) across
    const first = cleanInputs.shift()!;
    placements.push({
      word: first.word,
      clue: first.clue,
      x: 0,
      y: 0,
      direction: 'across'
    });

    for (const input of cleanInputs) {
      const best = this.findBestPlacement(input, placements);
      if (best) {
        placements.push(best);
      } else {
        unplaced.push({ word: input.originalWord, clue: input.clue });
      }
    }

    return this.normalizeGrid(placements, unplaced);
  }

  private static findBestPlacement(input: {word: string, clue: string}, existingPlacements: InternalPlacement[]): InternalPlacement | null {
    let bestScore = -Infinity;
    let bestPlacement: InternalPlacement | null = null;

    for (const placed of existingPlacements) {
      // Find all common letters between the new word and the placed word
      for (let i = 0; i < input.word.length; i++) {
        const charInput = input.word[i];
        
        for (let j = 0; j < placed.word.length; j++) {
          const charPlaced = placed.word[j];

          if (charInput === charPlaced) {
            // Determine orientation and starting coords
            const direction = placed.direction === 'across' ? 'down' : 'across';
            let startX = 0;
            let startY = 0;

            if (direction === 'down') {
              // Placed is across. New word intersects it vertically.
              startX = placed.x + j;
              startY = placed.y - i;
            } else {
              // Placed is down. New word intersects it horizontally.
              startX = placed.x - i;
              startY = placed.y + j;
            }

            const candidate: InternalPlacement = {
              word: input.word,
              clue: input.clue,
              x: startX,
              y: startY,
              direction
            };

            if (this.isValidPlacement(candidate, existingPlacements)) {
              // Score based on distance from center (0,0) to keep it compact
              // Less distance = higher score
              const distance = Math.abs(startX) + Math.abs(startY);
              // Also reward more intersections (if we wanted to compute all intersections)
              const score = -distance; 

              if (score > bestScore) {
                bestScore = score;
                bestPlacement = candidate;
              }
            }
          }
        }
      }
    }

    return bestPlacement;
  }

  private static isValidPlacement(candidate: InternalPlacement, existing: InternalPlacement[]): boolean {
    const candidateCells = this.getCells(candidate);
    const existingMap = new Map<string, string>(); // 'x,y' -> 'A'
    const existingCellsSet = new Set<string>();

    for (const p of existing) {
      const cells = this.getCells(p);
      cells.forEach((c: {x: number, y: number, char: string}) => {
        existingMap.set(c.x + ',' + c.y, c.char);
        existingCellsSet.add(c.x + ',' + c.y);
      });
    }

    for (let i = 0; i < candidateCells.length; i++) {
      const cell = candidateCells[i];
      const key = cell.x + ',' + cell.y;

      // 1. If cell is occupied, letters must match
      if (existingMap.has(key)) {
        if (existingMap.get(key) !== cell.char) {
          return false; // Collision with different letter
        }
      } else {
        // 2. Parallel adjacency check (words shouldn't touch side-by-side unless intersecting)
        // If placing across, cells above/below must be empty.
        // If placing down, cells left/right must be empty.
        if (candidate.direction === 'across') {
          if (existingMap.has(cell.x + ',' + (cell.y - 1)) || existingMap.has(cell.x + ',' + (cell.y + 1))) {
            return false;
          }
        } else {
          if (existingMap.has((cell.x - 1) + ',' + cell.y) || existingMap.has((cell.x + 1) + ',' + cell.y)) {
            return false;
          }
        }

        // 3. End-to-end touching check
        // First cell cannot have adjacent block before it in the same direction
        if (i === 0) {
          if (candidate.direction === 'across' && existingMap.has((cell.x - 1) + ',' + cell.y)) return false;
          if (candidate.direction === 'down' && existingMap.has(cell.x + ',' + (cell.y - 1))) return false;
        }
        // Last cell cannot have adjacent block after it in the same direction
        if (i === candidateCells.length - 1) {
          if (candidate.direction === 'across' && existingMap.has((cell.x + 1) + ',' + cell.y)) return false;
          if (candidate.direction === 'down' && existingMap.has(cell.x + ',' + (cell.y + 1))) return false;
        }
      }
    }

    return true;
  }

  private static getCells(placement: InternalPlacement): {x: number, y: number, char: string}[] {
    const cells = [];
    for (let i = 0; i < placement.word.length; i++) {
      cells.push({
        x: placement.direction === 'across' ? placement.x + i : placement.x,
        y: placement.direction === 'down' ? placement.y + i : placement.y,
        char: placement.word[i]
      });
    }
    return cells;
  }

  private static normalizeGrid(placements: InternalPlacement[], unplaced: CrosswordInput[]): CrosswordResult {
    if (placements.length === 0) {
      return { gridSize: 10, words: [], unplaced };
    }

    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    for (const p of placements) {
      const cells = this.getCells(p);
      for (const c of cells) {
        if (c.x < minX) minX = c.x;
        if (c.y < minY) minY = c.y;
        if (c.x > maxX) maxX = c.x;
        if (c.y > maxY) maxY = c.y;
      }
    }

    // Grid bounds
    const width = (maxX - minX) + 1;
    const height = (maxY - minY) + 1;
    
    // Make the grid size a perfect square, adding 1 padding on all sides for aesthetics
    const maxDim = Math.max(width, height);
    const gridSize = maxDim + 2; 

    // Calculate offsets to center the bounding box within the new square grid
    const offsetX = Math.floor((gridSize - width) / 2) - minX;
    const offsetY = Math.floor((gridSize - height) / 2) - minY;

    const normalizedWords: PlacedWord[] = placements.map(p => ({
      word: p.word,
      clue: p.clue,
      // 1-indexed for CSS Grid / Crossword Component
      col: p.x + offsetX + 1,
      row: p.y + offsetY + 1,
      direction: p.direction
    }));

    return {
      gridSize,
      words: normalizedWords,
      unplaced
    };
  }
}
