/** Matches `Lang` from `@/hooks/use-language` — kept local to avoid lib → hooks imports. */
export type Jazz101Lang = 'en' | 'zh';

export type Jazz101Section = {
  id: string;
  title: Record<Jazz101Lang, string>;
  nodes: { id: string; title: Record<Jazz101Lang, string> }[];
};

/** Jazz 101 demo path — sections and nodes (EN / ZH). */
export const JAZZ101_SECTIONS: Jazz101Section[] = [
  {
    id: 'foundation',
    title: {
      en: 'Section 1 — The Foundation',
      zh: '第 1 单元 — 基础',
    },
    nodes: [
      { id: 'n1', title: { en: 'The 12 Notes', zh: '十二个音' } },
      { id: 'n2', title: { en: 'Half Steps and Whole Steps', zh: '半音与全音' } },
      { id: 'n3', title: { en: 'Basic Rhythm and the Beat', zh: '基本节奏与节拍' } },
      { id: 'n4', title: { en: 'Note Values', zh: '音符时值' } },
      { id: 'n5', title: { en: 'Swing Feel', zh: '摇摆感（Swing）' } },
    ],
  },
  {
    id: 'intervals',
    title: {
      en: 'Section 2 — Intervals',
      zh: '第 2 单元 — 音程',
    },
    nodes: [
      { id: 'n6', title: { en: 'Major and Minor Seconds and Thirds', zh: '大小二度与大小三度' } },
      { id: 'n7', title: { en: 'Perfect Fourth and Fifth', zh: '纯四度与纯五度' } },
      { id: 'n8', title: { en: 'Sixths, Sevenths and the Tritone', zh: '六度、七度与三全音' } },
    ],
  },
  {
    id: 'scales',
    title: {
      en: 'Section 3 — Scales',
      zh: '第 3 单元 — 音阶',
    },
    nodes: [
      { id: 'n9', title: { en: 'The Major Scale', zh: '大调音阶' } },
      { id: 'n10', title: { en: 'The Minor Scale', zh: '小调音阶' } },
      { id: 'n11', title: { en: 'Pentatonic and Blues Scale', zh: '五声与布鲁斯音阶' } },
    ],
  },
  {
    id: 'chords',
    title: {
      en: 'Section 4 — Chords',
      zh: '第 4 单元 — 和弦',
    },
    nodes: [
      { id: 'n12', title: { en: 'Triads', zh: '三和弦' } },
      { id: 'n13', title: { en: 'Seventh Chords', zh: '七和弦' } },
      { id: 'n14', title: { en: 'Chords in All 12 Keys', zh: '十二个调上的和弦' } },
    ],
  },
  {
    id: 'jazz-core',
    title: {
      en: 'Section 5 — The Jazz Core',
      zh: '第 5 单元 — 爵士核心',
    },
    nodes: [
      { id: 'n15', title: { en: 'The ii V I', zh: 'ii–V–I' } },
      { id: 'n16', title: { en: 'The 12 Bar Blues', zh: '十二小节布鲁斯' } },
      { id: 'n17', title: { en: 'The Turnaround', zh: '回转（Turnaround）' } },
    ],
  },
  {
    id: 'final',
    title: {
      en: 'Section 6 — Final Challenge',
      zh: '第 6 单元 — 终极挑战',
    },
    nodes: [{ id: 'n18', title: { en: 'Jazz 101 Complete', zh: '爵士入门 101 结业' } }],
  },
];
