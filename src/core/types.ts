export type Resource = 'ore' | 'crystal' | 'relic';
export type TileKind = 'wall' | 'floor' | 'exit';
export type UpgradeId = 'battery' | 'backpack' | 'lamp' | 'pickaxe';

export interface Tile {
  kind: TileKind;
  resource: Resource | null;
}

export interface Position {
  x: number;
  y: number;
}

export interface Bag {
  ore: number;
  crystal: number;
  relic: number;
}

export interface Upgrades {
  battery: number;
  backpack: number;
  lamp: number;
  pickaxe: number;
}

export interface Expedition {
  tiles: Tile[][];
  seen: boolean[][];
  player: Position;
  energy: number;
  bag: Bag;
  seed: number;
}

export type EndReason = 'safe' | 'emergency' | 'lost';

export interface ExpeditionResult {
  reason: EndReason;
  totalValue: number;
  earned: number;
}

export interface SaveData {
  version: 1;
  gold: number;
  upgrades: Upgrades;
  runsCompleted: number;
  bestBanked: number;
  expedition: Expedition | null;
  lastResult: ExpeditionResult | null;
}

export interface ActionResult {
  message: string;
  changed: boolean;
  result?: ExpeditionResult;
}
