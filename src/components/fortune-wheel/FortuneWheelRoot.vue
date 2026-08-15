<template>
  <div class="container fortune-wheel">
    <div class="header_block">
      <div class="header_text">{{ t("fortuneWheel.title") }}</div>
      <div class="header_image"><img class="image" src="@/assets/images/title_line_image.svg" /></div>
    </div>

    <section class="fortune-wheel__content">
      <p class="fortune-wheel__spins">{{ t("fortuneWheel.spins", { count: wheel.spins }) }}</p>

      <div class="wheel-stage">
        <div class="wheel-pointer"></div>
        <div class="wheel" :class="{ 'wheel--spinning': wheel.isSpinning }" :style="wheelStyle">
          <span
            v-for="(sector, index) in sectors"
            :key="sector.id"
            class="wheel__label"
            :style="getLabelStyle(index)"
          >{{ getSectorLabel(sector) }}</span>
          <span class="wheel__hub">✦</span>
        </div>
      </div>

      <p v-if="wheel.error" class="fortune-wheel__error">{{ t("fortuneWheel.error") }}</p>
      <button class="menu_btn fortune-wheel__spin" :disabled="!wheel.canSpin" @click="spin">
        {{ wheel.isSpinning ? t("fortuneWheel.spinning") : t("fortuneWheel.spin") }}
      </button>
    </section>

    <div v-if="wheel.wonSector" class="fortune-wheel__result" role="dialog" aria-modal="true">
      <p>{{ t("fortuneWheel.won") }}</p>
      <strong v-for="(reward, index) in wheel.wonSector.rewards" :key="index">{{ getRewardLabel(reward) }}</strong>
      <button class="menu_btn" @click="wheel.clearWonSector()">{{ t("fortuneWheel.continue") }}</button>
    </div>

    <button class="menu_btn fortune-wheel__back" :disabled="wheel.isSpinning" @click="gameState.closeOverlay()">
      {{ t("mainMenu.goBack") }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref } from "vue";
import { useTranslation } from "i18next-vue";
import { FORTUNE_WHEEL_SECTORS, type FortuneWheelSector } from "@/configs/fortuneWheel";
import { useFortuneWheelStore } from "@/store/fortuneWheelStore";
import { useGameState } from "@/store/gameState";
import type { RewardDefinition } from "@/purchase/types";
import { SoundManager } from "@/game/sound/SoundManager";

const { t } = useTranslation();
const wheel = useFortuneWheelStore();
const gameState = useGameState();
const sectors = FORTUNE_WHEEL_SECTORS;
const sectorAngle = 360 / sectors.length;
const rotation = ref(0);
let spinTimer: ReturnType<typeof setTimeout> | null = null;

const wheelStyle = computed(() => ({
  transform: `rotate(${rotation.value}deg)`,
  background: `conic-gradient(from -90deg, ${sectors.map((sector, index) => `${sector.color} ${index * sectorAngle}deg ${(index + 1) * sectorAngle}deg`).join(", ")})`,
}));

function getLabelStyle(index: number) {
  const angle = (index + 0.5) * sectorAngle;
  return { transform: `rotate(${angle}deg) translateY(-8.6rem) rotate(${-angle}deg)` };
}

function getRewardLabel(reward: RewardDefinition): string {
  const amount = reward.effect?.amount ?? 1;
  switch (reward.type) {
    case "currency": return `${amount} ${t(`currency.${reward.effect.currency}`)}`;
    case "ammo": return `${amount} ${t("dailyGift.ammo")}`;
    case "armor": return `${amount} ${t("dailyGift.armor")}`;
    case "fortune_spin": return `${amount} ${t("fortuneWheel.spinUnit")}`;
    default: return t("dailyGift.reward");
  }
}

function getSectorLabel(sector: FortuneWheelSector) {
  return sector.rewards.map(getRewardLabel).join(" + ");
}

async function spin() {
  const sector = await wheel.beginSpin();
  if (!sector) {
    SoundManager.getInstance().playCue("actionRejected");
    return;
  }

  SoundManager.getInstance().playCue("uiSelect");
  const selectedIndex = sectors.findIndex((item) => item.id === sector.id);
  const targetModulo = -((selectedIndex + 0.5) * sectorAngle);
  const currentModulo = ((rotation.value % 360) + 360) % 360;
  const delta = ((targetModulo - currentModulo) % 360 + 360) % 360;
  rotation.value += 5 * 360 + delta;

  spinTimer = setTimeout(async () => {
    const granted = await wheel.completeSpin();
    SoundManager.getInstance().playCue(granted ? "goldenPickup" : "actionRejected");
  }, 4200);
}

onUnmounted(() => {
  if (spinTimer) clearTimeout(spinTimer);
});
</script>

<style scoped lang="scss">
@use "@/styles/menu.scss";
@use "@/styles/typography" as *;
@use "@/styles/colors" as *;

.fortune-wheel { justify-content: flex-start; }
.fortune-wheel .header_block { position: absolute; top: clamp(3rem, 15vh, 10rem); margin: 0; }
.fortune-wheel__content { position: absolute; top: 50%; display: flex; flex-direction: column; align-items: center; transform: translateY(-50%); }
.fortune-wheel__spins, .fortune-wheel__error { @include text-info-size-s; margin: 0; text-transform: uppercase; }
.fortune-wheel__spins { color: $color-blue-light; }
.fortune-wheel__error { color: $color-red-light; margin-top: 1rem; }

.wheel-stage { position: relative; width: min(54vw, 25rem); aspect-ratio: 1; margin: 1.25rem 0; }
.wheel-pointer { position: absolute; z-index: 2; top: -0.55rem; left: 50%; width: 0; height: 0; border-left: 0.8rem solid transparent; border-right: 0.8rem solid transparent; border-top: 1.45rem solid $color-yellow-super-light; transform: translateX(-50%); }
.wheel { position: absolute; inset: 0; border: 2px solid rgba(215, 251, 255, 0.76); border-radius: 50%; transition: transform 4200ms cubic-bezier(0.12, 0.82, 0.14, 1); }
.wheel__label { position: absolute; top: 50%; left: 50%; width: 5rem; margin-left: -2.5rem; color: $color-yellow-super-light; font-family: $font-secondary; font-size: clamp(0.55rem, 1.25vw, 0.72rem); line-height: 1; text-align: center; pointer-events: none; }
.wheel__hub { position: absolute; top: 50%; left: 50%; display: grid; place-items: center; width: 3.2rem; height: 3.2rem; border: 2px solid $color-yellow-light; border-radius: 50%; background: #172432; color: $color-yellow-super-light; font-size: 1.5rem; transform: translate(-50%, -50%); }
.fortune-wheel__spin, .fortune-wheel__back { @include text-button-size-s; color: $color-yellow-super-light; }
.fortune-wheel__spin:disabled, .fortune-wheel__back:disabled { opacity: 0.42; cursor: default; }
.fortune-wheel__back { position: absolute; bottom: 5.556vh; color: $color-blue-light; }
.fortune-wheel__result { position: absolute; inset: 0; z-index: 3; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; background: rgba(0, 0, 0, 0.68); color: $color-yellow-super-light; }
.fortune-wheel__result p { @include text-button-size-m; margin: 0; }
.fortune-wheel__result strong { @include text-info-size-l; color: $color-blue-light; }
.fortune-wheel__result button { @include text-button-size-s; color: $color-yellow-super-light; }

@media (max-width: 700px) { .wheel-stage { width: min(84vw, 20rem); } .wheel__label { width: 3.8rem; margin-left: -1.9rem; } }
</style>
