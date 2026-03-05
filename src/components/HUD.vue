<template>
  <div id="game-hud">

    <!-- SCORE -->
    <div class="panel panel-left">
      <div class="label">SCORE</div>
      <div class="value gold">{{ score }}</div>
      <div class="sub">BEST <span>{{ bestScore }}</span></div>
    </div>

    <!-- SPEED (TETRIS BLOCKS ANIMATION) -->
    <div class="panel panel-right speed-panel-tetris">
      <div class="speed-label">SPEED</div>

      <div class="speed-blocks">
        <div v-for="n in maxBlocks" :key="n" class="speed-block" :class="{ active: n <= activeBlocks }"
          :style="{ animationDelay: `${(n - 1) * 50}ms` }">
        </div>
      </div>

      <div class="speed-value">{{ speedKMH }} KM/H</div>
    </div>

    <!-- NITRO (TETRIS STYLE) -->
    <div class="panel nitro" v-if="isNitroActive">
      <div class="nitro-header">
        <span>NITRO</span>
        <span :class="{ active: isNitroActive }">{{ isNitroActive ? "ACTIVE" : "INACTIVE" }}</span>
      </div>

      <div class="nitro-bar-bg">
        <div class="nitro-bar">
          <div class="nitro-block" v-for="n in nitroBlocks" :key="n" :style="{ animationDelay: `${(n - 1) * 30}ms` }">
          </div>
        </div>
      </div>
    </div>

    <!-- LANES -->
    <div class="panel lane-indicator">
      <div v-for="i in laneCount" :key="i" class="lane-dot" :class="{ active: currentLane === i - 1 }" />
    </div>

    <!-- WARNING -->
    <div class="warning-message" :style="warningStyle">
      ⚠ DANGER ⚠
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useGameState } from "../store/gameState";

const gameState = useGameState();

const score = computed(() => Math.floor(gameState.score));
const bestScore = computed(() => Math.floor(gameState.highScore));

const speedKMH = computed(() => Math.floor(gameState.getCurrentSpeed() * 100));

const maxBlocks = 10;
const activeBlocks = computed(() => {
  const speed = gameState.getCurrentSpeed();
  const maxSpeed = gameState.maxSpeed ?? 1;
  const blocks = Math.floor(speed / maxSpeed * maxBlocks);
  return Math.min(blocks, maxBlocks);
});

const currentLane = computed(() => gameState.currentLane);
const laneCount = computed(() => gameState.getLanesCount?.() ?? 4);

const isNitroActive = computed(() => gameState.isNitroEnabled);
const nitroBlocks = computed(() => isNitroActive ? 10 : 0); // 10 блоков максимум
// const nitroWidth = computed(() => (isNitroActive.value ? "100%" : "0%"));

const warningStyle = computed(() => {
  const danger = gameState.getDangerLevel?.() ?? 0;
  if (!danger) return { opacity: 0 };

  const intensity = Math.floor(255 * danger);
  return {
    opacity: Math.min(danger, 1),
    color: `rgb(255, ${255 - intensity}, ${255 - intensity})`,
    textShadow: `0 0 ${20 * danger}px rgba(255,0,0,${danger})`,
  };
});
</script>

<style scoped>
#game-hud {
  position: absolute;
  inset: 0;
  pointer-events: none;
  font-family: monospace;
  z-index: 5;
}

/* === COMMON PANEL STYLE === */
.panel {
  position: absolute;
  background: rgba(0, 0, 0, 0.8);
  padding: 12px 16px;
  border: 2px solid #00ffff;
  border-radius: 4px;
  box-shadow: 0 0 8px rgba(0, 255, 255, 0.3);
  color: #00ffff;
}

/* === SCORE PANEL === */
.panel-left {
  top: 20px;
  left: 20px;
}

.label {
  font-size: 12px;
  opacity: 0.7;
  letter-spacing: 1px;
}

.value {
  font-size: 24px;
  font-weight: bold;
}

.value.gold {
  color: #ffd700;
  text-shadow: 0 0 4px #ffd700;
}

.sub {
  font-size: 10px;
  opacity: 0.5;
}

/* === SPEED PANEL === */
.panel-right {
  top: 20px;
  right: 20px;
}

.speed-panel-tetris {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.speed-label {
  font-size: 12px;
  letter-spacing: 1px;
  margin-bottom: 5px;
}

.speed-blocks {
  display: flex;
  gap: 2px;
  margin-bottom: 4px;
}

.speed-block {
  width: 16px;
  height: 16px;
  background: rgba(0, 255, 255, 0.2);
  border: 2px solid rgba(0, 255, 255, 0.4);
  transform: translateY(-20px);
  opacity: 0;
  animation: fall 0.3s forwards;
}

.speed-block.active {
  background: #00ffff;
  box-shadow: 0 0 3px #00ffff;
}

.speed-value {
  font-size: 14px;
  font-weight: bold;
  letter-spacing: 1px;
}

/* === NITRO PANEL === */
.nitro {
  top: 60px;
  left: 50%;
  transform: translateX(-50%);
  width: 280px;
  border: 2px solid #ff4444;
  border-radius: 4px;
  padding: 8px;
  background: rgba(0, 0, 0, 0.7);
}

.nitro-header {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  margin-bottom: 4px;
  color: #fff;
}

.nitro-header .active {
  font-weight: bold;
  color: #44ff44;
}

.nitro-bar-bg {
  width: 100%;
  height: 14px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  position: relative;
  overflow: hidden;
}

.nitro-bar {
  width: 100%;
  height: 100%;
  display: flex;
}

.nitro-block {
  width: 20%;
  height: 100%;
  background: linear-gradient(90deg, #ff4444, #ff8844);
  transform: translateY(-20px);
  opacity: 0;
  animation: fall 0.25s forwards;
}

/* === LANES === */
.lane-indicator {
  bottom: 30px;
  left: 20px;
  display: flex;
  gap: 6px;
  padding: 6px;
  border: 2px solid #00ffff;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.7);
}

.lane-dot {
  width: 16px;
  height: 16px;
  background: rgba(0, 255, 255, 0.2);
  border: 2px solid rgba(0, 255, 255, 0.5);
  transition: .2s;
}

.lane-dot.active {
  background: #00ffff;
  box-shadow: 0 0 5px #00ffff;
  transform: scale(1.2);
}

/* === WARNING === */
.warning-message {
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 36px;
  font-weight: bold;
  text-shadow: 0 0 10px red;
  pointer-events: none;
}

/* === ANIMATIONS === */
@keyframes fall {
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>