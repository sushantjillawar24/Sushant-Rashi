/* Sound: background music that crossfades from page to page, plus little sound effects
   (all effects are synthesised here — there are no sound-effect files).
   Everything unlocks on the first tap, because browsers don't allow sound before that. */
(() => {
  "use strict";
  const CFG = window.CONFIG || {};
  const Sound = (window.Sound = {});
  const AC = window.AudioContext || window.webkitAudioContext;

  /* ── which song plays on which page ───────────────────────── */
  const SCENE_MUSIC = { gift: "party", welcome: "party", balloons: "party", cake: "party", bouquet: "party", memories: "party", letter: "party" };
  /* how each song is entered: the old one fades out over `out` s; the new one waits `delay` s, then starts from its very first note and
     rises over `fade` s on a smooth curve — so there is a moment of quiet between songs and they never play over each other */
  const TRANS = { party: { out: 1.8, delay: 2.0, fade: 2.0 } };
  const DEFAULTS = { party: { level: 0.16 } };
  const VOL = typeof CFG.musicVolume === "number" ? CFG.musicVolume : 1;      // one knob to make all the music louder/quieter

  const defs = {};
  const m = typeof CFG.music === "string" ? { party: CFG.music } : CFG.music || {};
  Object.keys(m).forEach((k) => { defs[k] = Object.assign({ name: k, src: m[k], level: 0.4 }, DEFAULTS[k]); defs[k].level *= VOL; });
  const hasMusic = Object.keys(defs).length > 0;
  const sfxOn = CFG.sfx !== false;

  let ctx = null, master = null, musicBus = null, sfxBus = null, noiseBuf = null;
  let muted = false, unlocked = false, desired = null, current = null, pending = null;

  /* ── set-up ─────────────────────────────────────────────── */
  if (AC) {
    ctx = new AC();
    master = ctx.createGain(); musicBus = ctx.createGain(); sfxBus = ctx.createGain();
    sfxBus.gain.value = 0.85;
    const duck = ctx.createGain(); Sound._duck = duck;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 4; comp.attack.value = 0.005; comp.release.value = 0.25;
    musicBus.connect(duck); duck.connect(master); sfxBus.connect(master); master.connect(comp); comp.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const running = () => !!ctx && ctx.state === "running";
  const ok = () => running() && !muted && sfxOn;

  /* ── music ──────────────────────────────────────────────── */
  const fadeGain = (g, to, sec, delay = 0) => {                 // eases in and out, so a fade never starts or ends with a bump
    const t = ctx.currentTime, v0 = g.gain.value, N = 64, c = new Float32Array(N);
    for (let i = 0; i < N; i++) { const x = i / (N - 1); c[i] = v0 + (to - v0) * (x * x * (3 - 2 * x)); }
    g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(v0, t);
    try { g.gain.setValueCurveAtTime(c, t + delay, Math.max(0.05, sec)); } catch (_) { g.gain.linearRampToValueAtTime(to, t + delay + sec); }
  };

  const loadBuf = (t) => {
    if (t.buf) return Promise.resolve(t.buf);
    if (!t.loading) t.loading = (async () => {
      let ab;
      if (t.src.startsWith("data:")) {                       // embedded in the page (single-file preview)
        const bin = atob(t.src.slice(t.src.indexOf(",") + 1)), u = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); ab = u.buffer;
      } else {
        const r = await fetch(t.src); if (!r.ok) throw new Error("fetch " + r.status); ab = await r.arrayBuffer();
      }
      t.buf = await new Promise((res, rej) => { const p = ctx.decodeAudioData(ab, res, rej); if (p && p.catch) p.catch(rej); });
      return t.buf;
    })();
    return t.loading;
  };

  /* plain <audio> — used for any song that can't be fetched (e.g. opening index.html straight from a folder) */
  const htmlFade = (t, to, ms, then) => {
    cancelAnimationFrame(t.raf);
    const v0 = t.el.volume, t0 = performance.now();
    const step = (now) => { const k = Math.min(1, (now - t0) / ms); t.el.volume = Math.max(0, Math.min(1, v0 + (to - v0) * k)); if (k < 1) t.raf = requestAnimationFrame(step); else if (then) then(); };
    t.raf = requestAnimationFrame(step);
  };
  const htmlStart = (t, tr) => {
    if (!t.el) {
      t.el = new Audio(t.src); t.el.loop = true;
      if (t.loopEnd) t.el.addEventListener("timeupdate", () => { if (t.el.currentTime >= t.loopEnd) t.el.currentTime = t.loopStart; });
    }
    t.el.muted = muted; t.el.volume = 0; clearTimeout(t.timer); try { t.el.currentTime = 0; } catch (_) {}
    t.timer = setTimeout(() => { if (current === t.name) t.el.play().then(() => htmlFade(t, t.level, tr.fade * 1000)).catch(() => {}); }, tr.delay * 1000);
  };

  /* fade every song out except `keep` (whether it plays through Web Audio or <audio>) — so two songs never play together */
  const fadeOthers = (keep, sec) => {
    for (const k in defs) {
      const o = defs[k]; if (k === keep) continue;
      if (o.node) { fadeGain(o.gain, 0, sec); const n = o.node; setTimeout(() => { try { n.stop(); } catch (_) {} }, sec * 1000 + 150); o.node = null; }
      if (o.el) { clearTimeout(o.timer); if (!o.el.paused) htmlFade(o, 0, sec * 1000, () => o.el.pause()); }
    }
  };

  async function crossTo(name, tr) {
    const t = defs[name]; if (!t || !running()) return;
    fadeOthers(name, tr.out);
    if (t.failed) return htmlStart(t, tr);
    if (t.node) { fadeGain(t.gain, t.level, tr.fade, tr.delay); return; }
    let buf;
    try { buf = await loadBuf(t); } catch (_) { t.failed = true; if (current === name) htmlStart(t, tr); return; }
    if (current !== name || t.node) return;                   // the page moved on while it was loading
    const node = ctx.createBufferSource(); node.buffer = buf; node.loop = true;
    if (t.loopEnd) { node.loopStart = t.loopStart; node.loopEnd = t.loopEnd; }
    const g = ctx.createGain(); g.gain.value = 0; node.connect(g); g.connect(musicBus); node.start(ctx.currentTime + tr.delay);
    t.node = node; t.gain = g; fadeGain(g, t.level, tr.fade, tr.delay);
  }

  /* decode the songs in the background, one after another, so every page change is instant */
  (async () => {
    if (!ctx || !hasMusic) return;
    for (const k of ["party"]) {
      if (!defs[k]) continue;
      try { await loadBuf(defs[k]); } catch (_) { defs[k].failed = true; }
      await new Promise((r) => setTimeout(r, 400));
    }
  })();

  Sound.scene = (name) => {
    const track = SCENE_MUSIC[name]; if (!track || !defs[track]) return;
    desired = track;
    if (name !== "letter" && duckTo !== 1) Sound.duck(1, 1.2);          // back to full volume once we leave the letter
    if (current === track) return;
    current = track;
    if (running()) crossTo(track, TRANS[track] || { out: 2, delay: 0, fade: 2 });
  };
  Sound.beforeScene = (name) => {                            // called as a page begins to leave: the current song starts fading out now
    const track = SCENE_MUSIC[name]; if (!track || !defs[track] || track === current || !running()) return;
    fadeOthers(null, (TRANS[track] || { out: 2 }).out);
  };
  let duckTo = 1;
  Sound.duck = (to, sec = 1.5) => { if (!ctx || !Sound._duck) return; duckTo = to; fadeGain(Sound._duck, to, sec); };   // lower (or restore) the music
  Sound.stop = (sec = 1.8) => { current = "__off"; desired = null; if (running()) fadeOthers(null, sec); };   // fade the music out and leave it off

  /* ── unlocking + the mute button ─────────────────────────── */
  const btn = document.getElementById("music");
  const setUi = (on) => { if (!btn) return; btn.classList.toggle("off", !on); btn.setAttribute("aria-pressed", on ? "true" : "false"); };
  const sync = () => setUi(running() && !muted);               // on = sound is really allowed and unmuted
  if (ctx) ctx.addEventListener("statechange", sync);
  if (btn && (hasMusic || sfxOn)) btn.hidden = false;

  const unlock = () => {
    if (!ctx || muted) return;
    const r = ctx.resume();                                   // has to be called straight from the tap
    try { const b = ctx.createBuffer(1, 1, 22050), s = ctx.createBufferSource(); s.buffer = b; s.connect(ctx.destination); s.start(0); } catch (_) {}   // iOS wake-up
    Promise.resolve(r).then(() => {
      if (!running()) return;
      const first = !unlocked; unlocked = true; sync();
      if (desired && !defs[desired].node) { current = desired; crossTo(desired, first ? { out: 1, delay: 0, fade: 2.8 } : (TRANS[desired] || { out: 2, delay: 0, fade: 2 })); }
      if (pending && performance.now() - pending.ts < 4500) { const f = pending.fn; pending = null; f(); }
      pending = null;
    }).catch(() => {});
  };
  ["pointerup", "touchend", "click", "keydown"].forEach((ev) => addEventListener(ev, (e) => { if (btn && btn.contains(e.target)) return; if (!unlocked || ctx.state !== "running") unlock(); }, true));

  const setMuted = (v) => {
    muted = v; sync();
    if (master) { const t = ctx.currentTime; master.gain.cancelScheduledValues(t); master.gain.setValueAtTime(master.gain.value, t); master.gain.linearRampToValueAtTime(v ? 0 : 1, t + 0.35); }
    for (const k in defs) if (defs[k].el) defs[k].el.muted = v;
  };
  if (btn) btn.addEventListener("click", () => {
    if (!unlocked) { muted = false; unlock(); return; }
    setMuted(!muted);
    if (!muted && ctx.state !== "running") ctx.resume();
  });
  document.addEventListener("visibilitychange", () => {
    if (!ctx || !unlocked) return;
    if (document.hidden) ctx.suspend(); else if (!muted) ctx.resume();
  });

  /* ── sound effects (synthesised) ─────────────────────────── */
  const tone = ({ f = 440, f2 = null, t = 0, a = 0.005, d = 0.3, g = 0.2, type = "sine", pan = 0 }) => {
    const t0 = ctx.currentTime + t, o = ctx.createOscillator(), v = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t0);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + a + d);
    v.gain.setValueAtTime(0.0001, t0); v.gain.exponentialRampToValueAtTime(g, t0 + a); v.gain.exponentialRampToValueAtTime(0.0001, t0 + a + d);
    let out = v; if (ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = pan; v.connect(p); out = p; }
    o.connect(v); out.connect(sfxBus); o.start(t0); o.stop(t0 + a + d + 0.05);
  };
  const noise = ({ t = 0, d = 0.2, g = 0.2, type = "bandpass", f = 1000, f2 = null, q = 1, a = 0.005, pan = 0 }) => {
    const t0 = ctx.currentTime + t, s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), v = ctx.createGain();
    s.buffer = noiseBuf; s.loop = true; fl.type = type; fl.Q.value = q; fl.frequency.setValueAtTime(f, t0);
    if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t0 + a + d);
    v.gain.setValueAtTime(0.0001, t0); v.gain.exponentialRampToValueAtTime(g, t0 + a); v.gain.exponentialRampToValueAtTime(0.0001, t0 + a + d);
    let out = v; if (ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = pan; v.connect(p); out = p; }
    s.connect(fl); fl.connect(v); out.connect(sfxBus); s.start(t0, Math.random() * 1.5); s.stop(t0 + a + d + 0.05);
  };
  const PENTA = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51];
  const sparkle = (t = 0, g = 0.12) => [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98, 2093].forEach((f, i) => tone({ f, t: t + i * 0.07, d: 0.55, g, a: 0.004, pan: (i - 3) / 5 }));
  const guard = (fn) => (...a) => { if (ok()) try { fn(...a); } catch (_) {} };

  Sound.pop = guard((i = 0) => {                              // a balloon: a soft bubble "bloop", an airy tick, and a chime that climbs with each one
    const r = 0.96 + Math.random() * 0.08, n = PENTA[i % 8], pan = (Math.random() - 0.5) * 0.6;
    tone({ f: 420 * r, f2: 1050 * r, a: 0.004, d: 0.09, g: 0.36, pan });
    noise({ d: 0.03, g: 0.09, type: "highpass", f: 6500, q: 0.5, a: 0.002, pan });
    tone({ f: n, t: 0.035, a: 0.006, d: 0.9, g: 0.24, pan }); tone({ f: n * 2, t: 0.035, a: 0.006, d: 0.4, g: 0.07, pan }); tone({ f: n * 3, t: 0.035, a: 0.004, d: 0.15, g: 0.026, pan });
  });
  Sound.fanfare = guard(() => { [1046.5, 1318.51, 1567.98, 2093].forEach((f, i) => tone({ f, t: 0.05 + i * 0.08, d: 0.8, g: 0.18, pan: (i - 1.5) / 3 })); });

  let rib = null;                                             // the ribbon: a soft rustle that grows as you hold
  Sound.ribbon = (p, holding) => {
    if (!ok()) return;
    if (!rib) {
      const s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), v = ctx.createGain(); s.buffer = noiseBuf; s.loop = true;
      fl.type = "bandpass"; fl.Q.value = 0.7; v.gain.value = 0; s.connect(fl); fl.connect(v); v.connect(sfxBus); s.start(0); rib = { s, fl, v };
    }
    const t = ctx.currentTime;
    rib.v.gain.setTargetAtTime(holding ? 0.03 + p * 0.16 * (0.6 + 0.4 * Math.sin(t * 28)) : 0, t, 0.06);
    rib.fl.frequency.setTargetAtTime(1200 + p * 3200, t, 0.08);
  };
  Sound.ribbonEnd = () => { if (rib) { try { rib.s.stop(ctx.currentTime + 0.2); } catch (_) {} rib = null; } };
  Sound.unwrap = () => {
    if (!running()) { pending = { fn: Sound.unwrap, ts: performance.now() }; return; }     // played as soon as the finger lifts
    guard(() => {
      noise({ d: 0.3, g: 0.2, f: 3000, q: 0.6, a: 0.01 }); noise({ t: 0.12, d: 0.25, g: 0.16, f: 3600, q: 0.6, a: 0.01 });
      noise({ t: 0.3, d: 0.9, g: 0.24, f: 300, f2: 3800, q: 0.7, a: 0.15 });
      noise({ t: 0.55, d: 0.1, g: 0.5, f: 2600, f2: 700, q: 0.9, a: 0.002 }); tone({ f: 200, f2: 55, t: 0.55, d: 0.14, g: 0.4, a: 0.002 });
      sparkle(0.62, 0.13);
      [523.25, 659.25, 783.99].forEach((f) => tone({ f, t: 0.66, a: 0.02, d: 1.4, g: 0.1 }));
    })();
  };

  Sound.popper = guard((s = 1) => {                           // party popper: bang + a fizz of confetti
    noise({ d: 0.12, g: 0.55 * s, type: "lowpass", f: 3500, f2: 600, a: 0.001 }); tone({ f: 140, f2: 50, d: 0.15, g: 0.35 * s, a: 0.002 });
    noise({ t: 0.03, d: 0.7, g: 0.1 * s, type: "highpass", f: 5000, q: 0.3, a: 0.01 });
    for (let i = 0; i < 9; i++) noise({ t: 0.1 + Math.random() * 0.55, d: 0.03, g: 0.05 * s, f: 4000 + Math.random() * 3000, q: 1.5, a: 0.002, pan: Math.random() * 2 - 1 });
  });
  Sound.boing = guard(() => {                                 // the No button flying away
    noise({ d: 0.55, g: 0.16, f: 400, f2: 2600, q: 0.8, a: 0.05 });
    tone({ f: 260, f2: 560, d: 0.22, g: 0.2, type: "triangle", a: 0.01 }); tone({ f: 560, f2: 230, t: 0.22, d: 0.3, g: 0.2, type: "triangle", a: 0.01 });
  });
  Sound.ding = guard(() => { tone({ f: 783.99, d: 0.5, g: 0.16 }); tone({ f: 1046.5, t: 0.1, d: 0.7, g: 0.16 }); });
  Sound.yes = guard(() => {
    [1046.5, 1318.51, 1567.98, 2093].forEach((f, i) => tone({ f, t: i * 0.06, d: 0.6, g: 0.15, pan: (i - 1.5) / 3 }));
    noise({ t: 0.05, d: 0.1, g: 0.35, f: 2600, f2: 800, q: 0.9, a: 0.002 });
  });

  Sound.thud = guard((k = 0) => {                             // each cake layer landing, a little higher each time
    tone({ f: [90, 115, 142][k % 3], f2: [45, 55, 66][k % 3], d: 0.28, g: 0.55, a: 0.003 });
    noise({ d: 0.07, g: 0.25, type: "lowpass", f: 700, f2: 300, a: 0.002 });
  });
  Sound.plant = guard(() => { tone({ f: 988, d: 0.25, g: 0.14, a: 0.003 }); tone({ f: 1480, t: 0.02, d: 0.18, g: 0.08, a: 0.003 }); noise({ d: 0.05, g: 0.1, f: 2500, q: 1 }); });
  Sound.ignite = guard(() => {
    noise({ d: 0.35, g: 0.22, type: "lowpass", f: 400, f2: 1500, a: 0.05 });
    tone({ f: 196, f2: 392, d: 0.5, g: 0.12, a: 0.08 }); tone({ f: 1568, t: 0.12, d: 0.35, g: 0.06 });
  });
  Sound.blow = guard(() => {
    noise({ d: 0.9, g: 0.4, f: 900, f2: 400, q: 0.6, a: 0.15 });
    noise({ t: 0.05, d: 0.25, g: 0.2, type: "lowpass", f: 600, f2: 250, a: 0.01 });
    noise({ t: 0.5, d: 0.6, g: 0.06, type: "highpass", f: 4500, a: 0.1 });
  });
  Sound.cheers = guard(() => {                                // glasses clinking, a horn, a popper and a sparkle
    const clink = (t, f) => { tone({ f, t, d: 0.5, g: 0.17, a: 0.001 }); tone({ f: f * 2.76, t, d: 0.35, g: 0.09, a: 0.001 }); tone({ f: f * 5.4, t, d: 0.2, g: 0.04, a: 0.001 }); };
    clink(0, 3200); clink(0.17, 3590);
    tone({ f: 640, f2: 720, t: 0.4, d: 0.5, g: 0.08, type: "triangle", a: 0.03 });
    Sound.popper(1);
    sparkle(0.55, 0.12);
  });

  Sound.swish = guard((dir = 1) => noise({ d: 0.16, g: 0.2, f: dir > 0 ? 700 : 2600, f2: dir > 0 ? 2600 : 700, q: 0.9, a: 0.02, pan: dir * 0.3 }));
  Sound.snap = guard(() => tone({ f: 380, f2: 260, d: 0.08, g: 0.14, type: "triangle", a: 0.002 }));
  Sound.bump = guard(() => { tone({ f: 150, f2: 80, d: 0.14, g: 0.25, a: 0.002 }); noise({ d: 0.05, g: 0.1, type: "lowpass", f: 500 }); });
  Sound.tap = guard(() => { tone({ f: 784, d: 0.2, g: 0.12, a: 0.003 }); tone({ f: 1175, t: 0.04, d: 0.14, g: 0.06, a: 0.003 }); });
  Sound.paper = guard(() => {
    [0, 0.09, 0.2].forEach((t, i) => noise({ t, d: 0.08 + i * 0.03, g: 0.14, f: 3500, q: 0.5, a: 0.006 }));
    tone({ f: 240, f2: 140, d: 0.1, g: 0.1, a: 0.003 });
  });
  Sound.unfold = guard(() => {
    noise({ d: 1.1, g: 0.14, f: 2000, f2: 4200, q: 0.5, a: 0.2 });
    for (let i = 0; i < 6; i++) noise({ t: 0.15 + Math.random() * 0.9, d: 0.04, g: 0.07, f: 3000 + Math.random() * 3000, q: 1, a: 0.003, pan: Math.random() * 2 - 1 });
  });

  Sound._debug = { get ctx() { return ctx; }, get master() { return master; }, get sfx() { return sfxBus; }, get music() { return musicBus; }, gains: () => Object.fromEntries(Object.keys(defs).filter((k) => defs[k].gain).map((k) => [k, +defs[k].gain.gain.value.toFixed(3)])), duck: () => (Sound._duck ? +Sound._duck.gain.value.toFixed(3) : 1), allGains: () => Object.fromEntries(Object.keys(defs).map((k) => [k, defs[k].gain && (defs[k].node || defs[k].timerOn) ? +defs[k].gain.gain.value.toFixed(3) : (defs[k].gain ? +defs[k].gain.gain.value.toFixed(3) : 0)])), levels: () => Object.fromEntries(Object.keys(defs).map((k) => [k, +defs[k].level.toFixed(3)])), mode: () => { const f = Object.values(defs).filter((t) => t.failed).length; return f === 0 ? "web" : f === Object.keys(defs).length ? "html" : "mixed"; }, active: () => Object.keys(defs).filter((k) => defs[k].node || (defs[k].el && !defs[k].el.paused)) };
  sync();
})();
