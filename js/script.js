/* js/script.js
   Complete updated script:
   - page navigation with PRE_DELAY + ANIM duration
   - audio fade-in / toggle
   - flip sound cue
   - enhanced celebration sequence:
       hbTitle drop -> large confetti -> final typed message
*/

AOS.init({ duration: 700, once: true, easing: 'ease-out-cubic' });

/* ---------- CONFIG ---------- */
// slow reveal timing
const PAGE_PRE_DELAY_MS = 600;      // suspense before the flip animation
const PAGE_ANIM_DURATION_MS = 1400; // must match CSS transition
const NAV_DISABLE_MS = PAGE_PRE_DELAY_MS + PAGE_ANIM_DURATION_MS + 120;
const homeBtn = document.getElementById('homeBtn');
/* ---------- DOM ---------- */
const bg = document.getElementById('bgMusic');
const flipSound = document.getElementById('flipSound');
const musicToggle = document.getElementById('musicToggle');
const startBtn = document.getElementById('startBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const bookWrap = document.getElementById('bookWrap');
const topbar = document.getElementById('topbar');
const pages = Array.from(document.querySelectorAll('.page'));
const replayBtn = document.getElementById('replayBtn');
const car = document.getElementById('car');
const confCanvas = document.getElementById('confetti');
const hbTitle = document.getElementById('hbTitle');
const finalMessage = document.getElementById('finalMessage');

/* ---------- State ---------- */
let current = 0;
let navLocked = false;

/* ---------- Helpers ---------- */
function updatePageClasses() {
  pages.forEach((p, i) => {
    p.classList.remove('current', 'prev', 'next');
    if (i === current) p.classList.add('current');
    else if (i === current - 1) p.classList.add('prev');
    else if (i === current + 1) p.classList.add('next');
  });
  // enable/disable nav buttons if not locked
  if (!navLocked) {
    prevBtn.disabled = current <= 0;
    nextBtn.disabled = current >= pages.length - 1;
  } else {
    prevBtn.disabled = true;
    nextBtn.disabled = true;
  }
}

// play small flip/paper sound (best-effort)
function playFlipSound() {
  try {
    if (flipSound) {
      flipSound.currentTime = 0;
      // ignore play() rejection
      flipSound.play().catch(() => {});
    }
  } catch (e) {
    console.warn('Flip sound play failed', e);
  }
}

/* ---------- Audio fade helpers ---------- */
async function startAudioFade(duration = 1400) {
  try {
    if (!bg.paused && !bg.ended) {
      musicToggle.textContent = '⏸';
      musicToggle.setAttribute('aria-pressed', 'true');
      return;
    }
    bg.volume = 0;
    await bg.play();
    musicToggle.textContent = '⏸';
    musicToggle.setAttribute('aria-pressed', 'true');

    const steps = 28;
    const stepTime = duration / steps;
    for (let i = 1; i <= steps; i++) {
      bg.volume = Math.min(1, i / steps);
      await new Promise(r => setTimeout(r, stepTime));
    }
    bg.volume = 1;
  } catch (e) {
    console.warn('Audio play blocked or failed:', e);
  }
}

function pauseAudio() {
  try {
    bg.pause();
    musicToggle.textContent = '▶';
    musicToggle.setAttribute('aria-pressed', 'false');
  } catch (e) {
    console.warn('Pause audio failed', e);
  }
}

/* ---------- UI event wiring ---------- */
musicToggle.addEventListener('click', () => {
  if (bg.paused) startAudioFade();
  else pauseAudio();
});

// Start the Journey: reveal topbar + book, hide cover, enable scrolling
startBtn.addEventListener('click', async () => {
  // show topbar and book
  if (topbar) {
    topbar.style.display = 'flex';
    topbar.setAttribute('aria-hidden', 'false');
  }
  if (bookWrap) {
    bookWrap.style.display = 'block';
    bookWrap.setAttribute('aria-hidden', 'false');
  }

  // hide the cover permanently
  const cover = document.getElementById('cover');
  if (cover) cover.style.display = 'none';

  // unlock body scroll
  document.body.classList.remove('locked');

  // start music fade
  await startAudioFade();

  // show first page
  current = 0;
  updatePageClasses();
  AOS.refresh();

  // focus for accessibility
  pages[current]?.focus?.();
});

/* ---------- Navigation with delay + locking ---------- */
function gotoIndex(idx) {
  if (navLocked) return;
  if (idx < 0 || idx >= pages.length) return;
  if (idx === current) return;

  navLocked = true;
  updatePageClasses(); // will disable buttons while locked

  // sound cue immediately
  playFlipSound();

  // suspense delay then visual update
  setTimeout(() => {
    current = idx;
    updatePageClasses();
    // unlock after animation completes
    setTimeout(() => {
      navLocked = false;
      updatePageClasses();
    }, PAGE_ANIM_DURATION_MS + 40);
  }, PAGE_PRE_DELAY_MS);

  // safety unlock
  setTimeout(() => {
    navLocked = false;
    updatePageClasses();
  }, NAV_DISABLE_MS);
}

prevBtn.addEventListener('click', () => gotoIndex(current - 1));
nextBtn.addEventListener('click', () => gotoIndex(current + 1));

// keyboard navigation
document.addEventListener('keydown', (e) => {
  if (document.body.classList.contains('locked')) return;
  if (e.key === 'ArrowRight') gotoIndex(current + 1);
  if (e.key === 'ArrowLeft') gotoIndex(current - 1);
});

/* ---------- Enhanced celebration sequence ---------- */

async function playCelebration() {
  // ensure final slide elements exist
  const hb = hbTitle || document.getElementById('hbTitle');
  const canvas = confCanvas || document.getElementById('confetti');
  const finalMsg = finalMessage || document.getElementById('finalMessage');
  const replay = replayBtn || document.getElementById('replayBtn');

  if (!hb || !canvas || !finalMsg || !replay) {
    console.warn('Missing celebration elements');
    return;
  }

  // disable replay while sequence runs
  replay.disabled = true;

  // Reset final message and title states
  finalMsg.classList.remove('show');
  finalMsg.setAttribute('aria-hidden', 'true');
  hb.classList.remove('show');
  // force reflow to restart animations safely
  void hb.offsetWidth;

  // Step 1: show title (drops from top with bounce)
  hb.classList.add('show');

  // small delay so title begins dropping before confetti
  await new Promise(r => setTimeout(r, 450));

  // Step 2: play small cue and launch large confetti; await completion
  playFlipSound();
  await launchConfettiEnhanced(canvas, { pieces: 260, duration: 4200 });

  // Step 3: show final message (typed style)
  // Use typed effect for charm
  await typeFinalMessage('#finalMessage', "Thank you!! I Love you Baby ❤️❤️\n-- Your Lover, Archit", 28);

  // reveal final message container (in case typed method didn't)
  finalMsg.classList.add('show');
  finalMsg.setAttribute('aria-hidden', 'false');

  // re-enable replay button shortly after
  setTimeout(() => {
    replay.disabled = false;
  }, 900);
}

// wire celebration
if (replayBtn) replayBtn.addEventListener('click', playCelebration);

/* ---------- Enhanced confetti (returns Promise) ---------- */
function launchConfettiEnhanced(canvas, opts = {}) {
  return new Promise((resolve) => {
    if (!canvas) {
      resolve();
      return;
    }
    const ctx = canvas.getContext('2d');
    const piecesCount = opts.pieces || 150;
    const duration = opts.duration || 3000;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // build pieces
    const pieces = [];
    for (let i = 0; i < piecesCount; i++) {
      pieces.push({
        x: Math.random() * canvas.width,
        y: Math.random() * -canvas.height * Math.random(),
        vy: 2 + Math.random() * 6,
        vx: Math.random() * 3 - 1.5,
        size: 6 + Math.random() * 12,
        color: ['#e43b5a', '#f6c1c9', '#c69b6d', '#fff'][Math.floor(Math.random() * 4)],
        rot: Math.random() * 360,
        vr: Math.random() * 6 - 3,
        life: duration + Math.random() * 600
      });
    }

    const start = performance.now();
    function frame(now) {
      const elapsed = now - start;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // draw pieces
      for (let p of pieces) {
        // accelerate / wobble
        p.y += p.vy * (1 + Math.sin((elapsed + p.x) / 500) * 0.22);
        p.x += p.vx * (1 + Math.cos((elapsed + p.y) / 900) * 0.12);
        p.rot += p.vr * 0.5;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      }

      if (elapsed < duration + 700) {
        requestAnimationFrame(frame);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        resolve();
      }
    }

    // slight burst adjustments for a nice initial spread
    for (let i = 0; i < pieces.length; i++) {
      if (i < pieces.length * 0.12) pieces[i].vx *= 2.2;
      if (i < pieces.length * 0.3) pieces[i].vy *= 1.1;
    }

    requestAnimationFrame(frame);
  });
}

/* ---------- Typed final message helper ---------- */
async function typeFinalMessage(selector, text, speed = 30) {
  const el = document.querySelector(selector);
  if (!el) return;
  el.style.whiteSpace = 'pre-wrap';
  el.innerHTML = ''; // clear existing
  for (let ch of text) {
    el.innerHTML += ch;
    await new Promise(r => setTimeout(r, speed));
  }
}

/* ---------- misc ---------- */
window.addEventListener('resize', () => {
  if (confCanvas) {
    confCanvas.width = window.innerWidth;
    confCanvas.height = window.innerHeight;
  }
});

function goHome() {
  // pause & reset music
  try {
    if (bg) {
      bg.pause();
      bg.currentTime = 0;
      musicToggle.textContent = '▶';
      musicToggle.setAttribute('aria-pressed', 'false');
    }
  } catch (e) { console.warn('Error resetting audio', e); }

  // hide book and topbar, show cover
  const cover = document.getElementById('cover');
  if (cover) cover.style.display = 'flex';

  if (topbar) {
    topbar.style.display = 'none';
    topbar.setAttribute('aria-hidden', 'true');
  }

  if (bookWrap) {
    bookWrap.style.display = 'none';
    bookWrap.setAttribute('aria-hidden', 'true');
  }

  // lock scrolling & reset state so Start is required again
  document.body.classList.add('locked');

  // reset pages to first
  current = 0;
  navLocked = false;
  updatePageClasses();

  // reset final celebration elements if present
  const hb = document.getElementById('hbTitle');
  const finalMsg = document.getElementById('finalMessage');
  const canvas = document.getElementById('confetti');
  if (hb) hb.classList.remove('show');
  if (finalMsg) {
    finalMsg.classList.remove('show');
    finalMsg.setAttribute('aria-hidden', 'true');
    finalMsg.innerHTML = ''; // clear typed text
  }
  if (canvas) {
    const ctx = canvas.getContext('2d');
    ctx && ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  // scroll to top (cover)
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// wire the button if present
if (homeBtn) {
  homeBtn.addEventListener('click', (e) => {
    e.preventDefault();
    goHome();
  });
}


// initial paint
updatePageClasses();
AOS.refresh();
