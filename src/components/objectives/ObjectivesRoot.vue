<template>
  <div class="container objectives">
    <div class="header_block">
      <div class="header_text">{{ t("objectives.title") }}</div>
      <div class="header_image"><img class="image" src="@/assets/images/title_line_image.svg" /></div>
    </div>

    <section class="objectives__content" aria-live="polite">
      <div class="objectives__tabs" role="tablist">
        <button class="menu_btn objectives__tab" :class="{ active: activeTab === 'daily' }" role="tab"
          :aria-selected="activeTab === 'daily'" @click="activeTab = 'daily'">{{ t("objectives.daily") }}</button>
        <button class="menu_btn objectives__tab" :class="{ active: activeTab === 'achievements' }" role="tab"
          :aria-selected="activeTab === 'achievements'" @click="activeTab = 'achievements'">{{ t("objectives.achievements") }}</button>
      </div>

      <div class="objectives__list">
        <article v-for="objective in currentObjectives" :key="objective.id" class="objective-card"
          :class="{ 'objective-card--complete': isComplete(objective), 'objective-card--claimed': objectives.isClaimed(objective, isDaily) }">
          <div class="objective-card__main">
            <h2>{{ t(`objectives.items.${objective.id}.title`) }}</h2>
            <p>{{ t(`objectives.items.${objective.id}.description`) }}</p>
            <div class="objective-card__progress">
              <span>{{ objectives.getProgress(objective, isDaily) }} / {{ objective.target }}</span>
              <span class="objective-card__track"><i :style="{ width: `${progressPercent(objective)}%` }"></i></span>
            </div>
          </div>
          <div class="objective-card__reward">
            <span>{{ rewardLabel(objective) }}</span>
            <button v-if="objectives.isClaimable(objective, isDaily)" class="menu_btn objective-card__claim"
              :disabled="objectives.isClaiming !== null" @click="claim(objective)">{{ objectives.isClaiming === objective.id ? t("objectives.claiming") : t("objectives.claim") }}</button>
            <span v-else-if="objectives.isClaimed(objective, isDaily)" class="objective-card__check" :aria-label="t('objectives.claimed')">✓</span>
          </div>
        </article>
      </div>
      <p v-if="objectives.error" class="objectives__error">{{ t("objectives.error") }}</p>
    </section>

    <button class="menu_btn objectives__back" @click="gameState.closeOverlay()">{{ t("mainMenu.goBack") }}</button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useTranslation } from "i18next-vue";
import { useGameState } from "@/store/gameState";
import { useObjectivesStore } from "@/store/objectivesStore";
import type { ObjectiveDefinition } from "@/configs/objectives";
import { SoundManager } from "@/game/sound/SoundManager";

const { t } = useTranslation();
const gameState = useGameState();
const objectives = useObjectivesStore();
const activeTab = ref(gameState.objectivesSection ?? "daily");
const isDaily = computed(() => activeTab.value === "daily");
const currentObjectives = computed(() => isDaily.value ? objectives.dailyObjectives : objectives.achievements);

function progressPercent(objective: ObjectiveDefinition) {
  return Math.round((objectives.getProgress(objective, isDaily.value) / objective.target) * 100);
}

function isComplete(objective: ObjectiveDefinition) {
  return objectives.getProgress(objective, isDaily.value) >= objective.target;
}

function rewardLabel(objective: ObjectiveDefinition) {
  return objective.reward.map((reward) => {
    const amount = reward.effect?.amount ?? 1;
    if (reward.type === "currency") return `+${amount} ${t(`currency.${reward.effect.currency}`)}`;
    if (reward.type === "fortune_spin") return `+${amount} ${t("fortuneWheel.spinUnit")}`;
    if (reward.type === "ammo") return `+${amount} ${t("dailyGift.ammo")}`;
    if (reward.type === "armor") return `+${amount} ${t("dailyGift.armor")}`;
    return t("dailyGift.reward");
  }).join(" · ");
}

async function claim(objective: ObjectiveDefinition) {
  const claimed = await objectives.claim(objective, isDaily.value);
  SoundManager.getInstance().playCue(claimed ? "goldenPickup" : "actionRejected");
}
</script>

<style scoped lang="scss">
@use "@/styles/menu.scss";
@use "@/styles/typography" as *;
@use "@/styles/colors" as *;

.objectives { justify-content: flex-start; }
.objectives .header_block { position: absolute; top: clamp(3rem, 15vh, 10rem); margin: 0; }
.objectives__content { position: absolute; top: 50%; width: min(43rem, 90vw); max-height: min(54vh, 30rem); transform: translateY(-45%); }
.objectives__tabs { display: flex; justify-content: center; gap: clamp(1rem, 5vw, 3.5rem); margin-bottom: 1rem; }
.objectives__tab, .objectives__back { @include text-button-size-s; color: $color-blue-light; }
.objectives__tab.active { color: $color-yellow-super-light; text-decoration: underline; text-underline-offset: 0.35rem; }
.objectives__list { display: flex; flex-direction: column; gap: 0.7rem; overflow-y: auto; max-height: min(45vh, 25rem); padding: 0.25rem 0.5rem; }
.objective-card { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 0.85rem 1rem; border: 1px solid rgba(185, 226, 255, 0.38); background: rgba(10, 22, 35, 0.46); }
.objective-card--complete { border-color: rgba(255, 224, 109, 0.8); }
.objective-card--claimed { border-color: rgba(101, 225, 146, 0.72); background: rgba(46, 122, 77, 0.18); }
.objective-card__main { min-width: 0; flex: 1; }
.objective-card h2 { @include text-info-size-m; margin: 0; color: $color-yellow-super-light; text-transform: uppercase; }
.objective-card p, .objective-card__progress, .objective-card__reward { @include text-info-size-s; }
.objective-card p { margin: 0.2rem 0 0.5rem; color: $color-blue-light; }
.objective-card__progress { display: flex; align-items: center; gap: 0.65rem; color: $color-yellow-light; }
.objective-card__track { display: block; width: min(12rem, 24vw); height: 0.28rem; overflow: hidden; background: rgba(185, 226, 255, 0.22); }
.objective-card__track i { display: block; height: 100%; background: $color-yellow; transition: width 180ms ease-out; }
.objective-card__reward { display: flex; flex-direction: column; align-items: flex-end; gap: 0.5rem; color: $color-yellow-super-light; text-align: right; white-space: nowrap; }
.objective-card__claim { @include text-button-size-s; color: $color-yellow-super-light; }
.objective-card__claim:disabled { opacity: 0.45; }
.objective-card__check { display: grid; place-items: center; width: 1.7rem; height: 1.7rem; border: 2px solid #65e192; border-radius: 50%; color: #65e192; font-weight: 700; }
.objectives__error { @include text-info-size-s; margin: 0.8rem 0 0; color: $color-red-light; text-align: center; }
.objectives__back { position: absolute; bottom: 5.556vh; }

@media (max-width: 700px) {
  .objectives__content { width: 94vw; max-height: 60vh; transform: translateY(-42%); }
  .objective-card { align-items: flex-start; padding: 0.7rem; }
  .objective-card__reward { font-size: 0.72rem; }
  .objective-card__track { width: 7rem; }
}
</style>
