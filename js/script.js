AOS.init({ duration: 700, once: true });

const bg = document.getElementById("bgMusic");
const musicToggle = document.getElementById("musicToggle");
const startBtn = document.getElementById("startBtn");

async function startAudioFade(duration = 1800) {
  try {
    bg.volume = 0;
    await bg.play();
    musicToggle.textContent = "⏸";
    const steps = 30, stepTime = duration / steps;
    for (let i = 1; i <= steps; i++) {
      bg.volume = i / steps;
      await new Promise(r => setTimeout(r, stepTime));
    }
  } catch (e) { console.warn("Audio play blocked", e); }
}

musicToggle.addEventListener("click", () => {
  if (bg.paused) startAudioFade(); else { bg.pause(); musicToggle.textContent = "▶"; }
});

startBtn.addEventListener("click", () => {
  document.getElementById("ch1").scrollIntoView({ behavior: "smooth" });
  startAudioFade();
});
