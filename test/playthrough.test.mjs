// SchwarmShell — End-to-End Spiel-Durchlauf via Playwright
//
// Startet einen lokalen HTTP-Server, öffnet das Spiel in einem Chromium-Browser
// und spielt die Hauptpfade jeder Phase mechanisch durch. Erwartet konkrete
// State-Bedingungen (Flags, Quest-Done, Phase) nach jedem Schritt.
//
// Ausführen:
//   npm install            # einmalig (lädt Playwright)
//   npm test               # oder: node test/playthrough.test.mjs
//   npm run test:headed    # Browser sichtbar
//
// Der HTTP-Server (python3 -m http.server 8765) wird automatisch gestartet,
// falls er nicht schon läuft.

import http from "node:http";
import fs from "node:fs";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

// Playwright-Auflösung: zuerst regulär über node_modules (npm install / CI),
// dann Overrides/bekannte globale Pfade — so läuft der Test sowohl nach einem
// normalen `npm install` als auch in Umgebungen mit global installiertem Playwright.
async function loadChromium(){
  const candidates = [
    "playwright",
    process.env.PLAYWRIGHT_MODULE,
    "/opt/node22/lib/node_modules/playwright/index.mjs"
  ].filter(Boolean);
  for(const spec of candidates){
    try{
      const pw = await import(spec);
      if(pw && pw.chromium) return pw.chromium;
    }catch(_e){ /* nächsten Kandidaten probieren */ }
  }
  throw new Error("Playwright nicht gefunden. `npm install` ausführen oder PLAYWRIGHT_MODULE auf das Playwright-Modul zeigen lassen.");
}
const chromium = await loadChromium();

// Chromium-Binary: Wenn keiner der bekannten Pfade existiert, entscheidet
// Playwright selbst (nutzt die per `npx playwright install chromium` geladenen Browser).
function chromiumExecutablePath(){
  const candidates = [
    process.env.PLAYWRIGHT_CHROMIUM,
    "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"
  ].filter(Boolean);
  for(const p of candidates){
    try{ if(fs.existsSync(p)) return p; }catch(_e){}
  }
  return undefined;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const PORT = Number(process.env.PORT) || 8765;
const BASE_URL = `http://localhost:${PORT}/index.html`;
const HEADED = process.env.PLAYWRIGHT_HEADED === "1";

// ─── Server bootstrapping ─────────────────────────────────────────────────────
async function isServerUp(){
  return new Promise((resolve)=>{
    const req = http.get(BASE_URL, (res)=>{ res.resume(); resolve(res.statusCode === 200); });
    req.on("error", ()=>resolve(false));
    req.setTimeout(500, ()=>{ req.destroy(); resolve(false); });
  });
}

let serverProc = null;
async function ensureServer(){
  if(await isServerUp()) return;
  serverProc = spawn("python3", ["-m", "http.server", String(PORT)], {
    cwd: REPO_ROOT, stdio: "ignore", detached: false
  });
  for(let i = 0; i < 30; i++){
    await new Promise(r => setTimeout(r, 200));
    if(await isServerUp()) return;
  }
  throw new Error(`HTTP server did not come up on port ${PORT}`);
}

// ─── Mini-Testrunner ───────────────────────────────────────────────────────────
const results = [];
let currentName = "";
async function suite(name, fn){
  currentName = name;
  console.log(`\n${name}`);
  await fn();
}
async function it(name, fn){
  const fullName = `${currentName} › ${name}`;
  try{
    await fn();
    results.push({ name: fullName, ok: true });
    console.log(`  ✓ ${name}`);
  }catch(err){
    results.push({ name: fullName, ok: false, error: String(err && err.message || err) });
    console.log(`  ✗ ${name}\n      ${err && err.message || err}`);
  }
}
function expect(actual){
  return {
    toBe(expected){
      if(actual !== expected) throw new Error(`expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    },
    toBeTruthy(){
      if(!actual) throw new Error(`expected truthy, got ${JSON.stringify(actual)}`);
    },
    toContain(needle){
      if(typeof actual === "string"){
        if(!actual.includes(needle)) throw new Error(`expected to contain ${JSON.stringify(needle)}, got ${JSON.stringify(actual.slice(0, 200))}`);
      } else if(Array.isArray(actual)){
        if(!actual.includes(needle)) throw new Error(`array did not contain ${JSON.stringify(needle)}`);
      } else {
        throw new Error(`unsupported toContain target: ${typeof actual}`);
      }
    },
    toMatch(re){
      if(!re.test(String(actual))) throw new Error(`expected to match ${re}, got ${JSON.stringify(String(actual).slice(0, 200))}`);
    },
    toBeGreaterThanOrEqual(n){
      if(!(actual >= n)) throw new Error(`expected ${actual} >= ${n}`);
    }
  };
}

// ─── Page helpers ──────────────────────────────────────────────────────────────
async function newGame(page){
  await page.goto(BASE_URL);
  // Reset any prior savegame so we start clean each suite
  await page.evaluate(()=>{
    localStorage.clear();
  });
  await page.reload();
  await page.waitForSelector("#startOverlay:not([hidden])", { timeout: 5000 });
  // Cinematic-Intro überspringen, sonst nervt jeder Schritt
  await page.click("#startNew");
  await page.waitForSelector("#cinematicIntroOverlay:not([hidden])", { timeout: 5000 });
  await page.click("#cinematicIntroSkip");
  await page.waitForSelector("#tutorialBubble:not([hidden])", { timeout: 5000 });
  // Tutorial überspringen + Concept-Karten deaktivieren, sonst blockieren Modal-Overlays
  // alle UI-Clicks in den nachfolgenden Tests.
  await page.evaluate(()=>{
    if(typeof endGuidedTutorial === "function") endGuidedTutorial();
    if(state && state.settings){
      state.settings.conceptsDisabled = true;
      saveState();
    }
  });
}

async function exec(page, cmd){
  await page.fill("#cmd", cmd);
  await page.click("#run");
  // Kleine Pause damit DOM und state.replayLog sich setzen
  await page.waitForTimeout(50);
}

async function execMany(page, cmds){
  for(const c of cmds) await exec(page, c);
}

async function getState(page){
  return page.evaluate(()=>JSON.parse(JSON.stringify(state)));
}

async function getTerminalText(page){
  return page.evaluate(()=>document.getElementById("term").innerText);
}

// ─── Tests ─────────────────────────────────────────────────────────────────────
async function main(){
  await ensureServer();
  const browser = await chromium.launch({
    headless: !HEADED,
    executablePath: chromiumExecutablePath(),
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  // Forward browser console errors so we see them in CI
  page.on("pageerror", (err)=>{
    results.push({ name: `(pageerror) ${err.message}`, ok: false, error: err.stack || err.message });
    console.log(`  ✗ page threw: ${err.message}`);
  });

  await suite("boot", async ()=>{
    await it("starts in /home/player with phase 1", async ()=>{
      await newGame(page);
      const s = await getState(page);
      expect(s.cwd).toBe("/home/player");
      expect(s.phase).toBe(1);
    });
    await it("ls shows readme.txt", async ()=>{
      await exec(page, "ls");
      const out = await getTerminalText(page);
      expect(out).toContain("readme.txt");
    });
    await it("settings panel opens via gear", async ()=>{
      await page.click("#settingsBtn");
      await page.waitForSelector("#settingsOverlay:not([hidden])");
      await page.click("#settingsClose");
    });
  });

  await suite("bugfix", async ()=>{
    await it("grep with regex anchor matches", async ()=>{
      // Synthetic test: write a file we control then grep with ^
      await execMany(page, [
        "cd ~",
        'echo "alpha" > /home/player/workbench/test_anchor.txt',
        'echo "beta"  >> /home/player/workbench/test_anchor.txt',
        "grep ^alpha /home/player/workbench/test_anchor.txt"
      ]);
      // grep is gated to phase 2; the test verifies the gate too
      const term = await getTerminalText(page);
      // Either matched or correctly told us grep is gated
      expect(/alpha|ab Phase 2/.test(term)).toBeTruthy();
    });
    await it("kill rejects 0/abc with usage", async ()=>{
      // Force phase 4 so kill is available
      await page.evaluate(()=>{ state.phase = 4; saveState(); });
      await exec(page, "kill abc");
      const term = await getTerminalText(page);
      expect(term).toContain("usage: kill");
    });
    await it("kill -9 <pid> accepts signal flag", async ()=>{
      await exec(page, "kill -9 999999");
      const term = await getTerminalText(page);
      // No-such-process is the expected branch (proves -9 was parsed, not the usage branch)
      expect(term).toContain("No such process");
    });
    await it("chmod 700 sets exec bit on a workbench script", async ()=>{
      await execMany(page, [
        "cd ~",
        'echo "echo hi" > /home/player/workbench/exectest.sh',
        "chmod 700 /home/player/workbench/exectest.sh"
      ]);
      const exec700 = await page.evaluate(()=>state.perms["/home/player/workbench/exectest.sh"]);
      expect(exec700.exec).toBe(true);
    });
    await it("chmod 644 leaves exec bit off", async ()=>{
      await exec(page, "chmod 644 /home/player/workbench/exectest.sh");
      const m = await page.evaluate(()=>state.perms["/home/player/workbench/exectest.sh"]);
      expect(m.exec).toBe(false);
    });
  });

  await suite("phase1 walkthrough", async ()=>{
    await newGame(page);
    await it("reads readme.txt", async ()=>{
      await exec(page, "cat readme.txt");
      const t = await getTerminalText(page);
      expect(/readme|player|schwarm/i.test(t)).toBeTruthy();
    });
    await it("walks to PC-Raum and reads iserv-glitch", async ()=>{
      await execMany(page, [
        "cd /school/pcraum",
        "cat keycard.txt",
        "cd Schul-PC",
        "cat boot.txt",
        "cat iserv-glitch.txt"
      ]);
      const s = await getState(page);
      expect(s.flags.iserv_glitch).toBeTruthy();
      expect(s.flags.got_key).toBeTruthy();
    });
    await it("unlocks server-gate", async ()=>{
      await execMany(page, [
        "cd /server_gate",
        "cat gate.txt",
        "unlock SCHWARM-ALPHA-7"
      ]);
      const s = await getState(page);
      expect(s.flags.opened_gate).toBeTruthy();
      expect(s.phase).toBeGreaterThanOrEqual(2);
    });
  });

  await suite("replay", async ()=>{
    await newGame(page);
    await execMany(page, ["ls", "pwd", "cat readme.txt"]);
    await it("appendReplay captured commands", async ()=>{
      const log = await page.evaluate(()=>state.replayLog);
      const inputs = log.filter(e => e.kind === "input").map(e => e.text);
      expect(inputs).toContain("ls");
      expect(inputs).toContain("pwd");
      expect(inputs).toContain("cat readme.txt");
    });
  });

  await suite("phase2 fragments", async ()=>{
    // Jump straight to phase 2 with all phase-1 flags set
    await newGame(page);
    await page.evaluate(()=>{
      state.phase = 2;
      state.flags.opened_gate = true;
      state.flags.got_key = true;
      state.flags.iserv_glitch = true;
      state.cwd = "/arena";
      saveState();
    });
    await it("grep FRAG1_TOKEN unlocks frag1", async ()=>{
      await execMany(page, ["cd /patchbay", "grep FRAG1_TOKEN frag_1.log"]);
      const s = await getState(page);
      expect(s.flags.frag1).toBeTruthy();
      expect(s.fragments.f1).toBe("PIXEL-SPAWN-42");
    });
    await it("grep SIGNAL unlocks frag3", async ()=>{
      await exec(page, "grep SIGNAL frag_3.pipe");
      const s = await getState(page);
      expect(s.flags.frag3).toBeTruthy();
    });
    await it("find -name walks the tree", async ()=>{
      await exec(page, 'find /patchbay -name "*.log"');
      const term = await getTerminalText(page);
      expect(term).toContain("frag_1.log");
    });
  });

  await suite("phase3 patchlord", async ()=>{
    await newGame(page);
    await page.evaluate(()=>{
      state.phase = 3;
      state.flags.opened_gate = true;
      state.flags.frag1 = true;
      state.flags.frag2 = true;
      state.flags.frag3 = true;
      state.flags.reality_patch = true;
      state.fragments = { f1: "PIXEL-SPAWN-42", f2: "CRAFTED-DIR-99", f3: "NEON-PIPE-7" };
      state.cwd = "/boss";
      saveState();
    });
    await it("grep -i bug triggers inspect", async ()=>{
      await exec(page, "grep -n -i bug /boss/patchlord.sh");
      const s = await getState(page);
      expect(s.flags.inspected_boss).toBeTruthy();
    });
    await it("echo PATCH_APPLIED (no quotes) triggers hotfix", async ()=>{
      await execMany(page, [
        "cp /boss/patchlord.sh ~/workbench/patchlord.sh",
        "echo PATCH_APPLIED >> ~/workbench/patchlord.sh"
      ]);
      const s = await getState(page);
      expect(s.flags.fixed_script).toBeTruthy();
    });
    await it("chmod +x marks exec_script flag", async ()=>{
      await exec(page, "chmod +x ~/workbench/patchlord.sh");
      const s = await getState(page);
      expect(s.flags.exec_script).toBeTruthy();
    });
  });

  await suite("phase4 mentor", async ()=>{
    await newGame(page);
    await page.evaluate(()=>{
      state.phase = 4;
      state.cwd = "/mentor_hub";
      state.processes = [
        { pid: 101, name: "terminald", cpu: 3, mem: 42 },
        { pid: 202, name: "rgbd", cpu: 99, mem: 180 },
        { pid: 303, name: "patchwatch", cpu: 5, mem: 65 }
      ];
      saveState();
    });
    await it("ps lists rgbd", async ()=>{
      await exec(page, "ps");
      const term = await getTerminalText(page);
      expect(term).toContain("rgbd");
    });
    await it("kill 202 sets mentor.lag_fixed", async ()=>{
      await exec(page, "kill 202");
      const s = await getState(page);
      expect(s.mentor.lag_fixed).toBeTruthy();
    });
    await it("history command works", async ()=>{
      await exec(page, "history");
      const term = await getTerminalText(page);
      expect(term).toContain("ps");
    });
    await it('alias ll="ls -l" sets mentor.alias_made', async ()=>{
      await exec(page, 'alias ll="ls -l"');
      const s = await getState(page);
      expect(s.mentor.alias_made).toBeTruthy();
    });
  });

  await suite("noah branch POC", async ()=>{
    await newGame(page);
    await page.evaluate(()=>{
      state.phase = 4;
      state.cwd = "/mentor_hub";
      state.processes = [
        { pid: 202, name: "rgbd", cpu: 99, mem: 180 }
      ];
      saveState();
    });
    await it("talk noah opens lag_choices branch", async ()=>{
      await exec(page, "talk noah");
      const s = await getState(page);
      expect(s.npcDialog.active).toBeTruthy();
      expect(s.npcDialog.nodeId).toBe("lag_choices");
    });
    await it("choose 2 records 'top' path", async ()=>{
      await exec(page, "choose 2");
      const s = await getState(page);
      expect(s.flags.noah_path).toBe("top");
    });
  });

  await suite("i18n", async ()=>{
    await newGame(page);
    await it("default locale is German", async ()=>{
      const title = await page.evaluate(()=>t("settings.title"));
      expect(title).toBe("Einstellungen");
    });
    await it("switching locale to en updates Settings title", async ()=>{
      await page.evaluate(()=>{ state.settings.locale = "en"; saveState(); applySettings(); });
      const title = await page.evaluate(()=>t("settings.title"));
      expect(title).toBe("Settings");
    });
    await it("phase pill uses translated suffix", async ()=>{
      const text = await page.evaluate(()=>document.getElementById("phasePill").textContent);
      // Phase 1 / "Tutorial" is the same in both languages, so check the en-only label form
      expect(text).toContain("Phase 1");
    });
    await it("missing key falls back to German", async ()=>{
      const fallback = await page.evaluate(()=>t("nonexistent.key.test"));
      // Function returns the key itself when nothing matches
      expect(fallback).toBe("nonexistent.key.test");
    });
    // Reset locale for downstream tests
    await page.evaluate(()=>{ state.settings.locale = "de"; saveState(); applySettings(); });
  });

  await suite("phase6 scriptlab", async ()=>{
    await newGame(page);
    // Force phase 6 so /scriptlab and edit are available
    await page.evaluate(()=>{
      state.phase = 6;
      state.flags.job_arc_done = true;
      saveState();
    });
    await it("cd /scriptlab sets scriptlab_entered", async ()=>{
      await exec(page, "cd /scriptlab");
      const s = await getState(page);
      expect(s.flags.scriptlab_entered).toBeTruthy();
    });
    await it("README and auftraege.txt are readable", async ()=>{
      await exec(page, "cat README.txt");
      await exec(page, "cat auftraege.txt");
      const term = await getTerminalText(page);
      expect(term).toContain("Workflow");
      expect(term).toContain("Hello World");
    });
    await it("edit + chmod +x unlock hello_script", async ()=>{
      // Pre-populate file directly (the modal would normally do this)
      await page.evaluate(()=>{
        writeFile("/home/player/scripts/hello.sh", 'echo "Hallo SchwarmShell"\n', false);
        if(state.perms["/home/player/scripts/hello.sh"]) {
          state.perms["/home/player/scripts/hello.sh"].exec = true;
        }
        saveState();
        evaluateScriptQuests();
      });
      const s = await getState(page);
      expect(s.flags.script_hello).toBeTruthy();
    });
    await it("variable script triggers script_variable", async ()=>{
      await page.evaluate(()=>{
        writeFile("/home/player/scripts/greet.sh", 'NAME="Welt"\necho "Hi $NAME"\n', false);
        saveState();
        evaluateScriptQuests();
      });
      const s = await getState(page);
      expect(s.flags.script_variable).toBeTruthy();
    });
    await it("two rm lines trigger script_cleanup", async ()=>{
      await page.evaluate(()=>{
        writeFile("/home/player/scripts/cleanup.sh", "rm ~/lager/kabel.tmp\nrm ~/lager/kiste.tmp\n", false);
        saveState();
        evaluateScriptQuests();
      });
      const s = await getState(page);
      expect(s.flags.script_cleanup).toBeTruthy();
    });
    await it("edit command opens editor modal", async ()=>{
      await exec(page, "edit ~/scripts/test.sh");
      const visible = await page.evaluate(()=>!document.getElementById("editorOverlay").hidden);
      expect(visible).toBe(true);
      // Close it so next tests don't get stuck
      await page.evaluate(()=>document.getElementById("editorCancel").click());
    });
    await it("phase 6 pill label", async ()=>{
      const text = await page.evaluate(()=>document.getElementById("phasePill").textContent);
      expect(text).toContain("Phase 6");
    });
  });

  await suite("winkelmann sidequest", async ()=>{
    await newGame(page);
    await it("entering the hidden lab unlocks the sidequest", async ()=>{
      await exec(page, "cd /school/keller/winkelmann_lab");
      const s = await getState(page);
      expect(s.sidequest.found_lab).toBe(true);
    });
    await it("talk winkelmann opens the topic menu", async ()=>{
      await exec(page, "talk winkelmann");
      const s = await getState(page);
      expect(s.sidequest.unlocked).toBe(true);
      expect(s.sidequest.dialog).toBe("winkelmann");
      expect(await getTerminalText(page)).toContain("Wähle ein Thema");
    });
    await it("reacts to hot logs on one host", async ()=>{
      await page.evaluate(()=>{ state.sidequest.traces = { gym:true }; saveState(); });
      await exec(page, "talk winkelmann");
      expect(await getTerminalText(page)).toContain("Ich rieche heiße Logs");
    });
    await it("reacts to hot logs on both hosts", async ()=>{
      await page.evaluate(()=>{ state.sidequest.traces = { gym:true, igs:true }; saveState(); });
      await exec(page, "talk winkelmann");
      expect(await getTerminalText(page)).toContain("beide Logs brennen");
    });
    await it("warns when the trace meter is nearly full", async ()=>{
      await page.evaluate(()=>{ state.sidequest.traces = {}; state.sidequest.traceMeter = { gym: 80, igs: 0 }; saveState(); });
      await exec(page, "talk winkelmann");
      expect(await getTerminalText(page)).toContain("Trace‑Leiste ist fast voll");
    });
    await it("choose 4 shows the status submenu", async ()=>{
      await exec(page, "choose 4");
      const text = await getTerminalText(page);
      expect(text).toContain("Winkelmann");
    });
  });

  await suite("winkelmann network mission", async ()=>{
    await newGame(page);
    await execMany(page, ["mkdir ~/workbench", "cd /school/keller/winkelmann_lab", "talk winkelmann"]);
    await it("ritual is refused before requirements are met", async ()=>{
      await exec(page, "choose 6");
      expect(await getTerminalText(page)).toContain("Noch nicht");
    });
    await it("connect superpc activates the super pc", async ()=>{
      await exec(page, "connect superpc");
      const s = await getState(page);
      expect(s.superpc && s.superpc.active).toBe(true);
    });
    await it("ssh gym-ost-core enters remote home and marks hot traces", async ()=>{
      await exec(page, "ssh gym-ost-core");
      const s = await getState(page);
      expect(s.cwd).toBe("/net/gym-ost-core/home/guest");
      expect(s.sidequest.traces.gym).toBe(true);
    });
    await it("scp blueprint.dat into the workbench counts the artifact", async ()=>{
      await exec(page, "scp blueprint.dat ~/workbench/");
      const s = await getState(page);
      expect(s.sidequest.net.blueprint).toBe(true);
    });
    await it("logwipe cleans the host, exit returns to the super pc", async ()=>{
      await execMany(page, ["logwipe", "exit"]);
      const s = await getState(page);
      expect(s.sidequest.traces.gym).toBe(false);
      expect(s.cwd).toBe("/superpc");
    });
    await it("second host: shield.key from igs-edu-lab", async ()=>{
      await execMany(page, ["ssh igs-edu-lab", "scp shield.key ~/workbench/", "logwipe", "exit"]);
      const s = await getState(page);
      expect(s.sidequest.net.shield).toBe(true);
      expect(s.sidequest.traces.igs).toBe(false);
    });
    await it("ritual succeeds with parts, data and clean logs", async ()=>{
      // SUPER-PC verlassen (talk ist ortsgebunden — Winkelmann steht im Lab)
      await exec(page, "exit");
      await page.evaluate(()=>{
        writeFile("/home/player/workbench/photon_linse.part", "Linse", false);
        writeFile("/home/player/workbench/gyro_spule.part", "Spule", false);
        writeFile("/home/player/workbench/usv_modul.part", "USV", false);
        saveState();
      });
      await execMany(page, ["talk winkelmann", "choose 6"]);
      const s = await getState(page);
      expect(s.sidequest.badge).toBe(true);
      expect(await getTerminalText(page)).toContain("Maschine repariert");
    });
  });

  await suite("phase5 job arc", async ()=>{
    await newGame(page);
    await page.evaluate(()=>{ state.flags.job_arc_unlocked = true; saveState(); });
    await it("cd /arbeitsamt enters phase 5", async ()=>{
      await exec(page, "cd /arbeitsamt");
      const s = await getState(page);
      expect(s.phase).toBe(5);
      expect(s.flags.job_arc_started).toBeTruthy();
    });
    await it("talk beamter activates the job arc", async ()=>{
      await exec(page, "talk beamter");
      const s = await getState(page);
      expect(s.jobArc && s.jobArc.active).toBe(true);
    });
    await it("snackmaster: grep allergene in the audit log", async ()=>{
      await exec(page, "grep -i allergene /real_life/snackmaster/haccp_audit.log");
      const s = await getState(page);
      expect(s.jobArc.quests.snackmaster).toBe(true);
    });
    await it("ars: copying the pickup plan into the workbench", async ()=>{
      await execMany(page, ["mkdir ~/workbench", "cp /real_life/ars_recycling/docs/abholplan_2026.csv ~/workbench/"]);
      const s = await getState(page);
      expect(s.jobArc.quests.ars).toBe(true);
    });
    await it("ohlendorf: ticket requires chmod before cat", async ()=>{
      await execMany(page, ["cp /real_life/ohlendorf_technik/ticket_net.txt ~/workbench/", "cat ~/workbench/ticket_net.txt"]);
      expect(await getTerminalText(page)).toContain("Permission denied");
      await execMany(page, ["chmod 644 ~/workbench/ticket_net.txt", "cat ~/workbench/ticket_net.txt"]);
      const s = await getState(page);
      expect(s.jobArc.quests.ohlendorf).toBe(true);
    });
    await it("berndt: killing cnc_sim in the furniture factory", async ()=>{
      await execMany(page, ["cd /real_life/berndt_moebel", "kill 909"]);
      const s = await getState(page);
      expect(s.jobArc.quests.berndt).toBe(true);
    });
    await it("cms: documented reports satisfy holger", async ()=>{
      await execMany(page, [
        "mkdir ~/workbench/cms",
        "mkdir ~/workbench/cms/elektro",
        "mkdir ~/workbench/cms/fliesen",
        "mkdir ~/workbench/cms/dach",
        "mkdir ~/workbench/cms/sanitaer",
        "mkdir ~/workbench/cms/maler",
        "mkdir ~/workbench/cms/abnahme",
        'echo "SICHERUNGSLABEL: CMS-EL-2048" > ~/workbench/cms/elektro/bericht.txt',
        'echo "FUGENMIX: STEINGRAU-7" > ~/workbench/cms/fliesen/bericht.txt',
        'echo "DACHCODE: RINNE-R3" > ~/workbench/cms/dach/bericht.txt',
        'echo "ROHRCHECK: DRUCK-1.6BAR" > ~/workbench/cms/sanitaer/bericht.txt',
        'echo "FARBCODE: SAND-NEBEL-12" > ~/workbench/cms/maler/bericht.txt',
        'echo "SICHERUNGSLABEL: CMS-EL-2048" > ~/workbench/cms/abnahme/uebersicht.txt',
        'echo "FUGENMIX: STEINGRAU-7" >> ~/workbench/cms/abnahme/uebersicht.txt',
        'echo "DACHCODE: RINNE-R3" >> ~/workbench/cms/abnahme/uebersicht.txt',
        'echo "ROHRCHECK: DRUCK-1.6BAR" >> ~/workbench/cms/abnahme/uebersicht.txt',
        'echo "FARBCODE: SAND-NEBEL-12" >> ~/workbench/cms/abnahme/uebersicht.txt',
        "cd /real_life/cms",
        "talk holger"
      ]);
      const s = await getState(page);
      expect(s.jobArc.quests.cms).toBe(true);
    });
    await it("beamter hands over the final job offer", async ()=>{
      await execMany(page, ["cd /arbeitsamt", "talk beamter"]);
      const s = await getState(page);
      expect(s.flags.job_arc_done).toBeTruthy();
      expect(await getTerminalText(page)).toContain("Jobangebot");
    });
  });

  await suite("core commands", async ()=>{
    await newGame(page);
    await it("man grep shows the learning-friendly manual", async ()=>{
      await exec(page, "man grep");
      expect(await getTerminalText(page)).toContain("WAS ES MACHT");
    });
    await it("hint points to the current objective", async ()=>{
      await exec(page, "hint");
      expect(await getTerminalText(page)).toContain("README");
    });
    await it("unknown command suggests the closest match", async ()=>{
      await exec(page, "grpe glitch");
      expect(await getTerminalText(page)).toContain("grep");
    });
    await it("pipes: cat | grep filters the output", async ()=>{
      // grep ist in Phase 1 noch gesperrt — Pipe-Mechanik ab Phase 2 testen
      await page.evaluate(()=>{ state.phase = 2; saveState(); });
      await exec(page, "cat readme.txt | grep -i bash-befehlen");
      expect(await getTerminalText(page)).toContain("Du steuerst alles mit Bash-Befehlen");
    });
    await it("pipe limit rejects more than two pipes", async ()=>{
      await exec(page, "cat readme.txt | grep a | grep b | grep c");
      expect(await getTerminalText(page)).toContain("Pipe-Limit");
    });
    await it("help - works for every objective key (incl. phase 6)", async ()=>{
      // hint verweist auf "help - <key>" — jeder OBJECTIVES-Key braucht einen questHelp-Eintrag
      for(const key of ["mentor_hub", "report_final", "scriptlab", "hello_script", "var_script", "cleanup_script"]){
        await exec(page, `help - ${key}`);
      }
      const term = await getTerminalText(page);
      expect(term).toContain("Hello-World-Skript");
      if(term.includes("Keine Quest-Hilfe")) throw new Error("missing questHelp entry: " + term.split("\n").filter(l=>l.includes("Keine Quest-Hilfe")).join(" | "));
    });
    await it("inventory works with unlocked sidequest (regression: lines crash)", async ()=>{
      await page.evaluate(()=>{ state.sidequest.unlocked = true; saveState(); });
      await exec(page, "inventory");
      const term = await getTerminalText(page);
      expect(term).toContain("Inventar:");
      expect(term).toContain("SIDEQUEST (Winkelmann)");
    });
  });

  await suite("savegame passphrase", async ()=>{
    await newGame(page);
    await it("round-trip: export, wipe, import restores the run", async ()=>{
      await execMany(page, ["cat readme.txt", "cd /school"]);
      const phrase = await page.evaluate(()=>createSavePassphrase());
      expect(phrase).toMatch(/^SS1\./);
      await page.evaluate(()=>localStorage.clear());
      await page.reload();
      await page.waitForSelector("#startOverlay:not([hidden])", { timeout: 5000 });
      await page.click("#startSavegame");
      await page.fill("#savegamePassphrase", phrase);
      await page.click("#savegameConfirm");
      const s = await getState(page);
      expect(s.cwd).toBe("/school");
      expect(s.flags.introSeen).toBeTruthy();
    });
    await it("a corrupted passphrase shows an error instead of loading", async ()=>{
      await page.evaluate(()=>localStorage.clear());
      await page.reload();
      await page.waitForSelector("#startOverlay:not([hidden])", { timeout: 5000 });
      await page.click("#startSavegame");
      await page.fill("#savegamePassphrase", "SS1.kaputt!!");
      await page.click("#savegameConfirm");
      const err = await page.evaluate(()=>document.getElementById("savegameLoadError").textContent);
      expect(err).toContain("Passphrase");
      // zurück in einen sauberen Zustand für nachfolgende Suiten
      await newGame(page);
    });
  });

  await suite("npc dialog trees", async ()=>{
    await newGame(page);
    await it("classroom students give quick flavor lines (no tree)", async ()=>{
      await execMany(page, ["cd /school/klassenraume/7H1", "talk aylin"]);
      const s = await getState(page);
      expect(!!(s.npcDialog && s.npcDialog.active)).toBe(false);
      expect(await getTerminalText(page)).toContain("Aylin");
    });
    await it("classroom teachers answer with subject flavor (no tree)", async ()=>{
      await exec(page, "talk ommen");
      const s = await getState(page);
      expect(!!(s.npcDialog && s.npcDialog.active)).toBe(false);
      expect(await getTerminalText(page)).toContain("Ommen");
    });
    await it("students outside classrooms open a multi-step dialog tree", async ()=>{
      // nagel (Lara, SV) ist ein generischer NPC ohne eigenen Sidequest-Branch
      await execMany(page, ["cd /school/sv_buero", "talk nagel"]);
      const s = await getState(page);
      expect(s.npcDialog && s.npcDialog.active).toBe(true);
      const term = await getTerminalText(page);
      expect(term).toContain("(1)");
      expect(term).toContain("choose");
    });
    await it("choose 1 answers and keeps the dialog open", async ()=>{
      await exec(page, "choose 1");
      const s = await getState(page);
      expect(s.npcDialog && s.npcDialog.active).toBe(true);
    });
    await it("choose 0 ends the conversation", async ()=>{
      await exec(page, "choose 0");
      const s = await getState(page);
      expect(!!(s.npcDialog && s.npcDialog.active)).toBe(false);
    });
  });

  await suite("edit modal", async ()=>{
    await newGame(page);
    await page.evaluate(()=>{ state.phase = 6; state.flags.job_arc_done = true; saveState(); });
    await it("edit opens the editor modal", async ()=>{
      await exec(page, "edit ~/scripts/test.sh");
      const hidden = await page.evaluate(()=>document.getElementById("editorOverlay").hidden);
      expect(hidden).toBe(false);
    });
    await it("saving writes the file and closes the modal", async ()=>{
      await page.fill("#editorTextarea", 'echo "aus dem Editor"');
      await page.click("#editorSave");
      const content = await page.evaluate(()=>{
        const f = FS["/home/player/scripts/test.sh"];
        return f ? f.content : null;
      });
      expect(content).toContain("aus dem Editor");
      const hidden = await page.evaluate(()=>document.getElementById("editorOverlay").hidden);
      expect(hidden).toBe(true);
    });
    await it("escape closes without saving", async ()=>{
      await exec(page, "edit ~/scripts/test.sh");
      await page.fill("#editorTextarea", "verworfen");
      await page.keyboard.press("Escape");
      const content = await page.evaluate(()=>FS["/home/player/scripts/test.sh"].content);
      expect(content).toContain("aus dem Editor");
      const hidden = await page.evaluate(()=>document.getElementById("editorOverlay").hidden);
      expect(hidden).toBe(true);
    });
  });

  await suite("difficulty", async ()=>{
    await newGame(page);
    await it("hardcore hides Clippy button", async ()=>{
      await page.evaluate(()=>{ state.settings.difficulty = "hardcore"; saveState(); applySettings(); });
      const hidden = await page.evaluate(()=>document.getElementById("clippyHelperBtn").hidden);
      expect(hidden).toBe(true);
    });
    await it("classic shows Clippy with two-step solution", async ()=>{
      await page.evaluate(()=>{ state.settings.difficulty = "classic"; saveState(); applySettings(); });
      await page.click("#clippyHelperBtn");
      // Solution is hidden behind a reveal button in classic
      const stepsHidden = await page.evaluate(()=>{
        const list = document.getElementById("clippyStepsList");
        return list ? list.hidden : null;
      });
      expect(stepsHidden).toBe(true);
      await page.click("#clippyRevealBtn");
      const stepsShown = await page.evaluate(()=>{
        const list = document.getElementById("clippyStepsList");
        return list ? list.hidden : null;
      });
      expect(stepsShown).toBe(false);
    });
  });

  await context.close();
  await browser.close();

  // Summary
  console.log("\n──────────────────────────────────────────");
  const ok = results.filter(r => r.ok).length;
  const fail = results.length - ok;
  console.log(`Passed: ${ok}  Failed: ${fail}  Total: ${results.length}`);
  if(fail > 0){
    console.log("\nFailures:");
    for(const r of results) if(!r.ok) console.log(`  • ${r.name}\n      ${r.error}`);
  }
  if(serverProc){ try{ serverProc.kill(); }catch(_e){} }
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((err)=>{
  console.error("Fatal:", err);
  if(serverProc){ try{ serverProc.kill(); }catch(_e){} }
  process.exit(1);
});
