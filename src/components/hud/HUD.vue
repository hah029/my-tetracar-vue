<template>
    <div class="game_hud">

        <div class="top_panel">
            <div class="buttons_group">
                <div class="pause_btn_container" @click="goToPause()">
                    <img class='icon' src="@/assets/images/hud/btn_pause.svg" />
                </div>
                <div class="shop_btn_container" @click="goToShop()">
                    <img class='icon' src="@/assets/images/hud/btn_shop.svg" />
                </div>
            </div>
        </div>
        
        <div class="central_panel">
            <div class="metrics_group">
                <div class="metrics_block color_yellow_light">
                    <div class="metrics_text">Прогресс</div>
                    <div class="metrics_number">639</div>
                    <!-- <div class="metrics_number">{{ goldens }}</div> -->
                </div>
                <div class="divider"></div>
                <div class="metrics_block color_yellow_light">
                    <div class="metrics_text">Макс.</div>
                    <div class="metrics_number">5124</div>
                </div>
                <div class="divider"></div>
                <div class="metrics_block color_blue">
                    <div class="metrics_text">Скорость</div>
                    <div class="metrics_number">2</div>
                </div>
            </div>
        </div>

        <div class="bottom_panel">
            <div class="bottom_subpanel"></div>
        </div>

        <!-- SCORE -->
        <!-- <Score /> -->

        <!-- SPEED (TETRIS BLOCKS ANIMATION) -->
        <Speed />

        <!-- NITRO (TETRIS STYLE) -->
        <Boosters />

        <!-- LANES -->
        <!-- <Lanes /> -->

        <!-- WARNING -->
        <!-- <Notifications /> -->

    </div>
</template>


<script setup lang="ts">
    import { computed } from "vue";
    import { useGameState } from "@/store/gameState";
    import { useProgressStore } from "@/store/progressStore";

    import Score from "./panels/Score.vue";
    import Speed from "./panels/Speed.vue";
    import Boosters from "./panels/Boosters.vue";
    // import Lanes from "./panels/Lanes.vue";
    // import Notifications from "./panels/Notifications.vue";

    const gameStore = useGameState();
    const progressStore = useProgressStore();
    // const goldens = computed(() => Math.floor(progressStore.score));
    // const energons = computed(() => Math.floor(progressStore.score));

    function goToPause() {
        gameStore.pauseGame();
    };
    function goToShop() {
        console.log('shop');
    };
</script>


<style lang='scss' scoped>
    @use "@/styles/menu.scss" as *;
    
    // #region - general
        .game_hud {
            position: absolute;
            inset: 0;
            pointer-events: none;
            font-family: monospace;
            z-index: z("ui_component");
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
    // #endregion

    // #region - top_panel
        .top_panel {
            width: 100%;
            height: 50px;
            position: absolute;
            top: 1.875rem;
            padding: 0rem 3.125rem;
            display: flex;
            justify-content: space-between;
        }
        .buttons_group {
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
            cursor: pointer;
            pointer-events: auto;
            transition: all 0.1s ease-in-out;
        }
    // #endregion

    // #region - central_panel
        .central_panel {
            position: absolute;
            top: 1.875rem;
            width: 100%;
            display: flex;
            justify-content: center;
            align-items: flex-start;
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
            text-transform: uppercase;
            font-family: 'jost-light';
            line-height: 1;
            letter-spacing: 0.06rem;
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
            background: linear-gradient(
                90deg,
                rgba(0, 0, 0, 0) 0%,      /* 0% - полностью прозрачный */
                rgba(0, 0, 0, 0.55) 10%,     /* 10% - полностью непрозрачный */
                rgba(0, 0, 0, 0.55) 90%,     /* 90% - полностью непрозрачный */
                rgba(0, 0, 0, 0) 100%     /* 100% - полностью прозрачный */
            );
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