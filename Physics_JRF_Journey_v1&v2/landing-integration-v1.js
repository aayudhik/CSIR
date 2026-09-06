(() => {
  const TOTAL_TOPICS = 123;

  const readProgress = () => {
    let mastered = 0;
    let attempts = 0;
    let correct = 0;

    try {
      const candidates = ['csir_v5_progress', 'physics_jrf_journey_progress', 'v5_progress', 'progress'];
      for (const key of candidates) {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const data = JSON.parse(raw);
        const masteredSource = data.masteredTopics || data.mastered || data.topicMastery || data.completedTopics;
        if (Array.isArray(masteredSource)) mastered = Math.max(mastered, masteredSource.length);
        else if (masteredSource && typeof masteredSource === 'object') mastered = Math.max(mastered, Object.values(masteredSource).filter(Boolean).length);
        attempts = Math.max(attempts, Number(data.attempts || data.questionAttempts || data.totalAttempts || 0));
        correct = Math.max(correct, Number(data.correct || data.correctAnswers || 0));
      }
    } catch (_) {}

    try {
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const data = JSON.parse(raw);
        if (Array.isArray(data)) {
          for (const item of data) {
            if (!item || typeof item !== 'object') continue;
            if (item.mastered === true || item.completed === true || item.status === 'mastered') mastered++;
            if (item.attempted === true || item.isAttempt === true || item.questionId || item.answer) {
              attempts++;
              if (item.correct === true || item.isCorrect === true) correct++;
            }
          }
        }
      }
    } catch (_) {}

    mastered = Math.min(TOTAL_TOPICS, Math.max(0, mastered));
    attempts = Math.max(0, attempts);
    correct = Math.min(attempts, Math.max(0, correct));
    return { mastered, attempts, correct };
  };

  const updateStats = () => {
    const el = document.getElementById('integrated-progress-line');
    if (!el) return;
    const { mastered, attempts, correct } = readProgress();
    const masteryPct = Math.round((mastered / TOTAL_TOPICS) * 100);
    const accuracy = attempts ? Math.round((correct / attempts) * 100) : 0;
    el.textContent = `${masteryPct}% topics mastered · ${mastered}/${TOTAL_TOPICS} · ${attempts} question attempts · ${accuracy}% accuracy`;
  };

  const mount = () => {
    const home = document.getElementById('home');
    if (!home || document.getElementById('integrated-landing')) return;

    const wrap = document.createElement('section');
    wrap.id = 'integrated-landing';
    wrap.setAttribute('aria-label', 'Physics JRF Journey welcome');
    wrap.innerHTML = `
      <div class="integrated-welcome-hero">
        <div class="integrated-kicker">⚛ PHYSICS JRF JOURNEY</div>
        <h1>Physics JRF Journey</h1>
        <h2>Welcome Dear CSIR Aspirant 👋</h2>
        <p>Your preparation workspace is ready. Study the concept deeply, derive the important results, solve targeted questions, review mistakes and then test yourself. Your mastery and practice history are saved locally in this browser.</p>
        <div class="integrated-progress-card" aria-live="polite">
          <span id="integrated-progress-line">0% topics mastered · 0/123 · 0 question attempts · 0% accuracy</span>
        </div>
      </div>
      <div class="integrated-actions">
        <button class="btn" type="button" data-integrated-go="topics">📚 Start Studying</button>
        <button class="btn integrated-light-btn" type="button" data-integrated-go="practice">📝 Practice Now</button>
        <a class="integrated-guide-btn" href="./study-guide.html">📖 How to Study</a>
      </div>`;

    home.insertBefore(wrap, home.firstChild);

    const style = document.createElement('style');
    style.textContent = `
      #integrated-landing{margin:0 0 20px}
      .integrated-welcome-hero{background:linear-gradient(120deg,#5652d4,#7a60ee);color:#fff;border-radius:22px;padding:30px 32px 27px;box-shadow:0 12px 34px #27315b18}
      .integrated-kicker{font-size:11px;font-weight:900;letter-spacing:.12em;opacity:.88}
      .integrated-welcome-hero h1{font-size:34px;line-height:1.15;margin:8px 0 7px}
      .integrated-welcome-hero h2{font-size:23px;line-height:1.3;margin:0 0 10px}
      .integrated-welcome-hero p{color:#eeeaff;line-height:1.7;max-width:1000px;margin:0}
      .integrated-progress-card{margin-top:20px;padding:13px 15px;border-radius:11px;background:#ffffff18;border:1px solid #ffffff38;font-weight:850;font-size:13px}
      .integrated-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:14px;align-items:center}
      .integrated-light-btn{background:#fff;color:#514bc6}
      .integrated-guide-btn{display:inline-block;padding:10px 13px;border-radius:9px;background:#ffffff1c;color:#fff;text-decoration:none;font-weight:800;border:1px solid #ffffff55}
      @media(max-width:680px){.integrated-welcome-hero{padding:24px 20px}.integrated-welcome-hero h1{font-size:28px}.integrated-welcome-hero h2{font-size:20px}.integrated-progress-card{font-size:12px}.integrated-actions{margin-top:12px}}
    `;
    document.head.appendChild(style);

    wrap.querySelectorAll('[data-integrated-go]').forEach(button => {
      button.addEventListener('click', () => {
        if (typeof window.go === 'function') window.go(button.dataset.integratedGo);
      });
    });

    updateStats();
    window.addEventListener('storage', updateStats);
    setInterval(updateStats, 3000);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
  else mount();
})();
