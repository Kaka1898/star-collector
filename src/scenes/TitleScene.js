export class TitleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TitleScene' });
    }

    create() {
        // 背景を水色にする
        this.cameras.main.setBackgroundColor('#87ceeb');

        // タイトル文字
        const titleText = this.add.text(400, 200, 'SUPER STAR COLLECTOR', {
            fontSize: '50px',
            fill: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 6
        });
        titleText.setOrigin(0.5);

        // ★★★ ハイスコア表示機能 ★★★
        
        // 保存データから読み込む（データがなければ 0 にする）
        const highScore = localStorage.getItem('highScore') || 0;

        // 画面に表示する
        const scoreText = this.add.text(400, 300, 'HIGH SCORE: ' + highScore, {
            fontSize: '40px',
            fill: '#ffff00', // 目立つ黄色
            stroke: '#000000',
            strokeThickness: 4
        });
        scoreText.setOrigin(0.5);
        
        // ★★★★★★★★★★★★★★★★

        // スタートボタン（文字）
        const startText = this.add.text(400, 450, 'CLICK TO START', {
            fontSize: '32px',
            fill: '#ffffff'
        });
        startText.setOrigin(0.5);

        // 点滅アニメーション
        this.tweens.add({
            targets: startText,
            alpha: 0,
            duration: 800,
            ease: 'Power2',
            yoyo: true,
            loop: -1
        });

        // クリックでゲーム開始
        this.input.once('pointerdown', () => {
            this.scene.start('GameScene');
        });
    }
}