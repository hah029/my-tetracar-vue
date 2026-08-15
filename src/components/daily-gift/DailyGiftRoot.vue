<template>
  <div class="container daily-gift">
    <div class="header_block">
      <div class="header_text">{{ t("dailyGift.title") }} | {{ t("dailyGift.cycle", {
        cycle:
          dailyGift.status.cycleNumber
      }) }}</div>
      <div class="header_image"><img class="image" src="@/assets/images/title_line_image.svg" /></div>
    </div>

    <section class="daily-gift__content" aria-live="polite">
      <!-- <p class="daily-gift__cycle">{{ t("dailyGift.cycle", { cycle: dailyGift.status.cycleNumber }) }}</p> -->

      <div ref="ribbon" class="ribbon" :class="{ 'is-dragging': isDragging }" aria-label="Daily rewards calendar"
        @scroll.passive="updateFocusedDay" @mousedown.prevent="startDrag">
        <article v-for="(day, index) in days" :key="day" :ref="(element) => setCardRef(element, index)"
          class="ribbon__card" :class="getDayClass(day)" :style="getCardStyle(day)"
          :aria-current="day === selectedDay ? 'true' : undefined" role="button" tabindex="0" @click="onCardClick(day)"
          @keydown.enter="selectDay(day)">
          <span class="ribbon__day">{{ t("dailyGift.day", { day }) }}</span>
          <span v-for="(reward, rewardIndex) in getRewards(day)" :key="rewardIndex" class="ribbon__reward">
            {{ getRewardLabel(reward) }}
          </span>
          <span v-if="getDayClass(day).claimed" class="ribbon__status ribbon__status--claimed"
            :aria-label="t('dailyGift.done')">✓</span>
          <span v-else-if="day === currentDay" class="ribbon__status">{{ t("dailyGift.today") }}</span>
        </article>
      </div>

      <div class="ribbon__dots" aria-label="Select day">
        <button v-for="day in days" :key="day" class="ribbon__dot"
          :class="{ active: day === selectedDay, claimed: getDayClass(day).claimed }"
          :aria-label="t('dailyGift.day', { day })" @click="selectDay(day)">●</button>
      </div>

      <p v-if="dailyGift.error" class="daily-gift__error">{{ t("dailyGift.claimError") }}</p>
      <button v-if="dailyGift.status.canClaim" class="menu_btn daily-gift__claim"
        :disabled="dailyGift.isClaiming || selectedDay !== currentDay" @click="claim">{{ dailyGift.isClaiming ?
          t("dailyGift.claiming") : t("dailyGift.claim") }}</button>
      <p v-else class="daily-gift__claimed">{{ t("dailyGift.claimed") }}</p>
    </section>

    <button class="menu_btn daily-gift__back" @click="gameState.closeOverlay()">{{ t("mainMenu.goBack") }}</button>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { useTranslation } from "i18next-vue";
import { DAILY_GIFT_CYCLE_LENGTH, getDailyGiftRewards } from "@/configs/dailyGift";
import { useDailyGiftStore } from "@/store/dailyGiftStore";
import { useGameState } from "@/store/gameState";
import type { RewardDefinition } from "@/purchase/types";

const { t } = useTranslation();
const dailyGift = useDailyGiftStore();
const gameState = useGameState();
const days = Array.from({ length: DAILY_GIFT_CYCLE_LENGTH }, (_, index) => index + 1);
const currentDay = computed(() => dailyGift.status.day);
const selectedDay = ref(currentDay.value);
const ribbon = ref<HTMLElement | null>(null);
const cardRefs = ref<(HTMLElement | null)[]>([]);
const isDragging = ref(false);
const DRAG_SENSITIVITY = 60;
let refreshTimer: ReturnType<typeof setInterval> | null = null;
let scrollFrame: number | null = null;
let inertiaFrame: number | null = null;
let lastDragX = 0;
let lastDragTime = 0;
let dragVelocity = 0;
let skipCardClick = false;

watch(currentDay, (day) => selectDay(day));

function setCardRef(element: Element | null, index: number) {
  cardRefs.value[index] = element instanceof HTMLElement ? element : null;
}

function getDayClass(day: number) {
  const { canClaim, day: availableDay } = dailyGift.status;
  return {
    active: day === selectedDay.value,
    available: canClaim && day === availableDay,
    claimed: day < availableDay || (!canClaim && day === availableDay),
  };
}

function getCardStyle(day: number) {
  const distance = Math.abs(day - selectedDay.value);
  return {
    opacity: String(Math.max(0.1, 1 - distance * 0.4)),
    transform: `scale(${Math.max(0.68, 1.3 - distance * 0.3)})`,
  };
}

function getRewards(day: number) {
  return getDailyGiftRewards(day, dailyGift.status.cycleNumber);
}

function getRewardLabel(reward: RewardDefinition): string {
  const amount = reward.effect?.amount ?? 1;
  switch (reward.type) {
    case "currency": return `${amount} ${t(`currency.${reward.effect.currency}`)}`;
    case "ammo": return `${amount} ${t("dailyGift.ammo")}`;
    case "armor": return `${amount} ${t("dailyGift.armor")}`;
    case "cosmetic": return t("dailyGift.skin");
    default: return t("dailyGift.reward");
  }
}

function selectDay(day: number) {
  if (day < 1 || day > DAILY_GIFT_CYCLE_LENGTH) return;
  selectedDay.value = day;
  nextTick(() => {
    cardRefs.value[day - 1]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  });
}

function handleKeydown(event: KeyboardEvent) {
  const key = event.key.toLowerCase();
  if (key === "arrowleft" || key === "a") {
    event.preventDefault();
    selectDay(selectedDay.value - 1);
  }
  if (key === "arrowright" || key === "d") {
    event.preventDefault();
    selectDay(selectedDay.value + 1);
  }
}

function onCardClick(day: number) {
  if (skipCardClick) {
    skipCardClick = false;
    return;
  }
  selectDay(day);
}

function startDrag(event: MouseEvent) {
  if (event.button !== 0) return;
  const viewport = ribbon.value;
  if (!viewport) return;

  if (inertiaFrame !== null) {
    cancelAnimationFrame(inertiaFrame);
    inertiaFrame = null;
  }

  isDragging.value = true;
  lastDragX = event.clientX;
  lastDragTime = performance.now();
  dragVelocity = 0;
  window.addEventListener("mousemove", drag);
  window.addEventListener("mouseup", finishDrag, { once: true });
}

function drag(event: MouseEvent) {
  if (!isDragging.value || !ribbon.value) return;

  const now = performance.now();
  const deltaX = event.clientX - lastDragX;
  const elapsed = Math.max(1, now - lastDragTime);
  if (Math.abs(deltaX) > 1) skipCardClick = true;

  const scrollDelta = deltaX * DRAG_SENSITIVITY;
  ribbon.value.scrollLeft -= scrollDelta;
  // Inertia is based on actual hand speed, not the amplified scroll distance.
  dragVelocity = deltaX / elapsed;
  lastDragX = event.clientX;
  lastDragTime = now;
  event.preventDefault();
}

function finishDrag() {
  if (!isDragging.value) return;
  isDragging.value = false;
  window.removeEventListener("mousemove", drag);
  startInertia();
}

function startInertia() {
  const viewport = ribbon.value;
  if (!viewport || Math.abs(dragVelocity) < 0.05) {
    snapToNearestDay();
    return;
  }

  let velocity = dragVelocity * DRAG_SENSITIVITY;
  const animate = () => {
    if (!ribbon.value || Math.abs(velocity) < 0.1) {
      inertiaFrame = null;
      snapToNearestDay();
      return;
    }
    ribbon.value.scrollLeft -= velocity;
    velocity *= 0.96;
    inertiaFrame = requestAnimationFrame(animate);
  };
  inertiaFrame = requestAnimationFrame(animate);
}

function getNearestDay(): number {
  const viewport = ribbon.value;
  if (!viewport) return selectedDay.value;

  const center = viewport.getBoundingClientRect().left + viewport.clientWidth / 2;
  let nearestDay = selectedDay.value;
  let nearestDistance = Number.POSITIVE_INFINITY;
  cardRefs.value.forEach((card, index) => {
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const distance = Math.abs(rect.left + rect.width / 2 - center);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestDay = index + 1;
    }
  });
  return nearestDay;
}

function snapToNearestDay() {
  selectDay(getNearestDay());
}

function updateFocusedDay() {
  if (scrollFrame !== null) return;
  scrollFrame = requestAnimationFrame(() => {
    if (!ribbon.value) {
      scrollFrame = null;
      return;
    }
    selectedDay.value = getNearestDay();
    scrollFrame = null;
  });
}

async function claim() {
  await dailyGift.claim();
}

onMounted(async () => {
  await nextTick();
  selectDay(currentDay.value);
  refreshTimer = setInterval(() => dailyGift.refreshStatus(), 60_000);
  window.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer);
  if (scrollFrame !== null) cancelAnimationFrame(scrollFrame);
  if (inertiaFrame !== null) cancelAnimationFrame(inertiaFrame);
  window.removeEventListener("mousemove", drag);
  window.removeEventListener("keydown", handleKeydown);
});
</script>

<style scoped lang="scss">
@use "@/styles/menu.scss";
@use "@/styles/typography" as *;
@use "@/styles/colors" as *;

.daily-gift {
  justify-content: flex-start;
}

.daily-gift .header_block {
  position: absolute;
  top: clamp(3rem, 15vh, 10rem);
  margin: 0;
}

.daily-gift__content {
  position: absolute;
  top: 50%;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  transform: translateY(-50%);
}

.daily-gift__cycle,
.daily-gift__claimed,
.daily-gift__error,
.ribbon__status {
  @include text-info-size-s;
  margin: 0;
  text-transform: uppercase;
}

.daily-gift__cycle,
.ribbon__status {
  color: $color-blue-light;
}

.daily-gift__error {
  color: $color-red-light;
  margin-top: 1rem;
}

.daily-gift__claimed {
  color: $color-blue-light;
  margin-top: 1.8rem;
}

.ribbon {
  --card-width: clamp(8.5rem, 15vw, 12rem);
  width: min(70rem, 100%);
  display: flex;
  gap: clamp(0.45rem, 1vw, 0.85rem);
  box-sizing: border-box;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  padding: 1.8rem calc((100% - var(--card-width)) / 2);
  scrollbar-width: none;
  touch-action: pan-y;
  cursor: grab;
}

.ribbon::-webkit-scrollbar {
  display: none;
}

.ribbon.is-dragging {
  cursor: grabbing;
  scroll-snap-type: none;
  user-select: none;
}

.ribbon__card {
  position: relative;
  flex: 0 0 var(--card-width);
  min-height: 9.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  box-sizing: border-box;
  padding: 0.75rem;
  border: 1px solid rgba(215, 251, 255, 0.2);
  background: rgba(4, 11, 21, 0.2);
  color: $color-gray;
  cursor: pointer;
  scroll-snap-align: center;
  transform-origin: center;
  transition: transform 180ms ease-out, opacity 180ms ease-out, border-color 180ms ease-out;
  z-index: 1;
}

.ribbon__card.active {
  // border-color: rgba(255, 245, 173, 0.68);
  background: rgb(29, 38, 51);
  z-index: 2;

}

.ribbon__card.claimed {
  border: 2px solid rgba(114, 179, 238, 0.74);
  background-color: rgb(53, 84, 113);
  background-image: radial-gradient(rgba(215, 251, 255, 0.33) 1px, transparent 1.25px);
  background-size: 0.62rem 0.62rem;
}

.ribbon__card.claimed.active {
  border-color: $color-blue-light;
}

.ribbon__card.available .ribbon__day {
  color: $color-yellow-super-light;
}

.ribbon__card.claimed .ribbon__day {
  color: $color-blue-light;
}

.ribbon__day {
  @include text-button-size-s;
}

.ribbon__reward {
  @include text-info-size-s;
  color: $color-yellow-light;
  text-align: center;
}

.ribbon__status--claimed {
  position: absolute;
  top: 0.45rem;
  right: 0.55rem;
  color: $color-green-light;
  font-weight: 700;
  font-size: 1.35em;
}

.ribbon__dots {
  display: flex;
  justify-content: center;
  gap: 0.55rem;
}

.ribbon__dot {
  padding: 0;
  border: 0;
  background: transparent;
  color: $color-gray;
  cursor: pointer;
  font-size: 0.62rem;
}

.ribbon__dot.claimed {
  color: $color-blue-light;
}

.ribbon__dot.active {
  color: $color-yellow-super-light;
  transform: scale(1.45);
}

.daily-gift__claim,
.daily-gift__back {
  @include text-button-size-s;
  color: $color-yellow-super-light;
}

.daily-gift__claim {
  margin-top: 1.8rem;
}

.daily-gift__back {
  position: absolute;
  bottom: 5.556vh;
  color: $color-blue-light;
}

.daily-gift__claim:disabled {
  opacity: 0.45;
  cursor: default;
}

@media (max-width: 700px) {
  .ribbon {
    --card-width: clamp(7.5rem, 46vw, 10rem);
  }

  .ribbon__card {
    min-height: 8rem;
  }
}
</style>
