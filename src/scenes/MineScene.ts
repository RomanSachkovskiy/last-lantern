import Phaser from 'phaser';
import { bagCapacity, bagCount, bagValue, SIZE, visionRadius } from '../core/balance';
import { attemptSafeReturn, emergencyReturn, step } from '../core/engine';
import { currentlyVisible } from '../core/map';
import { gameState, persist } from '../core/storage';
import type { ActionResult, Resource } from '../core/types';
import { addButton } from '../ui/button';
import { COLORS } from '../ui/palette';

const TILE = 44;
const LEFT = 78;
const TOP = 165;

export class MineScene extends Phaser.Scene {
  private grid!: Phaser.GameObjects.Graphics;
  private energyLabel!: Phaser.GameObjects.Text;
  private bagLabel!: Phaser.GameObjects.Text;
  private noticeLabel!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'Mine' });
  }

  create(): void {
    if (!gameState.expedition) {
      this.scene.start('Base');
      return;
    }
    this.cameras.main.setBackgroundColor(COLORS.background);
    this.add.text(320, 32, 'ЗАБЫТАЯ ШАХТА', {
      fontFamily: 'Arial, sans-serif', fontSize: '29px', color: COLORS.ink, fontStyle: 'bold',
    }).setOrigin(0.5);
    this.energyLabel = this.add.text(56, 73, '', {
      fontFamily: 'Arial, sans-serif', fontSize: '22px', color: '#edcb8b',
    });
    this.bagLabel = this.add.text(56, 105, '', {
      fontFamily: 'Arial, sans-serif', fontSize: '20px', color: COLORS.ink,
    });
    this.add.text(320, 143, 'Клик по соседней клетке или клавиши WASD / стрелки', {
      fontFamily: 'Arial, sans-serif', fontSize: '16px', color: COLORS.muted,
    }).setOrigin(0.5);

    this.grid = this.add.graphics();
    this.noticeLabel = this.add.text(320, 677, 'Вернись к лестнице в центре, чтобы сохранить всё.', {
      fontFamily: 'Arial, sans-serif', fontSize: '17px', color: COLORS.muted,
      align: 'center', wordWrap: { width: 560 },
    }).setOrigin(0.5);

    addButton(this, 168, 742, 258, 58, 'К лестнице (100%)', () => this.commitAction(attemptSafeReturn(gameState)));
    addButton(this, 470, 742, 258, 58, 'Эвакуация (50%)', () => this.commitAction(emergencyReturn(gameState)));
    this.add.text(320, 788, 'Руда 2 · Кристалл 5 · Реликвия 12 монет', {
      fontFamily: 'Arial, sans-serif', fontSize: '15px', color: COLORS.muted,
    }).setOrigin(0.5);

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const x = Math.floor((pointer.x - LEFT) / TILE);
      const y = Math.floor((pointer.y - TOP) / TILE);
      if (x < 0 || x >= SIZE || y < 0 || y >= SIZE) return;
      const player = gameState.expedition?.player;
      if (!player) return;
      this.commitAction(step(gameState, x - player.x, y - player.y));
    });

    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const movement: Record<string, [number, number]> = {
        arrowup: [0, -1], w: [0, -1],
        arrowdown: [0, 1], s: [0, 1],
        arrowleft: [-1, 0], a: [-1, 0],
        arrowright: [1, 0], d: [1, 0],
      };
      const delta = movement[key];
      if (!delta) return;
      event.preventDefault();
      this.commitAction(step(gameState, delta[0], delta[1]));
    });

    this.renderMine();
  }

  private commitAction(result: ActionResult): void {
    if (result.changed) persist();
    if (result.result) {
      this.scene.start('Base');
      return;
    }
    this.noticeLabel.setText(result.message);
    this.renderMine();
  }

  private renderMine(): void {
    const run = gameState.expedition;
    if (!run) return;
    this.grid.clear();
    const visibleRadius = visionRadius(gameState.upgrades);

    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const px = LEFT + x * TILE;
        const py = TOP + y * TILE;
        const tile = run.tiles[y][x];
        const visible = currentlyVisible(run, gameState.upgrades, x, y);
        const seen = run.seen[y][x];
        const color = !seen ? 0x101827 : !visible ? 0x182333 :
          tile.kind === 'wall' ? COLORS.wall : tile.kind === 'exit' ? 0x514638 : COLORS.floor;

        this.grid.fillStyle(color);
        this.grid.fillRoundedRect(px + 1, py + 1, TILE - 2, TILE - 2, 4);
        if (seen && visible && tile.kind === 'wall') {
          this.grid.lineStyle(1.5, COLORS.wallCrack, 0.9);
          this.grid.lineBetween(px + 9, py + 10, px + 21, py + 18);
          this.grid.lineBetween(px + 21, py + 18, px + 34, py + 13);
          this.grid.lineBetween(px + 21, py + 18, px + 17, py + 31);
        }
        if (seen && visible && tile.kind === 'exit') {
          this.grid.lineStyle(3, COLORS.gold, 0.9);
          this.grid.strokeCircle(px + TILE / 2, py + TILE / 2, 12);
        }
        if (seen && visible && tile.resource) this.drawResource(px, py, tile.resource);
        if (Math.abs(x - run.player.x) + Math.abs(y - run.player.y) === 1 && visible) {
          this.grid.lineStyle(1, COLORS.gold, 0.55);
          this.grid.strokeRoundedRect(px + 3, py + 3, TILE - 6, TILE - 6, 4);
        }
      }
    }

    const playerX = LEFT + run.player.x * TILE + TILE / 2;
    const playerY = TOP + run.player.y * TILE + TILE / 2;
    this.grid.fillStyle(COLORS.gold, 0.13);
    this.grid.fillCircle(playerX, playerY, 18 + visibleRadius * 3);
    this.grid.fillStyle(0xeacb9c);
    this.grid.fillCircle(playerX, playerY - 5, 8);
    this.grid.fillStyle(0xdd985c);
    this.grid.fillRoundedRect(playerX - 11, playerY + 4, 22, 12, 4);
    this.grid.fillStyle(0xf7e1ad);
    this.grid.fillTriangle(playerX - 11, playerY - 10, playerX + 11, playerY - 10, playerX, playerY - 19);

    this.energyLabel.setText(`Заряд фонаря: ${run.energy}   ·   Свет: ${visibleRadius}`);
    this.bagLabel.setText(`Рюкзак: ${bagCount(run.bag)}/${bagCapacity(gameState.upgrades)}   ·   Добыча: ${bagValue(run.bag)} монет`);
  }

  private drawResource(px: number, py: number, resource: Resource): void {
    const x = px + TILE / 2;
    const y = py + TILE / 2;
    if (resource === 'ore') {
      this.grid.fillStyle(0xd8b58c);
      this.grid.fillCircle(x, y, 7);
      this.grid.fillStyle(0xffdfb1);
      this.grid.fillCircle(x - 2, y - 2, 2);
    } else if (resource === 'crystal') {
      this.grid.fillStyle(COLORS.cyan);
      this.grid.fillTriangle(x, y - 13, x + 10, y + 2, x - 10, y + 2);
      this.grid.fillTriangle(x - 10, y + 2, x + 10, y + 2, x, y + 13);
    } else {
      this.grid.fillStyle(COLORS.gold);
      this.grid.fillTriangle(x, y - 13, x + 13, y, x, y + 13);
      this.grid.fillTriangle(x, y - 13, x - 13, y, x, y + 13);
      this.grid.fillStyle(0xffffff, 0.6);
      this.grid.fillCircle(x - 3, y - 3, 3);
    }
  }
}
