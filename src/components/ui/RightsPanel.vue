<template>
    <Transition name="rights_panel_showing">
        <div v-show="isRightPanelShown" class="rights_root">
            <span>{{ APP_NAME }} v{{ APP_VERSION }}</span>
            <span>© {{ CURRENT_YEAR }} {{ randomRightsPhrase }}</span>
        </div>
    </Transition>
</template>


<script setup lang="ts">
    import { computed } from "vue";
    import { useGameState } from "@/store/gameState";
    import { GameStates } from "@/game/core/GameState";
    import { createNewText } from '@/helpers/functions';

    import { APP_VERSION, APP_NAME, CURRENT_YEAR} from "@/gameConfig";

    const gameState = useGameState();
    const foo = createNewText();
    const isRightPanelShown = computed(() => {
        return gameState.currentState === GameStates.Menu && gameState.activeOverlay === null;
    });

    // получаем рандомную фразу "Все права защищены" в нужном переводе
    const randomRightsPhrase = computed(() => {
        return foo.getRandomFromArray('rightsList');
    });
</script>


<style lang='scss' scoped>
    @use "@/styles/menu.scss" as *;
    
    .rights_root {
        position: absolute;
        bottom: 1.875rem;
        left: 2.5rem;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: flex-end;
        color: white;
        opacity: 0.65;
        font-size: 0.75rem;
        font-family: 'jost-light';
        letter-spacing: 0.05rem;
        z-index: z("rights_and_logo");
    }

    .rights_panel_showing-enter-active, .rights_panel_showing-leave-active {
        transition: all ease-in-out 0.5s;
    }
    .rights_panel_showing-enter-from, .rights_panel_showing-leave-to {
        opacity: 0;
    }
</style>
