export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        this.load.image('ground', 'assets/platform.png');
        this.load.image('star', 'assets/star.png');
        this.load.spritesheet('player', 'assets/dude.png', { frameWidth: 32, frameHeight: 48 });
        
        this.load.audio('jump', 'assets/jump.wav');
        this.load.audio('pickup', 'assets/pickup.wav');
        this.load.audio('death', 'assets/death.wav');
    }

    create() {
        this.cameras.main.setBackgroundColor('#000000');

        this.jumpSound = this.sound.add('jump');
        this.pickupSound = this.sound.add('pickup');
        this.deathSound = this.sound.add('death');

        // パーティクル準備
        this.emitter = this.add.particles(0, 0, 'star', {
            speed: 100, scale: { start: 0.5, end: 0 }, blendMode: 'ADD', lifespan: 500, emitting: false
        });

        // 爆弾テクスチャ生成
        if (!this.textures.exists('bomb')) {
            const bombGraphics = this.make.graphics({ x: 0, y: 0, add: false });
            bombGraphics.fillStyle(0x000000, 1);
            bombGraphics.fillCircle(7, 7, 7);
            bombGraphics.generateTexture('bomb', 14, 14);
        }

        const platforms = this.physics.add.staticGroup();
        platforms.create(400, 568, 'ground').setScale(2).refreshBody();
        platforms.create(600, 400, 'ground');
        platforms.create(50, 250, 'ground');
        platforms.create(750, 220, 'ground');

        this.player = this.physics.add.sprite(100, 450, 'player');
        this.player.setBounce(0.2);
        this.player.setCollideWorldBounds(true);
        this.physics.add.collider(this.player, platforms);

        if (!this.anims.exists('left')) {
            this.anims.create({
                key: 'left',
                frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
                frameRate: 10, repeat: -1
            });
            this.anims.create({
                key: 'turn',
                frames: [ { key: 'player', frame: 4 } ],
                frameRate: 20
            });
            this.anims.create({
                key: 'right',
                frames: this.anims.generateFrameNumbers('player', { start: 5, end: 8 }),
                frameRate: 10, repeat: -1
            });
        }
        this.cursors = this.input.keyboard.createCursorKeys();

        this.stars = this.physics.add.group({
            key: 'star',
            repeat: 11,
            setXY: { x: 12, y: 0, stepX: 70 },
            setScale: { x: 0.7, y: 0.7 }
        });
        this.stars.children.iterate((child) => {
            child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
        });
        this.physics.add.collider(this.stars, platforms);
        this.physics.add.overlap(this.player, this.stars, this.collectStar, null, this);

        this.score = 0;
        this.scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#fff' });

        this.bombs = this.physics.add.group();
        this.physics.add.collider(this.bombs, platforms);
        this.physics.add.collider(this.player, this.bombs, this.hitBomb, null, this);

        this.gameOverText = this.add.text(400, 300, 'GAME OVER', { 
            fontSize: '64px', fill: '#ff0000', fontStyle: 'bold', stroke: '#ffffff', strokeThickness: 6
        });
        this.gameOverText.setOrigin(0.5);
        this.gameOverText.setVisible(false);
        this.gameOver = false;

        // ★★★ スマホ用ボタンを作る関数を呼び出す ★★★
        this.createMobileControls();
    }

    // ★★★ スマホボタン作成関数 ★★★
    createMobileControls() {
        // ボタンの状態を管理する変数
        this.isLeftPressed = false;
        this.isRightPressed = false;
        this.isJumpPressed = false;

        // 左ボタン (半透明の四角)
        const leftBtn = this.add.rectangle(80, 550, 100, 80, 0xffffff, 0.3)
            .setInteractive() // タッチできるようにする
            .setScrollFactor(0); // カメラが動いてもついてくる
        
        this.add.text(80, 550, '←', { fontSize: '40px', fill: '#fff' }).setOrigin(0.5).setScrollFactor(0);

        // 左ボタンのイベント
        leftBtn.on('pointerdown', () => { this.isLeftPressed = true; });
        leftBtn.on('pointerup', () => { this.isLeftPressed = false; });
        leftBtn.on('pointerout', () => { this.isLeftPressed = false; }); // 指がボタンから外れたらOFF

        // 右ボタン
        const rightBtn = this.add.rectangle(250, 550, 100, 80, 0xffffff, 0.3)
            .setInteractive()
            .setScrollFactor(0);
            
        this.add.text(250, 550, '→', { fontSize: '40px', fill: '#fff' }).setOrigin(0.5).setScrollFactor(0);

        rightBtn.on('pointerdown', () => { this.isRightPressed = true; });
        rightBtn.on('pointerup', () => { this.isRightPressed = false; });
        rightBtn.on('pointerout', () => { this.isRightPressed = false; });

        // ジャンプボタン
        const jumpBtn = this.add.rectangle(700, 550, 120, 80, 0xff0000, 0.3)
            .setInteractive()
            .setScrollFactor(0);
            
        this.add.text(700, 550, 'JUMP', { fontSize: '30px', fill: '#fff' }).setOrigin(0.5).setScrollFactor(0);

        jumpBtn.on('pointerdown', () => { this.isJumpPressed = true; });
        jumpBtn.on('pointerup', () => { this.isJumpPressed = false; });
        jumpBtn.on('pointerout', () => { this.isJumpPressed = false; });
    }

    update() {
        if (this.gameOver) return;

        // ★★★ 移動ロジックの変更 ★★★
        // 「キーボードの左」 または 「スマホの左ボタン」 が押されていたら動く
        if (this.cursors.left.isDown || this.isLeftPressed) {
            this.player.setVelocityX(-160);
            this.player.anims.play('left', true);
        } 
        else if (this.cursors.right.isDown || this.isRightPressed) {
            this.player.setVelocityX(160);
            this.player.anims.play('right', true);
        } 
        else {
            this.player.setVelocityX(0);
            this.player.anims.play('turn');
        }

        // ジャンプ
        if ((this.cursors.up.isDown || this.isJumpPressed) && this.player.body.touching.down) {
            this.player.setVelocityY(-330);
            this.jumpSound.play();
        }
    }

    collectStar(player, star) {
        this.emitter.emitParticleAt(star.x, star.y, 10);
        star.disableBody(true, true);
        this.pickupSound.play();

        this.score += 10;
        this.scoreText.setText('Score: ' + this.score);

        if (this.stars.countActive(true) === 0) {
            this.stars.children.iterate((child) => {
                child.enableBody(true, child.x, 0, true, true);
            });
            const x = (player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);
            const bomb = this.bombs.create(x, 16, 'bomb');
            bomb.setBounce(1);
            bomb.setCollideWorldBounds(true);
            bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
            bomb.allowGravity = false;
        }
    }

    hitBomb(player, bomb) {
        this.physics.pause();
        this.cameras.main.shake(500, 0.05);
        player.setTint(0xff0000);
        player.anims.play('turn');
        this.deathSound.play();

        this.gameOver = true;
        this.gameOverText.setVisible(true);

        const currentHighScore = localStorage.getItem('highScore') || 0;
        if (this.score > currentHighScore) {
            localStorage.setItem('highScore', this.score);
        }

        this.time.addEvent({
            delay: 1000,
            callback: () => {
                this.input.once('pointerdown', () => {
                    this.scene.start('TitleScene');
                });
            }
        });
    }
}