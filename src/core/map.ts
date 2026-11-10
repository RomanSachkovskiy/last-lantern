import { CENTER, SIZE, visionRadius } from './balance';
import type { Expedition, Resource, Tile, Upgrades } from './types';

function rngFromSeed(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a += 0x6D2B79F5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function inBounds(x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < SIZE && y < SIZE;
}

export function isBorder(x: number, y: number): boolean {
  return x === 0 || y === 0 || x === SIZE - 1 || y === SIZE - 1;
}

function distance(x: number, y: number, px: number, py: number): number {
  return Math.abs(x - px) + Math.abs(y - py);
}

export function reveal(expedition: Expedition, upgrades: Upgrades): void {
  const { x, y } = expedition.player;
  const radius = visionRadius(upgrades);
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      if (distance(col, row, x, y) <= radius) expedition.seen[row][col] = true;
    }
  }
}

export function currentlyVisible(expedition: Expedition, upgrades: Upgrades, x: number, y: number): boolean {
  return distance(x, y, expedition.player.x, expedition.player.y) <= visionRadius(upgrades);
}

export function generateExpedition(seed: number, upgrades: Upgrades): Expedition {
  const random = rngFromSeed(seed);
  const tiles: Tile[][] = [];

  for (let y = 0; y < SIZE; y++) {
    const row: Tile[] = [];
    for (let x = 0; x < SIZE; x++) {
      const nearStart = distance(x, y, CENTER, CENTER) <= 1;
      const wall = isBorder(x, y) || (!nearStart && random() < 0.23);
      row.push({ kind: wall ? 'wall' : 'floor', resource: null });
    }
    tiles.push(row);
  }

  tiles[CENTER][CENTER].kind = 'exit';
  // Два первых ресурса гарантированы рядом со стартом.
  tiles[CENTER - 1][CENTER].resource = 'ore';
  tiles[CENTER][CENTER + 1].resource = 'ore';

  const candidates: { x: number; y: number }[] = [];
  for (let y = 1; y < SIZE - 1; y++) {
    for (let x = 1; x < SIZE - 1; x++) {
      if (tiles[y][x].kind === 'floor' && !tiles[y][x].resource && distance(x, y, CENTER, CENTER) >= 2) {
        candidates.push({ x, y });
      }
    }
  }
  // Перемешивание Фишера — Йетса: одинаковые шансы каждой подходящей клетки.
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }

  const resources: Resource[] = [
    ...Array<Resource>(11).fill('ore'),
    ...Array<Resource>(5).fill('crystal'),
    ...Array<Resource>(2).fill('relic'),
  ];
  resources.forEach((resource, i) => {
    const candidate = candidates[i];
    if (candidate) tiles[candidate.y][candidate.x].resource = resource;
  });

  const expedition: Expedition = {
    tiles,
    seen: Array.from({ length: SIZE }, () => Array<boolean>(SIZE).fill(false)),
    player: { x: CENTER, y: CENTER },
    energy: 32 + upgrades.battery * 6,
    bag: { ore: 0, crystal: 0, relic: 0 },
    seed,
  };
  reveal(expedition, upgrades);
  return expedition;
}
