// Game variables
let player;
let stars;
let platforms;
let enemies;
let score = 0;
let level = 1;
let lives = 3;
let scoreText;
let levelText;
let livesText;
let cursors;
let gameOver = false;
let gameStarted = false;

// Mobile controls - fixed implementation
let mobileControls = {
  left: false,
  right: false,
  jump: false,
};

// Initialize mobile controls with proper event handling
function initializeMobileControls() {
  const leftBtn = document.getElementById("leftBtn");
  const rightBtn = document.getElementById("rightBtn");
  const jumpBtn = document.getElementById("jumpBtn");

  // Prevent default touch behaviors
  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  // Add touch controls for each button
  function addTouchControls(btn, control) {
    if (!btn) return;

    // Touch events
    btn.addEventListener(
      "touchstart",
      (e) => {
        preventDefaults(e);
        mobileControls[control] = true;
        btn.style.transform = "scale(0.95)";
      },
      { passive: false }
    );

    btn.addEventListener(
      "touchend",
      (e) => {
        preventDefaults(e);
        mobileControls[control] = false;
        btn.style.transform = "scale(1)";
      },
      { passive: false }
    );

    btn.addEventListener(
      "touchcancel",
      (e) => {
        preventDefaults(e);
        mobileControls[control] = false;
        btn.style.transform = "scale(1)";
      },
      { passive: false }
    );

    // Mouse events for desktop testing
    btn.addEventListener("mousedown", (e) => {
      preventDefaults(e);
      mobileControls[control] = true;
      btn.style.transform = "scale(0.95)";
    });

    btn.addEventListener("mouseup", (e) => {
      preventDefaults(e);
      mobileControls[control] = false;
      btn.style.transform = "scale(1)";
    });

    btn.addEventListener("mouseleave", (e) => {
      mobileControls[control] = false;
      btn.style.transform = "scale(1)";
    });
  }

  addTouchControls(leftBtn, "left");
  addTouchControls(rightBtn, "right");
  addTouchControls(jumpBtn, "jump");
}

class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameScene" });
    this.assetsLoaded = false;
  }

  preload() {
    // Create loading text
    const loadingText = this.add
      .text(400, 300, "Loading Game...", {
        fontSize: "24px",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // Try loading external assets with fallback
    this.load.on("complete", () => {
      loadingText.setText("");
      this.assetsLoaded = true;
    });

    this.load.on("loaderror", (file) => {
      console.warn(`Failed to load: ${file.key}`);
    });

    // Load external assets (optional)
    this.load.audio("bgMusic", "assets/ambience.mp3");
    this.load.audio("collectStar", "assets/collect.mp3");
    this.load.audio("playerDead", "assets/dead.mp3");
    this.load.audio("loseLife", "assets/hit.mp3");

    // Always create fallback assets to ensure game works
    this.createFallbackAssets();
  }

  createFallbackAssets() {
    const createSky = () => {
      const g = this.add.graphics();
      g.fillGradientStyle(0xe0ffff, 0xb0e0e6, 0xadd8e6, 0x4682b4, 1);
      g.fillRect(0, 0, 800, 600);
      g.generateTexture("sky", 800, 600);
      g.destroy();
    };

    const createPlatform = () => {
      const g = this.add.graphics();

      // Es biru terang
      g.fillStyle(0xadd8e6); // light blue
      g.fillRoundedRect(0, 0, 400, 32, 8);

      // Retakan es
      g.lineStyle(2, 0xffffff); // putih untuk retakan es
      g.beginPath();
      g.moveTo(20, 20);
      g.lineTo(60, 12);
      g.lineTo(100, 18);
      g.lineTo(140, 10);
      g.lineTo(180, 20);
      g.lineTo(220, 14);
      g.lineTo(260, 22);
      g.lineTo(300, 16);
      g.lineTo(340, 20);
      g.lineTo(380, 14);
      g.strokePath();

      // Outline biru tua
      g.lineStyle(2, 0x4682b4);
      g.strokeRoundedRect(0, 0, 400, 32, 8);

      g.generateTexture("ground", 400, 32);
      g.destroy();
    };

    const createStar = () => {
      const g = this.add.graphics();
      const cx = 12,
        cy = 12;
      g.fillStyle(0xffe066); // lebih lembut dari gold
      g.lineStyle(2, 0xffb347); // orange muda

      g.beginPath();
      for (let i = 0; i < 10; i++) {
        const angle = (i * Math.PI) / 5;
        const radius = i % 2 === 0 ? 10 : 5;
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;
        i === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
      }
      g.closePath();
      g.fillPath();
      g.strokePath();
      g.generateTexture("star", 24, 24);
      g.destroy();
    };

    const createPlayer = () => {
      const g = this.add.graphics();

      // Badan utama (kubus)
      g.fillStyle(0x1e90ff); // biru dodger
      g.fillRoundedRect(0, 0, 32, 32, 6);

      // Mata putih
      g.fillStyle(0xffffff);
      g.fillCircle(10, 12, 4);
      g.fillCircle(22, 12, 4);

      // Bola mata hitam
      g.fillStyle(0x000000);
      g.fillCircle(10, 12, 2);
      g.fillCircle(22, 12, 2);

      // Alis (menambah ekspresi)
      g.lineStyle(2, 0x000000);
      g.beginPath();
      g.moveTo(6, 7);
      g.lineTo(14, 9);
      g.moveTo(26, 7);
      g.lineTo(18, 9);
      g.strokePath();

      // Mulut senyum
      g.lineStyle(2, 0x000000);
      g.beginPath();
      g.arc(16, 20, 6, 0, Math.PI, false);
      g.strokePath();

      // Outline
      g.lineStyle(2, 0x000000);
      g.strokeRoundedRect(0, 0, 32, 32, 6);

      g.generateTexture("dude", 32, 32);
      g.destroy();
    };

    const createEnemy = () => {
      const g = this.add.graphics();

      // Badan merah gelap
      g.fillStyle(0x8b0000); // dark red
      g.fillRoundedRect(0, 8, 32, 24, 6);

      // Spikes tajam atas
      g.fillStyle(0x330000);
      for (let i = 0; i < 4; i++) {
        const x = i * 8 + 4;
        g.fillTriangle(x, 8, x + 4, 0, x + 8, 8);
      }

      // Mata menyala (kuning kemerahan)
      g.fillStyle(0xffcc00);
      g.fillCircle(10, 18, 3.5);
      g.fillCircle(22, 18, 3.5);

      // Pupil merah
      g.fillStyle(0xff0000);
      g.fillCircle(10, 18, 1.5);
      g.fillCircle(22, 18, 1.5);

      // Mulut gelap
      g.fillStyle(0x000000);
      g.fillRoundedRect(10, 24, 12, 4, 1);

      // Taring tajam
      g.fillStyle(0xffffff);
      g.fillTriangle(12, 24, 13, 28, 14, 24);
      g.fillTriangle(18, 24, 19, 28, 20, 24);

      // Outline
      g.lineStyle(2, 0x550000);
      g.strokeRoundedRect(0, 8, 32, 24, 6);

      g.generateTexture("enemy", 32, 32);
      g.destroy();
    };

    // Generate all fallback assets
    createSky();
    createPlatform();
    createStar();
    createPlayer();
    createEnemy();
  }

  create() {
    // Initialize transition flag
    this.levelTransitioning = false;

    // Background
    this.add.image(400, 300, "sky");

    // Create platforms
    this.createPlatforms();

    // Player setup with proper physics
    player = this.physics.add.sprite(100, 450, "dude");
    player.setScale(1);
    player.setBounce(0.2);
    player.setCollideWorldBounds(true);
    player.setSize(24, 40); // Adjust hitbox for better collision

    // Simple animations (works with any sprite)
    this.anims.create({
      key: "idle",
      frames: [{ key: "dude", frame: 0 }],
      frameRate: 1,
    });

    // Create game objects
    this.createStars();
    this.createEnemies();

    // UI setup
    this.setupUI();

    // Physics colliders
    this.setupPhysics();

    // Controls
    cursors = this.input.keyboard.createCursorKeys();

    // Particle effects
    this.setupParticles();

    // Audio setup (with error handling)
    this.setupAudio();

    gameOver = false;
    gameStarted = true;
  }

  setupUI() {
    scoreText = this.add.text(16, 16, `Score: ${score}`, {
      fontSize: "24px",
      color: "#FFD700",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 2,
    });

    levelText = this.add.text(16, 50, `Level: ${level}`, {
      fontSize: "24px",
      color: "#00FF00",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 2,
    });

    livesText = this.add.text(16, 84, `Lives: ${lives}`, {
      fontSize: "24px",
      color: "#FF4444",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 2,
    });
  }

  setupPhysics() {
    this.physics.add.collider(player, platforms);
    this.physics.add.collider(stars, platforms);
    this.physics.add.collider(enemies, platforms);
    this.physics.add.overlap(player, stars, this.collectStar, null, this);
    this.physics.add.overlap(player, enemies, this.hitEnemy, null, this);
  }

  setupParticles() {
    this.starParticles = this.add.particles(0, 0, "star", {
      scale: { start: 0.5, end: 0 },
      speed: { min: 50, max: 150 },
      lifespan: 500,
      emitting: false,
    });

    this.explosionParticles = this.add.particles(0, 0, "enemy", {
      scale: { start: 0.3, end: 0 },
      speed: { min: 100, max: 200 },
      lifespan: 400,
      emitting: false,
    });
  }

  setupAudio() {
    try {
      // FIXED: Always create sound objects even if they exist
      // This ensures fresh audio instances that can play multiple times

      // Sound effects - create with proper settings for multiple playback
      this.collectSound = this.sound.add("collectStar", {
        volume: 0.3,
        // Allow multiple instances to prevent blocking
        allowMultiple: true,
      });

      this.hurtSound = this.sound.add("loseLife", {
        volume: 0.4,
        allowMultiple: true,
      });

      this.deadSound = this.sound.add("playerDead", {
        volume: 0.5,
        allowMultiple: true,
      });

      // Background music - only one instance needed
      if (!this.bgMusic) {
        this.bgMusic = this.sound.add("bgMusic", {
          volume: 0.15,
          loop: true,
        });
      }

      // FIXED: Start background music immediately when game starts
      // No need to wait for user interaction since game starts on button press
      this.startBackgroundMusic();
    } catch (error) {
      console.warn("Audio setup failed, game will continue without sound");
    }
  }

  startBackgroundMusic() {
    // FIXED: Start music directly since user already interacted by pressing play
    if (this.bgMusic && !this.bgMusic.isPlaying) {
      try {
        this.bgMusic.play();
      } catch (error) {
        console.warn("Failed to play background music:", error);
      }
    }
  }

  createPlatforms() {
    platforms = this.physics.add.staticGroup();

    // Main ground
    platforms.create(400, 568, "ground").setScale(2).refreshBody();

    // Level-specific platforms
    const platformConfigs = {
      1: [
        { x: 600, y: 400 },
        { x: 50, y: 250 },
        { x: 750, y: 220 },
      ],
      2: [
        { x: 200, y: 450 },
        { x: 600, y: 350 },
        { x: 100, y: 200 },
        { x: 700, y: 150 },
        { x: 400, y: 280 },
      ],
    };

    const configs = platformConfigs[level] || [
      { x: 150, y: 500 },
      { x: 450, y: 420 },
      { x: 650, y: 340 },
      { x: 200, y: 260 },
      { x: 550, y: 180 },
    ];

    configs.forEach((config) => {
      platforms.create(config.x, config.y, "ground");
    });
  }

  createStars() {
    const starCount = Math.min(6 + level * 2, 12);
    stars = this.physics.add.group();

    for (let i = 0; i < starCount; i++) {
      const x = 50 + (700 / starCount) * i + Phaser.Math.Between(-20, 20);
      const star = stars.create(x, 0, "star");
      star.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
    }
  }

  createEnemies() {
    const enemyCount = Math.min(level, 5);
    enemies = this.physics.add.group();

    for (let i = 0; i < enemyCount; i++) {
      const x = Phaser.Math.Between(200, 600);
      const enemy = enemies.create(x, 16, "enemy");
      enemy.setBounce(1);
      enemy.setVelocity(Phaser.Math.Between(-80, 80), 20);
      enemy.setCollideWorldBounds(true);
      enemy.setSize(28, 28); // Better hitbox
    }
  }

  update() {
    if (gameOver || !gameStarted) {
      return;
    }

    this.handlePlayerMovement();
    this.handleEnemyAI();
  }

  handlePlayerMovement() {
    // Combined input handling - keyboard + mobile
    const leftPressed = cursors.left.isDown || mobileControls.left;
    const rightPressed = cursors.right.isDown || mobileControls.right;
    const jumpPressed = cursors.up.isDown || mobileControls.jump;

    // Horizontal movement with proper acceleration
    if (leftPressed) {
      player.setVelocityX(-160);
    } else if (rightPressed) {
      player.setVelocityX(160);
    } else {
      // Gradual stop for smoother movement
      player.setVelocityX(player.body.velocity.x * 0.8);
    }

    // Jumping with ground check
    if (jumpPressed && player.body.touching.down) {
      player.setVelocityY(-350);
    }

    // Keep player in bounds
    if (player.x < 0) player.x = 0;
    if (player.x > 800) player.x = 800;
  }

  handleEnemyAI() {
    enemies.children.iterate((enemy) => {
      if (enemy.active) {
        // Reverse direction when hitting walls
        if (enemy.body.touching.left || enemy.body.touching.right) {
          enemy.setVelocityX(-enemy.body.velocity.x);
        }
        // Keep enemies moving if they get stuck
        if (Math.abs(enemy.body.velocity.x) < 10) {
          enemy.setVelocityX(Phaser.Math.Between(-80, 80));
        }
      }
    });
  }

  collectStar(player, star) {
    // Prevent multiple triggers
    if (!star.active) return;

    star.disableBody(true, true);

    // FIXED: Play sound effect - now works multiple times
    if (this.collectSound) {
      try {
        // Stop any currently playing instance to ensure fresh playback
        if (this.collectSound.isPlaying) {
          this.collectSound.stop();
        }
        this.collectSound.play();
      } catch (error) {
        console.warn("Could not play collect sound:", error);
      }
    }

    // Particle effect
    this.starParticles.emitParticleAt(star.x, star.y, 8);

    // Update score
    score += 10 * level;
    scoreText.setText(`Score: ${score}`);

    // Flash effect
    this.tweens.add({
      targets: scoreText,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 200,
      yoyo: true,
      ease: "Power2",
    });

    // Check level completion with delay to prevent conflicts
    this.time.delayedCall(100, () => {
      if (stars.countActive(true) === 0) {
        this.nextLevel();
      }
    });
  }

  hitEnemy(player, enemy) {
    if (player.getData("invulnerable")) return;

    lives--;
    livesText.setText(`Lives: ${lives}`);

    // FIXED: Play hurt sound - now works multiple times
    if (this.hurtSound) {
      try {
        if (this.hurtSound.isPlaying) {
          this.hurtSound.stop();
        }
        this.hurtSound.play();
      } catch (error) {
        console.warn("Could not play hurt sound:", error);
      }
    }

    // Particle effect
    this.explosionParticles.emitParticleAt(player.x, player.y, 12);

    // Screen shake
    this.cameras.main.shake(300, 0.02);

    if (lives <= 0) {
      this.gameOverSequence();
    } else {
      this.respawnPlayer();
    }
  }

  respawnPlayer() {
    // Reset position
    player.setPosition(100, 450);
    player.setVelocity(0, 0);

    // Invulnerability period
    player.setData("invulnerable", true);
    player.setAlpha(0.5);

    // Flashing effect
    this.tweens.add({
      targets: player,
      alpha: 0.2,
      duration: 200,
      yoyo: true,
      repeat: 5,
      onComplete: () => {
        player.setAlpha(1);
        player.setData("invulnerable", false);
      },
    });
  }

  nextLevel() {
    // Prevent multiple calls
    if (this.levelTransitioning) return;
    this.levelTransitioning = true;

    // Pause physics to prevent further interactions
    this.physics.pause();

    level++;
    levelText.setText(`Level: ${level}`);

    // Bonus score
    score += 50 * level;
    scoreText.setText(`Score: ${score}`);

    // Victory effects
    this.cameras.main.flash(500, 255, 215, 0);

    const completedText = this.add
      .text(400, 250, `LEVEL ${level - 1} COMPLETE!`, {
        fontSize: "32px",
        color: "#FFD700",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    const nextText = this.add
      .text(400, 300, `Preparing Level ${level}...`, {
        fontSize: "20px",
        color: "#FFFFFF",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 2,
      })
      .setOrigin(0.5);

    // Restart scene for next level
    this.time.delayedCall(2500, () => {
      this.levelTransitioning = false;
      this.scene.restart();
    });
  }

  gameOverSequence() {
    gameOver = true;

    // FIXED: Stop background music and play death sound
    if (this.bgMusic && this.bgMusic.isPlaying) {
      this.bgMusic.stop();
    }

    if (this.deadSound) {
      try {
        this.deadSound.play();
      } catch (error) {
        console.warn("Could not play dead sound:", error);
      }
    }

    this.physics.pause();
    player.setTint(0xff0000);

    // Game over UI
    const overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.7);

    const gameOverText = this.add
      .text(400, 200, "GAME OVER", {
        fontSize: "48px",
        color: "#FF4444",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    const scoreText = this.add
      .text(400, 280, `Final Score: ${score}`, {
        fontSize: "24px",
        color: "#FFD700",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    const levelText = this.add
      .text(400, 320, `Level Reached: ${level}`, {
        fontSize: "20px",
        color: "#FFFFFF",
      })
      .setOrigin(0.5);

    const restartText = this.add
      .text(400, 380, "Press SPACE or tap to restart", {
        fontSize: "18px",
        color: "#AAAAAA",
      })
      .setOrigin(0.5);

    // Blinking restart text
    this.tweens.add({
      targets: restartText,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    // Restart controls
    const spaceKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    );
    spaceKey.once("down", this.restartGame, this);
    this.input.once("pointerdown", this.restartGame, this);
  }

  restartGame() {
    // FIXED: Stop all sounds before restarting
    this.sound.stopAll();

    // Reset game state
    score = 0;
    level = 1;
    lives = 3;
    gameOver = false;
    gameStarted = false;
    this.scene.restart();
  }
}

// Game configuration
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: "game",
  backgroundColor: "#2c3e50",
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 300 },
      debug: false, // Set to true for debugging
    },
  },
  scene: GameScene,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 800,
    height: 600,
  },
};

// Initialize game when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  initializeMobileControls();

  document.getElementById("startGameBtn").addEventListener("click", () => {
    document.getElementById("startGameBtn").style.display = "none";
    new Phaser.Game(config);
  });
});
