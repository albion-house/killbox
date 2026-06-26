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

await page.goto(url, { waitUntil: 'load' });
await page.waitForTimeout(1200);

const loadoutState = await page.evaluate(() => ({
  startHidden: document.getElementById('start')?.classList.contains('hidden') ?? false,
  activeMission: document.querySelector('#start .missionChoice.active')?.dataset.missionType || null,
  expeditionVisible: !document.getElementById('expeditionMissionOptions')?.hasAttribute('hidden'),
  arenaVisible: !document.querySelector('#startArenaSelect')?.closest('.arenaPickRow')?.hasAttribute('hidden'),
}));

if (loadoutState.startHidden) {
  throw new Error('Expected to begin on the loadout screen, but the start overlay was hidden.');
}

await page.click('#start [data-mission-type="expedition"]');
await page.selectOption('#startExpeditionSelect', 'expedition01');
await page.locator('#loadoutPicker button.pickerTile[data-kind="weapon"]').first().click();

const selectedBeforeStart = await page.evaluate(() => ({
  missionType: document.querySelector('#start .missionChoice.active')?.dataset.missionType || null,
  expeditionId: document.getElementById('startExpeditionSelect')?.value || null,
  selectedIds: [...(LOADOUT_STATE.selectedIds || [])],
  beginEnabled: !document.getElementById('begin')?.disabled,
}));

if (selectedBeforeStart.missionType !== 'expedition' || selectedBeforeStart.expeditionId !== 'expedition01') {
  throw new Error(`Failed to select Expedition 01 from the loadout screen: ${JSON.stringify(selectedBeforeStart)}`);
}
if (!selectedBeforeStart.beginEnabled) {
  throw new Error(`Start remained disabled after selecting a weapon: ${JSON.stringify(selectedBeforeStart)}`);
}

await page.click('#begin');
await page.waitForTimeout(1200);

const expeditionLaunch = await page.evaluate(() => {
  const ex = S.expedition;
  return {
    mode: isExpeditionRun() ? 'Expedition' : 'Arena',
    mission: LEVELS[S.levelId]?.label || S.levelId || null,
    riftPresent: !!ex?.rift,
    riftActivated: !!ex?.riftActivated,
    riftFound: !!ex?.riftFound,
    startHidden: document.getElementById('start')?.classList.contains('hidden') ?? false,
    expeditionHudVisible: !!document.querySelector('#ui'),
    objectiveText: document.querySelector('#objectiveHud')?.textContent || '',
  };
});

const launchAssertions = [];
if (expeditionLaunch.mode !== 'Expedition') launchAssertions.push(`Current mode: ${expeditionLaunch.mode}`);
if (expeditionLaunch.mission !== 'Expedition 01') launchAssertions.push(`Current mission: ${expeditionLaunch.mission}`);
if (!expeditionLaunch.riftPresent) launchAssertions.push('Rift present: no');
if (!expeditionLaunch.riftActivated) launchAssertions.push('Rift activated: no');
if (!expeditionLaunch.startHidden) launchAssertions.push('Start overlay still visible');
if (!/Push to Extraction/.test(expeditionLaunch.objectiveText)) launchAssertions.push(`Objective HUD missing expected Expedition text: ${expeditionLaunch.objectiveText}`);
if (consoleErrors.length) launchAssertions.push(`Console errors: ${consoleErrors.join(' | ')}`);

if (launchAssertions.length) {
  console.error('Expedition launch verification failed');
  console.error(JSON.stringify({ loadoutState, selectedBeforeStart, expeditionLaunch, launchAssertions }, null, 2));
  await page.screenshot({ path: '/tmp/killbox-expedition-launch-failed.png' });
  await browser.close();
  await new Promise(resolve => server?.close(resolve) ?? resolve());
  process.exit(1);
}

console.log('Current mode: Expedition');
console.log('Current mission: Expedition 01');
console.log('Rift present: yes');
console.log(JSON.stringify({ loadoutState, selectedBeforeStart, expeditionLaunch }, null, 2));

await page.click('#missionBriefingClose');
await page.waitForTimeout(300);
await page.screenshot({ path: '/tmp/killbox-expedition-normal.png' });

await page.evaluate(() => {
  if (!S.expedition?.rift) throw new Error('Rift missing after Expedition launch.');
  S.expedition.rift.hp = S.expedition.rift.max;
  S.expedition.riftWarnState = 0;
  S.expedition.riftWarnPulse = 0;
  S.expedition.riftWarnFlash = 0;
  S.expedition.riftWarnBeep = 0;
  ui();
});

await page.evaluate(() => devDamageCore(600));
await page.waitForTimeout(250);
await page.screenshot({ path: '/tmp/killbox-expedition-warning.png' });

await page.evaluate(() => devDamageCore(220));
await page.waitForTimeout(250);
await page.screenshot({ path: '/tmp/killbox-expedition-critical.png' });

await page.evaluate(() => {
  S.expedition.rift.hp = Math.min(S.expedition.rift.max, 70);
  updateExpeditionRiftWarning(0.016);
});
await page.waitForTimeout(250);
await page.screenshot({ path: '/tmp/killbox-expedition-recovered.png' });

await page.evaluate(() => {
  S.expedition = null;
  S.levelId = 'field';
  S.started = true;
  S.gameOver = false;
  S.phase = 'combat';
  S.hero.hp = 34;
  S.hero.max = 100;
  S.lowHealthState = 0;
  S.lowHealthPulse = 0;
  S.lowHealthFlash = 0;
  S.lowHealthBeep = 0;
  ui();
});
await page.waitForTimeout(250);
await page.evaluate(() => updateLowHealthWarning(0.016));
await page.screenshot({ path: '/tmp/killbox-arena-warning.png' });

await browser.close();
await new Promise(resolve => server?.close(resolve) ?? resolve());
