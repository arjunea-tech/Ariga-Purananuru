export const ASAI = { NEER: 'நேர்', NIRAI: 'நிரை' };

export interface Seer {
  name: string;
  pattern: string[];
  mnemonic: string;
  fruit: string;
}

export const SEERS_2: Seer[] = [
  { name: 'தேமா', pattern: [ASAI.NEER, ASAI.NEER], mnemonic: 'தே=நேர், மா=நேர்', fruit: '🥭' },
  { name: 'புளிமா', pattern: [ASAI.NIRAI, ASAI.NEER], mnemonic: 'புளி=நிரை, மா=நேர்', fruit: '🍋' },
  { name: 'கூவிளம்', pattern: [ASAI.NEER, ASAI.NIRAI], mnemonic: 'கூ=நேர், விளம்=நிரை', fruit: '🍈' },
  { name: 'கருவிளம்', pattern: [ASAI.NIRAI, ASAI.NIRAI], mnemonic: 'கரு=நிரை, விளம்=நிரை', fruit: '🫐' },
];

export const SEERS_3: Seer[] = [
  { name: 'தேமாங்காய்', pattern: [ASAI.NEER, ASAI.NEER, ASAI.NEER], mnemonic: 'நேர் நேர் நேர்', fruit: '🥭' },
  { name: 'புளிமாங்காய்', pattern: [ASAI.NIRAI, ASAI.NEER, ASAI.NEER], mnemonic: 'நிரை நேர் நேர்', fruit: '🍋' },
  { name: 'கூவிளங்காய்', pattern: [ASAI.NEER, ASAI.NIRAI, ASAI.NEER], mnemonic: 'நேர் நிரை நேர்', fruit: '🍈' },
  { name: 'கருவிளங்காய்', pattern: [ASAI.NIRAI, ASAI.NIRAI, ASAI.NEER], mnemonic: 'நிரை நிரை நேர்', fruit: '🫐' },
  { name: 'தேமாங்கனி', pattern: [ASAI.NEER, ASAI.NEER, ASAI.NIRAI], mnemonic: 'நேர் நேர் நிரை', fruit: '🥭' },
  { name: 'புளிமாங்கனி', pattern: [ASAI.NIRAI, ASAI.NEER, ASAI.NIRAI], mnemonic: 'நிரை நேர் நிரை', fruit: '🍋' },
  { name: 'கூவிளங்கனி', pattern: [ASAI.NEER, ASAI.NIRAI, ASAI.NIRAI], mnemonic: 'நேர் நிரை நிரை', fruit: '🍈' },
  { name: 'கருவிளங்கனி', pattern: [ASAI.NIRAI, ASAI.NIRAI, ASAI.NIRAI], mnemonic: 'நிரை நிரை நிரை', fruit: '🫐' },
];

export const ALL_SEERS = [...SEERS_2, ...SEERS_3];

/**
 * Extracts dynamic Seer data from the database payload (activity.text_content).
 * Falls back to hardcoded defaults if missing or invalid.
 */
export function getSeersData(activity: any): { seers_2: Seer[], seers_3: Seer[], all_seers: Seer[] } {
  let s2 = SEERS_2;
  let s3 = SEERS_3;

  try {
    if (activity && activity.text_content) {
      const parsed = typeof activity.text_content === 'string' ? JSON.parse(activity.text_content) : activity.text_content;
      if (parsed.seers_2 && Array.isArray(parsed.seers_2) && parsed.seers_2.length > 0) {
        s2 = parsed.seers_2;
      }
      if (parsed.seers_3 && Array.isArray(parsed.seers_3) && parsed.seers_3.length > 0) {
        s3 = parsed.seers_3;
      }
    }
  } catch (e) {
    console.warn('Failed to parse dynamic yappu-seer data, using fallback.', e);
  }

  return { seers_2: s2, seers_3: s3, all_seers: [...s2, ...s3] };
}
