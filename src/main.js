import { TitleScene } from './scenes/TitleScene.js';
// ★★★ これがないと真っ黒になります！ ★★★
import { LevelSelectScene } from './scenes/LevelSelectScene.js'; 
import { GameScene } from './scenes/GameScene.js';

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 800 },
            debug: false
        }
    },
    // ★★★ 順番も大事！ Title -> Select -> Game の順 ★★★
    scene: [TitleScene, LevelSelectScene, GameScene]
};

new Phaser.Game(config);