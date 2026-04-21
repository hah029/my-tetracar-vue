<template>
    <div class="game_hud">

        <div class="top_panel">
            <div class="buttons_left_group">
                <div class="pause_btn_container" @click="goToPause()">
                    <img class='icon is_clickable' src="@/assets/images/hud/btn_pause.svg" />
                </div>
                <div class="shop_btn_container" @click="goToShop()">
                    <img class='icon is_clickable' src="@/assets/images/hud/btn_shop.svg" />
                </div>
            </div>
            <div class="buttons_right_group">
                <div class="currency_block">
                    <div class="currency_subblock">
                        <div class="currency_value color_yellow_light">{{ goldens }}</div>
                        <div class="currency_image_container" @click="goToPause()">
                            <img class='icon' src="@/assets/images/hud/cube_golden.svg" />
                        </div>
                    </div>
                    <div class="currency_subblock">
                        <div class="currency_value color_blue_light">{{ energons }}</div>
                        <div class="currency_image_container energon_glow_general" @click="goToPause()">
                            <img class='icon icon_abs' src="@/assets/images/hud/cube_energon_grid_backward.svg" />
                            <img class='icon icon_abs energon_glow_core' src="@/assets/images/hud/cube_energon_core.svg" />
                            <img class='icon icon_abs energon_glow_grid' src="@/assets/images/hud/cube_energon_grid_frontal.svg" />
                        </div>
                    </div>
                </div>
                <div class="yellow_divider"></div>
                <div class="multiply_block color_yellow">
                    <div class="x_sign">x</div>
                    <div class="x_number">2</div>
                </div>
            </div>
        </div>
        
        <div class="central_panel">
            <!-- Основные статы (прогресс, макс. прогресс, скорость) -->
            <div class="metrics_group">
                <div class="metrics_block color_yellow_light">
                    <div class="metrics_text">{{ foo.makeText('gamePlay.keyStats.progress', 'empty') }}</div>
                    <div class="metrics_number">{{ currentDistance }}</div>
                </div>
                <div class="divider"></div>
                <div class="metrics_block color_yellow_light">
                    <div class="metrics_text">{{ foo.makeText('gamePlay.keyStats.maxProgress', 'empty') }}</div>
                    <div class="metrics_number">5124</div>
                </div>
                <div class="divider"></div>
                <div class="metrics_block color_blue">
                    <div class="metrics_text">{{ foo.makeText('gamePlay.keyStats.speed', 'empty') }}</div>
                    <div class="metrics_number">2</div>
                </div>
            </div>
            
            <!-- Уведомления -->
            <TransitionGroup name="notification_anim" tag="div" class="notifications_container">
                <div v-for="(notif, index) in notificationsList" 
                    :key="notif.id" 
                    class="notifications_block"
                >
                    <div :class="setBoosterTextColor('detection', notif.message)">{{ makeNotification(notif.message) }}</div>
                    <div class="boosters_image_container">
                        <img v-if="getCubeType(notif.message) == 'ammo'" class='icon' src="@/assets/images/hud/cube_bullet.svg" />
                        <img v-else-if="getCubeType(notif.message) == 'armor'" class='icon' src="@/assets/images/hud/cube_armor.svg" />
                        <img v-else-if="getCubeType(notif.message) == 'nitro'" class='icon' src="@/assets/images/hud/cube_nitro.svg" />
                    </div>
                </div>
            </TransitionGroup>
        </div>

        <div class="bottom_panel">
            <div class="bottom_subpanel">
                <div class="currency_subblock">
                    <div :class="setBoosterTextColor('bullet')">{{ bulletsCount }}</div>
                    <div class="boosters_image_container">
                        <img v-if="bulletsCount > 0" class='icon with_shadow' src="@/assets/images/hud/cube_bullet.svg" />
                        <img v-else class='icon with_white_glow' src="@/assets/images/hud/cube_booster_empty.svg" />
                    </div>
                </div>
                <div class="boosters_divider"></div>
                <div class="currency_subblock">
                    <div :class="setBoosterTextColor('armor')">{{ armorsCount }}</div>
                    <div class="boosters_image_container">
                        <img v-if="isShieldActive" class='icon with_shadow' src="@/assets/images/hud/cube_armor.svg" />
                        <img v-else class='icon with_white_glow' src="@/assets/images/hud/cube_booster_empty.svg" />
                    </div>
                </div>
                <div class="boosters_divider"></div>
                <div class="currency_subblock">
                    <div :class="setBoosterTextColor('nitro')">{{ nitroTimer }}</div>
                    <div class="boosters_image_container">
                        <img v-if="isNitroActive" class='icon with_shadow' src="@/assets/images/hud/cube_nitro.svg" />
                        <img v-else class='icon with_white_glow' src="@/assets/images/hud/cube_booster_empty.svg" />
                    </div>
                </div>
            </div>
        </div>

        <!-- SCORE -->
        <!-- <Score /> -->

        <!-- SPEED (TETRIS BLOCKS ANIMATION) -->
        <!-- <Speed /> -->

        <!-- NITRO (TETRIS STYLE) -->
        <!-- <Boosters /> -->

        <!-- LANES -->
        <!-- <Lanes /> -->

        <!-- WARNING -->
        <!-- <Notifications /> -->

    </div>
</template>


<script setup lang="ts">
    import { computed, watch, ref } from "vue";
    import { useGameState } from "@/store/gameState";
    import { usePlayerStore } from "@/store/playerStore";
    import { useProgressStore } from "@/store/progressStore";
    import { createNewText } from '@/helpers/functions';

    import Score from "./panels/Score.vue";
    import Speed from "./panels/Speed.vue";
    import Boosters from "./panels/Boosters.vue";
    // import Lanes from "./panels/Lanes.vue";
    // import Notifications from "./panels/Notifications.vue";

    const gameStore = useGameState();
    const playerStore = usePlayerStore();
    const progressStore = useProgressStore();
    const foo = createNewText();

    // работаем с валютой (голдены / энергоны)
    const goldens = computed(() => Math.floor(progressStore.score));
    const energons = computed(() => Math.floor(progressStore.energons));
    
    const currentDistance = computed(() => Math.floor(progressStore.currentDistance));

    // #region - работаем с уведомлениями
        interface NotificationItem {
            id: number;
            message: string;
        };
        let notificationsList = ref<NotificationItem[]>([]);
        let nextId = ref(0);
        const newNotification = computed(() => playerStore.notificationMsg);

        watch(
            () => newNotification.value,
            (newState) => {
                if (newState != '') {
                    const newNotificationItem: NotificationItem = {
                        id: nextId.value++,
                        message: newState
                    };
                    
                    notificationsList.value.unshift(newNotificationItem);
                    
                    setTimeout(() => {
                        playerStore.addNewMsg('');
                    }, 100);
                    
                    setTimeout(() => {
                        const index = notificationsList.value.findIndex(n => n.id === newNotificationItem.id);
                        if (index !== -1) {
                            notificationsList.value.splice(index, 1);
                        }
                    }, 3000);
                };
            },
        );

        // генерируем текст уведомления
        function makeNotification(notificationMessage: string) {
            return foo.makeText('gamePlay.notificationsList.' + notificationMessage, 'empty');
        };

        // определяем какой кубик рисовать в уведомлениях
        function getCubeType(notificationMessage: string)  {
            let str = notificationMessage.toLowerCase();
            if (str.includes('armor')) {
                return 'armor';
            } else if (str.includes('ammo')) {
                return 'ammo';
            } else if (str.includes('nitro')) {
                return 'nitro';
            };
            return '';
        };
    // #endregion

    // работаем с Патронами
    const bulletsCount = computed(() => playerStore.ammo);

    // работаем с Броней
    const isShieldActive = computed(() => playerStore.isShieldEnabled);
    const armorsCount = computed(() => playerStore.armor);
    
    // работаем с Нитро
    const isNitroActive = computed(() => playerStore.isNitroEnabled);
    const BLOCKS_TOTAL = 10;
    const nitroTimer = computed(() => {
        if (!playerStore.isNitroEnabled || playerStore.nitroTimer <= 0) {
            return 0;
        } else {
            const ratio = playerStore.nitroTimer / playerStore.BASE_NITRO_TIMER;
            return Math.ceil(ratio * BLOCKS_TOTAL);
        };
    });

    // переходим в паузу при клике по кнопке на интерфейсе
    function goToPause() {
        gameStore.pauseGame();
    };

    // переходим в магазин при клике по кнопке на интерфейсе (пока заглушка)
    function goToShop() {
        console.log('shop');
    };

    // красим текст цифр у бустеров в нужный цвет
    function setBoosterTextColor(type_: string, notif_: string = 'undefined') {
        if (type_ == 'nitro') {
            return !playerStore.isNitroEnabled || playerStore.nitroTimer <= 0 ? 'color_gray' : 'color_green_light';

        } else if (type_ == 'armor') {
            return isShieldActive.value ? 'color_white' : 'color_gray';

        } else if (type_ == 'bullet') {
            return bulletsCount.value > 0 ? 'color_red_light' : 'color_gray';

        } else if (type_ == 'detection') {
            let str = notif_.toLowerCase();
            if (str.includes('armor')) {
                return 'color_white';
            } else if (str.includes('ammo')) {
                return 'color_red_light';
            } else if (str.includes('nitro')) {
                return 'color_green_light';
            };
        };
    };
</script>


<style lang='scss' scoped>
    @use "@/styles/menu.scss" as *;
    @use "@/styles/animations.scss";
    
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
        }
        .color_yellow {
            color: #FFD95C;
        }
        .color_yellow_light {
            color: #FFF5AD;
        }
        .color_blue {
            color: #72B3EE;
        }
        .color_blue_light {
            color: #D7FBFF;
        }
        .color_red_light {
            color: #FFC3C5;
        }
        .color_green_light {
            color: #BFFF8E;
        }
        .color_white {
            color: white;
        }
        .color_gray {
            color: rgba(255, 255, 255, 0.5);
        }
    // #endregion

    // #region - top_panel_left_group
        .top_panel {
            width: 100%;
            position: absolute;
            box-sizing: border-box;
            top: 1.875rem;
            padding: 0rem 2.5rem;
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
        .shop_btn_container {
            width: 3.125rem;
            transition: all 0.1s ease-in-out;

            &:hover .icon {
                filter: drop-shadow(0 0 10px rgb(247, 156, 255));
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
        .buttons_right_group{
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            gap: 1.067rem;
        }

        .currency_block {
            display: flex;
            justify-content: flex-start;
            align-items: center;
            gap: 0.25rem;
            // gap: 1.563rem;
        }
        .currency_subblock {
            display: flex;
            justify-content: flex-end;
            align-items: center;
            gap: 0.625rem;
            font-size: 1.375rem;
        }
        .currency_value {
            min-width: 3ch;
            text-align: right;
            font-feature-settings: "tnum";
            font-variant-numeric: tabular-nums;
            white-space: nowrap;
            transition: width 0.1s ease;  // Плавное расширение
        }
        .currency_image_container {
            width: 2.3125rem;
            height: 2.3125rem;
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
            width: 11.5rem;
            background: linear-gradient(
                90deg,
                rgba(255, 217, 92, 0) 0%,
                rgba(255, 217, 92, 0.55) 25%,
                rgba(255, 217, 92, 0.55) 75%,
                rgba(255, 217, 92, 0) 100%
            );
        }

        .multiply_block {
            display: flex;
            justify-content: center;
            align-items: flex-end;
            gap: 0.125rem;
            margin-top: -0.3125rem;
        }
        .x_sign {
            font-size: 1.5625rem;
            text-transform: lowercase;
        }
        .x_number {
            font-size: 2.1875rem;
            margin-bottom: -0.125rem;
        }
    // #endregion

    // #region - central_panel
        .central_panel {
            position: absolute;
            top: 1.875rem;
            width: 100%;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            align-items: center;
            gap: 1.5625rem;
        }
        .metrics_group {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 1.875rem;
        }
        .metrics_block {
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            align-items: center;
            gap: 0.3125rem;
        }
        .metrics_text {
            font-size: 0.875rem;
        }
        .metrics_number {
            font-size: 1.75rem;
        }
        .divider {
            height: 1.563rem;
            width: 1px;
            background-color: rgba(255, 255, 255, 0.4);
        }
    // #endregion

    // #region - notifications
        .notifications_container {
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            align-items: center;
            gap: 0.5rem;
            pointer-events: none;
        }
        .notifications_block {
            display: flex;
            justify-content: flex-end;
            align-items: center;
            gap: 1.25rem;
            font-size: 1.125rem;
        }
    // #endregion

    // #region - bottom_panel
        .bottom_panel {
            width: 100%;
            height: 50px;
            position: absolute;
            bottom: 0;
            display: flex;
            justify-content: center;
        }
        .bottom_subpanel {
            width: 87.5rem;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 1.875rem;
            background: linear-gradient(
                90deg,
                rgba(0, 0, 0, 0) 0%,      /* 0% - полностью прозрачный */
                rgba(0, 0, 0, 0.55) 10%,     /* 10% - полностью непрозрачный */
                rgba(0, 0, 0, 0.55) 90%,     /* 90% - полностью непрозрачный */
                rgba(0, 0, 0, 0) 100%     /* 100% - полностью прозрачный */
            );
        }
        .boosters_image_container {
            width: 1.875rem;
            height: 1.875rem;
            position: relative;
        }
        .boosters_divider {
            height: 1.375rem;
            width: 1px;
            background-color: rgba(255, 255, 255, 0.3);
        }
        .with_shadow {
            filter: drop-shadow(0 2px 15px rgba(0, 0, 0, 0.35));
        }
        .with_white_glow {
            filter: drop-shadow(0 0px 10px rgba(255, 255, 255, 0.2));
        }
    // #endregion

    // #region - old
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
            gap: 1px;
            margin-bottom: 4px;
        }

        .speed-block {
            width: 1px;
            height: 16px;
            background: rgba(0, 255, 255, 0.2);
            /* border: 2px solid rgba(0, 255, 255, 0.4); */
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
            transform: translateY(-20px);
            opacity: 0;
            animation: fall 0.25s forwards;

            &.active {
                background: linear-gradient(90deg, #ff4444, #ff8844);
            }
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
    // #endregion
</style>