<template>
    <Transition name="team_logo_showing">
        <div v-show="isRightPanelShown" @click="rightsClickingAction()" class="team_logo_group">
            <div class="team_name_text_group">
                <span class="wicked">{{ getTeamNamePart(0) }}</span>
                <span class="team">{{ getTeamNamePart(1) }}</span>
            </div>
            <div class="logo_container">
                <img class='logo_img' src="@/assets/images/logo_wicked_team.svg">
            </div>
        </div>
    </Transition>
</template>


<script setup lang="ts">
    import { computed } from "vue";
    import { useGameState } from "@/store/gameState";
    import { GameStates } from "@/game/core/GameState";
    import { TEAM_NAME } from "@/gameConfig";

    const gameState = useGameState();

    const isRightPanelShown = computed(() => {
        return gameState.currentState === GameStates.Menu;
    });

    // разделяем название команды на два слова
    function getTeamNamePart(number_) {
        const words = TEAM_NAME.split(' ')
        return words[number_];
    };

    // клик по лого команды
    function rightsClickingAction() {
        gameState.settingsSection = null;
        setTimeout(() => {
            gameState.setSettingsSection('about');
        }, 50);
    };
</script>


<style lang='scss' scoped>
    @use "@/styles/menu.scss" as *;
    @use "@/styles/typography" as *;
    @use "@/styles/colors" as *;

    .team_logo_group {
        position: absolute;

        // #region - bottom and right
        bottom: 5.13vh;     // позже расчитать (для мини-мобил)
        right: 5.98vh;      // позже расчитать (для мини-мобил)

        @media (min-width: $breakpoint-mobile) and (orientation: landscape) { 
            bottom: 5.13vh;
            right: 5.98vh;
        }
        // позже расчитать:
        // @media (min-width: $breakpoint-tablet) and (orientation: landscape) { 
            // bottom: 1.875rem;
            // right: 2.5rem;
        // }  
        // @media (min-width: $breakpoint-laptop) and (orientation: landscape) { 
            // bottom: 1.875rem;
            // right: 2.5rem;
        // }
        @media (min-width: $breakpoint-desktop) and (orientation: landscape) {
            bottom: 1.875rem;
            right: 2.5rem;
        }
        // #endregion
        
        display: flex;
        align-items: flex-end;
        justify-content: flex-end;
        
        z-index: z("rights_and_logo");
        cursor: pointer;

        &:hover .logo_container {
            opacity: 1;
            transition: all 0.15s ease-in-out;
        }

        &:hover .team_name_text_group {
            opacity: 1;
            transition: all 0.15s ease-in-out;
        }
    }

    .logo_container {
        opacity: 0.6;
        transition: all 0.15s ease-in-out;

        // #region - width
        width: 8.2vh; // позже расчитать (для мини-мобил)
        @media (min-width: $breakpoint-mobile) and (orientation: landscape) { 
            margin-top: 8.2vh;
        }
        // позже расчитать:
        // @media (min-width: $breakpoint-tablet) and (orientation: landscape) { 
        //     width: 5.56vh; 
        // }  
        // @media (min-width: $breakpoint-laptop) and (orientation: landscape) { 
        //     width: 5.56vh; 
        // }
        @media (min-width: $breakpoint-desktop) and (orientation: landscape) {
            width: 3rem;
        }
        // #endregion
    }

    .logo_img {
        width: 112%;
        shape-rendering: geometricPrecision;
    }

    .team_name_text_group {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        justify-content: flex-end;
        text-transform: uppercase;
        opacity: 0.7;
        font-size: 0.875rem;
        transition: all 0.15s ease-in-out;
        margin-bottom: 0.3rem;
    }

    .wicked {
        @include text-team-logo;
        color: $color_white;
        margin-right: 0.4rem;
    }

    .team {
        @include text-team-logo;
        color: $color_orange;

        // #region - margin-top
        margin-top: 0.1vh; // позже расчитать (для мини-мобил)

        @media (min-width: $breakpoint-mobile) and (orientation: landscape) { 
            margin-top: 0.1vh;
        }
        // позже расчитать:
        // @media (min-width: $breakpoint-tablet) and (orientation: landscape) { 
        //     margin-top: 12.8125rem;
        // }  
        // @media (min-width: $breakpoint-laptop) and (orientation: landscape) { 
        //     margin-top: 12.8125rem;
        // }
        @media (min-width: $breakpoint-desktop) and (orientation: landscape) {
            margin-top: -0.15rem;
        }
        // #endregion
    }

    .team_logo_showing-enter-active,
    .team_logo_showing-leave-active {
        transition: all ease-in-out 0.5s;
    }

    .team_logo_showing-enter-from,
    .team_logo_showing-leave-to {
        opacity: 0;
    }
</style>
