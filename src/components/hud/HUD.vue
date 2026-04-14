<template>


	<div class="controls-container">
	
		<div ref="swipeZoneRef" class="swipe-zone">
	    </div>
		
    	<div class="buttons-zone">
    	    <button id="btnAction1" class="action-btn" @click="handleShoot" @touchstart.prevent="handleShoot">💥 Стрельба</button>
	    </div>
	    
	    
    </div>




    <div id="game-hud">

        <!-- SCORE -->
        <Score />

        <!-- SPEED (TETRIS BLOCKS ANIMATION) -->
        <Speed />

        <!-- NITRO (TETRIS STYLE) -->
        <Boosters />

        <!-- LANES -->
        <Lanes />

        <!-- WARNING -->
        <Notifications />

    </div>
</template>


<script setup lang="ts">
    import { ref, onMounted, onUnmounted, inject } from "vue";
    import Score from "./panels/Score.vue";
    import Speed from "./panels/Speed.vue";
    import Boosters from "./panels/Boosters.vue";
    import Lanes from "./panels/Lanes.vue";
    import Notifications from "./panels/Notifications.vue";
    
    // Получаем игровой экземпляр через inject (нужно настроить в родительском компоненте)
    // Если game не предоставлен через provide, используем другой способ
    const game = inject<any>('game');
    
    // Реф для зоны свайпов
    const swipeZoneRef = ref<HTMLElement | null>(null);
    
    // Функция для обработки выстрела
    const handleShoot = () => {
        if (game && typeof game.shoot === 'function') {
            game.shoot();
        }
    };
    
    // Регистрируем зону свайпов если доступен controls composable
    // Этот блок нужно будет адаптировать под вашу архитектуру
    onMounted(() => {
        // Если game имеет controls и registerSwipeZone
        if (game && game.controls && typeof game.controls.registerSwipeZone === 'function') {
            game.controls.registerSwipeZone(swipeZoneRef.value);
        }
    });
    
    onUnmounted(() => {
        if (game && game.controls && typeof game.controls.cleanup === 'function') {
            game.controls.cleanup();
        }
    });
</script>


<style lang='scss' scoped>
    @use "@/styles/menu.scss" as *;
    
        /* ПРИНЦИП РАЗДЕЛЕНИЯ ЗОН: Левая область для свайпов, Правая для кнопок */
        .controls-container {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            z-index: 10;
            pointer-events: auto; /* Важно: разрешаем взаимодействие с контролами */
        }

        /* Левая половина экрана (свайпы) */
        .swipe-zone {
            flex: 2;
            background: rgba(0, 255, 255, 0.05); /* Едва заметная подсветка для понимания зоны (можно убрать) */
            touch-action: none; /* Говорим браузеру: всю обработку жестов здесь отдаем JS */
        }

        /* Правая половина экрана (кнопки) */
        .buttons-zone {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            gap: 30px;
            background: rgba(255, 255, 255, 0.02);
            touch-action: manipulation; /* Кнопкам мешать не будем */
        }

        /* Стили кнопок */
        .action-btn {
            width: 120px;
            padding: 18px 0;
            font-size: 1.8rem;
            font-weight: bold;
            border: none;
            border-radius: 60px;
            background: rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(12px);
            color: white;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            transition: transform 0.1s ease, background 0.2s;
            cursor: pointer;
            touch-action: manipulation;
            font-family: monospace;
            letter-spacing: 2px;
        }

        .action-btn:active {
            transform: scale(0.94);
            background: rgba(255, 255, 255, 0.5);
        }
    
    
    #game-hud {
        position: absolute;
        inset: 0;
        pointer-events: none;
        font-family: monospace;
        z-index: z("ui_component");
    }

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
</style>