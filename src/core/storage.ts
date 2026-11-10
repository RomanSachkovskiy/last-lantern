import { defaultSave } from './engine';
import type { SaveData } from './types';

const STORAGE_KEY = 'last-lantern-save-v1';

function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSave();
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== 'object') return defaultSave();
    const save = data as Partial<SaveData>;
    if (save.version !== 1 || typeof save.gold !== 'number' || !save.upgrades || !Number.isFinite(save.gold)) {
      return defaultSave();
    }
    if (typeof save.runsCompleted !== 'number' || typeof save.bestBanked !== 'number') return defaultSave();
    // SaveData имеет версию. При изменении формата нужно написать миграцию.
    return save as SaveData;
  } catch {
    return defaultSave();
  }
}

export const gameState = loadSave();

export function persist(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
  } catch {
    // Приватный режим и блокировка хранилища: игра остаётся доступной без сохранений.
  }
}
