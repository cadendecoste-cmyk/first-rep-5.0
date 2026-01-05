// =======================
// FirstRep - v3+ Add-On Pack
// Adds (without removing existing behavior):
// - Higher "app polish" UI hookups (chips)
// - Warm-up guidance after workout generation (split + injury aware)
// - Injury-aware substitutions + active recovery option
// - Much richer Offline Coach (fitness, stretching, diet basics, cardio, muscles targeted, substitutions)
// =======================

// ---------- Storage keys (same as v3)
const STORE = {
  dayIndex: "firstrep_dayIndex_v3",
  history: "firstrep_history_v3",
  prs: "firstrep_prs_v3",
  splitVarIndex: "firstrep_splitVarIndex_v3",
  chat: "firstrep_chat_v3"
};

// ---------- Rep range => rest guidance
const REST_RULES = [
  { min: 1,  max: 5,  rest: "3–5 min",  note: "Heavy strength work" },
  { min: 6,  max: 10, rest: "2–3 min",  note: "Strength / hypertrophy" },
  { min: 10, max: 12, rest: "1–2 min",  note: "Hypertrophy" },
  { min: 12, max: 20, rest: "45–90 sec", note: "Higher reps / conditioning" }
];

function restForRepRange(rangeStr) {
  const m = String(rangeStr).match(/(\d+)\s*-\s*(\d+)/);
  if (!m) return { rest: "1–2 min", note: "" };
  const min = Number(m[1]);
  const max = Number(m[2]);
  for (const r of REST_RULES) {
    if (min >= r.min && max <= r.max) return { rest: r.rest, note: r.note };
  }
  for (const r of REST_RULES) {
    if (min >= r.min && min <= r.max) return { rest: r.rest, note: r.note };
  }
  return { rest: "1–2 min", note: "" };
}

// ---------- Split logic
function getSplit(days) {
  if (days === 6) return ["push", "pull", "legs"];
  if (days === 5) return ["upper", "lower", "arms"];
  if (days === 4) return ["upper", "lower"];
  return ["full"];
}

// ---------- Workout library (same content as your v3 build; abbreviated comment)
// Keep your existing LIB exactly—this is the same structure you already had.
const LIB = {
  push: [
    [
      { name: "Barbell Bench Press", repRange: "6-10", alternatives: ["Dumbbell Bench Press", "Machine Chest Press", "Push-Ups"] },
      { name: "Seated Dumbbell Shoulder Press", repRange: "8-12", alternatives: ["Machine Shoulder Press", "Standing Dumbbell Press", "Landmine Press"] },
      { name: "Incline Dumbbell Press", repRange: "8-12", alternatives: ["Incline Machine Press", "Incline Barbell Press", "Push-Ups (feet elevated)"] },
      { name: "Cable Tricep Pushdown", repRange: "10-12", alternatives: ["Rope Pushdown", "Dips (assisted)", "Close-Grip Push-Ups"] }
    ],
    [
      { name: "Machine Chest Press", repRange: "8-12", alternatives: ["Barbell Bench Press", "Dumbbell Bench Press", "Push-Ups"] },
      { name: "Lateral Raises", repRange: "12-15", alternatives: ["Cable Lateral Raise", "Machine Lateral Raise", "Lean-Away DB Lateral Raise"] },
      { name: "Incline Machine Press", repRange: "10-12", alternatives: ["Incline DB Press", "Incline Barbell Press", "Push-Ups (feet elevated)"] },
      { name: "Overhead Tricep Extension", repRange: "10-12", alternatives: ["Cable OH Extension", "Skull Crushers", "Close-Grip Bench (light)"] }
    ],
    [
      { name: "Dumbbell Bench Press", repRange: "8-12", alternatives: ["Machine Chest Press", "Barbell Bench Press", "Push-Ups"] },
      { name: "Arnold Press", repRange: "8-12", alternatives: ["Seated DB Press", "Machine Shoulder Press", "Landmine Press"] },
      { name: "Cable Fly", repRange: "12-15", alternatives: ["Pec Deck", "DB Fly (light)", "Push-Up Plus"] },
      { name: "Tricep Dips (assisted)", repRange: "8-12", alternatives: ["Bench Dips", "Cable Pushdown", "Close-Grip Push-Ups"] }
    ]
  ],
  pull: [
    [
      { name: "Lat Pulldown", repRange: "8-12", alternatives: ["Assisted Pull-Ups", "Band Pull-Downs", "High Row Machine"] },
      { name: "Seated Cable Row", repRange: "8-12", alternatives: ["Chest-Supported Row", "Dumbbell Row", "Machine Row"] },
      { name: "Face Pull", repRange: "12-15", alternatives: ["Rear Delt Fly", "Band Face Pull", "Reverse Pec Deck"] },
      { name: "Dumbbell Curl", repRange: "10-12", alternatives: ["Cable Curl", "EZ-Bar Curl", "Hammer Curl"] }
    ],
    [
      { name: "Assisted Pull-Ups", repRange: "6-10", alternatives: ["Lat Pulldown", "Band-Assisted Pull-Ups", "High Row Machine"] },
      { name: "Chest-Supported Row", repRange: "8-12", alternatives: ["Seated Row", "Dumbbell Row", "Machine Row"] },
      { name: "Reverse Pec Deck", repRange: "12-15", alternatives: ["Rear Delt Fly", "Face Pull", "Band Pull-Aparts"] },
      { name: "Hammer Curl", repRange: "10-12", alternatives: ["Incline DB Curl", "Cable Curl", "EZ-Bar Curl"] }
    ],
    [
      { name: "High Row Machine", repRange: "8-12", alternatives: ["Lat Pulldown", "Assisted Pull-Ups", "Band Pull-Downs"] },
      { name: "One-Arm Dumbbell Row", repRange: "8-12", alternatives: ["Seated Row", "Machine Row", "Chest-Supported Row"] },
      { name: "Rear Delt Fly", repRange: "12-15", alternatives: ["Face Pull", "Reverse Pec Deck", "Band Pull-Aparts"] },
      { name: "Cable Curl", repRange: "10-12", alternatives: ["DB Curl", "EZ-Bar Curl", "Hammer Curl"] }
    ]
  ],
  legs: [
    [
      { name: "Leg Press", repRange: "8-12", alternatives: ["Goblet Squat", "Hack Squat Machine", "Smith Squat (light)"] },
      { name: "Goblet Squat", repRange: "8-12", alternatives: ["Leg Press", "Smith Squat", "Bodyweight Squat (slow)"] },
      { name: "Hamstring Curl", repRange: "10-12", alternatives: ["Romanian Deadlift (light)", "Glute Bridge", "Swiss Ball Curl"] },
      { name: "Standing Calf Raise", repRange: "12-15", alternatives: ["Seated Calf Raise", "Leg Press Calf Press", "Single-Leg Calf Raise"] }
    ],
    [
      { name: "Hack Squat Machine", repRange: "6-10", alternatives: ["Leg Press", "Goblet Squat", "Smith Squat"] },
      { name: "Romanian Deadlift (DB)", repRange: "8-12", alternatives: ["Hamstring Curl", "Good Morning (light)", "Hip Hinge with KB"] },
      { name: "Walking Lunges", repRange: "10-12", alternatives: ["Split Squat", "Step-Ups", "Leg Press (higher reps)"] },
      { name: "Seated Calf Raise", repRange: "12-15", alternatives: ["Standing Calf Raise", "Single-Leg Calf Raise", "Leg Press Calf Press"] }
    ],
    [
      { name: "Smith Squat (light)", repRange: "8-12", alternatives: ["Leg Press", "Goblet Squat", "Hack Squat"] },
      { name: "Leg Extension", repRange: "10-12", alternatives: ["Split Squat", "Step-Ups", "Goblet Squat (slow)"] },
      { name: "Hamstring Curl", repRange: "10-12", alternatives: ["RDL (DB)", "Glute Bridge", "Swiss Ball Curl"] },
      { name: "Calf Raises (any)", repRange: "12-15", alternatives: ["Standing Calf Raise", "Seated Calf Raise", "Single-Leg Calf Raise"] }
    ]
  ],
  upper: [
    [
      { name: "Chest Press", repRange: "8-12", alternatives: ["Bench Press", "DB Bench Press", "Push-Ups"] },
      { name: "Lat Pulldown", repRange: "8-12", alternatives: ["Assisted Pull-Ups", "High Row Machine", "Band Pull-Downs"] },
      { name: "Seated Dumbbell Shoulder Press", repRange: "8-12", alternatives: ["Machine Shoulder Press", "Arnold Press", "Landmine Press"] },
      { name: "Seated Cable Row", repRange: "8-12", alternatives: ["Chest-Supported Row", "Machine Row", "DB Row"] }
    ],
    [
      { name: "Dumbbell Bench Press", repRange: "8-12", alternatives: ["Chest Press Machine", "Bench Press", "Push-Ups"] },
      { name: "High Row Machine", repRange: "8-12", alternatives: ["Lat Pulldown", "Assisted Pull-Ups", "Band Pull-Downs"] },
      { name: "Lateral Raises", repRange: "12-15", alternatives: ["Cable Lateral Raise", "Machine Lateral Raise", "Lean-Away DB Raise"] },
      { name: "Chest-Supported Row", repRange: "8-12", alternatives: ["Seated Row", "Machine Row", "DB Row"] }
    ]
  ],
  lower: [
    [
      { name: "Leg Press", repRange: "8-12", alternatives: ["Goblet Squat", "Hack Squat", "Smith Squat (light)"] },
      { name: "Hamstring Curl", repRange: "10-12", alternatives: ["RDL (DB)", "Glute Bridge", "Swiss Ball Curl"] },
      { name: "Split Squat", repRange: "8-12", alternatives: ["Lunges", "Step-Ups", "Leg Press (higher reps)"] },
      { name: "Calf Raise", repRange: "12-15", alternatives: ["Seated Calf Raise", "Standing Calf Raise", "Single-Leg Calf Raise"] }
    ],
    [
      { name: "Hack Squat Machine", repRange: "6-10", alternatives: ["Leg Press", "Goblet Squat", "Smith Squat"] },
      { name: "Romanian Deadlift (DB)", repRange: "8-12", alternatives: ["Hamstring Curl", "Hip Hinge (KB)", "Glute Bridge"] },
      { name: "Leg Extension", repRange: "10-12", alternatives: ["Step-Ups", "Split Squat", "Goblet Squat (slow)"] },
      { name: "Seated Calf Raise", repRange: "12-15", alternatives: ["Standing Calf Raise", "Single-Leg Calf Raise", "Leg Press Calf Press"] }
    ]
  ],
  arms: [
    [
      { name: "EZ-Bar Curl", repRange: "8-12", alternatives: ["DB Curl", "Cable Curl", "Hammer Curl"] },
      { name: "Hammer Curl", repRange: "10-12", alternatives: ["Incline DB Curl", "Cable Curl", "DB Curl"] },
      { name: "Cable Tricep Pushdown", repRange: "10-12", alternatives: ["Rope Pushdown", "Dips (assisted)", "Close-Grip Push-Ups"] },
      { name: "Overhead Tricep Extension", repRange: "10-12", alternatives: ["Cable OH Extension", "Skull Crushers", "Tricep Pushdown"] }
    ],
    [
      { name: "Incline Dumbbell Curl", repRange: "10-12", alternatives: ["DB Curl", "Cable Curl", "EZ-Bar Curl"] },
      { name: "Cable Curl", repRange: "10-12", alternatives: ["DB Curl", "EZ-Bar Curl", "Hammer Curl"] },
      { name: "Skull Crushers (light)", repRange: "8-12", alternatives: ["Overhead Extension", "Cable Pushdown", "Close-Grip Push-Ups"] },
      { name: "Rope Pushdown", repRange: "10-12", alternatives: ["Cable Pushdown", "Dips (assisted)", "Overhead Extension"] }
    ]
  ],
  full: [
    [
      { name: "Chest Press", repRange: "8-12", alternatives: ["DB Bench Press", "Bench Press", "Push-Ups"] },
      { name: "Lat Pulldown", repRange: "8-12", alternatives: ["Assisted Pull-Ups", "High Row Machine", "Band Pull-Downs"] },
      { name: "Leg Press", repRange: "8-12", alternatives: ["Goblet Squat", "Hack Squat", "Smith Squat (light)"] },
      { name: "Plank", repRange: "30-60", alternatives: ["Dead Bug", "Pallof Press", "Side Plank"] }
    ],
    [
      { name: "Dumbbell Bench Press", repRange: "8-12", alternatives: ["Chest Press Machine", "Bench Press", "Push-Ups"] },
      { name: "Seated Cable Row", repRange: "8-12", alternatives: ["Chest-Supported Row", "Machine Row", "DB Row"] },
      { name: "Goblet Squat", repRange: "8-12", alternatives: ["Leg Press", "Smith Squat", "Bodyweight Squat"] },
      { name: "Dead Bug", repRange: "10-12", alternatives: ["Plank", "Pallof Press", "Bird Dog"] }
    ]
  ]
};

// ---------- Injury rules (NEW)
// This does NOT diagnose injuries. It simply applies conservative substitutions and/or active recovery plans.
const INJURY_RULES = {
  none: {
    label: "None",
    avoid: [],
    swap: {}
  },
  shoulder: {
    label: "Shoulder",
    avoid: ["bench", "press", "overhead", "fly", "dip"],
    swap: {
      // pressing -> stable or rehab-ish
      "barbell bench press": "Machine Chest Press",
      "dumbbell bench press": "Machine Chest Press",
      "seated dumbbell shoulder press": "Landmine Press",
      "arnold press": "Landmine Press",
      "cable fly": "Pec Deck (light)",
      "tricep dips (assisted)": "Cable Tricep Pushdown"
    },
    warmup: [
      "Band external rotations: 2×12",
      "Scapular wall slides: 2×8",
      "Band pull-aparts: 2×12",
      "1–2 light ramp-up sets on first press"
    ],
    recovery: [
      "Band external rotation: 3×12",
      "Face pulls (light): 3×12",
      "Serratus wall slides: 2×8",
      "Easy incline walk: 10–15 min"
    ]
  },
  elbow: {
    label: "Elbow",
    avoid: ["curl", "extension", "skull", "dip"],
    swap: {
      "ez-bar curl": "Cable Curl (light)",
      "skull crushers (light)": "Rope Pushdown (light)",
      "overhead tricep extension": "Cable Tricep Pushdown (light)"
    },
    warmup: [
      "Wrist flexor/extensor warm-up: 1–2 min each",
      "Very light curls: 1×15",
      "Tricep pushdowns (light): 1×15"
    ],
    recovery: [
      "Light band curls: 2×20",
      "Light band pushdowns: 2×20",
      "Forearm stretching: 2×30 sec each"
    ]
  },
  wrist: {
    label: "Wrist",
    avoid: ["push-up", "bench", "curl", "press"],
    swap: {
      "push-ups": "Machine Chest Press",
      "dumbbell curl": "Cable Curl (neutral grip if possible)",
      "dumbbell bench press": "Machine Chest Press"
    },
    warmup: [
      "Wrist circles: 60 sec",
      "Forearm extensor stretch: 2×20 sec",
      "Neutral-grip warm-up sets where possible"
    ],
    recovery: [
      "Light grip work (pain-free): 2×20 sec",
      "Forearm mobility: 5 min",
      "Easy bike: 10–15 min"
    ]
  },
  lowback: {
    label: "Lower back",
    avoid: ["deadlift", "rdl", "good morning", "row (unsupported)"],
    swap: {
      "romanian deadlift (db)": "Hamstring Curl",
      "one-arm dumbbell row": "Chest-Supported Row"
    },
    warmup: [
      "Cat-cow: 6 reps",
      "Hip hinge drill (bodyweight): 8 reps",
      "Glute bridge: 2×10",
      "Light ramp-up sets on legs"
    ],
    recovery: [
      "McGill curl-up (gentle): 2×6",
      "Side plank (short holds): 2×20 sec",
      "Bird dog: 2×6/side",
      "Easy walk: 10–20 min"
    ]
  },
  knee: {
    label: "Knee",
    avoid: ["lunge", "split squat", "deep squat"],
    swap: {
      "walking lunges": "Leg Press (shorter range)",
      "split squat": "Leg Press (shorter range)",
      "goblet squat": "Leg Press"
    },
    warmup: [
      "Quad activation (TKE band): 2×12",
      "Glute bridges: 2×10",
      "Bodyweight squat to a box: 2×6 (pain-free)"
    ],
    recovery: [
      "TKE band: 3×12",
      "Step-ups (very low box): 2×8/side",
      "Bike (easy): 10–15 min"
    ]
  },
  ankle: {
    label: "Ankle",
    avoid: ["lunge", "jump", "calf raise (heavy)"],
    swap: {
      "walking lunges": "Leg Press",
      "standing calf raise": "Seated Calf Raise (light)"
    },
    warmup: [
      "Ankle circles: 60 sec",
      "Calf stretch: 2×20 sec",
      "Tibialis raises (light): 2×12"
    ],
    recovery: [
      "Ankle dorsiflexion rocks: 2×10",
      "Seated calf raises (light): 2×15",
      "Easy bike: 10–15 min"
    ]
  },
  hip: {
    label: "Hip",
    avoid: ["deep squat", "lunge"],
    swap: {
      "walking lunges": "Hamstring Curl",
      "split squat": "Leg Press (shorter range)"
    },
    warmup: [
      "Hip flexor stretch: 2×20 sec",
      "Glute bridge: 2×10",
      "Side-lying clamshell: 2×12"
    ],
    recovery: [
      "Clamshell: 3×12",
      "Glute bridge (easy): 3×10",
      "Easy walk: 10–20 min"
    ]
  },
  neck: {
    label: "Neck",
    avoid: ["shrug", "heavy overhead"],
    swap: {
      "seated dumbbell shoulder press": "Landmine Press",
      "arnold press": "Machine Shoulder Press (light)"
    },
    warmup: [
      "Chin tucks: 2×8",
      "Neck mobility (gentle): 60 sec",
      "Band pull-aparts: 2×12"
    ],
    recovery: [
      "Chin tucks: 3×8",
      "Thoracic extension over foam roller (gentle): 2×6",
      "Easy walk: 10–20 min"
    ]
  },
  cardio: {
    label: "Low cardio tolerance",
    avoid: [],
    swap: {},
    warmup: [
      "2–4 min easy bike or incline walk",
      "Nasal breathing pace: keep it easy",
      "Longer rest between sets if needed"
    ],
    recovery: [
      "Easy bike or walk: 10–15 min",
      "Breathing: 2 min slow exhales"
    ]
  }
};

// ---------- DOM
const form = document.getElementById("workoutForm");
const outputEl = document.getElementById("output");
const historyEl = document.getElementById("history");
const prsEl = document.getElementById("prs");

const statusEl = document.getElementById("status");
const rotationHintEl = document.getElementById("rotationHint");

const resetRotationBtn = document.getElementById("resetRotationBtn");
const clearAllBtn = document.getElementById("clearAllBtn");
const exportBtn = document.getElementById("exportBtn");
const importFile = document.getElementById("importFile");

const setsModeEl = document.getElementById("setsMode");
const customSetsEl = document.getElementById("customSets");

const injuryProfileEl = document.getElementById("injuryProfile");
const intensityModeEl = document.getElementById("intensityMode");

// Chips
const rotationChip = document.getElementById("rotationChip");
const variationChip = document.getElementById("variationChip");

// Chat
const chatLogEl = document.getElementById("chatLog");
const chatInputEl = document.getElementById("chatInput");
const chatSendBtn = document.getElementById("chatSendBtn");
const chatModeBadge = document.getElementById("chatModeBadge");
const quickPromptsEl = document.getElementById("quickPrompts");

// ---------- Helpers
function setStatus(message = "", type = "") {
  statusEl.textContent = message;
  statusEl.className = `status ${type}`.trim();
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getDayIndex() {
  const v = Number(localStorage.getItem(STORE.dayIndex));
  return Number.isFinite(v) && v >= 0 ? v : 0;
}

function setDayIndex(v) {
  localStorage.setItem(STORE.dayIndex, String(v));
}

function nowISO() {
  return new Date().toISOString();
}

function prettyDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function isValidDays(d) {
  return Number.isFinite(d) && d >= 1 && d <= 6;
}

function isValidTime(t) {
  return Number.isFinite(t) && t >= 20 && t <= 180;
}

function setsForTime(minutes) {
  if (minutes <= 30) return 2;
  if (minutes <= 45) return 3;
  return 4;
}

function uid() {
  return `w_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function sanitizeNumberOrNull(raw) {
  if (raw === "") return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  if (n < 0) return null;
  return n;
}

// ---------- Sets mode handling
setsModeEl.addEventListener("change", () => {
  customSetsEl.disabled = (setsModeEl.value !== "custom");
});

// ---------- Split variation rotation
function getSplitVarIndexMap() {
  const m = readJSON(STORE.splitVarIndex, {});
  return (m && typeof m === "object") ? m : {};
}
function setSplitVarIndexMap(map) {
  writeJSON(STORE.splitVarIndex, map);
}
function pickVariation(split) {
  const variations = LIB[split] || [];
  if (variations.length === 0) return { variationIndex: 0, session: [] };

  const map = getSplitVarIndexMap();
  const idx = Number(map[split] ?? 0);
  const session = variations[idx % variations.length];

  map[split] = idx + 1;
  setSplitVarIndexMap(map);

  return { variationIndex: idx % variations.length, session };
}

// ---------- Rotation hint
function renderRotationHint(days) {
  const cycle = getSplit(days);
  const idx = getDayIndex();
  const nextSplit = cycle[idx % cycle.length];
  const variations = LIB[nextSplit]?.length ?? 1;
  rotationHintEl.textContent = `Next in rotation: ${nextSplit.toUpperCase()} (has ${variations} workout variations)`;
  rotationChip.textContent = `Rotation: Day ${idx + 1}`;
}

// ---------- Injury-aware exercise swapping (NEW)
function applyInjurySwaps(session, injuryKey, intensityMode) {
  const rules = INJURY_RULES[injuryKey] || INJURY_RULES.none;
  const swapMap = rules.swap || {};
  const avoidTokens = rules.avoid || [];

  // If user chooses Active recovery, we don't generate the split session at all;
  // we generate a recovery plan instead.
  if (intensityMode === "recovery") {
    return { mode: "recovery", session: buildActiveRecoverySession(injuryKey) };
  }

  // Otherwise, do conservative swaps (especially in cautious mode).
  const cautious = intensityMode === "cautious";
  const out = session.map(ex => {
    const n = String(ex.name).toLowerCase();

    // If in cautious mode, avoid certain movement patterns more aggressively.
    const isAvoid = avoidTokens.some(tok => n.includes(tok));
    const directSwap = swapMap[n];

    if (directSwap) {
      return {
        ...ex,
        name: directSwap,
        // keep rep range but slightly higher reps for joint-friendly default
        repRange: cautious ? "10-12" : ex.repRange,
        alternatives: [...new Set([...(ex.alternatives || []), ex.name])]
      };
    }

    if (cautious && isAvoid) {
      // choose first alternative if present; otherwise keep name but adjust rep range
      const alt = (ex.alternatives && ex.alternatives.length > 0) ? ex.alternatives[0] : ex.name;
      return {
        ...ex,
        name: alt,
        repRange: "10-12",
        alternatives: [...new Set([...(ex.alternatives || []), ex.name])]
      };
    }

    return ex;
  });

  return { mode: "normal", session: out };
}

function buildActiveRecoverySession(injuryKey) {
  const rules = INJURY_RULES[injuryKey] || INJURY_RULES.none;
  const recovery = rules.recovery || [
    "Easy walk: 10–20 min",
    "Gentle mobility: 8–10 min",
    "Light core: 2–3 movements"
  ];

  // Convert into "exercise objects" so the UI stays consistent.
  // Use repRange as "guidance units" for recovery.
  return recovery.map((item) => ({
    name: item,
    repRange: "easy",
    alternatives: ["If something hurts, skip it and do easy walking instead."]
  }));
}

// ---------- Warm-up planner (NEW)
function warmupPlan(split, injuryKey) {
  const base = [
    "2–4 min easy bike or incline walk",
    "Dynamic mobility: 3–4 min (controlled range)",
    "2 ramp-up sets for your first main lift (light → moderate)"
  ];

  const splitPlans = {
    push: [
      "Band pull-aparts: 2×12",
      "Scapular push-ups: 2×8",
      "Light dumbbell press: 1×12"
    ],
    pull: [
      "Band rows: 2×12",
      "Shoulder external rotation (light): 2×10",
      "Scapular retractions: 2×8"
    ],
    legs: [
      "Glute bridges: 2×10",
      "Bodyweight squat to box: 2×6",
      "Hamstring hinge drill: 8 reps"
    ],
    upper: [
      "Band pull-aparts: 2×12",
      "Light push + light pull warm-up sets",
      "Thoracic extension (gentle): 6 reps"
    ],
    lower: [
      "Glute bridges: 2×10",
      "Bodyweight squat: 2×6",
      "Calf pumps: 20 reps"
    ],
    arms: [
      "Light curls: 1×15",
      "Light pushdowns: 1×15",
      "Shoulder circles: 60 sec"
    ],
    full: [
      "Glute bridges: 2×10",
      "Band pull-aparts: 2×12",
      "Bodyweight squat: 2×6"
    ]
  };

  const injury = INJURY_RULES[injuryKey]?.warmup || [];
  const plan = [...base, ...(splitPlans[split] || []), ...injury];

  // De-dup while preserving order
  const seen = new Set();
  return plan.filter(x => (seen.has(x) ? false : (seen.add(x), true)));
}

// =======================
// Generate workout
// =======================
form.addEventListener("submit", (e) => {
  e.preventDefault();
  setStatus("");

  const days = Number(document.getElementById("days").value);
  const time = Number(document.getElementById("time").value);

  if (!isValidDays(days)) {
    setStatus("Days per week must be between 1 and 6.", "err");
    return;
  }
  if (!isValidTime(time)) {
    setStatus("Time must be at least 20 minutes (max 180).", "err");
    return;
  }

  let sets = setsForTime(time);
  if (setsModeEl.value === "custom") {
    const cs = Number(customSetsEl.value);
    if (!Number.isFinite(cs) || cs < 1 || cs > 6) {
      setStatus("Custom sets must be between 1 and 6.", "err");
      return;
    }
    sets = cs;
  }

  const cycle = getSplit(days);
  const dayIndex = getDayIndex();
  const split = cycle[dayIndex % cycle.length];

  // advance day rotation
  setDayIndex(dayIndex + 1);
  renderRotationHint(days);

  const workoutId = uid();
  const { variationIndex, session } = pickVariation(split);

  // NEW: injury-awar
