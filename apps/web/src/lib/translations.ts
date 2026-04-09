import type { Lang } from '@/hooks/use-language';

type TranslationMap = {
  appSubtitle: string; navDashboard: string; navPractice: string; navScales: string;
  navChords: string; signOut: string;
  welcomeBack: string; welcomeSub: string;
  statDueToday: string; statDueSub: string; statStreak: string; statStreakSub: string;
  statMastered: string; statMasteredSub: string; statModes: string; statModesSub: string;
  startPractice: string; browseScales: string; browseChords: string; yourLibrary: string; libraryDesc: string;
  practiceTitle: string; practiceSubtitle: string; modeStart: string;
  modeFullScale: string; modeFullScaleDesc: string; modeFullChord: string; modeFullChordDesc: string;
  modeSequence: string; modeSequenceDesc: string; mode251: string; mode251Desc: string;
  modeInterval: string; modeIntervalDesc: string;
  configTitle: string; configNoteCount: string; configRootFree: string; configRootFreeDesc: string;
  configPickRoot: string; rootLabel251: string; rootLabelInterval: string;
  rootLabelScale: string; rootLabelChord: string; rootLabelSeq: string;
  labelScale: string; labelChordTones: string; labelSequence: string; label251: string; labelInterval: string;
  whatDegrees: string; nameChordTones: string; nameTarget: string;
  revealAnswer: string; correctAnswer: string; yourAnswer: string; noAnswer: string;
  prevCard: string; nextCard: string; finishPractice: string; nextBtn: string;   hintReveal: string; hintInterval: string;
  playAudio: string;
  chordPlaybackBlock: string;
  chordPlaybackArpeggio: string;
  cramBadge: string;
  grade1Label: string; grade1Desc: string; grade2Label: string; grade2Desc: string;
  grade3Label: string; grade3Desc: string; grade4Label: string; grade4Desc: string;
  doneTitle: string;
  doneRootSelected: (n: number, root: string) => string;
  doneRootsSelected: (n: number, roots: string) => string;
  doneCram: (n: number) => string;
  doneFree: (n: number) => string;
  newSession: string; backToModes: string;

  // ── Scale library ─────────────────────────────────────────────────────────
  scaleLibraryTitle: string; scaleLibrarySubtitle: string;
  searchScalePlaceholder: string; filterAll: string;
  colScale: string; colRoot: string; colNotesDegrees: string;
  colNextReview: string; colInterval: string; colReps: string;
  noScalesMatch: string;
  timeOverdue: string; timeToday: string; timeTomorrow: string;
  timeInDays: (n: number) => string;

  // ── Chord library ─────────────────────────────────────────────────────────
  chordLibraryTitle: string; chordLibrarySubtitle: string;
  filterAllQualities: string; filterAllRoots: string;
  colChord: string; colQuality: string; colTonesDegrees: string; colUsedBy: string;
  noChordsMatch: string;
  qualityMaj7: string; qualityMin7: string; qualityDom7: string;
  qualityMin7b5: string; qualityDim7: string; qualityMinmaj7: string;
};

const en: TranslationMap = {
  // ── Sidebar ──────────────────────────────────────────────────────────────
  appSubtitle:        'Jazz Flashcards',
  navDashboard:       'Dashboard',
  navPractice:        'Practice',
  navScales:          'Scales',
  navChords:          'Chords',
  signOut:            'Sign out',

  // ── Dashboard ────────────────────────────────────────────────────────────
  welcomeBack:        'Welcome back',
  welcomeSub:         'Keep the woodshed going — your cards are waiting.',
  statDueToday:       'Due Today',
  statDueSub:         'cards ready for review',
  statStreak:         'Streak',
  statStreakSub:      'days in a row',
  statMastered:       'Mastered',
  statMasteredSub:    'of 204 cards',
  statModes:          'Practice Modes',
  statModesSub:       'Scale · Chord · Seq · 251',
  startPractice:      'Start Practice',
  browseScales:       'Browse Scales',
  browseChords:       'Browse Chords',
  yourLibrary:        'Your Library',
  libraryDesc:        '204 cards — 17 scale types × 12 roots, across five practice modes. Cards are reviewed using SM-2 spaced repetition so you spend more time on what needs work.',

  // ── Practice selector ────────────────────────────────────────────────────
  practiceTitle:      'Practice',
  practiceSubtitle:   'Choose a mode to start your session.',
  modeStart:          'Start',
  modeFullScale:      'Full Scale',
  modeFullScaleDesc:  'All notes of the scale across the full range.',
  modeFullChord:      'Full Chord',
  modeFullChordDesc:  'Chord tones stacked from the root.',
  modeSequence:       'Sequence',
  modeSequenceDesc:   'Practice the scale in random degree sequences.',
  mode251:            '2-5-1',
  mode251Desc:        'Navigate a ii-V-I progression in every key.',
  modeInterval:       'Intervals',
  modeIntervalDesc:   'Given a root and an interval, name the target note.',

  // ── Config screen ────────────────────────────────────────────────────────
  configTitle:        'How do you want to practice?',
  configNoteCount:    'Notes per question',
  configRootFree:     'Root Free',
  configRootFreeDesc: 'Random cards from your due queue — up to 20 per session.',
  configPickRoot:     'Or pick a root',
  rootLabel251:       'ii-V-I in this key',
  rootLabelInterval:  'all intervals from this root',
  rootLabelScale:     'all 17 scales',
  rootLabelChord:     'all 17 chord voicings',
  rootLabelSeq:       'all 17 scale sequences',

  // ── Practice card ────────────────────────────────────────────────────────
  labelScale:         'Scale',
  labelChordTones:    'Chord tones',
  labelSequence:      'Sequence',
  label251:           '2-5-1',
  labelInterval:      'Interval',
  whatDegrees:        'What notes are these scale degrees?',
  nameChordTones:     'Name the chord tones for each chord.',
  nameTarget:         'Name the target note.',
  revealAnswer:       'Reveal answer',
  correctAnswer:      'Correct answer',
  yourAnswer:         'Your answer',
  noAnswer:           'No answer given',
  prevCard:           '← Prev',
  nextCard:           'Next →',
  finishPractice:     'Finish',
  nextBtn:            'Next',
  hintReveal:         'Space to reveal · 1–4 to grade',
  hintInterval:       'Space to reveal · 1–4 to grade',
  playAudio:          'Play',
  chordPlaybackBlock: 'Block',
  chordPlaybackArpeggio: 'Up–Down',
  cramBadge:          'Cram',

  // ── Grades ───────────────────────────────────────────────────────────────
  grade1Label:        'Blackout',
  grade1Desc:         "Didn't know it",
  grade2Label:        'Struggled',
  grade2Desc:         'Needed hints',
  grade3Label:        'Solid',
  grade3Desc:         'Got it right',
  grade4Label:        'Perfect',
  grade4Desc:         'Instant recall',

  // ── Done screen ──────────────────────────────────────────────────────────
  doneTitle:          'Done',
  doneRootSelected:   (n: number, root: string) => `${n} questions — root: ${root}`,
  doneRootsSelected:  (n: number, roots: string) => `${n} questions — roots: ${roots}`,
  doneCram:           (n: number) => `Cranked through ${n} cards.`,
  doneFree:           (n: number) => `Reviewed ${n} due card${n !== 1 ? 's' : ''}.`,
  newSession:         'New Session',
  backToModes:        'Back to modes',

  // ── Scale library ─────────────────────────────────────────────────────────
  scaleLibraryTitle:    'Scale Library',
  scaleLibrarySubtitle: '17 scales × 12 roots — your full 204-card library.',
  searchScalePlaceholder: 'Search scale name…',
  filterAll:            'All',
  colScale:             'Scale',
  colRoot:              'Root',
  colNotesDegrees:      'Notes & Degrees',
  colNextReview:        'Next Review',
  colInterval:          'Interval',
  colReps:              'Reps',
  noScalesMatch:        'No scales match.',
  timeOverdue:          'overdue',
  timeToday:            'today',
  timeTomorrow:         'tomorrow',
  timeInDays:           (n: number) => `in ${n}d`,

  // ── Chord library ─────────────────────────────────────────────────────────
  chordLibraryTitle:    'Chord Library',
  chordLibrarySubtitle: '5 chord qualities × 12 roots — tones and degrees at a glance.',
  filterAllQualities:   'All qualities',
  filterAllRoots:       'All roots',
  colChord:             'Chord',
  colQuality:           'Quality',
  colTonesDegrees:      'Tones & Degrees',
  colUsedBy:            'Used by',
  noChordsMatch:        'No chords match.',
  qualityMaj7:          'Major 7',
  qualityMin7:          'Minor 7',
  qualityDom7:          'Dominant 7',
  qualityMin7b5:        'Half-Dim',
  qualityDim7:          'Full Dim',
  qualityMinmaj7:       'Min-Maj 7',
} as const;

const zh: TranslationMap = {
  // ── Sidebar ──────────────────────────────────────────────────────────────
  appSubtitle:        '爵士闪卡',
  navDashboard:       '总览',
  navPractice:        '练习',
  navScales:          '音阶',
  navChords:          '和弦',
  signOut:            '退出登录',

  // ── Dashboard ────────────────────────────────────────────────────────────
  welcomeBack:        '欢迎回来',
  welcomeSub:         '继续练习吧，你的卡片在等你。',
  statDueToday:       '今日待复习',
  statDueSub:         '张卡片待复习',
  statStreak:         '连续天数',
  statStreakSub:      '天连续练习',
  statMastered:       '已掌握',
  statMasteredSub:    '共 204 张',
  statModes:          '练习模式',
  statModesSub:       '音阶 · 和弦 · 序列 · 2-5-1',
  startPractice:      '开始练习',
  browseScales:       '查看音阶',
  browseChords:       '查看和弦',
  yourLibrary:        '我的卡库',
  libraryDesc:        '204 张卡片 — 17 种音阶 × 12 个根音，涵盖五种练习模式。使用 SM-2 间隔重复算法，把时间花在最需要巩固的内容上。',

  // ── Practice selector ────────────────────────────────────────────────────
  practiceTitle:      '练习',
  practiceSubtitle:   '选择一种模式开始练习。',
  modeStart:          '开始',
  modeFullScale:      '完整音阶',
  modeFullScaleDesc:  '说出音阶的所有音符。',
  modeFullChord:      '和弦音',
  modeFullChordDesc:  '从根音开始说出所有和弦音。',
  modeSequence:       '音阶序列',
  modeSequenceDesc:   '根据给定的音级序列，说出对应音符。',
  mode251:            '2-5-1',
  mode251Desc:        '在所有调性中练习 ii-V-I 进行。',
  modeInterval:       '音程',
  modeIntervalDesc:   '给定根音与音程，说出目标音。',

  // ── Config screen ────────────────────────────────────────────────────────
  configTitle:        '选择练习方式',
  configNoteCount:    '每题音符数',
  configRootFree:     '自由练习',
  configRootFreeDesc: '从待复习卡片中随机抽取，每次最多 20 题。',
  configPickRoot:     '或选择根音',
  rootLabel251:       '在此调中练习 2-5-1',
  rootLabelInterval:  '从此根音练习所有音程',
  rootLabelScale:     '循环练习全部 17 种音阶',
  rootLabelChord:     '循环练习全部 17 种和弦',
  rootLabelSeq:       '循环练习全部 17 种音阶序列',

  // ── Practice card ────────────────────────────────────────────────────────
  labelScale:         '音阶',
  labelChordTones:    '和弦音',
  labelSequence:      '序列',
  label251:           '2-5-1',
  labelInterval:      '音程',
  whatDegrees:        '这些音级对应哪些音符？',
  nameChordTones:     '说出每个和弦的和弦音。',
  nameTarget:         '说出目标音。',
  revealAnswer:       '显示答案',
  correctAnswer:      '正确答案',
  yourAnswer:         '你的答案',
  noAnswer:           '未作答',
  prevCard:           '← 上一题',
  nextCard:           '下一题 →',
  finishPractice:     '完成',
  nextBtn:            '下一题',
  hintReveal:         '空格显示 · 1–4 评分',
  hintInterval:       '空格显示 · 1–4 评分',
  playAudio:          '播放',
  chordPlaybackBlock: '柱式',
  chordPlaybackArpeggio: '上下行',
  cramBadge:          '强化',

  // ── Grades ───────────────────────────────────────────────────────────────
  grade1Label:        '完全忘记',
  grade1Desc:         '毫无印象',
  grade2Label:        '有些困难',
  grade2Desc:         '需要提示',
  grade3Label:        '基本掌握',
  grade3Desc:         '答对了',
  grade4Label:        '非常熟练',
  grade4Desc:         '脱口而出',

  // ── Done screen ──────────────────────────────────────────────────────────
  doneTitle:          '完成',
  doneRootSelected:   (n: number, root: string) => `共 ${n} 题 — 根音：${root}`,
  doneRootsSelected:  (n: number, roots: string) => `共 ${n} 题 — 根音：${roots}`,
  doneCram:           (n: number) => `强化练习了 ${n} 张卡片。`,
  doneFree:           (n: number) => `复习了 ${n} 张待复习卡片。`,
  newSession:         '新练习',
  backToModes:        '返回模式',

  // ── Scale library ─────────────────────────────────────────────────────────
  scaleLibraryTitle:    '音阶库',
  scaleLibrarySubtitle: '17 种音阶 × 12 个根音 — 完整的 204 张卡片库。',
  searchScalePlaceholder: '搜索音阶名称…',
  filterAll:            '全部',
  colScale:             '音阶',
  colRoot:              '根音',
  colNotesDegrees:      '音符与音级',
  colNextReview:        '下次复习',
  colInterval:          '间隔',
  colReps:              '次数',
  noScalesMatch:        '无匹配音阶。',
  timeOverdue:          '已逾期',
  timeToday:            '今天',
  timeTomorrow:         '明天',
  timeInDays:           (n: number) => `${n} 天后`,

  // ── Chord library ─────────────────────────────────────────────────────────
  chordLibraryTitle:    '和弦库',
  chordLibrarySubtitle: '5 种和弦品质 × 12 个根音 — 一览和弦音与音级。',
  filterAllQualities:   '全部品质',
  filterAllRoots:       '全部根音',
  colChord:             '和弦',
  colQuality:           '品质',
  colTonesDegrees:      '和弦音与音级',
  colUsedBy:            '使用音阶',
  noChordsMatch:        '无匹配和弦。',
  qualityMaj7:          '大七和弦',
  qualityMin7:          '小七和弦',
  qualityDom7:          '属七和弦',
  qualityMin7b5:        '半减七',
  qualityDim7:          '全减七',
  qualityMinmaj7:       '小大七',
};

export const translations = { en, zh } as const;

export function t(lang: Lang) {
  return translations[lang];
}
