<template>
    <Transition name="game_logo_whole_menu_showing">
        <div v-show="isRightPanelShown" class="rights_group">
            <span>{{ APP_NAME }} v{{ APP_VERSION }}</span>
            <span>© {{ CURRENT_YEAR }} {{ randomRightsPhrase }}</span>
        </div>
    </Transition>
</template>


<script setup lang="ts">
    import { ref, computed, watch } from "vue";
    import { useGameState } from "@/store/gameState";
    import { GameStates } from "@/game/core/GameState";
    import { createNewText } from '@/helpers/functions';

    import { APP_VERSION, APP_NAME, CURRENT_YEAR} from "@/gameConfig";

    const gameState = useGameState();
    const isRightPanelShown = ref(true);
    const foo = createNewText();

    // получаем рандомную фразу "Все права защищены" в нужном переводе
    const randomRightsPhrase = computed(() => {
        return foo.getRandomFromArray('rightsList');
    });

    // ===== STATE MACHINE =====
    // (сценарии работы с логотипом)
    watch(
        () => gameState.currentState,
        (state, _) => {
            switch (state) {

                // ===== PRELOADER =====
                case GameStates.Preloader:
                    isRightPanelShown.value = false;
                    break;

                // ===== MENU =====
                case GameStates.Menu:
                    setTimeout(() => {
                        isRightPanelShown.value = true;                   
                    }, 400);
                    break;

                // ===== START GAME =====
                case GameStates.Countdown:
                case GameStates.Play:
                    // стартуем гонку
                    setTimeout(() => {
                        isRightPanelShown.value = false;
                    }, 400);
                    break;
            }
        },
        { immediate: true }
    );
</script>


<style lang='scss' scoped>
    @use "@/styles/menu.scss";
    @use "@/styles/animations.scss";
    
    .rights_group {
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
        z-index: 2000;
        font-family: 'jost';
        letter-spacing: 0.05rem;
    }
</style>