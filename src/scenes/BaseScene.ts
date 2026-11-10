import Phaser from 'phaser';
import { bagCapacity, digCost, maxEnergy, nextUpgradeCost, visionRadius } from '../core/balance';
import { beginExpedition, buyUpgrade } from '../core/engine';
import { gameState, persist } from '../core/storage';
import type { UpgradeId } from '../core/types';
import { addButton } from '../ui/button';
import { COLORS } from '../ui/palette';

const UPGRADE_ROWS: { id: UpgradeId; name: string; description: string }[] = [
  { id: 'battery', name: 'Аккумулятор', description: '+6 энергии' },
  { id: 'backpack', name: 'Рюкзак', description: '+3 места' },
  { id: 'lamp', name: 'Фонарь', description: '+1 радиус света' },
  { id: 'pickaxe', name: 'Кирка', description: 'Копать за 1 энергию' },
];

export class BaseScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Base' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.background);
    this.add.text(320, 66, 'ПОСЛЕДНИЙ ФОНАРЬ', {
      fontFamily: 'Arial, sans-serif', fontSize: '38px', color: COLORS.ink, fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(320, 112, 'Найди сокровища. Сохрани заряд. Вернись домой.', {
      fontFamily: 'Arial, sans-serif', fontSize: '18px', color: COLORS.muted,
    }).setOrigin(0.5);

    this.add.rectangle(320, 200, 560, 112, COLORS.panel);
    this.add.text(70, 161, `Монеты: ${gameState.gold}     Завершено экспедиций: ${gameState.runsCompleted}`, {
      fontFamily: 'Arial, sans-serif', fontSize: '22px', color: '#eed3a2',
    });
    this.add.text(70, 202, `Рекорд: ${gameState.bestBanked} монет     Заряд: ${maxEnergy(gameState.upgrades)}     Мест: ${bagCapacity(gameState.upgrades)}`, {
      fontFamily: 'Arial, sans-serif', fontSize: '18px', color: COLORS.ink,
    });
    this.add.text(70, 229, `Свет: ${visionRadius(gameState.upgrades)}     Цена разрушения камня: ${digCost(gameState.upgrades)}`, {
      fontFamily: 'Arial, sans-serif', fontSize: '17px', color: COLORS.muted,
    });

    addButton(
      this, 320, 303, 540, 62,
      gameState.expedition ? 'Продолжить экспедицию' : 'Отправиться в шахту',
      () => {
        beginExpedition(gameState);
        persist();
        this.scene.start('Mine');
      },
    );

    this.add.text(53, 360, 'ПОСТОЯННЫЕ УЛУЧШЕНИЯ', {
      fontFamily: 'Arial, sans-serif', fontSize: '23px', color: COLORS.ink, fontStyle: 'bold',
    });
    UPGRADE_ROWS.forEach((upgrade, i) => {
      const y = 415 + i * 72;
      const level = gameState.upgrades[upgrade.id];
      const cost = nextUpgradeCost(gameState.upgrades, upgrade.id);
      this.add.rectangle(320, y, 540, 64, COLORS.panel);
      this.add.text(68, y - 20, `${upgrade.name} · уровень ${level}`, {
        fontFamily: 'Arial, sans-serif', fontSize: '20px', color: COLORS.ink,
      });
      this.add.text(68, y + 8, upgrade.description, {
        fontFamily: 'Arial, sans-serif', fontSize: '16px', color: COLORS.muted,
      });
      addButton(this, 505, y, 140, 45, cost === null ? 'МАКС' : `${cost} монет`, () => {
        if (buyUpgrade(gameState, upgrade.id)) {
          persist();
          this.scene.restart();
        }
      }, cost !== null && gameState.gold >= cost);
    });

    const result = gameState.lastResult;
    if (result) {
      const reason = result.reason === 'safe' ? 'Возвращение к лестнице' :
        result.reason === 'emergency' ? 'Экстренная эвакуация' : 'Фонарь погас';
      this.add.text(320, 726, `${reason} · +${result.earned} монет из ${result.totalValue}`, {
        fontFamily: 'Arial, sans-serif', fontSize: '18px', color: '#eed3a2',
      }).setOrigin(0.5);
    } else {
      this.add.text(320, 726, 'Каждая шахта генерируется заново.', {
        fontFamily: 'Arial, sans-serif', fontSize: '18px', color: COLORS.muted,
      }).setOrigin(0.5);
    }
  }
}
