import { chromium } from 'playwright';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';

let server;
let url = process.env.KILLBOX_URL;
if (!url) {
  const root = path.resolve('src');
  server = http.createServer(async (request, response) => {
    try {
      const pathname = new URL(request.url, 'http://127.0.0.1').pathname;
      const relative = pathname === '/' ? 'killbox.html' : pathname.slice(1);
      const file = path.resolve(root, relative);
      if (!file.startsWith(`${root}${path.sep}`) && file !== root) throw new Error('invalid path');
      await stat(file);
      const extension = path.extname(file);
      const contentTypes = {
        '.html': 'text/html; charset=utf-8',
        '.js': 'text/javascript; charset=utf-8',
        '.png': 'image/png',
        '.svg': 'image/svg+xml',
      };
      response.setHeader('content-type', contentTypes[extension] || 'application/octet-stream');
      createReadStream(file).pipe(response);
    } catch {
      response.statusCode = 404;
      response.end('Not found');
    }
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  url = `http://127.0.0.1:${address.port}/killbox.html`;
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
const consoleErrors = [];
page.on('console', msg => {
  if (msg.type() === 'error') consoleErrors.push(msg.text());
});
page.on('pageerror', err => {
  consoleErrors.push(err.message);
});

await page.addInitScript(() => {
  try { localStorage.clear(); } catch {}
});

async function launchMission(missionType) {
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  await page.evaluate(() => {
    window.__tones = [];
    const original = window.playTone;
    window.playTone = function(args) {
      window.__tones.push(args);
      return original(args);
    };
  });

  const startVisible = await page.evaluate(() => !document.getElementById('start')?.classList.contains('hidden'));
  if (!startVisible) throw new Error('Expected to start from the loadout screen.');

  await page.click(`#start [data-mission-type="${missionType}"]`);
  const weaponTile = page.locator('#loadoutPicker button.pickerTile[data-kind="weapon"]').first();
  await weaponTile.click();

  const selectedBeforeStart = await page.evaluate(() => ({
    missionType: document.querySelector('#start .missionChoice.active')?.dataset.missionType || null,
    selectedIds: [...(LOADOUT_STATE.selectedIds || [])],
    beginEnabled: !document.getElementById('begin')?.disabled,
    expeditionId: document.getElementById('startExpeditionSelect')?.value || null,
    arenaId: document.getElementById('startArenaSelect')?.value || null,
  }));

  if (selectedBeforeStart.missionType !== missionType) {
    throw new Error(`Mission selection failed: ${JSON.stringify(selectedBeforeStart)}`);
  }
  if (!selectedBeforeStart.beginEnabled) {
    throw new Error(`Start remained disabled after loadout selection: ${JSON.stringify(selectedBeforeStart)}`);
  }

  await page.click('#begin');
  await page.waitForTimeout(1200);

  await page.evaluate(() => {
    const briefing = document.getElementById('missionBriefing');
    if (briefing && !briefing.classList.contains('hidden')) {
      document.getElementById('missionBriefingClose')?.click();
    }
  });
  await page.waitForTimeout(300);

  return selectedBeforeStart;
}

async function collectHeroWarningState(modeLabel, screenshotBase) {
  const states = [];
  for (const hp of [34, 19, 9, 50]) {
    const state = await page.evaluate((hpValue) => {
      if (isExpeditionRun()) {
        S.hero.hp = hpValue;
        S.hero.max = 100;
        updateLowHealthWarning(0.016);
        return {
          mode: 'Expedition',
          hp: S.hero.hp,
          state: S.lowHealthState,
          flash: S.lowHealthFlash,
          pulse: S.lowHealthPulse,
          tones: window.__tones ? window.__tones.slice() : [],
          riftState: S.expedition?.riftWarnState || 0,
          riftHp: S.expedition?.rift?.hp ?? null,
        };
      }
      S.hero.hp = hpValue;
      S.hero.max = 100;
      updateLowHealthWarning(0.016);
      return {
        mode: 'Arena',
        hp: S.hero.hp,
        state: S.lowHealthState,
        flash: S.lowHealthFlash,
        pulse: S.lowHealthPulse,
        tones: window.__tones ? window.__tones.slice() : [],
        riftState: 0,
        riftHp: null,
      };
    }, hp);
    await page.waitForTimeout(150);
    const shot = `/tmp/${screenshotBase}-${hp}.png`;
    await page.screenshot({ path: shot });
    states.push({ hp, ...state, shot });
    await page.evaluate(() => { window.__tones = []; });
  }
  console.log(`${modeLabel} hero warning states:`);
  console.log(JSON.stringify(states, null, 2));
  return states;
}

await page.evaluate(() => {
  window.__tones = [];
});

const expeditionSelected = await launchMission('expedition');
const expeditionLaunch = await page.evaluate(() => {
  const ex = S.expedition;
  return {
    mode: isExpeditionRun() ? 'Expedition' : 'Arena',
    mission: LEVELS[S.levelId]?.label || S.levelId || null,
    riftPresent: !!ex?.rift,
    objectiveText: document.querySelector('#objectiveHud')?.textContent || '',
    hudVisible: !!document.querySelector('#ui'),
    startHidden: document.getElementById('start')?.classList.contains('hidden') ?? false,
  };
});

if (expeditionLaunch.mode !== 'Expedition' || expeditionLaunch.mission !== 'Expedition 01' || !expeditionLaunch.riftPresent) {
  console.error(JSON.stringify({ expeditionSelected, expeditionLaunch }, null, 2));
  throw new Error('Expedition launch verification failed.');
}

console.log('Current mode: Expedition');
console.log('Current mission: Expedition 01');
console.log('Rift present: yes');
console.log(JSON.stringify({ expeditionSelected, expeditionLaunch }, null, 2));

await page.screenshot({ path: '/tmp/killbox-hero-expedition-normal.png' });
const expeditionStates = await collectHeroWarningState('Expedition', 'killbox-hero-expedition');

await page.evaluate(() => {
  S.expedition.rift.hp = Math.max(S.expedition.rift.hp || 0, S.expedition.rift.max || 100);
  S.hero.hp = 60;
  updateExpeditionRiftWarning(0.016);
  updateLowHealthWarning(0.016);
});

// Arena comparison. Reload from the loadout screen and launch Arena cleanly.
const arenaSelected = await launchMission('arena');
await page.waitForFunction(() => S.hero?.spawnState !== 'spawning', null, { timeout: 5000 });
await page.evaluate(() => {
  if (typeof startWave === 'function' && (S.phase !== 'combat' || !S.waveActive)) {
    startWave();
  }
});
await page.waitForTimeout(700);
const arenaLaunch = await page.evaluate(() => ({
  mode: isExpeditionRun() ? 'Expedition' : 'Arena',
  mission: LEVELS[S.levelId]?.label || S.levelId || null,
  riftPresent: !!S.expedition?.rift,
  objectiveText: document.querySelector('#objectiveHud')?.textContent || '',
  hudVisible: !!document.querySelector('#ui'),
  startHidden: document.getElementById('start')?.classList.contains('hidden') ?? false,
  phase: S.phase,
  waveActive: S.waveActive,
}));

if (arenaLaunch.mode !== 'Arena') {
  console.error(JSON.stringify({ arenaSelected, arenaLaunch }, null, 2));
  throw new Error('Arena comparison launch failed.');
}

console.log('Current mode: Arena');
console.log('Current mission: Field');
console.log('Rift present: no');
console.log(JSON.stringify({ arenaSelected, arenaLaunch }, null, 2));

await page.screenshot({ path: '/tmp/killbox-hero-arena-normal.png' });
const arenaStates = await collectHeroWarningState('Arena', 'killbox-hero-arena');

const failures = [];
if (!expeditionStates.some(s => s.state === 1)) failures.push('Expedition warning threshold did not reach state 1.');
if (!expeditionStates.some(s => s.state === 2)) failures.push('Expedition warning threshold did not reach state 2.');
if (!expeditionStates.some(s => s.state === 3)) failures.push('Expedition warning threshold did not reach state 3.');
if (!arenaStates.some(s => s.state === 1)) failures.push('Arena warning threshold did not reach state 1.');
if (!arenaStates.some(s => s.state === 2)) failures.push('Arena warning threshold did not reach state 2.');
if (!arenaStates.some(s => s.state === 3)) failures.push('Arena warning threshold did not reach state 3.');
if (consoleErrors.length) failures.push(`Console errors: ${consoleErrors.join(' | ')}`);

if (failures.length) {
  console.error('Hero warning verification failed');
  console.error(JSON.stringify({ expeditionStates, arenaStates, failures }, null, 2));
  await browser.close();
  await new Promise(resolve => server?.close(resolve) ?? resolve());
  process.exit(1);
}

await browser.close();
await new Promise(resolve => server?.close(resolve) ?? resolve());
