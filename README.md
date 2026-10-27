# 🐍 Pixel Snake Classic

A retro 8-bit arcade snake web game built with pure vanilla JavaScript, HTML5 Canvas, and the Web Audio API. Slither through a nostalgic pixel grid, munch glowing apples, dodge hazards, chain speed multipliers, and beat your personal best.

Part of the [Gamility](https://mahesh-yennam.github.io/Gamility/) web games collection. Fully configured to run as an **independent standalone repository** or embedded directly within the Gamility portal.

---

## 📁 Repository Structure

```text
pixel-snake-classic/
├── index.html        # Game layout, canvas grid arena, mobile D-pad, Schema.org JSON-LD
├── style.css         # Retro CRT scanline aesthetics, glowing neon pixels, touch controls
├── game.js           # 60FPS grid engine, wrap-around / solid walls, Web Audio SFX
├── favicon.svg       # Dedicated 8-bit snake and apple vector SVG favicon
├── site.webmanifest  # Progressive Web App (PWA) manifest for mobile install
├── robots.txt        # Search engine crawler configuration
├── sitemap.xml       # Standalone XML sitemap
├── .gitignore        # Standard web gitignore
└── README.md         # Documentation & deployment guide
```

---

## 🎮 How to Play

- **Objective:** Guide your hungry pixel serpent around the grid. Eat red apples to grow longer and score points. Avoid crashing into your own tail (and the perimeter walls in Solid Border mode).
- **Desktop Controls:**
  - `Arrow Keys` or `WASD`: Steer Snake (Up, Down, Left, Right)
  - `Spacebar`: Start / Restart Game
  - `P`: Pause / Resume
- **Mobile Controls:**
  - On-Screen **D-Pad** (`▲`, `▼`, `◀`, `▶`)
  - Swipe gestures directly across the game canvas (Swipe Up, Down, Left, Right)
- **Game Modes & Settings:**
  - **Border Mode:**
    - **Solid Walls:** Crashing into the outer boundary triggers a game over (Classic Arcade rule).
    - **Wrap-Around:** Teleports through edges to the opposite side (Nokia Retro rule).
  - **Speed Levels:** Normal, Fast, and Hyper Speed.

---

## 🍎 Food Types & Power-Ups

| Food | Appearance | Points | Effect |
| :--- | :---: | :---: | :--- |
| **Pixel Apple** | Red Apple 🍎 | +10 Pts | Grows snake length by +1 segment. |
| **Golden Star** | Flashing Gold ⭐ | +50 Pts | Rare bonus food. Disappears after 8 seconds! |
| **Speed Berry** | Cyan Berry 🫐 | +25 Pts | Temporarily boosts slither velocity and multiplier. |

---

## ✨ Features

- **Pure Vanilla Web Tech:** Zero external dependencies or heavy libraries. Fast, responsive, and lightweight.
- **Synthesized Web Audio SFX:** 8-bit retro chiptune chomp, bonus jingle, wall thud, crash impact, and game over sounds generated dynamically with HTML5 `AudioContext`.
- **Dual Border Modes:** Switch between classic wall-collision danger or peaceful wrap-around portals anytime.
- **Persistent High Scores:** Personal best score and longest snake length saved automatically via browser `localStorage`.
- **Responsive Mobile Touch:** On-screen ergonomic D-pad and high-precision swipe detection for mobile screens.

---

## 📄 Copyright & Terms

Copyright © 2026 Gamility. All rights reserved.  
This repository and its source code are proprietary. Unauthorized copying, distribution, or commercial reuse without explicit permission is strictly prohibited.
