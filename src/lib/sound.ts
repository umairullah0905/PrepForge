let ctx: AudioContext | undefined;

function getCtx(): AudioContext {
  if (!ctx) {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    ctx = new AudioCtx();
  }
  return ctx;
}

/** Plays a short square-wave blip, NES-menu style. */
export function playBlip(freq = 440, duration = 0.06) {
  try {
    const audio = getCtx();
    if (audio.state === "suspended") audio.resume();

    const osc = audio.createOscillator();
    const gain = audio.createGain();

    osc.type = "square";
    osc.frequency.setValueAtTime(freq, audio.currentTime);
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(freq * 0.6, 40),
      audio.currentTime + duration
    );

    gain.gain.setValueAtTime(0.06, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + duration);

    osc.connect(gain);
    gain.connect(audio.destination);

    osc.start();
    osc.stop(audio.currentTime + duration);
  } catch {
    // Audio not available (e.g. no user gesture yet) — fail silently.
  }
}

export const blipHover = () => playBlip(660, 0.045);
export const blipClick = () => playBlip(880, 0.08);
