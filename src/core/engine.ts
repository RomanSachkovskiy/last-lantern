import { bagCapacity, bagCount, bagValue, CENTER, digCost, nextUpgradeCost } from './balance';
import { generateExpedition, inBounds, isBorder, reveal } from './map';
import type { ActionResult, EndReason, ExpeditionResult, SaveData, UpgradeId } from './types';

export function defaultSave(): SaveData {
  return {
    version: 1,
    gold: 0,
    upgrades: { battery: 0, backpack: 0, lamp: 0, pickaxe: 0 },
    runsCompleted: 0,
    bestBanked: 0,
    expedition: null,
    lastResult: null,
  };
}

export function beginExpedition(save: SaveData, seed = Math.floor(Math.random() * 2 ** 32)): void {
  if (save.expedition) return;
  save.expedition = generateExpedition(seed, save.upgrades);
  save.lastResult = null;
}

export function buyUpgrade(save: SaveData, id: UpgradeId): boolean {
  const cost = nextUpgradeCost(save.upgrades, id);
  if (cost === null || save.gold < cost) return false;
  save.gold -= cost;
  save.upgrades[id]++;
  return true;
}

export function finishExpedition(save: SaveData, reason: EndReason): ExpeditionResult | null {
  const run = save.expedition;
  if (!run) return null;
  const totalValue = bagValue(run.bag);
  const fraction = reason === 'safe' ? 1 : reason === 'emergency' ? 0.5 : 0.2;
  const earned = Math.floor(totalValue * fraction);
  save.gold += earned;
  save.bestBanked = Math.max(save.bestBanked, earned);
  save.runsCompleted++;
  save.expedition = null;
  save.lastResult = { reason, totalValue, earned };
  return save.lastResult;
}

export function attemptSafeReturn(save: SaveData): ActionResult {
  const run = save.expedition;
  if (!run) return { changed: false, message: 'Экспедиция не начата.' };
  if (run.player.x !== CENTER || run.player.y !== CENTER) {
    return { changed: false, message: 'Чтобы сохранить 100%, вернись к лестнице в центре.' };
  }
  const result = finishExpedition(save, 'safe');
  return { changed: true, message: 'Ты вернулась на поверхность.', result: result ?? undefined };
}

export function emergencyReturn(save: SaveData): ActionResult {
  const result = finishExpedition(save, 'emergency');
  return { changed: result !== null, message: 'Экстренная эвакуация: сохранено 50% добычи.', result: result ?? undefined };
}

export function step(save: SaveData, dx: number, dy: number): ActionResult {
  const run = save.expedition;
  if (!run) return { changed: false, message: 'Экспедиция не начата.' };
  if (Math.abs(dx) + Math.abs(dy) !== 1) return { changed: false, message: 'Можно ходить только на соседнюю клетку.' };

  const x = run.player.x + dx;
  const y = run.player.y + dy;
  if (!inBounds(x, y) || isBorder(x, y)) return { changed: false, message: 'Дальше сплошная порода.' };

  const tile = run.tiles[y][x];
  let message: string;
  if (tile.kind === 'wall') {
    const cost = digCost(save.upgrades);
    if (run.energy < cost) {
      const result = finishExpedition(save, 'lost');
      return { changed: true, message: 'Для добычи не хватило энергии.', result: result ?? undefined };
    }
    run.energy -= cost;
    tile.kind = 'floor';
    message = 'Камень разрушен. Теперь можно пройти.';
  } else {
    if (run.energy < 1) {
      const result = finishExpedition(save, 'lost');
      return { changed: true, message: 'Фонарь погас.', result: result ?? undefined };
    }
    run.player.x = x;
    run.player.y = y;
    run.energy--;
    message = 'Ты продвинулась дальше.';
    if (tile.resource) {
      if (bagCount(run.bag) < bagCapacity(save.upgrades)) {
        const resource = tile.resource;
        run.bag[resource]++;
        tile.resource = null;
        message = resource === 'ore' ? 'Найдена руда!' : resource === 'crystal' ? 'Найден кристалл!' : 'Найдена реликвия!';
      } else {
        message = 'Рюкзак заполнен — находка осталась на земле.';
      }
    }
  }

  reveal(run, save.upgrades);
  if (run.energy <= 0 && (run.player.x !== CENTER || run.player.y !== CENTER)) {
    const result = finishExpedition(save, 'lost');
    return { changed: true, message: 'Фонарь погас. Сохранено 20% добычи.', result: result ?? undefined };
  }
  return { changed: true, message };
}
