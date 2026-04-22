import type { Lang } from '@/hooks/use-language';

type TranslationMap = {
  appName: string;
  appSubtitle: string; navDashboard: string; navLearn: string; navPractice: string; navScales: string;
  navChords: string; navLibrary: string; navSettings: string; signOut: string;
  navSystemSettings: string; navStudio: string; navTutorStudents: string; navStudentTutor: string;
  navStudioSection: string;
  navSectionLabel: string;

  learnTitle: string;
  learnSubtitle: string;
  learnPlaceholderP1: string;
  learnPlaceholderP2: string;
  learnBullet1: string;
  learnBullet2: string;
  learnBullet3: string;
  learnGoFreePractice: string;
  learnPathsPreviewHeading: string;
  learnPathJazz101Title: string;
  learnPathJazz101Body: string;
  learnPathBirdTitle: string;
  learnPathBirdBody: string;
  learnPathMilesTitle: string;
  learnPathMilesBody: string;
  learnPathSoonTitle: string;
  learnPathSoonBody: string;

  jazz101PageTitle: string;
  jazz101PathSubtitle: string;
  jazz101LessonLocked: string;
  jazz101OpenLesson: string;
  jazz101Lesson1Title: string;
  jazz101Lesson1Placeholder: string;

  authLoginTitle: string;
  authLoginSubtitle: string;
  authEmail: string;
  authPassword: string;
  authEmailPlaceholder: string;
  authSigningIn: string;
  authLoginButton: string;
  authNoAccount: string;
  authSignUpLink: string;
  authSignupTitle: string;
  authSignupSubtitle: string;
  authConfirmPassword: string;
  authPasswordHintPlaceholder: string;
  authCreatingAccount: string;
  authCreateAccountButton: string;
  authHaveAccount: string;
  authSignInLink: string;
  authCheckEmailTitle: string;
  authCheckEmailPart1: string;
  authCheckEmailPart2: string;
  authSignInInline: string;
  authPasswordMismatch: string;
  authPasswordMinLength: string;
  authImageAlt: string;
  authRegisterAs: string;
  authRegisterStudent: string;
  authRegisterTutor: string;
  authRegisterHintStudent: string;
  authRegisterHintTutor: string;

  welcomeBack: string; welcomeSub: string; quickStart: string;
  statDueToday: string; statDueSub: string; statStreak: string; statStreakSub: string;
  statMastered: string; statMasteredSub: string; statModes: string; statModesSub: string;
  startPractice: string; browseScales: string; browseChords: string; yourLibrary: string; libraryDesc: string;
  loadingPracticeContent: string;
  recentSessions: string; recentSessionsEmpty: string; sessionStatusCompleted: string; sessionStatusAbandoned: string; sessionStatusActive: string;
  sessionAccuracy: string; sessionItems: string; sessionStarted: string; sessionCram: string;
  weeklyProgress: string; weeklyProgressSub: string; weeklySessions: string; weeklyItemsCompleted: string; weeklyAverageAccuracy: string; weeklyNoActivity: string;
  statXp: string; statXpSub: string; weeklyXp: string; sessionXp: string;
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
  sessionExpiredMessage: string;
  grade1Label: string; grade1Desc: string; grade2Label: string; grade2Desc: string;
  grade3Label: string; grade3Desc: string; grade4Label: string; grade4Desc: string;
  doneTitle: string;
  doneRootSelected: (n: number, root: string) => string;
  doneRootsSelected: (n: number, roots: string) => string;
  doneCram: (n: number) => string;
  doneFree: (n: number) => string;
  newSession: string; backToModes: string;
  practiceQuit: string;
  practiceQuitTitle: string;
  practiceQuitBody: string;
  practiceQuitConfirm: string;
  practiceQuitCancel: string;
  resumeSessionFailed: string;
  sessionContinue: string;

  pitchConcert: string;
  pitchBb: string;
  pitchEb: string;
  pitchTooltipBb: string;
  pitchTooltipEb: string;
  pitchTooltipConcert: string;

  settingsTitle: string;
  settingsSubtitle: string;
  settingsPitchLabel: string;
  settingsPitchHelp: string;
  settingsSaved: string;
  settingsProfileSection: string;
  settingsFullName: string;
  settingsNickname: string;
  settingsAccountSection: string;
  settingsEmailLabel: string;
  settingsNewEmail: string;
  settingsNewPassword: string;
  settingsSaveProfile: string;
  settingsProfileSaved: string;
  settingsAccountHint: string;

  systemSettingsTitle: string;
  systemSettingsSubtitle: string;
  systemUsersEmail: string;
  systemUsersCreated: string;
  systemUsersRole: string;
  systemUsersOperation: string;
  systemRoleStudent: string;
  systemRoleTutor: string;
  systemRoleSuperadmin: string;
  systemRoleSelfHint: string;
  systemRoleSelfForbidden: string;
  systemRoleLastSuperadmin: string;
  systemUsersDelete: string;
  systemUsersCreate: string;
  systemUsersPasswordOptional: string;
  systemUsersEmpty: string;
  systemUnauthorized: string;

  studioTitle: string;
  studioSubtitle: string;
  studioName: string;
  studioSlugHint: string;
  studioCreate: string;
  studioCreated: string;
  studioCreateNeedTutor: string;
  studioMyStudios: string;
  studioDelete: string;
  studioDeleteConfirm: string;
  studioDeleted: string;
  studioTutorRequests: string;
  studioStudentRequests: string;
  studioAccept: string;
  studioReject: string;
  studioNoRequests: string;
  studioJoinSection: string;
  studioJoinHelp: string;
  studioRequestAsTutor: string;
  studioRequestAsStudent: string;
  studioJoinAlreadyMember: string;
  studioJoinRequestSent: string;
  studioJoinRequestToast: string;
  studioJoinRequestAlreadyPending: string;
  studioJoinLookupFirst: string;
  studioJoinNotFound: string;
  studioCreateOrJoinTitle: string;
  studioJoinStudentTitle: string;
  studioRoleOwner: string;
  studioRoleAdmin: string;
  studioRoleTutor: string;
  studioRoleStudent: string;
  studioYourRole: string;
  studioPendingRequestsAll: string;
  studioViewJoinRequests: string;
  studioApprovedMembersTitle: string;
  studioMembersTitle: string;
  studioMembersNone: string;
  studioFilterAll: string;
  studioFilterTutors: string;
  studioFilterStudents: string;
  studioMembersNickname: string;
  studioMembersRole: string;
  studioMembersJoinedSince: string;
  studioMembersOperation: string;
  studioViewPracticeResults: string;
  studioSendDm: string;
  studioDmCopied: string;
  studioPracticeResultsTitle: string;
  studioPracticeResultsSubtitle: string;
  studioPracticeResultsLoading: string;
  studioPracticeResultsEmpty: string;
  studioPracticeStatsSessions: string;
  studioPracticeStatsCompleted: string;
  studioPracticeStatsAccuracy: string;
  studioPracticeStatsLastPracticed: string;
  studioPracticeStatsByGame: string;
  studioPracticeSessionStarted: string;
  studioPracticeSessionGame: string;
  studioPracticeSessionResult: string;
  studioDeleteCancel: string;
  studioDeleteConfirmButton: string;

  tutorStudentsTitle: string;
  tutorStudentsSubtitle: string;
  tutorPending: string;
  tutorAccepted: string;
  tutorAccept: string;
  tutorReject: string;
  tutorNoStudents: string;

  studentTutorTitle: string;
  studentTutorSubtitle: string;
  studentStudioSlug: string;
  studentLookupStudio: string;
  studentRequestJoin: string;
  studentRequestSent: string;
  studentPickTutor: string;
  studentRequestTutor: string;

  configDirection: string;
  dirUp: string;
  dirDown: string;
  dirMixed: string;
  configInversions: string;
  invRootOnly: string;
  inv1: string;
  inv2: string;
  inv3: string;
  invRandom: string;

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
  appName:            'The Shed',
  appSubtitle:        'Jazz Practice',
  navDashboard:       'Dashboard',
  navLearn:           'The Shed',
  navPractice:        'Free Practice',
  navLibrary:         'Library',
  navScales:          'Scales',
  navChords:          'Chords',
  navSettings:        'User settings',
  navSystemSettings:  'System settings',
  navStudio:          'Studio',
  navTutorStudents:   'My students',
  navStudentTutor:    'My tutor',
  navStudioSection:   'Studio & Teaching',
  navSectionLabel:    'Navigation',
  signOut:            'Sign out',

  learnTitle:            'The Shed',
  learnSubtitle:         'Guided tracks, nodes, and goals — coming soon.',
  learnPlaceholderP1:      'This is where your structured path will live: tracks (e.g. scales, chords, sequences), nodes with clear objectives, and progress through a skill tree — built for serious jazz practice, not generic drills.',
  learnPlaceholderP2:      'For now, use Free Practice to work on any game mode at your own pace. When this track ships, it will connect to the same games and telemetry you already use.',
  learnBullet1:          'Tracks and nodes that map to real practice goals',
  learnBullet2:          'Prerequisites and unlocks so you always know what to do next',
  learnBullet3:          'Tutor-friendly visibility into what students are working on',
  learnGoFreePractice:   'Go to Free Practice',
  learnPathsPreviewHeading: 'A look ahead',
  learnPathJazz101Title: 'Jazz 101',
  learnPathJazz101Body:
    'Where every journey begins. Master the fundamentals — scales, chords, intervals, and the core building blocks of jazz harmony. No experience required, just curiosity and a willingness to shed.',
  learnPathBirdTitle: 'The Bird Path — Charlie Parker',
  learnPathBirdBody:
    'Bebop is the grammar of jazz. Learn the language of rapid harmonic movement, chromatic vocabulary, and rhythmic sophistication through the innovations of the most influential improviser in jazz history. This is where jazz gets serious.',
  learnPathMilesTitle: 'Path to Miles Davis',
  learnPathMilesBody:
    'From bebop to modal. Having mastered the complexity of bebop, learn the art of restraint, space, and melodic economy. Kind of Blue didn\'t come from nowhere — this path shows you exactly how Miles got there and what it means harmonically.',
  learnPathSoonTitle: 'Coming Soon',
  learnPathSoonBody:
    'The journey continues. More paths, more masters, more voices. Where does your shed take you next?',

  jazz101PageTitle:     'Jazz 101',
  jazz101PathSubtitle:
    'Demo path — follow the trail lesson by lesson. Only the current step is unlocked; the rest are coming soon.',
  jazz101LessonLocked:  'Locked',
  jazz101OpenLesson:    'Open lesson',
  jazz101Lesson1Title: 'The 12 Notes',
  jazz101Lesson1Placeholder:
    'Lesson content is coming soon. In Western music, one octave has twelve pitch classes — the chromatic scale. Here they are in order (enharmonic spelling uses flats except C# and F#, common in jazz charts):',

  authLoginTitle:        'Login to your account',
  authLoginSubtitle:     'Enter your email below to sign in.',
  authEmail:             'Email',
  authPassword:          'Password',
  authEmailPlaceholder:  'm@example.com',
  authSigningIn:         'Signing in…',
  authLoginButton:       'Login',
  authNoAccount:         'Don’t have an account?',
  authSignUpLink:        'Sign up',
  authSignupTitle:       'Create your account',
  authSignupSubtitle:    'Fill in the form below to get started.',
  authConfirmPassword:   'Confirm password',
  authPasswordHintPlaceholder: 'At least 8 characters',
  authCreatingAccount:   'Creating account…',
  authCreateAccountButton: 'Create account',
  authHaveAccount:       'Already have an account?',
  authSignInLink:        'Sign in',
  authCheckEmailTitle:   'Check your email',
  authCheckEmailPart1:   'We sent a confirmation link to',
  authCheckEmailPart2:   'Click it to activate your account, then',
  authSignInInline:      'sign in',
  authPasswordMismatch:  'Passwords do not match.',
  authPasswordMinLength: 'Password must be at least 8 characters.',
  authImageAlt:          'Jazz musician',
  authRegisterAs:        'I am signing up as',
  authRegisterStudent:   'Student',
  authRegisterTutor:     'Tutor',
  authRegisterHintStudent:
    'Students can join existing studios and change participation after joining.',
  authRegisterHintTutor: 'Tutor can create and join existing studios.',

  // ── Dashboard ────────────────────────────────────────────────────────────
  welcomeBack:        'Welcome back',
  welcomeSub:         'Keep the woodshed going — your next practice items are ready.',
  quickStart:         'Quick Start',
  statDueToday:       'Due Today',
  statDueSub:         'items ready for review',
  statStreak:         'Streak',
  statStreakSub:      'days in a row',
  statMastered:       'Mastered',
  statMasteredSub:    'game items mastered',
  statModes:          'Practice Modes',
  statModesSub:       'Scale · Chord · Seq · 251',
  startPractice:      'Start Practice',
  browseScales:       'Browse Scales',
  browseChords:       'Browse Chords',
  loadingPracticeContent: 'Loading Practice Content...',
  yourLibrary:        'Your Library',
  libraryDesc:        'A game-based jazz practice library across scales, chords, sequences, 2-5-1, and intervals, with adaptive review driven by your performance.',
  recentSessions:     'Recent Sessions',
  recentSessionsEmpty:'No sessions yet. Start practicing to build your history.',
  sessionStatusCompleted: 'Completed',
  sessionStatusAbandoned: 'Expired',
  sessionStatusActive: 'Active',
  sessionAccuracy:    'Accuracy',
  sessionItems:       'Items',
  sessionStarted:     'Started',
  sessionCram:        'Cram',
  weeklyProgress:     'Last 7 Days',
  weeklyProgressSub:  'Your recent practice activity and consistency.',
  weeklySessions:     'Sessions',
  weeklyItemsCompleted:'Items completed',
  weeklyAverageAccuracy:'Avg accuracy',
  weeklyNoActivity:   'No practice activity in the last 7 days yet.',
  statXp:             'Total XP',
  statXpSub:          'earned from graded practice',
  weeklyXp:           'XP earned',
  sessionXp:          'XP',

  // ── Practice selector ────────────────────────────────────────────────────
  practiceTitle:      'Free Practice',
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
  configRootFreeDesc: 'Random due items from your queue — up to 20 per session.',
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
  sessionExpiredMessage: 'This session expired after 30 minutes of inactivity.',

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
  doneCram:           (n: number) => `Cranked through ${n} items.`,
  doneFree:           (n: number) => `Reviewed ${n} due item${n !== 1 ? 's' : ''}.`,
  newSession:         'New Session',
  backToModes:        'Pick another mode',
  practiceQuit:       'Quit',
  practiceQuitTitle:  'Leave practice?',
  practiceQuitBody:   'Your progress is saved. You can resume this session anytime from the dashboard.',
  practiceQuitConfirm:'Leave',
  practiceQuitCancel: 'Keep practicing',
  resumeSessionFailed:'Could not resume this session. Start a new session instead.',
  sessionContinue:    'Continue',

  pitchConcert:       'Concert',
  pitchBb:            'Bb',
  pitchEb:            'Eb',
  pitchTooltipBb:     'Showing Bb transposition — click to cycle pitch',
  pitchTooltipEb:     'Showing Eb transposition — click to cycle pitch',
  pitchTooltipConcert:'Showing concert pitch — click to cycle pitch',

  settingsTitle:      'User settings',
  settingsSubtitle:   'Profile, account, and practice preferences.',
  settingsPitchLabel: 'Instrument key',
  settingsPitchHelp:  'Sets the default display pitch (you can still switch any time during practice).',
  settingsSaved:      'Saved.',
  settingsProfileSection: 'Profile',
  settingsFullName:   'Full name',
  settingsNickname: 'Nickname',
  settingsAccountSection: 'Account',
  settingsEmailLabel: 'Signed-in email',
  settingsNewEmail:   'New email',
  settingsNewPassword: 'New password (optional)',
  settingsSaveProfile: 'Save profile',
  settingsProfileSaved: 'Profile saved.',
  settingsAccountHint: 'Changing email or password signs you in with the new credentials where applicable.',

  systemSettingsTitle: 'System settings',
  systemSettingsSubtitle: 'Superadmin: manage users and platform access.',
  systemUsersEmail: 'Email',
  systemUsersCreated: 'Created',
  systemUsersRole: 'Role',
  systemUsersOperation: 'Operation',
  systemRoleStudent: 'Student',
  systemRoleTutor: 'Tutor',
  systemRoleSuperadmin: 'Superadmin',
  systemRoleSelfHint: 'Another superadmin must change your role.',
  systemRoleSelfForbidden: 'You cannot change your own role.',
  systemRoleLastSuperadmin: 'At least one superadmin must remain.',
  systemUsersDelete: 'Delete',
  systemUsersCreate: 'Create user',
  systemUsersPasswordOptional: 'Password (optional)',
  systemUsersEmpty: 'No users returned.',
  systemUnauthorized: 'You do not have access to this page.',

  studioTitle:        'Studio',
  studioSubtitle:
    'Studios are shared spaces for tutors and students to manage memberships and review learning progress.',
  studioName:         'Studio name',
  studioSlugHint:     'URL slug is generated from the name (letters, numbers, hyphens).',
  studioCreate:       'Create studio',
  studioCreated:      'Studio created.',
  studioCreateNeedTutor:
    'Only platform tutors (or Superadmins) can create a studio. Ask a Superadmin to enable tutor access for your account in System settings.',
  studioMyStudios:    'My studios',
  studioDelete:       'Delete studio',
  studioDeleteConfirm:'Delete this studio? This will remove all memberships and pending requests.',
  studioDeleted:      'Studio deleted.',
  studioTutorRequests: 'Tutor join requests',
  studioStudentRequests: 'Student join requests',
  studioAccept:       'Accept',
  studioReject:       'Reject',
  studioNoRequests:   'No pending requests.',
  studioJoinSection:  'Join an existing studio',
  studioJoinHelp:     'Enter the studio name or slug to join.',
  studioRequestAsTutor: 'Request as tutor',
  studioRequestAsStudent: 'Request as student',
  studioJoinAlreadyMember: 'You are already a member of this studio.',
  studioJoinRequestSent: 'Request sent. Wait for the owner to approve.',
  studioJoinRequestToast: "Your request has been sent. Please wait for owner's approval.",
  studioJoinRequestAlreadyPending: 'You already have a pending request for this studio.',
  studioJoinLookupFirst: 'Look up a studio first.',
  studioJoinNotFound: 'No studio with that slug.',
  studioCreateOrJoinTitle: 'Create a studio',
  studioJoinStudentTitle: 'Join a studio',
  studioRoleOwner: 'Owner',
  studioRoleAdmin: 'Admin',
  studioRoleTutor: 'Tutor',
  studioRoleStudent: 'Student',
  studioYourRole: 'Your role',
  studioPendingRequestsAll: 'Pending join requests',
  studioViewJoinRequests: 'View join requests',
  studioApprovedMembersTitle: 'Approved members',
  studioMembersTitle: 'Studio Members',
  studioMembersNone: 'No approved tutors or students yet.',
  studioFilterAll: 'All',
  studioFilterTutors: 'Tutors',
  studioFilterStudents: 'Students',
  studioMembersNickname: 'Nickname',
  studioMembersRole: 'Role',
  studioMembersJoinedSince: 'Joined Since',
  studioMembersOperation: 'Operation',
  studioViewPracticeResults: 'View practice results',
  studioSendDm: 'Send message',
  studioDmCopied: 'Copied user id (DM coming soon).',
  studioPracticeResultsTitle: 'Practice results',
  studioPracticeResultsSubtitle: 'Recent sessions for this student.',
  studioPracticeResultsLoading: 'Loading…',
  studioPracticeResultsEmpty: 'No practice sessions yet.',
  studioPracticeStatsSessions: 'Sessions',
  studioPracticeStatsCompleted: 'Completed',
  studioPracticeStatsAccuracy: 'Accuracy',
  studioPracticeStatsLastPracticed: 'Last practiced',
  studioPracticeStatsByGame: 'By game',
  studioPracticeSessionStarted: 'Started',
  studioPracticeSessionGame: 'Game',
  studioPracticeSessionResult: 'Result',
  studioDeleteCancel: 'Cancel',
  studioDeleteConfirmButton: 'Delete studio',

  tutorStudentsTitle: 'My students',
  tutorStudentsSubtitle: 'Accept or reject student requests; review accepted rosters.',
  tutorPending:       'Pending',
  tutorAccepted:      'Accepted',
  tutorAccept:        'Accept',
  tutorReject:        'Reject',
  tutorNoStudents:    'No students yet.',

  studentTutorTitle:  'My tutor',
  studentTutorSubtitle: 'Join a studio, then request a tutor.',
  studentStudioSlug:  'Studio name or slug',
  studentLookupStudio: 'Find studio',
  studentRequestJoin: 'Request to join studio',
  studentRequestSent: 'Request sent.',
  studentPickTutor:   'Request lesson link',
  studentRequestTutor: 'Send request',

  configDirection:    'Direction',
  dirUp:              'Up',
  dirDown:            'Down',
  dirMixed:           'Mixed',
  configInversions:   'Inversions',
  invRootOnly:        'Root only',
  inv1:               '1st inv.',
  inv2:               '2nd inv.',
  inv3:               '3rd inv.',
  invRandom:          'Random',

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
  appName:            'The Shed',
  appSubtitle:        '爵士乐棚',
  navDashboard:       '总览',
  navLearn:           '晋级之路',
  navPractice:        '自由练习',
  navLibrary:         '曲库',
  navScales:          '音阶',
  navChords:          '和弦',
  navSettings:        '用户设置',
  navSystemSettings:  '系统设置',
  navStudio:          '工作室',
  navTutorStudents:   '我的学生',
  navStudentTutor:    '我的老师',
  navStudioSection:   '工作室与教学',
  navSectionLabel:    '导航',
  signOut:            '退出登录',

  learnTitle:            '晋级之路',
  learnSubtitle:         '结构化路径、节点与目标 — 即将推出。',
  learnPlaceholderP1:      '这里将承载你的系统练习路径：学习路径（如音阶、和弦、序列等）、目标清晰的节点，以及技能树式的进阶 — 为爵士练习深度设计，而不是泛泛的刷题。',
  learnPlaceholderP2:      '目前请使用「自由练习」按自己的节奏练习任意模式。该路径上线后，将与你已在使用的游戏与练习数据打通。',
  learnBullet1:          '与真实练习目标对应的学习路径与节点',
  learnBullet2:          '前置与解锁，让你始终清楚下一步该练什么',
  learnBullet3:          '便于老师了解学员在练的内容（后续版本）',
  learnGoFreePractice:   '前往自由练习',
  learnPathsPreviewHeading: '先行预览',
  learnPathJazz101Title: '爵士入门 101',
  learnPathJazz101Body:
    '一切从这里开始。掌握基本功：音阶、和弦、音程与爵士和声的核心知识。无需经验，只要好奇与愿意「开练」。',
  learnPathBirdTitle: '大鸟之路 — 查理·帕克',
  learnPathBirdBody:
    '比波普是爵士的语法。通过爵士史上最具影响力的即兴者，学习快速和声进行、半音语汇与节奏上的精细。爵士从这里开始真正「上强度」。',
  learnPathMilesTitle: '迈尔斯之路',
  learnPathMilesBody:
    '从比波普走向调式。在掌握比波普的复杂之后，学习克制、留白与旋律的极简。《Kind of Blue》并非凭空而来——这条路径讲清迈尔斯如何走到那里，以及在和声上意味着什么。',
  learnPathSoonTitle: '敬请期待',
  learnPathSoonBody:
    '旅程还在继续。更多路径、更多大师、更多声音。你的下一站在哪里？',

  jazz101PageTitle:     '爵士入门 101',
  jazz101PathSubtitle:
    '演示路径 — 按顺序解锁。当前仅开放第一课，其余内容即将推出。',
  jazz101LessonLocked:  '未解锁',
  jazz101OpenLesson:    '进入课程',
  jazz101Lesson1Title: '十二个音',
  jazz101Lesson1Placeholder:
    '正式课程内容即将上线。西方音乐中，一个八度内有十二个音高类别（半音阶）。以下按顺序列出（爵士谱例中常用降号写法，C#、F# 除外）：',

  authLoginTitle:        '登录账号',
  authLoginSubtitle:     '在下方输入邮箱和密码。',
  authEmail:             '邮箱',
  authPassword:          '密码',
  authEmailPlaceholder:  'you@example.com',
  authSigningIn:         '登录中…',
  authLoginButton:       '登录',
  authNoAccount:         '还没有账号？',
  authSignUpLink:        '注册',
  authSignupTitle:       '创建账号',
  authSignupSubtitle:    '填写以下信息开始使用。',
  authConfirmPassword:   '确认密码',
  authPasswordHintPlaceholder: '至少 8 个字符',
  authCreatingAccount:   '创建中…',
  authCreateAccountButton: '创建账号',
  authHaveAccount:       '已有账号？',
  authSignInLink:        '登录',
  authCheckEmailTitle:   '请查收邮件',
  authCheckEmailPart1:   '我们已将确认链接发送至',
  authCheckEmailPart2:   '请点击邮件中的链接激活账号，然后',
  authSignInInline:      '登录',
  authPasswordMismatch:  '两次输入的密码不一致。',
  authPasswordMinLength: '密码至少需要 8 个字符。',
  authImageAlt:          '爵士乐手',
  authRegisterAs:        '我注册为',
  authRegisterStudent:   '学生',
  authRegisterTutor:     '老师',
  authRegisterHintStudent: '学生可加入已有工作室，加入后仍可切换其它工作室。',
  authRegisterHintTutor: '老师可以创建新工作室，也可申请加入已有工作室。',

  // ── Dashboard ────────────────────────────────────────────────────────────
  welcomeBack:        '欢迎回来',
  welcomeSub:         '继续练习吧，下一组练习题已经在等你。',
  quickStart:         '快速开始',
  statDueToday:       '今日待复习',
  statDueSub:         '题待复习',
  statStreak:         '连续天数',
  statStreakSub:      '天连续练习',
  statMastered:       '已掌握',
  statMasteredSub:    '已掌握的练习项',
  statModes:          '练习模式',
  statModesSub:       '音阶 · 和弦 · 序列 · 2-5-1',
  startPractice:      '开始练习',
  browseScales:       '查看音阶',
  browseChords:       '查看和弦',
  loadingPracticeContent: '正在加载练习内容…',
  yourLibrary:        '我的卡库',
  libraryDesc:        '一个基于游戏化结构的爵士练习库，涵盖音阶、和弦、音程序列、2-5-1 与音程，并根据你的表现自适应安排复习。',
  recentSessions:     '最近练习',
  recentSessionsEmpty:'还没有练习记录。开始练习后，这里会显示历史记录。',
  sessionStatusCompleted: '已完成',
  sessionStatusAbandoned: '已超时',
  sessionStatusActive: '进行中',
  sessionAccuracy:    '正确率',
  sessionItems:       '题数',
  sessionStarted:     '开始时间',
  sessionCram:        '强化',
  weeklyProgress:     '最近 7 天',
  weeklyProgressSub:  '查看你最近的练习活跃度与稳定性。',
  weeklySessions:     '练习次数',
  weeklyItemsCompleted:'完成题数',
  weeklyAverageAccuracy:'平均正确率',
  weeklyNoActivity:   '最近 7 天还没有练习记录。',
  statXp:             '总 XP',
  statXpSub:          '来自已评分练习',
  weeklyXp:           '获得 XP',
  sessionXp:          'XP',

  // ── Practice selector ────────────────────────────────────────────────────
  practiceTitle:      '自由练习',
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
  configRootFreeDesc: '从待复习队列中随机抽取练习项，每次最多 20 题。',
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
  chordPlaybackBlock: '和弦',
  chordPlaybackArpeggio: '上下行',
  cramBadge:          '强化',
  sessionExpiredMessage: '此会话因 30 分钟无操作而自动结束。',

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
  doneCram:           (n: number) => `强化练习了 ${n} 题。`,
  doneFree:           (n: number) => `复习了 ${n} 题待复习内容。`,
  newSession:         '新练习',
  backToModes:        '选择其他模式',
  practiceQuit:       '退出',
  practiceQuitTitle:  '离开练习？',
  practiceQuitBody:   '进度已保存。你可以随时在仪表盘继续此练习。',
  practiceQuitConfirm:'离开',
  practiceQuitCancel: '继续练习',
  resumeSessionFailed:'无法恢复此练习，请开始新练习。',
  sessionContinue:    '继续',

  pitchConcert:       '原调',
  pitchBb:            'Bb',
  pitchEb:            'Eb',
  pitchTooltipBb:     '当前为 Bb 移调显示 — 点击循环切换',
  pitchTooltipEb:     '当前为 Eb 移调显示 — 点击循环切换',
  pitchTooltipConcert:'当前为原调显示 — 点击循环切换',

  settingsTitle:      '用户设置',
  settingsSubtitle:   '个人资料、账号与练习偏好。',
  settingsPitchLabel: '乐器调性',
  settingsPitchHelp:  '设置默认显示调性（练习时仍可随时切换）。',
  settingsSaved:      '已保存。',
  settingsProfileSection: '资料',
  settingsFullName:   '姓名',
  settingsNickname:   '昵称',
  settingsAccountSection: '账号',
  settingsEmailLabel: '当前登录邮箱',
  settingsNewEmail:   '新邮箱',
  settingsNewPassword: '新密码（可选）',
  settingsSaveProfile: '保存资料',
  settingsProfileSaved: '已保存。',
  settingsAccountHint: '修改邮箱或密码后，请按提示重新登录（若项目开启邮箱验证）。',

  systemSettingsTitle: '系统设置',
  systemSettingsSubtitle: '超级管理员：管理用户与平台权限。',
  systemUsersEmail: '邮箱',
  systemUsersCreated: '创建时间',
  systemUsersRole: '角色',
  systemUsersOperation: '操作',
  systemRoleStudent: '学生',
  systemRoleTutor: '导师',
  systemRoleSuperadmin: '超级管理员',
  systemRoleSelfHint: '需由其他超级管理员修改你的角色。',
  systemRoleSelfForbidden: '不能修改自己的角色。',
  systemRoleLastSuperadmin: '至少保留一名超级管理员。',
  systemUsersDelete: '删除',
  systemUsersCreate: '创建用户',
  systemUsersPasswordOptional: '密码（可选）',
  systemUsersEmpty: '暂无用户。',
  systemUnauthorized: '无权访问此页面。',

  studioTitle:        '工作室',
  studioSubtitle:
    '工作室是导师与学生共同协作的空间，用于管理成员关系并查看学习进度。',
  studioName:         '工作室名称',
  studioSlugHint:     'URL 标识由名称自动生成（字母、数字、连字符）。',
  studioCreate:       '创建工作室',
  studioCreated:      '已创建工作室。',
  studioCreateNeedTutor:
    '只有平台导师（或超级管理员）可以创建工作室。请在系统设置中请超级管理员为你的账号开启导师权限。',
  studioMyStudios:    '我的工作室',
  studioDelete:       '删除工作室',
  studioDeleteConfirm:'确定删除该工作室？这会删除所有成员关系与待处理申请。',
  studioDeleted:      '已删除工作室。',
  studioTutorRequests: '老师加入申请',
  studioStudentRequests: '学生加入申请',
  studioAccept:       '同意',
  studioReject:       '拒绝',
  studioNoRequests:   '暂无待处理申请。',
  studioJoinSection:  '加入已有工作室',
  studioJoinHelp:     '输入工作室名称或标识来申请加入。',
  studioRequestAsTutor: '申请为老师',
  studioRequestAsStudent: '申请为学生',
  studioJoinAlreadyMember: '你已是该工作室成员。',
  studioJoinRequestSent: '申请已发送，等待拥有者通过。',
  studioJoinRequestToast: '你的申请已发送，请等待拥有者审核。',
  studioJoinRequestAlreadyPending: '你已提交过加入申请，请等待拥有者处理。',
  studioJoinLookupFirst: '请先查找工作室。',
  studioJoinNotFound: '未找到该标识的工作室。',
  studioCreateOrJoinTitle: '创建或加入工作室',
  studioJoinStudentTitle: '加入工作室',
  studioRoleOwner: '拥有者',
  studioRoleAdmin: '管理员',
  studioRoleTutor: '老师',
  studioRoleStudent: '学生',
  studioYourRole: '你的身份',
  studioPendingRequestsAll: '待处理加入申请',
  studioViewJoinRequests: '查看加入申请',
  studioApprovedMembersTitle: '已通过成员',
  studioMembersTitle: '工作室成员',
  studioMembersNone: '暂无已通过的老师或学生。',
  studioFilterAll: '全部',
  studioFilterTutors: '老师',
  studioFilterStudents: '学生',
  studioMembersNickname: '昵称',
  studioMembersRole: '角色',
  studioMembersJoinedSince: '加入时间',
  studioMembersOperation: '操作',
  studioViewPracticeResults: '查看练习结果',
  studioSendDm: '发送私信',
  studioDmCopied: '已复制用户 ID（私信功能即将上线）。',
  studioPracticeResultsTitle: '练习结果',
  studioPracticeResultsSubtitle: '该学生最近的练习记录。',
  studioPracticeResultsLoading: '加载中…',
  studioPracticeResultsEmpty: '暂无练习记录。',
  studioPracticeStatsSessions: '练习次数',
  studioPracticeStatsCompleted: '已完成',
  studioPracticeStatsAccuracy: '正确率',
  studioPracticeStatsLastPracticed: '最近练习',
  studioPracticeStatsByGame: '按游戏统计',
  studioPracticeSessionStarted: '开始时间',
  studioPracticeSessionGame: '游戏',
  studioPracticeSessionResult: '结果',
  studioDeleteCancel: '取消',
  studioDeleteConfirmButton: '删除工作室',

  tutorStudentsTitle: '我的学生',
  tutorStudentsSubtitle: '处理学生的上课关联申请；查看已通过名单。',
  tutorPending:       '待处理',
  tutorAccepted:      '已通过',
  tutorAccept:        '同意',
  tutorReject:        '拒绝',
  tutorNoStudents:    '暂无学生。',

  studentTutorTitle:  '我的老师',
  studentTutorSubtitle: '加入工作室后再向老师发起关联请求。',
  studentStudioSlug:  '工作室名称或标识',
  studentLookupStudio: '查找工作室',
  studentRequestJoin: '申请加入工作室',
  studentRequestSent: '申请已发送。',
  studentPickTutor:   '向老师发起关联',
  studentRequestTutor: '发送请求',

  configDirection:    '方向',
  dirUp:              '上行',
  dirDown:            '下行',
  dirMixed:           '随机',
  configInversions:   '转位',
  invRootOnly:        '原位',
  inv1:               '第一转位',
  inv2:               '第二转位',
  inv3:               '第三转位',
  invRandom:          '随机',

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
