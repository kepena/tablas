// ---------- Datos: trucos para cada tabla ----------
const TRICKS = {
  1: "Cualquier número multiplicado por 1 se queda igual. ¡Es el más fácil de todos!",
  2: "Multiplicar por 2 es sumar el número consigo mismo. 6×2 = 6+6 = 12.",
  3: "Suma el número tres veces, o duplícalo y súmale una vez más. 4×3 = 4+4+4 = 12.",
  4: "Duplica dos veces seguidas. 6×4 → 6×2=12 → 12×2=24.",
  5: "Multiplica por 10 y divide entre 2. También: si el número es par, el resultado termina en 0; si es impar, termina en 5.",
  6: "Para números pares, multiplica por 3 y luego duplica. 8×6 → 8×3=24 → 24×2=48.",
  7: "La más temida, pero tiene truco: 7×n = 5×n + 2×n. Súmalos y listo. 7×8 = (5×8)+(2×8) = 40+16 = 56.",
  8: "Duplica tres veces seguidas. 5×8 → 5×2=10 → 10×2=20 → 20×2=40.",
  9: "Truco de los dedos: numera tus 10 dedos del 1 al 10 y baja el dedo del número n. Los dedos a la izquierda son las decenas, los de la derecha las unidades. También: las cifras del resultado siempre suman 9.",
  10: "Solo añade un cero al final del número. 7×10 = 70.",
  11: "Para el 1 al 9, repite el dígito dos veces. 11×4 = 44. Para el 10+, es más complejo, ¡pero ya casi no la necesitas!",
  12: "12×n = 10×n + 2×n. Multiplica por 10, luego suma el doble del número. 12×6 = 60+12 = 72.",
};

const TABLES = Array.from({ length: 12 }, (_, i) => i + 1);
const FACTORS = Array.from({ length: 12 }, (_, i) => i + 1);

// ---------- Sonidos (generados con Web Audio API, sin archivos externos) ----------
const SOUND_KEY = "tablas_sound_enabled_v1";
let soundEnabled = localStorage.getItem(SOUND_KEY) !== "false";
let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function playTone(freq, startTime, duration, type, peakGain) {
  const ctx = getAudioCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t0 = ctx.currentTime + startTime;
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(peakGain, t0 + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

function playNotes(notes) {
  if (!soundEnabled) return;
  notes.forEach(([freq, start, dur, type, gain]) => playTone(freq, start, dur, type, gain));
}

const Sound = {
  click: () => playNotes([[520, 0, 0.06, "square", 0.05]]),
  flip: () => playNotes([[320, 0, 0.07, "triangle", 0.1], [440, 0.05, 0.08, "triangle", 0.08]]),
  correct: () => playNotes([[523.25, 0, 0.1, "sine", 0.18], [659.25, 0.08, 0.12, "sine", 0.18], [783.99, 0.16, 0.18, "sine", 0.18]]),
  wrong: () => playNotes([[220, 0, 0.16, "sawtooth", 0.14], [164.81, 0.1, 0.22, "sawtooth", 0.14]]),
  match: () => playNotes([[659.25, 0, 0.1, "sine", 0.18], [880, 0.08, 0.16, "sine", 0.16]]),
  buzzer: () => playNotes([[180, 0, 0.3, "sawtooth", 0.14], [140, 0.15, 0.35, "sawtooth", 0.14]]),
  victory: () => playNotes([
    [523.25, 0, 0.12, "sine", 0.2],
    [659.25, 0.12, 0.12, "sine", 0.2],
    [783.99, 0.24, 0.12, "sine", 0.2],
    [1046.5, 0.36, 0.32, "sine", 0.22],
  ]),
};

const soundToggleBtn = document.getElementById("soundToggle");
function updateSoundToggleUI() {
  soundToggleBtn.textContent = soundEnabled ? "🔊" : "🔇";
  soundToggleBtn.setAttribute("aria-label", soundEnabled ? "Silenciar sonidos" : "Activar sonidos");
}
soundToggleBtn.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  localStorage.setItem(SOUND_KEY, String(soundEnabled));
  updateSoundToggleUI();
  if (soundEnabled) { getAudioCtx(); Sound.click(); }
});
updateSoundToggleUI();

// ---------- Navegación entre vistas ----------
function showView(id) {
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

document.querySelectorAll("[data-view]").forEach(el => {
  el.addEventListener("click", () => {
    Sound.click();
    showView(el.dataset.view);
  });
});

// ---------- Progreso (localStorage) ----------
const PROGRESS_KEY = "tablas_progress_v1";

function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {};
  } catch {
    return {};
  }
}

function saveProgress(progress) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

function recordAnswer(table, correct) {
  const progress = loadProgress();
  if (!progress[table]) progress[table] = { correct: 0, total: 0 };
  progress[table].total += 1;
  if (correct) progress[table].correct += 1;
  saveProgress(progress);
}

function starsFor(stats) {
  if (!stats || stats.total < 5) return { stars: 0, label: "Sin practicar" };
  const pct = stats.correct / stats.total;
  if (pct >= 0.9) return { stars: 3, label: `${Math.round(pct * 100)}% acierto` };
  if (pct >= 0.65) return { stars: 2, label: `${Math.round(pct * 100)}% acierto` };
  return { stars: 1, label: `${Math.round(pct * 100)}% acierto` };
}

function renderProgress() {
  const progress = loadProgress();
  const grid = document.getElementById("progressGrid");
  grid.innerHTML = "";
  TABLES.forEach(t => {
    const { stars, label } = starsFor(progress[t]);
    const card = document.createElement("div");
    card.className = "progress-card";
    card.innerHTML = `
      <div class="p-table">Tabla ${t}</div>
      <div class="p-stars">${"⭐".repeat(stars)}${"☆".repeat(3 - stars)}</div>
      <div class="p-label">${label}</div>
    `;
    grid.appendChild(card);
  });
}

document.getElementById("resetProgress").addEventListener("click", () => {
  Sound.click();
  if (confirm("¿Seguro que quieres borrar todo tu progreso?")) {
    localStorage.removeItem(PROGRESS_KEY);
    renderProgress();
  }
});

// ---------- Vista: Practicar (flashcards) ----------
let practiceTable = null;
let practiceIndex = 0;

function buildTablePicker(container, multi, onChange) {
  container.innerHTML = "";
  TABLES.forEach(t => {
    const btn = document.createElement("button");
    btn.className = "table-btn";
    btn.textContent = t;
    btn.dataset.table = t;
    btn.addEventListener("click", () => { Sound.click(); onChange(t, btn); });
    container.appendChild(btn);
  });
}

const practicePicker = document.getElementById("practiceTablePicker");
buildTablePicker(practicePicker, false, (t, btn) => {
  practicePicker.querySelectorAll(".table-btn").forEach(b => b.classList.remove("selected"));
  btn.classList.add("selected");
  startPractice(t);
});

function startPractice(table) {
  practiceTable = table;
  practiceIndex = 0;
  document.getElementById("practiceArea").classList.remove("hidden");
  const trickBox = document.getElementById("trickBox");
  trickBox.textContent = "💡 Truco: " + TRICKS[table];
  trickBox.classList.add("show");
  renderFlashcard();
}

function renderFlashcard() {
  const n = FACTORS[practiceIndex];
  const front = document.getElementById("cardFront");
  const back = document.getElementById("cardBack");
  front.textContent = `${practiceTable} × ${n}`;
  back.textContent = `${practiceTable * n}`;
  document.getElementById("flashcard").classList.remove("flipped");
  document.getElementById("cardCounter").textContent = `${practiceIndex + 1} / ${FACTORS.length}`;
}

document.getElementById("flashcard").addEventListener("click", () => {
  document.getElementById("flashcard").classList.toggle("flipped");
  Sound.flip();
});

document.getElementById("nextCard").addEventListener("click", () => {
  Sound.click();
  practiceIndex = (practiceIndex + 1) % FACTORS.length;
  renderFlashcard();
});

document.getElementById("prevCard").addEventListener("click", () => {
  Sound.click();
  practiceIndex = (practiceIndex - 1 + FACTORS.length) % FACTORS.length;
  renderFlashcard();
});

// ---------- Vista: Quiz ----------
let quizTables = new Set();
let quizTimer = null;
let quizTimeLeft = 30;
let quizScore = 0;
let quizStreak = 0;
let quizCurrent = { a: 0, b: 0 };
let quizAttempted = 0;

const quizPicker = document.getElementById("quizTablePicker");
buildTablePicker(quizPicker, true, (t, btn) => {
  if (quizTables.has(t)) {
    quizTables.delete(t);
    btn.classList.remove("selected");
  } else {
    quizTables.add(t);
    btn.classList.add("selected");
  }
});

document.getElementById("startQuiz").addEventListener("click", () => { Sound.click(); startQuiz(); });
document.getElementById("retryQuiz").addEventListener("click", () => {
  Sound.click();
  document.getElementById("quizResults").classList.add("hidden");
  document.getElementById("quizSetup").classList.remove("hidden");
});

function startQuiz() {
  const activeTables = quizTables.size > 0 ? [...quizTables] : TABLES;
  quizScore = 0;
  quizStreak = 0;
  quizTimeLeft = 30;
  quizAttempted = 0;

  document.getElementById("quizSetup").classList.add("hidden");
  document.getElementById("quizResults").classList.add("hidden");
  document.getElementById("quizArea").classList.remove("hidden");
  document.getElementById("quizScore").textContent = "0";
  document.getElementById("quizStreak").textContent = "0";
  document.getElementById("quizTimer").textContent = quizTimeLeft;
  document.getElementById("quizFeedback").textContent = "";
  document.getElementById("quizFeedback").className = "quiz-feedback";

  nextQuestion(activeTables);

  const answerInput = document.getElementById("quizAnswer");
  answerInput.value = "";
  answerInput.focus();

  clearInterval(quizTimer);
  quizTimer = setInterval(() => {
    quizTimeLeft -= 1;
    document.getElementById("quizTimer").textContent = quizTimeLeft;
    if (quizTimeLeft <= 0) endQuiz(activeTables);
  }, 1000);

  answerInput.onkeydown = (e) => {
    if (e.key === "Enter") checkAnswer(activeTables);
  };
  answerInput.oninput = () => {
    // auto-check once enough digits typed vs answer length, for speed & fun
    const val = answerInput.value;
    if (val.length >= String(quizCurrent.a * quizCurrent.b).length && val !== "") {
      checkAnswer(activeTables);
    }
  };
}

function nextQuestion(activeTables) {
  const table = activeTables[Math.floor(Math.random() * activeTables.length)];
  const factor = FACTORS[Math.floor(Math.random() * FACTORS.length)];
  quizCurrent = { a: table, b: factor };
  document.getElementById("quizQuestion").textContent = `${table} × ${factor} = ?`;
  document.getElementById("quizAnswer").value = "";
}

function checkAnswer(activeTables) {
  const input = document.getElementById("quizAnswer");
  const val = Number(input.value);
  const correctVal = quizCurrent.a * quizCurrent.b;
  const feedback = document.getElementById("quizFeedback");

  if (input.value === "") return;

  quizAttempted += 1;
  const isCorrect = val === correctVal;
  recordAnswer(quizCurrent.a, isCorrect);

  if (isCorrect) {
    Sound.correct();
    quizStreak += 1;
    const bonus = quizStreak >= 5 ? 2 : 1;
    quizScore += bonus;
    quizTimeLeft += 2;
    document.getElementById("quizTimer").textContent = quizTimeLeft;
    feedback.textContent = quizStreak >= 5 ? `¡Racha de ${quizStreak}! 🔥 +${bonus} (+2s)` : "¡Correcto! ✅ +2s";
    feedback.className = "quiz-feedback correct";
  } else {
    Sound.wrong();
    quizStreak = 0;
    feedback.textContent = `Era ${correctVal} 😅`;
    feedback.className = "quiz-feedback wrong";
  }

  document.getElementById("quizScore").textContent = quizScore;
  document.getElementById("quizStreak").textContent = quizStreak;

  setTimeout(() => {
    feedback.textContent = "";
    feedback.className = "quiz-feedback";
    if (quizTimeLeft > 0) {
      nextQuestion(activeTables);
      document.getElementById("quizAnswer").focus();
    }
  }, isCorrect ? 350 : 800);
}

function endQuiz(activeTables) {
  clearInterval(quizTimer);
  Sound.buzzer();
  document.getElementById("quizArea").classList.add("hidden");
  document.getElementById("quizResults").classList.remove("hidden");
  document.getElementById("finalScore").textContent = quizScore;

  let title = "¡Buen intento!";
  if (quizScore >= 25) title = "¡Eres una máquina de multiplicar! 🤖";
  else if (quizScore >= 15) title = "¡Excelente trabajo! 🌟";
  else if (quizScore >= 8) title = "¡Vas muy bien! 💪";

  document.getElementById("resultsTitle").textContent = title;
  document.getElementById("resultsDetail").textContent =
    `Respondiste ${quizAttempted} preguntas de las tablas: ${activeTables.sort((a,b)=>a-b).join(", ")}.`;

  renderProgress();
}

// ---------- Utilidad: generar respuestas falsas creíbles ----------
function makeDistractors(a, b, correct) {
  const candidates = new Set();
  const tries = [
    a * (b + 1), a * (b - 1), (a + 1) * b, (a - 1) * b,
    correct + a, correct - a, correct + b, correct - b,
    correct + 1, correct - 1, correct + 2, correct - 2,
  ];
  tries.forEach(v => { if (v > 0 && v !== correct) candidates.add(v); });
  let extra = 3;
  while (candidates.size < 3) {
    const v = correct + extra;
    if (v > 0 && v !== correct) candidates.add(v);
    extra += 1;
  }
  const pool = [...candidates];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 3);
}

// ---------- Vista: Opción múltiple ----------
let mcTables = new Set();
let mcActiveTables = [];
let mcScore = 0;
let mcStreak = 0;
let mcRoundNum = 0;
let mcCurrent = { a: 0, b: 0 };
let mcLocked = false;
const MC_TOTAL = 10;

const mcPicker = document.getElementById("mcTablePicker");
buildTablePicker(mcPicker, true, (t, btn) => {
  if (mcTables.has(t)) {
    mcTables.delete(t);
    btn.classList.remove("selected");
  } else {
    mcTables.add(t);
    btn.classList.add("selected");
  }
});

document.getElementById("startMC").addEventListener("click", () => { Sound.click(); startMC(); });
document.getElementById("retryMC").addEventListener("click", () => {
  Sound.click();
  document.getElementById("mcResults").classList.add("hidden");
  document.getElementById("mcSetup").classList.remove("hidden");
});

function startMC() {
  mcActiveTables = mcTables.size > 0 ? [...mcTables] : TABLES;
  mcScore = 0;
  mcStreak = 0;
  mcRoundNum = 0;

  document.getElementById("mcSetup").classList.add("hidden");
  document.getElementById("mcResults").classList.add("hidden");
  document.getElementById("mcArea").classList.remove("hidden");
  document.getElementById("mcScore").textContent = "0";
  document.getElementById("mcStreak").textContent = "0";

  nextMCQuestion();
}

function nextMCQuestion() {
  mcRoundNum += 1;
  if (mcRoundNum > MC_TOTAL) { endMC(); return; }
  document.getElementById("mcRound").textContent = mcRoundNum;

  const table = mcActiveTables[Math.floor(Math.random() * mcActiveTables.length)];
  const factor = FACTORS[Math.floor(Math.random() * FACTORS.length)];
  const correct = table * factor;
  mcCurrent = { a: table, b: factor };
  document.getElementById("mcQuestion").textContent = `${table} × ${factor} = ?`;

  const options = makeDistractors(table, factor, correct);
  options.push(correct);
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }

  const optionsEl = document.getElementById("mcOptions");
  optionsEl.innerHTML = "";
  mcLocked = false;
  options.forEach(val => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.textContent = val;
    btn.addEventListener("click", () => selectMCOption(btn, val, correct));
    optionsEl.appendChild(btn);
  });

  const feedback = document.getElementById("mcFeedback");
  feedback.textContent = "";
  feedback.className = "quiz-feedback";
}

function selectMCOption(btn, val, correct) {
  if (mcLocked) return;
  mcLocked = true;

  const isCorrect = val === correct;
  recordAnswer(mcCurrent.a, isCorrect);

  const optionsEl = document.getElementById("mcOptions");
  [...optionsEl.children].forEach(b => {
    b.disabled = true;
    if (Number(b.textContent) === correct) b.classList.add("correct");
  });

  const feedback = document.getElementById("mcFeedback");
  if (isCorrect) {
    Sound.correct();
    mcStreak += 1;
    mcScore += 1;
    feedback.textContent = "¡Correcto! ✅";
    feedback.className = "quiz-feedback correct";
  } else {
    Sound.wrong();
    mcStreak = 0;
    btn.classList.add("wrong");
    feedback.textContent = `Era ${correct} 😅`;
    feedback.className = "quiz-feedback wrong";
  }
  document.getElementById("mcScore").textContent = mcScore;
  document.getElementById("mcStreak").textContent = mcStreak;

  setTimeout(nextMCQuestion, 900);
}

function endMC() {
  Sound.victory();
  document.getElementById("mcArea").classList.add("hidden");
  document.getElementById("mcResults").classList.remove("hidden");
  document.getElementById("mcFinalScore").textContent = mcScore;

  let title = "¡Buen intento!";
  if (mcScore === MC_TOTAL) title = "¡Perfecto! 🌟🌟🌟";
  else if (mcScore >= 8) title = "¡Excelente! 🌟";
  else if (mcScore >= 5) title = "¡Vas bien! 💪";
  document.getElementById("mcResultsTitle").textContent = title;

  renderProgress();
}

// ---------- Vista: Verdadero o falso ----------
let tfTables = new Set();
let tfActiveTables = [];
let tfScore = 0;
let tfStreak = 0;
let tfRoundNum = 0;
let tfCurrent = { a: 0, b: 0, shown: 0, isTrue: true };
let tfLocked = false;
const TF_TOTAL = 10;

const tfPicker = document.getElementById("tfTablePicker");
buildTablePicker(tfPicker, true, (t, btn) => {
  if (tfTables.has(t)) {
    tfTables.delete(t);
    btn.classList.remove("selected");
  } else {
    tfTables.add(t);
    btn.classList.add("selected");
  }
});

document.getElementById("startTF").addEventListener("click", () => { Sound.click(); startTF(); });
document.getElementById("retryTF").addEventListener("click", () => {
  Sound.click();
  document.getElementById("tfResults").classList.add("hidden");
  document.getElementById("tfSetup").classList.remove("hidden");
});
document.getElementById("tfTrue").addEventListener("click", () => answerTF(true));
document.getElementById("tfFalse").addEventListener("click", () => answerTF(false));

function startTF() {
  tfActiveTables = tfTables.size > 0 ? [...tfTables] : TABLES;
  tfScore = 0;
  tfStreak = 0;
  tfRoundNum = 0;

  document.getElementById("tfSetup").classList.add("hidden");
  document.getElementById("tfResults").classList.add("hidden");
  document.getElementById("tfArea").classList.remove("hidden");
  document.getElementById("tfScore").textContent = "0";
  document.getElementById("tfStreak").textContent = "0";

  nextTFQuestion();
}

function nextTFQuestion() {
  tfRoundNum += 1;
  if (tfRoundNum > TF_TOTAL) { endTF(); return; }
  document.getElementById("tfRound").textContent = tfRoundNum;

  const table = tfActiveTables[Math.floor(Math.random() * tfActiveTables.length)];
  const factor = FACTORS[Math.floor(Math.random() * FACTORS.length)];
  const correct = table * factor;
  const showTrue = Math.random() < 0.5;
  const shown = showTrue ? correct : makeDistractors(table, factor, correct)[0];

  tfCurrent = { a: table, b: factor, shown, isTrue: shown === correct };
  document.getElementById("tfQuestion").textContent = `${table} × ${factor} = ${shown}`;

  tfLocked = false;
  document.getElementById("tfTrue").disabled = false;
  document.getElementById("tfFalse").disabled = false;
  const feedback = document.getElementById("tfFeedback");
  feedback.textContent = "";
  feedback.className = "quiz-feedback";
}

function answerTF(userSaysTrue) {
  if (tfLocked) return;
  tfLocked = true;

  const isCorrect = userSaysTrue === tfCurrent.isTrue;
  recordAnswer(tfCurrent.a, isCorrect);
  document.getElementById("tfTrue").disabled = true;
  document.getElementById("tfFalse").disabled = true;

  const feedback = document.getElementById("tfFeedback");
  if (isCorrect) {
    Sound.correct();
    tfStreak += 1;
    tfScore += 1;
    feedback.textContent = "¡Correcto! ✅";
    feedback.className = "quiz-feedback correct";
  } else {
    Sound.wrong();
    tfStreak = 0;
    const realCorrect = tfCurrent.a * tfCurrent.b;
    feedback.textContent = tfCurrent.isTrue ? "¡Era verdad! 😅" : `Era falso, es ${realCorrect} 😅`;
    feedback.className = "quiz-feedback wrong";
  }
  document.getElementById("tfScore").textContent = tfScore;
  document.getElementById("tfStreak").textContent = tfStreak;

  setTimeout(nextTFQuestion, 900);
}

function endTF() {
  Sound.victory();
  document.getElementById("tfArea").classList.add("hidden");
  document.getElementById("tfResults").classList.remove("hidden");
  document.getElementById("tfFinalScore").textContent = tfScore;

  let title = "¡Buen intento!";
  if (tfScore === TF_TOTAL) title = "¡Perfecto! 🌟🌟🌟";
  else if (tfScore >= 8) title = "¡Excelente! 🌟";
  else if (tfScore >= 5) title = "¡Vas bien! 💪";
  document.getElementById("tfResultsTitle").textContent = title;

  renderProgress();
}

// ---------- Vista: Memorama ----------
let memoryTable = null;
let memoryFirstCard = null;
let memorySecondCard = null;
let memoryMatches = 0;
let memoryMoves = 0;
let memoryLocked = false;
const MEMORY_PAIRS = 6;

const memoryPicker = document.getElementById("memoryTablePicker");
buildTablePicker(memoryPicker, false, (t, btn) => {
  memoryPicker.querySelectorAll(".table-btn").forEach(b => b.classList.remove("selected"));
  btn.classList.add("selected");
  startMemory(t);
});

document.getElementById("retryMemory").addEventListener("click", () => { Sound.click(); startMemory(memoryTable); });

function startMemory(table) {
  memoryTable = table;
  memoryMatches = 0;
  memoryMoves = 0;
  memoryFirstCard = null;
  memorySecondCard = null;
  memoryLocked = false;

  document.getElementById("memoryArea").classList.remove("hidden");
  document.getElementById("memoryResults").classList.add("hidden");
  document.getElementById("memoryMoves").textContent = "0";
  document.getElementById("memoryMatches").textContent = "0";

  const factors = [...FACTORS].sort(() => Math.random() - 0.5).slice(0, MEMORY_PAIRS);
  const cards = [];
  factors.forEach(f => {
    cards.push({ pairId: `${table}x${f}`, label: `${table} × ${f}` });
    cards.push({ pairId: `${table}x${f}`, label: `${table * f}` });
  });
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }

  const grid = document.getElementById("memoryGrid");
  grid.innerHTML = "";
  cards.forEach(card => {
    const el = document.createElement("div");
    el.className = "memory-card";
    el.dataset.pairId = card.pairId;
    el.innerHTML = `
      <div class="memory-card-inner">
        <div class="memory-face memory-face-back">?</div>
        <div class="memory-face memory-face-front">${card.label}</div>
      </div>
    `;
    el.addEventListener("click", () => flipMemoryCard(el));
    grid.appendChild(el);
  });
}

function flipMemoryCard(el) {
  if (memoryLocked) return;
  if (el.classList.contains("flipped") || el.classList.contains("matched")) return;
  el.classList.add("flipped");
  Sound.flip();

  if (!memoryFirstCard) {
    memoryFirstCard = el;
    return;
  }

  memorySecondCard = el;
  memoryLocked = true;
  memoryMoves += 1;
  document.getElementById("memoryMoves").textContent = memoryMoves;

  const isMatch = memoryFirstCard.dataset.pairId === memorySecondCard.dataset.pairId;
  if (isMatch) {
    Sound.match();
    memoryFirstCard.classList.add("matched");
    memorySecondCard.classList.add("matched");
    memoryMatches += 1;
    document.getElementById("memoryMatches").textContent = memoryMatches;
    memoryFirstCard = null;
    memorySecondCard = null;
    memoryLocked = false;

    if (memoryMatches === MEMORY_PAIRS) {
      setTimeout(() => {
        Sound.victory();
        document.getElementById("memoryArea").classList.add("hidden");
        document.getElementById("memoryResults").classList.remove("hidden");
        document.getElementById("memoryDetail").textContent =
          `Completaste la tabla del ${memoryTable} en ${memoryMoves} movimientos.`;
      }, 500);
    }
  } else {
    Sound.wrong();
    setTimeout(() => {
      memoryFirstCard.classList.remove("flipped");
      memorySecondCard.classList.remove("flipped");
      memoryFirstCard = null;
      memorySecondCard = null;
      memoryLocked = false;
    }, 900);
  }
}

// ---------- Vista: Tabla pitagórica ----------
function buildPitagorica() {
  const table = document.getElementById("pitagoricaTable");
  const headRow = document.createElement("tr");
  headRow.appendChild(document.createElement("th"));
  for (let c = 1; c <= 12; c++) {
    const th = document.createElement("th");
    th.textContent = c;
    headRow.appendChild(th);
  }
  table.appendChild(headRow);

  for (let r = 1; r <= 12; r++) {
    const row = document.createElement("tr");
    const th = document.createElement("th");
    th.textContent = r;
    row.appendChild(th);
    for (let c = 1; c <= 12; c++) {
      const td = document.createElement("td");
      td.textContent = r * c;
      td.dataset.row = r;
      td.dataset.col = c;
      row.appendChild(td);
    }
    table.appendChild(row);
  }

  table.addEventListener("mouseover", (e) => {
    if (e.target.tagName !== "TD") return;
    highlightRowCol(e.target.dataset.row, e.target.dataset.col);
  });
  table.addEventListener("touchstart", (e) => {
    const target = document.elementFromPoint(e.touches[0].clientX, e.touches[0].clientY);
    if (target && target.tagName === "TD") {
      highlightRowCol(target.dataset.row, target.dataset.col);
    }
  }, { passive: true });
}

function highlightRowCol(row, col) {
  document.querySelectorAll("#pitagoricaTable td.highlight").forEach(td => td.classList.remove("highlight"));
  document.querySelectorAll(`#pitagoricaTable td[data-row="${row}"], #pitagoricaTable td[data-col="${col}"]`)
    .forEach(td => td.classList.add("highlight"));
}

// ---------- Inicialización ----------
buildPitagorica();
renderProgress();
