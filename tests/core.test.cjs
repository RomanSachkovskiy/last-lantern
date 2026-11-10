const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.join(__dirname, '..');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'last-lantern-test-'));

try {
  const core = path.join(root, 'src', 'core');
  const sources = fs.readdirSync(core)
    .filter((filename) => filename.endsWith('.ts'))
    .map((filename) => path.join(core, filename));
  execFileSync(path.join(root, 'node_modules', '.bin', 'tsc'), [
    '--target', 'ES2022',
    '--module', 'commonjs',
    '--moduleResolution', 'node',
    '--strict',
    '--outDir', temp,
    ...sources,
  ], { stdio: 'inherit' });

  const engine = require(path.join(temp, 'engine.js'));
  const map = require(path.join(temp, 'map.js'));
  const balance = require(path.join(temp, 'balance.js'));

  const save = engine.defaultSave();
  engine.beginExpedition(save, 42);
  assert.equal(save.expedition.tiles.length, balance.SIZE);
  assert.equal(save.expedition.tiles[4][5].resource, 'ore');
  assert.deepEqual(map.generateExpedition(42, save.upgrades).tiles, save.expedition.tiles);
  assert.equal(engine.step(save, 0, -1).changed, true);
  assert.equal(save.expedition.bag.ore, 1);
  assert.equal(save.expedition.energy, 31);
  assert.equal(engine.attemptSafeReturn(save).changed, false);
  engine.step(save, 0, 1);
  const safe = engine.attemptSafeReturn(save);
  assert.equal(safe.result.earned, 2);
  assert.equal(save.gold, 2);
  assert.equal(save.expedition, null);

  engine.beginExpedition(save, 43);
  engine.step(save, 1, 0);
  const evacuation = engine.emergencyReturn(save);
  assert.equal(evacuation.result.earned, 1);
  save.gold = 100;
  assert.equal(engine.buyUpgrade(save, 'pickaxe'), true);
  assert.equal(engine.buyUpgrade(save, 'pickaxe'), false);

  for (let seed = 1; seed <= 250; seed++) {
    const run = map.generateExpedition(seed, save.upgrades);
    assert.equal(run.tiles.length, balance.SIZE);
    assert(run.tiles.every((row) => row.length === balance.SIZE));
    assert.equal(run.tiles[5][5].kind, 'exit');
    assert.equal(run.tiles[4][5].kind, 'floor');
    assert.equal(run.tiles[5][6].kind, 'floor');
  }
  console.log('PASS: сохраняемые награды, возврат, эвакуация, улучшения, 250 карт');
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
