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
    import { ref, watch } from "vue";
    import { useGameState } from "@/store/gameState";
    import { GameStates } from "@/game/core/GameState";

    import { TEAM_NAME} from "@/gameConfig";

    const gameState = useGameState();
    const isRightPanelShown = ref(true);

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

    // разделяем название команды на два слова
    function getTeamNamePart(number_) {
        const words = TEAM_NAME.split(' ')
        return words[number_];
    };

    // клик по лого команды
    function rightsClickingAction() {
        console.log('asd');
    };
</script>


<style lang='scss' scoped>
    @use "@/styles/menu.scss" as *;
    
    .team_logo_group {
        position: absolute;
        bottom: 1.875rem;
        right: 2.5rem;
        display: flex;
        align-items: flex-end;
        justify-content: flex-end;
        z-index: z("rights_and_logo");

        font-family: 'jost';
        letter-spacing: 0.05rem;
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
        width: 3.25rem;
        opacity: 0.7;
        transition: all 0.15s ease-in-out;
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
        color: white;
        margin-right: 0.4rem;
    }
    .team {
        color: #F49B00;
        margin-top: -0.15rem;
    }

    .team_logo_showing-enter-active, .team_logo_showing-leave-active {
        transition: all ease-in-out 0.5s;
    }
    .team_logo_showing-enter-from, .team_logo_showing-leave-to {
        opacity: 0;
    }
</style>