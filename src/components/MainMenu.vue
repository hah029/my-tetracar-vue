<template>
    <div class="container">
        <!-- MAIN MENU -->
        <TransitionGroup name="buttons_group_showing" tag="div" class="buttons_group group_correction">
            <button v-for="(btn, index) in menuButtons" v-if="isMainMenuEnabled" key="btn.id"
                class="menu_btn btn_correction" :style="{ animationDelay: `${index * 0.1}s` }" @click="btn.action">
                {{ btn.text }}
            </button>
        </TransitionGroup>

        <!-- META MECHANICS -->
        <Transition name="buttons_group_showing">
            <aside v-if="isMainMenuEnabled" class="meta_navigation">
                <button class="menu_btn meta_navigation__button"
                    :class="{ 'meta_navigation__button--available': dailyGiftStore.status.canClaim }"
                    :aria-label="t('mainMenu.dailyGift')" :title="t('mainMenu.dailyGift')" @click="goToDailyGift">
                    <img src="@/assets/images/daily_gifts_icon.svg" alt="" />
                    <span v-if="dailyGiftStore.status.canClaim" class="meta_navigation__marker">!</span>
                </button>
                <button class="menu_btn meta_navigation__button"
                    :class="{ 'meta_navigation__button--available': fortuneWheelStore.spins > 0 }"
                    :aria-label="t('mainMenu.fortuneWheel')" :title="t('mainMenu.fortuneWheel')" @click="goToFortuneWheel">
                    <img src="@/assets/images/loot_circle.svg" alt="" />
                    <span v-if="fortuneWheelStore.spins > 0" class="meta_navigation__marker">{{ fortuneWheelStore.spins }}</span>
                </button>
            </aside>
        </Transition>

        <!-- SETTINGS -->
        <SettingsRoot v-if="gameStore.activeOverlay === 'settings'" />

        <!-- LEADERBOARDS -->
        <LeaderBoardsRoot v-if="gameStore.activeOverlay === 'leaderBoards'" />

        <!-- SHOP -->
        <ShopRoot v-if="gameStore.activeOverlay === 'shop'" />

        <!-- DAILY GIFT -->
        <DailyGiftRoot v-if="gameStore.activeOverlay === 'dailyGift'" />

        <!-- FORTUNE WHEEL -->
        <FortuneWheelRoot v-if="gameStore.activeOverlay === 'fortuneWheel'" />
    </div>
</template>


<script setup lang="ts">
import { watch, ref, computed, onMounted } from "vue";
import { useGameState } from "@/store/gameState";
import { GameStates } from "@/game/core/GameState";
import { createNewText } from "@/helpers/functions";
import SettingsRoot from "./settings/SettingsRoot.vue";
import LeaderBoardsRoot from "./leaderboards/LeaderBoardsRoot.vue";
import ShopRoot from "./shop/ShopRoot.vue";
import { useDailyGiftStore } from "@/store/dailyGiftStore";
import { useFortuneWheelStore } from "@/store/fortuneWheelStore";
import DailyGiftRoot from "./daily-gift/DailyGiftRoot.vue";
import FortuneWheelRoot from "./fortune-wheel/FortuneWheelRoot.vue";
import { useTranslation } from "i18next-vue";
import { SoundManager } from "@/game/sound/SoundManager";

const dailyGiftStore = useDailyGiftStore();
const fortuneWheelStore = useFortuneWheelStore();
const foo = createNewText();
const gameStore = useGameState();
const isMainMenuEnabled = ref(false);
const { t } = useTranslation();
const soundManager = SoundManager.getInstance();

const menuButtons = computed(() => [
    { id: 1, text: foo.makeText("mainMenu.startGame"), action: startGame },
    { id: 2, text: foo.makeText("mainMenu.shop"), action: goToShop },
    { id: 3, text: foo.makeText("mainMenu.settings"), action: goToSettings },
    { id: 4, text: foo.makeText("mainMenu.leaderboards"), action: goToLeaderBoards },
]);

function startGame() {
    soundManager.playCue("uiSelect");
    gameStore.setState(GameStates.LevelSelect);
}

function goToShop() {
    soundManager.playCue("uiSelect");
    isMainMenuEnabled.value = false;
    setTimeout(() => {
        gameStore.openShop();
    }, 300);
}

function goToDailyGift() {
    soundManager.playCue("uiSelect");
    isMainMenuEnabled.value = false;
    setTimeout(() => gameStore.openDailyGift(), 300);
}

function goToFortuneWheel() {
    soundManager.playCue("uiSelect");
    isMainMenuEnabled.value = false;
    setTimeout(() => gameStore.openFortuneWheel(), 300);
}

function goToSettings() {
    soundManager.playCue("uiSelect");
    isMainMenuEnabled.value = false;
    setTimeout(() => {
        gameStore.openSettings('main');
    }, 300);
}

function goToLeaderBoards() {
    soundManager.playCue("uiSelect");
    isMainMenuEnabled.value = false;
    setTimeout(() => {
        gameStore.openLeaderBoards();
    }, 300);
}

watch(
    () => gameStore.activeOverlay,
    (newState) => {
        if (["settings", "leaderBoards", "shop", "dailyGift", "fortuneWheel"].includes(newState as string)) {
            isMainMenuEnabled.value = false;
        } else {
            isMainMenuEnabled.value = true;
        }
    },
);

onMounted(async () => {
    // console.log("🟢 MainMenu.onMounted: calling restoreProgress");
    setTimeout(() => {
        isMainMenuEnabled.value = true;
    }, 400);

    if (dailyGiftStore.isReady && dailyGiftStore.status.canClaim) {
        setTimeout(() => gameStore.openDailyGift(), 450);
    }
});
</script>


<style lang="scss" scoped>
@use "@/styles/menu.scss";
@use "@/styles/animations.scss";
@use "@/styles/typography" as *;
@use "@/styles/colors" as *;

.group_correction {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    position: fixed;

    // #region - bottom and gap
    bottom: 11.111vh;
    gap: 5.56vh;

    @media (min-width: $breakpoint-mobile) and (orientation: landscape) and (hover: none) and (pointer: coarse) {
        bottom: 11.111vh;
        gap: 5.56vh;
    }

    // позже расчитать:
    // @media (min-width: $breakpoint-tablet) and (orientation: landscape) and (hover: none) and (pointer: coarse) { 
    //     bottom: 9.722vw;
    //     gap: 1.736vw; 
    // }  
    @media (min-width: $breakpoint-laptop) and (orientation: landscape) {
        bottom: 9.722vw;
        gap: 1.736vw;
    }

    @media (min-width: $breakpoint-desktop) and (orientation: landscape) {
        bottom: 10.677vw;
        gap: 1.667vw;
    }

    // #endregion
}

.btn_correction {
    @include text-button-size-m;
    color: $color-yellow-super-light;
}

.meta_navigation {
    position: fixed;
    left: max(8.5rem, 50% - 15rem);
    bottom: 27.111vh;
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
}

.meta_navigation__button {
    position: relative;
    display: grid;
    place-items: center;
    padding: 0;
    color: $color-blue-light;
}

.meta_navigation__button img {
    width: clamp(3.5rem, 5vw, 4.5rem);
    height: auto;
    transition: transform 160ms ease-out;
}

.meta_navigation__button:hover img {
    transform: scale(1.08);
}

.meta_navigation__button--available img {
    filter: drop-shadow(0 0 0.75rem rgba(255, 217, 92, 0.72));
}

.meta_navigation__marker {
    position: absolute;
    top: -0.25rem;
    right: -0.15rem;
    display: grid;
    place-items: center;
    width: 1.15rem;
    height: 1.15rem;
    border-radius: 50%;
    background: $color-yellow;
    color: #1c1c1c;
    font-family: $font-secondary;
    font-size: 0.8rem;
    font-weight: 700;
}

@media (min-width: $breakpoint-laptop) and (orientation: landscape) {
    .meta_navigation {
        bottom: 9.722vw;
    }
}

@media (min-width: $breakpoint-desktop) and (orientation: landscape) {
    .meta_navigation {
        bottom: 10.677vw;
    }
}
</style>
