(() => {
  const mount = () => {
    const home = document.getElementById('home');
    if (!home || document.getElementById('integrated-landing')) return;
    const wrap = document.createElement('section');
    wrap.id = 'integrated-landing';
    wrap.setAttribute('aria-label', 'Physics JRF Journey introduction');
    wrap.innerHTML = `
      <div class="integrated-landing-hero">
        <div>
          <span class="integrated-kicker">⚛ PHYSICS JRF JOURNEY</span>
          <h2>Prepare for CSIR-NET Physical Sciences with one structured workspace.</h2>
          <p>Understand the theory, work through derivations, practice targeted questions, revise weak areas and test yourself — all from the same portal.</p>
          <div class="integrated-actions">
            <button class="btn" type="button" data-integrated-go="topics">📚 Start Studying</button>
            <button class="btn integrated-light-btn" type="button" data-integrated-go="practice">📝 Practice Now</button>
            <a class="integrated-guide-btn" href="./study-guide.html">📖 How to Study</a>
          </div>
        </div>
      </div>
      <div class="integrated-feature-grid">
        <article class="card"><h3>📚 Deep Study</h3><p class="muted">Topic-focused notes, objectives, formulae, worked examples, common mistakes and visual explanations.</p></article>
        <article class="card"><h3>📝 Practice Lab</h3><p class="muted">Practice by subject, topic, difficulty and weak areas with explanations and progress tracking.</p></article>
        <article class="card"><h3>📊 Track Progress</h3><p class="muted">Mastery, accuracy, revision and mini mocks make your preparation measurable.</p></article>
      </div>`;
    home.insertBefore(wrap, home.firstChild);

    const style = document.createElement('style');
    style.textContent = `
      #integrated-landing{margin-bottom:18px}
      .integrated-landing-hero{background:linear-gradient(120deg,#5652d4,#7a60ee);color:#fff;border-radius:21px;padding:30px 30px 28px;box-shadow:0 12px 34px #27315b18}
      .integrated-kicker{font-size:11px;font-weight:900;letter-spacing:.12em;opacity:.88}
      .integrated-landing-hero h2{font-size:30px;line-height:1.2;max-width:900px;margin:9px 0 10px}
      .integrated-landing-hero p{color:#eeeaff;line-height:1.7;max-width:900px;margin:0}
      .integrated-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:20px;align-items:center}
      .integrated-light-btn{background:#fff;color:#514bc6}
      .integrated-guide-btn{display:inline-block;padding:10px 13px;border-radius:9px;background:#ffffff1c;color:#fff;text-decoration:none;font-weight:800;border:1px solid #ffffff55}
      .integrated-feature-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:15px;margin-top:15px}
      .integrated-feature-grid .card{min-height:92px}
      @media(max-width:680px){.integrated-landing-hero{padding:24px 20px}.integrated-landing-hero h2{font-size:24px}.integrated-feature-grid{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
    wrap.querySelectorAll('[data-integrated-go]').forEach(button => {
      button.addEventListener('click', () => {
        if (typeof window.go === 'function') window.go(button.dataset.integratedGo);
      });
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
  else mount();
})();
