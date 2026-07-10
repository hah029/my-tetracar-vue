<template>
    <Transition name="rights_panel_showing">
        <div v-show="isRightPanelShown" class="rights_root">
            <DeviceInfo />
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
    import DeviceInfo from '@/components/ui/DeviceInfo.vue';

    import { APP_VERSION, APP_NAME, CURRENT_YEAR} from "@/gameConfig";

    const gameState = useGameState();
    const foo = createNewText();
    const isRightPanelShown = computed(() => {
        return gameState.currentState === GameStates.Menu;
    });

    // получаем рандомную фразу "Все права защищены" в нужном переводе
    const randomRightsPhrase = computed(() => {
        return foo.getRandomFromArray('rightsList');
    });
</script>


<style lang='scss' scoped>
    @use "@/styles/menu.scss" as *;
    @use "@/styles/typography" as *;
    @use "@/styles/colors" as *;
    
    .rights_root {
        position: absolute;

        // #region - bottom and left
        bottom: 5.13vh;     // позже расчитать (для мини-мобил)
        left: 5.98vh;      // позже расчитать (для мини-мобил)

        @media (min-width: $breakpoint-mobile) and (orientation: landscape) { 
            bottom: 5.13vh;
            left: 5.98vh;
        }
        // позже расчитать:
        // @media (min-width: $breakpoint-tablet) and (orientation: landscape) { 
            // bottom: 1.875rem;
            // left: 2.5rem;
        // }  
        // @media (min-width: $breakpoint-laptop) and (orientation: landscape) { 
            // bottom: 1.875rem;
            // left: 2.5rem;
        // }
        @media (min-width: $breakpoint-desktop) and (orientation: landscape) {
            bottom: 1.875rem;
            left: 2.5rem;
        }
        // #endregion

        display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: flex-end;
        opacity: 0.55;
        
        @include text-copyright;
        color: $color_white;

        z-index: z("rights_and_logo");
    }

    .rights_panel_showing-enter-active, .rights_panel_showing-leave-active {
        transition: all ease-in-out 0.5s;
    }
    .rights_panel_showing-enter-from, .rights_panel_showing-leave-to {
        opacity: 0;
    }
</style>
