<template>
  <div id="game-hud" ref="container">
    <div class="score-panel">
      <div class="label">SCORE</div>
      <div class="value">{{ Math.floor(gameState.score) }}</div>
      <div class="best">BEST <span>{{ Math.floor(gameState.highScore) }}</span></div>
    </div>

    <div class="speed-panel">
      <div class="label">SPEED</div>
      <div class="value">{{ (gameState.getCurrentSpeed() * 100).toFixed(1) }}</div>
      <div class="unit">KM/H</div>
    </div>

    <div class="nitro-container">
      <div class="nitro-header">
        <span>NITRO</span>
        <span :class="{active: gameState.isNitroEnabled}">{{ gameState.isNitroEnabled ? 'ACTIVE' : 'INACTIVE' }}</span>
      </div>
      <div class="nitro-bar-bg">
        <div class="nitro-bar" :style="{ width: gameState.isNitroEnabled ? '100%' : '0%' }"></div>
      </div>
    </div>

    <div class="lane-indicator">
      <div
        v-for="i in laneCount"
        :key="i"
        :class="['lane-dot', { active: gameState.currentLane === i-1 }]"
      ></div>
    </div>

    <div class="warning-message" :style="warningStyle">
      ⚠️ DANGER ⚠️
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useGameState } from "../store/gameState";

const gameState = useGameState();

const laneCount = computed(() => {
  try {
    return gameState.getLanesCount?.() ?? 4;
  } catch {
    return 4;
  }
});

const warningStyle = computed(() => {
  const dangerLevel = gameState.getDangerLevel?.() ?? 0;
  if (dangerLevel > 0) {
    const intensity = Math.floor(255 * dangerLevel);
    return {
      opacity: Math.min(dangerLevel, 1),
      color: `rgb(255, ${255 - intensity}, ${255 - intensity})`,
      textShadow: `0 0 ${20 * dangerLevel}px rgba(255,0,0,${dangerLevel})`,
      transform:
        dangerLevel > 0.7
          ? `translate(-50%, -50%) scale(${1 + Math.sin(Date.now() * 0.01) * 0.1})`
          : "translate(-50%, -50%) scale(1)",
    };
  }
  return { opacity: 0 };
});
</script>

<style scoped>
#game-hud {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  font-family: 'Segoe UI', Arial, sans-serif;
  z-index: 5;
}

/* Счёт */
.score-panel {
  position: absolute;
  top: 20px;
  left: 20px;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(5px);
  border-radius: 15px;
  padding: 15px 25px;
  color: white;
  border-left: 4px solid #ffd700;
  box-shadow: 0 4px 15px rgba(0,0,0,0.3);
}

.score-panel .label {
  font-size: 14px;
  opacity: 0.7;
  letter-spacing: 2px;
}

.score-panel .value {
  font-size: 36px;
  font-weight: bold;
  color: #ffd700;
  text-shadow: 0 0 10px rgba(255,215,0,0.3);
}

.score-panel .best {
  font-size: 12px;
  opacity: 0.5;
  margin-top: 5px;
}

/* Спидометр */
.speed-panel {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(5px);
  border-radius: 15px;
  padding: 15px 25px;
  color: white;
  border-right: 4px solid #00ffff;
  box-shadow: 0 4px 15px rgba(0,0,0,0.3);
  text-align: right;
}

.speed-panel .label {
  font-size: 14px;
  opacity: 0.7;
  letter-spacing: 2px;
}

.speed-panel .value {
  font-size: 36px;
  font-weight: bold;
  color: #00ffff;
  text-shadow: 0 0 10px rgba(0,255,255,0.3);
}

.speed-panel .unit {
  font-size: 12px;
  opacity: 0.5;
}

/* Нитро */
.nitro-container {
  position: absolute;
  top: 30px;
  left: 50%;
  transform: translateX(-50%);
  width: 300px;
  background: rgba(0,0,0,0.5);
  backdrop-filter: blur(5px);
  border-radius: 50px;
  padding: 10px 15px;
  border: 1px solid rgba(255,255,255,0.1);
  box-shadow: 0 4px 15px rgba(0,0,0,0.3);
}

.nitro-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
  color: white;
  font-size: 12px;
  opacity: 0.7;
}

.nitro-header .active {
  font-weight: bold;
  color: #44ff44;
}

.nitro-bar-bg {
  width: 100%;
  height: 20px;
  background: rgba(255,255,255,0.1);
  border-radius: 10px;
  overflow: hidden;
}

.nitro-bar {
  height: 100%;
  background: linear-gradient(90deg, #ff4444, #ff8844);
  border-radius: 10px;
  transition: width 0.2s ease;
}

/* Полосы */
.lane-indicator {
  position: absolute;
  bottom: 30px;
  left: 30px;
  display: flex;
  gap: 10px;
  background: rgba(0,0,0,0.5);
  backdrop-filter: blur(5px);
  padding: 10px;
  border-radius: 50px;
  border: 1px solid rgba(255,255,255,0.1);
}

.lane-dot {
  width: 15px;
  height: 15px;
  border-radius: 50%;
  background: rgba(255,255,255,0.3);
  border: 2px solid rgba(255,255,255,0.5);
  transition: all 0.2s ease;
}

.lane-dot.active {
  background: #00ffff;
  box-shadow: 0 0 15px #00ffff;
  transform: scale(1.2);
}

/* Предупреждение */
.warning-message {
  position: absolute;
  top: 50%;
  left: 50%;
  font-size: 48px;
  font-weight: bold;
  text-shadow: 0 0 20px rgba(255,0,0,0.5);
  pointer-events: none;
  z-index: 10;
  transform: translate(-50%, -50%);
}
</style>