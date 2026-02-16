// core.js — DOM helpers, output rendering, shared utilities
  const el = (id)=>document.getElementById(id);
  const term = el("term");
  const cmdInput = el("cmd");
  const promptEl = el("prompt");
  let lastInputRow = null;
  let lastOutputRow = null;
  const now = ()=>new Date().toLocaleString("de-DE");
  const clamp = (n,a,b)=>Math.max(a,Math.min(b,n));

  function escapeHtml(s){
    return String(s)
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }
  function clearRowTracking(){
    lastInputRow = null;
    lastOutputRow = null;
  }
  window.clearRowTracking = clearRowTracking;

  function markLatestRow(rowEl, kind){
    if(kind === "input"){
      if(lastInputRow) lastInputRow.classList.remove("rowLatestInput");
      if(lastOutputRow) lastOutputRow.classList.remove("rowLatestOutput");
      lastInputRow = rowEl;
      lastOutputRow = null;
      rowEl.classList.add("rowLatestInput");
      return;
    }
    if(lastOutputRow) lastOutputRow.classList.remove("rowLatestOutput");
    lastOutputRow = rowEl;
    rowEl.classList.add("rowLatestOutput");
  }

  function row(text, cls="", kind="output"){
    const d = document.createElement("div");
    d.className="row";
    if(cls) d.innerHTML = `<span class="${cls}">${escapeHtml(text)}</span>`;
    else d.textContent = text;
    term.appendChild(d);
    markLatestRow(d, kind);
    term.scrollTop = term.scrollHeight;
  }
  function rowHtml(html, kind="output"){
    const d = document.createElement("div");
    d.className="row";
    d.innerHTML = html;
    term.appendChild(d);
    markLatestRow(d, kind);
    term.scrollTop = term.scrollHeight;
  }

  function escapeXml(s){
    return String(s).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&apos;");
  }
  function svgData(title, subtitle, mood){
    const bg = mood==="school" ? "#142033" :
               mood==="lab" ? "#1a1433" :
               mood==="server" ? "#141b2b" :
               mood==="arena" ? "#12261a" :
               mood==="office" ? "#20141a" :
               mood==="library" ? "#151a22" :
               mood==="yard" ? "#0f2522" :
               "#151a22";
    const glow = mood==="arena" ? "#7cf4b0" :
                 mood==="office" ? "#ff6b6b" :
                 mood==="yard" ? "#ffcf5a" :
                 "#5b9cff";
    const s = `
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720">
  <defs>
    <radialGradient id="g" cx="30%" cy="10%" r="90%">
      <stop offset="0%" stop-color="${glow}" stop-opacity="0.26"/>
      <stop offset="55%" stop-color="${glow}" stop-opacity="0.06"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="l" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fff" stop-opacity="0.10"/>
      <stop offset="100%" stop-color="#fff" stop-opacity="0.02"/>
    </linearGradient>
  </defs>
  <rect width="1280" height="720" rx="36" fill="${bg}"/>
  <rect width="1280" height="720" fill="url(#g)"/>
  <rect x="36" y="36" width="1208" height="648" rx="28" fill="url(#l)" stroke="#25344a"/>
  <g opacity="0.92" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto" fill="#e7eef8">
    <text x="90" y="160" font-size="54" font-weight="800">${escapeXml(title)}</text>
    <text x="92" y="220" font-size="26" fill="#9fb0c5">${escapeXml(subtitle)}</text>
  </g>
  <g opacity="0.88" stroke="${glow}">
    <path d="M90 580 L360 580" stroke-width="3" opacity="0.55"/>
    <path d="M90 610 L520 610" stroke-width="3" opacity="0.35"/>
  </g>
  <g opacity="0.55" fill="#9fb0c5" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas" font-size="18">
    <text x="90" y="655">SchwarmShell • Offline • Phasen 1–3</text>
  </g>
</svg>`;
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(s);
  }
