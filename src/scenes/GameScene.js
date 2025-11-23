export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    init(data) {
        this.level = data.level || 1;
    }

    preload() {
        this.load.image('sky', 'assets/sky.png');
        this.load.image('ground', 'assets/platform.png');
        this.load.image('star', 'assets/star.png');
        this.load.image('bomb', 'assets/bomb.png');
        this.load.spritesheet('player', 'assets/dude.png', { frameWidth: 32, frameHeight: 48 });
        
        this.load.audio('jump', 'assets/jump.wav');
        this.load.audio('pickup', 'assets/pickup.wav');
        this.load.audio('death', 'assets/death.wav');
    }

    create() {
        const worldWidth = 1600;
        const worldHeight = 600;
        this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
        this.physics.world.setBoundsCollision(true, true, true, false);

        this.add.tileSprite(0, 0, worldWidth, worldHeight, 'sky')
            .setOrigin(0, 0)
            .setScrollFactor(0);

        this.createMountainRange(worldWidth, worldHeight, 0x004444, 200, 0.2);
        this.createMountainRange(worldWidth, worldHeight, 0x008844, 100, 0.5);

        this.jumpSound = this.sound.add('jump');
        this.pickupSound = this.sound.add('pickup');
        this.deathSound = this.sound.add('death');

        this.emitter = this.add.particles(0, 0, 'star', {
            speed: 100, scale: { start: 0.5, end: 0 }, blendMode: 'ADD', lifespan: 500, emitting: false
        });

        if (!this.textures.exists('heart')) {
            const heartGraphics = this.make.graphics({ x: 0, y: 0, add: false });
            heartGraphics.fillStyle(0xff0000, 1);
            heartGraphics.fillCircle(10, 10, 10);
            heartGraphics.generateTexture('heart', 20, 20);
        }
        if (!this.textures.exists('goal')) {
            const goalGraphics = this.make.graphics({ x: 0, y: 0, add: false });
            goalGraphics.fillStyle(0xffff00, 1);
            goalGraphics.fillRect(0, 0, 40, 60);
            goalGraphics.generateTexture('goal', 40, 60);
        }
        if (!this.textures.exists('bullet')) {
            const bulletGraphics = this.make.graphics({ x: 0, y: 0, add: false });
            bulletGraphics.fillStyle(0xffff00, 1); 
            bulletGraphics.fillCircle(5, 5, 5);    
            bulletGraphics.generateTexture('bullet', 10, 10);
        }

        const levelData = {
            1: {
                platforms: [
                    [200, 584, 1, 1], [800, 584, 1, 1], [1400, 584, 1, 1],
                    [500, 420, 0.5, 1], [900, 350, 0.5, 1], [1200, 250, 0.5, 1]
                ],
                movingPlatform: { x: -100, y: -100, speed: 0, minX: 0, maxX: 0 },
                goalPos: { x: 1550, y: 520 },
                playerStart: { x: 100, y: 450 },
                enemies: [[600, 500, 100]],
                starPositions: [
                    [300, 450], [500, 350], [700, 450], [900, 280], 
                    [1100, 450], [1200, 180], [1400, 450], [1500, 300]
                ]
            },
            2: {
                platforms: [
                    [200, 584, 1, 1], [1400, 400, 1, 1],
                    [600, 450, 0.3, 1], [1000, 300, 0.3, 1]
                ],
                movingPlatform: { x: 800, y: 500, speed: 150, minX: 500, maxX: 1100 },
                goalPos: { x: 1500, y: 330 },
                playerStart: { x: 100, y: 450 },
                enemies: [[1300, 350, 100]], 
                starPositions: [
                    [250, 450], [400, 350], [600, 380], [800, 430],
                    [1000, 230], [1200, 300], [1350, 250], [1500, 200]
                ]
            },
            3: {
                platforms: [
                    [200, 584, 1, 1], [1400, 584, 2, 1], 
                    [500, 450, 0.4, 1], [200, 300, 0.4, 1], [500, 150, 0.4, 1], [900, 300, 0.4, 1]
                ],
                movingPlatform: { x: 1100, y: 450, speed: 250, minX: 800, maxX: 1400 },
                goalPos: { x: 1500, y: 520 }, 
                playerStart: { x: 100, y: 500 },
                enemies: [[200, 250, 100]], 
                starPositions: [
                    [300, 500], [500, 380], [200, 230], [500, 80], 
                    [900, 230], [1100, 380], [1300, 150], [1500, 80]
                ],
                boss: { x: 1200, y: 400, hp: 10 } 
            }
        };

        const currentData = levelData[this.level];
        this.playerStartPos = currentData.playerStart;

        this.platforms = this.physics.add.staticGroup();
        currentData.platforms.forEach(pos => {
            this.platforms.create(pos[0], pos[1], 'ground').setScale(pos[2], pos[3]).refreshBody();
        });

        this.movingPlatform = this.physics.add.image(currentData.movingPlatform.x, currentData.movingPlatform.y, 'ground');
        this.movingPlatform.setImmovable(true);
        this.movingPlatform.body.allowGravity = false;
        this.movingPlatform.setVelocityX(currentData.movingPlatform.speed);
        
        this.movingPlatformSpeed = currentData.movingPlatform.speed;
        this.movingPlatformMinX = currentData.movingPlatform.minX;
        this.movingPlatformMaxX = currentData.movingPlatform.maxX;

        this.goal = this.physics.add.staticImage(currentData.goalPos.x, currentData.goalPos.y, 'goal');
        if (currentData.boss) {
            this.goal.setVisible(false); // ボス戦ではゴールは見えない（使わない）
            this.goal.body.enable = false;
        }

        this.player = this.physics.add.sprite(currentData.playerStart.x, currentData.playerStart.y, 'player');
        this.player.setBounce(0.1);
        this.player.setCollideWorldBounds(true);
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.player, this.movingPlatform);
        
        this.physics.add.overlap(this.player, this.goal, this.reachGoal, null, this);

        this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

        this.jumpCount = 0; 
        this.hp = 3; 
        this.isInvincible = false;
        this.nextGhostTime = 0; 
        this.lastDirection = 'right';
        this.lastFiredTime = 0;
        
        this.dashKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
        this.shootKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        this.maxStamina = 100;
        this.stamina = 100;
        this.barMaxWidth = 150;
        this.staminaRecoverTime = 0; 

        this.add.text(30, 95, 'STAMINA', { fontSize: '14px', fill: '#fff', fontStyle: 'bold' }).setScrollFactor(0);
        this.add.rectangle(30, 115, this.barMaxWidth, 10, 0x333333).setOrigin(0, 0.5).setScrollFactor(0);
        this.staminaBar = this.add.rectangle(30, 115, this.barMaxWidth, 10, 0x00ffff).setOrigin(0, 0.5).setScrollFactor(0);

        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });

        this.hearts = [];
        for (let i = 0; i < 3; i++) {
            const heart = this.add.image(30 + i * 30, 60, 'heart').setScrollFactor(0);
            this.hearts.push(heart);
        }

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

        this.bullets = this.physics.add.group();
        this.physics.add.collider(this.bullets, this.platforms, (bullet) => { bullet.destroy(); });
        this.physics.add.collider(this.bullets, this.movingPlatform, (bullet) => { bullet.destroy(); });

        this.stars = this.physics.add.group();
        if (currentData.starPositions) {
            currentData.starPositions.forEach(pos => {
                const star = this.stars.create(pos[0], pos[1], 'star');
                star.setScale(0.25);
                star.body.setAllowGravity(false);
                star.setImmovable(true);
                star.setData('startPos', { x: pos[0], y: pos[1] });
            });
        }
        this.physics.add.collider(this.stars, this.platforms);
        this.physics.add.collider(this.stars, this.movingPlatform);
        this.physics.add.overlap(this.player, this.stars, this.collectStar, null, this);

        this.score = 0;
        this.scoreText = this.add.text(16, 16, 'Level: ' + this.level + '  Score: ' + this.score, { fontSize: '32px', fill: '#fff' }).setScrollFactor(0);

        this.bombs = this.physics.add.group();
        this.physics.add.collider(this.bombs, this.platforms);
        this.physics.add.collider(this.bombs, this.movingPlatform);
        this.physics.add.collider(this.player, this.bombs, this.hitBomb, null, this);

        const bx = (this.player.x < worldWidth / 2) ? Phaser.Math.Between(worldWidth / 2, worldWidth) : Phaser.Math.Between(0, worldWidth / 2);
        this.spawnBomb(bx, 16);

        this.enemies = this.physics.add.group();
        this.physics.add.collider(this.enemies, this.platforms);
        this.physics.add.collider(this.enemies, this.movingPlatform);
        this.physics.add.collider(this.player, this.enemies, this.hitEnemy, null, this);
        this.physics.add.overlap(this.bullets, this.enemies, this.hitEnemyWithBullet, null, this);

        currentData.enemies.forEach(e => {
            this.createEnemy(e[0], e[1], e[2]);
        });

        this.boss = null;
        if (currentData.boss) {
            this.createBoss(currentData.boss.x, currentData.boss.y, currentData.boss.hp);
        }

        this.gameOverText = this.add.text(400, 300, 'GAME OVER', { 
            fontSize: '64px', fill: '#ff0000', fontStyle: 'bold', stroke: '#ffffff', strokeThickness: 6
        }).setOrigin(0.5).setVisible(false).setScrollFactor(0);
        this.gameOver = false;

        this.gameClearText = this.add.text(400, 300, 'STAGE CLEAR!!', { 
            fontSize: '64px', fill: '#ffff00', fontStyle: 'bold', stroke: '#000000', strokeThickness: 6
        }).setOrigin(0.5).setVisible(false).setScrollFactor(0);
        
        this.allClearText = this.add.text(400, 300, 'CONGRATULATIONS!!\nALL LEVELS CLEARED!', { 
            fontSize: '48px', fill: '#00ff00', fontStyle: 'bold', stroke: '#000000', strokeThickness: 6, align: 'center'
        }).setOrigin(0.5).setVisible(false).setScrollFactor(0);

        this.createMobileControls();
    }

    createMountainRange(width, height, color, mountainHeight, scrollFactor) {
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });
        graphics.fillStyle(color, 1);
        graphics.beginPath();
        graphics.moveTo(0, height);
        for (let i = 0; i <= width; i += 100) {
            graphics.lineTo(i, height - mountainHeight - Math.random() * 100);
        }
        graphics.lineTo(width, height);
        graphics.closePath();
        graphics.fillPath();
        const key = 'mountains_' + scrollFactor; 
        graphics.generateTexture(key, width, height);
        this.add.image(0, 0, key).setOrigin(0, 0).setScrollFactor(scrollFactor, 0);
    }

    update() {
        if (this.gameOver) return;

        if (this.movingPlatformSpeed !== 0) {
            const speed = Math.abs(this.movingPlatformSpeed);
            if (this.movingPlatform.x >= this.movingPlatformMaxX) {
                this.movingPlatform.setVelocityX(-speed);
            } else if (this.movingPlatform.x <= this.movingPlatformMinX) {
                this.movingPlatform.setVelocityX(speed);
            }
        }

        this.enemies.children.iterate((enemy) => {
            if (enemy.body.velocity.x > 0) {
                enemy.anims.play('right', true);
            } else if (enemy.body.velocity.x < 0) {
                enemy.anims.play('left', true);
            }
        });

        // ボスAI
        if (this.boss && this.boss.active) {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.boss.x, this.boss.y);
            
            // 落下防止
            if (this.boss.y > 650) {
                this.boss.body.reset(1200, 400);
            }

            if (dist < 800) {
                if (this.player.x < this.boss.x) {
                    this.boss.setVelocityX(-75); // 半分の速度
                    this.boss.anims.play('left', true);
                } else {
                    this.boss.setVelocityX(75); // 半分の速度
                    this.boss.anims.play('right', true);
                }
                // ジャンプ削除
            } else {
                this.boss.setVelocityX(0);
                this.boss.anims.play('turn');
            }
        }

        let speed = 200; 
        const isDashInput = this.dashKey.isDown || this.isDashPressed;
        const isExhausted = this.time.now < this.staminaRecoverTime;

        if (isDashInput && this.stamina > 0 && !isExhausted) {
            speed = 350; 
            this.stamina -= 1; 
            if (this.stamina <= 0) {
                this.stamina = 0;
                this.staminaRecoverTime = this.time.now + 1000;
            }
            if (this.player.body.velocity.x !== 0 || this.player.body.velocity.y !== 0) {
                this.createGhost();
            }
        } else {
            if (!isExhausted && this.stamina < this.maxStamina) {
                this.stamina += 0.5;
            }
        }

        this.staminaBar.width = this.barMaxWidth * (this.stamina / this.maxStamina);
        if (isExhausted) this.staminaBar.fillColor = 0xff0000;
        else this.staminaBar.fillColor = 0x00ffff;

        if (this.wasd.left.isDown || this.isLeftPressed) {
            this.player.setVelocityX(-speed);
            this.player.anims.play('left', true);
            this.lastDirection = 'left';
        } else if (this.wasd.right.isDown || this.isRightPressed) {
            this.player.setVelocityX(speed);
            this.player.anims.play('right', true);
            this.lastDirection = 'right';
        } else {
            this.player.setVelocityX(0);
            this.player.anims.play('turn');
        }

        if (this.player.body.touching.down) {
            this.jumpCount = 2;
        }
        if (Phaser.Input.Keyboard.JustDown(this.wasd.up)) {
            this.tryJump();
        }

        if (Phaser.Input.Keyboard.JustDown(this.shootKey) || this.isShootPressed) {
            this.fireBullet();
            this.isShootPressed = false;
        }

        if ((this.wasd.down.isDown || this.isDownPressed) && !this.player.body.touching.down) {
            if (this.player.body.velocity.y > 0) {
                this.player.body.setGravityY(3000); 
                this.player.setTint(0x00ffff); 
                if (Phaser.Math.Between(0, 4) === 0) {
                    this.emitter.emitParticleAt(this.player.x, this.player.y, 1);
                }
            }
        } else {
            this.player.body.setGravityY(0);
            if (!this.isInvincible) {
                this.player.clearTint();
            }
        }
        
        if (this.player.y > 650) {
            this.hitBomb(this.player, null);
        }
    }

    createBoss(x, y, hp) {
        this.boss = this.physics.add.sprite(x, y, 'player');
        this.boss.setScale(2.0); 
        this.boss.setTint(0x000000); 
        this.boss.setBounce(0.2);
        this.boss.setCollideWorldBounds(true);
        this.boss.hp = hp;

        this.physics.add.collider(this.boss, this.platforms);
        this.physics.add.collider(this.boss, this.movingPlatform);
        this.physics.add.collider(this.player, this.boss, this.hitBoss, null, this); 
        this.physics.add.overlap(this.bullets, this.boss, this.hitBossWithBullet, null, this); 
    }

    hitBossWithBullet(bullet, boss) {
        bullet.destroy();
        boss.setTint(0xff0000); 
        this.time.delayedCall(100, () => {
            if (boss.active) boss.setTint(0x000000); 
        });
        boss.hp--;
        this.emitter.emitParticleAt(boss.x, boss.y, 20); 
        if (this.pickupSound) this.pickupSound.play();

        if (boss.hp <= 0) {
            // ★★★ 修正：ボス撃破時は bossClearSequence を呼ぶ ★★★
            this.bossClearSequence(boss);
        }
    }

    hitBoss(player, boss) {
        if ((player.body.y + player.body.height) < (boss.body.y + boss.body.height * 0.5)) {
            player.setVelocityY(-400); 
            boss.setTint(0xff0000);
            this.time.delayedCall(100, () => {
                if (boss.active) boss.setTint(0x000000);
            });
            boss.hp--;
            if (this.pickupSound) this.pickupSound.play();

            if (boss.hp <= 0) {
                // ★★★ 修正：ボス撃破時は bossClearSequence を呼ぶ ★★★
                this.bossClearSequence(boss);
            }
        } else {
            this.hitBomb(player, boss); 
        }
    }

    // ★★★ 新機能：ボス撃破後の自動クリア演出 ★★★
    bossClearSequence(boss) {
        // ボスを消す
        const bossX = boss.x;
        const bossY = boss.y;
        boss.destroy();

        // 1. 派手に爆発させる（複数回）
        for(let i=0; i<10; i++) {
            this.time.delayedCall(i * 150, () => {
                this.emitter.emitParticleAt(bossX + Phaser.Math.Between(-50, 50), bossY + Phaser.Math.Between(-50, 50), 20);
                if (this.deathSound) this.deathSound.play();
            });
        }

        // 2. 少し待ってからクリア画面へ
        this.time.addEvent({
            delay: 2000,
            callback: () => {
                // reachGoalを直接呼んでクリア扱いに
                this.reachGoal(this.player, null);
            }
        });
    }
    // ★★★★★★★★★★★★★★★★★★★★★★★★★

    fireBullet() {
        if (this.time.now < this.lastFiredTime + 200) return;
        this.lastFiredTime = this.time.now;
        const bullet = this.bullets.create(this.player.x, this.player.y, 'bullet');
        bullet.body.allowGravity = false;
        if (this.lastDirection === 'left') {
            bullet.setVelocityX(-600);
        } else {
            bullet.setVelocityX(600);
        }
        if (this.jumpSound) this.jumpSound.play({ rate: 2.0, volume: 0.5 });
        this.time.delayedCall(1000, () => {
            if (bullet.active) bullet.destroy();
        });
    }

    hitEnemyWithBullet(bullet, enemy) {
        bullet.destroy();
        enemy.disableBody(true, true);
        this.emitter.emitParticleAt(enemy.x, enemy.y, 10);
        if (this.pickupSound) this.pickupSound.play();
        this.score += 50;
        this.scoreText.setText('Level: ' + this.level + '  Score: ' + this.score);
    }

    createGhost() {
        if (this.time.now > this.nextGhostTime) {
            const ghost = this.add.image(this.player.x, this.player.y, 'player');
            ghost.setFrame(this.player.frame.name);
            ghost.setAlpha(0.5); 
            ghost.setTint(0x00ffff); 
            this.tweens.add({
                targets: ghost, alpha: 0, duration: 300, onComplete: () => { ghost.destroy(); }
            });
            this.nextGhostTime = this.time.now + 50; 
        }
    }

    createEnemy(x, y, velocityX) {
        const enemy = this.enemies.create(x, y, 'player');
        enemy.setTint(0x00ff00); 
        enemy.setBounce(1, 0); 
        enemy.setCollideWorldBounds(true);
        enemy.setVelocityX(velocityX);
        enemy.setPushable(false);
    }

    tryJump() {
        if (this.jumpCount > 0) {
            this.player.setVelocityY(-500);
            if(this.jumpSound) this.jumpSound.play();
            this.jumpCount--;
        }
    }

    spawnBomb(x, y = 16) {
        const bomb = this.bombs.create(x, y, 'bomb');
        bomb.setScale(0.2); 
        bomb.setCircle(bomb.width / 2);
        bomb.setBounce(1);
        bomb.setCollideWorldBounds(true);
        bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
        bomb.allowGravity = false;
    }

    collectStar(player, star) {
        this.emitter.emitParticleAt(star.x, star.y, 10);
        star.disableBody(true, true);
        if(this.pickupSound) this.pickupSound.play();
        this.score += 10;
        this.scoreText.setText('Level: ' + this.level + '  Score: ' + this.score);

        if (this.stars.countActive(true) === 0) {
            this.stars.children.iterate((child) => {
                const startPos = child.getData('startPos');
                if (startPos) {
                    child.enableBody(true, startPos.x, startPos.y, true, true);
                    child.body.setAllowGravity(false);
                    child.setVelocity(0, 0);
                }
            });
            const x = (player.x < this.physics.world.bounds.width / 2) ? Phaser.Math.Between(this.physics.world.bounds.width / 2, this.physics.world.bounds.width) : Phaser.Math.Between(0, this.physics.world.bounds.width / 2);
            this.spawnBomb(x);
        }
    }

    reachGoal(player, goal) {
        this.physics.pause();
        
        const winEmitter = this.add.particles(player.x, player.y, 'star', {
            speed: { min: 100, max: 300 }, scale: { start: 1, end: 0 }, lifespan: 1000, quantity: 50, emitting: false
        });
        winEmitter.explode();

        if (this.level < 3) {
            this.gameClearText.setVisible(true);
            this.time.addEvent({
                delay: 2000,
                callback: () => {
                    this.scene.restart({ level: this.level + 1 });
                }
            });
        } else {
            this.allClearText.setVisible(true);
            this.time.addEvent({
                delay: 3000,
                callback: () => {
                    this.input.once('pointerdown', () => {
                        this.scene.start('TitleScene');
                    });
                }
            });
        }
    }

    hitEnemy(player, enemy) {
        if ((player.body.y + player.body.height) < (enemy.body.y + enemy.body.height * 0.8)) {
            enemy.disableBody(true, true); 
            player.setVelocityY(-300);
            if (this.pickupSound) this.pickupSound.play();
            this.emitter.emitParticleAt(enemy.x, enemy.y, 10);
            this.score += 50;
            this.scoreText.setText('Level: ' + this.level + '  Score: ' + this.score);
        } else {
            this.hitBomb(player, enemy);
        }
    }

    hitBomb(player, hazard) {
        if (this.isInvincible) return;

        this.hp--; 
        if (this.hearts[this.hp]) {
            this.hearts[this.hp].setVisible(false);
        }
        this.cameras.main.shake(200, 0.02);

        if (hazard === null) {
            if (this.hp > 0) {
                player.x = this.playerStartPos.x;
                player.y = this.playerStartPos.y;
                player.setVelocity(0, 0);
                this.triggerInvincible(player);
                return; 
            }
        }

        if (this.hp > 0) {
            this.triggerInvincible(player);
            
            if (hazard) {
                if (player.x < hazard.x) player.setVelocityX(-200);
                else player.setVelocityX(200);
            } else {
                player.setVelocityX(0);
            }
            player.setVelocityY(-200);

        } else {
            this.physics.pause();
            player.setTint(0xff0000);
            player.anims.play('turn');
            if(this.deathSound) this.deathSound.play();
            
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

    triggerInvincible(player) {
        this.isInvincible = true;
        player.setAlpha(0.5);
        player.setTint(0xff0000);
        this.tweens.add({
            targets: player,
            alpha: 1, duration: 200, yoyo: true, repeat: 5,
            onComplete: () => {
                this.isInvincible = false;
                player.clearTint();
                player.setAlpha(1);
            }
        });
    }

    createMobileControls() {
        this.isLeftPressed = false;
        this.isRightPressed = false;
        this.isDownPressed = false;
        this.isDashPressed = false;
        this.isShootPressed = false;
        const btnY = 540; 
        
        const leftBtn = this.add.rectangle(60, btnY, 80, 80, 0xffffff, 0.3).setInteractive().setScrollFactor(0);
        this.add.text(60, btnY, '←', { fontSize: '40px', fill: '#fff' }).setOrigin(0.5).setScrollFactor(0);
        leftBtn.on('pointerdown', () => { this.isLeftPressed = true; });
        leftBtn.on('pointerup', () => { this.isLeftPressed = false; });
        leftBtn.on('pointerout', () => { this.isLeftPressed = false; });
        
        const downBtn = this.add.rectangle(160, btnY, 80, 80, 0xffffff, 0.3).setInteractive().setScrollFactor(0);
        this.add.text(160, btnY, '↓', { fontSize: '40px', fill: '#fff' }).setOrigin(0.5).setScrollFactor(0);
        downBtn.on('pointerdown', () => { this.isDownPressed = true; });
        downBtn.on('pointerup', () => { this.isDownPressed = false; });
        downBtn.on('pointerout', () => { this.isDownPressed = false; });

        const rightBtn = this.add.rectangle(260, btnY, 80, 80, 0xffffff, 0.3).setInteractive().setScrollFactor(0);
        this.add.text(260, btnY, '→', { fontSize: '40px', fill: '#fff' }).setOrigin(0.5).setScrollFactor(0);
        rightBtn.on('pointerdown', () => { this.isRightPressed = true; });
        rightBtn.on('pointerup', () => { this.isRightPressed = false; });
        rightBtn.on('pointerout', () => { this.isRightPressed = false; });
        
        const dashBtn = this.add.rectangle(480, btnY, 100, 80, 0x00ffff, 0.3).setInteractive().setScrollFactor(0);
        this.add.text(480, btnY, 'DASH', { fontSize: '24px', fill: '#fff' }).setOrigin(0.5).setScrollFactor(0);
        dashBtn.on('pointerdown', () => { this.isDashPressed = true; });
        dashBtn.on('pointerup', () => { this.isDashPressed = false; });
        dashBtn.on('pointerout', () => { this.isDashPressed = false; });

        const shootBtn = this.add.rectangle(600, btnY, 100, 80, 0xffff00, 0.3).setInteractive().setScrollFactor(0);
        this.add.text(600, btnY, 'SHOOT', { fontSize: '24px', fill: '#fff' }).setOrigin(0.5).setScrollFactor(0);
        shootBtn.on('pointerdown', () => { this.isShootPressed = true; });
        shootBtn.on('pointerup', () => { this.isShootPressed = false; });
        shootBtn.on('pointerout', () => { this.isShootPressed = false; });

        const jumpBtn = this.add.rectangle(720, btnY, 120, 80, 0xff0000, 0.3).setInteractive().setScrollFactor(0);
        this.add.text(720, btnY, 'JUMP', { fontSize: '30px', fill: '#fff' }).setOrigin(0.5).setScrollFactor(0);
        jumpBtn.on('pointerdown', () => { this.tryJump(); });
    }
}