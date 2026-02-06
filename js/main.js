// main.js — boot + event wiring
const TUTORIAL_STEPS = [
  {
    target: "storyPanel",
    text: "Hier bei Ort & Story findest du Infos zu deinem aktuellen Aufenthaltsort, NPCs und hilfreiche Spielmechaniken (Commands).",
    button: "Ok, verstanden"
  },
  {
    target: "mapPanel",
    text: "Die Ordnerkarte zeigt dir den Aufbau der Spielwelt als Verzeichnisbaum. So behältst du den Überblick.",
    button: "Okay"
  },
  {
    target: "objectivesPanel",
    text: "Unter Ziele siehst du, was als Nächstes wichtig ist. Das ist dein roter Faden durch die Story.",
    button: "Weiter"
  },
  {
    target: "rewardsPanel",
    text: "Bei Belohnungen sammelst du Abzeichen und Fortschritt. So siehst du, was du schon geschafft hast.",
    button: "Weiter"
  },
  {
    target: "terminalPanel",
    text: "Das Terminal ist dein Hauptwerkzeug im Spiel. Hier gibst du alle Befehle ein und steuerst deinen Fortschritt.",
    button: "Testen wirs aus"
  }
];

const TUTORIAL_TASKS = [
  { id:"ls_home", kind:"input", text:'Du bist in deinem Zimmer. Schaue dich mal um und mache dich mit deiner Umgebung vertraut. Tippe dazu "ls" in das Eingabefeld ein und bestätige deine Eingabe mit der Entertaste auf der Tastatur oder mit dem "Run" Knopf rechts.' },
  { id:"cd_backpack", kind:"output", text:'In der Ausgabe erkennst du Ordner an einem Slash (/) und Dateien ohne Slash (z.B. readme.txt). Wechsle jetzt mit "cd backpack/" in den Ordner.' },
  { id:"ls_backpack", kind:"input", text:'Super. Schau dich auch hier mit "ls" um.' },
  { id:"cat_snack", kind:"output", text:'Mit "cat" kannst du Dateien lesen bzw. mit Gegenständen interagieren. Probier das mit der Datei hier im Ordner aus. Geben dazu "cat snack.txt" ein.' },
  { id:"cd_up", kind:"input", text:'Du kannst mit "cd .." eine Ebene nach oben gehen. Probier das jetzt aus.' },
  { id:"final", kind:"input", text:'Sehr gut! Viel Erfolg im Spiel 🎉 Lies jetzt mit "cat readme.txt" weiter und leg los.' }
];

let gameStarted = false;
let guidedTutorial = {
  active:false,
  panelStep:0,
  taskStep:0
};
let bootLoadSource = "Autosave";

function startNewGuidedGame(){
  doReset(false);
  state.flags.booted = true;
  bootLoadSource = "Guided";
  if(!state.startedAt) state.startedAt = now();
  saveState();
  boot();
  startGuidedTutorial();
}

function startGuidedTutorial(){
  guidedTutorial.active = true;
  guidedTutorial.panelStep = 0;
  guidedTutorial.taskStep = 0;
  showPanelTutorialStep();
}

function endGuidedTutorial(){
  guidedTutorial.active = false;
  hideTutorialBubble();
  clearTutorialFocus();
  const overlay = el("tutorialOverlay");
  overlay.hidden = true;
}

function clearTutorialFocus(){
  ["storyPanel","mapPanel","objectivesPanel","rewardsPanel","terminalPanel","cmd","term"].forEach((id)=>{
    const node = el(id);
    if(node){
      node.classList.remove("tutorialFocus");
      node.classList.remove("tutorialInputFocus");
    }
  });
}

function placeBubbleAt(targetEl, opts={}){
  const bubble = el("tutorialBubble");
  const rect = targetEl.getBoundingClientRect();
  const topOffset = Number(opts.topOffset || 8);
  const top = Math.min(window.innerHeight - bubble.offsetHeight - 12, Math.max(12, rect.top + topOffset));
  const left = Math.min(window.innerWidth - bubble.offsetWidth - 12, Math.max(12, rect.right + 12));
  bubble.style.top = `${top}px`;
  bubble.style.left = `${left}px`;
}

function showTutorialBubble(text, buttonText, onClick, opts={}){
  const overlay = el("tutorialOverlay");
  const bubble = el("tutorialBubble");
  overlay.hidden = false;
  bubble.hidden = false;
  el("tutorialText").textContent = text;
  const btn = el("tutorialBtn");
  const showButton = Boolean(opts.showButton !== false);
  btn.hidden = !showButton;
  if(showButton){
    btn.textContent = buttonText || "Weiter";
    btn.onclick = onClick || null;
  }else{
    btn.onclick = null;
  }
}

function hideTutorialBubble(){
  const bubble = el("tutorialBubble");
  bubble.hidden = true;
  bubble.style.top = "";
  bubble.style.left = "";
}

function showPanelTutorialStep(){
  clearTutorialFocus();
  const step = TUTORIAL_STEPS[guidedTutorial.panelStep];
  if(!step){
    hideTutorialBubble();
    clearTutorialFocus();
    showTaskTutorialStep();
    return;
  }
  const target = el(step.target);
  if(!target){
    guidedTutorial.panelStep += 1;
    showPanelTutorialStep();
    return;
  }
  target.classList.add("tutorialFocus");
  showTutorialBubble(step.text, step.button, ()=>{
    guidedTutorial.panelStep += 1;
    showPanelTutorialStep();
  });
  requestAnimationFrame(()=>placeBubbleAt(target));
}

function showTaskTutorialStep(){
  clearTutorialFocus();
  const task = TUTORIAL_TASKS[guidedTutorial.taskStep];
  if(!task){
    endGuidedTutorial();
    return;
  }

  const terminalPanel = el("terminalPanel");
  if(terminalPanel){
    terminalPanel.classList.add("tutorialFocus");
  }

  if(task.kind === "input"){
    el("cmd").classList.add("tutorialInputFocus");
    showTutorialBubble(task.text, "Weiter", null, { showButton:false });
    const topOffset = (task.id === "ls_home" || task.id === "ls_backpack") ? 40 : 8;
    requestAnimationFrame(()=>placeBubbleAt(el("cmd"), { topOffset }));
  } else {
    el("term").classList.add("tutorialInputFocus");
    showTutorialBubble(task.text, "Weiter", null, { showButton:false });
    requestAnimationFrame(()=>placeBubbleAt(el("term")));
  }
}

function getGuidedTutorialBlockMessage(segment){
  if(!guidedTutorial.active) return "";
  const s = String(segment||"").trim();
  if(!s) return "";

  if(guidedTutorial.panelStep < TUTORIAL_STEPS.length){
    return "Noch nicht junger Padawan, halte dich an die Einführung!";
  }

  const task = TUTORIAL_TASKS[guidedTutorial.taskStep];
  if(!task) return "";

  const expectedByTask = {
    ls_home: ["ls"],
    cd_backpack: ["cd backpack", "cd backpack/"],
    ls_backpack: ["ls"],
    cat_snack: ["cat snack.txt"],
    cd_up: ["cd .."],
    final: ["cat readme.txt"]
  };
  const expected = expectedByTask[task.id] || [];
  if(expected.includes(s)) return "";
  return "Noch nicht junger Padawan, halte dich an die Einführung!";
}

function checkTutorialCommand(segment){
  if(!guidedTutorial.active) return;
  const s = String(segment||"").trim();
  const task = TUTORIAL_TASKS[guidedTutorial.taskStep];
  if(!task) return;

  let ok = false;
  if(task.id === "ls_home") ok = s === "ls";
  if(task.id === "cd_backpack") ok = (s === "cd backpack" || s === "cd backpack/");
  if(task.id === "ls_backpack") ok = s === "ls";
  if(task.id === "cat_snack") ok = (s === "cat snack.txt");
  if(task.id === "cd_up") ok = s === "cd ..";
  if(task.id === "final") ok = s === "cat readme.txt";

  if(ok){
    guidedTutorial.taskStep += 1;
    showTaskTutorialStep();
  }
}

function boot(){
  gameStarted = true;
  promptEl.textContent = promptText();
  renderLocation();
  renderObjectives();
  renderRewards();
  renderSidequestPanel();
  renderPhasePill();

  try{ renderHeaderSub(); }catch(e){}

  const ps = document.getElementById("printStatus");
  if(ps){
    if(state.flags && state.flags.system_fixed){
      ps.textContent = "✅ Druckdienste online — Zeugnisse verfügbar.";
      ps.classList.remove("warnInline");
      ps.classList.add("okInline");
    } else {
      ps.textContent = "⚠️ Wegen eines System-Glitches können aktuell keine Zeugnisse gedruckt werden.";
      ps.classList.remove("okInline");
      ps.classList.add("warnInline");
    }
  }

  if(!state.processes || !state.processes.length){
    state.processes = [
      { pid: 101, name: "terminald", cpu: 3, mem: 42 },
      { pid: 202, name: "rgbd", cpu: 99, mem: 180 },
      { pid: 303, name: "patchwatch", cpu: 5, mem: 65 },
    ];
    saveState();
  }

  if(!state.flags.booted){
    state.flags.booted = true;
    if(!state.startedAt){
      state.startedAt = now();
      state.flags.escaped = false;
    }
    saveState();
    intro();
    row("Mini-Tipp: help zeigt deine freigeschalteten Commands.", "p");
    row("Mini-Tipp 2: quests ist dein Quest-Tracker.", "p");
  }else{
    if(bootLoadSource === "Guided"){
      if(typeof guidedIntro === "function"){
        guidedIntro();
      }
      bootLoadSource = "Autosave";
      progressPhaseIfReady();
      return;
    }
    rowHtml(`<span class="p">[${escapeHtml(now())}] ${escapeHtml(bootLoadSource)} geladen. Tipp: <span class="kbd">quests</span></span>`);
    bootLoadSource = "Autosave";
    progressPhaseIfReady();
  }
}

function showStartModal(){
  const overlay = el("startOverlay");
  overlay.hidden = false;
  const autoBtn = el("startAutosave");
  autoBtn.disabled = !hasAutosave();
}

function closeStartModal(){
  el("startOverlay").hidden = true;
}

el("startNew").addEventListener("click", ()=>{
  closeStartModal();
  startNewGuidedGame();
});

el("startAutosave").addEventListener("click", ()=>{
  closeStartModal();
  if(!hasAutosave()){
    doReset(false);
  }
  bootLoadSource = "Autosave";
  boot();
});

el("startSavegame").addEventListener("click", ()=>{
  el("savegameLoad").hidden = false;
  el("savegameLoadError").textContent = "";
  el("savegamePassphrase").focus();
});

el("savegameCancel").addEventListener("click", ()=>{
  el("savegameLoad").hidden = true;
  el("savegameLoadError").textContent = "";
});

el("savegameConfirm").addEventListener("click", ()=>{
  const pass = el("savegamePassphrase").value;
  const result = loadStateFromPassphrase(pass);
  if(!result.ok){
    el("savegameLoadError").textContent = result.error;
    return;
  }
  closeStartModal();
  el("savegameLoad").hidden = true;
  bootLoadSource = "Savegame";
  boot();
});

el("run").addEventListener("click", ()=>{
  const v = cmdInput.value;
  cmdInput.value = "";
  runLine(v);
});
el("reset").addEventListener("click", ()=>doReset(true));
el("savegame").addEventListener("click", ()=>{
  const phrase = createSavePassphrase();
  row("🔐 Savegame-Passphrase erstellt. Notiere sie dir, um später an exakt dieser Stelle weiterzumachen:", "ok");
  row(phrase, "p");
});

cmdInput.addEventListener("keydown", (e)=>{
  if(e.key === "Enter"){
    const v = cmdInput.value;
    cmdInput.value = "";
    runLine(v);
    e.preventDefault();
    return;
  }
  if(e.key === "ArrowUp"){
    const i = clamp(state.historyIndex + 1, 0, state.lastCmds.length);
    state.historyIndex = i;
    cmdInput.value = state.lastCmds[i-1] || cmdInput.value;
    e.preventDefault();
    saveState();
    return;
  }
  if(e.key === "ArrowDown"){
    const i = clamp(state.historyIndex - 1, 0, state.lastCmds.length);
    state.historyIndex = i;
    cmdInput.value = state.lastCmds[i-1] || "";
    e.preventDefault();
    saveState();
    return;
  }
  if(e.key === "Tab"){
    const auto = autocomplete(cmdInput.value);
    if(auto) cmdInput.value = auto;
    e.preventDefault();
    return;
  }
});

showStartModal();

// --- UI/State Helpers (Refactor light) ---
function commitUI(opts={}){
  const o = Object.assign({ loc:true, obj:true, rewards:true, phase:true }, opts||{});
  saveState();
  try{ if(o.phase) renderPhasePill(); }catch(e){}
  try{ if(o.phase) renderHeaderSub(); }catch(e){}
  try{ if(o.loc) renderLocation(); }catch(e){}
  try{ if(o.obj) renderObjectives(); }catch(e){}
  try{ if(o.rewards) renderRewards(); }catch(e){}
  try{ if(o.rewards) renderSidequestPanel(); }catch(e){}

  try{
    const base = allowedCommands();
    return base.filter(c=>COMMAND_REGISTRY[c]);
  }catch(e){
    return [];
  }
}

function renderHeaderSub(){
  const elSub = document.getElementById("headerSub");
  if(!elSub) return;
  if(!elSub.dataset.defaultHtml){
    elSub.dataset.defaultHtml = elSub.innerHTML;
  }

  if(Number(state.phase) >= 5){
    elSub.innerHTML = [
      "Schule fertig. Ab zur Arbeit: regel dein eigenes Leben — und guck mal, ob dir Schule überhaupt was gebracht hat. 😎 ",
      "Tipp: <span class=\"kbd\">help</span> · <span class=\"kbd\">quests</span>"
    ].join("");
  }else{
    elSub.innerHTML = elSub.dataset.defaultHtml;
  }
}

function setPhase(n){
  state.phase = Math.max(1, Math.min(99, Number(n)||1));
  commitUI({ phase:true, loc:true, obj:true, rewards:true });
}

function unlockSidequestWinkelmann(){
  if(!state.sidequest) state.sidequest = { unlocked:false };
  state.sidequest.unlocked = true;
  commitUI({ rewards:true, obj:true, loc:true, phase:false });
}

function sanityCheckNPCs(){
  try{
    const roomMap = {};
    for(const [id,n] of Object.entries(NPCS)){
      if(!n || !n.name || !n.at) continue;
      const nm = (n.name||"").trim().toLowerCase();
      for(const room of n.at){
        roomMap[room] = roomMap[room] || {};
        roomMap[room][nm] = (roomMap[room][nm]||0) + 1;
      }
    }
    const dupRooms = Object.entries(roomMap)
      .filter(([room,counts])=>Object.values(counts).some(c=>c>1))
      .map(([room,counts])=>({room, dups:Object.entries(counts).filter(([k,c])=>c>1).map(([k,c])=>`${k}×${c}`)}));
    if(dupRooms.length){
      console.warn("[SchwarmShell] Duplicate NPC names in rooms:", dupRooms);
    }
  }catch(e){}

  try{
    const missing = [];
    for(const [id,n] of Object.entries(NPCS)){
      if(!n || !n.at) continue;
      for(const room of n.at){
        if(!FS || !FS[room]) missing.push({ npc:id, room });
      }
    }
    if(missing.length){
      console.warn("[SchwarmShell] Missing NPC rooms in FS (NPC will never appear there):", missing);
    }
  }catch(e){}
}

window.checkTutorialCommand = checkTutorialCommand;
window.getGuidedTutorialBlockMessage = getGuidedTutorialBlockMessage;

if(!window.__traceInterval){
  window.__traceInterval = setInterval(()=>{
    try{
      if(state.sidequest && state.sidequest.unlocked && state.netSession && state.netSession.active){
        const host = state.netSession.host;
        const k = (host==="gym-ost-core") ? "gym" : (host==="igs-edu-lab") ? "igs" : null;
        if(k){
          bumpTrace(k, 1);
          const tm = state.sidequest.traceMeter || {gym:0,igs:0};

          if((tm[k]||0) >= 100){
            if(!state.sidequest.alarm) state.sidequest.alarm = {gym:false,igs:false};
            state.sidequest.alarm[k] = true;
            state.sidequest.traces[k] = true;

            const kickedHost = state.netSession.host;
            state.netSession = { active:false, host:"", user:"", returnCwd:"" };
            state.cwd = "/superpc";

            row(`⚠️ TRACE ALARM (${kickedHost}): Du wurdest rausgekickt!`, "warn");
            row("Security-Sweep läuft… Wenn du weiter willst: logwipe (und diesmal stealth).", "warn");
          }

          saveState();
          renderRewards();
          renderSidequestPanel();
        }
      }
    }catch(e){}
  }, 1000);
}
