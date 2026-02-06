// commands.js — command registry + implementation
const COMMAND_REGISTRY = {
  "alias": { group: "Core", desc: "Alias setzen", usage: "alias ll=\"ls -l\"", example: "alias ll=\"ls -l\"" },
  "assemble": { group: "Mentor", desc: "(Mentor) Assembly-Aufgabe", usage: "assemble", example: "assemble" },
  "bash": { group: "Mentor", desc: "Mini-Shell/Script", usage: "bash", example: "bash" },
  "cat": { group: "Text", desc: "liest Datei", usage: "cat <file>", example: "cat readme.txt" },
  "cd": { group: "Files", desc: "wechselt Ordner", usage: "cd <path>", example: "cd /school" },
  "chmod": { group: "Files", desc: "Rechte ändern", usage: "chmod +x <file> | chmod <mode> <file>", example: "chmod +x ~/workbench/patchlord.sh" },
  "choose": { group: "Game", desc: "Auswahl im Dialog", usage: "choose <nr>", example: "choose 3" },
  "clear": { group: "Core", desc: "Terminal leeren", usage: "clear", example: "clear" },
  "connect": { group: "Sidequest", desc: "(Sidequest) SUPER-PC verbinden", usage: "connect superpc", example: "connect superpc" },
  "cp": { group: "Files", desc: "kopieren", usage: "cp <src> <dst>", example: "cp /boss/patchlord.sh ~/workbench/" },
  "echo": { group: "Text", desc: "Text ausgeben", usage: "echo \"<text>\" [> file] [>> file]", example: "echo \"hi\"" },
  "exit": { group: "Sidequest", desc: "Ebene verlassen", usage: "exit", example: "exit" },
  "find": { group: "Text", desc: "findet Dateien", usage: "find <path> -name \"<pattern>\"", example: "find / -name \"*.log\"" },
  "grep": { group: "Text", desc: "sucht Textmuster", usage: "grep <pattern> <file>", example: "grep glitch iserv.log" },
  "help": { group: "Core", desc: "zeigt verfügbare Befehle (oder help - <questkey>)", usage: "help | help - <questkey>", example: "help - tutorial" },
  "hint": { group: "Core", desc: "gibt einen Tipp zur aktuellen Quest", usage: "hint", example: "hint" },
  "history": { group: "Core", desc: "Verlauf anzeigen", usage: "history", example: "history" },
  "inventory": { group: "Game", desc: "Inventar anzeigen", usage: "inventory", example: "inventory" },
  "kill": { group: "Mentor", desc: "Prozess beenden", usage: "kill <pid>", example: "kill 1337" },
  "logwipe": { group: "Sidequest", desc: "(Sidequest) Spuren löschen", usage: "logwipe", example: "logwipe" },
  "ls": { group: "Files", desc: "listet Inhalte", usage: "ls", example: "ls" },
  "man": { group: "Core", desc: "zeigt Doku zu einem Command (Beschreibung + Beispiel)", usage: "man <cmd>", example: "man grep" },
  "mentor_clear": { group: "Mentor", desc: "(Mentor) Mentor-Cache löschen", usage: "mentor_clear", example: "mentor_clear" },
  "mkdir": { group: "Files", desc: "Ordner erstellen", usage: "mkdir <name>", example: "mkdir ~/workbench/patches" },
  "mv": { group: "Files", desc: "verschieben", usage: "mv <src> <dst>", example: "mv a.txt b.txt" },
  "netmap": { group: "Sidequest", desc: "(Sidequest) Netzwerkübersicht", usage: "netmap", example: "netmap" },
  "ping": { group: "Sidequest", desc: "(Sidequest) Host prüfen", usage: "ping <host>", example: "ping gym-ost-core" },
  "ps": { group: "Mentor", desc: "Prozesse", usage: "ps", example: "ps" },
  "pwd": { group: "Files", desc: "zeigt aktuellen Pfad", usage: "pwd", example: "pwd" },
  "quests": { group: "Core", desc: "zeigt Ziele der aktuellen Phase", usage: "quests", example: "quests" },
  "reset": { group: "Core", desc: "hard reboot", usage: "reset", example: "reset" },
  "rm": { group: "Files", desc: "löschen", usage: "rm <path>", example: "rm old.txt" },
  "scp": { group: "Sidequest", desc: "(Sidequest) Datei kopieren", usage: "scp <remote_file> <local_path>", example: "scp blueprint.dat ~/workbench/" },
  "ssh": { group: "Sidequest", desc: "(Sidequest) einloggen", usage: "ssh <host>", example: "ssh igs-edu-lab" },
  "talk": { group: "Game", desc: "mit NPCs sprechen", usage: "talk <name>", example: "talk winkelmann" },
  "top": { group: "Mentor", desc: "Live-Übersicht", usage: "top", example: "top" },
  "touch": { group: "Files", desc: "Datei erstellen", usage: "touch <file>", example: "touch ~/workbench/patches/frag2.txt" },
  "unlock": { group: "Game", desc: "Code/Schlüssel verwenden", usage: "unlock <code>", example: "unlock CODE-123" },
};

// Ausführlichere "man"-Texte (Beschreibung + Namensherkunft)
// Hinweis: Nicht jedes Tool ist 1:1 wie in echter Bash implementiert – aber die Idee bleibt dieselbe.
const MANUALS = {
  man: `WAS ES MACHT
  man zeigt dir eine Kurzanleitung zu einem Befehl: wofür er da ist, wie die Syntax aussieht
  und ein Beispiel. In diesem Spiel sind die man-Seiten extra "lernfreundlich" geschrieben.

NAMENSGEBUNG
  "man" ist die Abkürzung von "manual" (Handbuch). Auf echten Linux-Systemen ist man
  der Klassiker, um Hilfe zu finden, ohne das Internet zu brauchen.
`,

  help: `WAS ES MACHT
  help listet die Befehle auf, die in deiner aktuellen Phase freigeschaltet sind.
  Mit "help - <questkey>" bekommst du außerdem kontextbezogene Tipps zu einer Quest.

NAMENSGEBUNG
  "help" ist einfach Englisch für "Hilfe". In vielen Programmen ist help der Standard-
  Befehl, um eine Kurzbeschreibung zu bekommen.
`,

  hint: `WAS ES MACHT
  hint gibt dir einen kleinen Schubs zur aktuellen Aufgabe: Was ist der nächste Schritt,
  ohne dir direkt die Lösung zu spoilern.

NAMENSGEBUNG
  "hint" heißt auf Englisch "Hinweis". In Games sind Hints oft die "Ich-häng-fest"-Taste.
`,

  ls: `WAS ES MACHT
  ls zeigt dir, was in einem Ordner liegt (Dateien und Unterordner).
  Mit "ls -l" siehst du eine längere Ansicht (wie in Linux), z.B. ob etwas ein Ordner ist.

NAMENSGEBUNG
  "ls" ist kurz für "list" (auflisten). Unix mag kurze Befehle: schnell zu tippen,
  auch wenn man müde ist oder gerade panisch im Lehrerzimmer steht.
`,

  cd: `WAS ES MACHT
  cd ändert deinen aktuellen Ordner. Danach beziehen sich relative Pfade auf diesen Ort.
  Beispiele: "cd .." geht einen Ordner hoch, "cd /" geht zur Wurzel.

NAMENSGEBUNG
  "cd" steht für "change directory" (Ordner wechseln). Directory ist das englische Wort
  für Verzeichnis/Ordner.
`,

  pwd: `WAS ES MACHT
  pwd zeigt dir, wo du gerade bist – als vollständigen Pfad.
  Wenn du dich verlaufen hast: pwd ist deine "Wo bin ich?!"-Lampe.

NAMENSGEBUNG
  "pwd" steht für "print working directory" – also: "zeige den Arbeitsordner".
  "print" heißt hier nicht drucken, sondern im Terminal ausgeben.
`,

  cat: `WAS ES MACHT
  cat gibt den Inhalt einer Datei im Terminal aus.
  In echter Bash kann cat auch Dateien "zusammenkleben" (mehrere Dateien hintereinander ausgeben).
  Hier nutzt du es vor allem zum Lesen von Texten und Logs.

NAMENSGEBUNG
  "cat" kommt von "concatenate" (aneinanderhängen). Dass es wie "Katze" klingt,
  ist ein Bonus und hat viele Memes produziert.
`,

  echo: `WAS ES MACHT
  echo schreibt Text ins Terminal. Mit ">" oder ">>" kannst du Text auch in Dateien schreiben:
    echo "hi" > file.txt     (überschreibt)
    echo "nochmal" >> file.txt (hängt an)

NAMENSGEBUNG
  "echo" ist ein Echo: du rufst etwas, und es kommt wieder zurück – nur eben als Ausgabe.
`,

  clear: `WAS ES MACHT
  clear "wischt" dein Terminal sauber, damit du wieder Übersicht hast.
  Deine Daten sind nicht weg – nur der Bildschirm wird geleert.

NAMENSGEBUNG
  "clear" heißt auf Englisch "klar/sauber machen". Genau das passiert.
`,

  grep: `WAS ES MACHT
  grep sucht in Text nach einem Muster (Pattern). Super für Logs.
  In diesem Spiel: grep <pattern> <file>.
  Pro-Tipp: grep -n zeigt Zeilennummern, grep -i ignoriert Groß/Kleinschreibung.

NAMENSGEBUNG
  "grep" stammt historisch aus einem alten Editor-Befehl (ed): "g/re/p" =
  "global" suchen, "regular expression" anwenden, "print" ausgeben.
  Nerdig, aber ikonisch.
`,

  find: `WAS ES MACHT
  find durchsucht Ordner nach Dateien, die zu einem Muster passen.
  Beispiel: find / -name "*.log" findet alle .log-Dateien ab der Wurzel.
  In echten Systemen kann find noch viel mehr (z.B. nach Datum, Größe, Owner...).

NAMENSGEBUNG
  "find" ist Englisch für "finden". Selten war ein Befehl so ehrlich.
`,

  mkdir: `WAS ES MACHT
  mkdir erstellt einen neuen Ordner.
  Denk an einen neuen "Container" für Dateien: mkdir patches legt z.B. einen Ordner "patches" an.

NAMENSGEBUNG
  "mkdir" ist die Abkürzung von "make directory" (Ordner machen).
`,

  touch: `WAS ES MACHT
  touch erstellt eine leere Datei, wenn sie noch nicht existiert.
  In echten Unix-Systemen aktualisiert touch außerdem den Zeitstempel einer Datei.
  (So nach dem Motto: "Ich hab die Datei kurz angefasst".)

NAMENSGEBUNG
  "touch" heißt "berühren". Du fasst die Datei an – und sie gilt als "aktuell".
`,

  rm: `WAS ES MACHT
  rm löscht Dateien (und je nach System auch Ordner).
  Vorsicht: In echter Bash gibt es keinen Papierkorb – rm ist eher "weg ist weg".
  Im Spiel ist rm sicherer, aber immer noch: denk kurz nach.

NAMENSGEBUNG
  "rm" steht für "remove" (entfernen).
`,

  cp: `WAS ES MACHT
  cp kopiert Dateien oder Ordner von A nach B.
  Beispiel: cp a.txt b.txt kopiert a.txt nach b.txt.

NAMENSGEBUNG
  "cp" ist kurz für "copy" (kopieren).
`,

  mv: `WAS ES MACHT
  mv verschiebt oder benennt um.
  Beispiel: mv alt.txt neu.txt ist ein Umbenennen.
  Beispiel: mv file.txt /school/ macht ein Verschieben.

NAMENSGEBUNG
  "mv" steht für "move" (bewegen/verschieben).
`,

  chmod: `WAS ES MACHT
  chmod ändert Dateirechte. In diesem Spiel ist das vor allem wichtig, um Scripts ausführbar zu machen:
    chmod +x script.sh
    ./script.sh
  In echter Bash gibt es außerdem Zahlenmodi (z.B. 755), das ist hier nur teilweise simuliert.

NAMENSGEBUNG
  "chmod" heißt "change mode". Der "Mode" ist die Rechte-Einstellung einer Datei.
`,

  history: `WAS ES MACHT
  history zeigt dir deine letzten Befehle.
  Praktisch, wenn du etwas wiederholen willst oder wissen möchtest, was du gerade getan hast.

NAMENSGEBUNG
  "history" bedeutet "Verlauf/Geschichte". Dein Terminal erzählt dir, was passiert ist.
`,

  alias: `WAS ES MACHT
  alias erstellt einen Kurznamen für einen längeren Befehl.
  Beispiel: alias ll="ls -l" und danach reicht "ll".
  (In echten Shells kann man damit sehr viel Komfort bauen.)

NAMENSGEBUNG
  "alias" ist ein "Spitzname". Du gibst einem Befehl einen zweiten Namen.
`,

  ps: `WAS ES MACHT
  ps listet laufende Prozesse auf (Programme, die gerade aktiv sind).
  Das ist wichtig, wenn du verstehen willst, was im Hintergrund arbeitet.

NAMENSGEBUNG
  "ps" ist historisch kurz für "process status" (Prozess-Status).
`,

  top: `WAS ES MACHT
  top zeigt eine Live-Übersicht über Prozesse – wer zieht gerade Leistung/Ressourcen.
  Stell dir das wie ein "Task-Manager" im Terminal vor.

NAMENSGEBUNG
  "top" wie "Top-Liste": oben stehen die Prozesse, die am meisten Ressourcen ziehen.
`,

  kill: `WAS ES MACHT
  kill beendet einen Prozess per ID (pid).
  In echten Systemen kann kill auch "Signale" schicken (z.B. freundlich beenden vs. hart stoppen).
  Hier geht’s vor allem ums Stoppen.

NAMENSGEBUNG
  "kill" heißt wörtlich "töten" – dramatisch, aber gemeint ist: Prozess beenden.
`,

  reset: `WAS ES MACHT
  reset startet das Spiel/Terminal neu (Hard Reboot). Wenn du komplett feststeckst,
  ist reset der Not-Aus. Achtung: Fortschritt kann dabei verloren gehen.

NAMENSGEBUNG
  "reset" heißt "zurücksetzen" – zurück auf Anfangszustand.
`,

  quests: `WAS ES MACHT
  quests zeigt dir deine aktuellen Ziele (Quests) – was in dieser Phase offen ist.

NAMENSGEBUNG
  "quest" kommt aus Rollenspielen und bedeutet "Aufgabe/Abenteuer".
`,

  inventory: `WAS ES MACHT
  inventory zeigt dir, was du eingesammelt hast (Items, Codes, Schlüssel).
  Wenn du denkst "wo war nochmal die Keycard?" → inventory.

NAMENSGEBUNG
  "inventory" ist das englische Wort für "Inventar".
`,

  unlock: `WAS ES MACHT
  unlock verwendet einen Code oder ein Item, um etwas freizuschalten (Tür, Gate, Zugang).
  Wenn ein Bereich "locked" ist, probier unlock <code>.

NAMENSGEBUNG
  "unlock" heißt "aufschließen/freischalten". Genau das macht es.
`,

  talk: `WAS ES MACHT
  talk startet Dialoge mit NPCs. Manche geben Hinweise, manche Quests, manche… schicken dich weg.
  Tipp: Oft klappt der Nachname als Shortcut (z.B. talk remmers).

NAMENSGEBUNG
  "talk" ist Englisch für "reden". Kurz, klar, RPG-Vibes.
`,

  bash: `WAS ES MACHT
  bash ist die Shell, die in vielen Linux-Systemen Standard ist.
  In diesem Spiel ist "bash" eher ein Lern-/Mentor-Tool: kleine Script- oder Shell-Momente.

NAMENSGEBUNG
  "bash" ist ein Wortspiel: "Bourne Again SHell" (eine Weiterentwicklung der Bourne-Shell).
`,

  assemble: `WAS ES MACHT
  assemble ist ein Spielbefehl: du setzt gefundene Fragmente zu etwas Größerem zusammen.
  Kein klassischer Bash-Befehl, aber passend für die Story.

NAMENSGEBUNG
  "assemble" heißt "zusammensetzen" (wie Lego – nur mit Daten).
`,

  mentor_clear: `WAS ES MACHT
  mentor_clear leert den "Mentor-Cache". Das ist Story/Gameplay: manchmal hängen Hinweise,
  und ein Cache-Reset kann helfen.

NAMENSGEBUNG
  "clear" = leeren. "mentor" = Mentor-System im Spiel.
`,

  // Sidequest-Tools
  ping: `WAS ES MACHT
  ping prüft, ob ein Host/Computer erreichbar ist.
  In echten Netzen schickt ping kleine Testpakete und misst die Antwortzeit.

NAMENSGEBUNG
  Wie ein Sonar "ping": du sendest ein Signal und hörst, ob etwas zurückkommt.
`,

  ssh: `WAS ES MACHT
  ssh verbindet dich mit einem entfernten Rechner (Remote Login) – sicher verschlüsselt.
  Im Spiel: Teil der Winkelmann-/Netzwerk-Sidequest.

NAMENSGEBUNG
  "ssh" steht für "Secure Shell" (sichere Shell).
`,

  scp: `WAS ES MACHT
  scp kopiert Dateien über eine SSH-Verbindung.
  Im Spiel: du holst Daten von einem Remote-System in deinen lokalen Pfad.

NAMENSGEBUNG
  "scp" bedeutet "secure copy" – kopieren, aber (über SSH) sicher.
`,

  netmap: `WAS ES MACHT
  netmap zeigt eine Übersicht über das "Netz" in der Sidequest. Denk: Karte statt Rätsel.

NAMENSGEBUNG
  "net" = network, "map" = Karte. Also: Netzwerk-Karte.
`,

  logwipe: `WAS ES MACHT
  logwipe löscht/verwässert Spuren in Logs (nur im Sidequest-Kontext!).
  In echten Systemen ist das hochsensibel – hier ist es Story, nicht Anleitung für Mist.

NAMENSGEBUNG
  "log" = Logdatei, "wipe" = wegwischen.
`,

  connect: `WAS ES MACHT
  connect baut eine Verbindung zum SUPER-PC in der Sidequest auf.
  Danach werden Netzwerk-Befehle freigeschaltet.

NAMENSGEBUNG
  "connect" heißt "verbinden". Simple.
`,

  choose: `WAS ES MACHT
  choose wählt eine Option in einem Dialog aus.
  Wenn dir jemand (z.B. Winkelmann) Optionen 1..3 gibt, nimmst du mit choose 2 die zweite.

NAMENSGEBUNG
  "choose" = auswählen.
`,

  exit: `WAS ES MACHT
  exit beendet eine spezielle Ebene/Ansicht (z.B. Sidequest-Modus) und bringt dich zurück.

NAMENSGEBUNG
  "exit" ist der klassische "raus hier"-Befehl: Programm verlassen.
`,
};

function allowedCommands(){
    let base = [];
    if(state.phase === 1){
      base = ["help","hint","ls","cd","pwd","cat","clear","echo","unlock","talk","quests","inventory","reset","man"];
    } else if(state.phase === 2){
      base = ["help","hint","ls","cd","pwd","cat","clear","echo","grep","mkdir","touch","rm","cp","mv","talk","quests","inventory","reset","man","find"];
    } else if(state.phase === 3){
      base = ["help","hint","ls","cd","pwd","cat","clear","echo","grep","mkdir","touch","rm","cp","mv","find","talk","quests","inventory","reset","man","chmod"];
    } else if(state.phase === 4){
      base = ["help","hint","ls","cd","pwd","cat","clear","echo","grep","mkdir","touch","rm","cp","mv","find","talk","quests","inventory","reset","man","chmod","ps","top","kill","history","alias","mentor_clear"];
    } else if(state.phase >= 5){
      // Phase 5: Alles aus 1–4 ist freigeschaltet (Real Life).
      base = ["help","hint","ls","cd","pwd","cat","clear","echo","grep","mkdir","touch","rm","cp","mv","find","talk","quests","inventory","reset","man","chmod","ps","top","kill","history","alias","mentor_clear"];
    }

    // "assemble" is only meaningful after all fragments are collected
    if(state.flags && state.flags.frag1 && state.flags.frag2 && state.flags.frag3){
      if(!base.includes("assemble")) base.push("assemble");
    }


    if(state.sidequest && state.sidequest.unlocked){
      base.push("connect","choose");
      if(state.superpc && state.superpc.active){
        base.push("ping","ssh","scp","logwipe","netmap","exit");
      }
    }
    return Array.from(new Set(base));
  }

  // Mentor-Arc: Nach 3/3 geholfenen Schüler*innen taucht ein extra Prozess auf,
  // der als "Abschluss-Schalter" dient. Wird dieser Prozess gekillt, ist mentor_clear erfüllt.
  function ensureQuestAktivProcess(){
    if(state.phase < 4) return;
    const helped = (state.mentor && state.mentor.students_helped) ? state.mentor.students_helped : 0;
    const cleared = !!(state.mentor && state.mentor.clear_done);
    if(helped < 3 || cleared) return;
    state.processes = state.processes || [];
    const has = state.processes.some(p => p && p.name === "quest_aktiv");
    if(!has){
      state.processes.push({ pid: 67, name: "quest_aktiv", cpu: 1, mem: 8 });
      saveState();
    }
  }


  function autocomplete(partial){
    if(!partial) return null;
    if(partial.includes("|")) return null;
    const cmds = allowedCommands();
    const tokens = partial.trim().split(/\s+/);
    if(tokens.length === 1){
      const cand = cmds.filter(c=>c.startsWith(tokens[0]));
      return cand.length===1 ? cand[0] : null;
    }else{
      const cmd = tokens[0];
      const arg = tokens.slice(1).join(" ");
      const base = arg.includes("/") ? arg.replace(/\/+[^\/]*$/,"") : "";
      const prefix = arg.includes("/") ? arg.split("/").pop() : arg;
      const dirPath = normPath(base || ".");
      const children = listDir(dirPath);
      if(!children) return null;
      const cand = children.filter(name=>name.startsWith(prefix));
      if(cand.length===1){
        const suffix = cand[0];
        const joined = (base ? base.replace(/\/$/,"") + "/" : "") + suffix;
        return `${cmd} ${joined}`;
      }
      return null;
    }
  }

  function stripQuotes(s){
    s = String(s).trim();
    if((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) return s.slice(1,-1);
    return s;
  }

  function parseEchoRedir(line){
    const m = line.match(/^echo\s+(.+?)\s*(>>|>)\s*(.+)$/);
    if(!m) return null;
    return { text: m[1], op: m[2], file: m[3].trim() };
  }

  function parseGrep(args){
    let n=false, i=false;
    const rest = [];
    for(const a of args){
      if(a === "-n") n=true;
      else if(a === "-i") i=true;
      else rest.push(a);
    }
    if(!rest.length) return { err:"grep: missing pattern" };
    const pattern = rest[0];
    const file = rest[1] || null;
    return { n,i,pattern,file };
  }

  function parseFind(args){
    if(args.length < 3) return { err:"find: usage: find <path> -name <pattern>" };
    const start = args[0];
    if(args[1] !== "-name") return { err:"find: only supports -name in this game" };
    const pattern = args.slice(2).join(" ");
    return { start, pattern: stripQuotes(pattern) };
  }

  function grepTrigger(pattern, outText){
    // FRAG1 quest: accept both the exact tag and broader searches like TOKEN/token.
    // We only mark progress when the output looks like it comes from frag_1.log context.
    const p = String(pattern || "").toLowerCase();
    const o = String(outText || "").toLowerCase();
    const frag1Hit = (
      (p === "frag1_token" || p === "token") &&
      (o.includes("frag1_token=") || o.includes("hid the token") || o.includes("token in plain sight"))
    );
    if(state.phase >= 2 && frag1Hit){
      if(!state.flags.frag1){
        state.flags.frag1 = true;
        state.fragments.f1 = "PIXEL-SPAWN-42";
        award("badge_grep");
        row("FRAG1 gesnackt ✅ (PIXEL-SPAWN-42)", "ok");
      }
    }
    const frag3Pattern = String(pattern || "").toLowerCase();
    const frag3Output = String(outText || "").toLowerCase();
    if(state.phase >= 2 && frag3Pattern === "signal" && frag3Output.includes("frag3=")){
      if(!state.flags.frag3){
        state.flags.frag3 = true;
        state.fragments.f3 = "NEON-PIPE-7";
        award("badge_pipe");
        row("FRAG3 geklärt ✅ (NEON-PIPE-7)", "ok");
      }
    }
    if(state.phase >= 3 && pattern === "BUG" && outText.match(/^\s*\d+:/m)){
      state.flags.inspected_boss = true;
    }

    // Phase 5 — Job Quest: SNACKMASTER (Marker muss im Output auftauchen)
    if(state.phase >= 5){
      const pp = String(pattern||"").toLowerCase();
      const oo = String(outText||"").toLowerCase();
      if(pp.includes("allergene") && oo.includes("ok:job_snackmaster")){
        if(!state.jobArc) state.jobArc = { active:true, stage:0, quests:{ snackmaster:false, ars:false, ohlendorf:false, berndt:false, cms:false } };
        state.jobArc.active = true;
        state.jobArc.quests = state.jobArc.quests || {};
        state.jobArc.quests.snackmaster = true;
      }
    }
    saveState();
    renderObjectives();
  }

  function progressPhaseIfReady(){
    if(state.phase === 1 && state.flags.opened_gate){
      state.phase = 2;
      state.cwd = "/arena";
      award("badge_tutorial");
      saveState();
      promptEl.textContent = promptText();
      renderLocation();
      renderObjectives();
      renderPhasePill();
      row("✨ Phase 2 unlocked. Arena-Zeit. HUD ist da. Reality ist kurz AFK.", "ok");
      row("Pro-Move: cat /arena/quests.txt", "p");
    }
    if(state.phase === 2 && state.flags.reality_patch){
      state.phase = 3;
      state.cwd = "/network";
      award("badge_patch");
      saveState();
      promptEl.textContent = promptText();
      renderLocation();
      renderObjectives();
      renderPhasePill();
      row("🔥 Phase 3 unlocked. Reality-Patch hat’s fast geschafft… aber PATCHLORD lebt noch.", "warn");
      row("Check die Logs: find /network -name \"*.log\"  (und dann grep -n PATCHLORD …)", "p");
    }
    if(state.phase === 3 && state.flags.escaped && state.flags.report_followup){
      state.phase = 4;
      state.cwd = "/mentor_hub";
      award("badge_mentor");
      saveState();
      promptEl.textContent = promptText();
      renderLocation();
      renderObjectives();
      renderPhasePill();
      row("🧑‍🤝‍🧑 Phase 4 unlocked. Mentor-Arc gestartet: Du bist jetzt der Shell-Coach.", "ok");
      row("Check: cat /mentor_hub/quests.txt  und dann talk noah", "p");
    }

  }

  function runScript(path, argv){
    const p = normPath(path);
    const node = getNode(p);
    if(!node || node.type!=="file") return { ok:false, out:"bash: file not found" };
    const perms = ensurePerm(p);
    const isWork = p.startsWith("/home/player/workbench/");
    if(!isWork) return { ok:false, out:"Boss-Regeln: Script muss in ~/workbench liegen. (cp zuerst)" };

    if(!perms.exec){
      return { ok:false, out:"Permission denied: Script ist nicht executable. (chmod +x ...)" };
    }

    const content = node.content || "";
    // Hotfix: akzeptiere sowohl eine rohe Marker-Zeile als auch eine echo-Zeile.
    // - PATCH_APPLIED
    // - echo "PATCH_APPLIED"
    const hasPatchLine = /(^|\n)\s*(PATCH_APPLIED|echo\s+(["'])?PATCH_APPLIED\3)\s*(\n|$)/.test(content);
    if(!hasPatchLine){
      return { ok:true, out:`Patchlord lacht: "Bro, wo ist PATCH_APPLIED ?"
(du musst PATCH_APPLIED oder echo "PATCH_APPLIED" ins Script hängen)` };
    }

    const [a,b,c] = argv;
    const need = [state.fragments.f1, state.fragments.f2, state.fragments.f3];
    if(!need[0] || !need[1] || !need[2]){
      return { ok:true, out:"[OK] Artefakt gesichert in ~/workbench/\n" + "Du hast noch nicht alle Fragmente. (inventory / quests)" };
    }
    if(a === need[0] && b === need[1] && c === need[2]){
      state.flags.escaped = true;
      state.flags.system_fixed = true;
      // Zurück in die Schule teleportieren (nach dem Bossfight)
      state.cwd = "/school";
      // Zeugnis-Druckdienste wieder online (Text in der Datei aktualisieren)
      try{
        const z = getNode("/school/sekretariat/zeugnis.txt");
        if(z && z.type==="file"){
          z.content = `ZEUGNIS-DRUCK (Status):
✅ Online — Dienste wieder verfügbar

Hinweis:
Hol dein Zeugnis im Sekretariat ab:
talk harries  /  talk pietsch`;
        }
      }catch(e){}

      award("badge_boss");
      saveState();
      renderObjectives();
      return { ok:true, out:`PATCH_APPLIED
WEAKNESS FOUND
Patchlord: *8-bit death sound* 🔊

GG. Der Game-Layer klappt zu.
*Teleport…* 🌀
Du landest wieder in der echten KGS.
(Und ja, du hast gerade Bash gelernt. Ohne es zu merken. W.)

✅ Systemstatus: STABIL
📄 Zeugnis-Update: Druckdienste laufen wieder.

QUEST UPDATE:
→ Geh ins Sekretariat und hol dein Zeugnis ab: talk harries / talk pietsch` };
    }
    return { ok:true, out:"NOPE. Tokens falsch. Tip: inventory zeigt deine Fragmente." };
  }

  function applyCheat1337(){
    row(`${promptText()} 1337`, "p");
    row("🎮 Cheatcode 1337 aktiviert: Teleport ans Ende von Phase 4.", "ok");

    state.phase = 4;
    state.cwd = "/school/sekretariat";

    state.flags = Object.assign({}, state.flags, {
      introSeen: true,
      iserv_glitch: true,
      got_key: true,
      opened_gate: true,
      frag1: true,
      frag2: true,
      frag3: true,
      reality_patch: true,
      found_boss: true,
      inspected_boss: true,
      fixed_script: true,
      exec_script: true,
      escaped: true,
      system_fixed: true,
      report_given: true,
      report_followup: true,
      report_final: false
    });

    state.fragments = {
      f1: state.fragments?.f1 || "PIXEL-SPAWN-42",
      f2: state.fragments?.f2 || "CRAFTED-DIR-99",
      f3: state.fragments?.f3 || "NEON-PIPE-7"
    };

    state.mentor = Object.assign({}, state.mentor, {
      lag_fixed: true,
      history_checked: true,
      alias_made: true,
      students_helped: 3,
      clear_done: true
    });

    if(!state.sidequest) state.sidequest = {};
    state.sidequest = Object.assign({}, state.sidequest, {
      unlocked: true,
      stage: 6,
      found_lab: true,
      parts: { lens: true, coil: true, ups: true },
      net: { blueprint: true, shield: true },
      traces: { gym: false, igs: false },
      traceMeter: { gym: 0, igs: 0 },
      badge: true
    });

    if(!state.badges) state.badges = [];
    if(!state.badges.includes("Physica potestas est")) state.badges.push("Physica potestas est");

    state.processes = [
      { pid: 101, name: "terminald", cpu: 3, mem: 42 },
      { pid: 202, name: "rgbd", cpu: 99, mem: 180 },
      { pid: 303, name: "patchwatch", cpu: 5, mem: 65 },
    ];

    try{
      const z = getNode("/school/sekretariat/zeugnis.txt");
      if(z && z.type==="file"){
        z.content = `ZEUGNIS-DRUCK (Status):
✅ Online — Dienste wieder verfügbar

Hinweis:
Hol dein Zeugnis im Sekretariat ab:
talk harries  /  talk pietsch`;
      }
      const score = getNode("/mentor_hub/arena2/score.txt");
      if(score && score.type==="file"){
        score.content = score.content
          .replace("geholfene Leute: 0/3", "geholfene Leute: 3/3")
          .replace("geholfene Leute: 1/3", "geholfene Leute: 3/3")
          .replace("geholfene Leute: 2/3", "geholfene Leute: 3/3");
      }
    }catch(e){}

    award("badge_patch");
    award("badge_boss");
    award("badge_sysadmin");
    award("badge_history");
    award("badge_alias");
    award("badge_mentor");

    saveState();
    renderObjectives();
    renderRewards();
    renderLocation();
    renderPhasePill();
    try{ renderHeaderSub(); }catch(e){}
  }

  function cmdImpl(line, stdin=null){
    const trimmed = line.trim();
    if(!trimmed) return { ok:true, out:"" };

    if(state.phase >= 3 && trimmed.startsWith("./")){
      const rest = trimmed.slice(2).trim();
      const parts = rest.split(/\s+/);
      const file = parts[0];
      const argv = parts.slice(1);
      const p = normPath("~/workbench/" + file.replace(/^\/+/, ""));
      return runScript(p, argv);
    }

    const red = parseEchoRedir(trimmed);
    if(red){
      const target = normPath(red.file);
      let t = stripQuotes(red.text.trim());
      const content = t + "\n";
      const w = writeFile(target, content, red.op === ">>");
      if(!w.ok) return { ok:false, out:`echo: ${w.err}` };

      if(target === "/home/player/workbench/patchlord.sh" && /^(PATCH_APPLIED|echo\s+(["'])?PATCH_APPLIED\2)$/.test(t.trim())){
        state.flags.fixed_script = true;
        saveState();
        renderObjectives();
        row("Script-Fix detected ✅ Patchlord ist jetzt nervös. 😤", "ok");
      }
      return { ok:true, out:`(wrote) ${target}` };
    }

    const parts = trimmed.split(/\s+/);
    const c = parts[0];

    // Registry-Lock: block commands that exist but are not yet unlocked
    const allowedNow = allowedCommands();
    if(COMMAND_REGISTRY[c] && !allowedNow.includes(c)){
      return { ok:false, out:`${c}: (gesperrt) — erst Phase ${state.phase} spielen / Fortschritt machen.` };
    }
    const args = parts.slice(1);

    const allowed = allowedCommands();
    if(!allowed.includes(c) && c !== "man"){
      return { ok:false, out:`Command nicht verfügbar (Phase ${state.phase}). Tipp: help` };
    }

    switch(c){
      case "help":{
        const cmds = allowedCommands();
        const explain = {
          help:"zeigt diese Hilfe (oder help - <quest>)",
          hint:"zeigt einen Tipp zur aktuellen Quest",
          ls:"listet Inhalte",
          cd:"wechselt Ordner",
          pwd:"zeigt aktuellen Pfad",
          cat:"liest Datei",
          echo:"gibt Text aus (und kann in Datei schreiben)",
          clear:"leert Terminal",
          talk:"NPC-Dialog",
          quests:"Quest-Tracker",
          inventory:"Inventar/Fragmente",

          unlock:"(Story) Gate öffnen",
          grep:"Textsuche (optional: -n, -i)",
          mkdir:"Ordner erstellen (nur unter ~)",
          touch:"Datei erstellen (nur unter ~)",
          rm:"Datei löschen (nur unter ~)",
          cp:"Datei kopieren (dst unter ~)",
          mv:"Datei verschieben (nur unter ~)",
          assemble:"Reality-Patch bauen",
          find:"Dateien finden (mit -name und *)",
          chmod:"Rechte ändern (+x)",
          bash:"Script ausführen",
          ps:"Prozesse anzeigen",
          top:"Prozesse nach CPU sortiert",
          kill:"Prozess beenden",
          history:"Command-Verlauf",
          alias:"Shortcut/Abkürzung",
          mentor_clear:"Mentor-Run abschließen",
          reset:"alles neu starten",
          man:"Mini-Doku",
        };

        const questHelp = {
          "tutorial": [
            "Tutorial – Grundlagen (ohne Spoiler)",
            "Was du hier übst: Dateien lesen, Inhalte anzeigen, zwischen Ordnern wechseln.",
            "Commands erklärt:",
            "  ls            → zeigt, was in einem Ordner liegt",
            "  cd <ordner>   → wechselt in einen Ordner (z.B. cd /beispiel/raum)",
            "  cat <datei>   → liest eine Datei (z.B. cat hinweis.txt)",
            "Tipp: Nutze erst ls, dann cd, dann cat – wie: erst schauen, dann hingehen, dann lesen."
          ],
          "keycard": [
            "Quest-Hilfe: Zugang/Keycard finden (ohne Route)",
            "Typisches Muster: In einem Bereich liegt eine Textdatei oder Notiz mit einem Hinweis.",
            "Commands erklärt (Beispiele):",
            "  cd <bereich>        → zu einem Ort wechseln",
            "  ls                  → nach auffälligen Dateien suchen (z.B. note.txt, clue.log)",
            "  cat <datei>         → Hinweis lesen",
            "Wenn du etwas einsammelst oder ein Ziel erfüllt ist: quests / inventory checken."
          ],
          "gate": [
            "Quest-Hilfe: Gate/Schloss öffnen (ohne Code)",
            "Meist brauchst du einen Schlüssel-Code aus einer Datei oder einem Dialog.",
            "Commands erklärt:",
            "  cat <hinweisdatei>  → Code/Passwort nachlesen",
            "  unlock <code>       → Gate öffnen (Code exakt übernehmen!)",
            "Beispiel (neutral): unlock ABC-123"
          ],
          "frag1": [
            "Fragment #1 – Text in Logdatei finden (grep)",
            "grep sucht ein Muster in einer Datei und zeigt passende Zeilen.",
            "Beispiele (nicht aus der Quest):",
            "  grep ERROR system.log        → alle Zeilen mit 'ERROR'",
            "  grep -n TODO notes.txt       → mit Zeilennummern (-n)",
            "Optional: -i ignoriert Groß-/Kleinschreibung, Zusätze lassen sich kombinieren (z.B. -n -i).",
            "Workflow: Datei/Ort finden → dann grep <muster> <datei>."
          ],
          "frag2": [
            "Fragment #2 – Ordner & Datei anlegen (mkdir + touch)",
            "mkdir erstellt Ordner, touch erstellt (oder aktualisiert) Dateien.",
            "Beispiele:",
            "  mkdir ~/workbench/projekt",
            "  touch ~/workbench/projekt/info.txt",
            "  cat ~/workbench/projekt/info.txt",
            "Wenn mkdir meldet, dass es den Ordner schon gibt: okay – dann weiter mit touch/cat."
          ],
          "frag3": [
            "Fragment #3 – Muster in Datei finden (grep)",
            "Beispiele:",
            "  grep SIGNAL daten.txt",
            "  grep -n SIGNAL daten.txt",
            "Optional: -i ignoriert Groß-/Kleinschreibung, Zusätze lassen sich kombinieren (z.B. -n -i).",
            "Wenn du das Muster kennst, aber nicht die Datei: erst ls / find verwenden."
          ],
          "assemble": [
            "Reality-Patch bauen (assemble) – Erklärung",
            "assemble nutzt Fragmente aus deinem Inventar und baut daraus etwas im Workbench.",
            "Typischer Ablauf:",
            "  inventory            → prüfen, ob du alles hast",
            "  cd ~/workbench       → im richtigen Ordner arbeiten",
            "  assemble             → Bau starten",
            "Wenn es eine README im Workbench gibt, lohnt sich: cat README*.txt"
          ],
          "find": [
            "Etwas aufspüren (find) – Erklärung",
            "find hilft, Dateien über Namen zu suchen (mit * als Platzhalter).",
            "Beispiele:",
            "  find -name \"patch*\"",
            "  find -name \"*.sh\"",
            "Tipp: Erst finden, dann mit cat/grep reinschauen."
          ],
          "locate": [
			"Lokalisieren – Suche nach Dateinamen",
			"Wenn du nur einen Teil des Namens kennst, nutze Platzhalter (*).",
			"Du musst immer einen Startpfad angeben.",
			"Beispiele:",
			"  find . -name \"*lord*\"",
			"  find /network -name \"*report*\"",
			"  find ~/workbench -name \"*.txt\"",
			"Danach: cat <datei> oder grep <muster> <datei>."
          ],
          "bug": [
            "Bug-Zeile finden – Zeilennummern nutzen (grep -n)",
            "Mit -n bekommst du Zeilennummern: praktisch wie Koordinaten.",
            "Beispiele:",
            "  grep -n BUG script.sh",
            "  grep -n FIXME script.sh",
            "Wenn du das Muster nicht kennst: cat script.sh und nach Hinweisen suchen."
          ],
          "fix": [
            "Script fixen – ohne Editor (cp + echo >>)",
            "Du kannst eine Kopie bearbeiten, indem du Text ans Ende anhängst.",
            "Commands erklärt (Beispiele):",
            "  cp quell.sh ~/workbench/            → Kopie anlegen",
            "  echo 'echo \"OK\"' >> ~/workbench/quell.sh  → Zeile anhängen (>>)",
            "Danach oft nötig:",
            "  chmod +x ~/workbench/quell.sh       → ausführbar machen",
            "  ./quell.sh                          → ausführen"
          ],
          "hotfix": [
            "Hotfix vorbereiten – sicher arbeiten",
            "Regel: Originaldateien nicht überschreiben – arbeite mit einer Kopie in ~/workbench.",
            "Beispiel-Workflow:",
            "  cp original.sh ~/workbench/original.sh",
            "  echo '# hotfix' >> ~/workbench/original.sh",
            "  chmod +x ~/workbench/original.sh",
            "  ./original.sh"
          ],
          "chmod": [
            "Rechte/Permissions – ausführbar machen (chmod +x)",
            "Wenn ein Script nicht startet, fehlt oft das Ausführrecht.",
            "Beispiele:",
            "  chmod +x tool.sh",
            "  chmod +x ~/workbench/tool.sh",
            "Ausführen dann mit:",
            "  ./tool.sh"
          ],
          "boss": [
            "Boss/Finale – Script korrekt ausführen (ohne Tokens)",
            "Typischer Ablauf bei Script-Quests:",
            "  1) Script liegt in deinem Arbeitsordner (~/workbench)",
            "  2) ausführbar machen: chmod +x <script>",
            "  3) starten: ./<script> <argument1> <argument2> ...",
            "Argumente bekommst du meist aus vorherigen Hinweisen/Fragmenten – exakt abschreiben."
          ],
          "iserv": [
            "iServ-Glitch untersuchen – generelles Vorgehen",
            "Du suchst Hinweise in einem Bereich (Datei lesen, eventuell etwas einsammeln).",
            "Commands, die fast immer helfen:",
            "  cd <ort>   → zum Ort wechseln",
            "  ls         → umsehen",
            "  cat <datei>→ Hinweise lesen",
            "Danach: quests prüfen, ob ein neues Ziel freigeschaltet wurde."
          ],
          "lagfix": [
            "Lag-Fix – Prozess finden & beenden (ps/top/kill)",
            "Ziel: einen Prozess identifizieren, der viel CPU frisst, und ihn mit kill stoppen.",
            "Vorgehen (Beispiele):",
            "  ps                 → Prozessliste",
            "  top                → nach CPU sortiert ansehen",
            "  kill <PID>         → Prozess beenden (PID aus ps/top)",
            "Tipp: Erst sicherstellen, dass du den richtigen Prozess erwischst."
          ],
          "noah": [
            "Noah – Prozessproblem (ohne konkrete PID)",
            "Du übst: ps/top lesen, PID finden, kill nutzen.",
            "Beispiel:",
            "  ps",
            "  top",
            "  kill <PID>",
            "Danach mit dem NPC reden: talk <name>"
          ],
          "emma": [
            "Emma – Verlauf/History",
            "history zeigt dir, welche Befehle du schon eingegeben hast.",
            "Beispiele:",
            "  history",
            "  history | (im Spiel nicht nötig – einfach history nutzen)",
            "Danach: talk emma"
          ],
          "leo": [
            "Leo – Aliase/Shortcuts",
            "alias legt Abkürzungen für längere Befehle an.",
            "Beispiele:",
            "  alias ll=\"ls -l\"",
            "  ll",
            "Wenn du dich vertippst: alias neu setzen oder reset (falls angeboten)."
          ],
          "mentor_clear": [
            "Mentor-Run abschließen – generelle Logik",
            "Wenn mehrere NPCs Aufgaben haben: erst alle helfen, dann Abschluss-Command nutzen.",
            "Prüfen kannst du oft mit:",
            "  talk <name>",
            "  quests",
            "Und dann den Abschlussbefehl ausführen, wenn alles erfüllt ist."
          ],
          "report": [
            "Abschluss/Report – allgemeiner Hinweis",
            "Manchmal musst du nach dem Fix an einen Ort zurück und mit einer Person sprechen.",
            "Workflow:",
            "  cd <ort>",
            "  talk <person>",
            "Optional: cat <dokument> um den Abschluss-Text zu lesen."
          ],

          // Phase 5 — Real Life (nur Hinweise/Beispiele, keine Komplettlösungen)
          "arbeitsamt": [
            "Arbeitsamt – Einstieg",
            "Du brauchst hier meistens: Ort wechseln + mit der richtigen Person reden.",
            "Beispiele:",
            "  cd /arbeitsamt",
            "  ls",
            "  cat start.txt",
            "  talk beamter",
            "Tipp: Wenn du nicht weiterkommst, lies die quest.txt pro Firma unter /real_life/."
          ],
          "beamter": [
            "Beamter – Gespräch/Quest-Arc starten",
            "Wenn ein NPC dir Aufträge gibt, ist der nächste Schritt oft: 'geh zu Ort X' oder 'lies Datei Y'.",
            "Beispiele:",
            "  talk beamter",
            "  cd /real_life",
            "  ls",
            "Hinweis: Notier dir die Firmennamen – die sind deine 'Quest-Hubs'."
          ],
          "snackmaster": [
            "SNACKMASTER – Audit-Log prüfen",
            "Jansen weiß nur: irgendwo im Audit-Log steht der Allergene-Abschnitt – aber nicht mehr wo.",
            "Dein Ziel: finde die passende Zeile/den Marker im Log und geh damit zurück zu Jansen.",
            "Beispiele:",
            "  cd /real_life/snackmaster",
            "  ls",
            "  cat quest.txt",
            "  cat haccp_audit.log",
            "Wenn du etwas Auffälliges findest: talk jansen."
          ],
          "ars": [
            "A‑R‑S Recycling – Datei besorgen (ohne Schritt-für-Schritt)",
            "Ziel: Den Abholplan finden und in deiner Workbench ablegen, damit Frau Wiebe ihn sieht.",
            "Hinweise:",
            "  • Schau in den Firmen-Ordner und lies quest.txt.",
            "  • Wenn du Dateien 'nicht findest': erst suchen, dann lesen.",
            "Beispiele (allgemein, nicht 1:1 übernehmen):",
            "  find <bereich> -name \"<dateiname>\"",
            "  ls ~/workbench/<ordner>",
            "Wenn die Datei in deiner Workbench liegt: talk wiebe."
          ],
          "ohlendorf": [
            "Ohlendorf‑Technik – Ticket lesen (ohne Rechte-Rezept)",
            "Ziel: Ticket in deine Workbench holen und so einstellen, dass du es lesen darfst.",
            "Hinweise:",
            "  • Manche Dateien sind absichtlich 'zu' (Permissions).",
            "  • Arbeite immer in ~/workbench (nicht am Original).",
            "Beispiele (generisch):",
            "  ls -l <datei>        → Rechte ansehen",
            "  chmod <modus> <datei>→ Rechte ändern (Modus hängt vom Fall ab)",
            "Wenn du den Token gelesen hast: talk neele."
          ],
          "berndt": [
            "Möbelfabrik – Performance retten (ohne Prozessname)",
            "Ziel: Herausfinden, was die CPU frisst, und den richtigen Prozess stoppen.",
            "Hinweise:",
            "  • Erst identifizieren, dann handeln (nicht 'blind' beenden).",
            "  • Prozess-Tools zeigen dir Name + PID.",
            "Beispiele (generisch):",
            "  ps",
            "  top",
            "  kill <PID>           → nur wenn du sicher bist",
            "Danach: talk tom."
          ],
          "cms": [
            "CMS – Multi-Trade Abnahme",
            "Ziel: In ~/workbench/cms für alle Fachbereiche Dokumentation ablegen.",
            "Hinweise:",
            "  • Codes stehen NICHT bei CMS, sondern in anderen Orten.",
            "  • Struktur anlegen: mkdir ~/workbench/cms/{elektro,fliesen,dach,sanitaer,maler,abnahme}",
            "  • Dateien mit echo füllen: <bereich>/bericht.txt",
            "  • In abnahme/uebersicht.txt alle Codes sammeln.",
            "Danach: talk holger."
          ],
          "jobangebot": [
            "Jobangebot – Abschluss",
            "Nach allen Firmen-Aufträgen musst du oft zum 'Hub' zurück und den Abschluss triggern.",
            "Beispiele:",
            "  cd /arbeitsamt",
            "  talk beamter",
            "Wenn was fehlt: quests zeigt dir, welche Firma noch offen ist."
          ]
        };

        // help - <questkey>
        if(args && args.length && args[0] === "-"){
          const key = (args.slice(1).join(" ") || "").trim().toLowerCase();
          if(!key){
            return { ok:true, out:
`Quest-Hilfe:
  help - tutorial
  help - keycard
  help - gate
  help - frag1 | frag2 | frag3
  help - assemble
  help - iserv
  help - find | locate | bug | fix | hotfix | chmod | boss
  help - report
  help - noah | emma | leo | mentor_clear
  help - arbeitsamt | beamter
  help - snackmaster | ars | ohlendorf | berndt | cms
  help - jobangebot

Tipp: quests zeigt dir die Quest-Keys in [eckigen Klammern].` };
          }
          const info = questHelp[key];
          if(!info){
            return { ok:false, out:`Keine Quest-Hilfe für '${key}'. Tipp: help - (ohne Key) für Liste.` };
          }
          return { ok:true, out: info.join("\n") };
        }

        const lines = [];
        lines.push(`Freigeschaltete Commands (Phase ${state.phase}):`);
        for(const c of cmds){
          lines.push(`  ${c.padEnd(12)} - ${explain[c] || ""}`.trimEnd());
        }
        lines.push("");
        lines.push("Quest-Hilfe: help - <questkey>  (z.B. help - frag3)");
        // Hinweis: Pipes sind im Spiel nicht aktiv (bewusst vereinfacht).
        if(state.phase===3) lines.push("Boss-Run: find → grep -n → cp → echo >> → chmod +x → ./patchlord.sh ...");
        if(state.phase===4) lines.push("Mentor-Arc: ps/top/kill · history · alias · mentor_clear");
        lines.push("");
        lines.push("Mini Manual - Zeigt dir, wie die Befehle funktionieren: man <cmd> (z.B. man grep) | clear | reset");
        return { ok:true, out: lines.join("\n") };
      }

      
      case "hint":{
        const list = OBJECTIVES.filter(o=>o.phase===state.phase);
        const next = list.find(o=>!o.done(state)) || null;
        if(!next) return { ok:true, out:"hint: In dieser Phase ist gerade nichts offen. 🎉 (quests zeigt alles)" };

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

if(t.includes("iserv-glitch")) return "iserv";
if(t.includes("patchlord lokalisieren")) return "locate";
if(t.includes("hotfix vorbereiten")) return "hotfix";
if(t.includes("zeugnis abholen")) return "report";
          return "quest";
        };

        const key = (next.key || keyFor(next.title));
        const msg = [
          `Tipp zur aktuellen Quest: ${next.hint}`,
          `Mehr Hilfe: help - ${key}`
        ].join("\n");
        return { ok:true, out: msg };
      }

case "man":{
        const target = (args[0]||"").toLowerCase().trim();
        if(!target){
          return { ok:false, out:"man: usage: man <cmd>" };
        }
        const meta = COMMAND_REGISTRY[target];
        if(!meta){
          return { ok:false, out:`man: Keine Doku für '${target}' gefunden.` };
        }

        let out = `${target.toUpperCase()} — ${meta.desc}

`;
        out += `Kategorie: ${meta.group}

`;
        if(meta.usage){
          out += `Syntax:
  ${meta.usage}

`;
        }
        if(meta.example){
          out += `Beispiel:
  ${meta.example}

`;
        }

        // Ausführliche Doku (Beschreibung + Namensherkunft)
        const manual = MANUALS[target];
        if(manual){
          out += "DETAILS:\n" + manual + "\n";
        }

        // Mini-Hinweise je nach Command
        if(target==="cd"){
          out += `Pro-Tipp:
  cd ..  = ein Ordner hoch  •  cd /  = zur Wurzel
`;
        }
        if(target==="grep"){
          out += `Pro-Tipp:
  Mit -n bekommst du Zeilennummern: grep -n "PATTERN" file
`;
        }
        if(target==="find"){
          out += `Pro-Tipp:
  Muster in Anführungszeichen: find / -name "*.log"
`;
        }
        if(target==="chmod"){
          out += `Pro-Tipp:
  Für Scripts: chmod +x file  und dann: ./file
`;
        }
        if(["ssh","scp","logwipe","netmap","ping","connect"].includes(target)){
          out += `Hinweis:
  Diese Tools sind Teil der Netzwerk-/Winkelmann-Sidequest.
  Einstieg: im Keller talk winkelmann → choose 3
`;
        }
        if(target==="talk"){
          out += `Hinweis:
  Du kannst NPCs meist auch mit Nachnamen ansprechen (z.B. talk remmers).
`;
        }

        return { ok:true, out };
      }


      case "pwd": return { ok:true, out: state.cwd };

      case "ls":{
        let long = false;
        let targetArg = null;
        if(args[0] === "-l"){
          long = true;
          targetArg = args[1] || null;
        }else{
          targetArg = args[0] || null;
        }
        const target = targetArg ? normPath(targetArg) : state.cwd;
        const children = listDir(target);
        if(!children) return { ok:false, out:`ls: cannot access '${targetArg||target}': No such directory` };
        if(!long){
          const out = children.map(name=>{
            const p = (target==="/" ? "" : target) + "/" + name;
            const n = getNode(p);
            return n?.type==="dir" ? name + "/" : name;
          }).join("  ");
          return { ok:true, out, pipeable:true };
        }
        const lines = [];
        for(const name of children){
          const p = (target==="/" ? "" : target) + "/" + name;
          const n = getNode(p);
          if(n?.type === "dir"){
            lines.push(`drwxr-xr-x  ${name}/`);
          }else{
            const perm = ensurePerm(p);
            const exec = perm.exec ? "x" : "-";
            lines.push(`-rw-r--r-${exec}  ${name}`);
          }
        }
        return { ok:true, out: lines.join("\n"), pipeable:true };
      }

      case "cd":{
        const targetArg = args[0] || "~";
        const target = normPath(targetArg);
        // Story-Gate: Arbeitsamt / Real-Life erst nach finalem Zeugnis sichtbar.
        const gateUnlocked = !!(state.flags && state.flags.job_arc_unlocked);
        if(!gateUnlocked && (target === "/arbeitsamt" || target.startsWith("/real_life"))){
          return { ok:false, out:`cd: no such file or directory: ${targetArg}` };
        }
        const node = getNode(target);
        if(!node || node.type!=="dir") return { ok:false, out:`cd: no such file or directory: ${targetArg}` };
        state.cwd = target;

        // Phase 5 startet erst beim Betreten des Arbeitsamts.
        if(target === "/arbeitsamt" && state.flags && state.flags.job_arc_unlocked && state.phase < 5){
          state.phase = 5;
          state.flags.job_arc_started = true;
          if(state.sidequest){
            state.sidequest.unlocked = false;
            state.sidequest.found_lab = false;
          }
          if(!state.jobArc) state.jobArc = { active:false, stage:0, quests:{ snackmaster:false, ars:false, ohlendorf:false, berndt:false, cms:false }, startedAt:null };
          state.jobArc.stage = Math.max(0, state.jobArc.stage||0);
          row("📎 Neuer Story-Arc unlocked: Phase 5 — Real Life.", "ok");
          row("Tipp: cat /arbeitsamt/start.txt  und dann talk beamter", "p");
        }

        // Quest-Spawn: Möbelfabrik hat einen neuen Lag-Prozess, sobald die Quest aktiv ist.
        try{
          if(target === "/real_life/berndt_moebel" && state.phase >= 5){
            state.processes = state.processes || [];
            const has = state.processes.some(p => p && p.name === "cnc_sim");
            if(!has){
              state.processes.push({ pid: 909, name: "cnc_sim", cpu: 96, mem: 256 });
            }
          }
        }catch(e){}
        saveState();
        promptEl.textContent = promptText();
        renderLocation();
        renderPhasePill();
        try{ renderHeaderSub(); }catch(e){}
        renderObjectives();
        renderRewards();
        renderSidequestPanel();
        return { ok:true, out:"" };
      }

      case "cat":{
        if(!args[0]) return { ok:false, out:"cat: missing file operand" };
        const path = normPath(args[0]);
        const rf = readFileChecked(path);
        if(!rf.ok){
          const msg = (rf.err === "Permission denied") ? `cat: ${args[0]}: Permission denied` : `cat: ${args[0]}: No such file`;
          return { ok:false, out: msg };
        }
        let content = rf.content;

        if(path.endsWith("/readme.txt")) state.flags.introSeen = true;
        if(path.endsWith("/keycard.txt")){
          if(!state.flags.got_key){
            state.flags.got_key = true;
            award("badge_keycard");
            row("KEYCARD gelootet ✅", "ok");
          }
        }
        if(path === "/school/pcraum/Schul-PC/iserv-glitch.txt"){
          if(!state.flags.iserv_glitch){
            state.flags.iserv_glitch = true;
            row("iServ-Glitch untersucht ✅", "ok");
          }
        }
        if(path === "/home/player/workbench/patches/frag2.txt"){
          content = `FRAG2=CRAFTED-DIR-99\n(du hast das gebaut. legit W.)\n`;
          FS[path].content = content;
          if(!state.flags.frag2){
            state.flags.frag2 = true;
            state.fragments.f2 = "CRAFTED-DIR-99";
            award("badge_builder");
          }
        }

        // Phase 5 — Ohlendorf: Ticket gelesen
        try{
          if(state.phase >= 5 && (path === "/home/player/workbench/ohlendorf/ticket_net.txt" || path === "/home/player/workbench/ticket_net.txt")){
            if(String(content||"").includes("JOB_OHLENDORF_OK")){
              state.jobArc = state.jobArc || { active:true, stage:0, quests:{ snackmaster:false, ars:false, ohlendorf:false, berndt:false, cms:false } };
              state.jobArc.active = true;
              state.jobArc.quests = state.jobArc.quests || {};
              state.jobArc.quests.ohlendorf = true;
            }
          }
        }catch(e){}
        saveState();
        renderObjectives();
        progressPhaseIfReady();
        return { ok:true, out: content, pipeable:true };
      }

      case "echo":{
        return { ok:true, out: args.join(" "), pipeable:true };
      }

      case "clear":{
        term.innerHTML="";
        return { ok:true, out:"" };
      }

      
        // Winkelmann (Physik-Zaubermeister) — Menüdialog
        if(id === "winkelmann"){
          state.sidequest.unlocked = true;
          state.sidequest.stage = Math.max(state.sidequest.stage, 1);
          state.sidequest.dialog = "winkelmann";
          // Teile gelten als "abgegeben", wenn sie in der Workbench liegen.
          state.sidequest.parts = state.sidequest.parts || {};
          if(getNode("/home/player/workbench/photon_linse.part")) state.sidequest.parts.lens = true;
          if(getNode("/home/player/workbench/gyro_spule.part")) state.sidequest.parts.coil = true;
          if(getNode("/home/player/workbench/usv_modul.part")) state.sidequest.parts.ups = true;

          const p = state.sidequest.parts||{};
          const d = state.sidequest.net||{};
          const t = state.sidequest.traces||{};
          const clean = !t.gym && !t.igs;

          out += "🧙‍♂️ Herr Dr. Winkelmann — „Lehrling… du bist gekommen.“\n";
          out += "„Physik ist eine Sprache, um Chaos zu bändigen.“\n";
          out += "„Und heute bändigen wir: Eindringlinge aus fremden Netzen.“\n\n";
          // Reaktionen (vergessene Artefakte / Logs)
          const misplacedBlueprint = Object.keys(FS).some(pth=>pth.startsWith("/home/player/") && pth.endsWith("/blueprint.dat") && !pth.startsWith("/home/player/workbench/"));
          const misplacedShield = Object.keys(FS).some(pth=>pth.startsWith("/home/player/") && pth.endsWith("/shield.key") && !pth.startsWith("/home/player/workbench/"));

          if((t.gym || t.igs) && !(t.gym && t.igs)){
            out += "„Ich rieche heiße Logs… du warst irgendwo drin. Wisch deine Spuren, Lehrling.“\\n";
          }
          if((t.gym || t.igs) && (t.gym && t.igs)){
            out += "„Bro… beide Logs brennen. Das ist kein Stealth, das ist ein Feuerwerk. logwipe.“\\n";
          }
          if((n.blueprint && !n.shield) || (n.shield && !n.blueprint)){
            out += "„Halbe Artefakt‑Sammlung ist wie halber Taschenrechner: bringt dich nicht durch.“\\n";
          }
          if(misplacedBlueprint || misplacedShield){
            out += "„Und noch was: Artefakte gehören in DEINE Workbench. Nicht irgendwohin. ~/workbench/.“\\n";
          }
          const tm = state.sidequest.traceMeter || {gym:0,igs:0};
          if(tm.gym >= 70 || tm.igs >= 70){
            out += "„Die Trace‑Leiste ist fast voll… noch ein Move und das Netz schreit. logwipe. Jetzt.“\n";
          }
          if((n.blueprint && n.shield) && (t.gym || t.igs)){
            out += "„Daten hast du — aber die Logs sind noch heiß. Ohne saubere Spuren kein Ritual.“\\n";
          }


          out += "Wähle ein Thema:\n";
          out += "  (1) Was ist die Maschine?\n";
          out += "  (2) Welche Bauteile fehlen?  (Hinweis: lege gefundene Teile in ~/workbench/)\n";
          out += "  (3) Netzwerk‑Mission (Hacknet‑Style)\n";
          out += "  (4) Status / was fehlt mir noch?\n";
          out += "  (5) Wie benutze ich den SUPER‑PC?\n";
          out += "  (6) Ritual: Maschine reparieren\n\n";
          out += "Eingabe: choose <nummer>   (z.B. choose 3)\n\n";
          out += `Kurzstatus: Teile ${(p.lens&&p.coil&&p.ups)?"✅":"⏳"}  Daten ${(d.blueprint&&d.shield)?"✅":"⏳"}  Spuren ${clean?"🟢":"🔴"}`;
          saveState();
          return { ok:true, out };
        }
case "talk":{
        const raw = (args.join(" ")||"").trim();
        if(!raw) return { ok:false, out:"talk: missing npc name (z.B. talk remmers)" };

        const query = raw.toLowerCase();
        const here = state.cwd;

        // resolve NPC by id OR by name substring (so: talk remmers / talk zoe)
        let id = query.split(/\s+/)[0];
        let npc = NPCS[id];
        if(npc && !(npc.at||[]).includes(here)) npc = null;

        if(!npc){
          let best = null;
          let bestScore = -1;
          const qTokens = query.split(/\s+/).filter(Boolean);
          for(const nid in NPCS){
            const n = NPCS[nid];
            if(!(n.at||[]).includes(here)) continue;
            const nm = String(n.name||"").toLowerCase();
            let score = 0;
            for(const t of qTokens){
              if(nm.includes(t)) score += 2;
            }
            const last = qTokens[qTokens.length-1];
            if(last && nm.split(/[^a-zäöüß]+/).includes(last)) score += 3;
            if(score > bestScore){ bestScore = score; best = nid; }
          }
          if(best && bestScore >= 2){
            id = best;
            npc = NPCS[best];
          }
        }

        if(!npc) return { ok:false, out:`talk: '${raw}' ist hier nicht (oder existiert nicht). Tipp: Schau bei "NPCs hier" im aktuellen Raum nach.` };

        state.flags.talked[id] = true;
        let out = `🗨️ ${npc.name} — ${npc.role}\n`;

// Keller-Gerüchte: nur Schüler-NPCs, und nur als Anhang unter dem normalen Text
// (Lehrkräfte geben keine Gerüchte von sich.)
const isStudent = (nid, n) => {
  const role = String((n && n.role) || "").toLowerCase();
  return role.includes("schüler") || role.includes("schueler") || /^s_\d/i.test(nid) || /^s_/i.test(nid);
};
// Fallback-Gerüchtepool, falls einzelne Schüler-NPCs keine eigenen rumorLines haben.
// Dadurch bekommt man auch bei vielen neuen generischen Schülern regelmäßig Keller-Hinweise.
const RUMOR_POOL = [
  "„Wenn ein Raum ‘zu sauber’ wirkt… geh nicht allein rein.“",
  "„Unten soll’s eine Tür geben, die manchmal… summt.“",
  "„Hausmeister sagt ‘nur Leitungen’. Aber warum ist es dann so kalt da?“",
  "„Ich hab einmal unten Schritte gehört, aber da war niemand. Kein Witz.“",
  "„Manche sagen: Wenn die Neonröhre flackert, ist ‘was’ online.“",
  "„Da gibt’s angeblich ’nen Bereich ohne WLAN… aber dein Handy vibriert trotzdem.“",
  "„Wenn du unten ‘nen Ventilator hörst: Das ist kein Ventilator.“",
  "„Jemand hat ‘KELLER = DEBUG’ an die Tafel geschrieben. Keine Ahnung was das heißt.“",
  "„Wenn du den Geruch von Ozon merkst… nope.“",
  "„Ich schwör, da unten ist ‘ne Ecke, die sich wie ein Loading-Screen anfühlt.“"
];
const maybeAppendRumor = () => {
  // Nach dem Fix: keine Keller-Gerüchte mehr (Story ist dann "durch").
  if(state.flags && state.flags.system_fixed) return;

  // Nur vor der Sidequest-Unlock-Story, damit Winkelmanns Arc nicht sofort gespoilert wird.
  if(state.sidequest && state.sidequest.unlocked) return;
  if(id === "winkelmann") return;
  if(!isStudent(id, npc)) return;
  const lines = (npc.rumorLines && npc.rumorLines.length) ? npc.rumorLines : RUMOR_POOL;
  if(!lines || !lines.length) return;

  // nicht jedes Mal — Ziel: ca. jeder 10. Schüler-Dialog enthält ein Gerücht
  let chance = 0.07;
  if((state.cwd||"").startsWith("/school/keller")) chance = 0.18;
  else if((state.cwd||"").startsWith("/school")) chance = 0.10;

  if(Math.random() < chance){
    const line = lines[Math.floor(Math.random()*lines.length)];
    out += "\n\n(🗝️ flüstert) " + line;
  }
};

        

        // Lehrerzimmer: Lehrkräfte sind hier im "No Students Allowed"-Modus.
        if(here === "/school/lehrerzimmer" && String(id).startsWith("lz_")){
          const lines = [
            "„Stopp. Das ist das Lehrerzimmer. Du bist hier nicht eingeplant.“",
            "„Du suchst bestimmt den PC‑Raum. Der ist… nicht hier. Raus bitte.“",
            "„Das ist kein Quest‑Hub. Das ist Büro. Und Büro hat keine Freispiele.“",
            "„Ich sehe schon: neugierig. Aber das hier ist ‘Need‑to‑know’. Und du brauchst es nicht.“",
            "„Wenn du irgendwas willst: Sekretariat. Wenn du nichts willst: Flur. Danke.“",
            "„Das ist ein Personalbereich. Stell dir vor, das ist /root. Du bist nicht root.“",
            "„Hast du ein Ticket? Nein? Dann ist das hier beendet.“",
            "„Bitte nicht an die Schränke. Da drin ist Chaos… äh… Vertrauliches.“",
            "„Wenn du hier weiter rumstehst, gibt’s gleich eine Sidequest: ‘Tisch wischen’.“",
            "„Kaffee, Kopierer, Konferenz. Alles drei sind gefährlich. Geh.“"
          ];
          const spice = [
            "(Leise) „Und falls du ‘Permission denied’ siehst: Das ist Absicht. Rechte sind nicht Deko.“",
            "(Du hörst: „Wer hat schon wieder den Tacker versteckt?!“ … und tust so, als wärst du nie da gewesen.)",
            "(Ein Post‑it klebt am Monitor: „grep ist wie Suchen – nur schneller.“)"
          ];
          out += lines[Math.floor(Math.random()*lines.length)];
          if(Math.random() < 0.45) out += "\n\n" + spice[Math.floor(Math.random()*spice.length)];
          saveState();
          return { ok:true, out };
        }
// === Sidequest NPC: Herr Dr. Winkelmann (Physik-Zaubermeister) ===
        if(id === "winkelmann"){
          state.sidequest.unlocked = true;
          state.sidequest.stage = Math.max(state.sidequest.stage, 1);
          state.sidequest.dialog = "winkelmann";
          // Teile zählen als "abgegeben", sobald sie in ~/workbench/ liegen.
          state.sidequest.parts = state.sidequest.parts || {};
          const wb = "/home/player/workbench";
          if(getNode(wb + "/photon_linse.part")) state.sidequest.parts.lens = true;
          if(getNode(wb + "/gyro_spule.part")) state.sidequest.parts.coil = true;
          if(getNode(wb + "/usv_modul.part")) state.sidequest.parts.ups = true;

          const p = state.sidequest.parts||{};
          const d = state.sidequest.net||{};
          const t = state.sidequest.traces||{};
          const clean = !t.gym && !t.igs;

          out += "🧙‍♂️ Herr Dr. Winkelmann — „Lehrling… du bist gekommen.“\n";
          out += "„Physik ist eine Sprache, um Chaos zu bändigen.“\n";
          out += "„Und heute bändigen wir: Eindringlinge aus fremden Netzen.“\n\n";
          out += "Wähle ein Thema:\n";
          out += "  (1) Was ist die Maschine?\n";
          out += "  (2) Welche Bauteile fehlen?  (Hinweis: in ~/workbench/ ablegen)\n";
          out += "  (3) Netzwerk‑Mission (Hacknet‑Style)\n";
          out += "  (4) Status / was fehlt mir noch?\n";
          out += "  (5) Wie benutze ich den SUPER‑PC?\n";
          out += "  (6) Ritual: Maschine reparieren\n\n";
          out += "Eingabe: choose <nummer>   (z.B. choose 3)\n\n";
          out += `Kurzstatus: Teile ${(p.lens&&p.coil&&p.ups)?"✅":"⏳"}  Daten ${(d.blueprint&&d.shield)?"✅":"⏳"}  Spuren ${clean?"🟢":"🔴"}`;

          maybeAppendRumor();
          saveState();
          return { ok:true, out };
        }

        // --- Phase 5 NPCs (Arbeitsamt / Real Life) ---
        if(id==="beamter"){
          // Nur nach finalem Zeugnis
          if(!(state.flags && state.flags.job_arc_unlocked)){
            out += `„...ich hab grad Pause. Komm wieder, wenn du überhaupt ein Zeugnis hast.“`;
            saveState();
            return { ok:true, out };
          }
          if(state.phase < 5){
            out += `„Du bist noch nicht mal hier eingecheckt. Geh erst rein: cd /arbeitsamt“`;
            saveState();
            return { ok:true, out };
          }

          state.jobArc = state.jobArc || { active:true, stage:0, quests:{ snackmaster:false, ars:false, ohlendorf:false, berndt:false, cms:false }, startedAt: now() };
          state.jobArc.active = true;
          state.jobArc.startedAt = state.jobArc.startedAt || now();
          state.flags.job_arc_started = true;

          const q = state.jobArc.quests || {};
          const allDone = !!(q.snackmaster && q.ars && q.ohlendorf && q.berndt && q.cms);
          if(allDone){
            if(!state.flags.job_arc_done){
              state.flags.job_arc_done = true;
              // Jobangebot reinschreiben
              try{
                const jo = getNode("/arbeitsamt/jobangebot.txt");
                if(jo && jo.type==="file"){
                  jo.content = `JOBANGEBOT — FINAL\n\nBetreff: „Shell‑Allrounder*in (m/w/d)“\n\nDu hast:\n- Logs gescannt (grep)\n- Dateien gefunden (find)\n- Ordnung gebaut (mkdir/cp)\n- Rechte gefixt (chmod)\n- Prozesse gekillt (kill)\n- Dokumentation erstellt (echo > file)\n\nKurz: Du kannst Probleme lösen.\n\nGlückwunsch. Du bist offiziell ready für Real Life.\n\n(Und ja: das war Phase 5. GG.)`;
                }
              }catch(e){}
              award("badge_job");
            }
            out += `„Aha.“\n\n`;
            out += `„Alle Quests erledigt. Ich... bin beeindruckt. Ein bisschen.“\n`;
            out += `„Hier. Dein Jobangebot. Bitte nicht knicken. Das ist... Papierarbeit.“\n\n`;
            out += `Tipp: cat /arbeitsamt/jobangebot.txt`;
            saveState();
            renderObjectives();
            return { ok:true, out };
          }

          // Nächste offene Quest ansagen
          let next = null;
          if(!q.snackmaster) next = "snackmaster";
          else if(!q.ars) next = "ars_recycling";
          else if(!q.ohlendorf) next = "ohlendorf_technik";
          else if(!q.berndt) next = "berndt_moebel";
          else if(!q.cms) next = "cms";

          out += `„Nummer gezogen? Egal."\n`;
          out += `„Du willst Arbeit? Ich hab Arbeit."\n\n`;
          out += `Deine nächste Station: /real_life/${next}\n`;
          out += `Geh hin: cd /real_life/${next}\n`;
          out += `Dann: cat quest.txt  und talk mit der Person dort.\n\n`;
          out += `Status: SNACKMASTER ${q.snackmaster?"✅":"⏳"} · A‑R‑S ${q.ars?"✅":"⏳"} · Ohlendorf ${q.ohlendorf?"✅":"⏳"} · Berndt ${q.berndt?"✅":"⏳"} · CMS ${q.cms?"✅":"⏳"}`;
          saveState();
          renderObjectives();
          return { ok:true, out };
        }

        if(id==="jansen"){
          if(state.phase < 5) {
            out += `„Wir sind grad im Stress. Komm später."`;
            saveState();
            return { ok:true, out };
          }
          const q = (state.jobArc && state.jobArc.quests) ? state.jobArc.quests : {};
          // Auto-detect completion: if the ticket is readable in Workbench (either in /ohlendorf or directly in ~/workbench)
          try{
            if(!q.ohlendorf && state.phase >= 5){
              const paths = ["/home/player/workbench/ohlendorf/ticket_net.txt", "/home/player/workbench/ticket_net.txt"];
              for(const p of paths){
                const rf = readFileChecked(p);
                if(rf.ok && String(rf.content||"").includes("JOB_OHLENDORF_OK")){
                  state.jobArc = state.jobArc || { active:true, stage:0, quests:{ snackmaster:false, ars:false, ohlendorf:false, berndt:false, cms:false } };
                  state.jobArc.active = true;
                  state.jobArc.quests = state.jobArc.quests || {};
                  state.jobArc.quests.ohlendorf = true;
                  break;
                }
              }
            }
          }catch(e){}
          // Accept if player placed the plan either in ~/workbench/ars/ OR directly in ~/workbench/
          try{
            const p1 = "/home/player/workbench/abholplan_2026.csv";
            const p2 = "/home/player/workbench/ars/abholplan_2026.csv";
            if(!q.ars && state.phase >= 5){
              if(getNode(p1)?.type==="file" || getNode(p2)?.type==="file"){
                state.jobArc = state.jobArc || { active:true, stage:0, quests:{ snackmaster:false, ars:false, ohlendorf:false, berndt:false, cms:false } };
                state.jobArc.active = true;
                state.jobArc.quests = state.jobArc.quests || {};
                state.jobArc.quests.ars = true;
              }
            }
          }catch(e){}
          if(q.snackmaster){
            out += `„Etikett stimmt. Allergene sind drin. Du hast uns grad ... gerettet."\n\n`;
            out += `„Sag dem Beamten, er soll aufhören zu gähnen."`;
            saveState();
            return { ok:true, out };
          }
          out += `„HACCP-Audit ist kurz vorm Explodieren."\n`;
          out += `„Wenn du die richtige Zeile findest: ich brauch den Marker."\n\n`;
          out += `Tipp: Im Audit-Log gibt’s einen Abschnitt zu Allergenen – such die passende Stelle und notier dir den Marker.`;
          saveState();
          return { ok:true, out };
        }

        if(id==="wiebe"){
          if(state.phase < 5){
            out += `„Wir fahren hier keine Schul-Quests."`;
            saveState();
            return { ok:true, out };
          }
          const q = (state.jobArc && state.jobArc.quests) ? state.jobArc.quests : {};
          if(q.ars){
            out += `„Plan ist da. Ich seh ihn. Ich atme wieder."\n\n`;
            out += `„Geh zurück zum Arbeitsamt. Die lieben Papier."`;
            saveState();
            return { ok:true, out };
          }
          out += `„Der Abholplan ist irgendwo in den Docs."\n`;
          out += `„Find ihn. Kopier ihn in deine Workbench. Schnell."\n\n`;
          out += `Tipp: Such nach dem Dateinamen in den Unterlagen und lege eine Kopie in deiner Workbench ab.`;
          saveState();
          return { ok:true, out };
        }

        if(id==="neele"){
          if(state.phase < 5){
            out += `„Wir sind grad im Netz-Notfall."`;
            saveState();
            return { ok:true, out };
          }
          const q = (state.jobArc && state.jobArc.quests) ? state.jobArc.quests : {};
          if(q.ohlendorf){
            out += `„Yes. Rechte gefixt, Ticket gelesen. Das war ... actually clean."\n\n`;
            out += `„Okay, zurück zum Arbeitsamt mit dir."`;
            saveState();
            return { ok:true, out };
          }
          out += `„Ich hab ein Ticket, aber es darf nicht jeder lesen."\n`;
          out += `„Kopier’s in deine Workbench, dann fix die Rechte. Erst dann lesen."\n\n`;
          out += `Tipp: cat quest.txt`;
          saveState();
          return { ok:true, out };
        }

        if(id==="tom"){
          if(state.phase < 5){
            out += `„Die Maschinen laufen. Oder auch nicht."`;
            saveState();
            return { ok:true, out };
          }
          const q = (state.jobArc && state.jobArc.quests) ? state.jobArc.quests : {};
          if(q.berndt){
            out += `„Lag ist weg. Produktion wieder smooth. Stabil."\n\n`;
            out += `„Arbeitsamt wartet schon mit der nächsten Nummer."`;
            saveState();
            return { ok:true, out };
          }
          out += `„Der Rechner hängt. Ich seh nur noch 2 FPS."\n`;
          out += `„Finde heraus, welcher Prozess alles ausbremst – und mach das Problem weg."\n\n`;
          out += `Tipp: Erst Prozessliste ansehen, dann den passenden Prozess gezielt stoppen.`;
          saveState();
          return { ok:true, out };
        }

        if(id==="holger"){
          if(state.phase < 5){
            out += `„Wir sind ein echter Betrieb. Komm wieder, wenn du im Real‑Life‑Teil bist."`;
            saveState();
            return { ok:true, out };
          }
          state.jobArc = state.jobArc || { active:true, stage:0, quests:{ snackmaster:false, ars:false, ohlendorf:false, berndt:false, cms:false }, startedAt: now() };
          state.jobArc.active = true;
          state.jobArc.quests = state.jobArc.quests || {};

          const q = state.jobArc.quests;
          if(q.cms){
            out += `„Die Abnahme‑Mappe ist sauber. Genau so will ich das sehen."`;
            out += `\n\n„Sag dem Arbeitsamt: CMS ist zufrieden."`;
            saveState();
            return { ok:true, out };
          }

          const requirements = [
            { label:"Elektro", path:"/home/player/workbench/cms/elektro/bericht.txt", token:"SICHERUNGSLABEL: CMS-EL-2048" },
            { label:"Fliesen", path:"/home/player/workbench/cms/fliesen/bericht.txt", token:"FUGENMIX: STEINGRAU-7" },
            { label:"Dach", path:"/home/player/workbench/cms/dach/bericht.txt", token:"DACHCODE: RINNE-R3" },
            { label:"Sanitär", path:"/home/player/workbench/cms/sanitaer/bericht.txt", token:"ROHRCHECK: DRUCK-1.6BAR" },
            { label:"Maler", path:"/home/player/workbench/cms/maler/bericht.txt", token:"FARBCODE: SAND-NEBEL-12" }
          ];
          const missing = [];
          for(const req of requirements){
            const rf = readFileChecked(req.path);
            if(!rf.ok || !String(rf.content||"").includes(req.token)){
              missing.push(req.label);
            }
          }

          const summaryPath = "/home/player/workbench/cms/abnahme/uebersicht.txt";
          const summary = readFileChecked(summaryPath);
          const summaryOk = summary.ok && requirements.every(req => String(summary.content||"").includes(req.token));

          if(missing.length === 0 && summaryOk){
            q.cms = true;
            out += `„Okay. Alle Fachbereiche sauber dokumentiert. Das ist echte Abnahme‑Qualität."`;
            out += `\n\n„Du hast dir die Empfehlung verdient. Ab zum Arbeitsamt."`;
            saveState();
            renderObjectives();
            return { ok:true, out };
          }

          out += `„Ich seh noch Lücken. CMS ist groß — wir brauchen jeden Bereich."`;
          out += `\n\nStatus:`;
          for(const req of requirements){
            const rf = readFileChecked(req.path);
            const ok = rf.ok && String(rf.content||"").includes(req.token);
            out += `\n- ${req.label}: ${ok ? "✅" : "⏳"}`;
          }
          out += `\n- Abnahme‑Übersicht: ${summaryOk ? "✅" : "⏳"}`;
          out += `\n\nTipp: cat /real_life/cms/quest.txt`;
          saveState();
          return { ok:true, out };
        }

        if(id==="semrau"){
          if(state.phase===1){
            out += `„Okay, ich sag’s wie’s ist: Das hier ist maximal sus.\n`
                + `Du machst Tutorial: keycard holen, dann Gate unlocken.\n`
                + `Bash ist wie Zauberspruch, nur ohne Umhang.“`;
          } else if(state.phase===2){
            out += `„Phase 2 ist grindy, aber fair.\n`
                + `Frag1: grep in Logs.\nFrag2: craften (mkdir/touch).\nFrag3: grep SIGNAL in frag_3.pipe.\n`
                + `Wenn du das kannst, bist du Shell‑Sorcerer.“`;
          } else {
            out += `„Phase 3 ist Bossfight.\n`
                + `find -> grep -n -> fix -> chmod +x -> ./script.\n`
                + `Du bist im Tech-Anime-Arc. Go.“`;
          }
        } else if(id==="ommen"){
          out += `„Ich weiß nicht, wer unsere Schule in ein Game verwandelt hat.\n`
              + `Aber ich weiß: Du packst das.\n`
              + `Mach Quests, hol dir Hilfe, und dann: zurück in die Realität.“`;
        } else if(id==="fischer"){
          out += `„grep -n gibt dir Zeilennummern.\n`
              + `Wie Map-Koordinaten — nur für Text.“`;
        } else if(id==="harries" || id==="pietsch"){
          const who = (id==="harries") ? "Frau Harries" : "Frau Pietsch";

          // === Zeugnis-Ende ===
          if(state.flags && state.flags.system_fixed){
            const zPath = "/school/sekretariat/zeugnis.txt";
            const zBetaPath = "/school/sekretariat/zeugnis_beta.txt";
            const zFinalPath = "/school/sekretariat/zeugnis_final.txt";

            // 1) Erstes Zeugnis (nach Bossfight)
            if(!state.flags.report_given){
              state.flags.report_given = true;

              const beta = `────────────────────────────
ZEUGNIS · KGS SCHWARMSTEDT
────────────────────────────

Name: Spieler*in
Klasse: ????

Informatik: 67
Begründung:
„Hat das System gefixt,
obwohl es nicht seine Aufgabe war.“

Bemerkung:
„67 – kein Perfect Run,
aber absolut Main-Character-Move.“

Status:
✔ bestanden
✔ respektvoll carried
✔ kein NPC geblieben
────────────────────────────`;

              try{
                const z = getNode(zPath);
                if(z && z.type==="file") z.content = beta;
                const zb = getNode(zBetaPath);
                if(zb && zb.type==="file") zb.content = beta;
              }catch(e){}

              out += `„Ach! Du bist das.\n`
                  + `Ja… das System läuft wieder. Unglaublich eigentlich.“\n\n`
                  + `Sie tippt etwas. Der Drucker rattert los.\n`
                  + `„Hier ist dein Zeugnis.“\n\n`
                  + beta + `\n\n`
                  + `(Tipp: Du kannst es auch mit cat ${zPath} anschauen.)

⚠️ Hinweis: Das sieht irgendwie komisch aus… sprich Frau Harries oder Frau Pietsch lieber nochmal darauf an.`;
              saveState();
              renderObjectives();
              return { ok:true, out };
            }

            // 2) Upgrade-Hinweis oder finales Zeugnis
            if(!state.flags.report_final){
              const canFinal = (state.phase >= 4) && (state.sidequest && state.sidequest.badge);

              if(!canFinal){
                out += `„Sag mal… du weißt schon, dass das Zeugnis technisch gesehen noch… Beta ist, oder?“\n\n`
                    + `„Du kannst ein neues bekommen.\n`
                    + `Aber nur, wenn du wirklich alles abgeschlossen hast:\n`
                    + `– Phase 4 (Mentor-Modus)\n`
                    + `– Bonus Points (Sidequest abgeschlossen)“`;
// Phase 3 soll erst nach diesem Gespräch als abgeschlossen gelten.
state.flags.report_followup = true;
if(state.phase === 3){
  state.phase = 4;
  state.cwd = "/mentor_hub";
  award("badge_mentor");
  out += `

✅ Phase 3 abgeschlossen.
🧑‍🤝‍🧑 Phase 4 unlocked: Mentor-Arc gestartet.
Tipp: cat /mentor_hub/quests.txt  und dann talk noah`;
  // UI direkt aktualisieren (Teleport/Phase sichtbar)
  try{
    promptEl.textContent = promptText();
    renderLocation();
    renderPhasePill();
  }catch(e){}
}

                saveState();
                renderObjectives();
                return { ok:true, out };
              }

              state.flags.report_final = true;

              const final = `────────────────────────────
ABSCHLUSSZEUGNIS · FINAL
────────────────────────────

Name: Spieler*in
Rolle: Systemfixer*in

Informatik: 1
Soziales Lernen: 1
Verantwortung: OP

Bemerkung:
„Hat verstanden, dass Wissen
nur dann etwas bringt,
wenn man es teilt.“

Status:
✔ abgeschlossen
✔ Mentor
✔ Realität gepatcht

GG.
────────────────────────────`;

              try{
                const z = getNode(zPath);
                if(z && z.type==="file") z.content = final;
                const zf = getNode(zFinalPath);
                if(zf && zf.type==="file") zf.content = final;
              }catch(e){}

              out += `„Okay.\nDas hier ist jetzt offiziell.“\n\n`
                  + `Der Drucker ist leise. Kein Flackern. Kein Glitch.\n\n`
                  + `„Du hast nicht nur gelernt.\nDu hast anderen geholfen.\nUnd das… zählt.“\n\n`
                  + final + `\n\n`
                  + `Danke fürs Spielen von SchwarmShell.\n\n`
                  + `Und jetzt mal Real Talk: Mit dem Zeugnis kannst du dich auch endlich um’n Job kümmern. 😅\n`
                  + `Check mal das Arbeitsamt, die haben safe Quests für dich.\n\n`
                  + `Neuer Ort unlocked: cd /arbeitsamt`;

              // Real-Life Arc freischalten
              state.flags.job_arc_unlocked = true;
              saveState();
              renderObjectives();
              return { ok:true, out };
            }

            // Wenn bereits final
            out += `„Du hast dein finales Zeugnis schon.\n`
                + `Ich würd’s an deiner Stelle safe nicht verlieren.“`;
            saveState();
            renderObjectives();
            return { ok:true, out };
          }

          // === Ticket-Quest (vor dem Bossfight) ===
          const ticketPath = "/home/player/workbench/ticket.md";
          const hasTicket = !!getNode(ticketPath);
          if(!hasTicket){
            out += `„Ticket? Ohne Ticket nix.\n`
                + `Lies /school/sekretariat/ticket.txt und bau ticket.md.\n`
                + `Bürokratie ist der Endboss, sorry not sorry.“`;
          }else{
            out += `„Ticket ist da.\nOkay: du bekommst ein offizielles ‚W‘.“`;
          }
        } else if(id==="jeske" || id==="biringer"){
          out += `„Real Talk: Wenn’s stressig wird, ist Pause kein L.
`
              + `Du musst nicht solo-queuen.“`;
        } else if(id==="noah"){
          // Anti-Softlock: Mentor-Prozesse (wieder) starten, sobald man mit Noah redet.
          if(state.phase >= 4){
            const wanted = [101, 202, 303];
            const cur = (state.processes || []);
            const pids = new Set(cur.map(p=>p.pid));
            const missing = (!cur.length) || wanted.some(pid => !pids.has(pid));
            if(missing){
              const baseProcs = [
                { pid: 101, name: "terminald", cpu: 3, mem: 42 },
                { pid: 202, name: "rgbd", cpu: 99, mem: 180 },
                { pid: 303, name: "patchwatch", cpu: 5, mem: 65 },
              ];
              const helped = (state.mentor && state.mentor.students_helped) ? state.mentor.students_helped : 0;
              const cleared = !!(state.mentor && state.mentor.clear_done);
              if(helped >= 3 && !cleared){
                baseProcs.push({ pid: 67, name: "quest_aktiv", cpu: 1, mem: 8 });
              }
              state.processes = baseProcs;
              saveState();
            } else {
              // Falls 3/3 schon erreicht sind, aber der Abschluss-Prozess fehlt.
              ensureQuestAktivProcess();
            }
          }
          if(state.phase < 4){
            out += `„Bro ich bin noch nicht mal im Mentor-Arc. 🤨“`;
          } else if(!state.mentor.lag_fixed){
            out += `„Mein Terminal laggt SO HART. Es fühlt sich an wie 3 FPS.
`
                + `Kannst du bitte kurz schauen? Ich schwöre, irgendwas frisst CPU…“
`
                + `Hint: ps / top und dann kill den Täter.`;
          } else {
            out += `„OMG danke! Es ist wieder smooth.
`
                + `Du bist legit Sysadmin-Core. W.“`;
          }
        } else if(id==="emma"){
          if(state.phase < 4){
            out += `„Ich bin noch nicht dran. Aber ich hab Angst. 😭“`;
          } else if(!state.mentor.history_checked){
            out += `„Ich hab so viel getippt und jetzt… ich weiß nicht mehr was.
`
                + `Kann man das irgendwie zurückspulen? Like… Verlauf?“
`
                + `Hint: history`;
          } else if(state.mentor.history_checked && state.mentor.students_helped < 2){
            state.mentor.students_helped = Math.max(state.mentor.students_helped, 2);
            award("badge_history");
            const scorePath = "/mentor_hub/arena2/score.txt";
            if(FS[scorePath]){
              FS[scorePath].content = FS[scorePath].content
                .replace("geholfene Leute: 1/3", "geholfene Leute: 2/3")
                .replace("geholfene Leute: 0/3", "geholfene Leute: 2/3");
            }
            out += `„Ahhh okay, jetzt seh ich’s. Ich hab einfach random Sachen gespammt.
`
                + `Danke, dass du nicht judged. (okay bisschen schon, aber nett).“`;
          } else {
            out += `„History ist lowkey OP. Danke nochmal.“`;
          }
        } else if(id==="leo"){
          if(state.phase < 4){
            out += `„Ich warte auf meinen Speedrun-Arc. 😤“`;
          } else if(!state.mentor.alias_made){
            out += `„Kann man so ein… Shortcut machen?
`
                + `Ich will nicht immer ls -l tippen. Ich will Macro. ll muss reichen.
`
                + `Hint: alias`;
          } else if(state.mentor.alias_made && state.mentor.students_helped < 3){
            state.mentor.students_helped = 3;
            // Nach 3/3: Abschluss-Prozess spawnen
            ensureQuestAktivProcess();
            const scorePath = "/mentor_hub/arena2/score.txt";
            if(FS[scorePath]){
              FS[scorePath].content = FS[scorePath].content
                .replace("geholfene Leute: 2/3", "geholfene Leute: 3/3")
                .replace("geholfene Leute: 1/3", "geholfene Leute: 3/3")
                .replace("geholfene Leute: 0/3", "geholfene Leute: 3/3");
            }
            out += `„YESSS. ll ist so clean.
`
                + `Du hast gerade mein Leben um 0.8 Sekunden pro Command verbessert.
`
                + `Das sind am Tag… sehr viele Sekunden. W.“`;
          } else {
            out += `„Alias ist einfach QoL-legendär.“`;
          }
        } else {
          
        // classroom role-based lines (teachers/students)
        if(npc && /Lehrkraft/i.test(String(npc.role||"")) && String(state.cwd||"").startsWith("/school/klassenraume")){
          const subj = (String(npc.role).match(/\(([^)]+)\)/)||[])[1] || "Unterricht";
          const lines = {
                        "Mathe":[
              "„Okay Leute, heute: Gleichungen. Und nein, ‚ich fühl das nicht‘ zählt nicht als Begründung.“",
              "„Rechnen ist wie Gaming: erst Mechanics, dann Game Sense. Also: sauber aufschreiben.“",
              "„Wenn ihr irgendwo hängen bleibt: schreibt den Schritt hin, nicht nur das Ergebnis.“",
              "„Tipp: erst Ordnung, dann Tempo. Mathe mag Struktur.“",
              "„Wer ‘ich kann das nicht’ sagt, ergänzt bitte: ‘…noch nicht’.“",
              "„Heute machen wir’s kurz: verstehen statt auswendig.“",
              "„Mini‑Check: Was ist gegeben? Was wird gesucht? Dann erst rechnen.“"
            ],
            "Deutsch":[
              "„Wir interpretieren jetzt den Text. Ja, auch wenn er nicht auf TikTok ist.“",
              "„Satzzeichen retten Leben. Mindestens die Noten.“",
              "„Belegstellen. Nicht ‘weil ich finde’. Danke.“",
              "„Wenn ihr’s nicht versteht: markiert Wörter, stellt Fragen, macht’s konkret.“",
              "„Schreibt so, dass jemand Fremdes euren Gedanken folgen kann.“",
              "„Heute: Argumente statt Meinung. Meinung darf rein – aber mit Begründung.“",
              "„Wir üben: klarer Anfang, roter Faden, sauberes Ende.“"
            ],
            "Englisch":[
              "„Let’s keep it simple: speak, even if it’s scuffed. Practice ist king.“",
              "„No cap: wer redet, lernt. Wer schweigt, bleibt im Bronze‑Rank.“",
              "„Mistakes are allowed. Silence is expensive.“",
              "„Today’s goal: one sentence more than last time.“",
              "„Vocabulary ist wie Loot – sammeln, benutzen, wiederholen.“",
              "„If you don’t know a word: describe it. Don’t freeze.“",
              "„Quick warm‑up: two minutes English only. Let’s go.“"
            ],
            "Bio":[
              "„Zellen sind basically Mini‑Fabriken. Und wenn da was glitched, wird’s spannend.“",
              "„Wenn ihr ‚ew‘ sagt, weil’s um Organe geht: welcome to Bio.“",
              "„Biologie ist Alltag – Essen, Schlaf, Stress: alles Bio.“",
              "„Merke: Struktur + Funktion. Warum ist es so gebaut?“",
              "„Heute schauen wir uns an, wie Systeme zusammenarbeiten. Wie ein Team.“",
              "„Wenn’s kompliziert wirkt: erst grob verstehen, dann Details.“",
              "„Kurzer Reality‑Check: Ihr seid auch Biologie. 😄“"
            ],
            "Geschichte":[
              "„Geschichte ist nicht nur Daten auswendig. Es ist: warum Menschen so wild entscheiden.“",
              "„Spoiler: Die Vergangenheit hat öfter Patchnotes als ihr denkt.“",
              "„Frage: Wer hatte Macht? Wer nicht? Dann wird’s klarer.“",
              "„Quellen sind wie Screenshots aus der Vergangenheit – nie komplett, aber hilfreich.“",
              "„Wir unterscheiden: Meinung, Fakt, Perspektive.“",
              "„Heute: Ursachen & Folgen. Nicht nur ‘was’, auch ‘warum’.“",
              "„Wenn ihr glaubt ‘das passiert heute nicht mehr’: Geschichte lacht leise.“"
            ],
            "Erdkunde":[
              "„Wir schauen heute auf Karten. Nein, nicht Google Maps—richtige Karten.“",
              "„Klima, Platten, Städte: alles hat Gründe. Auch wenn’s manchmal random wirkt.“",
              "„Merke: Raum prägt Menschen – und Menschen prägen Raum.“",
              "„Heute gibt’s Geo‑Detektivarbeit: Wo liegt was und warum?“",
              "„Wenn ihr’s euch nicht vorstellen könnt: zeichnet es schnell.“",
              "„Wir bleiben bei Fakten – und interpretieren dann.“",
              "„Kleine Challenge: Erklärt’s so, dass ein Fünftklässler es versteht.“"
            ],
            "Physik":[
              "„Kraft, Energie, Impuls. Das ist nicht Magie—das ist Mathe mit Style.“",
              "„Wenn der Beamer spinnt: das ist kein Geist, das ist Physik. (Oder Kabel.)“",
              "„Wir machen heute: Einheiten checken. Die retten euch in jeder Aufgabe.“",
              "„Wenn ihr euch vertut: nicht schlimm. Wichtig ist, dass ihr’s merkt.“",
              "„Physik ist Muster erkennen – und sauber messen.“",
              "„Erst Skizze, dann Formel. Nicht andersrum.“",
              "„Bonus: Wenn’s komisch klingt, ist es meistens ein Vorzeichen.“"
            ],
            "Chemie":[
              "„Heute mischen wir nichts Explosives. Chill. Safety first.“",
              "„Reaktionen sind wie Drama: zwei treffen sich und plötzlich passiert alles.“",
              "„Merke: Stoffe ändern sich – aber Masse verschwindet nicht einfach.“",
              "„Wenn’s nach ‘Zauber’ aussieht: es sind Teilchen.“",
              "„Heute: Formeln lesen wie Rezepte – mit Regeln.“",
              "„Schutzbrille ist kein Accessoire. Sie ist Pflicht.“",
              "„Wer sauber arbeitet, hat am Ende weniger Chaos.“"
            ],
            "Sport":[
              "„Handy weg, wir bewegen uns. Ja, auch du mit 2% Akku.“",
              "„Warm‑up ist Pflicht. Sonst gibt’s morgen Muskelkater‑DLC.“",
              "„Heute zählt: Technik vor Tempo.“",
              "„Fairness ist Teil der Note. Kein Meme.“",
              "„Trinken nicht vergessen. Wasser ist OP.“",
              "„Wer verletzt ist, sagt’s. Ich bin keine Gedankenleserin.“",
              "„Wir spielen – aber mit Regeln. Sonst wird’s wild.“"
            ],
            "Informatik":[
              "„Terminal ist kein Feind. Es ist nur ehrlich.“",
              "„Wenn’s nicht läuft: nicht panisch. Fehlermeldung lesen. Dann fixen.“",
              "„Erst reproduzieren, dann debuggen. Sonst jagt ihr Gespenster.“",
              "„Speichern ist kein Vorschlag. Es ist eine Lebensversicherung.“",
              "„Wenn ihr kopiert, versteht ihr’s nicht automatisch. Checkt, was ihr tut.“",
              "„Heute: kleine Schritte. Jeder Schritt ein Commit im Kopf.“",
              "„Tipp: Befehle sind Werkzeuge – nicht Zaubersprüche.“"
            ]
         
          };
          const pick = (lines[subj] || ["„Okay, heute machen wir Unterricht. Überraschung.“"]);
          out += pick[Math.floor(Math.random()*pick.length)];
        maybeAppendRumor();
        saveState();
        return { ok:true, out };
        } else if(npc && /Schüler/i.test(String(npc.role||"")) && String(state.cwd||"").startsWith("/school/klassenraume")){
          const lines = [
            "„Bro, ich schwöre, ich war grad noch wach…“",
            "„Wenn der Glitch wieder kommt, bin ich raus. Kein Bock auf Horror‑DLC.“",
            "„Die Tafel hat grad wieder geflackert… sag mir, dass du das auch gesehen hast.“",
            "„Sag bitte nicht der Lehrkraft, dass ich nix gecheckt hab. 😭“",
            "„Ich hab gehört, der Serverraum ist wie ein Boss‑Level. Safe kein Spaß.“",
            "„Lowkey fühlt sich die Schule an wie ’ne Game‑Map seit dem Glitch.“",
            "„Mathe ist eh scam. Aber der Glitch ist irgendwie… sus.“",
            "„Wenn du rausfindest, was das ist, sag Bescheid. Ich will nicht als NPC sterben.“",
            "„Ich hab aus Versehen 27 Tabs offen und jetzt stürzt mein Gehirn ab.“",
            "„Heute ist so ein Tag: ich existiere nur auf Energiesparmodus.“",
            "„Wenn jemand ‘Gruppenarbeit’ sagt, alt+f4 ich innerlich.“",
            "„Der PC hier klingt wie ’ne PS4 im Bossfight.“",
            "„Kannst du kurz checken, ob ich im richtigen Ordner bin? Ich bin lost.“",
            "„Wenn du ein Cheatcode für Hausaufgaben hast: DM.“",
            "„Ich hab’s verstanden… glaub ich. Also so 40%.“",
            "„Ich tu so, als würde ich mitschreiben. Profi‑Move.“",
            "„Warum sind Passwörter immer entweder ‘1234’ oder ‘unmöglich’?“",
            "„Wenn ich noch einmal ‘abgeben bis 23:59’ höre, ragequit.“",
            "„Ich hab das Gefühl, die Schule hat heute Patchnotes bekommen. Nur schlechter.“",
            "„Stell dir vor, wir sind alle nur Background‑NPCs. Wild.“",
            "„Ich hab ‘nen USB‑Stick, der ist älter als ich. Funktioniert trotzdem.“",
            "„Wenn du rausfindest, wo hier das WLAN wirklich gut ist: sag’s mir.“",
            "„Ich hab grad gelernt: Fehlermeldungen sind eigentlich Tipps. Verrückt.“",
            "„Mein Code läuft nicht, aber meine Hoffnung auch nicht.“",
            "„Ich hab gestern ‘cd ..’ gemacht und plötzlich war ich im Leben einen Schritt zurück.“",
            "„Sag nichts, aber ich hab grad zum ersten Mal ‘grep’ gehört und dachte an Chips.“",
            "„Wenn der Drucker heute wieder rumzickt, rufe ich einen Exorzisten.“",
            "„Ich bin nur hier wegen der Mensa. Alles andere ist Sidequest.“",
            "„Ich hab ‘ne Idee, aber sie ist noch im Beta‑Test.“",
            "„Kann man Schule eigentlich in den Papierkorb ziehen?“",
            "„Wenn ich ‘Projekt’ höre, bekomme ich automatisch Stress‑Buff.“",
            "„Ich mag Informatik… aber sie mag mich nicht immer zurück.“",
            "„Hast du auch manchmal das Gefühl, der Bildschirm guckt zurück?“",
            "„Heute ist Team ‘Kaffee’ gegen Team ‘Realität’.“"
          ];
          out += lines[Math.floor(Math.random()*lines.length)];
if(state.flags && state.flags.system_fixed && Math.random() < 0.20){
  out += `\n\n„Und ja: Drucker gehen wieder. Halleluja.“`;
}
        maybeAppendRumor();
        saveState();
        return { ok:true, out };
        }

        // === Nicht-Lehrkraft: Hausmeister (eigene Sprüche, kein Lehrer-Pool) ===
        if(id === "hausmeister"){
          const tmpPaths = [
            "/home/player/lager/kabel.tmp",
            "/home/player/lager/kiste.tmp",
            "/home/player/lager/defekt.tmp"
          ];
          const cleaned = tmpPaths.every(p=>!getNode(p));

          // Hidden Miniquest: Lager aufräumen (rm)
          if(!state.flags.hm_lager_done){
            if(cleaned){
              state.flags.hm_lager_done = true;
              out += "„Oh! Das Lager… sieht plötzlich… sauber aus? Respekt.“\n";
              out += "„Danke. Wenn ihr so weiter macht, muss ich euch ja irgendwann bezahlen.“\n";
              out += "\n(Hinweis: Du hast gerade nebenbei rm geübt. Nice.)";
              saveState();
              return { ok:true, out };
            } else {
              // Quest-Hinweis nicht jedes Mal, sonst nervt's
              if(!state.flags.hm_lager_hint || Math.random() < 0.55){
                state.flags.hm_lager_hint = true;
                out += "„Kurze Bitte: In deinem Lagerordner ~ liegt Müll rum.“\n";
                out += "„Alles mit .tmp kann weg. Aber lass lampenliste.txt in Ruhe, sonst such ich dich.“\n\n";
                out += "Tipp (ohne Spoiler):\n";
                out += "  cd ~/lager\n";
                out += "  ls\n";
                out += "  rm kabel.tmp   (und die anderen .tmp)\n";
                out += "Dann red nochmal mit mir.\n";
                saveState();
                return { ok:true, out };
              }
            }
          }

          const lines = [
            "„Wenn’s klappert, bin ich’s nicht. (Meistens.)“",
            "„Nicht auf die Kabel treten. Die sind älter als eure Passwörter.“",
            "„Der Schlüsselbund ist mein Inventory. Und das ist full.“",
            "„Ja, die Tür quietscht. Nein, ich hab’s nicht vergessen. Ich hab Prioritäten.“",
            "„Wenn ihr was kaputt macht: sagt’s. Heimlich ist’s doppelt Arbeit.“",
            "„Ich hab gerade 17 Stühle aus Raum 204 zurückgeholt. Das ist mein Bossfight.“",
            "„Das ist kein Lagerraum. Das ist mein Lebensraum.“",
            "„Wer hat den HDMI‑Adapter? Ich sehe euch alle.“",
            "„Wenn der Beamer nicht geht, liegt’s zu 80% am Kabel. Und zu 20% am Schicksal.“",
            "„Ich repariere Sachen. Gefühle leider nicht.“",
            "„Bitte keine Sticker auf die Geräte. Ich krieg die nie wieder ab.“",
            "„Wenn’s nach ‘Strom’ riecht: raus da. Sofort.“",
            "„Habt ihr versucht: aus‑ und wieder einschalten? Ja? Gut. Dann darf ich kommen.“",
            "„Ich bin nicht böse. Ich bin nur im Dauer‑Debug‑Modus.“",
            "„Kaffee ist mein Treibstoff. Ohne Kaffee: keine Reparatur.“"
          ];
          out += lines[Math.floor(Math.random()*lines.length)];
          maybeAppendRumor();
          saveState();
          return { ok:true, out };
        }

        // === Nicht-Lehrkraft: Sauer (Technikausleihe/Medien, eigene Sprüche) ===
        if(id === "sauer"){
          const codePath = "/home/player/sidequests/hdmi_code.txt";
          const cnode = getNode(codePath);
          const codeOk = cnode && cnode.type==="file" && String(cnode.content||"").includes("A17");

          // Hidden Miniquest: HDMI-Adapter-Code finden (cd/ls/cat/grep/echo)
          if(!state.flags.sauer_hdmi_done){
            if(codeOk){
              state.flags.sauer_hdmi_done = true;
              out += "„YES. A17. Genau DER Adapter, der immer verschwindet.“\n";
              out += "„Danke. Du hast dir gerade ein unsichtbares Technik-Plus verdient.“\n";
              out += "\n(Und jetzt: bitte wirklich zurückbringen. 😅)";
              saveState();
              return { ok:true, out };
            } else {
              if(!state.flags.sauer_hdmi_hint || Math.random() < 0.65){
                state.flags.sauer_hdmi_hint = true;
                out += "„Kurze Mission: Ich brauch den Code vom HDMI‑Adapter.“\n";
                out += "„Der steht irgendwo in der Kabelkiste. Such in /school/medienraum/kabelkiste.“\n\n";
                out += "Mini‑Hinweise:\n";
                out += "  cd /school/medienraum/kabelkiste\n";
                out += "  ls\n";
                out += "  cat inventar.txt\n";
                out += "  (oder: grep HDMI inventar.txt)\n\n";
                out += "Wenn du den Code hast, speicher ihn so:\n";
                out += "  echo A17 > ~/sidequests/hdmi_code.txt\n";
                out += "Dann: talk sauer\n";
                saveState();
                return { ok:true, out };
              }
            }
          }

          const lines = [
            "„Technikausleihe geht nur mit Liste. Ohne Liste: ohne mich.“",
            "„Kamera? Geht. Aber nur, wenn du sie auch wieder zurückbringst. (Bitte.)“",
            "„Ein HDMI‑Kabel ist kein Einhorn. Trotzdem: irgendwie immer weg.“",
            "„Mikrofon gibt’s — aber sag vorher, wofür. Ich hab schon ‘ne Karaoke‑Katastrophe erlebt.“",
            "„Laptop‑Wagen ist voll. Versuch’s nach der 3. Stunde nochmal.“",
            "„Wenn du sagst ‘es geht nicht’, sag bitte auch: WAS genau geht nicht.“",
            "„USB‑Sticks sind wie Geheimnisse: irgendwann verschwinden sie.“",
            "„Beamer‑Fernbedienung ist hier. Ja. Bei mir. Weil sonst niemand weiß, wo sie ist.“",
            "„Rückgabe bis Freitag. Sonst such ich dich. Und ich finde dich.“",
            "„Wenn du Ton willst: prüf erst Mute. Es ist immer Mute.“",
            "„Adapter nur gegen Pfand. Ich hab zu viel Vertrauen verloren.“",
            "„Headsets sind desinfiziert. Bitte behandel sie wie NPC‑Loot: vorsichtig.“",
            "„Kurzer Tipp: Kabel ordentlich aufrollen. Sonst verheddert sich die Realität.“",
            "„Wenn du was ausleihst, schreib deinen Namen lesbar. ‘Lara??’ hilft mir nicht.“",
            "„Ich mach Technik. Magie ist nebenan im Physikraum.“"
          ];
          out += lines[Math.floor(Math.random()*lines.length)];
          maybeAppendRumor();
          saveState();
          return { ok:true, out };
        }

        
        // === Hidden Miniquests: Schüler*innen (SV) ===
        if(id === "sv_schueler1"){ // Mika
          const src = "/school/sv_buero/rucksack/fach_a/tasche_2/innen/Heft_Mika.txt";
          const dst = "/home/player/sidequests/Heft_Mika.txt";
          const got = getNode(dst);
          const ok = got && got.type==="file" && String(got.content||"").includes("MIKA-HEFT-OK");

          if(!state.flags.mika_heft_done){
            if(ok){
              state.flags.mika_heft_done = true;
              out += "„NEIN. Du hast mein Heft wirklich gefunden?! Legend.“\n";
              out += "„Ich dachte, das ist in irgendeiner Tasche-in-der-Tasche-in-der-Tasche verschwunden.“\n";
              out += "„Danke! Ab jetzt: Backup. Immer.“";
              saveState();
              return { ok:true, out };
            }
            out += "„Ey… ich hab mein Heft verloren. SV‑Heft. Voll wichtig.“\n";
            out += "„Ich glaube, es ist in diesem Rucksack hier irgendwo drin… aber der hat… zu viele Taschen.“\n\n";
            out += "Hinweis:\n";
            out += "  Such im SV‑Büro im Ordner: /school/sv_buero/rucksack\n";
            out += "  Navigier mit cd + ls, bis du Heft_Mika.txt findest.\n";
            out += "  Wenn du’s hast: cp <pfad>/Heft_Mika.txt ~/sidequests/Heft_Mika.txt\n";
            out += "Dann: talk mika (also talk sv_schueler1)\n";
            saveState();
            return { ok:true, out };
          }

          out += "„Ich schreibe jetzt ‘Heft nicht verlieren’ auf die erste Seite. Ironie.“";
          maybeAppendRumor();
          saveState();
          return { ok:true, out };
        }

        if(id === "sv_schueler2"){ // Zoe
          const ipad = "/home/player/ipad_sync/zoe/wichtig.txt";
          const p = ensurePerm(ipad);
          const od = parseInt(String(p.mode||"000")[0]||"0",10);
          const readable = !Number.isNaN(od) && ((od & 4) !== 0);

          if(!state.flags.zoe_ipad_done){
            if(readable){
              state.flags.zoe_ipad_done = true;
              out += "„YES! Ich komm wieder an die Datei ran!“\n";
              out += "„Ich hab echt geschafft, mir selbst die Rechte wegzunehmen… cringe.“\n";
              out += "„Danke! Ich schulde dir ‘nen Snack.“";
              saveState();
              return { ok:true, out };
            }
            out += "„Ich hab Zugriff auf meine iPad‑Sync‑Datei verloren… da steht alles Wichtige drin.“\n";
            out += "„Ich krieg nur ‘Permission denied’. Kannst du das fixen?“\n\n";
            out += "Hinweis:\n";
            out += "  cd ~/ipad_sync/zoe\n";
            out += "  ls -l   (guck dir die Rechte an)\n";
            out += "  chmod 644 wichtig.txt\n";
            out += "  cat wichtig.txt\n";
            out += "Dann: talk zoe (talk sv_schueler2)\n";
            saveState();
            return { ok:true, out };
          }

          out += "„Ab jetzt: Ich fass Rechte nur noch an, wenn jemand daneben steht.“";
          maybeAppendRumor();
          saveState();
          return { ok:true, out };
        }

        // === Hidden Miniquests: Fachräume / Orga ===
        if(id === "kraemer"){
          const dst = "/home/player/sidequests/kraemer_sicherheit.txt";
          const ok = (getNode(dst)?.type==="file");
          if(!state.flags.kraemer_safe_done){
            if(ok){
              state.flags.kraemer_safe_done = true;
              out += "„Sehr gut. Sicherheitstext gesichert.“\n";
              out += "„Jetzt weißt du auch, wo die Augendusche ist. (Das ist wichtig.)“\n";
              out += "„Und ja: cp ist im echten Leben auch nützlich. Nur… ohne Terminal.“";
              saveState();
              return { ok:true, out };
            }
            out += "„Kannst du mir kurz was helfen?“\n";
            out += "„Ich brauch die Sicherheitsnotiz als Kopie in deinem Ordner, damit du sie nicht verlierst.“\n\n";
            out += "Hinweis:\n";
            out += "  cp /school/chemie/protokolle/sicherheit.txt ~/sidequests/kraemer_sicherheit.txt\n";
            out += "Optional (wenn du willst): grep AUGENDUSCHE ~/sidequests/kraemer_sicherheit.txt\n";
            out += "Dann: talk kraemer\n";
            saveState();
            return { ok:true, out };
          }
          out += "„Naturwissenschaften sind cool. Aber nur mit Regeln.“";
          saveState();
          return { ok:true, out };
        }

        if(id === "kroencke"){
          const dst = "/home/player/sidequests/kroencke_code.txt";
          const node = getNode(dst);
          const ok = node && node.type==="file" && String(node.content||"").includes("DNA42");
          if(!state.flags.kroencke_dna_done){
            if(ok){
              state.flags.kroencke_dna_done = true;
              out += "„DNA42… perfekt. Genau das.“\n";
              out += "„Du hast gerade sehr elegant navigiert. (Und niemand hat was verschüttet.)“";
              saveState();
              return { ok:true, out };
            }
            out += "„Ich habe eine Probe, die falsch beschriftet ist… irgendwo steht der Code.“\n";
            out += "„Kannst du ihn finden und mir notieren?“\n\n";
            out += "Hinweis:\n";
            out += "  grep DNA /school/biologie/proben/probe_*.txt\n";
            out += "  echo DNA42 > ~/sidequests/kroencke_code.txt\n";
            out += "Dann: talk kroencke\n";
            saveState();
            return { ok:true, out };
          }
          out += "„Biologie ist detektivisch. Du hast’s gemerkt.“";
          saveState();
          return { ok:true, out };
        }

        if(id === "semrau"){
          const base = "/home/player/sidequests/digitallab_bot";
          const need = [
            base,
            base + "/firmware",
            base + "/docs",
            base + "/README.txt",
            base + "/todo.txt"
          ];
          const ok = need.every(p=>getNode(p));

          if(!state.flags.semrau_build_done){
            if(ok){
              state.flags.semrau_build_done = true;
              out += "„Okay, das ist sauber strukturiert. Genau so.“\n";
              out += "„Ordner sind wie Werkbänke: Wenn alles rumliegt, findest du nix.“";
              saveState();
              return { ok:true, out };
            }
            out += "„Mini‑Challenge fürs DigitalLab: Bau dir eine Ordnerstruktur.“\n";
            out += "„Ich will sehen, ob du mkdir/touch drauf hast.“\n\n";
            out += "Ziel (unter ~):\n";
            out += "  ~/sidequests/digitallab_bot/\n";
            out += "    firmware/\n";
            out += "    docs/\n";
            out += "    README.txt\n";
            out += "    todo.txt\n\n";
            out += "Hinweis:\n";
            out += "  mkdir ~/sidequests/digitallab_bot\n";
            out += "  mkdir ~/sidequests/digitallab_bot/firmware\n";
            out += "  mkdir ~/sidequests/digitallab_bot/docs\n";
            out += "  touch ~/sidequests/digitallab_bot/README.txt\n";
            out += "  touch ~/sidequests/digitallab_bot/todo.txt\n";
            out += "Dann: talk semrau\n";
            saveState();
            return { ok:true, out };
          }
          out += "„Wenn du’s strukturierst, gewinnt dein Gehirn FPS.“";
          saveState();
          return { ok:true, out };
        }

        if(id === "remmers"){
          const dir = "/home/player/sidequests/remmers_abgabe";
          const a = dir + "/aufsatz.txt";
          const l = dir + "/literatur.txt";
          const ok = getNode(a)?.type==="file" && getNode(l)?.type==="file";

          if(!state.flags.remmers_abgabe_done){
            if(ok){
              state.flags.remmers_abgabe_done = true;
              out += "„YES. Aufsatz & Literatur sauber benannt. Ich liebe das.“\n";
              out += "„Dateinamen sind wie Überschriften: Wenn sie wild sind, leidet jeder.“";
              saveState();
              return { ok:true, out };
            }
            out += "„Kannst du kurz Ordnung in den Abgabe‑Ordner bringen?“\n";
            out += "„Da liegen zwei Dateien mit… sagen wir… kreativen Namen.“\n\n";
            out += "Hinweis:\n";
            out += "  mkdir ~/sidequests/remmers_abgabe\n";
            out += "  cp /school/bibliothek/abgabe/aufsatz_final_neu.txt ~/sidequests/remmers_abgabe/aufsatz.txt\n";
            out += "  cp /school/bibliothek/abgabe/literatur.txt ~/sidequests/remmers_abgabe/literatur.txt\n";
            out += "Dann: talk remmers\n";
            saveState();
            return { ok:true, out };
          }
          out += "„Und jetzt bitte nicht ‘final_final2’ nennen. Danke.“";
          saveState();
          return { ok:true, out };
        }

        if(id === "frech"){
          const dst = "/home/player/sidequests/skizze.txt";
          const ok = getNode(dst)?.type==="file";

          if(!state.flags.frech_skizze_done){
            if(ok){
              state.flags.frech_skizze_done = true;
              out += "„Du hast die Skizze gefunden? Nice.“\n";
              out += "„Kunst ist manchmal: Dinge sehen, die andere übersehen.“\n";
              out += "„Und manchmal ist es einfach nur eine Datei mit Punkt am Anfang.“";
              saveState();
              return { ok:true, out };
            }
            out += "„Ich hab im Kunstraum eine Skizze versteckt.“\n";
            out += "„Nicht weil ich fies bin — sondern weil Suchen ein Skill ist.“\n\n";
            out += "Hinweis:\n";
            out += "  Schau in /school/kunstraum/schrank/leinen\n";
            out += "  (Ja, da ist eine Datei mit Punkt am Anfang.)\n";
            out += "  cp /school/kunstraum/schrank/leinen/.skizze.txt ~/sidequests/skizze.txt\n";
            out += "Dann: talk frech\n";
            saveState();
            return { ok:true, out };
          }
          out += "„Wenn du fertig bist: mach was Eigenes draus.“";
          saveState();
          return { ok:true, out };
        }
// fallback: if it's a teacher NPC, don't be boring 😄
          const inSchool = String(state.cwd||"").startsWith("/school");
          const studentIds = new Set(["noah","emma","leo"]);
          // In school: treat "s_*" und Rollen mit Schüler als Schüler-NPCs.
          const isTeacher = inSchool
            ? (!studentIds.has(id) && !isStudent(id, npc))
            : (npc && (
                /lehr|schule|direktor|sekret|beratung|schul|klassen/i.test(String(npc.role||"")) ||
                /herr|frau/i.test(String(npc.name||""))
              ) && !isStudent(id, npc));

if(isTeacher){
            const lines = [
              "„Setzt euch bitte. Wir fangen an. Und ja: auch du da hinten.“",
              "„Handys weg. Das ist keine Twitch‑Chat‑Runde.“",
              "„Wer jetzt sagt: ‘Ich war das nicht’, erklärt gleich den Lösungsweg.“",
              "„Erst lesen, dann tippen. Das spart uns allen Zeit.“",
              "„Ich zähle bis drei… und dann sehen wir weiter.“",
              "„Das ist jetzt prüfungsrelevant. Sagen wir zumindest.“",
              "„Wer fertig ist, hilft leise. Wir sind hier nicht auf dem Schulhof.“",
              "„Ich sehe mehr, als ihr denkt. Auch im Terminal.“",
              "„Wenn ihr nicht weiterkommt: strukturiert vorgehen, nicht panisch klicken.“",
              "„Heute gilt: Qualität vor Geschwindigkeit.“",
              "„Einmal tief durchatmen. Dann nochmal sauber von vorn.“",
              "„Nein, ‘es hat gestern noch funktioniert’ ist keine Diagnose.“",
              "„Wer eine Fehlermeldung hat, liest sie bitte laut. Ja, genau die.“",
              "„Wir machen das in Schritten. Schritt eins: Ruhe.“",
              "„Ich will nicht perfekt – ich will nachvollziehbar.“",
              "„Wenn ihr fertig seid: kontrollieren. Nicht sofort abgeben.“",
              "„Bitte keine privaten USB‑Sticks an Schulgeräte. Danke.“",
              "„Ich erkläre das gern nochmal. Aber mit Aufmerksamkeit.“",
              "„Wenn ihr’s nicht versteht: fragt. Dafür sind wir hier.“",
              "„Wir sind heute im Modus: konzentriert, aber freundlich.“",
              "„Das ist keine Zauberei. Nur Übung.“",
              "„Ich hab gleich eine Überraschung: eine Aufgabe.“",
              "„Wer meint ‘das brauch ich nie’: Ihr werdet euch wundern.“",
              "„Kurzer Check: Wer kann zusammenfassen, was wir gerade tun?“",
              "„Wir reden nicht gegen den Bildschirm. Wir reden über Lösungen.“",
              "„Ich verlange nicht, dass ihr’s sofort könnt – aber dass ihr’s versucht.“",
              "„Ab hier: leise Arbeitsphase.“",
              "„Wer Hilfe braucht: Handzeichen. Kein Ruf‑Spam.“",
              "„Und jetzt alle: speichern.“",
              "„Heute ist ein guter Tag, um sauber zu arbeiten.“"
            ];
            out += lines[Math.floor(Math.random()*lines.length)];
          } else {
            const lines = [
              "„Yo. Was geht?“",
              "„Ich bin nur kurz AFK im Kopf.“",
              "„Same. Ich check’s auch nicht komplett.“",
              "„Wenn du einen Tipp hast: her damit.“",
              "„Ich glaub, ich hab’s gleich… maybe.“",
              "„Ich warte auf den Plot‑Twist.“",
              "„Kannst du kurz helfen? Ich bin lost.“",
              "„Ich versuche so zu tun, als wär ich produktiv.“",
              "„Heute ist mein Gehirn im Wartungsmodus.“",
              "„Ich hab grad Flashbacks an Hausaufgaben.“",
              "„Ok, aber warum fühlt sich das wie ein Escape‑Room an?“",
              "„Wenn das wieder glitcht, ich geh direkt Mensa.“",
              "„Ich hab ‘ne Theorie, aber sie klingt dumm.“",
              "„Sag nix, aber ich hab’s grad aus Versehen richtig gemacht.“",
              "„Ich hab 1% Akku und 100% Mut.“",
              "„Lass uns das wie ein Quest lösen: Schritt für Schritt.“",
              "„Wenn du’s rausfindest, bist du Legende.“",
              "„Ich brauch kurz einen Hint…“",
              "„Ich hab die Lösung… irgendwo. Bestimmt.“",
              "„Brain.exe reagiert nicht.“"
            ];
            out += lines[Math.floor(Math.random()*lines.length)];
          }
        }

        saveState();
        renderObjectives();
        maybeAppendRumor();
        saveState();
        return { ok:true, out };
      }

      case "quests":{
        const keyFor = (title)=>{
          const t = title.toLowerCase();
          if(t.includes("tutorial")) return "tutorial";
          if(t.includes("keycard")) return "keycard";
          if(t.includes("server-gate")) return "gate";
          if(t.includes("fragment #1")) return "frag1";
          if(t.includes("fragment #2")) return "frag2";
          if(t.includes("fragment #3")) return "frag3";
          if(t.includes("reality")) return "assemble";
          if(t.includes("patchlord finden") || (t.includes("finden") && t.includes("patchlord"))) return "find";
          if(t.includes("bug")) return "bug";
          if(t.includes("script fixen") || t.includes("fixen")) return "fix";
          if(t.includes("ausführbar")) return "chmod";
          if(t.includes("bossfight")) return "boss";
          if(t.includes("noah")) return "noah";
          if(t.includes("emma")) return "emma";
          if(t.includes("leo")) return "leo";
          if(t.includes("mentor-run") || t.includes("squad geholfen")) return "mentor_clear";

if(t.includes("iserv-glitch")) return "iserv";
if(t.includes("patchlord lokalisieren")) return "locate";
if(t.includes("hotfix vorbereiten")) return "hotfix";
if(t.includes("zeugnis abholen")) return "report";
          return "quest";
        };

        const open = OBJECTIVES
          .filter(o=>o.phase===state.phase && !o.done(state))
          .map(o=>{
            const k = (o.key || keyFor(o.title) || "quest");
            return `- [${k}] ${o.title} → ${o.hint}`;
          })
          .join("\n");

// Globale Story-Reminders (auch wenn Phase gewechselt wurde)
let extra = "";
if(state.flags && state.flags.system_fixed && !state.flags.report_given){
  extra += `- [zeugnis] Zeugnis abholen → Geh ins Sekretariat: talk harries / talk pietsch\n`;
} else if(state.flags && state.flags.report_given && !state.flags.report_final){
  extra += `- [zeugnis+] Finales Zeugnis verdienen → Phase 4 + Bonus Points (Sidequest)\n`;
}
const outText = (extra + open).trim();
        return { ok:true, out: outText || "Alle aktuellen Quests erledigt. 😌" };

      }

      case "inventory":{
        const fr = state.fragments;
        const fragLine = `Fragmente: FRAG1=${fr.f1||"—"}  FRAG2=${fr.f2||"—"}  FRAG3=${fr.f3||"—"}`;
        const inv = state.inventory.length ? state.inventory.join(", ") : "(leer)";
        if(state.sidequest && state.sidequest.unlocked){
          lines.push("");
          lines.push("SIDEQUEST (Winkelmann):");
          const p = state.sidequest.parts||{};
          lines.push(`  Teile: Linse=${p.lens?"✅":"❌"}  Spule=${p.coil?"✅":"❌"}  USV=${p.ups?"✅":"❌"}`);
          const n = state.sidequest.net||{};
          lines.push(`  Daten: Blueprint=${n.blueprint?"✅":"❌"}  ShieldKey=${n.shield?"✅":"❌"}`);
          const t = state.sidequest.traces||{};
          lines.push(`  Spuren: gym=${t.gym?"🔴":"🟢"}  igs=${t.igs?"🔴":"🟢"}`);
          if(state.sidequest.badge) lines.push("  Badge: Physica potestas est ✅");
        }
        return { ok:true, out:`Inventar: ${inv}\n${fragLine}` };
      }

      case "unlock":{
        if(state.phase !== 1) return { ok:false, out:"unlock ist nur Phase 1." };
        const key = args.join(" ").trim();
        const atGate = locationPath() === "/server_gate";
        if(!atGate) return { ok:false, out:"Du bist nicht am Server-Gate. cd /server_gate" };
        if(key === "SCHWARM-ALPHA-7"){
          if(!state.flags.got_key) return { ok:false, out:"ACCESS DENIED: KEYCARD fehlt." };
          row("ACCESS GRANTED. Tür geht auf…", "ok");
          state.flags.opened_gate = true;
          saveState();
          renderObjectives();
          progressPhaseIfReady();
          return { ok:true, out:"" };
        }
        return { ok:false, out:"ACCESS DENIED: falscher Key." };
      }

      case "grep":{
        if(state.phase < 2) return { ok:false, out:"grep ist ab Phase 2 freigeschaltet." };
        const g = parseGrep(args);
        if(g.err) return { ok:false, out:g.err };
        let sourceText = "";
        if(stdin !== null){
          sourceText = String(stdin);
        }else{
          if(!g.file) return { ok:false, out:"grep: missing file operand" };
          const path = normPath(g.file);
          const rf = readFileChecked(path);
          if(!rf.ok){
            const msg = (rf.err === "Permission denied") ? `grep: ${g.file}: Permission denied` : `grep: ${g.file}: No such file`;
            return { ok:false, out: msg };
          }
          sourceText = rf.content;
        }
        const pat = stripQuotes(g.pattern);
        const matches = grepLines(sourceText, pat, {n:g.n, i:g.i});
        const out = matches.join("\n");
        grepTrigger(pat, out || "");
        return { ok:true, out: out || "", pipeable:true };
      }

      case "mkdir":{
        if(state.phase < 2) return { ok:false, out:"mkdir ist ab Phase 2." };
        if(!args[0]) return { ok:false, out:"mkdir: missing operand" };
        const path = normPath(args[0]);
        const r = mkdir(path);
        if(!r.ok) return { ok:false, out:`mkdir: ${r.err}` };
        return { ok:true, out:"" };
      }

      case "touch":{
        if(state.phase < 2) return { ok:false, out:"touch ist ab Phase 2." };
        if(!args[0]) return { ok:false, out:"touch: missing file operand" };
        const path = normPath(args[0]);
        const ex = getNode(path);
        if(ex && ex.type==="file") return { ok:true, out:"" };
        const w = writeFile(path, "", false);
        if(!w.ok) return { ok:false, out:`touch: ${w.err}` };
        row("Tip: Wenn es um Frag2 geht: cat ~/workbench/patches/frag2.txt", "p");
        return { ok:true, out:"" };
      }

      case "rm":{
        if(state.phase < 2) return { ok:false, out:"rm ist ab Phase 2." };
        if(!args[0]) return { ok:false, out:"rm: missing operand" };
        const path = normPath(args[0]);
        const r = rm(path);
        if(!r.ok) return { ok:false, out:`rm: ${r.err}` };
        return { ok:true, out:"" };
      }

      case "cp":{
        if(state.phase < 2) return { ok:false, out:"cp ist ab Phase 2." };
        if(args.length<2) return { ok:false, out:"cp: missing operand" };
        const r = cp(args[0], args[1]);
        if(!r.ok) return { ok:false, out:`cp: ${r.err}` };

        // Phase 5 — Job Quests triggers
        try{
          const src = normPath(args[0]);
          let dst = normPath(args[1]);
          // Keep triggers in sync with fs.cp(): if destination is a directory,
          // the effective target becomes <dir>/<basename(src)>
          const dn = getNode(dst);
          if(dn && dn.type==="dir") dst = dst.replace(/\/$/,"") + "/" + src.split("/").pop();

          // A-R-S: Plan in Workbench kopieren
          if(state.phase >= 5 && src === "/real_life/ars_recycling/docs/abholplan_2026.csv" && (dst === "/home/player/workbench/abholplan_2026.csv" || dst.startsWith("/home/player/workbench/ars/") || dst === "/home/player/workbench/ars/abholplan_2026.csv")){
            state.jobArc = state.jobArc || { active:true, stage:0, quests:{ snackmaster:false, ars:false, ohlendorf:false, berndt:false, cms:false } };
            state.jobArc.active = true;
            state.jobArc.quests = state.jobArc.quests || {};
            state.jobArc.quests.ars = true;
          }

          // Ohlendorf: Ticket ins Home kopieren, dann erstmal ohne Leserechte (chmod-Quest)
          // Akzeptiere sowohl ~/workbench/ohlendorf/ als auch direkt ~/workbench/
          if(state.phase >= 5 && src === "/real_life/ohlendorf_technik/ticket_net.txt" && (dst === "/home/player/workbench/ohlendorf/ticket_net.txt" || dst === "/home/player/workbench/ticket_net.txt")){
            const p = ensurePerm(dst);
            // Ohne owner-read darf cat nicht lesen -> Spieler*in MUSS chmod nutzen.
            p.mode = "000";
            p.exec = false;
            state.perms[dst] = p;
          }
        }catch(e){}
        saveState();
        renderObjectives();
        return { ok:true, out:"" };
      }

      case "mv":{
        if(state.phase < 2) return { ok:false, out:"mv ist ab Phase 2." };
        if(args.length<2) return { ok:false, out:"mv: missing operand" };
        const r = mv(args[0], args[1]);
        if(!r.ok) return { ok:false, out:`mv: ${r.err}` };
        return { ok:true, out:"" };
      }

      case "assemble":{
        if(state.phase < 2) return { ok:false, out:"assemble ist ab Phase 2." };
        if(!(state.flags.frag1 && state.flags.frag2 && state.flags.frag3)){
          return { ok:false, out:"assemble: Dir fehlen Fragmente. (quests / inventory)" };
        }
        if(!state.flags.reality_patch){
          state.flags.reality_patch = true;
          saveState();
          renderObjectives();
          award("badge_patch");
          row("REALITY‑PATCH BUILT ✅", "ok");
          row("Neon-HUD flackert… aber ein Rest-Update lebt noch…", "warn");
        }
        progressPhaseIfReady();
        return { ok:true, out:"" };
      }

      case "find":{
        if(state.phase < 3) return { ok:false, out:"find ist ab Phase 3." };
        const f = parseFind(args);
        if(f.err) return { ok:false, out:f.err };
        const r = findPaths(f.start, f.pattern);
        if(!r.ok) return { ok:false, out:r.err };
        const out = r.out.join("\n");
        if(out.includes("/boss/patchlord.sh")) state.flags.found_boss = true;
        saveState();
        renderObjectives();
        return { ok:true, out, pipeable:true };
      }

      case "chmod":{
        if(state.phase < 3) return { ok:false, out:"chmod ist ab Phase 3." };
        if(args.length < 2) return { ok:false, out:"chmod: usage: chmod +x <file> OR chmod 644 <file>" };
        const mode = args[0];
        const path = normPath(args[1]);
        const node = getNode(path);
        if(!node || node.type!=="file") return { ok:false, out:"chmod: file not found" };
        if(!writable(path)) return { ok:false, out:"chmod: Permission denied (nur unter ~)" };
        const p = ensurePerm(path);

        if(mode === "+x"){
          p.exec = true;
          p.mode = "755";
          state.flags.exec_script = true;
          award("badge_chmod");
        } else if(mode.match(/^\d{3}$/)){
          p.mode = mode;
          p.exec = (mode.endsWith("5") || mode.endsWith("7") || mode.endsWith("1"));
        } else {
          return { ok:false, out:"chmod: unsupported mode" };
        }
        state.perms[path] = p;
        saveState();
        renderObjectives();
        return { ok:true, out:"" };
      }

      case "bash":{
        if(state.phase < 3) return { ok:false, out:"bash ist ab Phase 3." };
        if(!args[0]) return { ok:false, out:"bash: missing file operand" };
        const file = args[0];
        const argv = args.slice(1);
        const p = normPath(file);
        return runScript(p, argv);
      }

      
      case "history":{
        const out = state.lastCmds
          .slice()
          .reverse()
          .map((c,i)=>`${i+1}  ${c}`)
          .join("\n");
        if(state.phase>=4) state.mentor.history_checked = true;
        saveState();
        renderObjectives();
        return { ok:true, out: out || "(no history yet)" };
      }

      case "alias":{
        if(state.phase < 4) return { ok:false, out:"alias ist ab Phase 4." };
        if(!args.length){
          const keys = Object.keys(state.aliases||{});
          const out = keys.length ? keys.map(k=>`alias ${k}="${state.aliases[k]}"`).join("\n") : "(no aliases)";
          maybeAppendRumor();
          saveState();
          return { ok:true, out };
        }
        // alias NAME="value"
        const joined = args.join(" ");
        const m = joined.match(/^([A-Za-z0-9_-]+)=(.+)$/);
        if(!m) return { ok:false, out:'alias: usage: alias name="command"' };
        const name = m[1];
        let val = m[2].trim();
        if((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1,-1);
        state.aliases = state.aliases || {};
        state.aliases[name] = val;
        if(name==="ll" && val==="ls -l"){
          state.mentor.alias_made = true;
          award("badge_alias");
        }
        saveState();
        renderObjectives();
        return { ok:true, out:`alias set: ${name}="${val}"` };
      }

      case "ps":{
        if(state.phase < 4) return { ok:false, out:"ps ist ab Phase 4." };
        const procs = (state.processes||[]).map(p=>`${String(p.pid).padStart(3,'0')}\t${p.name}`);
        return { ok:true, out: "PID\tCMD\n" + procs.join("\n") };
      }

      case "top":{
        if(state.phase < 4) return { ok:false, out:"top ist ab Phase 4." };
        const procs = (state.processes||[]).slice().sort((a,b)=>b.cpu-a.cpu);
        const lines = ["PID  CPU%  MEMMB  CMD"];
        for(const p of procs){
          lines.push(`${String(p.pid).padStart(3,'0').padEnd(4)} ${String(p.cpu).padEnd(5)} ${String(p.mem).padEnd(6)} ${p.name}`);
        }
        return { ok:true, out: lines.join("\n") };
      }

      case "kill":{
        if(state.phase < 4) return { ok:false, out:"kill ist ab Phase 4." };
        const pid = parseInt(args[0],10);
        if(!pid) return { ok:false, out:"kill: usage: kill <PID>" };
        const idx = (state.processes||[]).findIndex(p=>p.pid===pid);
        if(idx===-1) return { ok:false, out:`kill: (${pid}) - No such process` };
        const proc = state.processes[idx];
        state.processes.splice(idx,1);
        saveState();
        if(proc.name==="rgbd" && !state.mentor.lag_fixed){
          state.mentor.lag_fixed = true;
          state.mentor.students_helped = Math.max(state.mentor.students_helped, 1);
          award("badge_sysadmin");
          // update scoreboard file
          const scorePath = "/mentor_hub/arena2/score.txt";
          if(FS[scorePath]){
            FS[scorePath].content = FS[scorePath].content.replace("geholfene Leute: 0/3", "geholfene Leute: 1/3");
          }
        }

        // Mentor-Finale: "quest_aktiv" (PID 067) beenden -> mentor_clear abgeschlossen
        if(proc.name === "quest_aktiv"){
          state.mentor = state.mentor || {};
          state.mentor.clear_done = true;
          saveState();
          award("badge_mentor");
          row("🎉 Mentor-Run clear! Du hast 3/3 geholfen — und jetzt ist wirklich alles still.", "ok");
          row("Du hast jetzt: Game Sense + Bash. Das ist einfach unfair stark. 😌", "p");
        }

        // Phase 5 — Job Quest: Berndt (cnc_sim)
        if(state.phase >= 5 && proc.name === "cnc_sim"){
          state.jobArc = state.jobArc || { active:true, stage:0, quests:{ snackmaster:false, ars:false, ohlendorf:false, berndt:false, cms:false } };
          state.jobArc.active = true;
          state.jobArc.quests = state.jobArc.quests || {};
          state.jobArc.quests.berndt = true;
          row("✅ Produktion wieder smooth. cnc_sim ist weg.", "ok");
        }
        renderObjectives();
        return { ok:true, out:`killed ${pid} (${proc.name})` };
      }

      case "mentor_clear":{
        if(state.phase < 4) return { ok:false, out:"mentor_clear ist ab Phase 4." };
        if(state.mentor.students_helped < 3){
          return { ok:false, out:"Noch nicht. Hilf erst Noah, Emma, Leo (3/3)." };
        }
        if(state.mentor && state.mentor.clear_done){
          return { ok:true, out:"MENTOR MODE CLEARED" };
        }
        ensureQuestAktivProcess();
        return { ok:false, out:"Da läuft noch was… check ps/top und kill den letzten Prozess." };
      }

case "reset":{
        return { ok:true, out:"__RESET__" };
      }

      
      case "choose":{
        if(!state.sidequest || !state.sidequest.unlocked) return { ok:false, out:"choose: erst Winkelmann finden." };
        const pick = (args[0]||"").trim();
        if(!pick) return { ok:false, out:"Usage: choose <number> (z.B. choose 3)" };
        if(state.sidequest.dialog !== "winkelmann") return { ok:false, out:"choose: Keine Auswahl aktiv. Tipp: talk winkelmann" };
        // Winkelmann: Kontext-Menüs (Netzwerk -> Befehle erklärt)
        const menu = state.sidequest.winkMenu || "main";

        // MAIN: choose 3 öffnet Submenü statt direkt Briefing
        if(menu==="main" && pick==="3"){
          state.sidequest.winkMenu = "net";
          saveState();
          return { ok:true, out:
`🧙‍♂️ Winkelmann — Netzwerk‑Mission (Hacknet‑Style)
Wähle:

(1) Mission‑Briefing (Ablauf Schritt für Schritt)
(2) Befehle/Tools erklärt (mit Beispielen)  [empfohlen zuerst]

(0) zurück` };
        }

        // NET MENU
        if(menu==="net"){
          if(pick==="0"){
            state.sidequest.winkMenu = "main";
            saveState();
            return { ok:true, out:"Zurück zum Hauptmenü. (choose 1-6)" };
          }
          if(pick==="1"){
            state.sidequest.winkMenu = "main";
            saveState();
            return { ok:true, out:
`🧙‍♂️ Winkelmann — Netzwerk‑Mission (Briefing)
„Wir gehen nicht rein wie ein Elefant im LAN.
Wir gehen rein wie ein Schatten im WLAN.“

Dein Ablauf:
1) connect superpc
2) netmap  (Ziele sehen)
3) ping <host> (prüfen ob lebt)
4) ssh <host>  (rein)
5) ls / cat hint.txt/memo.txt (Info finden)
6) scp <file> ~/workbench/… (Artefakt sichern)
7) logwipe  (Spuren weg!)
8) exit (raus)

Tipp: Wenn Trace 100% erreicht → Kick. Dann erst logwipe, sonst locked.` };
          }
          if(pick==="2"){
            state.sidequest.winkMenu = "net_cmds";
            saveState();
            return { ok:true, out:
`🧙‍♂️ Winkelmann — Befehle im Netzwerk (Erklär‑Modus)
Wähle einen Befehl:

(1) netmap   (Netzwerkübersicht)
(2) ping     (Host anpingen)
(3) ssh      (einloggen)
(4) ls       (Ordner anzeigen)
(5) cat      (Datei lesen)
(6) scp      (Datei kopieren)
(7) logwipe  (Spuren löschen)
(8) exit     (verlassen)

(0) zurück` };
          }
          return { ok:false, out:"choose: In diesem Menü: choose 0, 1 oder 2." };
        }

        // NET COMMANDS MENU
        if(menu==="net_cmds"){
          const explain = (title, body)=>`🧙‍♂️ Winkelmann — ${title}\n${body}\n\n(0) zurück`;
          if(pick==="0"){
            state.sidequest.winkMenu = "net";
            saveState();
            return { ok:true, out:
`Zurück. Netzwerk‑Menü:
(1) Mission‑Briefing
(2) Befehle erklärt
(0) zurück zum Hauptmenü` };
          }
          if(pick==="1") return { ok:true, out: explain("netmap",
`Wofür: zeigt dir, welche Ziele/Hosts im „Schul‑Netz“ existieren.
Was passiert: listet Hosts + Artefakt‑Hinweise + Trace/Spuren‑Status.

Syntax:
  netmap

Beispiel:
  netmap`) };
          if(pick==="2") return { ok:true, out: explain("ping",
`Wofür: checkt, ob ein Host erreichbar ist.
Was passiert: sendet kleine Pakete – Antwort = online.

Syntax:
  ping <host>

Beispiel:
  ping gym-ost-core`) };
          if(pick==="3") return { ok:true, out: explain("ssh",
`Wofür: Remote‑Login auf einen Host.
Was passiert: Session in /net/<host>/...

Syntax:
  ssh <host>

Beispiel:
  ssh igs-edu-lab`) };
          if(pick==="4") return { ok:true, out: explain("ls",
`Wofür: listet Dateien/Ordner.
Was passiert: zeigt „was liegt hier“.

Syntax:
  ls

Beispiel:
  ls`) };
          if(pick==="5") return { ok:true, out: explain("cat",
`Wofür: Datei lesen.
Was passiert: zeigt Inhalt (Hints/Notizen/Logs).

Syntax:
  cat <datei>

Beispiel:
  cat hint.txt`) };
          if(pick==="6") return { ok:true, out: explain("scp",
`Wofür: Remote‑Datei auf deinen PC kopieren.
Was passiert: lootet Artefakt ohne Delete.

Syntax:
  scp <remote_file> <local_path>

Beispiel:
  scp blueprint.dat ~/workbench/blueprint.dat
oder:
  scp blueprint.dat ~/workbench/`) };
          if(pick==="7") return { ok:true, out: explain("logwipe",
`Wofür: Spuren in Logs löschen (Stealth).
Was passiert: setzt Spuren/Trace zurück.

Syntax:
  logwipe

Beispiel:
  (in ssh) logwipe`) };
          if(pick==="8") return { ok:true, out: explain("exit",
`Wofür: Ebene verlassen.
Was passiert:
- ssh -> zurück zu /superpc
- superpc -> zurück in den Keller

Syntax:
  exit

Beispiel:
  exit`) };
          return { ok:false, out:"choose: In diesem Menü: choose 0-8." };
        }



        const p = state.sidequest.parts||{};
        const d = state.sidequest.net||{};
        const t = state.sidequest.traces||{};
        const haveAllParts = p.lens && p.coil && p.ups;
        const haveAllData = d.blueprint && d.shield;
        const clean = !t.gym && !t.igs;

        let out = "🧙‍♂️ Herr Dr. Winkelmann:\n";
        switch(pick){
          case "1":
            out += "„Die Maschine ist ein Resonanz‑Lehrfeld. Du lernst Physik, indem du Zusammenhänge spürst – nicht nur auswendig.“\n";
            out += "„Und sie schützt unser Schulnetz: Wissen als Schild. Physica potestas est.“";
            break;
          case "2":
            out += "„Drei Artefakte sind materiell.“\n";
            out += "„Das Auge des Lichts: dort, wo Bilder an Wände geworfen werden.“\n";
            out += "„Die Spirale der Ordnung: dort, wo Geräte im Schrank schlafen.“\n";
            out += "„Die Ruhe vor dem Stromsturm: dort, wo Ersatzteile wohnen.“\n";
            out += `\nStatus: Linse=${p.lens?"✅":"❌"} Spule=${p.coil?"✅":"❌"} USV=${p.ups?"✅":"❌"}`;
            break;
          case "3":
            out += "„Netzwerk‑Mission. Hacknet‑Regeln: leise rein, Daten raus, Logs weg.“\n";
            out += "„Sichere die Artefakte in DEINER Workbench.“\n";
            out += "„Pfad: ~/workbench/. Nur dort zählen sie.“\n";
            out += "„Erst: connect superpc. Ohne Zauberstab keine Resonanz.“\n\n";
            out += "Ablauf (Beispiel):\n";
            out += "  connect superpc\n";
            out += "  ping gym-ost-core\n";
            out += "  ssh gym-ost-core\n";
            out += "  ls · cat hint.txt\n";
            out += "  scp blueprint.dat ~/workbench/blueprint.dat\n";
            out += "  logwipe · exit\n\n";
            out += `Status Daten: Blueprint=${d.blueprint?"✅":"❌"} ShieldKey=${d.shield?"✅":"❌"}\n`;
            out += `Spuren: gym=${t.gym?"🔴":"🟢"} igs=${t.igs?"🔴":"🟢"}`;
            break;
          case "4":
            out += "„Statusbericht, Lehrling.“\n";
            out += `Teile: Linse=${p.lens?"✅":"❌"} Spule=${p.coil?"✅":"❌"} USV=${p.ups?"✅":"❌"}\n`;
            out += `Daten: Blueprint=${d.blueprint?"✅":"❌"} ShieldKey=${d.shield?"✅":"❌"}\n`;
            out += `Spuren: gym=${t.gym?"🔴":"🟢"} igs=${t.igs?"🔴":"🟢"}\n`;
            out += (haveAllParts && haveAllData && clean && !state.sidequest.badge)
              ? "\n„Du bist bereit. Wähle (6) für das Ritual.“"
              : "\n„Struktur. Ruhe. Kein hektisches Klicken.“";
            break;
          case "5":
            out += "„SUPER‑PC Bedienung:“\n";
            out += "„Du bist im Lab. Dann: connect superpc.“\n";
            out += "„Danach sind ping/ssh/scp/logwipe/exit freigeschaltet.“";
            break;
          case "6":
            if(!(haveAllParts && haveAllData && clean)){
              out += "„Noch nicht. Erst Teile + Daten + saubere Logs. Dann Ritual.“";
              break;
            }
            if(state.sidequest.badge){
              out += "„Das Ritual ist vollzogen. Die Maschine hält.“";
              break;
            }
            state.sidequest.badge = true;
            if(!state.badges) state.badges = [];
            if(!state.badges.includes("Physica potestas est")) state.badges.push("Physica potestas est");
            out += "„Dann… beginne.“\n";
            out += "*Die Maschine brummt. Spulen glühen. Formeln flackern wie Boss‑HUD. Dann… Stabilität.*\n\n";
            out += "✅ Maschine repariert.\n🏷️ Badge erhalten: Physica potestas est\n";
            out += "„Physica potestas est. Wissen ist Macht, Lehrling.“";
            saveState();
            break;
          default:
            out += "„Wähle 1–6. Ich bin Physiker, kein Orakel mit Autocomplete.“";
        }
        return { ok:true, out };
      }

      case "connect":{
        if(!state.sidequest || !state.sidequest.unlocked) return { ok:false, out:"connect: erst Winkelmann finden." };
        const target = (args[0]||"").trim().toLowerCase();
        if(target !== "superpc") return { ok:false, out:"Usage: connect superpc" };
        if(state.cwd !== "/school/keller/winkelmann_lab") return { ok:false, out:"connect: Du musst im Winkelmann-Lab sein. (cd /school/keller/winkelmann_lab)" };
        if(state.superpc && state.superpc.active) return { ok:false, out:"connect: SUPER-PC läuft schon. (exit)" };
        state.superpc = { active:true, returnCwd: state.cwd };
        state.cwd = "/superpc";
        saveState();
        return { ok:true, out:`[SUPER-PC] Verbindung steht. Lüfter: ON. Formeln: ON.
MODE: SUPER-PC
Tools: netmap · ping · ssh · scp · logwipe · exit
Tipp: ping gym-ost-core` };
      }

      case "netmap":{
        if(!state.sidequest || !state.sidequest.unlocked) return { ok:false, out:"netmap: erst Winkelmann finden." };
        if(!state.superpc || !state.superpc.active) return { ok:false, out:"netmap: erst connect superpc." };
        const t = state.sidequest.traces||{};
        const lines = [];
        lines.push("SUPER-PC // Netzwerkübersicht");
        lines.push("");
        lines.push(`- gym-ost-core   (Blueprint)   Trace: ${(state.sidequest.traceMeter&&state.sidequest.traceMeter.gym)||0}% ${t.gym?"🔴":"🟢"}   -> ping/ssh gym-ost-core`);
        lines.push(`- igs-edu-lab    (ShieldKey)   Trace: ${(state.sidequest.traceMeter&&state.sidequest.traceMeter.igs)||0}% ${t.igs?"🔴":"🟢"}   -> ping/ssh igs-edu-lab`);
        lines.push("");
        lines.push("Tipp: cd /superpc/net  (Details)   |  exit (Modus verlassen)");
        return { ok:true, out: lines.join("\n") };
      }

      case "ping":{
        if(!state.sidequest || !state.sidequest.unlocked) return { ok:false, out:"ping: erst Winkelmann finden." };
        if(!state.superpc || !state.superpc.active) return { ok:false, out:"ping: erst connect superpc im Keller-Lab." };
        const host = (args[0]||"").trim();
        if(!host) return { ok:false, out:"Usage: ping <host>" };
        const known = ["gym-ost-core","igs-edu-lab"];
        if(!known.includes(host)) return { ok:false, out:`ping: unknown host '${host}'` };
        const rtt1 = (Math.random()*12+7).toFixed(1);
        const rtt2 = (Math.random()*12+7).toFixed(1);
        bumpTrace((host==="gym-ost-core")?"gym":"igs", 3);
        return { ok:true, out:`PING ${host} ...
64 bytes from ${host}: icmp_seq=1 time=${rtt1} ms
64 bytes from ${host}: icmp_seq=2 time=${rtt2} ms

Tipp: ssh ${host}` };
      }

      case "ssh":{
        if(!state.sidequest || !state.sidequest.unlocked) return { ok:false, out:"ssh: (Sidequest) erst Winkelmann finden." };
        const host = (args[0]||"").trim();
        if(!host) return { ok:false, out:"Usage: ssh <host>" };
        const known = ["gym-ost-core","igs-edu-lab"];
        if(!known.includes(host)) return { ok:false, out:`ssh: unknown host '${host}'` };
        if(state.netSession && state.netSession.active) return { ok:false, out:`ssh: already connected to ${state.netSession.host}. (exit)` };
        state.netSession = { active:true, host, returnCwd: state.cwd };
        state.cwd = `/net/${host}/home/${host==="gym-ost-core"?"guest":"student"}`;
        
        // Spuren werden "heiß", sobald du dich einloggst (Hacknet-Style)
        if(host==="gym-ost-core"){ state.sidequest.traces.gym = true; bumpTrace("gym", 10); }
        if(host==="igs-edu-lab"){ state.sidequest.traces.igs = true; bumpTrace("igs", 10); }

saveState();
        return { ok:true, out:`[ssh] connected to ${host}
Du bist im Remote-Home. Tipp: ls · cat hint.txt/memo.txt
Wichtig: Nach dem Kopieren → logwipe, sonst bleiben Spuren.` };
      }

      case "exit":{
        if(state.netSession && state.netSession.active){
          const host = state.netSession.host;
          state.cwd = state.netSession.returnCwd || "/school/keller/winkelmann_lab";
          state.netSession = { active:false, host:"", returnCwd:"" };
          saveState();
          return { ok:true, out:`[ssh] disconnected from ${host}` };
        }
        if(state.superpc && state.superpc.active){
          const back = state.superpc.returnCwd || "/school/keller/winkelmann_lab";
          state.superpc = { active:false, returnCwd:"" };
          state.cwd = back;
          saveState();
          return { ok:true, out:"[SUPER-PC] Verbindung getrennt. MODE: NORMAL." };
        }
        return { ok:true, out:"exit: nothing to exit." };
      }

      case "scp":{
        try{
          if(!state.sidequest || !state.sidequest.unlocked) return { ok:false, out:"scp: (Sidequest) erst Winkelmann finden." };
          if(!state.superpc || !state.superpc.active) return { ok:false, out:"scp: erst connect superpc." };
          if(!state.netSession || !state.netSession.active) return { ok:false, out:"scp: not connected. (ssh <host>)" };

          let src = (args[0]||"").trim();
          let dst = (args[1]||"").trim();
          if(!src || !dst) return { ok:false, out:"Usage: scp <remote_file> <local_path>" };
          if(!dst.startsWith("~/")) return { ok:false, out:"scp: Ziel muss unter ~/ liegen (z.B. ~/workbench/blueprint.dat)" };

          // Wenn Ziel ein Ordner ist (endet auf /), automatisch Dateinamen anhängen
          if(dst.endsWith("/")){
            const base = src.split("/").filter(Boolean).pop() || "file.dat";
            dst = dst + base;
          }

          const host = state.netSession.host;

          // Remote-Datei: normPath nutzt state.cwd (in SSH bist du in /net/<host>/...)
          const remotePath = normPath(src);
          const nodeRoot = `/net/${host}`;
          if(!remotePath.startsWith(nodeRoot)) return { ok:false, out:"scp: invalid remote path" };

          const rf = FS[remotePath];
          if(!rf || rf.type!=="file") return { ok:false, out:`scp: remote file not found (${src})` };

          // Local Zielpfad (nur unter /home/player)
          const dstAbs = dst.replace(/^~\//, "/home/player/");
          const parent = dstAbs.split("/").slice(0,-1).join("/") || "/";
          const parentEntry = FS[parent];
          if(!parentEntry || parentEntry.type!=="dir") return { ok:false, out:`scp: local parent dir missing (${parent})` };

          FS[dstAbs] = { type:"file", content: rf.content };
          const leaf = dstAbs.split("/").pop();
          if(leaf && !parentEntry.children.includes(leaf)) parentEntry.children.push(leaf);

          const inWorkbench = dstAbs.startsWith("/home/player/workbench/");
          const extra = inWorkbench
            ? "[OK] Artefakt gesichert in ~/workbench/\n"
            : "[WARN] Datei kopiert, aber als Artefakt zählt sie erst in ~/workbench/\n";

          // Quest-Zählung: nur wenn in Workbench gelandet
          const srcLower = src.toLowerCase();
          if(inWorkbench && host==="gym-ost-core" && srcLower.endsWith("blueprint.dat")) state.sidequest.net.blueprint = true;
          if(inWorkbench && host==="igs-edu-lab" && srcLower.endsWith("shield.key")) state.sidequest.net.shield = true;

          // Kopieren erhöht Trace deutlich + macht Logs "heiß"
          if(host==="gym-ost-core"){ bumpTrace("gym", 15); state.sidequest.traces.gym = true; }
          if(host==="igs-edu-lab"){ bumpTrace("igs", 15); state.sidequest.traces.igs = true; }

          saveState();
          renderRewards();

          return { ok:true, out: extra + `scp: copied ${src} -> ${dst}\nJetzt: logwipe (Spuren weg) · exit` };
        }catch(e){
          return { ok:false, out:`scp: error (${e && e.message ? e.message : "unknown"})` };
        }
      }

      case "logwipe":{
        if(!state.sidequest || !state.sidequest.unlocked) return { ok:false, out:"logwipe: erst Winkelmann finden." };
        if(!state.superpc || !state.superpc.active) return { ok:false, out:"logwipe: erst connect superpc." };
        if(!state.sidequest.traceMeter) state.sidequest.traceMeter = { gym:0, igs:0 };
    if(!state.sidequest.alarm) state.sidequest.alarm = { gym:false, igs:false };
    if(!state.sidequest.winkMenu) state.sidequest.winkMenu = "main";

        // Wenn du gerade in einer ssh-Session bist: nur diesen Host säubern.
        if(state.netSession && state.netSession.active){
          const host = state.netSession.host;
          if(host==="gym-ost-core"){
            state.sidequest.traces.gym = false;
            state.sidequest.traceMeter.gym = 0;
          }
          if(host==="igs-edu-lab"){
            state.sidequest.traces.igs = false;
            state.sidequest.traceMeter.igs = 0;
          }
          saveState();
          renderRewards();
          return { ok:true, out:`logwipe: ${host} logs cleaned (🟢)` };
        }

        // Im SUPER-PC ohne SSH: alles kalt schalten (Notfall)
        state.sidequest.traces.gym = false;
        state.sidequest.traces.igs = false;
        state.sidequest.traceMeter.gym = 0;
        state.sidequest.traceMeter.igs = 0;
        saveState();
        renderRewards();
        return { ok:true, out:"logwipe: global clean (🟢). Tipp: ssh <host> → logwipe (host-spezifisch)" };
      }

      default:
        return { ok:false, out:`Command not found: ${c}` };
    }
  }

  function runLine(line){
    let trimmed = String(line||"").trim();
    if(!trimmed) return;

    let guidedBlockMessage = "";
    try{
      if(window.getGuidedTutorialBlockMessage){
        guidedBlockMessage = window.getGuidedTutorialBlockMessage(trimmed) || "";
      }
    }catch(e){}
    if(guidedBlockMessage){
      state.lastCmds.unshift(trimmed);
      state.lastCmds = state.lastCmds.slice(0, 120);
      state.historyIndex = 0;
      saveState();
      row(`${promptText()} ${trimmed}`, "p");
      row(guidedBlockMessage, "warn");
      return;
    }

    if(trimmed === "1337"){
      applyCheat1337();
      return;
    }

    // alias expand (only first token)
    const firstTok = trimmed.split(/\s+/)[0];
    if(state.aliases && state.aliases[firstTok]){
      const rest = trimmed.slice(firstTok.length).trim();
      trimmed = (state.aliases[firstTok] + (rest ? " " + rest : "")).trim();
    }



    state.lastCmds.unshift(trimmed);
    state.lastCmds = state.lastCmds.slice(0, 120);
    state.historyIndex = 0;
    saveState();

    row(`${promptText()} ${trimmed}`, "p");

    // Support && and || (left-to-right). Each segment may contain pipes.
    const parts = trimmed.split(/(\s&&\s|\s\|\|\s)/);
    const chain = [];
    for(let i=0;i<parts.length;i++){
      const p = parts[i];
      if(!p) continue;
      if(p.trim()==="&&" || p.trim()==="||"){
        chain.push({op:p.trim()});
      }else{
        chain.push({cmd:p.trim()});
      }
    }

    let lastOk = true;
    for(let i=0;i<chain.length;i++){
      const node = chain[i];
      if(node.op){
        continue;
      }
      // check previous operator
      const prev = chain[i-1];
      if(prev && prev.op==="&&" && !lastOk) continue;
      if(prev && prev.op==="||" && lastOk) continue;

      const seg = node.cmd;
      const segments = seg.split("|").map(s=>s.trim()).filter(Boolean);
      if(segments.length > 3){
        row("Pipe-Limit: max 2 Pipes in diesem Game 😅", "warn");
        lastOk = false;
        continue;
      }

      let stdin = null;
      let ok = true;
      for(let j=0;j<segments.length;j++){
        const r = cmdImpl(segments[j], stdin);
        if(r.out === "__RESET__"){
          doReset(true);
          return;
        }
        if(!r.ok){
          row(r.out, "bad");
          row("Tipp: help / quests", "p");
          ok = false;
          break;
        }
        stdin = r.out ?? "";
        if(j === segments.length - 1){
          if(r.out) row(r.out);
        }
        try{ if(window.checkTutorialCommand) window.checkTutorialCommand(segments[j]); }catch(e){}
        saveState();
        renderObjectives();
        renderLocation();
        promptEl.textContent = promptText();
        progressPhaseIfReady();
        renderRewards();
        renderSidequestPanel();
        renderHeader();
      }
      lastOk = ok;
    }
  }

  function doReset(withMessage){
    localStorage.removeItem(STORAGE_KEY);
    state = structuredClone(INITIAL_STATE);
    state.flags.escaped = false;
    state.startedAt = now();
    saveState();
    term.innerHTML = "";
    promptEl.textContent = promptText();
    renderPhasePill();
    try{ renderHeaderSub(); }catch(e){}
    renderLocation();
    renderObjectives();
    renderRewards();
    renderSidequestPanel();
    if(withMessage){
      row("Hard reset. Neustart…", "warn");
      intro();
    }
  }

  function intro(){
    // Clean, size-to-text welcome box (prevents trailing border artifacts)
    const msg = "Willkommen im SchwarmShell";
    const innerWidth = msg.length + 4; // 2 spaces left + 2 spaces right
    const line = "═".repeat(innerWidth);
    row("╔" + line + "╗");
    row("║  " + msg + "  ║");
    row("╚" + line + "╝");
    row("Du bist Schüler*in der KGS Schwarmstedt.");
    row("Und heute passiert etwas komplett Unnötiges:", "warn");
    row("Euer Schulsystem glitched — und die Welt fühlt sich an wie ein Game.");
    row("Dein Job: Bash lernen und raus-escapen. (Main Character Moment.)");
    row("");
    row("Start: cat readme.txt", "ok");
    row("Oder: cd /school und dann ls", "ok");
    row("");
    row("Mini-Navi (wichtig):", "muted");
    row("Du startest in /home/player. Check das mit: pwd", "muted");
    row("Ein Ordner höher geht so: cd ..   (.. = ‚eins hoch‘)", "muted");
    row("Zu einem Unterordner: cd name    •  Zurück: cd ..", "muted");
    row("Oder direkt springen (absolute Pfade): cd /school", "muted");

      }
