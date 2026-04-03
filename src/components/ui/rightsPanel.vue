<template>
    <Transition name="game_logo_whole_menu_showing">
        <div v-show="isRightPanelShown" class="rights_overlay">

            <div class="rights_and_logo">
                <div class="rights_group">
                    <span>TetroCar v0.0.1</span>
                    <span>© 2026 Все права под неоновой защитой</span>
                </div>
                <div @click="rightsClickingAction()" class="team_logo_group">
                    <div class="team_name_text_group">
                        <span class="wicked">wicked</span>
                        <span class="team">team</span>
                    </div>
                    <div class="logo_container">
                        <img class='logo_img' src="@/assets/images/logo_wicked_team.svg">
                    </div>
                </div>
            </div>

        </div>
    </Transition>
</template>


<script setup lang="ts">
    import { ref, watch } from "vue";
    import { useGameState } from "@/store/gameState";
    import { GameStates } from "@/game/core/GameState";

    // подключаем store
    const gameState = useGameState();

    // ===== UI STATE =====
    const isRightPanelShown = ref(true);

    // клик по лого команды
    function rightsClickingAction() {
        console.log('asd');
    };

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
    
    // #region - общее
        .rights_overlay {
            position: relative;
            width: 100%;
            display: flex;
            justify-content: center;
        }     

        .rights_and_logo {
            position: absolute;
            bottom: 0%;
            width: 95.8%;
            height: max-content;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            padding-bottom: 1.875rem;
            font-family: 'jost';
            letter-spacing: 0.05rem;
        }

        .rights_group {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            justify-content: flex-end;
            color: white;
            opacity: 0.65;
            font-size: 0.75rem;
            z-index: 2000;
        }
    // #endregion

    // #region - область с лого
        .team_logo_group {
            position: relative;
            display: flex;
            align-items: flex-end;
            justify-content: flex-end;
            z-index: 2000;
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
            opacity: 0.65;
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
            opacity: 0.85;
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
    // #endregion
</style>