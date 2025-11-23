export class TitleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TitleScene' });
    }

    create() {
        this.cameras.main.setBackgroundColor('#87ceeb');

        const titleText = this.add.text(400, 200, 'SUPER STAR COLLECTOR', {
            fontSize: '50px',
            fill: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 6
        });
        titleText.setOrigin(0.5);

        // ハイスコア表示
        const highScore = localStorage.getItem('highScore') || 0;
        const scoreText = this.add.text(400, 300, 'HIGH SCORE: ' + highScore, {
            fontSize: '40px',
            fill: '#ffff00',
            stroke: '#000000',
            strokeThickness: 4
        });
        scoreText.setOrigin(0.5);

        const startText = this.add.text(400, 450, 'CLICK TO START', {
            fontSize: '32px',
            fill: '#ffffff'
        });
        startText.setOrigin(0.5);

        this.tweens.add({
            targets: startText,
            alpha: 0,
            duration: 800,
            ease: 'Power2',
            yoyo: true,
            loop: -1
        });

        // create() の一番下にある input.once の部分だけ書き換えてください
        this.input.once('pointerdown', () => {
            // GameScene ではなく LevelSelectScene へ！
            this.scene.start('LevelSelectScene');
        });
    }
}