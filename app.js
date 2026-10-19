/* salix field guide — a drawn willow, live DDL, and two languages. */

const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/* ── the willow ──────────────────────────────────────────────
   A weeping willow: one trunk, long drooping strands. Drawn as SVG
   paths and revealed by animating stroke-dashoffset, so the tree
   grows instead of appearing.                                        */

function willow() {
  const svg = $("#willow");
  if (!svg) return;

  const W = 420, H = 640;
  const trunkX = W * 0.5;
  const crownY = H * 0.30;
  const ns = "http://www.w3.org/2000/svg";

  const path = (d, cls, delay) => {
    const p = document.createElementNS(ns, "path");
    p.setAttribute("d", d);
    p.setAttribute("class", cls);
    if (delay) p.style.animationDelay = `${delay}s`;
    svg.appendChild(p);
    return p;
  };

  // trunk: a slow taper from the ground into the crown
  path(
    `M ${trunkX} ${H - 20}
     C ${trunkX - 6} ${H - 140}, ${trunkX + 10} ${H - 230}, ${trunkX - 4} ${crownY + 60}
     C ${trunkX - 12} ${crownY + 20}, ${trunkX - 6} ${crownY - 10}, ${trunkX} ${crownY - 40}`,
    "trunk", 0
  );

  // limbs fanning out of the crown
  const limbs = [
    [trunkX, crownY - 20, -150, -70, 210],
    [trunkX, crownY - 25, 150, -70, 205],
    [trunkX, crownY - 10, -95, -40, 190],
    [trunkX, crownY - 15, 95, -40, 195],
    [trunkX, crownY - 30, 0, -95, 120],
  ];
  limbs.forEach(([x, y, dx, dy, len], i) => {
    const ex = x + dx, ey = y + dy;
    const cx = x + dx * 0.55, cy = y + dy * 1.6;
    path(`M ${x} ${y} Q ${cx} ${cy} ${ex} ${ey}`, "limb", 0.35 + i * 0.09);
  });

  // drooping strands: each limb sheds a curtain of hanging tips
  const strandSets = [
    { ox: -150, oy: -70, count: 7, spread: 90, drop: 330 },
    { ox:  150, oy: -70, count: 7, spread: 90, drop: 330 },
    { ox:  -95, oy: -40, count: 5, spread: 70, drop: 280 },
    { ox:   95, oy: -40, count: 5, spread: 70, drop: 280 },
    { ox:    0, oy: -95, count: 5, spread: 60, drop: 200 },
  ];

  let n = 0;
  strandSets.forEach(({ ox, oy, count, spread, drop }) => {
    const bx = trunkX + ox, by = crownY + oy;
    for (let i = 0; i < count; i++) {
      const t = count === 1 ? 0.5 : i / (count - 1);
      const sway = (t - 0.5) * spread;
      const tipX = bx + sway * 1.15;
      const tipY = by + drop * (0.72 + 0.28 * Math.sin(t * Math.PI));
      const d =
        `M ${bx} ${by}
         C ${bx + sway * 0.5} ${by + drop * 0.34},
           ${tipX - sway * 0.28} ${by + drop * 0.62},
           ${tipX} ${tipY}`;
      path(d, "strand", 0.7 + n * 0.035);
      n++;
    }
  });

  // a few leaf ticks near the tips
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const rx = 120 + Math.sin(i * 1.7) * 40;
    const ry = 100 + Math.cos(i * 2.3) * 46;
    const x = trunkX + Math.cos(a) * rx;
    const y = crownY + 40 + Math.sin(a) * ry;
    path(`M ${x} ${y} q 7 -9 14 -1 q -7 9 -14 1 Z`, "leaf", 1.5 + i * 0.04);
  }

  // gentle, permanent sway
  const strands = $$(".strand", svg);
  strands.forEach((s, i) => {
    s.style.transformOrigin = `${trunkX}px ${crownY}px`;
    s.style.animationName = "sway";
    s.style.animationDuration = `${7 + (i % 5) * 0.9}s`;
    s.style.animationDelay = `${-i * 0.4}s`;
    s.style.animationIterationCount = "infinite";
    s.style.animationTimingFunction = "ease-in-out";
  });

  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes sway {
        0%, 100% { transform: rotate(-0.9deg); }
        50%      { transform: rotate(0.9deg); }
      }
    `;
    document.head.appendChild(style);
  }
}

/* ── generated DDL, per engine ───────────────────────────── */

const DDL = {
  sqlite:
`-- salix.ini:  engine = sqlite
CREATE TABLE "users" (
    "id"    INTEGER PRIMARY KEY AUTOINCREMENT,
    "name"  TEXT NOT NULL,
    "email" TEXT UNIQUE,
    "age"   BIGINT
)`,
  mysql:
`-- salix.ini:  engine = mysql
CREATE TABLE \`users\` (
    \`id\`    BIGINT AUTO_INCREMENT PRIMARY KEY,
    \`name\`  TEXT NOT NULL,
    \`email\` TEXT UNIQUE,
    \`age\`   BIGINT
)`,
  postgres:
`-- salix.ini:  engine = postgres
CREATE TABLE "users" (
    "id"    BIGSERIAL PRIMARY KEY,
    "name"  TEXT NOT NULL,
    "email" TEXT UNIQUE,
    "age"   BIGINT
)`,
};

function engines() {
  const out = $("#ddl");
  if (!out) return;

  const paint = (engine) => {
    out.textContent = DDL[engine] ?? "";
  };
  paint("sqlite");

  $$(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      $$(".tab").forEach((t) => {
        t.classList.toggle("is-on", t === tab);
        t.setAttribute("aria-selected", String(t === tab));
      });
      paint(tab.dataset.engine);
    });
  });
}

/* ── copy buttons ─────────────────────────────────────────── */

function copyButtons() {
  $$(".copy").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const panel = btn.closest("figure");
      const code = $("code", panel);
      const text = code ? code.textContent.trim() : "";
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        const range = document.createRange();
        range.selectNodeContents(code);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }
      const was = btn.textContent;
      btn.textContent = "copied";
      btn.classList.add("done");
      setTimeout(() => {
        btn.textContent = was;
        btn.classList.remove("done");
      }, 1400);
    });
  });
}

/* ── language ─────────────────────────────────────────────── */

function language() {
  const btn = $("#lang");
  if (!btn) return;

  const apply = (lang) => {
    const fa = lang === "fa";
    document.documentElement.lang = lang;
    document.documentElement.dir = fa ? "rtl" : "ltr";
    $$("[data-en]").forEach((el) => {
      const text = el.dataset[fa ? "fa" : "en"];
      if (text) el.textContent = text;
    });
    try { localStorage.setItem("salix-lang", lang); } catch {}
  };

  let saved = "en";
  try { saved = localStorage.getItem("salix-lang") || "en"; } catch {}
  apply(saved);

  btn.addEventListener("click", () => {
    const next = document.documentElement.lang === "fa" ? "en" : "fa";
    apply(next);
  });
}

/* ── scroll reveal ────────────────────────────────────────── */

function reveals() {
  const bands = $$(".band");
  if (!("IntersectionObserver" in window)) {
    bands.forEach((b) => b.classList.add("in"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    },
    { rootMargin: "0px 0px -12% 0px", threshold: 0.12 }
  );
  bands.forEach((b) => io.observe(b));
}

/* ── go ───────────────────────────────────────────────────── */

willow();
engines();
copyButtons();
language();
reveals();
