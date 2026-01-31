// main.js — boot + event wiring
  function boot(){
    promptEl.textContent = promptText();
    renderLocation();
    renderObjectives();
    renderRewards();
    renderPhasePill();

// Header-Hinweis (Zeugnis-Druck) dynamisch je nach Story-Status
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
      rowHtml(`<span class="p">[${escapeHtml(now())}] Autosave geladen. Tipp: <span class="kbd">quests</span></span>`);
      progressPhaseIfReady();
    }
  }

  el("run").addEventListener("click", ()=>{
    const v = cmdInput.value;
    cmdInput.value = "";
    runLine(v);
  });
  el("reset").addEventListener("click", ()=>doReset(true));

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

  
// --- UI/State Helpers (Refactor light) ---
function commitUI(opts={}){
  const o = Object.assign({ loc:true, obj:true, rewards:true, phase:true }, opts||{});
  saveState();
  try{ if(o.phase) renderPhasePill(); }catch(e){}
  try{ if(o.loc) renderLocation(); }catch(e){}
  try{ if(o.obj) renderObjectives(); }catch(e){}
  try{ if(o.rewards) renderRewards(); }catch(e){}

  // Return currently allowed commands (useful for debugging / tests)
  try{
    const base = allowedCommands();
    return base.filter(c=>COMMAND_REGISTRY[c]);
  }catch(e){
    return [];
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
  // Developer sanity checks (no spoilers)
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

    // Check: NPC rooms exist in the virtual filesystem
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

boot();


    // TRACE-LOOP (Hacknet): +1% pro Sekunde, solange du in SSH bist
    if(!window.__traceInterval){
      window.__traceInterval = setInterval(()=>{
        try{
          if(state.sidequest && state.sidequest.unlocked && state.netSession && state.netSession.active){
            const host = state.netSession.host;
            const k = (host==="gym-ost-core") ? "gym" : (host==="igs-edu-lab") ? "igs" : null;
            if(k){
              bumpTrace(k, 1);
              const tm = state.sidequest.traceMeter || {gym:0,igs:0};

              // TRACE ALARM: bei 100% wirst du gekickt + Alarm bleibt bis logwipe
              if((tm[k]||0) >= 100){
                if(!state.sidequest.alarm) state.sidequest.alarm = {gym:false,igs:false};
                state.sidequest.alarm[k] = true;
                state.sidequest.traces[k] = true;

                const kickedHost = state.netSession.host;
                state.netSession = { active:false, host:"", user:"", returnCwd:"" };
                // zurück in SUPER-PC root
                state.cwd = "/superpc";

                row(`⚠️ TRACE ALARM (${kickedHost}): Du wurdest rausgekickt!`, "warn");
                row(`Security-Sweep läuft… Wenn du weiter willst: logwipe (und diesmal stealth).`, "warn");
              }

              saveState();
              renderRewards();
            }
          }
        }catch(e){}
      }, 1000);
    }

