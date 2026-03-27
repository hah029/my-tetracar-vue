<template>
    <!-- canvas -->
    <div ref="threeRoot" class="three-root"></div>

    <!-- UI -->
    <GameLogo />
    <transition>
        <component :is="getUIComponent" />
    </transition>
</template>


<script setup lang="ts">
    import { ref, onMounted, onUnmounted, computed, Transition } from "vue";
    // composable
    import { useThree } from "./composables/useThree";
    import { useGame } from "./composables/useGame";
    import { useGameState } from "./store/gameState";
    import { useControls } from "./composables/useControls";
    import { GameLoop } from "./composables/useAnimate";
    // components
    import MainMenu from "./components/MainMenu.vue";
    import Preloader from "./components/Preloader.vue";
    import PauseMenu from "./components/PauseMenu.vue";
    import HUD from "./components/hud/HUD.vue";
    import GameOverMenu from "./components/GameOverMenu.vue";
    import Countdown from "./components/Countdown.vue";
    import GameLogo from "@/components/ui/GameLogo.vue";
    // managers
    import { CameraSystem } from "@/game/camera/CameraSystem";
    import { SoundManager } from "./game/sound/SoundManager";
    import { DebugColliderVisualizer } from "./helpers/debug/DebugColliderVisualizer";
    import { GameStates } from "./game/core/GameState";


    const threeRoot = ref<HTMLDivElement | null>(null);
    const { getScene, getCamera, getComposer } = useThree(threeRoot);
    const game = useGame();
    const gameState = useGameState();

    // let handleParam = ref(false);

    // // ловим и обрабатываем события из дочерней компоненты Preloader.vue
    // function handleEvent(val_: any) {
    //     handleParam.value = val_;
    // }    

    useControls(game);

    const getUIComponent = computed(() => {
        switch (gameState.currentState) {
            case GameStates.Preloader:
                return Preloader;
            case GameStates.Menu:
                return MainMenu;
            case GameStates.Pause:
                return PauseMenu;
            case GameStates.Gameover:
                return GameOverMenu;
            case GameStates.Play:
                return HUD;
            case GameStates.Countdown:   // ←
                return Countdown;
        };
    });

    let loop: ReturnType<typeof GameLoop>;
    let soundManager: SoundManager;

    onMounted(() => {
        const scene = getScene();
        const camera = getCamera();
        const composer = getComposer();

        // game init
        game.init(scene);

        // camera system init
        CameraSystem.initialize(camera);

        // audio settings
        soundManager = SoundManager.getInstance();
        soundManager.initialize(camera);

        // main loop initialize
        const debugCollider = new DebugColliderVisualizer(scene);
        loop = GameLoop(game, composer, debugCollider);
        loop.start();

        gameState.setResetCallback(() => {
            console.log("🔄 FSM reset");

            game.reset();

            const carMesh = game.car.value.mesh;
            if (carMesh) {
                CameraSystem.reset(carMesh.position.clone());
            }

            console.log("✅ Game reset complete");
        });
    });

    onUnmounted(() => {
        loop?.stop();
    });
</script>


<style>
    @font-face {
        font-family: 'vla_shu';
        src: url('./assets/fonts/VlaShu.ttf')
    }

    @font-face {
        font-family: 'jost';
        src: url('./assets/fonts/Jost-Light.ttf')
    }

    html,
    body,
    #app {
        margin: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        font-size: 0.833vw;
    }
    
    img {
        pointer-events: none;
    }

    button, input, label, span {
        user-select: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
    }

    .three-root {
        width: 100%;
        height: 100%;
    }

    .menu_layout {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;

        gap: -10rem;

        width: 100%;
        max-width: 900px;
        padding: 2rem;
    }

    .background {
        /* position: absolute; */
        /* left: 0; */
        /* width: 100%; */
        /* height: 200%; */
        background: linear-gradient(to bottom,
                #000000 0%,
                /* Черный цвет вверху */
                #000000bb 100%,
                /* Черный цвет до середины */
                rgba(204, 183, 183, 0) 100%
                /* Прозрачность внизу */
            );
    }
</style>