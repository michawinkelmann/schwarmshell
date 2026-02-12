// fs.js — virtual filesystem helpers
  function normPath(p){
    if(!p) return state.cwd;
    if(p.startsWith("~")) p = p.replace(/^~/, "/home/player");
    if(!p.startsWith("/")){
      if(state.cwd === "/") p = "/" + p;
      else p = state.cwd.replace(/\/$/,"") + "/" + p;
    }
    const parts = p.split("/").filter(x=>x.length>0);
    const out = [];
    for(const part of parts){
      if(part === ".") continue;
      if(part === "..") out.pop();
      else out.push(part);
    }
    return "/" + out.join("/");
  }
  function getNode(path){ return FS[path] || null; }
  function listDir(path){
    const node = getNode(path);
    if(!node || node.type!=="dir") return null;
    let kids = node.children.slice();

    // Story-Gating: Real-Life Bereich erscheint erst nach dem finalen Zeugnis.
    if(path === "/"){
      const unlocked = !!(state.flags && state.flags.job_arc_unlocked);
      if(!unlocked){
        kids = kids.filter(n => n !== "arbeitsamt" && n !== "real_life");
      }
    }
    return kids;
  }
  function readFile(path){
    const node = getNode(path);
    if(!node || node.type!=="file") return null;
    return node.content;
  }

  // Like readFile(), but respects "locked" files (confidential content).
  // Returns: { ok:true, content } or { ok:false, err }
  function readFileChecked(path){
    const node = getNode(path);
    if(!node || node.type!=="file") return { ok:false, err:"No such file" };

    // "locked" ist Story/Confidential-Lock (z.B. Lehrerzimmer)
    if(node.locked) return { ok:false, err:"Permission denied" };

    // Simple chmod-Read-Check (nur unter ~ relevant):
    // Wenn owner-read fehlt (mode erste Ziffer ohne 4), dann Permission denied.
    if(path.startsWith("/home/player/")){
      const p = ensurePerm(path);
      const mode = String(p.mode||"644");
      const od = parseInt(mode[0]||"6", 10);
      if(!Number.isNaN(od) && ((od & 4) === 0)){
        return { ok:false, err:"Permission denied" };
      }
    }
    return { ok:true, content: node.content };
  }
  function parentDir(path){
    const p = path.replace(/\/+[^\/]+$/,"");
    return p ? p : "/";
  }
  function writable(path){ return path.startsWith("/home/player/"); }

  function writeFile(path, content, append=false){
    if(!writable(path)) return { ok:false, err:"Permission denied (nur unter ~ erlaubt)" };
    const parent = parentDir(path);
    const base = path.split("/").pop();
    const pnode = getNode(parent);
    if(!pnode || pnode.type!=="dir") return { ok:false, err:"No such directory" };

    if(!pnode.children.includes(base)) pnode.children.push(base);
    if(!FS[path]) FS[path] = { type:"file", content:"" };

    const prev = FS[path].content ?? "";
    FS[path].content = append ? (prev + String(content)) : String(content);
    state.created.files.push(path);
    ensurePerm(path);
    saveState();
    return { ok:true };
  }
  function mkdir(path){
    if(!writable(path)) return { ok:false, err:"Permission denied (nur unter ~ erlaubt)" };
    const parent = parentDir(path);
    const base = path.split("/").pop();
    const pnode = getNode(parent);
    if(!pnode || pnode.type!=="dir") return { ok:false, err:"No such directory" };
    if(getNode(path)) return { ok:false, err:"File exists" };
    pnode.children.push(base);
    FS[path] = { type:"dir", children:[] };
    state.created.dirs.push(path);
    saveState();
    return { ok:true };
  }
  function rm(path){
    if(!writable(path)) return { ok:false, err:"Permission denied (nur unter ~ erlaubt)" };
    const node = getNode(path);
    if(!node) return { ok:false, err:"No such file or directory" };
    if(node.type==="dir" && node.children.length) return { ok:false, err:"Directory not empty" };
    const parent = parentDir(path);
    const base = path.split("/").pop();
    const pnode = getNode(parent);
    if(pnode?.type==="dir") pnode.children = pnode.children.filter(x=>x!==base);
    delete FS[path];
    delete state.perms[path];
    saveState();
    return { ok:true };
  }
  function cp(src, dst){
    const sPath = normPath(src);
    let dPath = normPath(dst);
    // Allow copying into an existing directory (like real cp)
    const dn = getNode(dPath);
    if(dn && dn.type === "dir"){
      dPath = dPath.replace(/\/$/,"") + "/" + sPath.split("/").pop();
    }
    const sn = getNode(sPath);
    if(!sn || sn.type!=="file") return { ok:false, err:"cp: source not a file" };
    const w = writeFile(dPath, sn.content, false);
    if(w.ok){
      const sp = ensurePerm(sPath);
      state.perms[dPath] = { mode: sp.mode, exec: sp.exec };
      saveState();
    }
    return w;
  }
  function mv(src, dst){
    const sPath = normPath(src);
    const dPath = normPath(dst);
    const sn = getNode(sPath);
    if(!sn) return { ok:false, err:"mv: source missing" };
    if(!writable(sPath) || !writable(dPath)) return { ok:false, err:"Permission denied (nur unter ~ erlaubt)" };
    if(sn.type!=="file") return { ok:false, err:"mv: only files supported" };
    const w = writeFile(dPath, sn.content, false);
    if(!w.ok) return w;
    state.perms[dPath] = structuredClone(ensurePerm(sPath));
    rm(sPath);
    return { ok:true };
  }

  function matchGlob(name, pattern){
    const esc = pattern.replaceAll(".", "\\.").replaceAll("+","\\+").replaceAll("?","\\?").replaceAll("^","\\^").replaceAll("$","\\$").replaceAll("{","\\{").replaceAll("}","\\}").replaceAll("(","\\(").replaceAll(")","\\)").replaceAll("[","\\[").replaceAll("]","\\]").replaceAll("|","\\|");
    const rx = new RegExp("^" + esc.replaceAll("*",".*") + "$");
    return rx.test(name);
  }
  function findPaths(start, pattern){
    const root = normPath(start);
    const startNode = getNode(root);
    if(!startNode || startNode.type!=="dir") return { ok:false, err:"find: start path not a directory" };

    const out = [];
    const stack = [root];
    while(stack.length){
      const cur = stack.pop();
      const node = getNode(cur);
      if(!node || node.type!=="dir") continue;
      for(const child of node.children){
        const full = (cur==="/" ? "" : cur) + "/" + child;
        const base = child;
        if(matchGlob(base, pattern)) out.push(full);
        const cn = getNode(full);
        if(cn?.type==="dir") stack.push(full);
      }
    }
    return { ok:true, out };
  }

  function grepLines(text, pattern, opts){
    let lines = String(text).split(/\r?\n/);
    const out = [];
    const needle = opts.i ? pattern.toLowerCase() : pattern;
    for(let i=0;i<lines.length;i++){
      const hay = opts.i ? lines[i].toLowerCase() : lines[i];
      if(hay.includes(needle)){
        out.push(opts.n ? `${i+1}:${lines[i]}` : lines[i]);
      }
    }
    return out;
  }

  const LOC = {
    "/home/player": { name:"Dein Zimmer — kurz vor der KGS", tag:"Phase 1 Start", mood:"school",
      desc:"Du packst den Rucksack, checkst Handy… und plötzlich ploppt auf deinem Laptop ein Fenster auf: „SchwarmShell Arena – Update verfügbar“. Bro, du hast das NIE installiert. Sus.",
      extra:"Start: cat readme.txt  ·  Oder: ls" },
    "/school": { name:"KGS Schwarmstedt — Flur", tag:"KGS-Level", mood:"school",
      desc:"Die Schule ist da… aber wie gerendert. Texturen zu clean, Licht zu perfekt. Das ist keine normale Montag-Mood.",
      extra:"Tutorial-Route: /school/pcraum" },
    "/school/pcraum": { name:"PC-Raum — Terminal-Dojo", tag:"Tutorial", mood:"lab",
      desc:"Tastaturen klicken wie ein E‑Sport-Finale. Ein Monitor zeigt: „IServ: GLITCH MODE“. Okay, jetzt wird’s wild.",
      // Ziele werden absichtlich NICHT dauerhaft im HUD angezeigt (zu viel Spoiler).
      extra:"" },
    "/school/mensa": { name:"Mensa — Loot & Lunch", tag:"School", mood:"school",
      desc:"Tabletts klappern, alle reden durcheinander und irgendwo kippt safe gleich Apfelschorle um. Klassische Mensa-Quest-Atmosphäre.",
      extra:"cat menu.txt  ·  cat quest.txt  ·  cat vending_hint.txt" },
    "/school/turnhalle": { name:"Turnhalle — Bewegung & Chaos", tag:"School", mood:"school",
      desc:"Schuhe quietschen auf dem Hallenboden, ein Ball fliegt random ins Aus und jemand ruft schon wieder NOCHMAL!",
      extra:"cat turnhalle.txt  ·  cat scoreboard.txt" },
    "/server_gate": { name:"Server-Gate — Boss-Tür", tag:"Phase 1 Boss", mood:"server",
      desc:"Eine ASCII-Tür blockt dich wie ein Endgegner. Oben steht: ACCESS: KEY REQUIRED. Gate ist literally ein Türsteher.",
      extra:"Tipp: cat gate.txt" },
    "/arena": { name:"SchwarmShell Arena — Quest Hub", tag:"Phase 2", mood:"arena",
      desc:"Neon. HUD. Questboard. Du hörst irgendwo einen „Battle Pass unlocked“-Sound, obwohl du garantiert nichts gekauft hast.",
      extra:"cat quests.txt  ·  talk ommen" },
    "/patchbay": { name:"Patchbay — Werkstatt", tag:"Phase 2", mood:"server",
      desc:"Ein Raum aus Ordnern. Logs schweben wie Hologramme. Das ist so nerdig, dass es wieder cool ist.",
      extra:"cat patchbay.txt" },
    "/network": { name:"Network — Logs & Hinweise", tag:"Phase 3", mood:"server",
      desc:"Hier liegen die Spuren vom Update. Logs sind basically die Gossip-Story der Technik.",
      extra:"find /network -name \"*.log\"  ·  grep -n PATCHLORD /network/logs/update.log" },
    "/boss": { name:"Boss Room — Patchlord", tag:"Phase 3 Finale", mood:"arena",
      desc:"Du stehst vor dem Patchlord. Kein Monster, kein Drache — ein Script. Und es ist trotzdem scary, weil’s echt funktioniert.",
      extra:"cat README_BOSS.txt" },
    "/school/bibliothek": { name:"Bibliothek — Lore Wiki", tag:"Lore", mood:"library",
      desc:"Leise, aber mächtig. Wie ein Wiki-Tab, der dir 3 Stunden klaut und du merkst es nicht.",
      extra:"find /school/bibliothek -name \"*.txt\"" },
    "/school/beratung": { name:"Beratung — Safe Room", tag:"Support", mood:"school",
      desc:"Hier ist weniger Neon, mehr „du darfst kurz durchatmen“. Savepoint energy.",
      extra:"talk jeske" },
    "/school/sekretariat": { name:"Sekretariat — Ticket Boss", tag:"Office", mood:"office",
      desc:"Wenn Bürokratie ein Boss wäre, dann hier. Aber fair: ohne die läuft auch nix.",
      extra:"cat ticket.txt  ·  talk harries" },
    "/school/lehrerzimmer": { name:"Lehrerzimmer — No‑Students‑Zone", tag:"Office", mood:"office",
      desc:"Eine Tür mit Schild: ‘Nur Personal’. Drinnen: Kaffeeduft, Ordnerstapel, und diese Aura von: ‘Hier wird über alles entschieden’. Du spürst sofort: Du bist hier eigentlich nicht authorized.",
      extra:"ls" },
    "/school/digitallab": { name:"DigitalLab — RGB & Build", tag:"Craft", mood:"lab",
      desc:"LEDs überall. Es fühlt sich an wie: ‘Ich sollte jetzt irgendwas bauen.’",
      extra:"talk semrau" },
    "/home/player/workbench": { name:"Workbench — Crafting Spot", tag:"Build", mood:"lab",
      desc:"Hier baust du Dateien/Ordner. Minecraft, aber mit Verzeichnissen. 🧱",
      extra:"cat README_WORKBENCH.txt" },
    "/school/hof": { name:"Schulhof — Chill Zone", tag:"IRL Vibe", mood:"yard",
      desc:"Wind, Stimmen, und ein Ball, der zu 90% gleich in den Baum fliegt. Classic.",
      extra:"cat ping.txt" },
    "/mentor_hub": { name:"Mentor Hub — Squad Lobby", tag:"Phase 4", mood:"arena",
      desc:"Du spawnst in einer Lobby wie vor einem Raid. Drei Schüler-NPCs stehen rum und sehen aus, als hätten sie gerade zum ersten Mal ein Terminal geöffnet. Zeit für Mentor-Arc.",
      extra:"cat /mentor_hub/quests.txt  ·  cat /mentor_hub/students.txt  ·  talk noah" },

    "/arbeitsamt": { name:"Arbeitsamt — Bürokratie DLC", tag:"Phase 5", mood:"office",
      desc:"Neon ist weg. Jetzt ist’s… Grau. Wartemarken. Druckergeräusche. Du hast plötzlich das Gefühl, dein Leben ist ein Formular.",
      extra:"cat /arbeitsamt/start.txt  ·  talk beamter" },
    "/real_life": { name:"Real Life — Schwarmstedt & Umgebung", tag:"Jobs", mood:"yard",
      desc:"Außerhalb der Schule. Keine Lehrer, keine Glocke — nur echte Aufgaben. Willkommen im Endgame.",
      extra:"ls  ·  cd snackmaster" },
    "/real_life/snackmaster": { name:"SNACKMASTER — Produktion", tag:"Quest", mood:"lab",
      desc:"Fabrik-Vibe. Tiefkühl, Hektik, und irgendwo piept ein Scanner, als wäre er ein Metronom.",
      extra:"cat quest.txt  ·  talk jansen" },
    "/real_life/ars_recycling": { name:"A‑R‑S — Recycling", tag:"Quest", mood:"yard",
      desc:"Container, Pläne, Listen. Alles hat seinen Platz — außer die Dateien natürlich.",
      extra:"cat quest.txt  ·  talk wiebe" },
    "/real_life/ohlendorf_technik": { name:"Ohlendorf‑Technik — Netzwerk", tag:"Quest", mood:"server",
      desc:"Kabel, Schaltschränke, und jemand flucht leise über Rechte. Klingt vertraut.",
      extra:"cat quest.txt  ·  talk neele" },
    "/real_life/berndt_moebel": { name:"Arthur Berndt — Möbelfabrik", tag:"Quest", mood:"lab",
      desc:"Holzgeruch, CNC-Sirren… und ein Prozess, der gleich alles laggy macht. Classic.",
      extra:"cat quest.txt  ·  talk tom" },
    "/real_life/cms": { name:"CMS — Handwerkerbetrieb", tag:"Quest", mood:"yard",
      desc:"Ein Betrieb mit allen Gewerken. Hier zählt: Dokumentation sauber, ohne Pfusch.",
      extra:"cat quest.txt  ·  talk holger" },
    "/school/klassenraume": { name:"Klassenräume — Flur der Jahrgänge", tag:"School", mood:"school", desc:"Hier sind die Klassenräume nach Jahrgang–Schulform–Nummer benannt (z.B. 8G1, 9R1, 7H1).", extra:"cd /school/klassenraume/8G1" },
    "/school/klassenraume/7H1": { name:"Klassenraum 7H1", tag:"Hauptschule", mood:"school", desc:"Ein ganz normaler Raum… außer dass die Tafel manchmal wie ein Game-Overlay flackert. Alle tun so als wäre das normal. Klar.", extra:"ls · cat tafel.txt · talk <id>" },
    "/school/klassenraume/7H2": { name:"Klassenraum 7H2", tag:"Hauptschule", mood:"school", desc:"Ein ganz normaler Raum… außer dass die Tafel manchmal wie ein Game-Overlay flackert. Alle tun so als wäre das normal. Klar.", extra:"ls · cat tafel.txt · talk <id>" },
    "/school/klassenraume/8G1": { name:"Klassenraum 8G1", tag:"Gymnasium", mood:"school", desc:"Ein ganz normaler Raum… außer dass die Tafel manchmal wie ein Game-Overlay flackert. Alle tun so als wäre das normal. Klar.", extra:"ls · cat tafel.txt · talk <id>" },
    "/school/klassenraume/8G2": { name:"Klassenraum 8G2", tag:"Gymnasium", mood:"school", desc:"Ein ganz normaler Raum… außer dass die Tafel manchmal wie ein Game-Overlay flackert. Alle tun so als wäre das normal. Klar.", extra:"ls · cat tafel.txt · talk <id>" },
    "/school/klassenraume/8G3": { name:"Klassenraum 8G3", tag:"Gymnasium", mood:"school", desc:"Ein ganz normaler Raum… außer dass die Tafel manchmal wie ein Game-Overlay flackert. Alle tun so als wäre das normal. Klar.", extra:"ls · cat tafel.txt · talk <id>" },
    "/school/klassenraume/9R1": { name:"Klassenraum 9R1", tag:"Realschule", mood:"school", desc:"Ein ganz normaler Raum… außer dass die Tafel manchmal wie ein Game-Overlay flackert. Alle tun so als wäre das normal. Klar.", extra:"ls · cat tafel.txt · talk <id>" },
    "/school/klassenraume/9R2": { name:"Klassenraum 9R2", tag:"Realschule", mood:"school", desc:"Ein ganz normaler Raum… außer dass die Tafel manchmal wie ein Game-Overlay flackert. Alle tun so als wäre das normal. Klar.", extra:"ls · cat tafel.txt · talk <id>" },
    "/school/klassenraume/10G1": { name:"Klassenraum 10G1", tag:"Gymnasium", mood:"school", desc:"Ein ganz normaler Raum… außer dass die Tafel manchmal wie ein Game-Overlay flackert. Alle tun so als wäre das normal. Klar.", extra:"ls · cat tafel.txt · talk <id>" },
    "/school/klassenraume/10R1": { name:"Klassenraum 10R1", tag:"Realschule", mood:"school", desc:"Ein ganz normaler Raum… außer dass die Tafel manchmal wie ein Game-Overlay flackert. Alle tun so als wäre das normal. Klar.", extra:"ls · cat tafel.txt · talk <id>" },
    "/school/klassenraume/10H1": { name:"Klassenraum 10H1", tag:"Hauptschule", mood:"school", desc:"Ein ganz normaler Raum… außer dass die Tafel manchmal wie ein Game-Overlay flackert. Alle tun so als wäre das normal. Klar.", extra:"ls · cat tafel.txt · talk <id>" },
    "/school/keller": { name:"Keller — Unter der Schule", tag:"School", mood:"school", desc:"Unten ist es kühler, leiser. Die Luft hat Serverraum-Vibe. Und irgendwo summt etwas…", extra:"cd /school/keller/winkelmann_lab" },
    "/school/keller/winkelmann_lab": { name:"Winkelmanns Keller-Lab", tag:"Secret", mood:"boss", desc:"Zauberer-Labor, aber mit Physik-Postern. Überall Kabel, Spulen, Formeln. In der Mitte: eine Maschine.", extra:"cat maschine.txt · talk winkelmann" },
    "/school/physik": { name:"Physik-Bereich", tag:"School", mood:"school", desc:"Experiment-Vibes und überall ‚Bitte nicht anfassen‘.", extra:"cd /school/physik/materialschrank" },
    "/school/medienraum": { name:"Medienraum", tag:"School", mood:"school", desc:"Beamer, Kabelsalat, Kisten. Technik im Stress.", extra:"cd /school/medienraum/beamer_kiste" },
    "/school/technikraum": { name:"Technikraum", tag:"School", mood:"school", desc:"Ersatzteile und Hausmeister-Lore.", extra:"cd /school/technikraum/ersatzteile" },

    // --- Erweiterte Räume (mehr Leben & Tiefe) ---
    "/school/veranstaltungsraum": { name:"Veranstaltungsraum — Bühne", tag:"School", mood:"school",
      desc:"Wenn die Mensa zur Halle wird: Bühne, Licht, Soundcheck. Hier riecht’s nach Kabeln und Aufregung.",
      extra:"ls · cat raum.txt · cat events.txt · talk <name>" },
    "/school/ganztag": { name:"Ganztag — Nachmittagswelt", tag:"School", mood:"school",
      desc:"Aushänge, Angebote, Zeiten. Hier entscheidet sich, ob du chillst oder skillst.",
      extra:"ls · cat angebote.txt · cat pinnwand.txt · talk <name>" },
    "/school/sv_buero": { name:"SV-Büro — Mitreden", tag:"School", mood:"school",
      desc:"Poster, Protokolle, Sticker. Hier wird Schule nicht nur ertragen, sondern mitgebaut.",
      extra:"ls · cat sv_info.txt · cat projektliste.txt · talk <name>" },
    "/school/musikraum": { name:"Musikraum — Proberaum", tag:"School", mood:"school",
      desc:"Instrumente, Notenständer, ein Drumset das immer zu laut ist. Kreativchaos in Reinform.",
      extra:"ls · cat instrumente.txt · cat setlist_krizelig.txt · talk <name>" },
    "/school/kunstraum": { name:"Kunstraum — Farbe & Ideen", tag:"School", mood:"school",
      desc:"Pinsel, Papier, Geruch nach Acryl. An der Wand: Kunst, die mehr sagt als ein Stundenplan.",
      extra:"ls · cat ausstellung.txt · cat kritzelwand.txt · talk <name>" },
    "/school/chemie": { name:"Chemie — Laborzone", tag:"School", mood:"school",
      desc:"Reagenzgläser, Sicherheitsregeln, und ein Periodensystem das wie ein Loot-Table wirkt.",
      extra:"ls · cat sicherheit.txt · cat reaktionen.txt · talk <name>" },
    "/school/biologie": { name:"Biologie — Mikroskop & Natur", tag:"School", mood:"school",
      desc:"Modelle, Präparate, Pflanzen-Lore. Hier wird aus ‚kp‘ langsam ‚aha‘.",
      extra:"ls · cat mikroskop.txt · cat pflanzen_lore.txt · talk <name>" },
  };

  const PHASE_COMMANDS = {
    1: [
      { cmd:"ls", desc:"Ordner anzeigen" },
      { cmd:"cat", desc:"Dateien lesen" },
      { cmd:"cd", desc:"Ort wechseln" },
      { cmd:"help", desc:"Freigeschaltete Commands sehen" },
    ],
    2: [
      { cmd:"grep", desc:"Texte filtern" },
      { cmd:"mkdir", desc:"Ordner anlegen" },
      { cmd:"cp", desc:"Dateien kopieren" },
      { cmd:"quests", desc:"Ziele checken" },
    ],
    3: [
      { cmd:"find", desc:"Dateien finden" },
      { cmd:"grep -n", desc:"Zeilen anzeigen" },
      { cmd:"chmod +x", desc:"Scripte ausführbar machen" },
      { cmd:"./<script>", desc:"Boss-Run starten" },
    ],
    4: [
      { cmd:"ps/top", desc:"Prozesse prüfen" },
      { cmd:"kill", desc:"Problemprozess stoppen" },
      { cmd:"history", desc:"Verlauf ansehen" },
      { cmd:"alias", desc:"Shortcuts bauen" },
    ],
    5: [
      { cmd:"cd /arbeitsamt", desc:"Real-Life Hub öffnen" },
      { cmd:"talk <name>", desc:"Gespräche starten" },
      { cmd:"cp", desc:"Dateien für Jobs sichern" },
      { cmd:"chmod", desc:"Rechte prüfen/setzen" },
    ],
  };



  function ensureMapVisited(path){
    if(!Array.isArray(state.mapVisited)) state.mapVisited = ["/home/player"];
    let changed = false;
    const add = (pp)=>{
      if(!pp || !getNode(pp) || state.mapVisited.includes(pp)) return;
      state.mapVisited.push(pp);
      changed = true;
    };
    let p = normPath(path || state.cwd || "/home/player");
    add("/");
    while(p && p !== "/"){
      add(p);
      p = parentDir(p);
    }
    add("/");
    return changed;
  }

  function renderWorldMap(){
    const mapEl = el("mapTree");
    if(!mapEl) return;

    const mapChanged = ensureMapVisited(state.cwd);
    if(mapChanged) saveState();

    const visited = new Set(state.mapVisited || []);
    const visible = new Set(["/"]);

    const markVisible = (path)=>{
      if(!path || !getNode(path)) return;
      visible.add(path);
      const par = parentDir(path);
      if(par && getNode(par)) visible.add(par);

      const parKids = listDir(par || "/") || [];
      for(const name of parKids){
        const full = (par === "/" ? "" : par) + "/" + name;
        if(getNode(full)?.type === "dir") visible.add(full);
      }

      const kids = listDir(path) || [];
      for(const name of kids){
        const full = (path === "/" ? "" : path) + "/" + name;
        if(getNode(full)?.type === "dir") visible.add(full);
      }
    };

    for(const p of visited) markVisible(p);
    markVisible(state.cwd);

    const lines = [];
    const labelFor = (path)=>{
      const isRoot = path === "/" || path === "";
      const name = isRoot ? "Schwarmstedt" : path.split("/").pop();
      const isCurrent = path === state.cwd;
      const wasVisited = visited.has(path);
      const marker = isCurrent ? "◉" : (wasVisited ? "●" : "○");

      const allKids = (listDir(path) || []).filter((n)=>{
        const full = (path === "/" ? "" : path) + "/" + n;
        return getNode(full)?.type === "dir";
      });
      const visibleKids = allKids.filter((n)=>{
        const full = (path === "/" ? "" : path) + "/" + n;
        return visible.has(full);
      });
      const hasHidden = allKids.length > visibleKids.length;

      return {
        text: `${marker} ${name}${hasHidden ? " …" : ""}`,
        isCurrent
      };
    };

    function walk(path, prefix, isLast){
      const label = labelFor(path);
      if(path !== "/"){
        lines.push({
          prefix: prefix + (isLast ? "└─ " : "├─ "),
          label
        });
      }else{
        lines.push({ prefix: "", label });
      }

      const kids = (listDir(path) || []).map((name)=>{
        const full = (path === "/" ? "" : path) + "/" + name;
        return { name, path: full, node: getNode(full) };
      }).filter((x)=>x.node?.type === "dir" && visible.has(x.path));

      kids.sort((a,b)=>a.name.localeCompare(b.name, "de"));

      const childPrefix = (path === "/") ? "" : (prefix + (isLast ? "   " : "│  "));
      kids.forEach((kid, idx)=> walk(kid.path, childPrefix, idx === kids.length - 1));
    }

    walk("/", "", true);
    mapEl.innerHTML = lines.map(({ prefix, label })=>{
      const safePrefix = escapeHtml(prefix);
      const safeLabel = escapeHtml(label.text);
      if(label.isCurrent){
        return `${safePrefix}<span class="mapCurrentEntry">${safeLabel}</span>`;
      }
      return `${safePrefix}${safeLabel}`;
    }).join("\n");
  }
  function locationPath(){
    let p = state.cwd;
    while(p.length>1 && !LOC[p]){
      p = parentDir(p);
      if(p==="") p="/";
    }
    return LOC[p] ? p : "/home/player";
  }
  function renderLocation(){
    if(state.cwd === "/school/keller/winkelmann_lab" && !state.sidequest.found_lab){
      state.sidequest.found_lab = true;
      unlockSidequestWinkelmann();
          renderHeader();
      row("⚡ Sidequest entdeckt: Das Winkelmann‑Protokoll (versteckt).", "sys");
      row("Im Halbdunkel steht Herr Dr. Winkelmann vor einer Maschine. Der Mann hat Zaubermeister-Aura. No cap.", "p");
      row("Tipp: talk winkelmann  ·  cat maschine.txt", "p");
      saveState();
    }

    const lp = locationPath();
    const loc = LOC[lp] || LOC["/home/player"];
    el("locName").textContent = loc.name;
    el("locTag").textContent = loc.tag;
    el("locDesc").textContent = loc.desc;
    const dyn = talkablesLineForRoom();
    // HUD-Extras sollen Hinweise geben, aber keine direkten Ziele spoilern.
    // Falls in Daten/Mods doch irgendwo "Ziel:" landet, wird es hier herausgefiltert.
    let extra = loc.extra || "";
    if(/\bziel\s*:|phase\s*\d+\s*ziel\b/i.test(extra)) extra = "";
    el("locExtra").textContent = dyn ? (extra ? (extra + "  ·  " + dyn) : dyn) : extra;
    el("locImg").src = svgData(loc.name, loc.tag, loc.mood);

    renderPhaseCommands();
    renderWorldMap();

    const currentRoom = state.cwd;
    const npcsHere = Object.entries(NPCS)
      .filter(([id,n])=>n.at.includes(currentRoom))
      .map(([id,n])=>`${n.name}`);
    el("locNPCs").textContent = npcsHere.length ? ("NPCs hier: " + npcsHere.join(" · ") + "  →  talk <name>") : "NPCs hier: —";
    if(npcsHere.length && !state.npcTipShown){
      row("Tipp: Hier sind NPCs. Du kannst mit ihnen reden: talk <name> 😌", "p");
      state.npcTipShown = true;
      saveState();
    }
  }

  function renderPhaseCommands(){
    const list = el("phaseCommandsList");
    const title = el("phaseCommandsTitle");
    if(!list || !title) return;

    const phase = Number(state.phase) || 1;
    const cmds = PHASE_COMMANDS[phase] || PHASE_COMMANDS[1];
    title.textContent = `Wichtige Befehle (Phase ${phase})`;

    list.innerHTML = "";
    for(const item of cmds){
      const li = document.createElement("li");
      li.innerHTML = `<span class="kbd">${escapeHtml(item.cmd)}</span>${escapeHtml(item.desc)}`;
      list.appendChild(li);
    }
  }

  

  function renderObjectives(){
    const wrap = el("objectives");
    wrap.innerHTML = "";
    const cur = state.phase;

    const keyFor = (title)=>{
      const t = String(title||"").toLowerCase();
      if(t.includes("tutorial")) return "tutorial";
      if(t.includes("keycard")) return "keycard";
      if(t.includes("server-gate")) return "gate";
      if(t.includes("fragment #1")) return "frag1";
      if(t.includes("fragment #2")) return "frag2";
      if(t.includes("fragment #3")) return "frag3";
      if(t.includes("reality")) return "assemble";
      if(t.includes("patchlord finden")) return "find";
      if(t.includes("bug")) return "bug";
      if(t.includes("script fixen") || t.includes("fixen")) return "fix";
      if(t.includes("ausführbar")) return "chmod";
      if(t.includes("bossfight")) return "boss";
      if(t.includes("noah")) return "noah";
      if(t.includes("emma")) return "emma";
      if(t.includes("leo")) return "leo";
      if(t.includes("mentor-run") || t.includes("squad geholfen")) return "mentor_clear";
      return "quest";
    };

    const list = OBJECTIVES.filter(o=>o.phase===cur);
    for(const o of list){
      const done = o.done(state);
      const key = o.key || keyFor(o.title);
      const d = document.createElement("div");
      d.className = "obj" + (done ? " done" : "");
      const dotClass = "dot" + (done ? " doneDot" : "");
      d.innerHTML = `
        <div class="${dotClass}" aria-hidden="true"></div>
        <div>
          <p class="objTitle"><strong>[${escapeHtml(key)}] ${escapeHtml(o.title)}</strong></p>
          <p class="objHint">${escapeHtml(o.hint)}</p>
        </div>`;
      wrap.appendChild(d);
    }

    // Clippy-Tooltip direkt schließen, wenn sich der aktive Quest-Status ändert.
    try{
      if(window.syncClippyTooltip) window.syncClippyTooltip();
    }catch(e){}
  }

  function renderRewards(){
    const wrap = el("rewards");
    wrap.innerHTML = "";

    // Badges
    if(!state.rewards.length){
      const d = document.createElement("div");
      d.className = "reward";
      d.style.gridColumn = "1 / -1";
      d.innerHTML = `<img alt="" src="${svgData("Noch keine Badges","Go grind!","school")}"/>
        <div><strong>Noch keine Badges</strong><span>Spiel einfach weiter — die droppen gleich.</span></div>`;
      wrap.appendChild(d);
    }
    for(const id of state.rewards){
      const r = REWARD_LIBRARY[id];
      if(!r) continue;
      const d = document.createElement("div");
      d.className = "reward";
      d.innerHTML = `<img alt="${escapeHtml(r.name)}" src="${r.img}"/>
        <div><strong>${escapeHtml(r.name)}</strong><span>${escapeHtml(r.desc)}</span></div>`;
      wrap.appendChild(d);
    }
  }

  function renderSidequestPanel(){
    const card = el("sidequestCard");
    const wrap = el("sidequestPanel");
    if(!card || !wrap) return;

    wrap.innerHTML = "";

    // Sidequest UI (erst sichtbar, wenn freigeschaltet)
    // In Phase 5 (Arbeitsamt/Real-Life) verschwindet das wieder.
    const show = !!(state.sidequest && state.sidequest.found_lab && state.sidequest.unlocked && state.phase < 5);
    card.hidden = !show;
    if(!show) return;

    const t = state.sidequest.traces || { gym:false, igs:false };
    const tm = state.sidequest.traceMeter || { gym:0, igs:0 };
    const alarm = state.sidequest.alarm || { gym:false, igs:false };

    const dot = (ok)=> `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:8px;vertical-align:middle;background:${ok?"#3bd671":"#6b7280"};"></span>`;
    const dotWarn = (ok)=> `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:8px;vertical-align:middle;background:${ok?"#3bd671":"#ef4444"};"></span>`;
    const bar = (v)=> {
      const vv = Math.max(0, Math.min(100, v||0));
      const col = (vv>=70) ? "#ef4444" : (vv>=30) ? "#f59e0b" : "#3bd671";
      return `<div style="height:10px;border-radius:999px;background:rgba(255,255,255,.08);overflow:hidden;margin:4px 0 10px 0;">
                <div style="height:100%;width:${vv}%;background:${col};"></div>
              </div>`;
    };

      // TRACE oben (bessere Sichtbarkeit)
    const traceCard = document.createElement("div");
    traceCard.className = "reward";
    traceCard.style.gridColumn = "1 / -1";
    traceCard.innerHTML = `
        <img alt="" src="${svgData("Trace","Hacknet-Style","terminal")}"/>
        <div style="width:100%">
          <strong>Trace‑Leiste (Hacknet)</strong>
          <span>Je höher, desto risky — ab 100% Kick.</span>

          <div class="small" style="margin-top:10px;line-height:1.6">
            <span class="muted">gym-ost-core (${tm.gym||0}%)</span>${alarm.gym?` <span class="muted">—</span> <span class="kbd">ALARM</span>`:""}
            ${bar(tm.gym)}
            <span class="muted">igs-edu-lab (${tm.igs||0}%)</span>${alarm.igs?` <span class="muted">—</span> <span class="kbd">ALARM</span>`:""}
            ${bar(tm.igs)}

            ${dotWarn(!(t.gym||t.igs))}Logs/Spuren <span class="muted">${(t.gym||t.igs)?"(heiß 🔴) — logwipe!":"(clean 🟢)"}</span>
          </div>

          <div class="small" style="margin-top:10px;">Tipp: In SSH → <span class="kbd">logwipe</span> säubert host‑spezifisch. Im SUPER‑PC ohne SSH ist es ein Notfall‑Global‑Clean.</div>
        </div>`;
    wrap.appendChild(traceCard);

      // WORKBENCH darunter
    const wb = document.createElement("div");
    wb.className = "reward";
    wb.style.gridColumn = "1 / -1";

    const p = state.sidequest.parts || {};
    const n = state.sidequest.net || {};
    const has = (f)=>!!FS[`/home/player/workbench/${f}`];
    const bOk = has("blueprint.dat") || !!n.blueprint;
    const sOk = has("shield.key") || !!n.shield;

    wb.innerHTML = `
        <img alt="" src="${svgData("Workbench","Artefakte & Teile","terminal")}"/>
        <div style="width:100%">
          <strong>Workbench</strong>
          <span>Artefakte & Teile (Sidequest)</span>
          <div class="small" style="margin-top:10px;line-height:1.6">
            ${dot(!!p.lens)}Photon‑Linsen‑Kern <span class="muted">${p.lens?"(gesammelt)":"(fehlt)"}</span><br/>
            ${dot(!!p.coil)}Gyro‑Spule <span class="muted">${p.coil?"(gesammelt)":"(fehlt)"}</span><br/>
            ${dot(!!p.ups)}USV‑Modul <span class="muted">${p.ups?"(gesammelt)":"(fehlt)"}</span><br/>

            <hr style="opacity:.12;margin:10px 0"/>

            ${dot(bOk)}blueprint.dat <span class="muted">${bOk?"(in ~/workbench)":"(fehlt) — scp … ~/workbench/blueprint.dat"}</span><br/>
            ${dot(sOk)}shield.key <span class="muted">${sOk?"(in ~/workbench)":"(fehlt) — scp … ~/workbench/shield.key"}</span><br/>
          </div>

          <div class="small" style="margin-top:10px;">Tipp: <span class="kbd">talk winkelmann</span> → <span class="kbd">choose 4</span> (Status).</div>
        </div>`;
    wrap.appendChild(wb);
  }

  
  function renderPhasePill(){
    const pill = document.getElementById("phasePill");
    if(!pill) return;
    let label = `Phase ${state.phase}`;
    if(state.phase===1) label += " · Tutorial";
    if(state.phase===2) label += " · Quests";
    if(state.phase===3) label += " · Bossfight";
    if(state.phase===4) label += " · Mentor";
    if(state.phase===5) label += " · Real Life";
    pill.textContent = "Phase: " + label;
  }

function shortenPromptPath(path, maxLen = 52){
    if(typeof path !== "string" || !path) return "~";
    if(path.length <= maxLen) return path;

    const isHome = path.startsWith("~");
    const prefix = isHome ? "~" : "/";
    const trimmed = isHome ? path.replace(/^~\/?/, "") : path.replace(/^\//, "");
    const parts = trimmed.split("/").filter(Boolean);

    // Sehr kurze Pfade: hinten zeigen, ohne den Start komplett zu verlieren.
    if(parts.length <= 1) return `${prefix}…${path.slice(-(maxLen - 2))}`;

    const firstSegment = parts[0];
    const tail = [];
    let used = prefix.length + 1 + firstSegment.length + 4; // "<prefix>/<first>/..."

    for(let i = parts.length - 1; i >= 1; i--){
      const seg = parts[i];
      const extra = seg.length + 1; // "/" + segment
      if(used + extra > maxLen) break;
      tail.unshift(seg);
      used += extra;
    }

    if(!tail.length){
      return `${prefix}/${firstSegment}/...`;
    }

    return `${prefix}/${firstSegment}/.../${tail.join("/")}`;
  }

function promptText(){
    const cwd = (typeof state?.cwd === "string" && state.cwd) ? state.cwd : "/home/player";
    const short = cwd.replace(/^\/home\/player/, "~");
    return `player@SchwarmShell:${shortenPromptPath(short)}$`;
  }

  
  function bumpTrace(kind, amount){
    try{
      if(!state.sidequest || !state.sidequest.unlocked) return;
      if(!state.sidequest.traceMeter) state.sidequest.traceMeter = { gym:0, igs:0 };
    if(!state.sidequest.alarm) state.sidequest.alarm = { gym:false, igs:false };
    if(!state.sidequest.winkMenu) state.sidequest.winkMenu = "main";
      state.sidequest.traceMeter[kind] = Math.min(100, (state.sidequest.traceMeter[kind]||0) + amount);
      if(state.sidequest.traceMeter[kind] >= 10) state.sidequest.traces[kind] = true;
    }catch(e){}
  }


  // --- ROOM NPC RESOLUTION (Option 1) ---
  function roomCodeFromPath(p){
    try{
      const parts = (p||"").split("/").filter(Boolean);
      return (parts[parts.length-1]||"").toLowerCase();
    }catch(e){ return ""; }
  }

  function npcsForRoomPath(p){
    const code = roomCodeFromPath(p);
    if(!code) return [];
    // Klassenräume: /school/klassenraume/<CODE>
    if(!p.startsWith("/school/klassenraume/")) return [];
    // Only accept classroom-like codes (e.g. 8g1,7h2,9r1,10g3)
    if(!/^\d{1,2}[ghr]\d{1,2}$/.test(code)) return [];
    const ids = Object.keys(NPCS);
    const needle = "_" + code;
    const matches = ids.filter(id=>{
      const low = id.toLowerCase();
      return low.includes(needle) || low.endsWith(code);
    });
    return matches;
  }

  function npcAliases(id){
    const npc = NPCS[id];
    if(!npc) return [];
    const out = new Set();
    const lowId = id.toLowerCase();

    // If teacher_*_<code>, alias is teacher last name
    if(lowId.startsWith("teacher_")){
      const mid = lowId.slice("teacher_".length);
      const last = mid.split("_")[0];
      if(last) out.add(last);
    }

    // If student s_<code>_<n>, alias is first name (lower) and full name tokens
    if(lowId.startsWith("s_")){
      const nm = (npc.name||"").toLowerCase().trim();
      if(nm){
        const toks = nm.split(/\s+/).filter(Boolean);
        if(toks[0]) out.add(toks[0]); // first name
        toks.forEach(t=> out.add(t.replace(/[^\p{L}\p{N}]/gu,"")));
      }
    }

    // Generic: use last token of name (last name) + first token
    const nm = (npc.name||"").toLowerCase().replace(/[^a-z0-9äöüß \-]/gi," ").trim();
    if(nm){
      const toks = nm.split(/\s+/).filter(Boolean);
      if(toks[0]) out.add(toks[0]);
      if(toks[toks.length-1]) out.add(toks[toks.length-1]);
    }

    // Also allow exact id
    out.add(lowId);

    return Array.from(out).filter(Boolean);
  }

  function resolveTalkTarget(input){
    const q = (input||"").toLowerCase().trim();
    if(!q) return null;
    if(NPCS[q]) return q;

    // Try current room NPCs first
    const candidates = npcsForRoomPath(state.cwd);
    if(candidates.length){
      // prioritize teacher match if multiple
      let best = null;
      for(const id of candidates){
        const aliases = npcAliases(id);
        if(aliases.includes(q)){
          if(!best) best = id;
          const npc = NPCS[id];
          if(npc && (npc.role||"").toLowerCase().includes("lehr")) return id;
        }
      }
      if(best) return best;
    }

    // Global fallback: match by alias among all NPCs (rare)
    for(const id of Object.keys(NPCS)){
      if(npcAliases(id).includes(q)) return id;
    }
    return null;
  }

  function talkablesLineForRoom(){
    const ids = npcsForRoomPath(state.cwd);
    if(!ids.length) return "";
    // show friendly talk commands (prefer teacher last name, students first name)
    const names = [];
    for(const id of ids){
      const npc = NPCS[id];
      if(!npc) continue;
      const lowId = id.toLowerCase();
      if(lowId.startsWith("teacher_")){
        const last = lowId.slice("teacher_".length).split("_")[0];
        if(last) names.push(`talk ${last}`);
      }else if(lowId.startsWith("s_")){
        const first = ((npc.name||"").trim().split(/\s+/)[0]||"").toLowerCase();
        if(first) names.push(`talk ${first}`);
      }
    }
    // de-dup and cap
    const uniq = Array.from(new Set(names)).slice(0, 8);
    if(!uniq.length) return "";
    return "Hier sind: " + uniq.join("  ·  ");
  }

// --- Command Registry (4.2) ---
