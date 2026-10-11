(() => {
  "use strict";
  const C = window.CONFIG;
  const params = new URLSearchParams(location.search);
  const NAME = (params.get("name") || C.name || "you").trim();
  const FROM = (params.get("from") || C.from || "").trim();

  const $ = (s, r = document) => r.querySelector(s);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const wait = (ms) => new Promise((r) => setTimeout(r, reduce ? Math.min(ms, 40) : ms));
  const esc = (s) => String(s).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
  let touched = false; addEventListener("pointerdown", () => { touched = true; }, { capture: true, once: true });
  const buzz = (ms) => { if (!touched) return; try { navigator.vibrate && navigator.vibrate(ms); } catch (_) {} };

  /* ── Scene manager ─────────────────────────────── */
  const order = ["gift", "welcome", "balloons", "cake", "bouquet", "memories", "letter"];
  const inits = { gift: initGift, welcome: initWelcome, balloons: initBalloons, cake: initCake, bouquet: initBouquet, memories: initMemories, letter: initLetter };
  let current = -1, cleanup = null, busy = false;
  const next = () => go(current + 1);
  async function go(i) {
    if (busy) return;
    busy = true;
    Sound.beforeScene(order[i]);
    if (cleanup) { cleanup(); cleanup = null; }
    if (current >= 0) {
      const prev = $("#s-" + order[current]);
      prev.classList.remove("active");
      await wait(450);
      prev.hidden = true;
    }
    current = i;
    const el = $("#s-" + order[i]);
    el.hidden = false;
    cleanup = inits[order[i]]() || null;
    void el.offsetWidth;
    el.classList.add("active");
    Sound.scene(order[i]);
    busy = false;
  }

  /* ── Helpers ───────────────────────────────────── */
  function burst(host, x, y, colors, n = 14, spread = 70) {
    for (let i = 0; i < n; i++) {
      const p = document.createElement("i");
      p.className = "spark";
      p.style.left = x + "px"; p.style.top = y + "px";
      p.style.background = colors[i % colors.length];
      host.appendChild(p);
      const a = Math.random() * Math.PI * 2, d = spread * (0.5 + Math.random() * 0.8);
      const anim = p.animate(
        [
          { transform: "translate(-50%,-50%) scale(1)", opacity: 1 },
          { transform: `translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d + 22}px)) scale(.3)`, opacity: 0 }
        ],
        { duration: 650 + Math.random() * 300, easing: "cubic-bezier(.2,.7,.3,1)" }
      );
      anim.onfinish = () => p.remove();
    }
  }

  /* a richer shower: bells, party hats, balloons, gifts, stars, hearts, streamers */
  const SHOWER = [
    '<svg viewBox="0 0 24 26"><path d="M12 3C8.5 3 6 5.8 6 9.5V15l-2 3h16l-2-3V9.5C18 5.8 15.5 3 12 3z" fill="#f6c452" stroke="#c9972f" stroke-width="1"/><path d="M9 8c0-1.6 1.2-3 3-3" stroke="#fff" stroke-opacity=".7" stroke-width="1.4" fill="none" stroke-linecap="round"/><circle cx="12" cy="21" r="2.2" fill="#c9972f"/><circle cx="12" cy="3" r="1.5" fill="#c9972f"/></svg>',
    '<svg viewBox="0 0 24 26"><path d="M12 3L20.5 24H3.5Z" fill="#f4677f"/><path d="M8.5 15l9 2.4M6.5 20l12 3" stroke="#fff" stroke-width="2.2" stroke-opacity=".85"/><circle cx="12" cy="3" r="2.4" fill="#ffc857"/></svg>',
    '<svg viewBox="0 0 24 26"><path d="M12 3L20.5 24H3.5Z" fill="#6aa6ea"/><path d="M8.5 15l9 2.4M6.5 20l12 3" stroke="#fff" stroke-width="2.2" stroke-opacity=".85"/><circle cx="12" cy="3" r="2.4" fill="#ffd36e"/></svg>',
    '<svg viewBox="0 0 24 32"><path d="M12 2C18 2 21 7 21 12c0 5-4 8.5-9 9.5C7 20.500 3 17 3 12 3 7 6 2 12 2z" fill="#f4677f"/><ellipse cx="8.500" cy="8" rx="2.200" ry="3.800" fill="#fff" opacity=".45" transform="rotate(25 8.500 8)"/><path d="M10 21.500h4l-2 2.500z" fill="#d9425f"/><path d="M12 24c-2 3 2 4 0 7" stroke="#b9a" fill="none" stroke-width="1"/></svg>',
    '<svg viewBox="0 0 24 32"><path d="M12 2C18 2 21 7 21 12c0 5-4 8.5-9 9.5C7 20.500 3 17 3 12 3 7 6 2 12 2z" fill="#7ed0b0"/><ellipse cx="8.500" cy="8" rx="2.200" ry="3.800" fill="#fff" opacity=".45" transform="rotate(25 8.500 8)"/><path d="M10 21.500h4l-2 2.500z" fill="#4cb08c"/><path d="M12 24c2 3-2 4 0 7" stroke="#b9a" fill="none" stroke-width="1"/></svg>',
    '<svg viewBox="0 0 24 24"><rect x="3" y="10" width="18" height="12" rx="2" fill="#8fb8f2"/><rect x="2" y="7" width="20" height="5" rx="2" fill="#6aa6ea"/><rect x="10.500" y="7" width="3" height="15" fill="#ffd36e"/><path d="M12 7c-4-5-8-2-5 0zM12 7c4-5 8-2 5 0z" fill="#ffd36e"/></svg>',
    '<svg viewBox="0 0 24 24"><path d="M12 1.500l3 6.700 7.300.8-5.500 4.900 1.600 7.200L12 17.300 5.600 21.100l1.600-7.200L1.700 9l7.300-.8z" fill="#ffc857" stroke="#e0a526" stroke-width=".8"/></svg>',
    '<svg viewBox="0 0 24 22"><path d="M12 21C-2 11 3 1 9 3c2 .7 3 2.500 3 3.500C12 5.500 13 3.700 15 3c6-2 11 8-3 18z" fill="#f4677f"/></svg>',
    '<svg viewBox="0 0 12 40"><path d="M6 1C12 8 0 14 6 21S0 33 6 39" stroke="#f4677f" stroke-width="4" fill="none" stroke-linecap="round"/></svg>',
    '<svg viewBox="0 0 12 40"><path d="M6 1C0 8 12 14 6 21S12 33 6 39" stroke="#8fb8f2" stroke-width="4" fill="none" stroke-linecap="round"/></svg>'
  ];
  function partyShower(host, n) {
    if (reduce) return;
    const W = host.clientWidth, H = host.clientHeight;
    for (let i = 0; i < n; i++) {
      const KS = [0, 3, 0, 4, 3, 0], k = KS[i % KS.length], el = document.createElement("i");
      el.className = "shw"; el.innerHTML = SHOWER[k];
      const size = k === 8 || k === 9 ? 12 + Math.random() * 4 : 24 + Math.random() * 14;
      el.style.width = size + "px";
      host.appendChild(el);
      const x = Math.random() * (W - size), sway = 24 + Math.random() * 46, dir = Math.random() > 0.5 ? 1 : -1;
      const swing = k <= 2 ? 38 : k <= 4 ? 16 : 140;                 // bells & hats swing, the rest tumble
      const r0 = (Math.random() - 0.5) * 60, T = (v) => `translate(${(x + v).toFixed(1)}px,%Ypx) rotate(%Rdeg)`;
      const f = (y, v, r) => ({ transform: T(v).replace("%Y", y.toFixed(0)).replace("%R", r.toFixed(0)) });
      const kf = [
        { ...f(-70, 0, r0), opacity: 0 },
        { ...f(H * 0.18, dir * sway, r0 + swing), opacity: 1, offset: 0.15 },
        f(H * 0.5, -dir * sway, r0 - swing),
        f(H * 0.8, dir * sway * 0.8, r0 + swing),
        f(H + 70, 0, r0)
      ];
      el.style.opacity = 0;                              // invisible until its turn, so nothing waits in the corner
      el.animate(kf, { duration: 4200 + Math.random() * 2600, delay: Math.random() * 1500, easing: "ease-in-out", fill: "both" }).onfinish = () => el.remove();
    }
  }

  function popperBurst(host, x, y, dir) {
    if (reduce) return;
    const cols = ["#f4677f", "#ffc857", "#8fb8f2", "#7ed0b0", "#fff", "#b3153f"];
    for (let i = 0; i < 40; i++) {
      const p = document.createElement("i");
      p.className = "confetti"; p.style.top = "0"; p.style.left = "0";
      p.style.background = cols[i % cols.length];
      p.style.width = 6 + Math.random() * 5 + "px"; p.style.height = 9 + Math.random() * 7 + "px";
      host.appendChild(p);
      const vx = dir * (40 + Math.random() * 200), vy = -(320 + Math.random() * 340), g = 620, T = 1.9 + Math.random() * 1.2, kf = [];
      for (let s = 0; s <= 10; s++) {
        const t = (T * s) / 10;
        kf.push({ transform: `translate(${(x + vx * t * 0.6).toFixed(1)}px,${(y + vy * t + 0.5 * g * t * t).toFixed(1)}px) rotate(${s * (80 + i * 7)}deg)`, opacity: s > 8 ? 1 - (s - 8) / 2 : 1 });
      }
      p.animate(kf, { duration: T * 1000, easing: "linear" }).onfinish = () => p.remove();
    }
  }

  function confettiRain(host, n) {
    if (reduce) return;
    const cols = ["#f4677f", "#ffc857", "#8fb8f2", "#7ed0b0", "#fff", "#b3153f"];
    for (let i = 0; i < n; i++) {
      const p = document.createElement("i");
      p.className = "confetti";
      p.style.left = Math.random() * 100 + "%";
      p.style.background = cols[i % cols.length];
      host.appendChild(p);
      const sway = (Math.random() - 0.5) * 120, h = host.clientHeight + 40;
      p.animate(
        [{ transform: "translate(0,-30px) rotate(0)", opacity: 1 },
         { transform: `translate(${sway}px,${h}px) rotate(${Math.random() * 900 - 450}deg)`, opacity: 1 }],
        { duration: 2200 + Math.random() * 1800, delay: Math.random() * 700, easing: "cubic-bezier(.3,.5,.6,1)", fill: "backwards" }
      ).onfinish = () => p.remove();
    }
  }

  /* ambient floating hearts (very light) */
  const bgHearts = $("#bgHearts");
  setInterval(() => {
    if (document.hidden || reduce) return;
    const h = document.createElement("i");
    h.textContent = "♥";
    h.style.left = Math.random() * 100 + "%";
    h.style.fontSize = 8 + Math.random() * 12 + "px";
    bgHearts.appendChild(h);
    h.animate(
      [{ transform: "translateY(0)", opacity: 0 }, { opacity: 0.22, offset: 0.2 }, { transform: `translate(${(Math.random() - 0.5) * 60}px,-${bgHearts.clientHeight + 40}px)`, opacity: 0 }],
      { duration: 9000 + Math.random() * 4000, easing: "ease-in" }
    ).onfinish = () => h.remove();
  }, 1800);



  /* ── 0 · Gift ──────────────────────────────────── */
  function initGift() {
    const sc = $("#s-gift"), stage = $("#giftStage"), inner = $("#giftInner"), ring = $("#holdRing"), bow = $("#bow"), hint = $("#giftHint");
    const RING = 289.03, HOLD = 1700;
    $("#gName").textContent = NAME;
    $("#gFrom").textContent = FROM ? FROM + " made this \u2014 just for you." : "Made just for you.";
    sc.classList.remove("opening");
    ring.style.strokeDashoffset = RING; ring.style.opacity = 0; inner.style.transform = ""; bow.style.transform = "";
    hint.style.opacity = 1; hint.textContent = "Press & hold the ribbon to unwrap";

    let p = 0, holding = false, done = false, alive = true, raf = 0, last = 0, pulse = 0;
    const setHold = (v) => {
      if (done) return;
      holding = v;
      hint.textContent = v ? "Keep holding\u2026" : "Press & hold the ribbon to unwrap";
    };

    const frame = (t) => {
      if (!alive) return;
      const dt = Math.min(64, t - (last || t)); last = t;
      p = Math.max(0, Math.min(1, p + (holding ? dt / HOLD : -dt / 450)));
      const j = p * 5;
      inner.style.transform = p > 0.01 ? `translate(${((Math.random() - 0.5) * j).toFixed(2)}px,${((Math.random() - 0.5) * j).toFixed(2)}px) scale(${(1 + p * 0.05).toFixed(3)}) rotate(${((Math.random() - 0.5) * p * 2.5).toFixed(2)}deg)` : "";
      bow.style.transform = p > 0.01 ? `rotate(${(Math.sin(t / 55) * p * 8).toFixed(2)}deg) scale(${(1 + p * 0.16).toFixed(3)})` : "";
      ring.style.strokeDashoffset = (RING * (1 - p)).toFixed(1);
      ring.style.opacity = p > 0.01 ? 1 : 0;
      if (holding && t - pulse > 260) { pulse = t; buzz(8 + Math.round(p * 22)); }
      Sound.ribbon(p, holding);
      if (p >= 1 && !done) { done = true; holding = false; open(); return; }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    stage.onpointerdown = (e) => { e.preventDefault(); try { stage.setPointerCapture(e.pointerId); } catch (_) {} setHold(true); };
    stage.onpointerup = () => setHold(false);
    stage.onpointercancel = () => setHold(false);
    stage.oncontextmenu = (e) => e.preventDefault();
    stage.onkeydown = (e) => { if ((e.key === "Enter" || e.key === " ") && !e.repeat) { e.preventDefault(); setHold(true); } };
    stage.onkeyup = (e) => { if (e.key === "Enter" || e.key === " ") setHold(false); };

    async function open() {
      buzz([30, 40, 70]); Sound.ribbonEnd(); Sound.unwrap();
      sc.classList.add("opening"); ring.style.opacity = 0; inner.style.transform = ""; hint.style.opacity = 0;
      const r = stage.getBoundingClientRect(), a = $("#app").getBoundingClientRect();
      const cx = r.left - a.left + r.width / 2, cy = r.top - a.top + r.height * 0.5;
      await wait(650); if (!alive) return;
      burst(sc, cx, cy, ["#ffd36e", "#f4677f", "#fff", "#8fb8f2", "#7ed0b0"], 34, 170);
      confettiRain(sc, 100);
      for (let i = 0; i < 9 && !reduce; i++) {
        const h = document.createElement("i");
        h.className = "gift-heart"; h.textContent = "\u2665";
        h.style.left = cx + (Math.random() - 0.5) * 120 + "px"; h.style.top = cy + "px"; h.style.fontSize = 14 + Math.random() * 14 + "px";
        sc.appendChild(h);
        h.animate(
          [{ transform: "translateY(0) scale(.5)", opacity: 0 }, { opacity: 1, offset: 0.2 }, { transform: `translate(${(Math.random() - 0.5) * 90}px,-${140 + Math.random() * 160}px) scale(1.1)`, opacity: 0 }],
          { duration: 1800 + Math.random() * 900, delay: Math.random() * 400, easing: "ease-out" }
        ).onfinish = () => h.remove();
      }
      await wait(2300); if (alive) next();
    }
    return () => { alive = false; cancelAnimationFrame(raf); Sound.ribbonEnd(); };
  }

  /* ── 0b · Welcome ───────────────────────────────── */
  function initWelcome() {
    const wsc = $("#s-welcome");
    const yes = $("#yesBtn"), no = $("#noBtn"), app = $("#app");
    let alive = true, flying = false, round = 0; const ivs = [], tos = [];
    no.className = "btn no"; no.textContent = "No"; no.getAnimations().forEach((a) => a.cancel());

    /* bouncing letters */
    const letters = (el, text, off) => {
      el.innerHTML = "";
      [...text].forEach((ch, i) => {
        const s = document.createElement("span"); s.className = "wl"; s.textContent = ch; s.style.setProperty("--i", i + off);
        if (ch === " ") s.style.whiteSpace = "pre";
        el.appendChild(s);
      });
    };
    letters($("#wLine"), "Happy Birthday,", 0); letters($("#wName"), NAME, 15);
    $("#wTitle").setAttribute("aria-label", "Happy Birthday, " + NAME);

    /* balloons drifting up behind everything */
    const fb = $("#fballs"); fb.innerHTML = "";
    const FPAL = [["#f8c8d4", "#d9617f"], ["#c3e8cc", "#58a67c"], ["#d3c9f4", "#7d68cc"], ["#fcd9ae", "#e4894a"], ["#fbe2a0", "#e0b030"], ["#bfe0f6", "#4f9bd0"], ["#f7c0e6", "#cf66b0"]];
    for (let i = 0; i < 9; i++) {
      const d = document.createElement("div"), sz = 34 + Math.random() * 26;
      d.className = "fb"; d.style.width = sz + "px";
      d.style.left = (i % 2 ? -3 + Math.random() * 11 : 85 + Math.random() * 10) + "%";   // keep them at the edges, clear of the text
      d.style.setProperty("--d", 9 + Math.random() * 7 + "s"); d.style.setProperty("--dl", "-" + Math.random() * 14 + "s"); d.style.setProperty("--sw", 12 + Math.random() * 22 + "px");
      const p = FPAL[i % FPAL.length]; d.innerHTML = balloonSVG(p[0], p[1], "w" + i);
      fb.appendChild(d);
    }

    /* the party goes off */
    tos.push(setTimeout(() => { if (!alive) return; const w = app.clientWidth, y = app.clientHeight * 0.62; popperBurst(wsc, 30, y, 1); popperBurst(wsc, w - 30, y, -1); buzz([15, 40, 15]); Sound.popper(); }, 700));
    tos.push(setTimeout(() => { if (!alive) return; const w = app.clientWidth, y = app.clientHeight * 0.62; popperBurst(wsc, 30, y, 1); popperBurst(wsc, w - 30, y, -1); Sound.popper(0.8); }, 2600));
    tos.push(setTimeout(() => alive && confettiRain(wsc, 60), 800));
    if (!reduce) {
      ivs.push(setInterval(() => confettiRain(wsc, 2), 600));
      const WORDS = ["Yay!", "Woohoo!", "Hooray!", "Party time!", "Let's go!", "Wheee!"], YC = ["#e0345f", "#f08a1c", "#3f9ad6", "#3fb58a", "#9b59d0"];
      let wi = 0;
      ivs.push(setInterval(() => {
        const y = document.createElement("span"); y.className = "yay"; y.textContent = WORDS[wi++ % WORDS.length]; y.style.color = YC[wi % YC.length];
        y.style.left = (wi % 2 ? 6 + Math.random() * 14 : 58 + Math.random() * 14) + "%"; y.style.top = 26 + Math.random() * 6 + "%";
        wsc.appendChild(y); const rot = (Math.random() - 0.5) * 30;
        y.animate([{ opacity: 0, transform: `scale(.2) rotate(${rot}deg)` }, { opacity: 1, transform: `scale(1.25) rotate(${rot}deg)`, offset: 0.25 }, { opacity: 1, transform: `scale(1) rotate(${rot}deg) translateY(-8px)`, offset: 0.7 }, { opacity: 0, transform: `scale(1) rotate(${rot}deg) translateY(-34px)` }], { duration: 1700, easing: "ease-out" }).onfinish = () => y.remove();
      }, 1150));
    }


    yes.onclick = () => {
      buzz(20); Sound.yes();
      const r = yes.getBoundingClientRect(), a = app.getBoundingClientRect();
      burst($("#s-welcome"), r.left - a.left + r.width / 2, r.top - a.top + r.height / 2, ["#f4677f", "#ffc857", "#fff", "#8fb8f2"], 22, 110);
      setTimeout(() => alive && next(), 650);
    };

    no.onclick = () => {
      if (flying) return;
      if (round > 0) return yes.click();             // after the chase, "No" gives in
      round++; flying = true; buzz([30, 40, 30]); Sound.boing();
      const home = no.getBoundingClientRect(), box = app.getBoundingClientRect();
      const pad = 14, legs = reduce ? 1 : 7, dur = reduce ? 200 : 2600;
      const frames = [{ transform: "translate(0,0) rotate(0deg)", offset: 0 }];
      for (let k = 1; k <= legs; k++) {
        const tx = box.left + pad + Math.random() * (box.width - home.width - pad * 2) - home.left;
        const ty = box.top + 70 + Math.random() * (box.height - home.height - 110) - home.top;
        frames.push({ transform: `translate(${tx}px,${ty}px) rotate(${(Math.random() - 0.5) * 50}deg) scale(${0.9 + Math.random() * 0.25})`, offset: k / (legs + 1) });
      }
      frames.push({ transform: "translate(0,0) rotate(0deg) scale(1)", offset: 1 });
      no.classList.add("flying");
      const anim = no.animate(frames, { duration: dur, easing: "cubic-bezier(.45,0,.25,1)" });
      anim.onfinish = () => {
        if (!alive) return;
        flying = false; no.classList.remove("flying"); no.classList.add("again"); Sound.ding();
        no.textContent = "Okay, yes!";
        no.animate([{ transform: "scale(1.2)" }, { transform: "scale(1)" }], { duration: 350, easing: "cubic-bezier(.3,1.6,.5,1)" });
      };
    };
    return () => { alive = false; ivs.forEach(clearInterval); tos.forEach(clearTimeout); };
  }

  /* ── 1 · Balloons ──────────────────────────────── */
  function balloonSVG(c1, c2, id) {
    return `<svg viewBox="0 0 100 150" aria-hidden="true">
      <defs><radialGradient id="bg${id}" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></radialGradient></defs>
      <path d="M50 4C78 4 94 26 94 52C94 80 72 100 50 104C28 100 6 80 6 52C6 26 22 4 50 4Z" fill="url(#bg${id})"/>
      <path d="M42 104L50 113L58 104Z" fill="${c2}"/>
      <path d="M50 113C43 125 58 135 50 148" stroke="#a89494" fill="none" stroke-width="1.3" stroke-linecap="round"/>
      <ellipse cx="31" cy="30" rx="8" ry="14" fill="#fff" opacity=".5" transform="rotate(25 31 30)"/>
      <circle cx="50" cy="54" r="6" fill="none" stroke="#d9a441" stroke-width="2.2"/>
    </svg>`;
  }

  function initBalloons() {
    const stage = $("#balloonStage");
    stage.innerHTML = "";
    if (C.balloonSubColor) $("#s-balloons .sub").style.color = C.balloonSubColor;
    const words = (C.balloonWords || []).slice(0, 8);
    const rnd = (lo, hi) => lo + Math.random() * (hi - lo);
    const PAL = [["#f8c8d4", "#d9617f"], ["#c3e8cc", "#58a67c"], ["#d3c9f4", "#7d68cc"], ["#fcd9ae", "#e4894a"], ["#fbe2a0", "#e0b030"], ["#bfe0f6", "#4f9bd0"], ["#f7c0e6", "#cf66b0"], ["#cdeed9", "#4cb08c"]];
    const pal = PAL.map((p) => [Math.random(), p]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
    const SW = stage.clientWidth || 320, SH = stage.clientHeight || 420;
    const base = Math.max(56, Math.min(80, SW * 0.19));

    /* scatter: random sizes + positions, rejecting overlaps (relaxes if the screen is tight) */
    const pts = []; let k = 1;
    words.forEach(() => {
      const bw = base * rnd(0.86, 1.2), bh = bw * 1.5;
      for (let tries = 1; tries <= 2500; tries++) {
        const x = rnd(0, Math.max(1, SW - bw)), y = rnd(0, Math.max(1, SH - bh));
        const cx = x + bw / 2, cy = y + bh / 2;
        if (tries === 2500 || pts.every((p) => ((cx - p.cx) / (((bw + p.bw) / 2) * 1.2 * k)) ** 2 + ((cy - p.cy) / (((bh + p.bh) / 2) * 1.05 * k)) ** 2 >= 1)) { pts.push({ x, y, cx, cy, bw, bh }); break; }
        if (tries % 80 === 0) k *= 0.93;
      }
    });

    const placed = [];
    let popped = 0, alive = true;

    words.forEach((w, i) => {
      const b = document.createElement("button"), p = pts[i];
      b.type = "button"; b.className = "balloon"; b.setAttribute("aria-label", "Pop balloon " + (i + 1));
      b.style.left = p.x + "px"; b.style.top = p.y + "px"; b.style.width = p.bw + "px";
      b.style.setProperty("--d", rnd(3, 5.8).toFixed(2) + "s");
      b.style.setProperty("--dl", "-" + rnd(0, 5).toFixed(2) + "s");
      b.style.setProperty("--amp", rnd(8, 18).toFixed(1) + "px");
      b.style.setProperty("--rot", rnd(1.5, 4).toFixed(1) + "deg");
      b.innerHTML = balloonSVG(pal[i][0], pal[i][1], i);
      b.addEventListener("click", () => pop(i, b));
      stage.appendChild(b);
    });

    function pop(i, b) {
      if (b.classList.contains("popped")) return;
      b.classList.add("popped"); buzz(18);
      const sr = stage.getBoundingClientRect(), r = b.querySelector("svg").getBoundingClientRect();
      let x = r.left - sr.left + r.width / 2;
      const y = r.top - sr.top + r.height * 0.4;
      burst(stage, x, y, pal[i], 14, 70);
      const w = document.createElement("span");
      w.className = "word"; w.textContent = words[i]; w.style.top = y + "px"; w.style.left = "0px";
      stage.appendChild(w);
      const ww = w.offsetWidth, h = w.offsetHeight, half = ww / 2 + 6;
      x = Math.max(half, Math.min(sr.width - half, x));         // keep inside the screen
      let ty = y;                                               // and out of other words' way
      const hit = (yy) => placed.some((q) => !(x + ww / 2 + 4 < q.l || x - ww / 2 - 4 > q.r || yy + h / 2 + 2 < q.t || yy - h / 2 - 2 > q.b));
      for (const d of [0, 1, -1, 2, -2, 3, -3]) {
        const yy = y + d * (h + 2);
        if (yy - h / 2 >= 0 && yy + h / 2 <= sr.height && !hit(yy)) { ty = yy; break; }
      }
      placed.push({ l: x - ww / 2, r: x + ww / 2, t: ty - h / 2, b: ty + h / 2 });
      w.style.left = x + "px"; w.style.top = ty + "px";
      w.animate(
        [{ opacity: 0, transform: "translate(-50%,-50%) scale(.4)" }, { opacity: 1, transform: "translate(-50%,-50%) scale(1)" }],
        { duration: 450, easing: "cubic-bezier(.3,1.6,.5,1)", fill: "forwards" }
      );
      Sound.pop(popped);
      if (++popped === words.length) { Sound.fanfare(); finish(); }
    }

    async function finish() {
      await wait(2500); if (alive) next();
    }
    return () => { alive = false; };
  }

  /* ── 2 · Cake ──────────────────────────────────── */
  function initCake() {
    const sc = $("#s-cake");
    sc.classList.remove("out", "cheer", "planted", "lit", "shown");
    sc.querySelectorAll(".shw,.confetti").forEach((e) => e.remove());
    $("#cheerText").textContent = C.cheer || "Hip hip hooray!";
    $("#cakeTitle").textContent = "Blow the candle, " + NAME;
    const btn = $("#blowBtn"); btn.disabled = false; btn.classList.remove("show");
    let alive = true, lit = false; const timers = [];
    const at = (fn, ms) => timers.push(setTimeout(() => alive && fn(), ms));

    if (reduce) {
      sc.classList.add("planted", "lit", "shown"); lit = true; btn.classList.add("show");
    } else {
      [650, 950, 1250].forEach((ms, k) => at(() => Sound.thud(k), ms));            // the three layers land
      at(() => sc.classList.add("shown"), 2050);
      at(() => { sc.classList.add("planted"); buzz(14); Sound.plant(); }, 1950); at(() => Sound.plant(), 2170);   // 2 and 7 tumble in and plant themselves
      at(() => { sc.classList.add("lit"); lit = true; Sound.ignite(); }, 3050); at(() => Sound.ignite(), 3270);      // flames ignite one after the other
      at(() => btn.classList.add("show"), 3750);
    }

    btn.onclick = async () => {
      if (!lit || btn.disabled) return;
      btn.disabled = true; buzz(25); Sound.blow();
      sc.classList.add("out");
      await wait(800); if (!alive) return;
      sc.classList.add("cheer"); buzz([20, 40, 20]);
      Sound.cheers(); partyShower(sc, 6); confettiRain(sc, 90);
      await wait(1400); if (!alive) return; Sound.popper(0.6); partyShower(sc, 4); confettiRain(sc, 50);
      await wait(3000); if (alive) next();
    };
    return () => { alive = false; timers.forEach(clearTimeout); sc.querySelectorAll(".shw,.confetti").forEach((e) => e.remove()); };
  }

  /* ── 3 · Bouquet (cinematic) ───────────────────── */
  const SVGNS = "http://www.w3.org/2000/svg";
  function S(tag, attrs, parent, cls) {
    const e = document.createElementNS(SVGNS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (cls) e.setAttribute("class", cls);
    if (parent) parent.appendChild(e);
    return e;
  }
  const prng = (seed) => { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; };
  const f1 = (n) => n.toFixed(1);

  const PETAL_ROSE = "M0 0 C-17 -5 -24 -22 -15 -33 C-9 -39 -3 -36 0 -37 C3 -36 9 -39 15 -33 C24 -22 17 -5 0 0Z";
  const PETAL_PEONY = "M0 0 C-19 -6 -27 -20 -21 -31 C-19 -36 -15 -35 -12 -38 C-9 -41 -5 -37 -2 -39 C1 -41 4 -37 8 -39 C12 -41 15 -36 18 -35 C22 -33 24 -28 23 -24 C27 -14 19 -6 0 0Z";
  const LIP = "M-13 -31 C-8 -37 8 -37 13 -31";

  function petalAt(g, shape, x, y, ang, sc, cls, lip) {
    const pg = S("g", { transform: `translate(${f1(x)} ${f1(y)}) rotate(${f1(ang)}) scale(${sc.toFixed(3)})` }, g);
    S("path", { d: shape }, pg, "p " + cls);
    S("path", { d: shape, fill: "url(#gShade)" }, pg);
    if (lip) S("path", { d: LIP, fill: "none", stroke: "#ffe3e8", "stroke-opacity": ".38", "stroke-width": "1.3", "stroke-linecap": "round" }, pg);
  }
  function petalRing(g, shape, cx, cy, n, d, sc, off, cls, jit, r, lip) {
    for (let k = 0; k < n; k++) {
      const a = off + (k * 360) / n + (r() - 0.5) * jit, rad = (a * Math.PI) / 180, dd = d * (0.85 + r() * 0.3);
      petalAt(g, shape, cx + Math.cos(rad) * dd, cy + Math.sin(rad) * dd, a + 90, sc * (0.92 + r() * 0.16), cls, lip);
    }
  }
  function wrinkles(g, cx, cy, R, n, r) {
    for (let k = 0; k < n; k++) {
      const a = r() * Math.PI * 2, r0 = R * 0.12, r1 = R * (0.5 + r() * 0.45), bend = (r() - 0.5) * 0.8;
      const x0 = cx + Math.cos(a) * r0, y0 = cy + Math.sin(a) * r0, x1 = cx + Math.cos(a + bend) * r1, y1 = cy + Math.sin(a + bend) * r1;
      S("path", { d: `M${f1(x0)} ${f1(y0)} Q${f1((x0 + x1) / 2 + (r() - 0.5) * 6)} ${f1((y0 + y1) / 2 + (r() - 0.5) * 6)} ${f1(x1)} ${f1(y1)}` }, g, "wr");
    }
  }
  function realLeaf(g, x, y, a, L) {
    const w = L * 0.3, n = 13, up = [], lo = [];
    for (let i = 1; i < n; i++) {
      const t = i / n, e = Math.sin(Math.PI * Math.pow(t, 0.75));
      up.push(`${f1(L * t)} ${f1(-w * e * (i % 2 ? 1 : 0.86))}`);
      lo.push(`${f1(L * t)} ${f1(w * 0.88 * e * (i % 2 ? 0.86 : 1))}`);
    }
    const d = `M0 0 L${up.join(" L")} L${L} 0 L${lo.reverse().join(" L")} Z`, tf = `translate(${x} ${y}) rotate(${a})`;
    S("path", { d, transform: tf }, g, "leaf");
    S("path", { d, transform: tf, fill: "url(#gLeafShade)" }, g);
    let v = `M2 0 L${L - 4} 0`;
    [0.2, 0.35, 0.5, 0.65, 0.8].forEach((t) => {
      const h = w * 0.72 * Math.sin(Math.PI * t);
      v += ` M${f1(L * t)} 0 L${f1(L * (t + 0.13))} ${f1(-h)} M${f1(L * t)} 0 L${f1(L * (t + 0.13))} ${f1(h * 0.85)}`;
    });
    S("path", { d: v, transform: tf }, g, "vein");
  }

  const FLOWERS = [
    { t: "rose",  cx: 122, cy: 76,  s: 0.95, m: 144, rot: -18, hr: -35, td: 0.5, ex: 86,  ey: 288, lift: 40 },
    { t: "rose",  cx: 182, cy: 72,  s: 0.95, m: 156, rot: 20,  hr: 38,  td: 0.9, ex: 216, ey: 294, lift: 36 },
    { t: "rose",  cx: 94,  cy: 118, s: 1.0,  m: 136, rot: -34, hr: -45, td: 0.3, ex: 64,  ey: 318, lift: 20 },
    { t: "rose",  cx: 208, cy: 116, s: 1.0,  m: 164, rot: 32,  hr: 48,  td: 1.0, ex: 238, ey: 322, lift: 20 },
    { t: "peony", cx: 76,  cy: 168, s: 1.05, m: 130, rot: -52, hr: -55, td: 0.2, ex: 44,  ey: 346, lift: 0 },
    { t: "peony", cx: 228, cy: 170, s: 1.05, m: 170, rot: 50,  hr: 58,  td: 0.7, ex: 258, ey: 350, lift: 0 },
    { t: "peony", cx: 150, cy: 176, s: 1.0,  m: 150, rot: -9,  hr: -22, td: 0.6, ex: 104, ey: 312, lift: 10 }
  ];
  const LEAVES = [
    { x: 134, y: 236, a: -158, L: 46, rot: -58, td: 0.4 }, { x: 166, y: 236, a: -22, L: 46, rot: 58, td: 0.8 },
    { x: 138, y: 208, a: -128, L: 42, rot: -50, td: 0.6 }, { x: 162, y: 206, a: -52, L: 42, rot: 50, td: 0.2 },
    { x: 142, y: 156, a: -116, L: 38, rot: -40, td: 0.9 }, { x: 160, y: 154, a: -64, L: 38, rot: 40, td: 0.5 }
  ];

  function buildBouquet() {
    ["bqLeaves", "bqInner", "bqFlowers", "bqFallen"].forEach((id) => ($("#" + id).innerHTML = ""));
    const leavesG = $("#bqLeaves"), innerG = $("#bqInner"), flG = $("#bqFlowers");

    LEAVES.forEach((l) => {
      const g = S("g", {}, leavesG, "fl");
      g.style.cssText = `--td:${l.td}s;--rot:${l.rot}deg;transform-origin:${l.x}px ${l.y}px`;
      realLeaf(g, l.x, l.y, l.a, l.L);
    });

    FLOWERS.forEach((f) => {
      const bx = 150 - (f.m - 150) * 0.35;
      S("path", { d: `M${f.m} 262 L${f1(bx)} 388` }, innerG, "instem");
      const g = S("g", {}, flG, "flw " + f.t);
      g.style.cssText = `--td:${f.td}s`;
      const sy = f.cy + 16 * f.s;
      f.stem = S("path", { d: `M${f.m} 262 Q${f1(f.m + (f.cx - f.m) * 0.1)} ${f1(262 - (262 - sy) * 0.55)} ${f.cx} ${f1(sy)}` }, g, "stem");
      const h = S("g", {}, g, "head");
      f.head = h;
      const r = prng(f.cx * 7 + f.cy * 3 + 11), s = f.s, { cx, cy } = f;
      S("circle", { cx: f1(cx + 1.5), cy: f1(cy + 3), r: f1((f.t === "rose" ? 25 : 31) * s), fill: "#2a0612", opacity: ".22" }, h);
      if (f.t === "rose") {
        const ps = s * 0.58;
        petalRing(h, PETAL_ROSE, cx, cy, 7, 6.5 * s, ps, 0, "p1", 20, r, true);
        petalRing(h, PETAL_ROSE, cx, cy, 6, 4.8 * s, ps * 0.82, 25, "p2", 22, r, true);
        petalRing(h, PETAL_ROSE, cx, cy, 5, 3.2 * s, ps * 0.62, 10, "p3", 26, r, true);
        petalRing(h, PETAL_ROSE, cx, cy, 4, 1.8 * s, ps * 0.44, 40, "p3", 30, r, true);
        petalRing(h, PETAL_ROSE, cx, cy, 3, 0.7 * s, ps * 0.28, 5, "p4", 40, r, false);
        S("path", { d: `M${f1(cx - 2 * s)} ${f1(cy + 1 * s)} q${f1(-1 * s)} ${f1(-4 * s)} ${f1(3 * s)} ${f1(-4 * s)} q${f1(4 * s)} ${f1(1 * s)} ${f1(2 * s)} ${f1(5 * s)}`, fill: "none", stroke: "#2a0612", "stroke-opacity": ".55", "stroke-width": ".8", "stroke-linecap": "round" }, h);
        wrinkles(h, cx, cy, 24 * s, 9, r);
      } else {
        const ps = s * 0.62;
        petalRing(h, PETAL_PEONY, cx, cy, 9, 7 * s, ps, 0, "q1", 16, r, true);
        petalRing(h, PETAL_PEONY, cx, cy, 8, 5.4 * s, ps * 0.85, 20, "q2", 18, r, true);
        petalRing(h, PETAL_PEONY, cx, cy, 7, 3.8 * s, ps * 0.68, 8, "q3", 22, r, true);
        petalRing(h, PETAL_PEONY, cx, cy, 6, 2.4 * s, ps * 0.5, 30, "q4", 26, r, true);
        petalRing(h, PETAL_PEONY, cx, cy, 5, 1.2 * s, ps * 0.34, 15, "q4", 34, r, false);
        for (let k = 0; k < 7; k++) S("circle", { cx: f1(cx + (r() - 0.5) * 6 * s), cy: f1(cy + (r() - 0.5) * 6 * s), r: f1(0.9 * s) }, h, "p q5");
        wrinkles(h, cx, cy, 30 * s, 11, r);
      }
    });

    /* the silk flower: flawless, stiff, unmistakably made of fabric */
    const head = $("#artHead");
    [...head.children].slice(1).forEach((n) => n.remove());
    const D = "M0 0 C-13 -9 -16 -27 0 -35 C16 -27 13 -9 0 0Z";
    const petal = (rot, sc, fill) => {
      const g = S("g", { transform: `rotate(${rot}) scale(${sc})` }, head);
      S("path", { d: D, fill, stroke: "#ff9aa8", "stroke-opacity": ".75", "stroke-width": "1" }, g);        // wired edge
      S("path", { d: D, fill: "url(#pWeave)" }, g);                                                          // fabric weave
      S("path", { d: D, fill: "url(#gSpec)" }, g);                                                           // satin sheen
      S("path", { d: "M0 -3 L0 -31 M-3 -5 L-7 -22 M3 -5 L7 -22 M-5 -8 L-10 -17 M5 -8 L10 -17", stroke: "#fff", "stroke-opacity": ".22", "stroke-width": ".7", fill: "none", "stroke-linecap": "round" }, g); // pressed veins
    };
    for (let k = 0; k < 8; k++) petal(k * 45, 1, "url(#gSilk)");
    for (let k = 0; k < 7; k++) petal((k * 360) / 7 + 14, 0.76, "url(#gSilk2)");
    for (let k = 0; k < 6; k++) petal(k * 60 + 8, 0.52, "url(#gSilk)");
    S("circle", { r: "5.4", fill: "url(#gGold)", stroke: "#fff3c4", "stroke-opacity": ".6", "stroke-width": ".6" }, head);
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2;
      S("circle", { cx: f1(Math.cos(a) * 8.2), cy: f1(Math.sin(a) * 8.2), r: "1.35", fill: "#ffd98a" }, head);
    }
    [[-15, -19], [13, -23], [-3, 22], [20, 9]].forEach(([x, y]) => {          // glass dew beads
      S("circle", { cx: x, cy: y, r: "2", fill: "#fff", "fill-opacity": ".32", stroke: "#fff", "stroke-opacity": ".7", "stroke-width": ".5" }, head);
      S("circle", { cx: x - 0.6, cy: y - 0.7, r: ".6", fill: "#fff" }, head);
    });
    [["g1", -17, -22], ["g2", 21, -6], ["g3", 4, 21]].forEach(([c, x, y]) => {
      const g = S("g", { transform: `translate(${x} ${y})` }, head);
      S("path", { d: "M0 -8 L1.8 -1.8 L8 0 L1.8 1.8 L0 8 L-1.8 1.8 L-8 0 L-1.8 -1.8Z", fill: "#fff" }, g, "glint " + c);
    });
  }

  const easeIO = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  function poseFlower(f, e) {
    const hx = f.cx + (f.ex - f.cx) * e, hy = f.cy + (f.ey - f.cy) * e;
    const c0x = f.m + (f.cx - f.m) * 0.1, c0y = 262 - (262 - (f.cy + 16 * f.s)) * 0.55;
    const c1x = f.m + (f.ex - f.m) * 0.55, c1y = 232 - f.lift * 0.6;
    f.stem.setAttribute("d", `M${f.m} 262 Q${f1(c0x + (c1x - c0x) * e)} ${f1(c0y + (c1y - c0y) * e)} ${f1(hx)} ${f1(hy + 16 * f.s * (1 - e))}`);
    f.head.setAttribute("transform", `translate(${f1(hx)} ${f1(hy)}) rotate(${f1(f.hr * e)}) scale(${(1 - 0.14 * e).toFixed(3)}) translate(${-f.cx} ${-f.cy})`);
  }
  let witherRaf = 0;
  function witherFlowers(dur) {
    const t0 = performance.now();
    const frame = (now) => {
      let done = true;
      FLOWERS.forEach((f) => {
        const raw = Math.max(0, Math.min(1, (now - t0 - f.td * 1000) / dur));
        if (raw < 1) done = false;
        poseFlower(f, easeIO(raw));
      });
      witherRaf = done ? 0 : requestAnimationFrame(frame);
    };
    witherRaf = requestAnimationFrame(frame);
  }

  function dropPetals() {
    const g = $("#bqFallen");
    const kinds = {
      rose:  { shape: PETAL_ROSE,  cols: ["#8a1630", "#a01c3a", "#6e1d2b", "#5a2a2c", "#b02448"] },
      peony: { shape: PETAL_PEONY, cols: ["#e0a3b8", "#cf8fa4", "#b07f8c", "#94716f"] }
    };
    FLOWERS.forEach((f) => {
      const kind = kinds[f.t];
      for (let k = 0; k < 6; k++) {
        const mix = 0.2 + Math.random() * 0.8;
        const sx = f.cx + (f.ex - f.cx) * mix, sy = f.cy + (f.ey - f.cy) * mix;
        const ex = Math.max(10, Math.min(290, f.ex + (Math.random() - 0.5) * 170)), ey = 386 + Math.random() * 9;
        const sc = 0.34 + Math.random() * 0.24, flat = 0.5 + Math.random() * 0.25;
        const pg = S("g", {}, g, "fp");
        S("path", { d: kind.shape, fill: kind.cols[(Math.random() * kind.cols.length) | 0], stroke: "#2a0f0f", "stroke-opacity": ".4", "stroke-width": "1" }, pg);
        S("path", { d: kind.shape, fill: "url(#gShade)" }, pg);
        S("path", { d: LIP, fill: "none", stroke: "#ffe3e8", "stroke-opacity": ".3", "stroke-width": "1.3", "stroke-linecap": "round" }, pg);
        const T = (x, y, rot, a, b) => `translate(${f1(x)}px,${f1(y)}px) rotate(${rot}deg) scale(${a.toFixed(2)},${b.toFixed(2)})`;
        pg.animate(
          [
            { transform: T(sx, sy, Math.random() * 360, sc, sc), opacity: 0 },
            { opacity: 1, offset: 0.1 },
            { transform: T(sx + (ex - sx) * 0.35, sy + (ey - sy) * 0.45, Math.random() * 360, sc, sc * 0.25), opacity: 1, offset: 0.4 },
            { transform: T(sx + (ex - sx) * 0.7, sy + (ey - sy) * 0.78, Math.random() * 360, sc, sc * 0.85), opacity: 1, offset: 0.75 },
            { transform: T(ex, ey, Math.random() * 360, sc, sc * flat), opacity: 1 }
          ],
          { duration: 2800 + Math.random() * 1800, delay: 900 + Math.random() * 3600, easing: "cubic-bezier(.4,.1,.6,1)", fill: "both" }
        );
      }
    });
  }

  function magic(fx) {
    const p = document.createElement("i"); p.className = "mp";
    const ang = Math.random() * Math.PI * 2, rad = 60 + Math.random() * 150, sz = 2 + Math.random() * 4;
    p.style.cssText = `left:calc(50% + ${Math.cos(ang) * rad}px);top:calc(38% + ${Math.sin(ang) * rad * 0.9}px);width:${sz}px;height:${sz}px`;
    fx.appendChild(p);
    p.animate(
      [{ transform: "translate(0,0) scale(.4)", opacity: 0 }, { opacity: 1, offset: 0.25 }, { transform: `translate(${(Math.random() - 0.5) * 50}px,${-(50 + Math.random() * 110)}px) scale(1)`, opacity: 0 }],
      { duration: 3200 + Math.random() * 2400, easing: "ease-out" }
    ).onfinish = () => p.remove();
  }
  function mote(fx) {
    const p = document.createElement("i"); p.className = "mote";
    const sz = 3 + Math.random() * 6;
    p.style.cssText = `left:${Math.random() * 100}%;top:${10 + Math.random() * 70}%;width:${sz}px;height:${sz}px`;
    fx.appendChild(p);
    p.animate(
      [{ transform: "translate(0,0)", opacity: 0 }, { opacity: 0.85, offset: 0.3 }, { transform: `translate(${20 + Math.random() * 40}px,${-30 - Math.random() * 50}px)`, opacity: 0 }],
      { duration: 5000 + Math.random() * 3000, easing: "ease-in-out" }
    ).onfinish = () => p.remove();
  }

  function initBouquet() {
    const sc = $("#s-bouquet"), svg = $("#bqSvg"), cam = $("#camera"), fx = $("#fx");
    const btn = $("#bqBtn"), msg = $("#bqMsg"), top = $("#bqTop");
    btn.textContent = C.btnBouquet || "Flashback Time!";
    top.textContent = C.bouquetTop || "I will love you until the last flower dies.";
    top.classList.remove("show");
    msg.textContent = (C.bouquetMsg || "Some things never fade").replace(/\{name\}/g, NAME);
    btn.classList.remove("show"); msg.classList.remove("show");
    sc.classList.remove("timelapse", "macro", "letterbox", "final"); svg.classList.remove("withered", "glow");
    fx.innerHTML = "";
    buildBouquet(); FLOWERS.forEach((f) => poseFlower(f, 0));

    const fxp = { x: cam.offsetLeft + cam.offsetWidth / 2, y: cam.offsetTop + cam.offsetHeight * (104 / 420) };
    const zoom = (sc.offsetWidth * 0.72) / ((88 * cam.offsetWidth) / 300);
    const macro = `translate(${sc.offsetWidth / 2 - fxp.x}px,${sc.offsetHeight * 0.38 - fxp.y}px) scale(${zoom.toFixed(2)})`;

    let alive = true; const timers = [];
    const at = (fn, ms) => timers.push(setTimeout(() => alive && fn(), ms));
    cam.style.transition = "none"; cam.style.transform = "none"; void cam.offsetWidth;

    if (reduce) {
      sc.classList.add("timelapse", "macro", "final"); svg.classList.add("withered", "glow");
      FLOWERS.forEach((f) => poseFlower(f, 1));
      cam.style.transform = macro;
      at(() => { msg.classList.add("show"); btn.classList.add("show"); }, 200);
      btn.onclick = () => { Sound.tap(); next(); };
      return () => { alive = false; timers.forEach(clearTimeout); };
    }

    sc.classList.add("letterbox");
    at(() => top.classList.add("show"), 900);
    cam.style.transition = "transform 5.6s cubic-bezier(.3,.1,.3,1)";
    cam.style.transform = "scale(1.14)";
    const moteIv = setInterval(() => mote(fx), 380);
    let magicIv = null;

    at(() => {                                     // time passes
      sc.classList.add("timelapse"); svg.classList.add("withered");
      witherFlowers(4800); dropPetals(); buzz([20, 60, 20]);
    }, 5400);
    at(() => {                                     // the silk flower remains
      clearInterval(moteIv);
      sc.classList.add("macro"); svg.classList.add("glow");
      cam.style.transition = "transform 4.8s cubic-bezier(.6,0,.2,1)";
      cam.style.transform = macro;
      magicIv = setInterval(() => magic(fx), 120);
    }, 10600);
    at(() => { sc.classList.remove("letterbox"); sc.classList.add("final"); msg.classList.add("show"); }, 14600);
    at(() => btn.classList.add("show"), 15800);
    btn.onclick = () => { Sound.tap(); next(); };

    return () => { alive = false; cancelAnimationFrame(witherRaf); timers.forEach(clearTimeout); clearInterval(moteIv); if (magicIv) clearInterval(magicIv); };
  }

  /* ── 4 · Memories ──────────────────────────────── */
  function initMemories() {
    const deck = $("#deck"), btn = $("#memBtn");
    btn.textContent = C.btnMemories || "Let me express";
    deck.innerHTML = ""; btn.classList.remove("show");
    const photos = C.photos && C.photos.length ? C.photos : [];
    const rots = [-3, 4, -5, 2, -2, 5];
    let top = 0, drag = null;

    const cards = photos.map((p, i) => {
      const c = document.createElement("article");
      c.className = "card"; c.style.zIndex = photos.length - i;
      c.innerHTML = `<img src="${esc(p.src)}" alt="${esc(p.caption || "")}" draggable="false"><p class="cap">${esc(p.caption || "")}</p>`;
      deck.appendChild(c);
      return c;
    });

    function layout() {
      cards.forEach((c, i) => {
        const d = i - top;
        if (d < 0) return;
        c.style.transition = "transform .45s cubic-bezier(.2,.8,.2,1), opacity .3s";
        if (d > 2) { c.style.opacity = 0; c.style.transform = "translateY(20px) scale(.9)"; return; }
        c.style.opacity = 1;
        const rot = rots[i % rots.length] * (d === 0 ? 0.5 : 1);
        c.style.transform = `translate(0,${d * 10}px) rotate(${rot}deg) scale(${1 - d * 0.04})`;
      });
      if (top >= cards.length - 1) btn.classList.add("show");
    }

    function fling(dir, dy = 0) {
      if (top >= cards.length - 1) {
        buzz(10); Sound.bump();
        deck.animate([{ transform: "translateX(0)" }, { transform: "translateX(-8px)" }, { transform: "translateX(7px)" }, { transform: "translateX(0)" }], { duration: 320 });
        layout(); return;
      }
      const c = cards[top];
      c.style.transition = "transform .55s cubic-bezier(.3,.7,.3,1), opacity .55s";
      c.style.transform = `translate(${dir * innerWidth}px,${dy}px) rotate(${dir * 28}deg)`;
      c.style.opacity = 0; buzz(8);
      top++; layout(); Sound.swish(dir);
    }

    deck.addEventListener("pointerdown", (e) => {
      const c = cards[top]; if (!c || !c.contains(e.target)) return;
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now(), dx: 0, dy: 0, moved: false };
      deck.setPointerCapture(e.pointerId); c.style.transition = "none";
    });
    deck.addEventListener("pointermove", (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      drag.dx = e.clientX - drag.x; drag.dy = e.clientY - drag.y;
      if (Math.hypot(drag.dx, drag.dy) > 6) drag.moved = true;
      cards[top].style.transform = `translate(${drag.dx}px,${drag.dy * 0.6}px) rotate(${drag.dx * 0.07}deg)`;
    });
    const end = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const { dx, dy, t, moved } = drag; drag = null;
      const v = Math.abs(dx) / Math.max(1, performance.now() - t);
      if (!moved) return fling(1);
      if (Math.abs(dx) > 80 || v > 0.5) fling(Math.sign(dx) || 1, dy * 0.6); else { layout(); Sound.snap(); }
    };
    deck.addEventListener("pointerup", end);
    deck.addEventListener("pointercancel", () => { drag = null; layout(); });
    deck.addEventListener("keydown", (e) => { if (["ArrowRight", "ArrowLeft", "Enter", " "].includes(e.key)) { e.preventDefault(); fling(e.key === "ArrowLeft" ? -1 : 1); } });
    btn.onclick = () => { Sound.tap(); next(); };
    layout();
    return null;
  }

  /* ── 5 · Letter ────────────────────────────────── */
  function initLetter() {
    const sc = $("#s-letter"), env = $("#env"), sheet = $("#sheet"), body = $("#letterBody");
    const replay = $("#replayBtn"), hint = $("#tapHint");
    sc.classList.remove("open", "reading");
    replay.classList.remove("show"); body.innerHTML = "";
    let alive = true, opened = false, skip = false;

    const lines = [
      { t: `Dear ${NAME},` },
      ...(C.letter || []).map((l) => ({ t: l.replace(/\{name\}/g, NAME) })),
      FROM ? { t: `\u2014 ${FROM}`, cls: "sig" } : null,
      C.hashtag ? { t: C.hashtag, cls: "tag" } : null
    ].filter(Boolean);
    lines.forEach((line) => {
      const p = document.createElement("p");
      if (line.cls) p.className = line.cls;
      const parts = [];
      line.t.split(" ").forEach((w) => {            // keep an emoji glued to the word before it
        if (parts.length && /^\p{Extended_Pictographic}/u.test(w)) parts[parts.length - 1] += "\u00A0" + w; else parts.push(w);
      });
      parts.forEach((word, wi, arr) => {
        const w = document.createElement("span"); w.className = "w";
        [...word].forEach((ch) => { const c = document.createElement("span"); c.className = "c"; c.textContent = ch; w.appendChild(c); });
        p.appendChild(w);
        if (wi < arr.length - 1) p.appendChild(document.createTextNode(" "));
      });
      body.appendChild(p);
    });

    /* make the whole letter fit on one page — no scrollbar, whatever the screen size */
    const fit = () => {
      const avail = sheet.parentElement.clientHeight - 4;
      if (avail <= 0) return;
      let lo = 11, hi = 26;
      for (let i = 0; i < 9; i++) {
        const m = (lo + hi) / 2; body.style.fontSize = m + "px";
        if (sheet.offsetHeight <= avail) lo = m; else hi = m;
      }
      body.style.fontSize = lo.toFixed(1) + "px";
    };
    fit();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => alive && fit());
    addEventListener("resize", fit);

    async function typeOut() {
      const chars = [...body.querySelectorAll(".c")];
      const base = Math.max(9, Math.min(30, 15000 / chars.length));
      for (const ch of chars) {
        if (!alive) return;
        if (skip || reduce) { chars.forEach((c) => c.classList.add("on")); break; }
        ch.classList.add("on");
        const t = ch.textContent;
        await new Promise((r) => setTimeout(r, base + (/[.!?]/.test(t) ? 90 : /[,]/.test(t) ? 40 : 0)));
      }
      replay.classList.add("show");
      if (C.letterMusicStopAfter === false) Sound.duck(1, 3);                       // keep the music going: bring it back up
      else setTimeout(() => { if (alive) Sound.stop(1.8); }, (typeof C.letterMusicStopAfter === "number" ? C.letterMusicStopAfter : 5) * 1000);   // music ends once she has read it
    }

    async function open() {
      if (opened) return; opened = true; buzz(12); Sound.paper();
      hint.style.opacity = 0; sc.classList.add("open"); Sound.unfold();
      Sound.duck(typeof C.letterMusicVolume === "number" ? C.letterMusicVolume : 0.45, 1.8);   // the music gets quieter while the message is printed
      await wait(1500); if (!alive) return;
      fit();
      sc.classList.add("reading");
      await wait(700); if (!alive) return;
      typeOut();
    }
    env.onclick = open;
    env.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } };
    sheet.onclick = () => { skip = true; };
    replay.onclick = () => { Sound.tap(); hint.style.opacity = ""; go(0); };
    hint.style.opacity = "";
    return () => { alive = false; removeEventListener("resize", fit); };
  }

  (C.photos || []).forEach((p) => { const im = new Image(); im.decoding = "async"; im.src = p.src; });   // load the photos early so the cards appear instantly
  const startAt = order.indexOf(params.get("scene"));   // handy while editing: ?scene=letter
  go(startAt >= 0 ? startAt : 0);
})();
