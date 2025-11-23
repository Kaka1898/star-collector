// ★重要★ 先頭に必ず 'export' をつけてください！
export class LevelSelectScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LevelSelectScene' });
    }

    create() {
        this.cameras.main.setBackgroundColor('#000033');

        this.add.text(400, 100, 'SELECT LEVEL', {
            fontSize: '48px', fill: '#fff', fontStyle: 'bold'
        }).setOrigin(0.5);

        const levelReached = parseInt(localStorage.getItem('levelReached')) || 1;

        for (let i = 1; i <= 3; i++) {
            this.createLevelButton(i, levelReached);
        }

        const backText = this.add.text(400, 500, 'BACK TO TITLE', { fontSize: '24px', fill: '#aaa' }).setOrigin(0.5).setInteractive();
        backText.on('pointerdown', () => {
            this.scene.start('TitleScene');
        });
    }

    createLevelButton(level, levelReached) {
        const x = 200 * level;
        const y = 300;
        const isLocked = level > levelReached;
        const color = isLocked ? 0x555555 : 0x00cc00;

        const btn = this.add.rectangle(x, y, 120, 120, color).setInteractive();
        const textStr = isLocked ? 'LOCK' : 'Level ' + level;
        this.add.text(x, y, textStr, { fontSize: '24px', fill: '#fff' }).setOrigin(0.5);

        if (!isLocked) {
            btn.on('pointerdown', () => {
                this.scene.start('GameScene', { level: level });
            });
            btn.on('pointerover', () => btn.setFillStyle(0x00ff00));
            btn.on('pointerout', () => btn.setFillStyle(0x00cc00));
        }
    }
}