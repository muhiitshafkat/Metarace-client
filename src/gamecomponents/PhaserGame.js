import Phaser from "phaser";

// ── Constants ─────────────────────────────────────────────────────
const W = 800;
const H = 420;
const LANES = 4;
const LANE_H = H / LANES;
const RACE_DISTANCE = 6000;   // total scroll distance = race length
const AI_NAMES = ["Shadow", "Thunder", "Blaze"];

// Tap mechanic
const MAX_STAMINA     = 100;
const STAMINA_DRAIN   = 2.2;   // per tap
const STAMINA_REGEN   = 0.18;  // per frame when not tapping
const TAP_SPEED_BOOST = 0.55;  // speed added per tap
const BASE_SPEED      = 1.8;   // minimum horse speed
const MAX_SPEED       = 6.5;   // cap

// ── Asset generation helpers ──────────────────────────────────────

function makeTrack(scene) {
  const g = scene.make.graphics({ add: false });
  // Sky
  g.fillGradientStyle(0x1a0535, 0x1a0535, 0x0d1a2e, 0x0d1a2e, 1);
  g.fillRect(0, 0, W, H * 0.28);
  // Distant hills
  g.fillStyle(0x1a4a1a, 1);
  g.fillEllipse(200, H * 0.28, 300, 80);
  g.fillEllipse(500, H * 0.28, 260, 70);
  g.fillEllipse(750, H * 0.28, 200, 60);
  // Ground
  g.fillStyle(0x2d5a1b, 1);
  g.fillRect(0, H * 0.28, W, H * 0.72);
  // Lane tracks (alternating dirt strips)
  for (let i = 0; i < LANES; i++) {
    const y = i * LANE_H + LANE_H * 0.35;
    const h = LANE_H * 0.65;
    g.fillStyle(i % 2 === 0 ? 0xc8a96e : 0xb8945a, 1);
    g.fillRect(0, y, W, h);
    // Lane divider (white dashed line)
    g.fillStyle(0xffffff, 0.25);
    g.fillRect(0, y, W, 2);
  }
  g.generateTexture("track", W, H);
  g.destroy();
}

function makeTree(scene) {
  const g = scene.make.graphics({ add: false });
  g.fillStyle(0x5c3317, 1);
  g.fillRect(9, 28, 6, 22);
  g.fillStyle(0x1a6b1a, 1);
  g.fillTriangle(12, 0, 0, 28, 24, 28);
  g.fillStyle(0x228b22, 1);
  g.fillTriangle(12, 8, 2, 30, 22, 30);
  g.generateTexture("tree", 24, 50);
  g.destroy();
}

function makeFinish(scene) {
  const g = scene.make.graphics({ add: false });
  const sz = 18;
  for (let r = 0; r < Math.ceil(H / sz); r++) {
    for (let c = 0; c < 4; c++) {
      g.fillStyle((r + c) % 2 === 0 ? 0xffffff : 0x111111, 1);
      g.fillRect(c * sz, r * sz, sz, sz);
    }
  }
  g.generateTexture("finish", sz * 4, H);
  g.destroy();
}

// Draw horse spritesheet onto an HTML5 canvas, then register with Phaser
function makeHorseFrames(scene, key, bodyColor, maneColor) {
  const FW = 96, FH = 56, FRAMES = 8;
  const sheetKey = key + "_sheet";
  if (scene.textures.exists(sheetKey)) return;

  // Create a native canvas
  const canvas = document.createElement("canvas");
  canvas.width  = FW * FRAMES;
  canvas.height = FH;
  const ctx = canvas.getContext("2d");

  // Helper: hex color → css string
  const hex = (c) => "#" + c.toString(16).padStart(6, "0");

  for (let f = 0; f < FRAMES; f++) {
    const ox = f * FW;
    const legPhase = (f / FRAMES) * Math.PI * 2;

    // Shadow
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.ellipse(ox + 46, FH - 4, 30, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Body
    ctx.fillStyle = hex(bodyColor);
    ctx.beginPath();
    ctx.ellipse(ox + 46, 28, 32, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Neck
    ctx.fillStyle = hex(bodyColor);
    ctx.beginPath();
    ctx.ellipse(ox + 68, 20, 8, 12, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = hex(bodyColor);
    ctx.beginPath();
    ctx.ellipse(ox + 78, 13, 11, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Ear
    ctx.fillStyle = hex(bodyColor);
    ctx.beginPath();
    ctx.moveTo(ox + 72, 7); ctx.lineTo(ox + 78, 7); ctx.lineTo(ox + 75, 1);
    ctx.closePath(); ctx.fill();

    // Nostril
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.beginPath();
    ctx.ellipse(ox + 85, 15, 2, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eye
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(ox + 79, 10, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#111";
    ctx.beginPath();
    ctx.arc(ox + 80, 10, 1.3, 0, Math.PI * 2); ctx.fill();

    // Mane
    ctx.fillStyle = hex(maneColor);
    ctx.beginPath();
    ctx.ellipse(ox + 68, 10, 5, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // Tail
    ctx.fillStyle = hex(maneColor);
    ctx.beginPath();
    ctx.ellipse(ox + 16, 24, 5, 11, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(ox + 13, 33, 4, 7, 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Legs — 4 legs with gallop cycle
    const legDefs = [
      { x: ox + 34, phase: 0 },
      { x: ox + 44, phase: Math.PI * 0.5 },
      { x: ox + 54, phase: Math.PI },
      { x: ox + 62, phase: Math.PI * 1.5 },
    ];
    legDefs.forEach(({ x, phase }) => {
      const angle = Math.sin(legPhase + phase) * 0.45;
      const ex = x + Math.sin(angle) * 16;
      const ey = 36 + Math.cos(angle) * 16;
      ctx.strokeStyle = hex(bodyColor);
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(x, 36);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      // Hoof
      ctx.fillStyle = "#333";
      ctx.beginPath();
      ctx.ellipse(ex, ey + 2, 4, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    // Jockey body
    ctx.fillStyle = "#7936d9";
    ctx.beginPath();
    ctx.ellipse(ox + 58, 11, 6, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    // Jockey head
    ctx.fillStyle = "#ffcc99";
    ctx.beginPath();
    ctx.arc(ox + 58, 4, 4.5, 0, Math.PI * 2); ctx.fill();
    // Helmet
    ctx.fillStyle = "#ffd700";
    ctx.beginPath();
    ctx.ellipse(ox + 58, 1, 6, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Add canvas as texture then register as spritesheet
  scene.textures.addCanvas(sheetKey, canvas);
  scene.textures.get(sheetKey).add("__BASE", 0, 0, 0, FW * FRAMES, FH);

  // Manually add frames for the spritesheet
  const tex = scene.textures.get(sheetKey);
  for (let f = 0; f < FRAMES; f++) {
    tex.add(f, 0, f * FW, 0, FW, FH);
  }
}

// ── Preload Scene ─────────────────────────────────────────────────
class PreloadScene extends Phaser.Scene {
  constructor() { super("PreloadScene"); }

  create() {
    makeTrack(this);
    makeTree(this);
    makeFinish(this);

    // Horse color schemes: [body, mane]
    const schemes = [
      [0x7936d9, 0x3a1a6e],  // player — purple
      [0xc8601a, 0x7a3a0a],  // AI 0 — chestnut
      [0x2a2a2a, 0x111111],  // AI 1 — black
      [0xd4a96e, 0x8a6a3e],  // AI 2 — palomino
    ];
    schemes.forEach(([body, mane], i) => {
      makeHorseFrames(this, `horse${i}`, body, mane);
    });

    this.scene.start("RaceScene");
  }
}

// ── Race Scene ────────────────────────────────────────────────────
class RaceScene extends Phaser.Scene {
  constructor() {
    super("RaceScene");
    this.scrollX       = 0;
    this.raceStarted   = false;
    this.raceFinished  = false;
    this.placements    = [];
    this.callbackFired = false;
    this._tapCount     = 0;
    this._lastTapTime  = 0;
  }

  init(data) {
    this.mrtMultiplier = data.multiplier   || 100;
    this.stakedCount   = data.stakedCount  || 0;
    this.onRaceEnd     = data.onRaceEnd    || (() => {});
  }

  create() {
    // ── Background ───────────────────────────────────────────
    this.bg = this.add.tileSprite(0, 0, W, H, "track").setOrigin(0, 0);

    // Parallax trees
    this.trees = [];
    for (let i = 0; i < 14; i++) {
      const x = Phaser.Math.Between(0, W);
      const y = Phaser.Math.Between(2, Math.floor(H * 0.26));
      this.trees.push(
        this.add.image(x, y, "tree").setScale(0.7 + Math.random() * 0.5).setDepth(1)
      );
    }

    // Finish line
    this.finishLine = this.add.image(W + RACE_DISTANCE, H / 2, "finish")
      .setOrigin(0, 0.5).setDisplaySize(72, H).setDepth(2);

    // ── Horses ───────────────────────────────────────────────
    this.horses = [];

    // Staking speed bonus: multiplier 100→+0, 150→+0.3, 200→+0.6, 300→+1.2
    const stakingBonus = (this.mrtMultiplier - 100) * 0.006;

    const configs = [
      { key: "horse0", isPlayer: true,  name: "You",     baseSpeed: BASE_SPEED + stakingBonus, lane: 1 },
      { key: "horse1", isPlayer: false, name: "Shadow",  baseSpeed: BASE_SPEED + Math.random() * 0.4, lane: 0 },
      { key: "horse2", isPlayer: false, name: "Thunder", baseSpeed: BASE_SPEED + Math.random() * 0.4, lane: 2 },
      { key: "horse3", isPlayer: false, name: "Blaze",   baseSpeed: BASE_SPEED + Math.random() * 0.4, lane: 3 },
    ];

    configs.forEach((cfg) => {
      const y = cfg.lane * LANE_H + LANE_H * 0.6;
      const sheetKey = cfg.key + "_sheet";
      let sprite;

      if (this.textures.exists(sheetKey)) {
        sprite = this.add.sprite(110, y, sheetKey, 0).setScale(0.85).setDepth(3);
        // Create anim only once
        const animKey = `gallop_${cfg.key}`;
        if (!this.anims.exists(animKey)) {
          this.anims.create({
            key: animKey,
            frames: this.anims.generateFrameNumbers(sheetKey, { start: 0, end: 7 }),
            frameRate: 12,
            repeat: -1,
          });
        }
        sprite.play(animKey);
      } else {
        // Fallback rectangle if texture failed
        sprite = this.add.rectangle(110, y, 80, 36,
          cfg.isPlayer ? 0x7936d9 : 0xcc4400).setDepth(3);
      }

      this.horses.push({
        sprite,
        isPlayer:  cfg.isPlayer,
        name:      cfg.name,
        baseSpeed: cfg.baseSpeed,
        speed:     cfg.baseSpeed,
        stamina:   MAX_STAMINA,
        dist:      0,
        finished:  false,
        placement: 0,
        lane:      cfg.lane,
      });
    });

    this.player = this.horses[0];

    // ── HUD ──────────────────────────────────────────────────
    this.add.rectangle(0, 0, W, 48, 0x000000, 0.6).setOrigin(0, 0).setDepth(10);

    // Stamina bar background
    this.add.rectangle(12, 30, 160, 12, 0x333333).setOrigin(0, 0.5).setDepth(11);
    this.staminaBar = this.add.rectangle(12, 30, 160, 12, 0x00cc44).setOrigin(0, 0.5).setDepth(12);
    this.add.text(12, 8, "STAMINA", { fontSize: "11px", color: "#aaffaa", fontFamily: "Arial" }).setDepth(11);

    // Position text
    this.posText = this.add.text(W / 2, 8, "Position: --", {
      fontSize: "15px", color: "#ffffff", fontFamily: "Arial Black",
    }).setOrigin(0.5, 0).setDepth(11);

    // Distance progress bar
    this.add.rectangle(W / 2, 36, 280, 8, 0x333333).setOrigin(0.5, 0.5).setDepth(11);
    this.progressBar = this.add.rectangle(W / 2 - 140, 36, 0, 8, 0x7936d9).setOrigin(0, 0.5).setDepth(12);

    // Multiplier badge
    this.add.text(W - 12, 8, `×${(this.mrtMultiplier / 100).toFixed(1)} MRT`, {
      fontSize: "14px", color: "#c03dff", fontFamily: "Arial Black",
    }).setOrigin(1, 0).setDepth(11);

    // Tap prompt
    this.tapPrompt = this.add.text(W / 2, H / 2 + 60,
      "TAP  [SPACE]  or  CLICK  to  gallop!", {
        fontSize: "18px", color: "#ffd700", fontFamily: "Arial Black",
        stroke: "#000", strokeThickness: 4,
      }).setOrigin(0.5).setDepth(15).setVisible(false);

    // ── Countdown ────────────────────────────────────────────
    this.cdText = this.add.text(W / 2, H / 2 - 20, "3", {
      fontSize: "80px", fontFamily: "Arial Black", color: "#c03dff",
      stroke: "#000000", strokeThickness: 8,
    }).setOrigin(0.5).setDepth(20);

    let cd = 3;
    this.time.addEvent({
      delay: 900, repeat: 3,
      callback: () => {
        cd--;
        if (cd > 0) {
          this.cdText.setText(String(cd));
          this.cdText.setColor(cd === 2 ? "#ffaa00" : "#00ff88");
        } else if (cd === 0) {
          this.cdText.setText("GO!");
          this.cdText.setColor("#00ff88");
          this.raceStarted = true;
          this.tapPrompt.setVisible(true);
          this.time.delayedCall(700, () => {
            this.cdText.setVisible(false);
            this.tapPrompt.setVisible(false);
          });
        }
      },
    });

    // ── Input ─────────────────────────────────────────────────
    this.input.keyboard.on("keydown-SPACE", () => this._onTap());
    this.input.on("pointerdown", () => this._onTap());

    // Mobile touch boost button
    this.boostBtn = this.add.rectangle(W - 60, H - 50, 100, 50, 0x7936d9, 0.85)
      .setInteractive().setDepth(15);
    this.add.text(W - 60, H - 50, "TAP!", {
      fontSize: "18px", fontFamily: "Arial Black", color: "#fff",
    }).setOrigin(0.5).setDepth(16);
    this.boostBtn.on("pointerdown", () => this._onTap());
  }

  _onTap() {
    if (!this.raceStarted || this.raceFinished || this.player.finished) return;
    const now = this.time.now;
    // Rapid tap detection — reward fast tapping
    const timeSinceLast = now - this._lastTapTime;
    this._lastTapTime = now;

    if (this.player.stamina > 0) {
      // Speed boost proportional to tap speed (faster taps = more boost)
      const tapBonus = timeSinceLast < 300 ? TAP_SPEED_BOOST * 1.3 : TAP_SPEED_BOOST;
      this.player.speed = Math.min(this.player.speed + tapBonus, MAX_SPEED);
      this.player.stamina = Math.max(0, this.player.stamina - STAMINA_DRAIN);
      this._tapCount++;

      // Visual feedback — brief scale pulse
      this.tweens.add({
        targets: this.player.sprite,
        scaleX: 0.95, scaleY: 0.75,
        duration: 60,
        yoyo: true,
      });
    }
  }

  update(time, delta) {
    if (!this.raceStarted || this.raceFinished) return;
    const dt = delta / 16.67;

    // ── Update player ─────────────────────────────────────────
    if (!this.player.finished) {
      // Stamina regen
      this.player.stamina = Math.min(MAX_STAMINA, this.player.stamina + STAMINA_REGEN * dt);
      // Speed decay toward base
      this.player.speed = Math.max(
        this.player.baseSpeed,
        this.player.speed - 0.06 * dt
      );
      this.player.dist += this.player.speed * dt;

      // Stamina bar
      const pct = this.player.stamina / MAX_STAMINA;
      this.staminaBar.width = 160 * pct;
      this.staminaBar.fillColor = pct > 0.5 ? 0x00cc44 : pct > 0.25 ? 0xffaa00 : 0xff3300;
    }

    // ── Update AI ─────────────────────────────────────────────
    this.horses.forEach((h, i) => {
      if (i === 0 || h.finished) return;
      // AI uses sine wave variation for natural feel
      h.speed = h.baseSpeed + Math.sin(time * 0.0008 + i * 1.3) * 0.35;
      h.dist += h.speed * dt;
    });

    // ── Scroll world ──────────────────────────────────────────
    const scrollSpeed = this.player.finished ? 0 : this.player.speed * dt;
    this.scrollX += scrollSpeed;
    this.bg.tilePositionX = this.scrollX * 0.55;

    // Trees parallax
    this.trees.forEach(t => {
      t.x -= scrollSpeed * 0.35;
      if (t.x < -30) t.x = W + 30;
    });

    // Finish line
    this.finishLine.x = W + RACE_DISTANCE - this.scrollX - 36;

    // AI horse positions relative to player
    this.horses.forEach((h, i) => {
      if (i === 0) return;
      const relX = 110 + (h.dist - this.player.dist);
      h.sprite.x = Phaser.Math.Clamp(relX, -120, W + 120);
    });

    // ── Check finishes ────────────────────────────────────────
    this.horses.forEach(h => {
      if (!h.finished && h.dist >= RACE_DISTANCE) {
        h.finished = true;
        h.placement = this.placements.length + 1;
        this.placements.push({ name: h.name, isPlayer: h.isPlayer, placement: h.placement });
        if (h.isPlayer) this._showPlacementFlash(h.placement);
      }
    });

    // ── Update HUD ────────────────────────────────────────────
    const progress = Math.min(this.player.dist / RACE_DISTANCE, 1);
    this.progressBar.width = 280 * progress;

    const ahead = this.horses.filter(
      h => !h.isPlayer && h.dist > this.player.dist
    ).length;
    const posLabels = ["1st 🥇", "2nd 🥈", "3rd 🥉", "4th"];
    this.posText.setText(posLabels[ahead] || "4th");

    // ── Race end ──────────────────────────────────────────────
    const allDone = this.horses.every(h => h.finished);
    if (allDone && !this.callbackFired) {
      this.callbackFired = true;
      this.raceFinished = true;
      this.time.delayedCall(1000, () => this._showResults());
    }

    // Safety: if player finishes but AI stalls, end after 6s
    if (this.player.finished && !this.callbackFired) {
      if (!this._playerFinishTime) this._playerFinishTime = time;
      if (time - this._playerFinishTime > 6000) {
        this.callbackFired = true;
        this.raceFinished = true;
        this.horses.filter(h => !h.finished).forEach(h => {
          h.finished = true;
          h.placement = this.placements.length + 1;
          this.placements.push({ name: h.name, isPlayer: false, placement: h.placement });
        });
        this._showResults();
      }
    }
  }

  _showPlacementFlash(placement) {
    const labels = ["🥇 1st!", "🥈 2nd!", "🥉 3rd!", "4th Place"];
    const colors = ["#ffd700", "#c0c0c0", "#cd7f32", "#ffffff"];
    const t = this.add.text(W / 2, H / 2 - 60, labels[placement - 1] || "Finished!", {
      fontSize: "56px", fontFamily: "Arial Black",
      color: colors[placement - 1] || "#fff",
      stroke: "#000", strokeThickness: 8,
    }).setOrigin(0.5).setDepth(25);
    this.tweens.add({
      targets: t, y: H / 2 - 110, alpha: 0,
      duration: 2200, ease: "Power2",
      onComplete: () => t.destroy(),
    });
  }

  _showResults() {
    // Overlay
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.78).setDepth(30);

    const playerResult = this.placements.find(p => p.isPlayer);
    const placement = playerResult ? playerResult.placement : 4;
    const baseRewards = [50, 30, 15, 5];
    const mrtEarned = Math.round((baseRewards[placement - 1] || 5) * (this.mrtMultiplier / 100));

    const titles = ["🥇 VICTORY!", "🥈 2nd Place", "🥉 3rd Place", "4th Place"];
    this.add.text(W / 2, H / 2 - 90, titles[placement - 1] || "Finished!", {
      fontSize: "44px", fontFamily: "Arial Black", color: "#c03dff",
      stroke: "#000", strokeThickness: 6,
    }).setOrigin(0.5).setDepth(31);

    this.add.text(W / 2, H / 2 - 36, `+${mrtEarned} MRT earned`, {
      fontSize: "30px", fontFamily: "Arial Black", color: "#ffd700",
      stroke: "#000", strokeThickness: 4,
    }).setOrigin(0.5).setDepth(31);

    // Results table
    const sorted = [...this.placements].sort((a, b) => a.placement - b.placement);
    sorted.forEach((p, i) => {
      const medal = ["🥇", "🥈", "🥉", "  "][i] || "  ";
      this.add.text(W / 2, H / 2 + 10 + i * 28, `${medal}  ${p.name}`, {
        fontSize: "19px", fontFamily: "Arial",
        color: p.isPlayer ? "#c03dff" : "#aaaaaa",
        stroke: "#000", strokeThickness: 3,
      }).setOrigin(0.5).setDepth(31);
    });

    this.add.text(W / 2, H - 28, "Results saving...", {
      fontSize: "13px", color: "rgba(255,255,255,0.4)", fontFamily: "Arial",
    }).setOrigin(0.5).setDepth(31);

    this.time.delayedCall(2800, () => {
      this.onRaceEnd({ placement, mrtEarned, multiplier: this.mrtMultiplier });
    });
  }
}

// ── Game factory ──────────────────────────────────────────────────
export function createRaceGame(containerId, config) {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    width: W,
    height: H,
    backgroundColor: "#0a0a18",
    parent: containerId,
    scene: [PreloadScene, RaceScene],
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    audio: { disableWebAudio: true },
  });

  // Pass config to RaceScene once it starts
  game.events.on("ready", () => {
    const scene = game.scene.getScene("RaceScene");
    if (scene) {
      scene.mrtMultiplier = config.multiplier  || 100;
      scene.stakedCount   = config.stakedCount || 0;
      scene.onRaceEnd     = config.onRaceEnd   || (() => {});
    }
  });

  // Also hook into scene start (more reliable)
  game.events.on("step", () => {
    const scene = game.scene.getScene("RaceScene");
    if (scene && scene.sys.isActive() && !scene._configApplied) {
      scene._configApplied  = true;
      scene.mrtMultiplier   = config.multiplier  || 100;
      scene.stakedCount     = config.stakedCount || 0;
      scene.onRaceEnd       = config.onRaceEnd   || (() => {});
    }
  });

  return game;
}

export { W as GAME_WIDTH, H as GAME_HEIGHT };
