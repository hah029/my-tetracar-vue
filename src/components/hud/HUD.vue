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

            <div class="central_panel">
                <div class="metrics_group">
                    <div class="metrics_block color_yellow_light">
                        <div class="score_value_row">
                            <div class="font_adaptation metrics_number">{{ score }}</div>
                            <div v-if="currentMultiplier > 1" class="score_multiplier color_yellow">
                                <span class="x_sign">x</span>{{ currentMultiplier }}
                            </div>
                        </div>
                        <div class="metrics_text">{{ foo.makeText('gamePlay.keyStats.progress', 'empty') }}</div>
                    </div>
                    <div class="divider"></div>
                    <div class="metrics_block color_blue">
                        <div class="font_adaptation metrics_number">{{ currentSpeed }}</div>
                        <div class="metrics_text">{{ foo.makeText('gamePlay.keyStats.speed', 'empty') }}</div>
                    </div>
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
            </div>

            <div class="notifications_panel">
                <HudNotifications />
            </div>
        </div>

        <!-- Нижняя панель (бустеры) -->
        <div class="bottom_panel">
            <div class="bottom_subpanel">
                <template v-for="(group, groupIndex) in boosterGroups" :key="group.key">
                    <div class="booster_group" :class="`booster_group--${group.key}`">
                        <div v-for="booster in group.items" :key="booster.key" class="booster_item">
                            <div :class="booster.textColorClass">{{ booster.displayValue }}</div>
                            <div class="boosters_image_container">
                                <img v-if="booster.isActive" class="icon with_shadow" :src="booster.activeIcon" />
                                <img v-else class="icon with_white_glow"
                                    src="@/assets/images/hud/cube_booster_empty.svg" />
                            </div>
                        </div>
                    </div>
                    <div v-if="groupIndex === 0" class="booster_group_divider"></div>
                </template>
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
    font-size: clamp(1rem, 2vmin, 2rem);
    --hud-pad-x: clamp(0.75rem, 4vmin, 2.5rem);
    --hud-top: clamp(0.75rem, 3vmin, 1.875rem);
    --hud-bottom-panel-height: clamp(4.5rem, 12vmin, 8rem);
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
    top: var(--hud-top);
    padding: 0 var(--hud-pad-x);
    display: grid;
    grid-template-columns: minmax(3rem, auto) minmax(0, 1fr) minmax(6rem, auto);
    grid-template-rows: auto auto;
    align-items: start;
    column-gap: clamp(0.75rem, 3vmin, 2.5rem);
    row-gap: clamp(0.65rem, 2.2vmin, 1.5rem);
}

.buttons_left_group {
    grid-column: 1;
    grid-row: 1;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    gap: 1rem;
}

.pause_btn_container {
    width: clamp(3rem, 6vmin, 4.063rem);
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
    grid-column: 3;
    grid-row: 1;
    align-self: start;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-content: flex-start;
    gap: clamp(0.5rem, 1.6vmin, 1.067rem);
    min-width: 0;
}

.currency_block {
    display: flex;
    justify-content: flex-end;
    flex-direction: column;
    align-items: flex-end;
    gap: clamp(0.4rem, 1.5vmin, 1rem);
    font-size: clamp(1rem, 2vmin, 1.5rem);
}

.currency_subblock {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: clamp(0.35rem, 1.4vmin, 0.625rem);
    min-width: 0;
}

.currency_value {
    text-align: right;
}

.currency_image_container {
    width: clamp(1.625rem, 4vmin, $icon-size);
    height: clamp(1.625rem, 4vmin, $icon-size);
    position: relative;
    flex: 0 0 auto;
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

.x_sign {
    text-transform: lowercase;
}

// #endregion

// #region - central_panel
.central_panel {
    grid-column: 2;
    grid-row: 1;
    align-self: start;
    min-width: 0;
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100%;
}

.metrics_group {
    display: flex;
    justify-content: center;
    align-items: flex-start;
    gap: clamp(0.75rem, 4vmin, 3rem);
    max-width: 100%;
    min-width: 0;
}

.metrics_block {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    gap: clamp(0.35rem, 1.6vmin, 1rem);
    min-width: 0;
}

.metrics_text {
    font-size: clamp(0.78rem, 1.4vmin, 1rem);
    text-align: center;
    white-space: nowrap;
}

.metrics_number {
    font-size: clamp(1.25rem, 2.6vmin, 2.5rem);
    max-width: min(22rem, 45vw);
    overflow: hidden;
    text-align: center;
    text-overflow: ellipsis;
}

.score_value_row {
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: clamp(0.35rem, 1.2vmin, 0.75rem);
    min-width: 0;
}

.score_multiplier {
    flex: 0 0 auto;
    font-size: clamp(0.85rem, 1.6vmin, 1.35rem);
    letter-spacing: 0;
    white-space: nowrap;
    filter: drop-shadow(0 0 0.45rem rgba(255, 217, 92, 0.35));
}

.divider {
    height: 1.563rem;
    width: 1px;
    background-color: rgba(255, 255, 255, 0.4);
}

.notifications_panel {
    grid-column: 1 / -1;
    grid-row: 2;
    display: flex;
    justify-content: center;
    min-height: clamp(1.5rem, 4vmin, 3rem);
    pointer-events: none;
}

// #endregion

// #region - bottom_panel (boosters)
.bottom_panel {
    width: 100%;
    height: var(--hud-bottom-panel-height);
    position: absolute;
    bottom: 0;
    display: flex;
    justify-content: center;
}

.bottom_subpanel {
    width: min(52rem, 100%);
    box-sizing: border-box;
    padding: 0 var(--hud-pad-x);
    display: flex;
    justify-content: center;
    align-items: center;
    gap: clamp(0.65rem, 3vmin, 2rem);
    background: linear-gradient(90deg,
            rgba(0, 0, 0, 0) 0%,
            rgba(0, 0, 0, 0.55) 10%,
            rgba(0, 0, 0, 0.55) 90%,
            rgba(0, 0, 0, 0) 100%);
}

.booster_group {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: clamp(0.65rem, 2.2vmin, 1.35rem);
    min-width: 0;
}

.booster_group--timed {
    padding: clamp(0.35rem, 1vmin, 0.55rem) clamp(0.5rem, 1.8vmin, 1rem);
    border: 1px solid rgba(105, 226, 255, 0.18);
    border-radius: 999px;
    background: rgba(31, 112, 155, 0.16);
    box-shadow: inset 0 0 1.4rem rgba(67, 184, 255, 0.06);
}

.booster_item {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: clamp(0.35rem, 1.4vmin, 0.625rem);
    min-width: 0;
}

.booster_group_divider {
    height: clamp(1.6rem, 4vmin, 2.25rem);
    width: 1px;
    flex: 0 0 auto;
    background: linear-gradient(180deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.42) 50%,
            rgba(255, 255, 255, 0) 100%);
}

.boosters_image_container {
    width: clamp(1.375rem, 4vmin, $booster-icon-size);
    height: clamp(1.375rem, 4vmin, $booster-icon-size);
    position: relative;
    flex: 0 0 auto;
}

.with_shadow {
    filter: drop-shadow(0 2px 15px rgba(0, 0, 0, 0.35));
}

.with_white_glow {
    filter: drop-shadow(0 0px 10px rgba(255, 255, 255, 0.2));
}

// #endregion

@media (max-width: 720px) {
    .top_panel {
        grid-template-columns: auto minmax(0, 1fr) auto;
        grid-template-areas:
            "pause spacer currency"
            "metrics metrics metrics"
            "notifications notifications notifications";
        row-gap: clamp(0.75rem, 2.4vmin, 1rem);
    }

    .buttons_left_group {
        grid-area: pause;
    }

    .buttons_right_group {
        grid-area: currency;
    }

    //.central_panel {
    //    grid-area: metrics;
    //}

    .notifications_panel {
        grid-area: notifications;
    }

    .metrics_group {
        width: 100%;
        justify-content: center;
    }

    .metrics_number {
        max-width: min(18rem, 42vw);
    }

    .bottom_subpanel {
        justify-content: space-evenly;
        padding: 0 clamp(0.5rem, 2vmin, 1rem);
    }

    .booster_group {
        gap: clamp(0.45rem, 1.6vmin, 0.85rem);
    }
}

@media (max-width: 460px),
(max-height: 520px) {
    .game_hud {
        --hud-pad-x: 0.625rem;
        --hud-top: 0.625rem;
    }

    .top_panel {
        row-gap: 0.55rem;
    }

    .pause_btn_container {
        width: clamp(2.5rem, 9vmin, 3rem);
    }

    .currency_block {
        font-size: clamp(0.86rem, 3.2vmin, 1rem);
    }

    .metrics_group {
        gap: 0.55rem;
    }

    .metrics_text {
        font-size: clamp(0.62rem, 2.6vmin, 0.78rem);
    }

    .metrics_number {
        font-size: clamp(0.95rem, 4vmin, 1.25rem);
    }

    .score_multiplier {
        font-size: clamp(0.72rem, 3vmin, 0.9rem);
    }

    .divider {
        height: 1rem;
    }

    .bottom_panel {
        height: clamp(3.75rem, 13vmin, 4.5rem);
    }

    .bottom_subpanel {
        gap: 0.35rem;
    }

    .booster_group--timed {
        padding: 0.25rem 0.35rem;
    }

    .booster_group_divider {
        display: none;
    }
}
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

const boosterGroups = computed(() => [
    {
        key: 'stock',
        items: boosters.value.filter(item => item.key === 'bullet' || item.key === 'armor')
    },
    {
        key: 'timed',
        items: boosters.value.filter(item => item.key === 'nitro' || item.key === 'magnet')
    }
]);

// Пауза
function goToPause() {
    gameStore.pauseGame();
}
</script>
