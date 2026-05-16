<template>
    <!-- <div class="container correction"> -->
    <div class="container" :class="setContainerPos()">
        <div class="leaderboards_container">

            <!-- HEADER -->
            <Transition :name="gameState.currentState == 'menu' ? 'header_footer_block_anim' : ''">
                <div v-if="isHeaderShown" class="header_block">
                    <div class="header_text" :class="setHeaderSize()">{{ dynamicTitleName }}</div>
                    <!-- <div class="header_text" :class="setHeaderSize()">Рекорды</div> -->
                    <div class="header_image">
                        <img class="image" src="@/assets/images/title_line_image.svg" />
                    </div>

                    <div class="tabs">
                        <div class="menu_btn btn_font_size_26" @click="currentView = SettingsView.MyLeaderBoard">{{
                            foo.makeText("leaderboards.tabList.myBoard",
                                'leftLine') }}</div>
                        <div class="cube_divider">
                            <img class="image" src="@/assets/images/cube_divider.svg" />
                        </div>
                        <div class="menu_btn btn_font_size_26" @click="currentView = SettingsView.CommonLeaderBoard">{{
                            foo.makeText("leaderboards.tabList.topBoard",
                                'rightLine') }}</div>
                    </div>

                </div>
            </Transition>

            <!-- CONTENT -->
            <TransitionGroup name="buttons_group_showing" tag="div" class="buttons_group group_correction">
                <button v-for="(record, index) in leaderBoard" :key="record.player.uniqueId ?? record.rank"
                    class="menu_btn btn_font_size_30" :style="{ animationDelay: `${index * 0.06}s` }">
                    {{ record.rank }} - {{ record.player.publicName }} - {{ record.score }}
                </button>
            </TransitionGroup>

            <!-- BACK -->
            <Transition name="header_footer_block_anim">
                <button v-if="isBackButtonShown" class="menu_btn btn_font_size_30" @click="backButtonClick">
                    {{ foo.makeText("mainMenu.goBack") }}
                </button>
            </Transition>

        </div>
    </div>
</template>


<script setup lang="ts">
import { onMounted, onUpdated, computed, ref } from "vue";
import { createNewText } from '@/helpers/functions';
import { useGameState } from "@/store/gameState";

import { Platform } from "@/sdk/Platform";
import type { LeaderBoard, LeaderBoardRecord } from "@/sdk/IGamePlatform";

enum SettingsView {
    MyLeaderBoard,
    CommonLeaderBoard,
    null,
}

// ===== STORES =====
const gameState = useGameState();

// ===== LOCAL STATE =====
// const currentView = ref<SettingsView>(SettingsView.Main);
const currentView = ref<SettingsView>(SettingsView.MyLeaderBoard);

const isHeaderShown = ref(false);
const isBackButtonShown = ref(false);

// ===== TEXT =====
const foo = createNewText();

// ===== TITLE =====
const dynamicTitleName = computed(() => {
    return foo.makeText("leaderboards.title", "empty");
});
const myLeaderBoard = ref<LeaderBoardRecord[]>([])
const commonLeaderBoard = ref<LeaderBoardRecord[]>([])

const leaderBoard = computed(() => {
    switch (currentView.value) {
        case SettingsView.MyLeaderBoard:
            console.log("set myLeaderBoard")
            return myLeaderBoard.value;
        case SettingsView.CommonLeaderBoard:
            console.log("set commonLeaderBoard")
            return commonLeaderBoard.value;
        default:
            return myLeaderBoard.value;
    }
})

// ===== BACK =====
function backButtonClick() {
    if (gameState.currentState == 'menu') {
        isHeaderShown.value = false;
    };
    setTimeout(() => {
        currentView.value = SettingsView.null;
    }, 100);
    setTimeout(() => {
        isBackButtonShown.value = false;
    }, 400);

    setTimeout(() => {
        gameState.closeOverlay();
    }, 500);
};

function setContainerPos() {
    if (gameState.currentState == 'menu') {
        return 'container_pos_main_menu';
    } else if (gameState.currentState == 'pause') {
        return 'container_pos_pause';
    };
};
function setHeaderSize() {
    if (gameState.currentState == 'pause') {
        return 'header_pause';
    };
};

onMounted(() => {
    Platform.getInstance().getLeaderboardEntries("debugLeaderboard1", 5, true, 1)
        .then((lboard: LeaderBoard) => myLeaderBoard.value = lboard.entries)
    Platform.getInstance().getLeaderboardEntries("debugLeaderboard1", 5, false, 1)
        .then((lboard: LeaderBoard) => commonLeaderBoard.value = lboard.entries)

    isHeaderShown.value = true;
    setTimeout(() => {
        currentView.value = SettingsView.MyLeaderBoard;
    }, 200);
    setTimeout(() => {
        isBackButtonShown.value = true;
    }, 500);
});

onUpdated(() => {
    Platform.getInstance().getLeaderboardEntries("debugLeaderboard1", 5, true, 1)
        .then((lboard: LeaderBoard) => myLeaderBoard.value = lboard.entries)
    Platform.getInstance().getLeaderboardEntries("debugLeaderboard1", 5, false, 1)
        .then((lboard: LeaderBoard) => commonLeaderBoard.value = lboard.entries)
})
</script>


<style scoped lang="scss">
@use "@/styles/menu.scss";
@use "@/styles/animations.scss";

.tabs {
    position: relative;
    width: 34.625rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 0.75rem;
    line-height: 1;
}

.cube_divider {
    position: absolute;
    left: 16.8366rem;
    width: 0.9375rem;
    display: flex;
    align-items: center;
}

.container_pos_main_menu {
    justify-content: flex-end !important;
}

.container_pos_pause {
    justify-content: flex-start !important;
    top: 19.75rem !important;
}

.header_pause {
    font-size: 3.125rem; // (50px)
}

.leaderboards_container {
    position: relative;
    height: 33.375rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    box-sizing: border-box;
    padding-bottom: 2.687rem;
}

.group_correction {
    top: 10rem;

    &>*+* {
        margin-top: 0.938rem; // 15px - row-gap (между кнопками)

    }
}

.btn_font_size_30 {
    font-size: 1.875rem; // (30px)
    cursor: default;
}

.btn_font_size_26 {
    font-size: 1.625rem; // (26px)
}

/* we will explain what these classes do next! */
// .v-enter-active {
//     transition: opacity 0.5s ease;
// }

// .v-enter-from,
// .v-leave-to {
//     opacity: 1;
// }
</style>