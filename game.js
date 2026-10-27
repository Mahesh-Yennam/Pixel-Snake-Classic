/**
 * Pixel Snake Classic - Retro 8-Bit Arcade Engine
 * Pure Vanilla JavaScript & Synthesized Web Audio API
 */

(function () {
  'use strict';

  // --- Web Audio Synthesizer ---
  let audioCtx = null;
  let isMuted = false;

  function initAudio() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playSound(type) {
    if (isMuted || !audioCtx) return;
    try {
      const now = audioCtx.currentTime;

      if (type === 'eat') {
        // Crunchy 8-bit chomp
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'bonus') {
        // Golden star sparkle arpeggio
        [659.25, 880, 1174.66].forEach((freq, idx) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.06);
          gain.gain.setValueAtTime(0.2, now + idx * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.06 + 0.18);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(now + idx * 0.06);
          osc.stop(now + idx * 0.06 + 0.18);
        });
      } else if (type === 'crash') {
        // Low explosive crash rumble
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.35);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'turn') {
        // Subtle move click
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.02);
      }
    } catch (e) {
      // Audio fallback
    }
  }

  // --- Canvas & Grid Setup ---
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  const GRID_SIZE = 24; // 24x24 tiles
  const TILE_SIZE = canvas.width / GRID_SIZE; // 25px per tile

  // --- Game State ---
  let snake = [];
  let dir = { x: 1, y: 0 };
  let nextDir = { x: 1, y: 0 };

  let food = { x: 15, y: 12, type: 'apple' };
  let bonusItem = null; // { x, y, type: 'star'|'berry', timer: 300 }

  let score = 0;
  let highScore = parseInt(localStorage.getItem('pixel_snake_highscore') || '0', 10);
  let isRunning = false;
  let isPaused = false;
  let isGameOver = false;

  // Settings
  let isWrapMode = false; // false = Solid Walls, true = Wrap-Around
  let speedLevel = 'normal'; // 'normal', 'fast', 'hyper'
  const SPEED_TICKS = {
    normal: 105,
    fast: 75,
    hyper: 50
  };

  let lastTickTime = 0;
  let particles = [];

  // DOM Elements
  const scoreVal = document.getElementById('scoreVal');
  const highVal = document.getElementById('highVal');
  const lengthVal = document.getElementById('lengthVal');
  const speedVal = document.getElementById('speedVal');
  const modeSubtitle = document.getElementById('modeSubtitle');

  const startOverlay = document.getElementById('startOverlay');
  const gameOverOverlay = document.getElementById('gameOverOverlay');
  const finalScoreEl = document.getElementById('finalScore');
  const finalLengthEl = document.getElementById('finalLength');

  const startBtn = document.getElementById('startBtn');
  const restartBtn = document.getElementById('restartBtn');
  const wallToggleBtn = document.getElementById('wallToggleBtn');
  const speedToggleBtn = document.getElementById('speedToggleBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const muteBtn = document.getElementById('muteBtn');

  // Mobile D-Pad Buttons
  const dpadUp = document.getElementById('dpadUp');
  const dpadDown = document.getElementById('dpadDown');
  const dpadLeft = document.getElementById('dpadLeft');
  const dpadRight = document.getElementById('dpadRight');

  if (highVal) highVal.textContent = highScore;

  // Initialize Pause Button State (Disabled before game start)
  if (pauseBtn) {
    pauseBtn.disabled = true;
    pauseBtn.style.opacity = '0.4';
    pauseBtn.style.pointerEvents = 'none';
  }

  // --- Particle Sparks ---
  function spawnSparks(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 1;
      particles.push({
        x: x * TILE_SIZE + TILE_SIZE / 2,
        y: y * TILE_SIZE + TILE_SIZE / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: color,
        life: 1,
        decay: Math.random() * 0.05 + 0.03
      });
    }
  }

  // --- Food Spawner ---
  function spawnFood() {
    let valid = false;
    let newX, newY;

    while (!valid) {
      newX = Math.floor(Math.random() * GRID_SIZE);
      newY = Math.floor(Math.random() * GRID_SIZE);

      // Check collision with snake
      valid = !snake.some(seg => seg.x === newX && seg.y === newY);
      if (bonusItem && bonusItem.x === newX && bonusItem.y === newY) {
        valid = false;
      }
    }

    food = { x: newX, y: newY, type: 'apple' };

    // Chance to spawn bonus item
    if (!bonusItem && Math.random() < 0.22) {
      spawnBonusItem();
    }
  }

  function spawnBonusItem() {
    let valid = false;
    let bX, bY;

    while (!valid) {
      bX = Math.floor(Math.random() * GRID_SIZE);
      bY = Math.floor(Math.random() * GRID_SIZE);
      valid = !snake.some(seg => seg.x === bX && seg.y === bY) && (bX !== food.x || bY !== food.y);
    }

    const type = Math.random() < 0.6 ? 'star' : 'berry';
    bonusItem = {
      x: bX,
      y: bY,
      type: type,
      timer: 320 // ~8 seconds
    };
  }

  // --- Core Game Functions ---
  function startGame() {
    initAudio();

    // Start with 3 segments in center moving right
    snake = [
      { x: 8, y: 12 },
      { x: 7, y: 12 },
      { x: 6, y: 12 }
    ];
    dir = { x: 1, y: 0 };
    nextDir = { x: 1, y: 0 };

    score = 0;
    bonusItem = null;
    particles = [];
    isGameOver = false;
    isRunning = true;
    isPaused = false;

    spawnFood();
    updateHUD();

    // Enable Pause Button
    if (pauseBtn) {
      pauseBtn.disabled = false;
      pauseBtn.innerHTML = '⏸️ Pause';
      pauseBtn.style.opacity = '1';
      pauseBtn.style.pointerEvents = 'auto';
    }

    startOverlay?.classList.add('hidden');
    gameOverOverlay?.classList.add('hidden');
    lastTickTime = performance.now();
  }

  function gameOver() {
    isRunning = false;
    isGameOver = true;
    isPaused = false;
    playSound('crash');

    // Disable Pause Button on Game Over
    if (pauseBtn) {
      pauseBtn.disabled = true;
      pauseBtn.innerHTML = '⏸️ Pause';
      pauseBtn.style.opacity = '0.4';
      pauseBtn.style.pointerEvents = 'none';
    }

    // Save high score
    if (score > highScore) {
      highScore = score;
      localStorage.setItem('pixel_snake_highscore', highScore.toString());
      if (highVal) highVal.textContent = highScore;
    }

    // Save max length
    const currentLen = snake.length;
    const maxLen = parseInt(localStorage.getItem('pixel_snake_max_length') || '0', 10);
    if (currentLen > maxLen) {
      localStorage.setItem('pixel_snake_max_length', currentLen.toString());
    }

    if (finalScoreEl) finalScoreEl.textContent = score;
    if (finalLengthEl) finalLengthEl.textContent = snake.length;
    gameOverOverlay?.classList.remove('hidden');
  }

  function togglePause() {
    if (!isRunning || isGameOver) return;
    isPaused = !isPaused;
    if (pauseBtn) {
      pauseBtn.innerHTML = isPaused ? '▶️ Resume' : '⏸️ Pause';
    }
  }

  function toggleMute() {
    isMuted = !isMuted;
    if (muteBtn) {
      muteBtn.innerHTML = isMuted ? '🔇 Muted' : '🔊 Sound';
    }
  }

  function updateHUD() {
    if (scoreVal) scoreVal.textContent = score;
    if (highVal) highVal.textContent = highScore;
    if (lengthVal) lengthVal.textContent = snake.length;
    if (speedVal) {
      speedVal.textContent = (speedLevel === 'normal') ? '1x' : (speedLevel === 'fast') ? '1.5x' : '2x';
    }
    if (modeSubtitle) {
      const wallText = isWrapMode ? 'Wrap-Around' : 'Solid Walls';
      const spdText = speedLevel.charAt(0).toUpperCase() + speedLevel.slice(1);
      modeSubtitle.textContent = `${wallText} • ${spdText} Speed`;
    }
    if (wallToggleBtn) {
      wallToggleBtn.innerHTML = `<span>🧱</span> Walls: ${isWrapMode ? 'Wrap' : 'Solid'}`;
    }
    if (speedToggleBtn) {
      const spdLabel = (speedLevel === 'normal') ? 'Normal' : (speedLevel === 'fast') ? 'Fast' : 'Hyper';
      speedToggleBtn.innerHTML = `<span>⚡</span> Speed: ${spdLabel}`;
    }
  }

  // --- Movement & Tick Logic ---
  function tick() {
    dir = { ...nextDir };

    let headX = snake[0].x + dir.x;
    let headY = snake[0].y + dir.y;

    // Handle Boundary Collisions
    if (isWrapMode) {
      // Teleport across edges
      if (headX < 0) headX = GRID_SIZE - 1;
      if (headX >= GRID_SIZE) headX = 0;
      if (headY < 0) headY = GRID_SIZE - 1;
      if (headY >= GRID_SIZE) headY = 0;
    } else {
      // Solid boundary walls
      if (headX < 0 || headX >= GRID_SIZE || headY < 0 || headY >= GRID_SIZE) {
        spawnSparks(snake[0].x, snake[0].y, '#ef4444', 18);
        gameOver();
        return;
      }
    }

    // Self-collision (check if head bites body)
    if (snake.some(seg => seg.x === headX && seg.y === headY)) {
      spawnSparks(headX, headY, '#ef4444', 20);
      gameOver();
      return;
    }

    // Insert new head
    snake.unshift({ x: headX, y: headY });

    // Check Food Collision
    if (headX === food.x && headY === food.y) {
      score += 10;
      playSound('eat');
      spawnSparks(headX, headY, '#22c55e', 14);
      spawnFood();
      updateHUD();
    } else if (bonusItem && headX === bonusItem.x && headY === bonusItem.y) {
      if (bonusItem.type === 'star') {
        score += 50;
        playSound('bonus');
        spawnSparks(headX, headY, '#fbbf24', 20);
      } else if (bonusItem.type === 'berry') {
        score += 25;
        playSound('bonus');
        spawnSparks(headX, headY, '#38bdf8', 16);
      }
      bonusItem = null;
      updateHUD();
    } else {
      // Normal slither (remove tail)
      snake.pop();
    }

    // Tick down bonus item timer
    if (bonusItem) {
      bonusItem.timer--;
      if (bonusItem.timer <= 0) {
        bonusItem = null;
      }
    }
  }

  // --- Rendering ---
  function draw() {
    // 1. Clear Arena
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Subtle Pixel Grid Lines
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.04)';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += TILE_SIZE) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }

    // 3. Border indicator if Solid Walls
    if (!isWrapMode) {
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
    } else {
      // Cyan portal boundary glow
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
    }

    // 4. Draw Apple Food
    ctx.save();
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#f87171';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.roundRect(
      food.x * TILE_SIZE + 2,
      food.y * TILE_SIZE + 2,
      TILE_SIZE - 4,
      TILE_SIZE - 4,
      4
    );
    ctx.fill();

    // Apple green leaf
    ctx.fillStyle = '#22c55e';
    ctx.shadowBlur = 0;
    ctx.fillRect(food.x * TILE_SIZE + TILE_SIZE / 2, food.y * TILE_SIZE + 1, 3, 3);
    ctx.restore();

    // 5. Draw Bonus Item
    if (bonusItem) {
      ctx.save();
      const pulse = Math.sin(performance.now() * 0.01) * 2;
      if (bonusItem.type === 'star') {
        ctx.fillStyle = '#fbbf24';
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 12 + pulse;
        ctx.beginPath();
        ctx.arc(
          bonusItem.x * TILE_SIZE + TILE_SIZE / 2,
          bonusItem.y * TILE_SIZE + TILE_SIZE / 2,
          TILE_SIZE / 2.3,
          0,
          Math.PI * 2
        );
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('★', bonusItem.x * TILE_SIZE + TILE_SIZE / 2, bonusItem.y * TILE_SIZE + TILE_SIZE / 2);
      } else {
        // Cyan Berry
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.roundRect(
          bonusItem.x * TILE_SIZE + 3,
          bonusItem.y * TILE_SIZE + 3,
          TILE_SIZE - 6,
          TILE_SIZE - 6,
          4
        );
        ctx.fill();
      }
      ctx.restore();
    }

    // 6. Draw Snake Body
    for (let i = snake.length - 1; i >= 0; i--) {
      const seg = snake[i];
      const isHead = (i === 0);

      ctx.save();
      if (isHead) {
        ctx.fillStyle = '#4ade80';
        ctx.shadowColor = '#22c55e';
        ctx.shadowBlur = 12;
      } else {
        // Body color gradient from bright to deep emerald
        const factor = i / snake.length;
        ctx.fillStyle = (factor < 0.5) ? '#22c55e' : '#15803d';
        ctx.shadowBlur = 0;
      }

      ctx.beginPath();
      ctx.roundRect(
        seg.x * TILE_SIZE + 1,
        seg.y * TILE_SIZE + 1,
        TILE_SIZE - 2,
        TILE_SIZE - 2,
        isHead ? 6 : 3
      );
      ctx.fill();

      // Eyes on Head
      if (isHead) {
        ctx.fillStyle = '#020617';
        ctx.shadowBlur = 0;
        const eyeOffset = 6;
        let eye1X, eye1Y, eye2X, eye2Y;

        if (dir.x === 1) { // Moving Right
          eye1X = seg.x * TILE_SIZE + TILE_SIZE - eyeOffset;
          eye1Y = seg.y * TILE_SIZE + 5;
          eye2X = seg.x * TILE_SIZE + TILE_SIZE - eyeOffset;
          eye2Y = seg.y * TILE_SIZE + TILE_SIZE - 8;
        } else if (dir.x === -1) { // Moving Left
          eye1X = seg.x * TILE_SIZE + 4;
          eye1Y = seg.y * TILE_SIZE + 5;
          eye2X = seg.x * TILE_SIZE + 4;
          eye2Y = seg.y * TILE_SIZE + TILE_SIZE - 8;
        } else if (dir.y === -1) { // Moving Up
          eye1X = seg.x * TILE_SIZE + 5;
          eye1Y = seg.y * TILE_SIZE + 4;
          eye2X = seg.x * TILE_SIZE + TILE_SIZE - 8;
          eye2Y = seg.y * TILE_SIZE + 4;
        } else { // Moving Down
          eye1X = seg.x * TILE_SIZE + 5;
          eye1Y = seg.y * TILE_SIZE + TILE_SIZE - eyeOffset;
          eye2X = seg.x * TILE_SIZE + TILE_SIZE - 8;
          eye2Y = seg.y * TILE_SIZE + TILE_SIZE - eyeOffset;
        }

        ctx.fillRect(eye1X, eye1Y, 3, 3);
        ctx.fillRect(eye2X, eye2Y, 3, 3);
      }

      ctx.restore();
    }

    // 7. Draw Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;

      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }

      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life;
      ctx.fillRect(p.x, p.y, 3, 3);
    }
    ctx.globalAlpha = 1;

    // 8. Visual Paused State Overlay
    if (isPaused) {
      ctx.fillStyle = 'rgba(2, 6, 23, 0.75)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#22c55e';
      ctx.font = '900 32px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowBlur = 16;
      ctx.shadowColor = '#22c55e';
      ctx.fillText('⏸️ GAME PAUSED', canvas.width / 2, canvas.height / 2 - 8);

      ctx.font = '600 15px Outfit, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.shadowBlur = 0;
      ctx.fillText('Press P or click Resume to continue slithering', canvas.width / 2, canvas.height / 2 + 28);
    }
  }

  // --- Main Animation Frame Loop ---
  function loop(now) {
    if (isRunning && !isPaused) {
      const interval = SPEED_TICKS[speedLevel] || 105;
      if (now - lastTickTime >= interval) {
        tick();
        lastTickTime = now;
      }
    }

    draw();
    requestAnimationFrame(loop);
  }

  // --- Steering Helper ---
  function changeDirection(newDir) {
    if (!isRunning || isPaused) return;

    // Prevent immediate 180° reverse suicide
    if (newDir.x === -dir.x && newDir.y === -dir.y) return;

    if (newDir.x !== dir.x || newDir.y !== dir.y) {
      playSound('turn');
    }
    nextDir = newDir;
  }

  // --- Keyboard Event Listeners ---
  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyP') {
      e.preventDefault();
      togglePause();
      return;
    }

    if (e.code === 'Space') {
      if (!isRunning) {
        e.preventDefault();
        startGame();
        return;
      }
    }

    if (e.code === 'ArrowUp' || e.code === 'KeyW') {
      e.preventDefault();
      changeDirection({ x: 0, y: -1 });
    } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
      e.preventDefault();
      changeDirection({ x: 0, y: 1 });
    } else if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
      e.preventDefault();
      changeDirection({ x: -1, y: 0 });
    } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
      e.preventDefault();
      changeDirection({ x: 1, y: 0 });
    }
  });

  // --- Mobile Touch D-Pad Listeners ---
  dpadUp?.addEventListener('pointerdown', (e) => { e.preventDefault(); changeDirection({ x: 0, y: -1 }); });
  dpadDown?.addEventListener('pointerdown', (e) => { e.preventDefault(); changeDirection({ x: 0, y: 1 }); });
  dpadLeft?.addEventListener('pointerdown', (e) => { e.preventDefault(); changeDirection({ x: -1, y: 0 }); });
  dpadRight?.addEventListener('pointerdown', (e) => { e.preventDefault(); changeDirection({ x: 1, y: 0 }); });

  // --- Canvas Touch Swipe Detection ---
  let touchStartX = 0;
  let touchStartY = 0;

  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length > 0) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }
  }, { passive: true });

  canvas.addEventListener('touchend', (e) => {
    if (e.changedTouches.length > 0) {
      const deltaX = e.changedTouches[0].clientX - touchStartX;
      const deltaY = e.changedTouches[0].clientY - touchStartY;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      if (Math.max(absX, absY) > 20) { // Threshold for swipe
        if (absX > absY) {
          // Horizontal swipe
          changeDirection(deltaX > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 });
        } else {
          // Vertical swipe
          changeDirection(deltaY > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 });
        }
      }
    }
  }, { passive: true });

  // --- Toolbar & UI Bindings ---
  startBtn?.addEventListener('click', startGame);
  restartBtn?.addEventListener('click', startGame);
  pauseBtn?.addEventListener('click', togglePause);
  muteBtn?.addEventListener('click', toggleMute);

  wallToggleBtn?.addEventListener('click', () => {
    isWrapMode = !isWrapMode;
    updateHUD();
  });

  speedToggleBtn?.addEventListener('click', () => {
    if (speedLevel === 'normal') speedLevel = 'fast';
    else if (speedLevel === 'fast') speedLevel = 'hyper';
    else speedLevel = 'normal';
    updateHUD();
  });

  // Start animation loop
  requestAnimationFrame(loop);
})();
