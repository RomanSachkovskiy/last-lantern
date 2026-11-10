import type { Bag, Resource, UpgradeId, Upgrades } from './types';

export const SIZE = 11;
export const CENTER = Math.floor(SIZE / 2);

export const RESOURCE_VALUES: Record<Resource, number> = {
  ore: 2,
  crystal: 5,
  relic: 12,
};

export const UPGRADE_COSTS: Record<UpgradeId, readonly number[]> = {
  battery: [8, 18, 32],
  backpack: [9, 21],
  lamp: [12, 28],
  pickaxe: [14],
};

export function emptyBag(): Bag {
  return { ore: 0, crystal: 0, relic: 0 };
}

export function bagCount(bag: Bag): number {
  return bag.ore + bag.crystal + bag.relic;
}

export function bagValue(bag: Bag): number {
  return bag.ore * 2 + bag.crystal * 5 + bag.relic * 12;
}

export function maxEnergy(upgrades: Upgrades): number {
  return 32 + upgrades.battery * 6;
}

export function bagCapacity(upgrades: Upgrades): number {
  return 6 + upgrades.backpack * 3;
}

export function visionRadius(upgrades: Upgrades): number {
  return 2 + upgrades.lamp;
}

export function digCost(upgrades: Upgrades): number {
  return Math.max(1, 2 - upgrades.pickaxe);
}

export function nextUpgradeCost(upgrades: Upgrades, id: UpgradeId): number | null {
  return UPGRADE_COSTS[id][upgrades[id]] ?? null;
}
