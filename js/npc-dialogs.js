// npc-dialogs.js — generisches NPC-Dialog-System (aus commands.js ausgelagert)
//
// Mehrstufen-Dialoge für Schüler-/Lehrer-NPCs: Dialogbäume, Sprecher-Namen,
// Flavor-Lines. Spezial-NPCs (Winkelmann, Sidequest-Geber, Story-NPCs) sind in
// NPC_DIALOG_EXCLUDED gelistet und werden direkt in case "talk" (js/commands.js)
// behandelt. Wird zur Laufzeit von cmdImpl() aufgerufen — lädt vor commands.js.
  const NPC_DIALOG_EXCLUDED = new Set([
    "winkelmann","harries","pietsch","beamter","jansen","wiebe","neele","tom","holger","noah","emma","leo",
    // nur Story-/Spezial-NPCs ohne Auswahlmenü
    "groffmann","ruebke","kaluza","dumke","bauer","weymann"
  ]);

  function isStudentNpc(npcId, npc){
    const role = String((npc && npc.role) || "").toLowerCase();
    return role.includes("schüler") || role.includes("schueler") || /^s_\d/i.test(String(npcId||"")) || /^s_/i.test(String(npcId||""));
  }

  function isTeacherNpc(npcId, npc, inSchool){
    const studentIds = new Set(["noah","emma","leo"]);
    if(inSchool) return (!studentIds.has(npcId) && !isStudentNpc(npcId, npc));
    return (npc && (
      /lehr|schule|direktor|sekret|beratung|schul|klassen/i.test(String(npc.role||"")) ||
      /herr|frau/i.test(String(npc.name||""))
    ) && !isStudentNpc(npcId, npc));
  }

  function resetNpcDialog(){
    if(!state.npcDialog || typeof state.npcDialog !== "object") state.npcDialog = { active:false, npcId:null, nodeId:null };
    state.npcDialog.active = false;
    state.npcDialog.npcId = null;
    state.npcDialog.nodeId = null;
  }

  function getNpcDialogType(npcId, npc){
    const role = String((npc && npc.role) || "").toLowerCase();
    if(role.includes("schüler") || role.includes("schueler") || /^s_/i.test(npcId)) return "student";
    return "teacher";
  }

  function pickNpcLine(npcId, options){
    let h = 0;
    for(const ch of String(npcId||"")) h = (h * 33 + ch.charCodeAt(0)) >>> 0;
    return options[h % options.length];
  }

  function getTeacherDialogName(npc){
    const rawName = String((npc && npc.name) || "").trim();
    const role = String((npc && npc.role) || "").toLowerCase();
    const nameWithoutParens = rawName.replace(/\s*\([^)]*\)\s*/g, " ").trim();
    const tokens = nameWithoutParens.split(/\s+/).filter(Boolean);
    const clean = tokens.filter(t => !/^(herr|frau|dr\.?|prof\.?|prof\.dr\.?)$/i.test(t));
    const lastName = (clean[clean.length - 1] || tokens[tokens.length - 1] || "Lehrkraft").replace(/,$/, "");
    const femaleFirstNames = new Set([
      "mascha","maren","kathrin","johanna","dörte","ulrike","kristina","julia","karla","simona",
      "agnieszka","chiara","silke","lena","lara","claudia"
    ]);
    const firstName = (clean[0] || tokens[0] || "").toLowerCase();
    let honorific = "Herr";
    if(/\bfrau\b/i.test(rawName)) honorific = "Frau";
    else if(/\bherr\b/i.test(rawName)) honorific = "Herr";
    else if(role.includes("leiterin") || role.includes("direktorstellvertreterin") || femaleFirstNames.has(firstName)) honorific = "Frau";
    return `${honorific} ${lastName}`;
  }

  function getDialogSpeakerName(npcId, npc){
    if(getNpcDialogType(npcId, npc) === "teacher") return getTeacherDialogName(npc);
    return String((npc && npc.name) || npcId || "NPC");
  }

  function normalizeTeacherRoleKey(roleText){
    const normalized = String(roleText || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
    if(!normalized) return "general";
    if(/\b(mathe|mathematik)\b/.test(normalized)) return "math";
    if(/\b(englisch|english)\b/.test(normalized)) return "english";
    if(/\b(deutsch|german)\b/.test(normalized)) return "german";
    if(/\b(geschichte|history)\b/.test(normalized)) return "history";
    if(/\b(sport)\b/.test(normalized)) return "sport";
    if(/\b(kunst|art)\b/.test(normalized)) return "art";
    if(/\b(chemie|chemistry)\b/.test(normalized)) return "chemistry";
    if(/\b(bio|biologie|biology)\b/.test(normalized)) return "biology";
    if(/\b(erdkunde|geografie|geographie|geography)\b/.test(normalized)) return "geography";
    if(/\b(werte und normen|ethik|philosophie)\b/.test(normalized)) return "ethics";
    return "general";
  }

  function getTeacherOpenerPool(roleText){
    const key = normalizeTeacherRoleKey(roleText);
    const pools = {
      math: [
        "„Taschenrechner bleibt erstmal zu — erst Denkweg, dann Ergebnis.“",
        "„Zeig mir den Rechenweg. Das Ergebnis allein rettet dir heute nichts.“",
        "„Nicht raten, begründen: Welche Regel nutzt du an dieser Stelle?“",
        "„Wir rechnen strukturiert: Gegeben, gesucht, Ansatz, Kontrolle.“"
      ],
      english: [
        "„Short answers, clear grammar — start simple and precise.“",
        "„Bitte in ganzen Sätzen antworten, nicht im Telegrammstil.“",
        "„Vocabulary first, then style. Sag es klar, dann schön.“",
        "„Read the task carefully — key words entscheiden die Punktzahl.“"
      ],
      german: [
        "„Erst den Text erfassen, dann interpretieren — nicht andersrum.“",
        "„Achte auf Signalwörter. Die tragen oft das ganze Argument.“",
        "„Eine starke These braucht immer ein passendes Textbeispiel.“",
        "„Schreib klar, knapp und begründet — das überzeugt am meisten.“"
      ],
      history: [
        "„Ordne das erst zeitlich ein — ohne Kontext bleibt es nur eine Anekdote.“",
        "„Quelle ist nicht gleich Wahrheit: Wer spricht, wann und warum?“",
        "„Geschichte lernt man über Zusammenhänge, nicht über Jahreszahlen allein.“",
        "„Vergleichen statt aufzählen: Was hat sich verändert, was blieb?“"
      ],
      sport: [
        "„Tempo ist gut, Technik ist besser — wir machen's sauber.“",
        "„Warm-up ernst nehmen, dann laufen die Übungen von allein besser.“",
        "„Teamplay heißt: reden, schauen, mitdenken — nicht nur rennen.“",
        "„Saubere Wiederholung schlägt hektische zehn Extra-Runden.“"
      ],
      art: [
        "„Mut zur Fläche — der erste Strich darf ruhig sichtbar sein.“",
        "„Beobachten vor Bewerten. Schau erst, dann entscheide.“",
        "„Komposition schlägt Perfektion: Ordnung im Bild führt den Blick.“",
        "„Material spricht mit — nutz die Struktur, statt gegen sie zu arbeiten.“"
      ],
      chemistry: [
        "„Im Labor gilt: erst Sicherheit, dann Reaktion.“",
        "„Beobachtung vor Deutung — was siehst du wirklich?“",
        "„Formel ist Sprache. Lies sie, bevor du rechnest.“",
        "„Wir arbeiten sauber: Hypothese, Versuch, Auswertung.“"
      ],
      biology: [
        "„In der Biologie zählt Struktur: Ebene für Ebene verstehen.“",
        "„Beschreiben, vergleichen, erklären — so wird aus Wissen Verständnis.“",
        "„Funktion folgt Aufbau. Frag immer: Wozu dient das?“",
        "„Nicht auswendig runterrattern — Zusammenhänge zeigen!“"
      ],
      geography: [
        "„Karte lesen heißt Muster erkennen, nicht nur Orte finden.“",
        "„Denk in Räumen: Lage, Nutzung, Wirkung.“",
        "„Mensch und Umwelt immer zusammen betrachten — das ist der Kern.“",
        "„Beschreibe erst den Raum, erkläre dann die Prozesse.“"
      ],
      ethics: [
        "„Gute Diskussion heißt: Position begründen, nicht Lautstärke erhöhen.“",
        "„Wir trennen Meinung und Argument — beides darf da sein, aber sauber.“",
        "„Erst Perspektiven sammeln, dann bewerten.“",
        "„Fairness beginnt beim Zuhören, nicht beim Gewinnen.“"
      ],
      general: [
        "„So, alle einmal mitschreiben — und du kommst bitte kurz zu mir.“",
        "„Erst lesen, dann reden. Und jetzt: Was brauchst du?“",
        "„Handys weg, Köpfe an. Wir klären das jetzt sauber.“",
        "„Ruhe bitte. Wir gehen das in sinnvollen Schritten durch.“",
        "„Nicht raten — begründen. Also: Wo hängst du?“",
        "„Wer eine Fehlermeldung hat, liest sie. Wer keine hat, denkt mit.“",
        "„Wir machen das ordentlich: Ziel, Schritt, Kontrolle.“",
        "„Stopp, einmal sortieren. Dann lösen wir's ohne Chaos.“"
      ]
    };
    return pools[key] || pools.general;
  }

  function pickRandom(arr){
    return arr[Math.floor(Math.random()*arr.length)];
  }

  function getTeacherRoomLabel(cwd){
    const room = String(cwd || "");
    if(room === "/school/lehrerzimmer") return "lehrerzimmer";
    if(room.startsWith("/school/klassenraume")) return "klassenzimmer";
    if(room === "/school/pcraum") return "pcraum";
    if(room === "/school/digitallab") return "digitallab";
    if(room === "/school/turnhalle") return "turnhalle";
    if(room === "/school/musikraum") return "musikraum";
    if(room === "/school/kunstraum") return "kunstraum";
    if(room === "/school/chemie") return "chemie";
    if(room === "/school/biologie") return "biologie";
    if(room === "/school/bibliothek") return "bibliothek";
    if(room === "/school/beratung") return "beratung";
    return "schule";
  }

  function getTeacherFlavorLine(npc, cwd){
    const roleText = String((npc && npc.role) || "");
    const subjectKey = normalizeTeacherRoleKey(roleText);
    const roomKey = getTeacherRoomLabel(cwd);
    const roomPools = {
      lehrerzimmer:[
        "„Das Lehrerzimmer ist Arbeitsbereich. Wenn du ein Anliegen hast, bitte übers Sekretariat.“",
        "„Wir sind hier mitten in Planung und Korrektur. Bitte zurück in den öffentlichen Bereich.“",
        "„Zwischen Konferenzmappen und Kaffeeplan ist hier kein Platz für Besucher*innen.“",
        "„Interne Unterlagen bleiben intern. Bitte verlasse das Lehrerzimmer wieder.“"
      ],
      klassenzimmer:[
        "„Unterrichtszeit heißt: klare Struktur, klare Fragen, klare Antworten.“",
        "„Wir bleiben beim Thema und arbeiten den Stoff Schritt für Schritt durch.“",
        "„Wenn du was wissen willst: Handzeichen, dann klären wir’s sauber.“"
      ],
      pcraum:[
        "„Im PC-Raum gilt: erst lesen, dann klicken, dann dokumentieren.“",
        "„Keine wilden Tabs. Wir arbeiten reproduzierbar, nicht zufällig.“",
        "„Technikfehler sind Lernanlässe — wenn man sie ordentlich protokolliert.“"
      ],
      digitallab:[
        "„Im Digital-Lab zählt nicht Show, sondern ein nachvollziehbarer Workflow.“",
        "„Hier testen wir iterativ: Hypothese, Versuch, Auswertung.“",
        "„Projektarbeit heißt: Versionen sichern, Entscheidungen begründen.“"
      ],
      turnhalle:[
        "„In der Halle gilt: Sicherheit vor Tempo, Technik vor Risiko.“",
        "„Wir starten sauber aufgewärmt — Verletzungen sind kein Achievement.“",
        "„Teamplay, Fairness, Fokus: das ist heute der eigentliche Lerninhalt.“"
      ],
      musikraum:[
        "„Im Musikraum hörst du nicht nur zu — du reagierst aufeinander.“",
        "„Rhythmus hält die Gruppe zusammen. Also: erst zählen, dann einsetzen.“",
        "„Jede Probe lebt von Präzision und Rücksicht, nicht von Lautstärke.“"
      ],
      kunstraum:[
        "„Im Kunstraum zählt Idee plus Begründung, nicht nur ‘sieht cool aus’.“",
        "„Skizze, Entscheidung, Überarbeitung — das ist der eigentliche Prozess.“",
        "„Material ist Sprache. Nutze es bewusst, nicht nur dekorativ.“"
      ],
      chemie:[
        "„Im Chemieraum gilt: Schutz zuerst, Experiment danach.“",
        "„Beobachtung vor Interpretation — erst was passiert, dann warum.“",
        "„Saubere Protokolle sind hier genauso wichtig wie das Ergebnis.“"
      ],
      biologie:[
        "„Im Bioraum arbeiten wir präzise: beobachten, vergleichen, einordnen.“",
        "„Lebende Systeme sind komplex — deshalb argumentieren wir mit Daten, nicht Bauchgefühl.“",
        "„Biologie beginnt bei Details und endet bei Zusammenhängen.“"
      ],
      bibliothek:[
        "„In der Bibliothek spricht man leise, denkt aber sehr laut.“",
        "„Quelle, Beleg, Schlussfolgerung — so wird aus Recherche Erkenntnis.“",
        "„Nimm dir Zeit fürs Lesen; Geschwindigkeit ersetzt kein Verständnis.“"
      ],
      beratung:[
        "„Im Beratungsraum geht es um nächste Schritte, nicht um perfekte Antworten.“",
        "„Wir sortieren erst die Lage und planen dann realistische Ziele.“",
        "„Gute Beratung heißt: zuhören, konkretisieren, verabreden.“"
      ],
      schule:[
        "„Schulalltag läuft besser mit klaren Absprachen und ruhigem Kopf.“",
        "„Wenn etwas hakt: Problem benennen, Option prüfen, Entscheidung treffen.“",
        "„Lernen ist kein Sprint — es ist saubere, wiederholte Praxis.“"
      ]
    };
    const subjectPools = {
      math:[
        "„In Mathe zählt der Lösungsweg. Ergebnis ohne Begründung ist nur geraten.“",
        "„Struktur schlägt Tempo: erst gegeben/gesucht, dann Rechnung.“",
        "„Jeder Rechenschritt muss überprüfbar sein — das ist die eigentliche Kompetenz.“"
      ],
      german:[
        "„Im Deutschunterricht trägt jedes Argument einen Beleg, sonst bleibt es Behauptung.“",
        "„Präzise Sprache ist kein Extra, sondern Teil der Aufgabe.“",
        "„Textverständnis heißt: zwischen den Zeilen begründet lesen.“"
      ],
      english:[
        "„In Englisch gilt: sprechen trotz Fehlern — Kommunikation vor Perfektion.“",
        "„Use simple structures first, then add detail.“",
        "„Vocabulary grows only when you use it actively.“"
      ],
      history:[
        "„Geschichte ist Deutung mit Quellen, nicht nur Jahreszahlen auswendig.“",
        "„Wir trennen Ereignis, Perspektive und Bewertung sauber voneinander.“",
        "„Ohne Kontext bleibt selbst ein Fakt missverständlich.“"
      ],
      sport:[
        "„Im Sport zählt Technik plus Fairness, nicht nur das Ergebnis.“",
        "„Konzentration im Ablauf spart Kraft und verhindert Fehler.“",
        "„Leistung wächst mit Disziplin, nicht mit Hektik.“"
      ],
      art:[
        "„Kunst heißt Entscheidungen sichtbar machen und begründen können.“",
        "„Idee, Form, Wirkung — diese drei Ebenen schauen wir uns immer an.“",
        "„Mut zur Überarbeitung ist oft der Schritt zur besseren Arbeit.“"
      ],
      chemistry:[
        "„Chemie braucht Genauigkeit: Mengen, Reihenfolge, Sicherheit.“",
        "„Reaktionen erklären wir mit Teilchenmodell und Beobachtung.“",
        "„Wer sauber misst, versteht später auch sauber.“"
      ],
      biology:[
        "„Biologie erklärt Zusammenhänge — vom Detail zum System.“",
        "„Wir arbeiten hypothesengeleitet, nicht nach Gefühl.“",
        "„Wer Prozesse versteht, kann auch Ausnahmen einordnen.“"
      ],
      geography:[
        "„Erdkunde verbindet Raum, Ressourcen und menschliche Entscheidungen.“",
        "„Karten lesen heißt Muster erkennen und Ursachen erklären.“",
        "„Lokale Beobachtung ohne globalen Kontext ist zu kurz gedacht.“"
      ],
      ethics:[
        "„In Werte und Normen zählt die Begründung, nicht Lautstärke.“",
        "„Wir prüfen Positionen fair, auch wenn wir sie nicht teilen.“",
        "„Gute Urteile entstehen durch Perspektivwechsel und klare Kriterien.“"
      ],
      general:[
        "„Professionell arbeiten heißt: ruhig analysieren, dann handeln.“",
        "„Wir lösen Probleme nachvollziehbar, damit andere anknüpfen können.“",
        "„Lernen gelingt besser mit Klarheit als mit Druck.“"
      ]
    };
    const roomLine = pickRandom(roomPools[roomKey] || roomPools.schule);
    const subjectLine = pickRandom(subjectPools[subjectKey] || subjectPools.general);
    return pickRandom([roomLine, subjectLine]);
  }

  function buildNpcDialogTree(npcId, npc){
    const shortName = String((npc && npc.name) || npcId || "NPC").split(" ")[0];
    const teacherName = getTeacherDialogName(npc);
    let hash = 0;
    for(const ch of String(npcId||"")) hash = (hash * 33 + ch.charCodeAt(0)) >>> 0;

    if(getNpcDialogType(npcId, npc) === "teacher"){
      const roleText = String((npc && npc.role) || "Unterricht");
      const teacherOpeners = getTeacherOpenerPool(roleText);
      const planOptions = [
        { label:`Wie priorisiere ich Aufgaben in ${roleText}?`, response:"„Sortiere nach Wirkung: erst das, was den nächsten Fortschritt freischaltet.“" },
        { label:"Ich brauche eine Reihenfolge statt Trial-and-Error.", response:"„Dann gehst du so: Ziel lesen, Fundort prüfen, erst dann handeln.“" },
        { label:"Wie erkenne ich früh, dass mein Ansatz nicht trägt?", response:"„Wenn du viel tippst, aber nichts Neues lernst, brauchst du einen Kurswechsel.“" },
        { label:"Wie halte ich den Überblick bei mehreren To-dos?", response:"„Maximal drei aktive Schritte. Alles andere kommt auf die Parkliste.“" },
        { label:"Wie plane ich kurze, aber effektive Lernblöcke?", response:"„25 Minuten Fokus, 5 Minuten Check — dann bewusst neu priorisieren.“" },
        { label:`Was wäre ein guter Arbeitsmodus für ${teacherName}?`, response:"„Ruhig, präzise, überprüfbar. Kein Aktionismus ohne Kontrollpunkt.“" }
      ];
      const learnOptions = [
        { label:`Wie lerne ich ${roleText} nachhaltiger?`, response:"„Nicht nur Lösungen sammeln — Muster notieren und aktiv wiederholen.“" },
        { label:"Ich will Kommandos verstehen, nicht nur kopieren.", response:"„Frag immer: Was ändert sich, was bleibt, woran erkenne ich Erfolg?“" },
        { label:"Wie trainiere ich Ruhe in Prüfungsphasen?", response:"„Routinen schlagen Panik. Kleine, feste Abläufe geben Sicherheit.“" },
        { label:"Wie werde ich sicherer beim Erklären meiner Lösung?", response:"„Erkläre in drei Sätzen: Ausgangslage, Aktion, Ergebnis.“" },
        { label:"Wie baue ich ein gutes persönliches Nachschlage-System?", response:"„Dokumentiere kurz: Ursache, Kommando, Wirkung, nächster Check.“" },
        { label:"Wie steigere ich Qualität, ohne zu langsam zu werden?", response:"„Präzision zuerst. Tempo kommt als Nebenprodukt von Klarheit.“" }
      ];
      const talkOptions = [
        { label:"Was ist Ihr Anti-Stress-Trick im Unterricht?", response:"„Komplexes in kleine, überprüfbare Schritte zerlegen.“" },
        { label:"Was nervt Lehrkräfte bei chaotischen Abgaben am meisten?", response:"„Unklare Benennung. Gute Struktur spart allen Zeit.“" },
        { label:"Welche Gewohnheit bringt im Schulalltag den größten Effekt?", response:"„Vor jedem Schritt kurz prüfen: Hilft das wirklich dem Ziel?“" },
        { label:"Was schätzen Sie bei Schüler*innen am meisten?", response:"„Saubere Fragen. Die zeigen bereits gutes Denken.“" },
        { label:`Was ist Ihr Standardsatz für ${roleText}?`, response:"„Erst verstehen, dann ausführen, dann kontrollieren.“" },
        { label:"Wie bleiben Sie in stressigen Wochen gelassen?", response:"„Ich priorisiere nach Wirkung, nicht nach Lautstärke.“" }
      ];
      const pickUnique = (pool, start)=>{
        const len = pool.length;
        const first = pool[start % len];
        const second = pool[(start + 2 + ((hash >>> 3) % (len - 1))) % len];
        return [first, second];
      };

      const opener = teacherOpeners[hash % teacherOpeners.length];
      const [planA, planB] = pickUnique(planOptions, hash + 1);
      const [learnA, learnB] = pickUnique(learnOptions, hash + 5);
      const [talkA, talkB] = pickUnique(talkOptions, hash + 9);

      return {
        intro: `${teacherName} schaut dich an: ${opener}\n${teacherName}: „Okay, wir klären dein Thema ohne Umwege.“`,
        nodes: {
          start: { prompt:"Wie antwortest du?", choices:[
            { label: planA.label, response: planA.response, next:"plan" },
            { label: learnA.label, response: learnA.response, next:"learning" },
            { label: talkA.label, response: talkA.response, next:"smalltalk" }
          ]},
          plan: { prompt:"Worauf willst du den Fokus setzen?", choices:[
            { label: planB.label, response: planB.response, next:"plan_deep" },
            { label:"Gib mir bitte eine 3-Punkte-Checkliste.", response:"„1) Auftrag klären. 2) Konkreten Schritt ausführen. 3) Ergebnis validieren.“", next:"plan_deep" },
            { label:"Reicht mir erstmal, ich setze das direkt um.", response:"„Sehr gut. Sauber anfangen ist die halbe Lösung.“", next:"endnode" }
          ]},
          plan_deep: { prompt:"Noch eine Ebene tiefer?", choices:[
            { label:"Ja: Wie teile ich große Aufgaben sinnvoll auf?", response:"„Orientierung, Umsetzung, Kontrolle — und nach jedem Block ein sichtbares Ergebnis.“", next:"endnode" },
            { label:"Nein, ich hab jetzt einen klaren Plan.", response:"„Perfekt. Dann arbeite Schritt für Schritt.“", next:"endnode" }
          ]},
          learning: { prompt:"Welcher Lernaspekt hilft dir jetzt am meisten?", choices:[
            { label: learnB.label, response: learnB.response, next:"learning_deep" },
            { label:"Wie baue ich mir ein eigenes Nachschlage-System auf?", response:"„Dokumentiere gelöste Probleme kurz mit Ursache, Aktion, Ergebnis.“", next:"learning_deep" },
            { label:"Danke, das reicht für jetzt.", response:"„Top. Hauptsache, du setzt es direkt in Handlung um.“", next:"endnode" }
          ]},
          learning_deep: { prompt:"Letzter Lern-Impuls?", choices:[
            { label:"Ja, bitte einen konkreten Übungsmodus.", response:"„Nimm einen Befehl pro Session und teste gezielt Varianten statt alles gleichzeitig.“", next:"endnode" },
            { label:"Nein, ich starte direkt mit den Tipps.", response:"„Sehr gut. Routine entsteht durchs Tun.“", next:"endnode" }
          ]},
          smalltalk: { prompt:"Noch eine Frage?", choices:[
            { label: talkB.label, response: talkB.response, next:"endnode" },
            { label:"Was wäre ein guter Standardsatz gegen Chaos?", response:"„Erst verstehen, dann ausführen, dann kontrollieren.“", next:"endnode" }
          ]},
          endnode: { prompt:"Zum Abschluss?", choices:[
            { label:"Danke, das war hilfreich.", end:true, response:"„Gern. Meld dich, wenn du beim nächsten Schritt hängst.“" },
            { label:"Ich probiere es jetzt direkt aus.", end:true, response:"„Sehr gute Entscheidung — direkt anwenden verankert es am besten.“" }
          ]}
        }
      };
    }

    const studentStyles = [
      {
        intro:`„${shortName} dreht sich zu dir: 'Yo, was geht gerade ab?'“`,
        helpA:{ label:"Ich hänge fest — kannst du kurz mitdenken?", response:"„Klar. Mit Plan ist das direkt weniger wild.“" },
        helpB:{ label:"Was war dein bester Move gegen Quest-Chaos?", response:"„Ich fang immer mit einem Mini-Schritt an und check danach sofort den Stand.“" },
        vibeA:{ label:"Wie bleibst du entspannt, wenn alles gleichzeitig kommt?", response:"„Ich nehme erst eine Sache auseinander, nicht fünf auf einmal.“" },
        vibeB:{ label:"Welche Gewohnheit hat dir am meisten geholfen?", response:"„Kurz notieren, was funktioniert hat. Dann muss ich's nicht jedes Mal neu erfinden.“" }
      },
      {
        intro:`„${shortName} hebt die Hand zum Gruß: 'Brauchst du kurz Backup?'“`,
        helpA:{ label:"Ja, ich brauche einen klaren nächsten Schritt.", response:"„Safe. Erst Standort checken, dann gezielt suchen, dann validieren.“" },
        helpB:{ label:"Wie vermeide ich dieselben Fehler immer wieder?", response:"„Nach jedem Fail kurz Ursache notieren. Das spart später richtig Zeit.“" },
        vibeA:{ label:"Wie gehst du mit Frust in Abgaben um?", response:"„Kurz resetten, dann klein neu starten. Sonst driftet man komplett weg.“" },
        vibeB:{ label:"Was motiviert dich bei nervigen Aufgaben?", response:"„Mini-Erfolge sammeln. Die ziehen dich durch den Rest.“" }
      },
      {
        intro:`„${shortName} grinst: 'Lass kurz sortieren, was dein nächster Win sein kann.'“`,
        helpA:{ label:"Ich brauche Struktur, nicht noch mehr Inputs.", response:"„Fair. Dann machen wir nur einen klaren Pfad statt zehn Ideen.“" },
        helpB:{ label:"Hast du eine schnelle Methode für Fokus?", response:"„Ja: Timer an, ein Ziel, null Kontextwechsel bis der Timer klingelt.“" },
        vibeA:{ label:"Wie bleibst du bei Prüfungsstress stabil?", response:"„Mit festen Abläufen. Dann ist der Kopf nicht komplett auf Alarm.“" },
        vibeB:{ label:"Was sagst du dir, wenn's gar nicht läuft?", response:"„Ein sauberer Schritt reicht erstmal. Perfekt muss es jetzt nicht sein.“" }
      }
    ];

    const style = studentStyles[hash % studentStyles.length];
    return {
      intro: style.intro,
      nodes: {
        start: { prompt:"Wie reagierst du?", choices:[
          { label: style.helpA.label, response: style.helpA.response, next:"help" },
          { label:"Ich will lernen, das nächstes Mal selbst zu lösen.", response:"„Stark. Dann bauen wir dir eine eigene Mini-Methode.“", next:"growth" },
          { label: style.vibeA.label, response: style.vibeA.response, next:"vibe" }
        ]},
        help: { prompt:"Was brauchst du konkret?", choices:[
          { label: style.helpB.label, response: style.helpB.response, next:"endnode" },
          { label:"Gib mir eine 3-Schritte-Notfallroutine.", response:"„Ziel lesen, einen Schritt machen, Ergebnis prüfen. Dann wiederholen.“", next:"endnode" }
        ]},
        growth: { prompt:"Worauf willst du langfristig gehen?", choices:[
          { label:"Mehr Selbstständigkeit bei kniffligen Aufgaben.", response:"„Dann dokumentierst du ab heute kurz jeden gelösten Knoten.“", next:"endnode" },
          { label:"Sicherer werden beim Erklären vor anderen.", response:"„Erklär deinen Lösungsweg erst dir selbst laut in 3 Sätzen.“", next:"endnode" }
        ]},
        vibe: { prompt:"Noch eine kurze Frage?", choices:[
          { label: style.vibeB.label, response: style.vibeB.response, next:"endnode" },
          { label:"Hast du einen Satz, der sofort den Druck rausnimmt?", response:"„Nicht alles auf einmal. Ein klarer Schritt reicht für jetzt.“", next:"endnode" }
        ]},
        endnode: { prompt:"Zum Abschluss?", choices:[
          { label:"Danke dir, das hilft mir echt.", end:true, response:"„Gern. Ping mich, wenn du wieder Input brauchst.“" },
          { label:"Ich setze das jetzt direkt um.", end:true, response:"„Nice. Genau so kommt Momentum rein.“" }
        ]}
      }
    };
  }

  function renderNpcDialogNode(npcId, npc){
    const tree = buildNpcDialogTree(npcId, npc);
    const node = tree.nodes[state.npcDialog.nodeId || "start"] || tree.nodes.start;
    const speakerName = getDialogSpeakerName(npcId, npc);
    let out = `🗨️ ${speakerName} — ${npc.role}
`;
    if((state.npcDialog.nodeId || "start") === "start") out += `${tree.intro}

`;
    out += `${node.prompt}
`;
    node.choices.forEach((choice, idx)=>{ out += `  (${idx+1}) ${choice.label}
`; });
    out += `  (0) Gespräch beenden

Eingabe: choose <nummer>`;
    return out;
  }
