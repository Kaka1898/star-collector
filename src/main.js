import { TitleScene } from './scenes/TitleScene.js'; // ★追加
import { GameScene } from './scenes/GameScene.js';

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    // ★ここを変更！ TitleScene を先頭に追加
    scene: [TitleScene, GameScene]
};

new Phaser.Game(config);