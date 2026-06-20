<template>
    <TouchZone />

    <div class="game_hud">
        <!-- Верхняя панель -->
        <div class="top_panel">
            <div class="buttons_left_group">
                <div class="pause_btn_container" @click="goToPause()">
                    <img class="icon is_clickable" src="@/assets/images/hud/btn_pause.svg" />
                </div>
            </div>

            <div class="buttons_right_group">
                <div class="currency_block">
                    <div class="currency_subblock">
                        <div class="currency_value font_adaptation color_yellow_light">{{ goldens }}</div>
                        <div class="currency_image_container">
                            <img class="icon" src="@/assets/images/hud/cube_golden.svg" />
                        </div>
                    </div>
                    <div class="currency_subblock">
                        <div class="currency_value font_adaptation color_blue_light">{{ energons }}</div>
                        <div class="currency_image_container energon_glow_general">
                            <img class="icon icon_abs" src="@/assets/images/hud/cube_energon_grid_backward.svg" />
                            <img class="icon icon_abs energon_glow_core"
                                src="@/assets/images/hud/cube_energon_core.svg" />
                            <img class="icon icon_abs energon_glow_grid"
                                src="@/assets/images/hud/cube_energon_grid_frontal.svg" />
                        </div>
                    </div>
                </div>
                <div v-if="currentMultiplier > 1" class="yellow_divider"></div>
                <div v-if="currentMultiplier > 1" class="multiply_block color_yellow">
                    <div class="x_sign">x</div>
                    <div class="x_number">{{ currentMultiplier }}</div>
                </div>
            </div>
        </div>

        <!-- Центральная панель -->
        <div class="central_panel">
            <div class="metrics_group">
                <div class="metrics_block color_yellow_light">
                    <div class="metrics_text">{{ foo.makeText('gamePlay.keyStats.progress', 'empty') }}</div>
                    <div class="font_adaptation metrics_number">{{ score }} / {{ highScore }}</div>
                </div>
                <div class="divider"></div>
                <div class="metrics_block color_blue">
                    <div class="metrics_text">{{ foo.makeText('gamePlay.keyStats.speed', 'empty') }}</div>
                    <div class="font_adaptation metrics_number">{{ currentSpeed }}</div>
                </div>
            </div>
            <HudNotifications />
        </div>

        <!-- Нижняя панель (бустеры) -->
        <div class="bottom_panel">
            <div class="bottom_subpanel">
                <div v-for="booster in boosters" :key="booster.key" class="currency_subblock">
                    <div :class="booster.textColorClass">{{ booster.displayValue }}</div>
                    <div class="boosters_image_container">
                        <img v-if="booster.isActive" class="icon with_shadow" :src="booster.activeIcon" />
                        <img v-else class="icon with_white_glow" src="@/assets/images/hud/cube_booster_empty.svg" />
                    </div>
                    <div v-if="booster.key !== 'magnet'" class="boosters_divider"></div>
                </div>
            </div>
        </div>

        <!-- FX-эффекты -->
        <HudEffects />
    </div>
</template>

<style lang="scss" scoped>
@use "@/styles/menu.scss" as *;
@use "@/styles/animations.scss";

// Переменные
$booster-divider-color: rgba(255, 255, 255, 0.3);
$panel-horizontal-padding: 2.5rem;
$icon-size: 2.3125rem;
$booster-icon-size: 1.875rem;

// #region - general
.game_hud {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: z("ui_component");
    font-family: 'jost-light';
    text-transform: uppercase;
    line-height: 1;
    letter-spacing: 0.06rem;
    font-size: 2rem !important; // (32px)
}

.font_adaptation {
    min-width: 3ch;
    font-feature-settings: "tnum";
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    transition: width 0.1s ease;
}

// #endregion

// #region - top_panel
.top_panel {
    width: 100%;
    position: absolute;
    box-sizing: border-box;
    top: 1.875rem;
    padding: 0 $panel-horizontal-padding;
    display: flex;
    justify-content: space-between;
}

.buttons_left_group {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    gap: 1rem;
}

.pause_btn_container {
    width: 4.063rem;
    transition: all 0.1s ease-in-out;

    &:hover .icon {
        filter: drop-shadow(0 0 10px rgb(64, 163, 255));
        transition: all 0.1s ease-in-out;
        transform: translateY(-2px);
    }
}

.icon {
    width: 100%;
}

.icon_abs {
    position: absolute;
    top: 0;
    left: 0;
}

.is_clickable {
    cursor: pointer;
    pointer-events: auto;
    transition: all 0.1s ease-in-out;
}

// #endregion

// #region - top_panel_right_group
.buttons_right_group {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    gap: 1.067rem;
}

.currency_block {
    display: flex;
    justify-content: flex-end;
    flex-direction: column;
    align-items: flex-end;
    gap: 1rem;
    font-size: min(1.5rem, 24px);
}

.currency_subblock {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 0.625rem;
}

.currency_value {
    text-align: right;
}

.currency_image_container {
    width: min($icon-size, 90vw);
    height: $icon-size;
    position: relative;
}

.energon_glow_general {
    filter: drop-shadow(0 0 0.44rem rgb(43, 157, 229));
}

.energon_glow_grid {
    filter: drop-shadow(0 0 1.25rem rgb(20, 212, 255));
}

.energon_glow_core {
    filter: drop-shadow(0 0 0.625rem rgb(20, 212, 255));
}

.yellow_divider {
    height: 1px;
    width: min(11.5rem, 90vw);
    background: linear-gradient(90deg,
            rgba(255, 217, 92, 0) 0%,
            rgba(255, 217, 92, 0.55) 25%,
            rgba(255, 217, 92, 0.55) 75%,
            rgba(255, 217, 92, 0) 100%);
}

.multiply_block {
    display: flex;
    justify-content: center;
    align-items: flex-end;
    gap: 0.125rem;
    margin-top: -0.3125rem;
}

.x_sign {
    text-transform: lowercase;
}

.x_number {
    margin-bottom: -0.125rem;
}

// #endregion

// #region - central_panel
.central_panel {
    position: fixed;
    top: 30px;
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    gap: 2rem;
}

.metrics_group {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 3rem;
}

.metrics_block {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    gap: 1rem;
}

.metrics_text {
    font-size: min(1rem, 24px);
}

.metrics_number {
    font-size: min(2.5rem, 24px);
}

.divider {
    height: 1.563rem;
    width: 1px;
    background-color: rgba(255, 255, 255, 0.4);
}

// #endregion

// #region - bottom_panel (boosters)
.bottom_panel {
    width: 100%;
    height: min(8rem, 100px);
    position: absolute;
    bottom: 0;
    display: flex;
    justify-content: center;
}

.bottom_subpanel {
    width: min(87.5rem, 90vw);
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1.875rem;
    background: linear-gradient(90deg,
            rgba(0, 0, 0, 0) 0%,
            rgba(0, 0, 0, 0.55) 10%,
            rgba(0, 0, 0, 0.55) 90%,
            rgba(0, 0, 0, 0) 100%);
}

.boosters_image_container {
    width: min($booster-icon-size, 90vw);
    height: $booster-icon-size;
    position: relative;
}

.boosters_divider {
    height: 1.375rem;
    width: 1px;
    background-color: $booster-divider-color;
}

.with_shadow {
    filter: drop-shadow(0 2px 15px rgba(0, 0, 0, 0.35));
}

.with_white_glow {
    filter: drop-shadow(0 0px 10px rgba(255, 255, 255, 0.2));
}

// #endregion
</style>

<script setup lang="ts">
import { computed } from 'vue';
import { useGameState } from '@/store/gameState';
import { usePlayerStore } from '@/store/playerStore';
import { useProgressStore } from '@/store/progressStore';
import { useMetaStore } from '@/store/metaStore';
import { createNewText } from '@/helpers/functions';
import TouchZone from './panels/TouchZone.vue';
import HudNotifications from './panels/HudNotifications.vue';
import HudEffects from './panels/HudEffects.vue';

const gameStore = useGameState();
const playerStore = usePlayerStore();
const progressStore = useProgressStore();
const metaStore = useMetaStore();
const foo = createNewText();

// Валюты
const goldens = computed(() => metaStore.goldens);
const energons = computed(() => metaStore.energons);
const score = computed(() => Math.floor(progressStore.score));
const highScore = computed(() => Math.floor(progressStore.highScore));
const currentMultiplier = computed(() => progressStore.currentMultiplier);
const currentSpeed = computed(() => (playerStore.getCurrentSpeed() * 100).toFixed(1));

// Цветовые классы для уведомлений/бустеров
const colorMap: Record<string, string> = {
    armor: 'color_white',
    bullet: 'color_red_light',
    nitro: 'color_green_light',
    magnet: 'color_ultramarine',
    default: 'color_gray',
    newrecord: 'color_yellow new_record_msg'
};

function getBoosterColorClass(type: string, isActive: boolean, countOrTimer: number): string {
    if (type === 'bullet' || type === 'armor') {
        return isActive ? colorMap[type] : colorMap.default;
    }
    // nitro, magnet – таймер должен быть > 0
    return isActive && countOrTimer > 0 ? colorMap[type] : colorMap.default;
}

// Конфигурация бустеров для рендеринга
const boosters = computed(() => {
    const isShield = playerStore.isShieldEnabled;
    const armorCount = playerStore.armor;
    const isNitro = playerStore.isNitroEnabled;
    const nitroVal = isNitro ? Math.ceil(playerStore.nitroTimer / 1000) : 0;
    const isMagnet = playerStore.isMagnetEnabled;
    const magnetVal = isMagnet ? Math.ceil(playerStore.magnetTimer / 1000) : 0;
    const bulletsCount = playerStore.ammo;

    const items = [
        {
            key: 'bullet',
            displayValue: bulletsCount,
            isActive: bulletsCount > 0,
            activeIcon: new URL('@/assets/images/hud/cube_bullet.svg', import.meta.url).href,
            textColorClass: getBoosterColorClass('bullet', bulletsCount > 0, bulletsCount)
        },
        {
            key: 'armor',
            displayValue: armorCount,
            isActive: isShield,
            activeIcon: new URL('@/assets/images/hud/cube_armor.svg', import.meta.url).href,
            textColorClass: getBoosterColorClass('armor', isShield, armorCount)
        },
        {
            key: 'nitro',
            displayValue: nitroVal,
            isActive: isNitro && nitroVal > 0,
            activeIcon: new URL('@/assets/images/hud/cube_nitro.svg', import.meta.url).href,
            textColorClass: getBoosterColorClass('nitro', isNitro, nitroVal)
        },
        {
            key: 'magnet',
            displayValue: magnetVal,
            isActive: isMagnet && magnetVal > 0,
            activeIcon: new URL('@/assets/images/hud/cube_magnet.svg', import.meta.url).href,
            textColorClass: getBoosterColorClass('magnet', isMagnet, magnetVal)
        }
    ];
    return items;
});

// Пауза
function goToPause() {
    gameStore.pauseGame();
}
</script>