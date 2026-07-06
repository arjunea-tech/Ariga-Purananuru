import { Injectable } from '@angular/core';

export interface AsaiGroup {
  text: string;
  type: string; // 'நேர்' or 'நிரை'
}

export interface WordAnalysis {
  word: string;
  asai_groups: AsaiGroup[];
  asai_types: string[];
  asai_text: string; // e.g. "அகழ்/வா/ரைத்"
  seer_pattern: string; // e.g. "புளிமாங்காய்"
  asai_type_text: string; // e.g. "நிரை நேர் நேர்"
}

export interface ThalaiAnalysis {
  first_word: string;
  second_word: string;
  first_seer: string;
  first_seer_type: string;
  second_word_first_asai: string;
  thalai_type: string;
}

export interface SeiyulAnalysis {
  word_analysis: WordAnalysis[];
  thalai_analysis: ThalaiAnalysis[];
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TamilNLPService {

  private readonly MEI_LETTERS = ['க்', 'ங்', 'ச்', 'ஞ்', 'ட்', 'ண்', 'த்', 'ந்', 'ப்', 'ம்', 'ய்', 'ர்', 'ல்', 'வ்', 'ழ்', 'ள்', 'ற்', 'ன்'];
  private readonly NEDIL_LETTERS = ['ஆ', 'ஈ', 'ஊ', 'ஏ', 'ஐ', 'ஓ', 'ஔ'];
  private readonly NEDIL_COMBINATIONS = ['ா', 'ீ', 'ூ', 'ே', 'ை', 'ோ', 'ௌ'];

  constructor() { }

  splitTamilLetters(str: string): string[] {
    const letters: string[] = [];
    let i = 0;
    while (i < str.length) {
      if (i + 1 < str.length) {
        if (['்', 'ா', 'ி', 'ீ', 'ு', 'ூ', 'ெ', 'ே', 'ை', 'ொ', 'ோ', 'ௌ'].includes(str[i + 1])) {
          letters.push(str.substring(i, i + 2));
          i += 2;
          continue;
        }
      }
      letters.push(str[i]);
      i += 1;
    }
    return letters;
  }

  getMathirai(letter: string): number {
    if (this.MEI_LETTERS.includes(letter) || letter.includes('்')) {
      return 0;
    } else if (this.NEDIL_LETTERS.includes(letter)) {
      return 2;
    } else {
      for (const combo of this.NEDIL_COMBINATIONS) {
        if (letter.includes(combo)) {
          return 2;
        }
      }
      return 1;
    }
  }

  identifyAsai(word: string): AsaiGroup[] {
    const letters = this.splitTamilLetters(word);
    const mathirai = letters.map(l => this.getMathirai(l));
    const asai_groups: AsaiGroup[] = [];
    let i = 0;

    while (i < letters.length) {
      const curr = mathirai[i];

      if (curr === 2) {
        if (i + 2 < letters.length && mathirai[i + 1] === 0 && mathirai[i + 2] === 0) {
          asai_groups.push({ text: letters.slice(i, i + 3).join(''), type: 'நேர்' });
          i += 3;
        } else if (i + 1 < letters.length && mathirai[i + 1] === 0) {
          asai_groups.push({ text: letters.slice(i, i + 2).join(''), type: 'நேர்' });
          i += 2;
        } else {
          asai_groups.push({ text: letters[i], type: 'நேர்' });
          i += 1;
        }
      } else if (curr === 1) {
        if (i + 3 < letters.length && [1, 2].includes(mathirai[i + 1]) && mathirai[i + 2] === 0 && mathirai[i + 3] === 0) {
          asai_groups.push({ text: letters.slice(i, i + 4).join(''), type: 'நிரை' });
          i += 4;
          continue;
        }
        if (i + 2 < letters.length && [1, 2].includes(mathirai[i + 1]) && mathirai[i + 2] === 0) {
          asai_groups.push({ text: letters.slice(i, i + 3).join(''), type: 'நிரை' });
          i += 3;
          continue;
        }
        if (i + 1 < letters.length && [1, 2].includes(mathirai[i + 1])) {
          asai_groups.push({ text: letters.slice(i, i + 2).join(''), type: 'நிரை' });
          i += 2;
          continue;
        }
        if (i + 2 < letters.length && mathirai[i + 1] === 0 && mathirai[i + 2] === 0) {
          asai_groups.push({ text: letters.slice(i, i + 3).join(''), type: 'நேர்' });
          i += 3;
        } else if (i + 1 < letters.length && mathirai[i + 1] === 0) {
          asai_groups.push({ text: letters.slice(i, i + 2).join(''), type: 'நேர்' });
          i += 2;
        } else {
          asai_groups.push({ text: letters[i], type: 'நேர்' });
          i += 1;
        }
      } else if (curr === 0) {
        if (i + 1 < letters.length) {
          asai_groups.push({ text: letters.slice(i, i + 2).join(''), type: 'நேர்' });
          i += 2;
        } else {
          asai_groups.push({ text: letters[i], type: 'நேர்' });
          i += 1;
        }
      }
    }
    return asai_groups;
  }

  // Compatibility function for PracticeEngine Component
  splitTamilWordIntoSyllables(word: string): string[] {
    return this.identifyAsai(word).map(a => a.text);
  }

  // Compatibility function for PracticeEngine Component
  classifySyllable(syllable: string): string {
    const groups = this.identifyAsai(syllable);
    return groups.length > 0 ? groups[0].type : 'நேர்';
  }

  validateSeerPattern(asaiTypes: string[]): string {
    const pattern = JSON.stringify(asaiTypes);
    const rules: { [key: string]: string } = {
      '["நேர்"]': 'நாள்',
      '["நிரை"]': 'மலர்',
      '["நேர்பு"]': 'காசு',
      '["நிரைபு"]': 'பிறப்பு',
      '["நேர்","நேர்"]': 'தேமா',
      '["நிரை","நேர்"]': 'புளிமா',
      '["நேர்","நிரை"]': 'கூவிளம்',
      '["நிரை","நிரை"]': 'கருவிளம்',
      '["நேர்","நேர்","நேர்"]': 'தேமாங்காய்',
      '["நிரை","நேர்","நேர்"]': 'புளிமாங்காய்',
      '["நிரை","நிரை","நேர்"]': 'கருவிளங்காய்',
      '["நேர்","நிரை","நேர்"]': 'கூவிளங்காய்',
      '["நேர்","நேர்","நிரை"]': 'தேமாங்கனி',
      '["நிரை","நேர்","நிரை"]': 'புளிமாங்கனி',
      '["நிரை","நிரை","நிரை"]': 'கருவிளங்கனி',
      '["நேர்","நிரை","நிரை"]': 'கூவிளங்கனி',
      '["நேர்","நேர்","நேர்","நேர்"]': 'தேமாந்தண்பூ',
      '["நிரை","நேர்","நேர்","நேர்"]': 'புளிமாந்தண்பூ',
      '["நிரை","நிரை","நேர்","நேர்"]': 'கருவிளந்தண்பூ',
      '["நேர்","நிரை","நேர்","நேர்"]': 'கூவிளந்தண்பூ',
      '["நேர்","நேர்","நேர்","நிரை"]': 'தேமாந்தண்ணிழல்',
      '["நிரை","நேர்","நேர்","நிரை"]': 'புளிமாந்தண்ணிழல்',
      '["நிரை","நிரை","நேர்","நிரை"]': 'கருவிளந்தண்ணிழல்',
      '["நேர்","நிரை","நேர்","நிரை"]': 'கூவிளந்தண்ணிழல்',
      '["நேர்","நேர்","நிரை","நேர்"]': 'தேமாநறும்பூ',
      '["நிரை","நேர்","நிரை","நேர்"]': 'புளிமாநறும்பூ',
      '["நிரை","நிரை","நிரை","நேர்"]': 'கருவிளநறும்பூ',
      '["நேர்","நிரை","நிரை","நேர்"]': 'கூவிளநறும்பூ',
      '["நேர்","நேர்","நிரை","நிரை"]': 'தேமாநறுநிழல்',
      '["நிரை","நேர்","நிரை","நிரை"]': 'புளிமாநறுநிழல்',
      '["நிரை","நிரை","நிரை","நிரை"]': 'கருவிளநறுநிழல்',
      '["நேர்","நிரை","நிரை","நிரை"]': 'கூவிளநறுநிழல்'
    };
    return rules[pattern] || 'Unknown';
  }

  identifySeerTypeForThalai(seerName: string): string {
    if (!seerName || seerName === 'Unknown') return 'unknown';
    
    if (seerName.includes('காய்')) return 'காய்';
    if (seerName === 'தேமா' || seerName === 'புளிமா' || (seerName.includes('மா') && !seerName.includes('காய்'))) return 'மா';
    if (seerName.includes('விளம்')) return 'விளம்';
    if (seerName.includes('கனி')) return 'கனி';
    
    if (seerName === 'மலர்') return 'நிரை';
    if (seerName === 'நாள்') return 'நேர்';
    
    return 'unknown';
  }

  identifyThalai(firstSeerType: string, secondSeerFirstAsai: string): string {
    if (!firstSeerType || !secondSeerFirstAsai) return 'Unknown';

    const isNer = secondSeerFirstAsai === 'நேர்';
    const isNirai = secondSeerFirstAsai === 'நிரை';

    if (firstSeerType === 'காய்' && isNer) return 'வெண்சீர் வெண்டளை';
    if (firstSeerType === 'மா' && isNirai) return 'இயற்சீர் வெண்டளை';
    if (firstSeerType === 'மா' && isNer) return 'நேரொன்று ஆசிரியத்தளை';
    if (firstSeerType === 'விளம்' && isNirai) return 'நிரையொன்று ஆசிரியத்தளை';
    if (firstSeerType === 'விளம்' && isNer) return 'இயற்சீர் வெண்டளை';
    if (firstSeerType === 'காய்' && isNirai) return 'கலித்தளை';
    if (firstSeerType === 'கனி' && isNer) return 'ஒன்றாத வஞ்சித்தளை';
    if (firstSeerType === 'கனி' && isNirai) return 'ஒன்றிய வஞ்சித்தளை';

    return 'Unknown';
  }

  analyzeSeiyulLine(line: string): SeiyulAnalysis {
    const cleanedLine = line.replace(/\n/g, ' ');
    const words = cleanedLine.trim().split(/\s+/).filter(w => w.length > 0);
    
    if (words.length === 0) {
      return { word_analysis: [], thalai_analysis: [], error: 'No words to analyze' };
    }

    const word_analysis: WordAnalysis[] = [];
    const seer_names: string[] = [];

    for (const word of words) {
      const asai_groups = this.identifyAsai(word);
      const asai_types = asai_groups.map(a => a.type);
      const asai_text = asai_groups.map(a => a.text).join('/');
      const seer_pattern = this.validateSeerPattern(asai_types);

      word_analysis.push({
        word,
        asai_groups,
        asai_types,
        asai_text,
        seer_pattern,
        asai_type_text: asai_types.join(' ')
      });

      seer_names.push(seer_pattern !== 'Unknown' ? seer_pattern : '');
    }

    const thalai_analysis: ThalaiAnalysis[] = [];
    for (let i = 0; i < words.length - 1; i++) {
      const first_seer = seer_names[i];
      const first_seer_type = this.identifySeerTypeForThalai(first_seer);
      
      const second_word_first_asai = word_analysis[i + 1].asai_groups.length > 0 
        ? word_analysis[i + 1].asai_groups[0].type 
        : '';

      if (first_seer && second_word_first_asai) {
        const thalai_type = this.identifyThalai(first_seer_type, second_word_first_asai);
        thalai_analysis.push({
          first_word: words[i],
          second_word: words[i + 1],
          first_seer,
          first_seer_type,
          second_word_first_asai,
          thalai_type
        });
      }
    }

    return { word_analysis, thalai_analysis };
  }
}
