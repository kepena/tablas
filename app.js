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

// ---------- Navegación entre vistas ----------
function showView(id) {
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

document.querySelectorAll("[data-view]").forEach(el => {
  el.addEventListener("click", () => showView(el.dataset.view));
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
    btn.addEventListener("click", () => onChange(t, btn));
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
});

document.getElementById("nextCard").addEventListener("click", () => {
  practiceIndex = (practiceIndex + 1) % FACTORS.length;
  renderFlashcard();
});

document.getElementById("prevCard").addEventListener("click", () => {
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

document.getElementById("startQuiz").addEventListener("click", startQuiz);
document.getElementById("retryQuiz").addEventListener("click", () => {
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
    quizStreak += 1;
    const bonus = quizStreak >= 5 ? 2 : 1;
    quizScore += bonus;
    feedback.textContent = quizStreak >= 5 ? `¡Racha de ${quizStreak}! 🔥 +${bonus}` : "¡Correcto! ✅";
    feedback.className = "quiz-feedback correct";
  } else {
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
