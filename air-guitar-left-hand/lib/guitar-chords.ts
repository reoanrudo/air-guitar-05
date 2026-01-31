/**
 * ギターコードのデータ構造と定義
 * 初心者向けの基本的なコードをサポート
 */

export interface ChordFingering {
  /** フレット番号（0 = 開放弦、-1 = ミュート） */
  fret: number;
  /** 弦番号（1-6、1が最も細い弦） */
  string: number;
  /** 使用する指（1=人差し指, 2=中指, 3=薬指, 4=小指, 0=開放弦） */
  finger: number;
}

export interface GuitarChord {
  /** コード名（例: "C", "G", "Am"） */
  name: string;
  /** コードの表示名（日本語含む） */
  displayName: string;
  /** フィンガリング情報 */
  fingering: ChordFingering[];
  /** コードの難易度（1-5） */
  difficulty: number;
  /** コードタイプ（メジャー、マイナー、セブンスなど） */
  type: "major" | "minor" | "seventh";
}

/**
 * 初心者向けギターコードの定義
 * 各コードは6弦から1弦の順で定義
 */
export const BEGINNER_CHORDS: GuitarChord[] = [
  {
    name: "C",
    displayName: "C (ド)",
    difficulty: 2,
    type: "major",
    fingering: [
      { string: 6, fret: -1, finger: 0 }, // ミュート
      { string: 5, fret: 3, finger: 3 },  // 薬指
      { string: 4, fret: 2, finger: 2 },  // 中指
      { string: 3, fret: 0, finger: 0 },  // 開放
      { string: 2, fret: 1, finger: 1 },  // 人差し指
      { string: 1, fret: 0, finger: 0 },  // 開放
    ],
  },
  {
    name: "G",
    displayName: "G (ソ)",
    difficulty: 2,
    type: "major",
    fingering: [
      { string: 6, fret: 3, finger: 2 },  // 中指
      { string: 5, fret: 2, finger: 1 },  // 人差し指
      { string: 4, fret: 0, finger: 0 },  // 開放
      { string: 3, fret: 0, finger: 0 },  // 開放
      { string: 2, fret: 0, finger: 0 },  // 開放
      { string: 1, fret: 3, finger: 3 },  // 薬指
    ],
  },
  {
    name: "D",
    displayName: "D (レ)",
    difficulty: 2,
    type: "major",
    fingering: [
      { string: 6, fret: -1, finger: 0 }, // ミュート
      { string: 5, fret: -1, finger: 0 }, // ミュート
      { string: 4, fret: 0, finger: 0 },  // 開放
      { string: 3, fret: 2, finger: 1 },  // 人差し指
      { string: 2, fret: 3, finger: 3 },  // 薬指
      { string: 1, fret: 2, finger: 2 },  // 中指
    ],
  },
  {
    name: "Em",
    displayName: "Em (ミ マイナー)",
    difficulty: 1,
    type: "minor",
    fingering: [
      { string: 6, fret: 0, finger: 0 },  // 開放
      { string: 5, fret: 2, finger: 2 },  // 中指
      { string: 4, fret: 2, finger: 3 },  // 薬指
      { string: 3, fret: 0, finger: 0 },  // 開放
      { string: 2, fret: 0, finger: 0 },  // 開放
      { string: 1, fret: 0, finger: 0 },  // 開放
    ],
  },
  {
    name: "Am",
    displayName: "Am (ラ マイナー)",
    difficulty: 1,
    type: "minor",
    fingering: [
      { string: 6, fret: -1, finger: 0 }, // ミュート
      { string: 5, fret: 0, finger: 0 },  // 開放
      { string: 4, fret: 2, finger: 2 },  // 中指
      { string: 3, fret: 2, finger: 3 },  // 薬指
      { string: 2, fret: 1, finger: 1 },  // 人差し指
      { string: 1, fret: 0, finger: 0 },  // 開放
    ],
  },
  {
    name: "F",
    displayName: "F (ファ)",
    difficulty: 4,
    type: "major",
    fingering: [
      { string: 6, fret: 1, finger: 1 },  // 人差し指（バレー）
      { string: 5, fret: 3, finger: 3 },  // 薬指
      { string: 4, fret: 3, finger: 4 },  // 小指
      { string: 3, fret: 2, finger: 2 },  // 中指
      { string: 2, fret: 1, finger: 1 },  // 人差し指（バレー）
      { string: 1, fret: 1, finger: 1 },  // 人差し指（バレー）
    ],
  },
  {
    name: "Dm",
    displayName: "Dm (レ マイナー)",
    difficulty: 2,
    type: "minor",
    fingering: [
      { string: 6, fret: -1, finger: 0 }, // ミュート
      { string: 5, fret: -1, finger: 0 }, // ミュート
      { string: 4, fret: 0, finger: 0 },  // 開放
      { string: 3, fret: 2, finger: 2 },  // 中指
      { string: 2, fret: 3, finger: 3 },  // 薬指
      { string: 1, fret: 1, finger: 1 },  // 人差し指
    ],
  },
  {
    name: "A",
    displayName: "A (ラ)",
    difficulty: 2,
    type: "major",
    fingering: [
      { string: 6, fret: -1, finger: 0 }, // ミュート
      { string: 5, fret: 0, finger: 0 },  // 開放
      { string: 4, fret: 2, finger: 1 },  // 人差し指
      { string: 3, fret: 2, finger: 2 },  // 中指
      { string: 2, fret: 2, finger: 3 },  // 薬指
      { string: 1, fret: 0, finger: 0 },  // 開放
    ],
  },
  {
    name: "E",
    displayName: "E (ミ)",
    difficulty: 1,
    type: "major",
    fingering: [
      { string: 6, fret: 0, finger: 0 },  // 開放
      { string: 5, fret: 2, finger: 2 },  // 中指
      { string: 4, fret: 2, finger: 3 },  // 薬指
      { string: 3, fret: 1, finger: 1 },  // 人差し指
      { string: 2, fret: 0, finger: 0 },  // 開放
      { string: 1, fret: 0, finger: 0 },  // 開放
    ],
  },
];

/**
 * コード名からコード情報を取得
 */
export function getChordByName(name: string): GuitarChord | undefined {
  return BEGINNER_CHORDS.find((chord) => chord.name === name);
}

/**
 * 難易度でソートされたコードリストを取得
 */
export function getChordsSortedByDifficulty(): GuitarChord[] {
  return [...BEGINNER_CHORDS].sort((a, b) => a.difficulty - b.difficulty);
}
