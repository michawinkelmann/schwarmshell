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
  { id:"final", kind:"input", text:'Sehr gut! Viel Erfolg im Spiel 🎉 Lies jetzt mit "cat readme.txt" weiter und leg los. Wenn du später bei einer Mainquest festhängst, nutze oben im Terminal (mittig links) den 📎 Clippy Helfer für eine Schritt-für-Schritt-Musterlösung.' }
];

const CINEMATIC_INTRO_LINES = [
  "Du bist Schüler*in der KGS Wilhelm‑Röpke‑Schule Schwarmstedt — und irgendwer hat eure Schule in einen Gaming‑Layer geglitcht.",
  "Du escapst nur, wenn du Bash drauf hast. No cap. 😌",
  "IServ-Mirror meldet unautorisierte Schreibzugriffe auf die Schul-Instanz.",
  "Der Gaming-Layer synchronisiert sich mit dem KGS-Netz — Realität und Simulation kollidieren.",
  "Nur ein sauberer Terminal-Lauf kann den Patchlord stoppen."
];


let gameStarted = false;
let guidedTutorial = {
  active:false,
  panelStep:0,
  taskStep:0
};
let bootLoadSource = "Autosave";
let cinematicIntroStep = 0;



const CLIPPY_SOLUTIONS = {
  tutorial: {
    subtitle:"Die allererste Orientierung in deinem Zimmer.",
    steps:[
      'Schau zuerst, wo du bist: tippe <code>pwd</code>. Du solltest in <code>/home/player</code> landen.',
      'Sieh dir den Raum an: <code>ls</code>. Achte auf <code>readme.txt</code>, weil dort der Start erklärt wird.',
      'Lies die Datei komplett: <code>cat readme.txt</code>. Damit wird die Tutorial-Quest abgeschlossen.',
      'Wenn du unsicher bist: nutze danach <code>quests</code>, um zu prüfen, dass das nächste Ziel aktiv ist.'
    ],
    hint:'Erklärung: Diese Quest trainiert den absoluten Bash-Basis-Loop „sehen → lesen → verstehen“.'
  },
  iserv: {
    subtitle:"Den Ursprung des Glitches finden.",
    steps:[
      'Wechsle in die Schule: <code>cd /school</code> und prüfe mit <code>ls</code>, welche Räume es gibt.',
      'Gehe gezielt in den PC-Raum: <code>cd /school/pcraum</code>.',
      'Öffne den Schul-PC-Ordner: <code>cd Schul-PC</code>.',
      'Lies nacheinander <code>cat boot.txt</code> und <code>cat iserv-glitch.txt</code>, dann mit <code>quests</code> prüfen.'
    ],
    hint:'Erklärung: Der Quest-Trigger sitzt auf dem Lesen von iserv-glitch.txt.'
  },
  keycard: { subtitle:"Zutrittstoken für das Gate besorgen.", steps:[ 'Gehe sicher in den richtigen Ordner: <code>cd /school/pcraum</code>.', 'Prüfe mit <code>ls</code>, dass dort <code>keycard.txt</code> liegt.', 'Lies die Quest-Datei exakt: <code>cat /school/pcraum/keycard.txt</code> (oder <code>cat keycard.txt</code> in diesem Ordner).', 'Kontrolliere direkt danach mit <code>quests</code>, ob „KEYCARD besorgen“ als erledigt markiert ist.' ], hint:'Erklärung: Der Trigger kommt beim echten Lesen der Datei, nicht nur beim Finden per ls/find.' },
  gate: { subtitle:"Server-Gate korrekt entsperren.", steps:[ 'Gehe zum Gate: <code>cd /server_gate</code>.', 'Lies den Gate-Hinweis vollständig: <code>cat gate.txt</code>.', 'Gib den darin genannten Code exakt ein: <code>unlock SCHWARM-ALPHA-7</code>.', 'Prüfe mit <code>quests</code>, dass „Server-Gate öffnen“ erledigt ist (bei Fehler: <code>cat gate.txt</code> erneut lesen und exakt wiederholen).' ], hint:'Erklärung: Diese Quest verlangt den exakten Code als Argument für unlock.' },
  frag1: { subtitle:"Erstes Fragment aus Logs extrahieren.", steps:[ 'Gehe in die Patchbay: <code>cd /patchbay</code>.', 'Suche das erste Log gezielt: <code>ls</code> und dann <code>cat frag_1.log</code> für Kontext.', 'Trigger den Questabschluss direkt über die Suchzeile: <code>grep FRAG1_TOKEN frag_1.log</code>.', 'Prüfe danach mit <code>inventory</code> und <code>quests</code>, dass FRAG1 (PIXEL-SPAWN-42) übernommen wurde.' ], hint:'Erklärung: Für Frag1 zählt die gezielte grep-Suche im richtigen Log als Abschluss-Trigger.' },
  frag2: { subtitle:"Workbench-Struktur für Fragment #2 bauen.", steps:[ 'Gehe in dein Home: <code>cd /home/player</code> (oder nutze direkt immer Pfade mit <code>~/...</code>).', 'Der Ordner <code>~/workbench</code> ist schon da – erstelle nur noch den Unterordner: <code>mkdir ~/workbench/patches</code>.', 'Lege die Quest-Datei an: <code>touch ~/workbench/patches/frag2.txt</code>.', 'Wichtig für den Abschluss: lies die Datei anschließend explizit mit <code>cat ~/workbench/patches/frag2.txt</code>. Erst dann wird FRAG2 gesetzt; prüfe danach mit <code>quests</code>.' ], hint:'Erklärung: Bei Frag2 reicht touch allein nicht – der Trigger passiert beim cat auf frag2.txt.' },
  frag3: { subtitle:"Signaldatei finden und drittes Fragment sichern.", steps:[ 'Gehe in die Patchbay: <code>cd /patchbay</code>.', 'Lies die Pipe-Datei einmal: <code>cat frag_3.pipe</code>.', 'Trigger das Fragment mit der exakten Suche: <code>grep SIGNAL frag_3.pipe</code>.', 'Prüfe direkt mit <code>inventory</code> und <code>quests</code>, dass FRAG3 (NEON-PIPE-7) als gesichert markiert ist.' ], hint:'Erklärung: Für Frag3 zählt die Signal-Suche in frag_3.pipe als konkreter Abschluss-Schritt.' },
  assemble: { subtitle:"Alle Fragmente zu einem Patch kombinieren.", steps:[ 'Verifiziere zuerst in <code>inventory</code>, dass alle 3 Fragmente vorhanden sind.', 'Gehe in deine Workbench: <code>cd ~/workbench</code>.', 'Führe den Assemble-Befehl aus: <code>assemble</code>.', 'Bei Fehlern erst fehlende Fragmente nachholen; danach erneut <code>assemble</code> und mit <code>quests</code> prüfen.' ], hint:'Erklärung: „assemble“ ist der Crafting-Schritt, der mehrere Vorbedingungen zusammenführt.' },
  locate: { subtitle:"Patchlord-Script finden.", steps:[ 'Gehe in den Boss-Bereich: <code>cd /boss</code>.', 'Führe die Suche exakt aus: <code>find /boss -name "patchlord*"</code>.', 'Bestätige den Fund mit <code>cat /boss/patchlord.sh</code>.', 'Prüfe mit <code>quests</code>, dass „Patchlord lokalisieren“ abgeschlossen ist.' ], hint:'Erklärung: Der Quest-Trigger hängt am echten Fundpfad /boss/patchlord.sh.' },
  bug: { subtitle:"Fehlerzeile im Script mit Zeilennummer identifizieren.", steps:[ 'Führe die Suche mit Zeilennummern exakt aus: <code>grep -n BUG /boss/patchlord.sh</code>.', 'Lies danach zur Kontrolle den Kontext: <code>cat /boss/patchlord.sh</code>.', 'Merke dir die gemeldete Zeilennummer für den Hotfix-Schritt.', 'Prüfe mit <code>quests</code>, dass „Bug-Zeile identifizieren“ abgeschlossen ist.' ], hint:'Erklärung: Für diese Quest zählt konkret grep -n BUG auf der Patchlord-Datei.' },
  hotfix: { subtitle:"Sicheres Patchen über Workbench-Kopie.", steps:[ 'Kopiere das Script in die Workbench: <code>cp /boss/patchlord.sh ~/workbench/patchlord.sh</code>.', 'Hänge die notwendige Marker-Zeile an: <code>echo "PATCH_APPLIED" >> ~/workbench/patchlord.sh</code>.', 'Prüfe das Ergebnis mit <code>cat ~/workbench/patchlord.sh</code> und stelle sicher, dass <code>PATCH_APPLIED</code> sichtbar ist.', 'Kontrolliere mit <code>quests</code>, dass „Hotfix vorbereiten“ erledigt ist.' ], hint:'Erklärung: Der Hotfix-Trigger akzeptiert die konkrete Marker-Zeile PATCH_APPLIED in der Workbench-Kopie.' },
  chmod: { subtitle:"Script ausführbar machen.", steps:[ 'Setze das Ausführrecht: <code>chmod +x ~/workbench/patchlord.sh</code>.', 'Starte testweise: <code>./workbench/patchlord.sh</code> oder nach <code>cd ~/workbench</code> mit <code>./patchlord.sh</code>.', 'Bei „Permission denied“: Pfad prüfen und chmod auf exakt dieselbe Datei erneut ausführen.', 'Anschließend mit <code>quests</code> den Haken prüfen.' ], hint:'Erklärung: Ohne Execute-Bit kann ein Script trotz korrektem Inhalt nicht laufen.' },
  boss: { subtitle:"Bossfight final ausführen.", steps:[ 'Prüfe zuerst die Token: <code>inventory</code> muss FRAG1/FRAG2/FRAG3 zeigen.', 'Gehe in die Workbench: <code>cd ~/workbench</code>.', 'Starte das Script exakt mit drei Argumenten: <code>./patchlord.sh PIXEL-SPAWN-42 CRAFTED-DIR-99 NEON-PIPE-7</code>.', 'Bestätige den Erfolg mit <code>quests</code> und folge dem nächsten Story-Hinweis.' ], hint:'Erklärung: Der Bossfight prüft exakte Argument-Reihenfolge und die drei Fragmentwerte.' },
  report: { subtitle:"Zeugnis nach dem Bossfight abholen.", steps:[ 'Gehe ins Sekretariat: <code>cd /school/sekretariat</code>.', 'Rede mit einer der beiden Personen: <code>talk harries</code> oder <code>talk pietsch</code>.', 'Öffne das ausgestellte Zeugnis optional direkt: <code>cat /school/sekretariat/zeugnis.txt</code>.', 'Prüfe mit <code>quests</code>, dass „Zeugnis abholen“ erledigt ist.' ], hint:'Erklärung: Der Abschluss-Trigger kommt beim Gespräch im Sekretariat.' },
  mentor_hub: { subtitle:"Mentor Hub starten und erstes Ziel aktivieren.", steps:[ 'Gehe in den Mentor-Bereich: <code>cd /mentor_hub</code>.', 'Lies das Questboard: <code>cat /mentor_hub/quests.txt</code>.', 'Starte die erste Mentor-Aufgabe mit <code>talk noah</code>.', 'Prüfe mit <code>quests</code>, dass danach „Noah: Lag fixen“ als aktives Ziel angezeigt wird.' ], hint:'Erklärung: Dieser Schritt ist der Einstieg in den Mentor-Arc und schaltet die drei Squad-Quests frei.' },
  lagfix: { subtitle:"Noahs Lag-Problem über Prozesse lösen.", steps:[ 'Starte im Mentor-Hub: <code>cd /mentor_hub</code> und <code>talk noah</code>.', 'Zeige laufende Prozesse: <code>ps</code> (oder CPU-lastig mit <code>top</code>).', 'Beende den Störerprozess: <code>kill 202</code> (das ist <code>rgbd</code>).', 'Rede nochmal mit Noah: <code>talk noah</code>, dann mit <code>quests</code> prüfen.' ], hint:'Erklärung: Die Quest gilt erst nach dem Kill des Prozesses rgbd.' },
  emma: { subtitle:"History-Quest sauber abschließen.", steps:[ 'Gehe zu Emma: <code>cd /mentor_hub</code> und <code>talk emma</code>.', 'Führe den Verlauf-Befehl aus: <code>history</code>.', 'Rede direkt nochmal mit Emma: <code>talk emma</code>.', 'Kontrolliere den Fortschritt mit <code>quests</code>.' ], hint:'Erklärung: Das Ausführen von history setzt den Quest-Trigger.' },
  leo: { subtitle:"QoL-Shortcut per Alias bauen.", steps:[ 'Gehe zu Leo: <code>cd /mentor_hub</code> und <code>talk leo</code>.', 'Lege einen Alias an: <code>alias ll="ls -l"</code>.', 'Teste den Shortcut einmal: <code>ll</code>.', 'Rede nochmal mit Leo: <code>talk leo</code> und prüfe mit <code>quests</code>.' ], hint:'Erklärung: Für den Trigger zählt das erfolgreiche Setzen eines Alias.' },
  mentor_clear: { subtitle:"Mentor-Run vollständig abschließen.", steps:[ 'Prüfe den Stand: <code>quests</code> (Noah, Emma, Leo müssen erledigt sein).', 'Wichtig vor dem Finale: Rede nach jeder erledigten Schüler-Quest nochmal mit Noah, Emma und Leo, damit der Abschluss bestätigt wird.', 'Danach erst Prozesse prüfen: <code>ps</code>. Suche nach <code>quest_aktiv</code> (PID 67).', 'Beende den Abschluss-Prozess: <code>kill 67</code>.', 'Bestätige mit <code>mentor_clear</code> und <code>quests</code>, dass der Run wirklich clear ist.' ], hint:'Erklärung: Erst wenn alle drei Schüler den Abschluss im zweiten Gespräch bestätigt haben, lohnt sich die Suche nach Prozess 67 (quest_aktiv).' },
  report_final: { subtitle:"Finales Zeugnis freischalten.", steps:[ 'Stelle sicher, dass Sidequest + Mentor-Arc fertig sind (Badge vorhanden): <code>quests</code>.', 'Gehe ins Sekretariat: <code>cd /school/sekretariat</code>.', 'Rede erneut mit Harries oder Pietsch: <code>talk harries</code> (alternativ <code>talk pietsch</code>).', 'Lies das finale Dokument: <code>cat /school/sekretariat/zeugnis_final.txt</code> und prüfe mit <code>quests</code>.' ], hint:'Erklärung: Das finale Zeugnis gibt es erst nach Mentor-Arc plus Sidequest-Badge.' },
  arbeitsamt: { subtitle:"Phase 5 starten und einchecken.", steps:[ 'Betritt das Arbeitsamt: <code>cd /arbeitsamt</code>.', 'Lies den Einstieg: <code>cat /arbeitsamt/start.txt</code>.', 'Starte den Arc beim NPC: <code>talk beamter</code>.', 'Prüfe direkt mit <code>quests</code>, dass „Arbeitsamt betreten“ erledigt ist.' ], hint:'Erklärung: Der Phasenwechsel zu Phase 5 passiert beim Betreten von /arbeitsamt.' },
  beamter: { subtitle:"Erstes Gespräch im Arbeitsamt.", steps:[ 'Stelle sicher, dass du in <code>/arbeitsamt</code> bist: <code>pwd</code>.', 'Rede mit dem NPC: <code>talk beamter</code>.', 'Folge der genannten Station, z.B. <code>cd /real_life/snackmaster</code>.', 'Nutze <code>quests</code>, um zu sehen, welche Firmen-Quest als nächstes aktiv ist.' ], hint:'Erklärung: Das Gespräch aktiviert den Job-Quest-Arc mit den fünf Firmenaufträgen.' },
  snackmaster: { subtitle:"Allergene-Marker im Audit-Log finden.", steps:[ 'Gehe zur Firma: <code>cd /real_life/snackmaster</code>.', 'Lies den Auftrag: <code>cat quest.txt</code>.', 'Suche den Marker gezielt im Log: <code>grep ALLERGENE haccp_audit.log</code>.', 'Melde ab bei Jansen: <code>talk jansen</code> und prüfe den Haken mit <code>quests</code>.' ], hint:'Erklärung: Der Trigger setzt auf grep mit ALLERGENE, wenn die Marker-Zeile im Output auftaucht.' },
  ars: { subtitle:"Abholplan in die Workbench kopieren.", steps:[ 'Gehe zur Firma: <code>cd /real_life/ars_recycling</code>.', 'Erstelle den Zielordner: <code>mkdir ~/workbench/ars</code>.', 'Kopiere den Plan: <code>cp /real_life/ars_recycling/docs/abholplan_2026.csv ~/workbench/ars/abholplan_2026.csv</code>.', 'Melde bei Wiebe: <code>talk wiebe</code> und prüfe mit <code>quests</code>.' ], hint:'Erklärung: Quest zählt, sobald der Plan in ~/workbench (oder ~/workbench/ars) liegt.' },
  ohlendorf: { subtitle:"Ticket-Rechte fixen und Token lesen.", steps:[ 'Gehe zur Firma: <code>cd /real_life/ohlendorf_technik</code> und lies <code>cat quest.txt</code>.', 'Lege den Workbench-Ordner an und kopiere das Ticket: <code>mkdir ~/workbench/ohlendorf</code> und <code>cp /real_life/ohlendorf_technik/ticket_net.txt ~/workbench/ohlendorf/ticket_net.txt</code>.', 'Setze Leserechte auf der Kopie: <code>chmod 644 ~/workbench/ohlendorf/ticket_net.txt</code> und lies sie mit <code>cat ~/workbench/ohlendorf/ticket_net.txt</code>.', 'Melde bei Neele: <code>talk neele</code> und prüfe mit <code>quests</code>.' ], hint:'Erklärung: Der Trigger kommt beim Lesen der Ticket-Kopie in deiner Workbench.' },
  berndt: { subtitle:"CPU-Fresser in der Möbelfabrik stoppen.", steps:[ 'Gehe zur Firma: <code>cd /real_life/berndt_moebel</code> (dadurch spawnt der Problemprozess).', 'Zeige Prozesse: <code>ps</code> oder <code>top</code>. Suche <code>cnc_sim</code> mit PID 909.', 'Stoppe den Übeltäter: <code>kill 909</code>.', 'Rede mit Tom: <code>talk tom</code> und prüfe mit <code>quests</code>.' ], hint:'Erklärung: Für den Questabschluss muss der Prozess cnc_sim gekillt werden.' },
  cms: { subtitle:"Komplette CMS-Abnahme mappe bauen.", steps:[ 'Lege die Struktur an: <code>mkdir ~/workbench/cms/{elektro,fliesen,dach,sanitaer,maler,abnahme}</code>.', 'Hole die fünf Codes: <code>cat /school/technikraum/ersatzteile/verteilerplan.txt</code>, <code>cat /school/kunstraum/kacheln.txt</code>, <code>cat /real_life/ars_recycling/platzplan.txt</code>, <code>cat /school/physik/materialschrank/rohrdruck.txt</code>, <code>cat /school/medienraum/ausleihe/farbrolle.txt</code>.', 'Schreibe je Bereich eine Datei (Beispiel): <code>echo "SICHERUNGSLABEL: CMS-EL-2048" > ~/workbench/cms/elektro/bericht.txt</code> (analog für fliesen/dach/sanitaer/maler) und sammle alle Codes in <code>~/workbench/cms/abnahme/uebersicht.txt</code>.', 'Melde bei Holger: <code>talk holger</code> und prüfe den Abschluss mit <code>quests</code>.' ], hint:'Erklärung: CMS ist nur fertig, wenn alle fünf Bereichsberichte plus die Abnahme-Übersicht vollständig sind.' },
  jobangebot: { subtitle:"Finales Jobangebot einsammeln.", steps:[ 'Prüfe, dass alle fünf Firmenquests auf ✅ stehen: <code>quests</code>.', 'Geh zurück ins Arbeitsamt: <code>cd /arbeitsamt</code>.', 'Triggere den Abschluss beim NPC: <code>talk beamter</code>.', 'Lies das Ergebnis: <code>cat /arbeitsamt/jobangebot.txt</code> und bestätige mit <code>quests</code>.' ], hint:'Erklärung: Das Jobangebot wird erst erzeugt, wenn SNACKMASTER, ARS, Ohlendorf, Berndt und CMS erledigt sind.' }
};

function getCurrentMainObjective(){
  const list = OBJECTIVES.filter((o)=>o.phase===state.phase);
  return list.find((o)=>!o.done(state)) || null;
}

const CLIPPY_COOLDOWN_MS = 5 * 60 * 1000;

function ensureClippyState(){
  if(!state.clippy || typeof state.clippy !== "object") state.clippy = { lastUsedAt: 0, usageCount: 0 };
  if(!Number.isFinite(Number(state.clippy.lastUsedAt))) state.clippy.lastUsedAt = 0;
  if(!Number.isFinite(Number(state.clippy.usageCount))) state.clippy.usageCount = 0;
}

function getClippyCooldownRemainingMs(){
  ensureClippyState();
  const elapsed = Date.now() - Number(state.clippy.lastUsedAt || 0);
  return Math.max(0, CLIPPY_COOLDOWN_MS - elapsed);
}

function formatCooldown(ms){
  const totalSec = Math.ceil(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function renderClippyAvailability(){
  const btn = el("clippyHelperBtn");
  const status = el("clippyStatus");
  const usage = el("clippyUsage");
  if(!btn || !status) return;

  ensureClippyState();
  if(usage) usage.textContent = `Nutzungen: ${Math.max(0, Number(state.clippy.usageCount)||0)}`;

  const remaining = getClippyCooldownRemainingMs();
  const hasObjective = !!getCurrentMainObjective();
  const isCooldown = remaining > 0;

  btn.classList.toggle("isCooldown", isCooldown);
  status.classList.remove("isReady", "isCooldown");

  if(!hasObjective){
    btn.disabled = true;
    btn.textContent = "📎 Clippy Helfer";
    status.textContent = "Status: aktuell keine Mainquest aktiv";
    status.classList.add("isCooldown");
    return;
  }

  if(isCooldown){
    btn.disabled = true;
    btn.textContent = `📎 Clippy Cooldown (${formatCooldown(remaining)})`;
    status.textContent = `Status: Cooldown aktiv · Restzeit ${formatCooldown(remaining)}`;
    status.classList.add("isCooldown");
    return;
  }

  btn.disabled = false;
  btn.textContent = "📎 Clippy Helfer";
  status.textContent = "Status: bereit";
  status.classList.add("isReady");
}

function buildClippyContent(){
  const current = getCurrentMainObjective();
  if(!current) return null;
  const key = objectiveKey(current);
  const template = CLIPPY_SOLUTIONS[key] || {
    subtitle:"Für diese Quest gibt es aktuell eine allgemeine Musterstrategie.",
    steps:[
      'Lies zuerst den Quest-Hinweis komplett und markiere das Zielverb (z.B. finden, lesen, kopieren, ausführen).',
      'Nutze den Standardablauf: <code>pwd</code> → <code>ls</code> → <code>cat relevante_datei</code>.',
      'Wenn etwas gesucht werden muss: <code>find</code> und <code>grep -n</code> kombinieren, dann Ergebnis in die Workbench sichern.',
      'Nach jedem Schritt sofort mit <code>quests</code> kontrollieren, ob die Quest bereits als erledigt markiert wurde.'
    ],
    hint:'Erklärung: Die meisten Mainquests folgen demselben Lernmuster aus Navigation, Analyse und sauberer Ausführung.'
  };
  return { key, objective: current, template };
}

function getOpenClippyObjectiveKey(){
  const tooltip = el("clippyTooltip");
  if(!tooltip) return "";
  return String(tooltip.dataset.objectiveKey || "");
}

function getOpenClippyObjectiveTitle(){
  const tooltip = el("clippyTooltip");
  if(!tooltip) return "";
  return String(tooltip.dataset.objectiveTitle || "");
}

function positionClippyTooltip(){
  const tooltip = el("clippyTooltip");
  const btn = el("clippyHelperBtn");
  if(!tooltip || !btn || tooltip.hidden) return;
  const r = btn.getBoundingClientRect();
  const top = Math.min(window.innerHeight - tooltip.offsetHeight - 12, r.bottom + 10);
  const left = Math.min(window.innerWidth - tooltip.offsetWidth - 12, Math.max(12, r.right - tooltip.offsetWidth));
  tooltip.style.top = `${Math.max(12, top)}px`;
  tooltip.style.left = `${left}px`;
}

function closeClippyTooltip(){
  const tooltip = el("clippyTooltip");
  const btn = el("clippyHelperBtn");
  if(!tooltip || !btn) return;
  tooltip.hidden = true;
  tooltip.style.top = "";
  tooltip.style.left = "";
  delete tooltip.dataset.objectiveKey;
  delete tooltip.dataset.objectiveTitle;
  btn.setAttribute("aria-expanded", "false");
}

function showClippyTooltip(){
  const tooltip = el("clippyTooltip");
  const btn = el("clippyHelperBtn");
  if(!tooltip || !btn) return;
  const remaining = getClippyCooldownRemainingMs();
  if(remaining > 0){
    closeClippyTooltip();
    return;
  }
  const payload = buildClippyContent();
  if(!payload){
    closeClippyTooltip();
    return;
  }
  const { key, objective, template } = payload;

  // Difficulty entscheidet, ob die Schritt-Lösung direkt sichtbar ist (Story-Modus)
  // oder erst auf Knopfdruck (Classic). Hardcore blendet Clippy schon im Header aus.
  const difficulty = (state.settings && state.settings.difficulty) || "classic";
  const showStepsImmediately = difficulty === "story";

  const stepsHtml = template.steps.map((step)=>`<li>${step}</li>`).join("");
  tooltip.innerHTML = `
    <h3 class="clippyTitle">📎 Clippy Helfer für [${escapeHtml(key)}]</h3>
    <p class="clippySub"><strong>${escapeHtml(objective.title)}</strong><br>${escapeHtml(template.subtitle)}</p>
    <div class="clippyHintBlock"><strong>Tipp ohne Spoiler:</strong> ${escapeHtml(template.hint)}</div>
    <ol class="clippySteps" id="clippyStepsList" ${showStepsImmediately ? "" : "hidden"}>${stepsHtml}</ol>
    <div class="clippyActions">
      <button class="btn" id="clippyRevealBtn" type="button" ${showStepsImmediately ? 'hidden' : ''}>Lösung anzeigen</button>
      <button class="btn" id="clippyCloseBtn" type="button">Okay</button>
    </div>
  `;
  tooltip.hidden = false;
  tooltip.dataset.objectiveKey = key;
  tooltip.dataset.objectiveTitle = objective.title;
  btn.setAttribute("aria-expanded", "true");

  ensureClippyState();
  state.clippy.lastUsedAt = Date.now();
  state.clippy.usageCount = Math.max(0, Number(state.clippy.usageCount)||0) + 1;
  saveState();
  renderClippyAvailability();

  const closeBtn = el("clippyCloseBtn");
  if(closeBtn) closeBtn.addEventListener("click", closeClippyTooltip);
  const revealBtn = el("clippyRevealBtn");
  if(revealBtn){
    revealBtn.addEventListener("click", ()=>{
      const list = el("clippyStepsList");
      if(list) list.hidden = false;
      revealBtn.hidden = true;
      requestAnimationFrame(positionClippyTooltip);
    });
  }
  requestAnimationFrame(positionClippyTooltip);
}

function syncClippyTooltip(){
  renderClippyAvailability();
  const tooltip = el("clippyTooltip");
  if(!tooltip || tooltip.hidden) return;
  const payload = buildClippyContent();
  if(!payload){
    closeClippyTooltip();
    return;
  }
  if(payload.key !== getOpenClippyObjectiveKey()){
    closeClippyTooltip();
    return;
  }
  if(payload.objective.title !== getOpenClippyObjectiveTitle()){
    closeClippyTooltip();
    return;
  }
  positionClippyTooltip();
}

function openCinematicIntro(){
  const overlay = el("cinematicIntroOverlay");
  const text = el("cinematicIntroText");
  const continueBtn = el("cinematicIntroContinue");
  const skipBtn = el("cinematicIntroSkip");
  if(!overlay || !text || !continueBtn || !skipBtn){
    startNewGuidedGame();
    return;
  }

  cinematicIntroStep = 0;
  text.textContent = CINEMATIC_INTRO_LINES[cinematicIntroStep] || "";
  continueBtn.textContent = "Weiter";
  overlay.hidden = false;

  continueBtn.onclick = ()=>{
    cinematicIntroStep += 1;
    const nextLine = CINEMATIC_INTRO_LINES[cinematicIntroStep];
    if(nextLine){
      text.textContent = nextLine;
      if(cinematicIntroStep >= CINEMATIC_INTRO_LINES.length - 1){
        continueBtn.textContent = "Spiel starten";
      }
      return;
    }
    closeCinematicIntro();
    startNewGuidedGame();
  };

  skipBtn.onclick = ()=>{
    closeCinematicIntro();
    startNewGuidedGame();
  };

  continueBtn.focus();
}

function closeCinematicIntro(){
  const overlay = el("cinematicIntroOverlay");
  const text = el("cinematicIntroText");
  const continueBtn = el("cinematicIntroContinue");
  const skipBtn = el("cinematicIntroSkip");
  if(continueBtn) continueBtn.onclick = null;
  if(skipBtn) skipBtn.onclick = null;
  if(text) text.textContent = "—";
  if(overlay) overlay.hidden = true;
  cinematicIntroStep = 0;
}

function beginNewGameFlow(){
  closeStartModal();
  openCinematicIntro();
}

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

function formatTutorialText(text){
  const escaped = escapeHtml(text);
  return escaped.replace(/&quot;([^&]+?)&quot;/g, '<span class="tutorialCommand">$1</span>');
}

function showTutorialBubble(text, buttonText, onClick, opts={}){
  const overlay = el("tutorialOverlay");
  const bubble = el("tutorialBubble");
  overlay.hidden = false;
  bubble.hidden = false;
  el("tutorialText").innerHTML = formatTutorialText(text);
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
    syncClippyTooltip();
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
  syncClippyTooltip();

  const ps = document.getElementById("printStatus");
  if(ps){
    if(Number(state.phase) >= 5){
      ps.hidden = true;
    }else if(state.flags && state.flags.system_fixed){
      ps.hidden = false;
      ps.textContent = "✅ Druckdienste online — Zeugnisse verfügbar.";
      ps.classList.remove("warnInline");
      ps.classList.add("okInline");
    } else {
      ps.hidden = false;
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

function showSavegamePanel(phrase){
  const overlay = el("savegameOverlay");
  const out = el("savegamePhraseOutput");
  const hint = el("savegamePanelHint");
  if(!overlay || !out || !hint) return;
  out.value = phrase;
  hint.textContent = "Tipp: Mit Kopieren oder Export musst du auf mobilen Geräten nichts manuell markieren.";
  overlay.hidden = false;
  out.focus();
  out.select();
}

function closeSavegamePanel(){
  const overlay = el("savegameOverlay");
  if(overlay) overlay.hidden = true;
}

async function copySavegamePhrase(){
  const out = el("savegamePhraseOutput");
  const hint = el("savegamePanelHint");
  if(!out || !hint) return;
  const phrase = String(out.value || "");
  if(!phrase){
    hint.textContent = "Es ist noch keine Passphrase vorhanden.";
    return;
  }

  if(navigator.clipboard && typeof navigator.clipboard.writeText === "function"){
    try{
      await navigator.clipboard.writeText(phrase);
      hint.textContent = "✅ Passphrase in die Zwischenablage kopiert.";
      return;
    }catch(_err){
      // fallback below
    }
  }

  out.focus();
  out.select();
  hint.textContent = "⚠️ Automatisches Kopieren nicht verfügbar. Bitte manuell kopieren (Strg/Cmd + C).";
}

function exportSavegamePhrase(){
  const out = el("savegamePhraseOutput");
  const hint = el("savegamePanelHint");
  if(!out || !hint) return;
  const phrase = String(out.value || "");
  if(!phrase){
    hint.textContent = "Es ist noch keine Passphrase vorhanden.";
    return;
  }
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `schwarmshell-savegame-${ts}.txt`;
  const blob = new Blob([`SchwarmShell Savegame Passphrase

${phrase}
`], { type:"text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  hint.textContent = `✅ Export gestartet (${fileName}).`;
}

const RESET_UNDO_STORAGE_KEY = "schwarmshell_reset_undo_snapshot_v1";
const RESET_UNDO_WINDOW_MS = 10_000;
const AUTOSAVE_STORAGE_KEY = (typeof STORAGE_KEY === "string" && STORAGE_KEY) ? STORAGE_KEY : "schwarmshell_all_phases_v5";
let resetUndoTimer = null;

function readResetUndoSnapshot(){
  try{
    const raw = localStorage.getItem(RESET_UNDO_STORAGE_KEY);
    if(!raw) return null;
    const parsed = JSON.parse(raw);
    if(!parsed || typeof parsed !== "object") return null;
    if(!parsed.passphrase || !parsed.expiresAt) return null;
    if(Date.now() > Number(parsed.expiresAt)){
      localStorage.removeItem(RESET_UNDO_STORAGE_KEY);
      return null;
    }
    return parsed;
  }catch(_err){
    localStorage.removeItem(RESET_UNDO_STORAGE_KEY);
    return null;
  }
}

function clearResetUndoState(){
  localStorage.removeItem(RESET_UNDO_STORAGE_KEY);
  if(resetUndoTimer){
    clearTimeout(resetUndoTimer);
    resetUndoTimer = null;
  }
  const resetBtn = el("reset");
  if(resetBtn) resetBtn.textContent = "Reset";
}

function startResetUndoWindow(snapshot){
  const expiresAt = Date.now() + RESET_UNDO_WINDOW_MS;
  localStorage.setItem(RESET_UNDO_STORAGE_KEY, JSON.stringify({
    passphrase: snapshot.passphrase,
    autosaveRaw: snapshot.autosaveRaw,
    expiresAt
  }));

  const resetBtn = el("reset");
  if(resetBtn) resetBtn.textContent = "Undo Reset (10s)";

  if(resetUndoTimer) clearTimeout(resetUndoTimer);
  resetUndoTimer = setTimeout(()=>{
    clearResetUndoState();
  }, RESET_UNDO_WINDOW_MS + 50);
}

function tryUndoReset(){
  const snapshot = readResetUndoSnapshot();
  if(!snapshot) return false;

  const shouldUndo = confirm("Letzten Reset rückgängig machen? Der Spielstand vor dem Reset wird wiederhergestellt.");
  if(!shouldUndo) return true;

  const restored = loadStateFromPassphrase(snapshot.passphrase);
  if(!restored.ok){
    row("⚠️ Undo fehlgeschlagen: Snapshot konnte nicht geladen werden.", "warn");
    clearResetUndoState();
    return true;
  }

  if(snapshot.autosaveRaw){
    localStorage.setItem(AUTOSAVE_STORAGE_KEY, snapshot.autosaveRaw);
  }
  clearResetUndoState();
  term.innerHTML = "";
  bootLoadSource = "Undo";
  boot();
  return true;
}

function requestResetWithSafety(){
  if(tryUndoReset()) return;

  const confirmed = confirm("Willst du wirklich resetten? Dabei wird dein Autosave gelöscht und dein Fortschritt geht verloren.");
  if(!confirmed) return;

  const wantsBackup = confirm("Optional: Vor dem Reset eine Backup-Passphrase erzeugen?");
  if(wantsBackup){
    const phrase = createSavePassphrase();
    showSavegamePanel(phrase);
    const continueReset = confirm("Backup-Passphrase wurde erzeugt. Jetzt wirklich resetten?");
    if(!continueReset) return;
  }

  const snapshot = {
    passphrase: createSavePassphrase(),
    autosaveRaw: localStorage.getItem(AUTOSAVE_STORAGE_KEY)
  };

  doReset(true);
  startResetUndoWindow(snapshot);
  row("↩️ Undo verfügbar: 10 Sekunden über den Reset-Button.", "p");
}

el("startNew").addEventListener("click", beginNewGameFlow);

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
    el("savegameLoadError").textContent = `${result.error} Beispiel für gültiges Format: SS1...`;
    return;
  }
  closeStartModal();
  el("savegameLoad").hidden = true;
  bootLoadSource = "Savegame";
  boot();
});

el("savegamePassphrase").addEventListener("keydown", (e)=>{
  if(e.key !== "Enter") return;
  e.preventDefault();
  el("savegameConfirm").click();
});

el("run").addEventListener("click", ()=>{
  const v = cmdInput.value;
  cmdInput.value = "";
  runLine(v);
});
el("reset").addEventListener("click", requestResetWithSafety);
el("savegame").addEventListener("click", ()=>{
  const phrase = createSavePassphrase();
  row("🔐 Savegame-Passphrase erstellt.", "ok");
  showSavegamePanel(phrase);
});

el("savegamePanelClose").addEventListener("click", closeSavegamePanel);
el("savegameCopy").addEventListener("click", ()=>{ copySavegamePhrase(); });
el("savegameExport").addEventListener("click", exportSavegamePhrase);

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
    cmdInput._tabState = cmdInput._tabState || { source:"", index:-1, candidates:[], kind:"", activePrefix:"" };
    const tabState = cmdInput._tabState;

    const canContinueCycle = tabState.candidates.length > 1 && (
      (tabState.kind === "path" && tabState.candidates.some((candidate)=>`${tabState.activePrefix}${candidate}` === cmdInput.value)) ||
      (tabState.kind !== "path" && tabState.candidates.includes(cmdInput.value))
    );

    if(canContinueCycle){
      tabState.index = (tabState.index + 1) % tabState.candidates.length;
      if(tabState.kind === "path"){
        cmdInput.value = `${tabState.activePrefix}${tabState.candidates[tabState.index]}`;
      }else{
        cmdInput.value = tabState.candidates[tabState.index];
      }
      e.preventDefault();
      return;
    }

    const auto = autocomplete(cmdInput.value);
    if(!auto){
      e.preventDefault();
      return;
    }

    const candidates = Array.isArray(auto.candidates) ? auto.candidates : [];

    if(auto.replacement){
      cmdInput.value = auto.replacement;
      tabState.source = "";
      tabState.index = -1;
      tabState.candidates = [];
      tabState.kind = "";
      tabState.activePrefix = "";
      e.preventDefault();
      return;
    }

    if(candidates.length > 1){
      if(tabState.source === cmdInput.value && tabState.candidates.join("\x00") === candidates.join("\x00")){
        tabState.index = (tabState.index + 1) % candidates.length;
      }else{
        tabState.source = cmdInput.value;
        tabState.index = 0;
        tabState.candidates = candidates.slice();
        tabState.kind = auto.kind || "";
        tabState.activePrefix = auto.activePrefix || "";
        const preview = candidates.slice(0, 12).join("   ");
        const suffix = candidates.length > 12 ? `   … +${candidates.length - 12} weitere` : "";
        row(`Tab-Kandidaten (${candidates.length}): ${preview}${suffix}`, "muted");
      }

      if(auto.kind === "path"){
        cmdInput.value = `${auto.activePrefix}${tabState.candidates[tabState.index]}`;
      }else{
        cmdInput.value = tabState.candidates[tabState.index];
      }
    }
    e.preventDefault();
    return;
  }

  if(cmdInput._tabState){
    cmdInput._tabState.source = "";
    cmdInput._tabState.index = -1;
    cmdInput._tabState.candidates = [];
    cmdInput._tabState.kind = "";
    cmdInput._tabState.activePrefix = "";
  }
});

const clippyBtn = el("clippyHelperBtn");
if(clippyBtn){
  clippyBtn.addEventListener("click", ()=>{
    renderClippyAvailability();
    const tooltip = el("clippyTooltip");
    if(tooltip && !tooltip.hidden){
      closeClippyTooltip();
      return;
    }
    showClippyTooltip();
  });
}
window.addEventListener("resize", ()=>{
  positionClippyTooltip();
});

setInterval(()=>{
  renderClippyAvailability();
}, 1000);
renderClippyAvailability();

// ============================================================================
//  Audio-Feedback (Web Audio API, kein Asset-Download)
// ============================================================================
let _audioCtx = null;
function getAudioCtx(){
  if(_audioCtx) return _audioCtx;
  try{
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if(!Ctx) return null;
    _audioCtx = new Ctx();
    return _audioCtx;
  }catch(_e){ return null; }
}
function playBeep(kind){
  try{
    if(!state || !state.settings || state.settings.audio !== true) return;
    const ctx = getAudioCtx();
    if(!ctx) return;
    if(ctx.state === "suspended"){ try{ ctx.resume(); }catch(_e){} }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    let freq = 660, dur = 0.12;
    if(kind === "success"){ freq = 880; dur = 0.16; }
    else if(kind === "warn"){ freq = 300; dur = 0.18; }
    else if(kind === "info"){ freq = 520; dur = 0.10; }
    osc.type = "triangle";
    osc.frequency.value = freq;
    gain.gain.value = 0.0001;
    const t0 = ctx.currentTime;
    gain.gain.exponentialRampToValueAtTime(0.12, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
    if(kind === "success"){
      // kleiner Aufstieg: 2. Ton
      setTimeout(()=>{
        try{
          const osc2 = ctx.createOscillator();
          const g2 = ctx.createGain();
          osc2.connect(g2); g2.connect(ctx.destination);
          osc2.type = "triangle";
          osc2.frequency.value = 1175;
          const tt = ctx.currentTime;
          g2.gain.value = 0.0001;
          g2.gain.exponentialRampToValueAtTime(0.10, tt + 0.01);
          g2.gain.exponentialRampToValueAtTime(0.0001, tt + 0.16);
          osc2.start(tt);
          osc2.stop(tt + 0.18);
        }catch(_e){}
      }, 130);
    }
  }catch(_e){}
}
window.playBeep = playBeep;

// ============================================================================
//  Settings-Anwendung (Difficulty / Reduced Motion / Audio)
// ============================================================================
function applySettings(){
  try{
    if(!state.settings) return;
    document.body.classList.toggle("reducedMotion", !!state.settings.reducedMotion);
    // Difficulty wirkt auf Clippy-Sichtbarkeit. In Hardcore: Clippy-Button blenden wir aus
    // (Spieler bekommt nur die fest eingebaute `hint`-Funktion ohne Schritt-Lösung).
    const clippyBtn = el("clippyHelperBtn");
    const clippyUsage = el("clippyUsage");
    const clippyStatus = el("clippyStatus");
    if(clippyBtn){
      const hide = state.settings.difficulty === "hardcore";
      clippyBtn.hidden = hide;
      if(clippyUsage) clippyUsage.hidden = hide;
      if(clippyStatus) clippyStatus.hidden = hide;
      if(hide){
        const tt = el("clippyTooltip");
        if(tt) tt.hidden = true;
      }
    }
    // i18n: Settings-Panel-Labels aktualisieren
    applyLocale();
  }catch(_e){}
}

// applyLocale: schreibt die übersetzten Strings in die statischen UI-Labels.
// Bewusst defensiv (Element-checks), weil die Seite auch im "Spieler hat alles
// kaputt"-Modus noch laden soll.
function applyLocale(){
  try{
    if(!window.t) return;
    const set = (id, text)=>{ const el2 = el(id); if(el2) el2.textContent = text; };
    set("settingsTitle", t("settings.title"));
    set("settingsClose", t("settings.close"));
    set("settingsReplayLabel", t("settings.replay"));
    set("settingsReplayDesc", t("settings.replay.desc"));
    set("settingsLanguageLabel", t("settings.language"));
    set("settingsLanguageDesc", t("settings.language.desc"));
    // Difficulty-Buttons
    const diffLabels = {
      story: t("settings.difficulty.story"),
      classic: t("settings.difficulty.classic"),
      hardcore: t("settings.difficulty.hardcore")
    };
    document.querySelectorAll('[data-difficulty]').forEach((btn)=>{
      const k = btn.dataset.difficulty;
      if(diffLabels[k]) btn.textContent = diffLabels[k];
    });
    // Locale-Toggles
    document.querySelectorAll('[data-locale]').forEach((btn)=>{
      const isActive = (state.settings && state.settings.locale) === btn.dataset.locale;
      btn.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
    // Update audio/motion toggles' text
    const audioBtn = el("settingsAudioToggle");
    if(audioBtn){
      const on = !!(state.settings && state.settings.audio);
      audioBtn.textContent = on ? t("settings.sound.on") : t("settings.sound.off");
    }
    const rmBtn = el("settingsReducedMotion");
    if(rmBtn){
      const on = !!(state.settings && state.settings.reducedMotion);
      rmBtn.textContent = on ? t("settings.motion.on") : t("settings.motion.off");
    }
    // Reset-Concepts-Button
    const resetBtn = el("settingsResetConcepts");
    if(resetBtn) resetBtn.textContent = t("settings.concepts.reset");
    // Phase-Pill neu schreiben (nutzt t() jetzt indirekt über renderPhasePill)
    if(typeof renderPhasePill === "function") renderPhasePill();
  }catch(_e){}
}

// ============================================================================
//  Settings-Modal
// ============================================================================
function openSettingsModal(){
  const ov = el("settingsOverlay");
  if(!ov) return;
  // Buttons synchronisieren mit aktuellem State
  const diff = (state.settings && state.settings.difficulty) || "classic";
  document.querySelectorAll('[data-difficulty]').forEach((btn)=>{
    btn.setAttribute("aria-pressed", btn.dataset.difficulty === diff ? "true" : "false");
  });
  const audioBtn = el("settingsAudioToggle");
  if(audioBtn){
    const on = !!(state.settings && state.settings.audio);
    audioBtn.setAttribute("aria-pressed", on ? "true" : "false");
    audioBtn.textContent = `Sound: ${on ? "an" : "aus"}`;
  }
  const rmBtn = el("settingsReducedMotion");
  if(rmBtn){
    const on = !!(state.settings && state.settings.reducedMotion);
    rmBtn.setAttribute("aria-pressed", on ? "true" : "false");
    rmBtn.textContent = `Reduzierte Bewegung: ${on ? "an" : "aus"}`;
  }
  ov.hidden = false;
}
function closeSettingsModal(){
  const ov = el("settingsOverlay");
  if(ov) ov.hidden = true;
}

// ============================================================================
//  Konzept-Karten (kurze Inline-Tutorials zu Permissions, Prozessen, Pipes)
//  Werden beim allerersten Auftreten gezeigt — Settings → "wieder zeigen" resettet.
// ============================================================================
const CONCEPT_CARDS = {
  permissions: {
    kicker: "Was sind Permissions?",
    title: "Datei-Rechte: rwx, Owner / Group / Others",
    body: "Jede Datei hat drei Rechte-Blöcke: für dich (Owner), deine Gruppe und alle anderen. Jeder Block hat drei Bits: r (lesen), w (schreiben), x (ausführen). Die Zahl 644 bedeutet z.B. rw-r--r-- — du darfst lesen und schreiben, der Rest nur lesen. 755 = rwxr-xr-x (du darfst zusätzlich ausführen). chmod ändert genau diese Bits.",
    example: "chmod +x script.sh      # exec-Bit setzen\nchmod 644 notiz.txt    # rw-r--r--\nchmod 755 hack.sh      # rwxr-xr-x",
    hint: "Im echten Linux gibt's noch chown/chgrp und Sonder-Bits wie setuid — die brauchst du jetzt aber nicht."
  },
  processes: {
    kicker: "Was ist ein Prozess?",
    title: "Prozesse: Programme, die gerade laufen",
    body: "Wenn du ein Programm startest, läuft es als 'Prozess' im RAM mit einer eindeutigen PID (Process ID). ps listet diese Prozesse auf, top sortiert nach CPU-Last. kill schickt einem Prozess ein Signal — Standard ist SIGTERM (sanft beenden), -9 ist SIGKILL (sofort, hart).",
    example: "ps                  # alle Prozesse\ntop                 # nach CPU sortiert\nkill 1337           # PID 1337 sanft beenden\nkill -9 1337        # PID 1337 hart killen",
    hint: "Im Spiel sind die Prozesse simuliert — auf echtem Linux siehst du Hunderte. Hilfreich bei Lags oder hängenden Programmen."
  },
  pipes: {
    kicker: "Was ist eine Pipe?",
    title: "Pipes (|): Output → Input verketten",
    body: "Mit | leitest du die Ausgabe eines Befehls direkt als Eingabe in den nächsten. Das ist der Kern der Unix-Philosophie: kleine Tools kombinieren statt einen Riesen-Befehl. cat datei.txt | grep error filtert nur die Zeilen mit 'error'. Im Spiel sind max. 2 Pipes erlaubt.",
    example: 'cat readme.txt | grep "FRAG"\nls | grep .log\necho "hi" | grep h',
    hint: "Verwandt: > schreibt Output in eine Datei, >> hängt an. Beispiel: ls > liste.txt"
  },
  redirects: {
    kicker: "Was sind Redirects?",
    title: "Output umleiten: > und >>",
    body: "Statt im Terminal zu landen, kann die Ausgabe eines Befehls in eine Datei umgeleitet werden. > überschreibt die Datei, >> hängt ans Ende an. So baust du Logs oder Patch-Dateien.",
    example: 'echo "hi" > greeting.txt    # Datei wird neu geschrieben\necho "noch eine zeile" >> greeting.txt    # angehängt',
    hint: "Aufpassen: > überschreibt ohne Rückfrage. Lieber zweimal lesen, bevor du das auf wichtige Dateien anwendest."
  }
};

function showConceptCard(key){
  try{
    if(!CONCEPT_CARDS[key]) return;
    if(!state.settings) state.settings = { conceptsSeen:{}, conceptsDisabled:false };
    if(state.settings.conceptsDisabled) return;
    if(state.settings.conceptsSeen && state.settings.conceptsSeen[key]) return;
    const card = CONCEPT_CARDS[key];
    const overlay = el("conceptOverlay");
    if(!overlay) return;
    el("conceptKicker").textContent = card.kicker;
    el("conceptTitle").textContent = card.title;
    el("conceptBody").textContent = card.body;
    el("conceptExample").textContent = card.example;
    el("conceptHint").textContent = card.hint;
    overlay.dataset.conceptKey = key;
    overlay.hidden = false;
    const contBtn = el("conceptContinue");
    if(contBtn) contBtn.focus();
  }catch(_e){}
}
function closeConceptCard(){
  const overlay = el("conceptOverlay");
  if(!overlay) return;
  const key = overlay.dataset.conceptKey;
  if(key){
    if(!state.settings) state.settings = { conceptsSeen:{}, conceptsDisabled:false };
    if(!state.settings.conceptsSeen) state.settings.conceptsSeen = {};
    state.settings.conceptsSeen[key] = true;
    saveState();
  }
  overlay.hidden = true;
  delete overlay.dataset.conceptKey;
}
window.showConceptCard = showConceptCard;

// ============================================================================
//  Replay-Modal — zeigt mitgeschnittene Befehle + Ausgaben
// ============================================================================
function openReplayModal(){
  const ov = el("replayOverlay");
  if(!ov) return;
  const body = el("replayBody");
  const meta = el("replayMeta");
  const log = Array.isArray(state.replayLog) ? state.replayLog : [];
  if(!log.length){
    body.textContent = "(Noch kein Replay vorhanden — spiel ein paar Befehle, dann schau wieder vorbei.)";
    meta.textContent = "0 Zeilen";
  }else{
    const inputs = log.filter(e=>e.kind==="input").length;
    meta.textContent = `${log.length} Zeilen · ${inputs} Eingaben`;
    body.innerHTML = log.map((e)=>{
      const txt = escapeHtml(e.text);
      if(e.kind === "input"){
        return `<span class="replayLine input"><span class="replayCaret">›</span>${txt}</span>`;
      }
      return `<span class="replayLine output">${txt}</span>`;
    }).join("\n");
  }
  ov.hidden = false;
}
function closeReplayModal(){
  const ov = el("replayOverlay");
  if(ov) ov.hidden = true;
}
async function copyReplayToClipboard(){
  try{
    const log = Array.isArray(state.replayLog) ? state.replayLog : [];
    const text = log.map(e => (e.kind==="input" ? `> ${e.text}` : e.text)).join("\n");
    if(navigator.clipboard && typeof navigator.clipboard.writeText === "function"){
      await navigator.clipboard.writeText(text);
      toast("Replay in die Zwischenablage kopiert.", { type:"success" });
    }else{
      toast("Automatisches Kopieren nicht verfügbar.", { type:"warn" });
    }
  }catch(_e){
    toast("Kopieren fehlgeschlagen.", { type:"warn" });
  }
}

// ============================================================================
//  Phase-6 Skript-Editor — schreibt eigene Bash-Skripte in einem Modal
// ============================================================================
function openScriptEditor(path, initialContent){
  const overlay = el("editorOverlay");
  const ta = el("editorTextarea");
  const pathLabel = el("editorPath");
  if(!overlay || !ta) return;
  ta.value = String(initialContent || "");
  if(pathLabel) pathLabel.textContent = path;
  overlay.dataset.editPath = path;
  overlay.hidden = false;
  setTimeout(()=>ta.focus(), 50);
}
window.openScriptEditor = openScriptEditor;

function closeScriptEditor(){
  const overlay = el("editorOverlay");
  if(!overlay) return;
  overlay.hidden = true;
  delete overlay.dataset.editPath;
}

function saveScriptEditor(){
  const overlay = el("editorOverlay");
  const ta = el("editorTextarea");
  if(!overlay || !ta) return;
  const path = overlay.dataset.editPath;
  if(!path) return;
  const content = String(ta.value || "");
  // writeFile ist im fs.js-Scope global verfügbar (kein type=module)
  const result = (typeof writeFile === "function") ? writeFile(path, content, false) : { ok:false, err:"writeFile fehlt" };
  if(!result.ok){
    toast(`Editor: ${result.err}`, { type:"warn" });
    return;
  }
  closeScriptEditor();
  toast(`${path} gespeichert.`, { type:"success" });
  // Phase-6-Trigger sofort prüfen, damit Spieler*innen direkt Feedback bekommen
  if(typeof window.evaluateScriptQuests === "function") window.evaluateScriptQuests();
  if(typeof renderObjectives === "function") renderObjectives();
}

const _editorSave = el("editorSave");
if(_editorSave) _editorSave.addEventListener("click", saveScriptEditor);
const _editorCancel = el("editorCancel");
if(_editorCancel) _editorCancel.addEventListener("click", closeScriptEditor);
// Strg/Cmd+S im Editor speichert; Esc schließt
document.addEventListener("keydown", (e)=>{
  const overlay = el("editorOverlay");
  if(!overlay || overlay.hidden) return;
  if((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S")){
    e.preventDefault();
    saveScriptEditor();
  } else if(e.key === "Escape"){
    closeScriptEditor();
  }
});

// ============================================================================
//  Event-Wiring für all die neuen UI-Elemente
// ============================================================================
const _settingsBtn = el("settingsBtn");
if(_settingsBtn) _settingsBtn.addEventListener("click", openSettingsModal);
const _settingsClose = el("settingsClose");
if(_settingsClose) _settingsClose.addEventListener("click", closeSettingsModal);
const _settingsOverlay = el("settingsOverlay");
if(_settingsOverlay){
  _settingsOverlay.addEventListener("click", (e)=>{
    if(e.target === _settingsOverlay) closeSettingsModal();
  });
}

document.querySelectorAll('[data-difficulty]').forEach((btn)=>{
  btn.addEventListener("click", ()=>{
    const d = btn.dataset.difficulty;
    if(!["story","classic","hardcore"].includes(d)) return;
    state.settings.difficulty = d;
    saveState();
    document.querySelectorAll('[data-difficulty]').forEach((b)=>{
      b.setAttribute("aria-pressed", b.dataset.difficulty === d ? "true" : "false");
    });
    applySettings();
    const labelKey = "settings.difficulty." + d;
    toast(t("toast.difficulty", t(labelKey)), { type:"info" });
  });
});

document.querySelectorAll('[data-locale]').forEach((btn)=>{
  btn.addEventListener("click", ()=>{
    const loc = btn.dataset.locale;
    if(!["de","en"].includes(loc)) return;
    state.settings.locale = loc;
    saveState();
    applySettings();
  });
});

const _audioBtn = el("settingsAudioToggle");
if(_audioBtn){
  _audioBtn.addEventListener("click", ()=>{
    state.settings.audio = !state.settings.audio;
    saveState();
    _audioBtn.setAttribute("aria-pressed", state.settings.audio ? "true" : "false");
    _audioBtn.textContent = `Sound: ${state.settings.audio ? "an" : "aus"}`;
    if(state.settings.audio) playBeep("info");
  });
}
const _rmBtn = el("settingsReducedMotion");
if(_rmBtn){
  _rmBtn.addEventListener("click", ()=>{
    state.settings.reducedMotion = !state.settings.reducedMotion;
    saveState();
    _rmBtn.setAttribute("aria-pressed", state.settings.reducedMotion ? "true" : "false");
    _rmBtn.textContent = `Reduzierte Bewegung: ${state.settings.reducedMotion ? "an" : "aus"}`;
    applySettings();
  });
}
const _resetConcepts = el("settingsResetConcepts");
if(_resetConcepts){
  _resetConcepts.addEventListener("click", ()=>{
    state.settings.conceptsSeen = {};
    state.settings.conceptsDisabled = false;
    saveState();
    toast("Konzept-Karten werden beim nächsten Anlass wieder gezeigt.", { type:"info" });
  });
}
const _replayBtn = el("settingsReplay");
if(_replayBtn) _replayBtn.addEventListener("click", ()=>{ closeSettingsModal(); openReplayModal(); });
const _replayClear = el("settingsReplayClear");
if(_replayClear){
  _replayClear.addEventListener("click", ()=>{
    state.replayLog = [];
    saveState();
    toast("Replay-Mitschnitt gelöscht.", { type:"info" });
  });
}
const _replayClose = el("replayClose");
if(_replayClose) _replayClose.addEventListener("click", closeReplayModal);
const _replayCopy = el("replayCopy");
if(_replayCopy) _replayCopy.addEventListener("click", copyReplayToClipboard);

// Konzept-Karte schließen / dauerhaft deaktivieren
const _conceptContinue = el("conceptContinue");
if(_conceptContinue) _conceptContinue.addEventListener("click", closeConceptCard);
const _conceptDontShow = el("conceptDontShowAgain");
if(_conceptDontShow){
  _conceptDontShow.addEventListener("click", ()=>{
    if(!state.settings) state.settings = { conceptsSeen:{}, conceptsDisabled:false };
    state.settings.conceptsDisabled = true;
    saveState();
    closeConceptCard();
    toast("Konzept-Karten deaktiviert (kann in den Einstellungen wieder aktiviert werden).", { type:"info" });
  });
}

// Tutorial-Skip
const _tutSkip = el("tutorialSkipBtn");
if(_tutSkip){
  _tutSkip.addEventListener("click", ()=>{
    if(confirm("Tutorial wirklich überspringen? Du kannst die Hinweise später nicht erneut starten.")){
      endGuidedTutorial();
      toast("Tutorial übersprungen. help / quests zeigen dir, wo's weitergeht.", { type:"info" });
    }
  });
}

// Settings-Overlay per Esc schließen
document.addEventListener("keydown", (e)=>{
  if(e.key !== "Escape") return;
  const settingsOv = el("settingsOverlay");
  if(settingsOv && !settingsOv.hidden){ closeSettingsModal(); return; }
  const replayOv = el("replayOverlay");
  if(replayOv && !replayOv.hidden){ closeReplayModal(); return; }
  const conceptOv = el("conceptOverlay");
  if(conceptOv && !conceptOv.hidden){ closeConceptCard(); return; }
});

// Initiales Anwenden der Settings (auch nach Reload mit Autosave)
applySettings();

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
  try{ syncClippyTooltip(); }catch(e){}

  try{
    const base = allowedCommands();
    return base.filter(c=>COMMAND_REGISTRY[c]);
  }catch(e){
    return [];
  }
}

// Verwaister Aufruf aus einem alten Refactor: renderHeader() wird in commands.js
// und fs.js noch referenziert, aber nirgends mehr definiert. Pass-through-Funktion
// verhindert ReferenceError-Crashes — sie aktualisiert sinnvoll Header-Subtext
// und Phase-Pill.
function renderHeader(){
  try{ renderHeaderSub(); }catch(_e){}
  try{ renderPhasePill(); }catch(_e){}
}

function renderHeaderSub(){
  const phaseInline = document.getElementById("phaseStatusInline");
  const ps = document.getElementById("printStatus");

  if(Number(state.phase) >= 5){
    const phaseText = "Schule fertig. Ab zur Arbeit: regel dein eigenes Leben — und guck mal, ob dir Schule überhaupt was gebracht hat. 😎";
    if(phaseInline) phaseInline.textContent = phaseText;
    if(ps) ps.hidden = true;
  }else{
    if(phaseInline) phaseInline.textContent = "";
    if(ps) ps.hidden = false;
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
window.syncClippyTooltip = syncClippyTooltip;

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
