import Phaser from 'phaser';
import { COLORS } from './palette';

export function addButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  label: string,
  onClick: () => void,
  enabled = true,
): void {
  const rect = scene.add.rectangle(x, y, width, height, enabled ? COLORS.panelAlt : COLORS.panel)
    .setStrokeStyle(2, enabled ? COLORS.gold : 0x3d4a5c)
    .setInteractive({ useHandCursor: enabled });
  scene.add.text(x, y, label, {
    fontFamily: 'Arial, sans-serif',
    fontSize: '20px',
    color: enabled ? COLORS.ink : '#64718a',
    align: 'center',
  }).setOrigin(0.5);
  if (enabled) {
    rect.on('pointerover', () => rect.setFillStyle(0x33465c));
    rect.on('pointerout', () => rect.setFillStyle(COLORS.panelAlt));
    rect.on('pointerdown', () => onClick());
  }
}
