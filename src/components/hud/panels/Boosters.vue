<template>
  <!-- NITRO (TETRIS STYLE) -->
  <div class="panels">
    <div class="panel nitro" v-if="isNitroActive">
      <div class="header">
        <span>НИТРО</span>
        <span :class="{ active: isNitroActive }">{{ isNitroActive ? "ACTIVE" : "INACTIVE" }}</span>
      </div>

      <div class="bar-bg">
        <div class="bar">
          <div class="bar-block nitro-bar" :class="{ active: n <= activeNitroBlocks }" v-for="n in BLOCKS_TOTAL"
            :key="n" :style="{ animationDelay: `${(n - 1) * 30}ms` }">
          </div>
        </div>
      </div>
    </div>

    <div class="panel shield" v-if="isShieldActive">
      <div class="header">
        <span>БРОНЯ</span>
        <span :class="{ active: isShieldActive }">{{ isShieldActive ? "ACTIVE" : "INACTIVE" }}</span>
      </div>

      <div class="bar-bg">
        <div class="bar">
          <div class="bar-block shield-bar active" v-for="n in BLOCKS_TOTAL" :key="n"
            :style="{ animationDelay: `${(n - 1) * 30}ms` }">
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { usePlayerStore } from "@/store/playerStore";

const BLOCKS_TOTAL = 10;

const playerStore = usePlayerStore();

const isNitroActive = computed(() => playerStore.isNitroEnabled);
const isShieldActive = computed(() => playerStore.isShieldEnabled);

const activeNitroBlocks = computed(() => {
  if (!playerStore.isNitroEnabled || playerStore.nitroTimer <= 0) return 0;
  const ratio = playerStore.nitroTimer / playerStore.BASE_NITRO_TIMER;
  return Math.ceil(ratio * BLOCKS_TOTAL);
});

</script>

<style scoped>
/* === COMMON PANEL STYLE === */
.panels {
  position: absolute;
  top: 60px;
  left: 50%;
}

.panel {
  background: rgba(0, 0, 0, 0.8);
  padding: 12px 16px;
  border: 2px solid #00ffff;
  border-radius: 4px;
  box-shadow: 0 0 8px rgba(0, 255, 255, 0.3);
  color: #00ffff;
}


.header {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  margin-bottom: 4px;
  color: #fff;

  &.active {
    font-weight: bold;
    color: #44ff44;
  }
}

.bar-bg {
  width: 100%;
  height: 14px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  position: relative;
  overflow: hidden;
}

.bar {
  width: 100%;
  height: 100%;
  display: flex;
}

.bar-block {
  width: 20%;
  height: 100%;
  transform: translateY(-20px);
  opacity: 0;
  animation: fall 0.25s forwards;
}




/* === NITRO PANEL === */
.nitro {

  transform: translateX(-50%);
  width: 280px;
  border: 2px solid #ff4444;
  border-radius: 4px;
  padding: 8px;
  background: rgba(0, 0, 0, 0.7);
}

.nitro-bar.active {
  background: linear-gradient(90deg, #ff4444, #ff8844);
}

.shield {

  transform: translateX(-50%);
  width: 280px;
  border: 2px solid #dcdcdc;
  border-radius: 4px;
  padding: 8px;
  background: rgba(0, 0, 0, 0.7);
}

.shield-bar.active {
  background: linear-gradient(90deg, #e8e8e8, #dcdcdc);
}


/* === ANIMATIONS === */
@keyframes fall {
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>