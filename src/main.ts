import Phaser from 'phaser';
import { BaseScene } from './scenes/BaseScene';
import { MineScene } from './scenes/MineScene';
import './style.css';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'app',
  backgroundColor: '#0d1422',
  render: { pixelArt: true },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 640,
    height: 800,
  },
  scene: [BaseScene, MineScene],
};

new Phaser.Game(config);
